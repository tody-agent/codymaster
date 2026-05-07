import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import {
  addLearning,
  listLearnings,
  pruneLearnings,
  type LearningType,
} from '../../learnings';

const VALID_TYPES: LearningType[] = ['pitfall', 'preference', 'pattern', 'fact'];

function resolveProject(opts: { project?: string }): string {
  return path.resolve(opts.project ?? process.cwd());
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
        default:
          console.error(chalk.red(`Unknown subcommand: ${cmd}`));
          console.log(chalk.dim('Available: add, list, prune'));
          process.exitCode = 1;
      }
    });
}
