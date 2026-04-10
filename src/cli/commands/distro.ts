import { Command } from 'commander';
import chalk from 'chalk';
import { validateSkillPackDir } from '../../distro-validate';

export function registerDistroCommands(program: Command): void {
  const distro = program.command('distro').description('Skill pack validation (ecosystem roadmap)');

  distro
    .command('validate')
    .description('Validate a skill directory (SKILL.md / tmpl + optional meta.json)')
    .argument('<dir>', 'path to skill folder')
    .action((dir: string) => {
      const r = validateSkillPackDir(dir);
      for (const w of r.warnings) console.log(chalk.yellow('warning:'), w);
      for (const e of r.errors) console.error(chalk.red('error:'), e);
      if (!r.ok) process.exit(1);
      console.log(chalk.green('OK'), dir);
    });
}
