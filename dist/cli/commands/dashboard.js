"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDashboardCommands = registerDashboardCommands;
const fs_1 = __importDefault(require("fs"));
const dashboard_1 = require("../../dashboard");
const data_1 = require("../../data");
const theme_1 = require("../../ui/theme");
const box_1 = require("../../ui/box");
const cli_utils_1 = require("../../utils/cli-utils");
function registerDashboardCommands(program) {
    program
        .command('dashboard [cmd]')
        .alias('dash')
        .description('Dashboard server (start|stop|status|open|tail)')
        .option('-p, --port <port>', 'Port number', String(data_1.DEFAULT_PORT))
        .action((cmd, opts) => {
        const port = parseInt(opts.port) || data_1.DEFAULT_PORT;
        switch (cmd) {
            case 'start':
            case undefined:
                if (isDashboardRunning()) {
                    console.log((0, box_1.renderResult)('warning', 'Dashboard already running.', [`${(0, theme_1.dim)('URL:')} ${(0, theme_1.brand)(`http://localhost:${port}`)}`]));
                    return;
                }
                (0, dashboard_1.launchDashboard)(port);
                break;
            case 'stop':
                stopDashboard();
                break;
            case 'status':
                dashboardStatus(port);
                break;
            case 'open':
                console.log((0, box_1.renderResult)('info', `Opening http://localhost:${port} ...`));
                (0, cli_utils_1.openUrl)(`http://localhost:${port}`);
                break;
            case 'url':
                console.log(`http://localhost:${port}`);
                break;
            case 'tail':
                tailDashboard(port);
                break;
            default: console.log((0, box_1.renderResult)('error', `Unknown: ${cmd}`, [(0, theme_1.dim)('Available: start, stop, status, open, url, tail')]));
        }
    });
}
function tailDashboard(port) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const chalk = require('chalk');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const WebSocket = require('ws');
    const url = `ws://127.0.0.1:${port}/ws`;
    console.log((0, theme_1.dim)(`Connecting to ${url} ...`));
    let ws;
    try {
        ws = new WebSocket(url);
    }
    catch (err) {
        console.log((0, box_1.renderResult)('error', `Cannot connect: ${err.message}`, [(0, theme_1.dim)('Is the dashboard running? cm dashboard start')]));
        process.exit(1);
    }
    ws.on('open', () => {
        console.log((0, theme_1.brand)('✓ Connected — listening for all events. Ctrl+C to stop.\n'));
        // Subscribe to all projects (no filter)
        ws.send(JSON.stringify({ action: 'unsubscribe' }));
    });
    ws.on('message', (raw) => {
        var _a, _b;
        try {
            const msg = JSON.parse(raw.toString());
            if (msg.type === 'subscribed' || msg.type === 'unsubscribed')
                return;
            const ts = new Date().toLocaleTimeString();
            const prefix = chalk.gray(`[${ts}]`);
            if (msg.type && msg.type.startsWith('task.')) {
                const typeColor = msg.type === 'task.created' ? chalk.green
                    : msg.type === 'task.deleted' ? chalk.red
                        : msg.type === 'task.transitioned' ? chalk.yellow
                            : chalk.cyan;
                console.log(`${prefix} ${typeColor(msg.type.padEnd(20))} task=${chalk.white(((_a = msg.taskId) === null || _a === void 0 ? void 0 : _a.substring(0, 8)) || '?')} project=${chalk.gray(((_b = msg.projectId) === null || _b === void 0 ? void 0 : _b.substring(0, 8)) || '?')}`);
                if (msg.data) {
                    if (msg.data.from && msg.data.to) {
                        console.log(`${chalk.gray('  └─')} ${msg.data.from} → ${msg.data.to}`);
                    }
                    else if (msg.data.title) {
                        console.log(`${chalk.gray('  └─')} ${msg.data.title}`);
                    }
                }
            }
            else if (msg.type === 'activity.added') {
                const a = msg.activity || {};
                console.log(`${prefix} ${chalk.magenta('activity.added'.padEnd(20))} ${a.type || '?'}: ${chalk.white(a.message || '')}`);
            }
            else if (msg.type === 'agent.heartbeat') {
                console.log(`${prefix} ${chalk.blue('agent.heartbeat'.padEnd(20))} tasks=${(msg.runningTaskIds || []).length}`);
            }
            else {
                console.log(`${prefix} ${chalk.gray(JSON.stringify(msg).substring(0, 120))}`);
            }
        }
        catch (_c) {
            // ignore parse errors
        }
    });
    ws.on('error', (err) => {
        console.log((0, box_1.renderResult)('error', `WebSocket error: ${err.message}`));
    });
    ws.on('close', () => {
        console.log((0, box_1.renderResult)('warning', 'Connection closed.'));
        process.exit(0);
    });
    process.on('SIGINT', () => {
        console.log((0, theme_1.dim)('\nStopped.'));
        ws.close();
        process.exit(0);
    });
}
function isDashboardRunning() {
    try {
        if (!fs_1.default.existsSync(data_1.PID_FILE))
            return false;
        const pid = parseInt(fs_1.default.readFileSync(data_1.PID_FILE, 'utf-8').trim());
        process.kill(pid, 0);
        return true;
    }
    catch (_a) {
        try {
            fs_1.default.unlinkSync(data_1.PID_FILE);
        }
        catch (_b) { }
        return false;
    }
}
function stopDashboard() {
    try {
        if (!fs_1.default.existsSync(data_1.PID_FILE)) {
            console.log((0, box_1.renderResult)('warning', 'No dashboard running.'));
            return;
        }
        const pid = parseInt(fs_1.default.readFileSync(data_1.PID_FILE, 'utf-8').trim());
        process.kill(pid, 'SIGTERM');
        try {
            fs_1.default.unlinkSync(data_1.PID_FILE);
        }
        catch (_a) { }
        console.log((0, box_1.renderResult)('success', `Dashboard stopped (PID ${pid}).`));
    }
    catch (err) {
        console.log((0, box_1.renderResult)('error', `Failed to stop: ${err.message}`));
        try {
            fs_1.default.unlinkSync(data_1.PID_FILE);
        }
        catch (_b) { }
    }
}
function dashboardStatus(port) {
    if (isDashboardRunning()) {
        const pid = fs_1.default.readFileSync(data_1.PID_FILE, 'utf-8').trim();
        console.log((0, box_1.renderResult)('success', 'Dashboard RUNNING', [`${(0, theme_1.dim)('PID:')} ${(0, theme_1.brand)(pid)}`, `${(0, theme_1.dim)('URL:')} ${(0, theme_1.brand)(`http://localhost:${port}`)}`]));
    }
    else {
        console.log((0, box_1.renderResult)('warning', 'Dashboard NOT running', [(0, theme_1.dim)('Start with: cm dashboard start')]));
    }
}
