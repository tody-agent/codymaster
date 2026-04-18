import { Command } from 'commander';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import chalk from 'chalk';

export function registerMcpServeCommands(program: Command): void {
  program
    .command('mcp-serve')
    .description('Start CodyMaster MCP context server (stdio transport for Goose, Claude Desktop, etc.)')
    .option('--project <path>', 'Project root directory (default: current working directory)')
    .option('--print-config', 'Print Goose/Claude Desktop JSON config snippet and exit')
    .option('--install-claude', 'Auto-install MCP servers into Claude Desktop / Cowork config')
    .action((opts: { project?: string; printConfig?: boolean; installClaude?: boolean }) => {
      const projectPath = path.resolve(opts.project ?? process.cwd());

      if (opts.installClaude) {
        let configPath = '';
        if (process.platform === 'win32') {
          configPath = path.join(process.env.APPDATA || '', 'Claude', 'claude_desktop_config.json');
        } else if (process.platform === 'darwin') {
          configPath = path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
        } else {
          console.error(chalk.red('Auto-install is currently only supported on Windows and macOS.'));
          process.exit(1);
        }

        let config: any = {};
        if (fs.existsSync(configPath)) {
          try {
            config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          } catch (e: any) {
            console.error(chalk.red(`Failed to parse ${configPath}: ${e.message}`));
            process.exit(1);
          }
        }

        if (!config.mcpServers) config.mcpServers = {};

        const serverPath = path.join(__dirname, '..', '..', '..', 'dist', 'mcp-context-server.js');
        const dashboardPath = path.join(__dirname, '..', '..', '..', 'scripts', 'mcp-bridge.js');

        config.mcpServers['cm-context'] = {
          command: process.execPath,
          args: [serverPath, '--project', projectPath],
          env: { 'CM_PROJECT_PATH': projectPath }
        };

        config.mcpServers['cm-dashboard'] = {
          command: process.execPath,
          args: [dashboardPath]
        };

        const configDir = path.dirname(configPath);
        if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });

        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
        console.log(chalk.green(`🎉 Installed successfully into Claude Desktop: ${configPath}`));
        process.exit(0);
      }

      if (opts.printConfig) {
        const gooseConfig = {
          id: 'codymaster',
          name: 'CodyMaster Intelligence Layer',
          type: 'stdio',
          cmd: 'npx',
          args: ['codymaster', 'mcp-serve', '--project', projectPath],
        };
        const claudeConfig = {
          mcpServers: {
            'cm-context': {
              command: process.execPath,
              args: [
                path.join(__dirname, '..', '..', '..', 'dist', 'mcp-context-server.js'),
                '--project',
                projectPath,
              ],
            },
          },
        };
        console.log(chalk.bold('\nGoose config (add to ~/.config/goose/config.yaml extensions):'));
        console.log(JSON.stringify(gooseConfig, null, 2));
        console.log(chalk.bold('\nClaude Desktop config (add to mcpServers in claude_desktop_config.json):'));
        console.log(JSON.stringify(claudeConfig.mcpServers, null, 2));
        process.exit(0);
      }

      const serverPath = path.join(__dirname, '..', '..', '..', 'dist', 'mcp-context-server.js');

      if (!fs.existsSync(serverPath)) {
        console.error(chalk.red(`Error: MCP server not found at ${serverPath}`));
        console.error(chalk.yellow('Run `npm run build` first to compile the server.'));
        process.exit(1);
      }

      console.error(chalk.dim(`[CodyMaster] Starting MCP server for project: ${projectPath}`));

      const child = spawn(process.execPath, [serverPath, '--project', projectPath], {
        stdio: 'inherit',
      });

      child.on('exit', (code) => process.exit(code ?? 0));
      process.on('SIGINT',  () => child.kill('SIGINT'));
      process.on('SIGTERM', () => child.kill('SIGTERM'));
    });
}
