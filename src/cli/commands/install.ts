import { Command } from 'commander';
import chalk from 'chalk';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { detectPlatforms, installToPlatform, installToMany, listPlatforms } from '../../install/engine';
import { isValidProfile } from '../../install/profiles';
import { Profile, Scope } from '../../install/types';

const repoRoot = path.join(__dirname, '..', '..', '..');

export function registerInstallCommands(program: Command) {
  program
    .command('install [platform]')
    .description('Install CodyMaster skills to an AI coding platform')
    .option('-p, --profile <name>', 'Skill profile: core | growth | design | knowledge | full', 'full')
    .option('-s, --scope <scope>', 'Install scope for platforms that support it: user | project', 'user')
    .option('--all', 'Install to every detected platform')
    .option('--list', 'List supported platforms and exit')
    .option('--sync', 'Sync skills to all platforms after install')
    .option('--dry-run', 'Show what would change without writing any files')
    .action(async (platform, opts) => {
      if (opts.list) return printPlatforms();
      const profile = String(opts.profile);
      if (!isValidProfile(profile)) {
        console.error(chalk.red(`Invalid profile: ${profile}`));
        console.error(chalk.dim('Valid: core, growth, design, knowledge, full'));
        process.exit(1);
      }
      if (opts.scope !== 'user' && opts.scope !== 'project') {
        console.error(chalk.red(`Invalid scope: ${opts.scope} (expected user|project)`));
        process.exit(1);
      }
      const installOpts = {
        profile: profile as Profile,
        scope: opts.scope as Scope,
        dryRun: !!opts.dryRun,
      };

      let targets: string[];
      if (opts.all) {
        targets = detectPlatforms()
          .filter((p) => p.installed)
          .map((p) => p.platform.id);
        if (targets.length === 0) {
          console.error(chalk.red('No installed AI platforms detected.'));
          console.error(chalk.dim("Pass a platform id explicitly: cm install claude-code"));
          process.exit(1);
        }
      } else if (platform) {
        targets = [platform];
      } else {
        printPlatforms();
        console.log(chalk.dim('\nUsage: cm install <platform> [--profile core] [--scope user|project]'));
        return;
      }

      console.log(chalk.bold(`\nInstalling profile=${profile} scope=${opts.scope}${opts.dryRun ? ' (dry-run)' : ''}`));
      const results = await installToMany(targets, installOpts);
      for (const r of results) {
        console.log('');
        console.log(chalk.bold.magenta(`  ${r.platform}`));
        console.log(chalk.dim(`  → ${r.targetPath}`));
        console.log(chalk.green(`  ✓ ${r.installed.length} skills installed`) + chalk.dim(` (${r.skipped.length} skipped)`));
        for (const h of r.postInstallHints) console.log(chalk.cyan(`  ℹ  ${h}`));
      }

      // Auto-sync if --sync flag or --all flag
      if ((opts.sync || opts.all) && !opts.dryRun) {
        console.log(chalk.bold('\n  Syncing skills to all platforms...'));
        try {
          execSync('node scripts/build-skills.mjs --all-platforms', {
            stdio: 'inherit',
            cwd: repoRoot,
            timeout: 60000,
          });
          console.log(chalk.green('  ✅ Skills synced to all platforms'));
        } catch (error) {
          console.log(chalk.yellow('  ⚠️  Sync failed (run `cm update --sync` manually)'));
        }
      }

      console.log('');
    });

  // ─── Doctor Command ─────────────────────────────────────────
  program
    .command('doctor')
    .description('Check which AI platforms are installed and which have CodyMaster skills')
    .option('--sync-check', 'Check skill sync status across platforms')
    .action((opts) => {
      console.log(chalk.bold('\nDetected platforms:\n'));
      for (const d of detectPlatforms()) {
        const mark = d.installed ? chalk.green('●') : chalk.dim('○');
        const detail = d.detail ? chalk.dim(`  (${d.detail})`) : '';
        console.log(`  ${mark} ${d.platform.emoji}  ${d.platform.name}${detail}`);
      }

      // Sync check
      if (opts.syncCheck) {
        console.log(chalk.bold('\n  Sync Status:\n'));
        checkSyncStatus();
      }

      console.log('');
    });
}

function checkSyncStatus(): void {
  const platforms = [
    { name: 'claude-code', dir: '.claude/skills' },
    { name: 'claude-desktop', dir: '.claude-desktop/skills' },
    { name: 'cursor', dir: '.cursor-plugin/skills' },
    { name: 'windsurf', dir: '.windsurf/skills' },
    { name: 'antigravity', dir: '.gemini/skills' },
    { name: 'codex', dir: '.codex/skills' },
    { name: 'opencode', dir: '.opencode/skills' },
    { name: 'cline', dir: '.cline/skills' },
    { name: 'kiro', dir: '.kiro/skills' },
    { name: 'copilot', dir: '.copilot/skills' },
    { name: 'aider', dir: '.aider/skills' },
    { name: 'continue', dir: '.continue/skills' },
    { name: 'amazon-q', dir: '.amazonq/skills' },
    { name: 'amp', dir: '.amp/skills' },
  ];

  let synced = 0;
  let missing = 0;

  for (const p of platforms) {
    const fullPath = path.join(repoRoot, p.dir);
    const hasShared = fs.existsSync(path.join(fullPath, '_shared', 'helpers.md'));
    
    if (hasShared) {
      synced++;
    } else {
      missing++;
      console.log(chalk.yellow(`    ⚠ ${p.name}: _shared/helpers.md missing`));
    }
  }

  if (missing === 0) {
    console.log(chalk.green(`    ✅ All ${synced} platforms synced`));
  } else {
    console.log(chalk.dim(`    ${synced} synced, ${missing} missing`));
    console.log(chalk.dim('    Run `cm update --sync` to fix.'));
  }
}

function printPlatforms() {
  console.log(chalk.bold('\nSupported platforms:\n'));
  for (const p of listPlatforms()) {
    console.log(`  ${p.emoji}  ${chalk.cyan(p.id.padEnd(16))} ${chalk.dim(p.name)}`);
  }
}
