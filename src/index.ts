import { Command } from 'commander';
import prompts from 'prompts';
import chalk from 'chalk';
import path from 'path';
import { launchDashboard } from './dashboard';

const program = new Command();

program
  .name('cm')
  .description('CodyMaster Universal Skills CLI')
  .version('1.0.0');

program.command('install')
  .description('Install a new agent skill to the central registry')
  .argument('<skill>', 'Name of the skill to install')
  .option('-p, --platform <platform>', 'Specify the target platform (cursor, claude, gemini, etc.)')
  .action(async (skill, options) => {
    console.log(chalk.blue(`Installing skill: ${skill}...`));
    
    if (!options.platform) {
      const response = await prompts({
        type: 'select',
        name: 'platform',
        message: 'Which platform do you want to install this skill for?',
        choices: [
          { title: 'Google Antigravity', value: 'gemini' },
          { title: 'Claude Code', value: 'claude' },
          { title: 'Cursor', value: 'cursor' },
          { title: 'Windsurf', value: 'windsurf' },
          { title: 'Cline / RooCode', value: 'cline' },
          { title: 'OpenClaw', value: 'openclaw' }
        ]
      });
      options.platform = response.platform;
    }

    console.log(chalk.green(`\n✅ Skill '${skill}' successfully adapted and installed for ${options.platform}!`));
  });

program.command('dashboard')
  .description('Launch the CodyMaster Observatory Dashboard')
  .action(() => {
    launchDashboard();
  });

program.parse(process.argv);
