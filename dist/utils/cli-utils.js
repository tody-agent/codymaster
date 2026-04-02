"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.padRight = padRight;
exports.openUrl = openUrl;
exports.formatTimeAgoCli = formatTimeAgoCli;
exports.progressBar = progressBar;
exports.isDashboardRunning = isDashboardRunning;
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const child_process_1 = require("child_process");
const chalk_1 = __importDefault(require("chalk"));
/**
 * Pads a string on the right with spaces.
 */
function padRight(str, len) {
    if (str.length >= len)
        return str;
    return str + ' '.repeat(len - str.length);
}
/**
 * Opens a URL in the default browser.
 */
function openUrl(url) {
    const plat = os_1.default.platform();
    const command = plat === 'darwin' ? 'open' : plat === 'win32' ? 'start' : 'xdg-open';
    (0, child_process_1.exec)(`${command} "${url}"`);
}
/**
 * Formats a date string relative to now (e.g. "2m ago", "1h ago").
 */
function formatTimeAgoCli(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60)
        return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60)
        return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24)
        return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}
/**
 * Generates a green/gray progress bar string.
 */
function progressBar(pct) {
    const total = 12;
    const filled = Math.max(0, Math.min(total, Math.round((pct / 100) * total)));
    return chalk_1.default.green('█'.repeat(filled)) + chalk_1.default.gray('░'.repeat(total - filled));
}
/**
 * Returns true if the dashboard is running (via PID file).
 */
function isDashboardRunning(pidFile) {
    try {
        if (!fs_1.default.existsSync(pidFile))
            return false;
        const pidInput = fs_1.default.readFileSync(pidFile, 'utf-8').trim();
        if (!pidInput)
            return false;
        const pid = parseInt(pidInput);
        if (isNaN(pid))
            return false;
        process.kill(pid, 0);
        return true;
    }
    catch (_a) {
        return false;
    }
}
