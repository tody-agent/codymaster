/**
 * `cm stack` — detect ecosystems/frameworks and emit .cm/project-skills.md.
 * `cm tier`  — classify project size tier and emit .cm/project-tier.md.
 */

import { Command } from 'commander';
import { detectStack, renderStackMarkdown, writeProjectSkills } from '../../indexer/stack-detect';
import { classifyProject, renderTierMarkdown, writeTierReport } from '../../tier-classify';

export function registerStackCommands(program: Command) {
  const stack = program.command('stack').description('Detect project stack and suggest skills');

  stack
    .command('detect')
    .description('scan the current project and print suggestions')
    .option('--write', 'write report to .cm/project-skills.md')
    .option('--json', 'print raw JSON')
    .action((opts: { write?: boolean; json?: boolean }) => {
      const r = detectStack(process.cwd());
      if (opts.json) {
        process.stdout.write(JSON.stringify(r, null, 2) + '\n');
      } else {
        process.stdout.write(renderStackMarkdown(r));
      }
      if (opts.write) {
        const file = writeProjectSkills(process.cwd(), r);
        process.stdout.write(`\nWrote ${file}\n`);
      }
    });

  const tier = program.command('tier').description('Classify project tier (LITE/STANDARD/PROFESSIONAL/ENTERPRISE)');

  tier
    .command('classify')
    .description('measure and classify the current project')
    .option('--write', 'write report to .cm/project-tier.md')
    .option('--json', 'print raw JSON')
    .action((opts: { write?: boolean; json?: boolean }) => {
      const r = classifyProject(process.cwd());
      if (opts.json) {
        process.stdout.write(JSON.stringify(r, null, 2) + '\n');
      } else {
        process.stdout.write(renderTierMarkdown(r));
      }
      if (opts.write) {
        const file = writeTierReport(process.cwd(), r);
        process.stdout.write(`\nWrote ${file}\n`);
      }
    });
}
