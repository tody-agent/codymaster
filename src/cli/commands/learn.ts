import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { execFileSync } from 'child_process';
import {
  addLearning,
  listLearnings,
  pruneLearnings,
  anonymize,
  mergeLearnings,
  readLearningsFile,
  writeLearningsFile,
  learningsPath,
  type LearningType,
  type Learning,
} from '../../learnings';

const VALID_TYPES: LearningType[] = ['pitfall', 'preference', 'pattern', 'fact'];

function resolveProject(opts: { project?: string }): string {
  return path.resolve(opts.project ?? process.cwd());
}

interface SyncOptions {
  remote: string;
  pullOnly: boolean;
  syncDir?: string;
}

interface SyncResult {
  pulled: number;
  pushed: number;
  localTotal: number;
}

function git(cwd: string, args: string[]): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

export function syncLearnings(projectPath: string, opts: SyncOptions): SyncResult {
  const syncDir =
    opts.syncDir ?? path.join(os.homedir(), '.cm', 'learnings-sync');
  const remoteFile = path.join(syncDir, 'learnings.jsonl');

  if (!fs.existsSync(path.join(syncDir, '.git'))) {
    fs.mkdirSync(path.dirname(syncDir), { recursive: true });
    if (fs.existsSync(syncDir)) {
      // Existing non-git dir — abort rather than wipe.
      throw new Error(`${syncDir} exists but is not a git checkout`);
    }
    git(path.dirname(syncDir), ['clone', opts.remote, path.basename(syncDir)]);
    // Ensure a local identity exists so commits succeed even when the host
    // has no global git config (CI runners, fresh containers).
    try { git(syncDir, ['config', 'user.email', 'cm-learn-sync@codymaster.local']); } catch {}
    try { git(syncDir, ['config', 'user.name', 'cm-learn-sync']); } catch {}
  } else {
    // Make sure we point at the requested remote, then refresh.
    try {
      git(syncDir, ['remote', 'set-url', 'origin', opts.remote]);
    } catch {
      git(syncDir, ['remote', 'add', 'origin', opts.remote]);
    }
    try {
      git(syncDir, ['pull', '--ff-only', 'origin', 'HEAD']);
    } catch {
      // Empty repo / unborn HEAD — ignore; nothing to pull.
    }
  }

  const localFile = learningsPath(projectPath);
  const localBefore = readLearningsFile(localFile);
  const remoteBefore = readLearningsFile(remoteFile);
  const merged = mergeLearnings(localBefore, remoteBefore);

  // Local: write merged set verbatim (keeps full fidelity for the user).
  writeLearningsFile(localFile, merged);
  const pulled = merged.length - localBefore.length;

  if (opts.pullOnly) {
    return { pulled, pushed: 0, localTotal: merged.length };
  }

  // Remote: write anonymized merge.
  const anonMerged: Learning[] = mergeLearnings(
    remoteBefore,
    localBefore.map(anonymize),
  );
  writeLearningsFile(remoteFile, anonMerged);
  const pushed = anonMerged.length - remoteBefore.length;

  if (pushed > 0) {
    git(syncDir, ['add', 'learnings.jsonl']);
    try {
      git(syncDir, ['commit', '-m', `learn: +${pushed} from ${path.basename(projectPath)}`]);
      git(syncDir, ['push', 'origin', 'HEAD']);
    } catch (e: any) {
      // Bubble up so the caller can decide; non-zero pushes left in local mirror are fine.
      throw new Error(`git push failed: ${e.message}`);
    }
  }

  return { pulled, pushed, localTotal: merged.length };
}

export function registerLearnCommands(program: Command): void {
  program
    .command('learn <cmd> [args...]')
    .description('Per-project learnings log (.cm/learnings.jsonl) — gstack-style notes')
    .option('-p, --project <path>', 'Project path (default: cwd)')
    .option('-t, --type <type>', 'pitfall | preference | pattern | fact', 'fact')
    .option('-s, --scope <scope>', 'Scope tag (deploy, ui, test, ...)', 'general')
    .option('--source <source>', 'Origin label (e.g. cm-retro-cli)', 'manual')
    .option('--days <n>', 'For prune: max age in days', '180')
    .option('--limit <n>', 'For list: max rows', '20')
    .option('--filter-type <type>', 'For list: filter by type')
    .option('--filter-scope <scope>', 'For list: filter by scope')
    .option('--remote <url>', 'For sync: git remote URL of the shared learnings repo')
    .option('--pull-only', 'For sync: pull + merge only, do not push back')
    .option('--sync-dir <path>', 'For sync: working dir (default: ~/.cm/learnings-sync)')
    .action((cmd: string, args: string[], opts: any) => {
      const project = resolveProject(opts);
      switch (cmd) {
        case 'add': {
          const note = args.join(' ').trim();
          if (!note) {
            console.error(chalk.red('Usage: cm learn add "<note>"  [--type ... --scope ...]'));
            process.exitCode = 1;
            return;
          }
          if (!VALID_TYPES.includes(opts.type)) {
            console.error(chalk.red(`Invalid --type. Use one of: ${VALID_TYPES.join(', ')}`));
            process.exitCode = 1;
            return;
          }
          try {
            const l = addLearning(project, {
              type: opts.type as LearningType,
              scope: opts.scope,
              note,
              source: opts.source,
            });
            console.log(chalk.green(`✓ Learned [${l.type}/${l.scope}]: ${l.note}`));
          } catch (e: any) {
            console.error(chalk.red(`✗ ${e.message}`));
            process.exitCode = 1;
          }
          return;
        }
        case 'list':
        case 'ls': {
          const items = listLearnings(project, {
            limit: parseInt(opts.limit, 10),
            type: opts.filterType as LearningType | undefined,
            scope: opts.filterScope as string | undefined,
          });
          if (items.length === 0) {
            console.log(chalk.dim('(no learnings yet)'));
            return;
          }
          for (const l of items) {
            const date = l.ts.slice(0, 10);
            console.log(
              `${chalk.gray(date)} ${chalk.cyan(l.type.padEnd(10))} ${chalk.yellow(l.scope.padEnd(12))} ${l.note}`
            );
          }
          console.log(chalk.dim(`\n${items.length} learning(s)`));
          return;
        }
        case 'prune': {
          const days = parseInt(opts.days, 10);
          const n = pruneLearnings(project, days);
          console.log(chalk.green(`✓ Pruned ${n} learning(s) older than ${days} days`));
          return;
        }
        case 'sync': {
          if (!opts.remote) {
            console.error(chalk.red('Usage: cm learn sync --remote <git-url> [--pull-only]'));
            process.exitCode = 1;
            return;
          }
          try {
            const result = syncLearnings(project, {
              remote: opts.remote,
              pullOnly: !!opts.pullOnly,
              syncDir: opts.syncDir,
            });
            console.log(
              chalk.green(
                `✓ sync ok — pulled=${result.pulled} pushed=${result.pushed} local=${result.localTotal}`,
              ),
            );
          } catch (e: any) {
            console.error(chalk.red(`✗ sync failed: ${e.message}`));
            process.exitCode = 1;
          }
          return;
        }
        default:
          console.error(chalk.red(`Unknown subcommand: ${cmd}`));
          console.log(chalk.dim('Available: add, list, prune, sync'));
          process.exitCode = 1;
      }
    });
}
