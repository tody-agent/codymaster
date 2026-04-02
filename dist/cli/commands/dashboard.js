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
        .description('Dashboard server (start|stop|status|open)')
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
            default: console.log((0, box_1.renderResult)('error', `Unknown: ${cmd}`, [(0, theme_1.dim)('Available: start, stop, status, open, url')]));
        }
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
