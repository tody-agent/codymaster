"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerMcpServeCommands = registerMcpServeCommands;
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const chalk_1 = __importDefault(require("chalk"));
function registerMcpServeCommands(program) {
    program
        .command('mcp-serve')
        .description('Start CodyMaster MCP context server (stdio transport for Goose, Claude Desktop, etc.)')
        .option('--project <path>', 'Project root directory (default: current working directory)')
        .option('--print-config', 'Print Goose/Claude Desktop JSON config snippet and exit')
        .option('--install-claude', 'Auto-install MCP servers into Claude Desktop / Cowork config')
        .action((opts) => {
        var _a;
        const projectPath = path_1.default.resolve((_a = opts.project) !== null && _a !== void 0 ? _a : process.cwd());
        if (opts.installClaude) {
            let configPath = '';
            if (process.platform === 'win32') {
                configPath = path_1.default.join(process.env.APPDATA || '', 'Claude', 'claude_desktop_config.json');
            }
            else if (process.platform === 'darwin') {
                configPath = path_1.default.join(os_1.default.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
            }
            else {
                console.error(chalk_1.default.red('Auto-install is currently only supported on Windows and macOS.'));
                process.exit(1);
            }
            let config = {};
            if (fs_1.default.existsSync(configPath)) {
                try {
                    config = JSON.parse(fs_1.default.readFileSync(configPath, 'utf8'));
                }
                catch (e) {
                    console.error(chalk_1.default.red(`Failed to parse ${configPath}: ${e.message}`));
                    process.exit(1);
                }
            }
            if (!config.mcpServers)
                config.mcpServers = {};
            const serverPath = path_1.default.join(__dirname, '..', '..', '..', 'dist', 'mcp-context-server.js');
            const dashboardPath = path_1.default.join(__dirname, '..', '..', '..', 'scripts', 'mcp-bridge.js');
            config.mcpServers['cm-context'] = {
                command: process.execPath,
                args: [serverPath, '--project', projectPath],
                env: { 'CM_PROJECT_PATH': projectPath }
            };
            config.mcpServers['cm-dashboard'] = {
                command: process.execPath,
                args: [dashboardPath]
            };
            const configDir = path_1.default.dirname(configPath);
            if (!fs_1.default.existsSync(configDir))
                fs_1.default.mkdirSync(configDir, { recursive: true });
            fs_1.default.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
            console.log(chalk_1.default.green(`🎉 Installed successfully into Claude Desktop: ${configPath}`));
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
                            path_1.default.join(__dirname, '..', '..', '..', 'dist', 'mcp-context-server.js'),
                            '--project',
                            projectPath,
                        ],
                    },
                },
            };
            console.log(chalk_1.default.bold('\nGoose config (add to ~/.config/goose/config.yaml extensions):'));
            console.log(JSON.stringify(gooseConfig, null, 2));
            console.log(chalk_1.default.bold('\nClaude Desktop config (add to mcpServers in claude_desktop_config.json):'));
            console.log(JSON.stringify(claudeConfig.mcpServers, null, 2));
            process.exit(0);
        }
        const serverPath = path_1.default.join(__dirname, '..', '..', '..', 'dist', 'mcp-context-server.js');
        if (!fs_1.default.existsSync(serverPath)) {
            console.error(chalk_1.default.red(`Error: MCP server not found at ${serverPath}`));
            console.error(chalk_1.default.yellow('Run `npm run build` first to compile the server.'));
            process.exit(1);
        }
        console.error(chalk_1.default.dim(`[CodyMaster] Starting MCP server for project: ${projectPath}`));
        const child = (0, child_process_1.spawn)(process.execPath, [serverPath, '--project', projectPath], {
            stdio: 'inherit',
        });
        child.on('exit', (code) => process.exit(code !== null && code !== void 0 ? code : 0));
        process.on('SIGINT', () => child.kill('SIGINT'));
        process.on('SIGTERM', () => child.kill('SIGTERM'));
    });
}
