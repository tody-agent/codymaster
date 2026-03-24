"use strict";
/**
 * 📦 Box Drawing — Terminal UI components
 * Bordered panels, tables, progress bars, badges
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.termWidth = termWidth;
exports.renderBox = renderBox;
exports.renderDivider = renderDivider;
exports.renderTable = renderTable;
exports.renderProgressBar = renderProgressBar;
exports.renderBadge = renderBadge;
exports.renderPriority = renderPriority;
exports.renderSpeechBubble = renderSpeechBubble;
exports.renderStepProgress = renderStepProgress;
exports.renderFooter = renderFooter;
exports.stripAnsi = stripAnsi;
const chalk_1 = __importDefault(require("chalk"));
const theme_1 = require("./theme");
// ─── Terminal Width ────────────────────────────────────────────────────────
function termWidth() {
    return process.stdout.columns || 80;
}
function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}
// ─── Box Components ────────────────────────────────────────────────────────
const BOX = {
    tl: '╭', tr: '╮', bl: '╰', br: '╯',
    h: '─', v: '│',
    // Table
    ttl: '┌', ttr: '┐', tbl: '└', tbr: '┘',
    th: '─', tv: '│', tc: '┼',
    tlt: '├', trt: '┤', ttt: '┬', tbt: '┴',
};
/**
 * Render a bordered box with optional title
 */
function renderBox(content, opts) {
    var _a, _b;
    const pad = (_a = opts === null || opts === void 0 ? void 0 : opts.padding) !== null && _a !== void 0 ? _a : 1;
    const w = (_b = opts === null || opts === void 0 ? void 0 : opts.width) !== null && _b !== void 0 ? _b : clamp(termWidth() - 4, 40, 80);
    const innerW = w - 2 - (pad * 2);
    const lines = [];
    const padStr = ' '.repeat(pad);
    // Top border with optional title
    if (opts === null || opts === void 0 ? void 0 : opts.title) {
        const title = ` ${opts.title} `;
        const leftLen = 2;
        const rightLen = Math.max(0, w - 2 - leftLen - stripAnsi(title).length);
        lines.push((0, theme_1.dim)(`${BOX.tl}${BOX.h.repeat(leftLen)}`) + (0, theme_1.brand)(title) + (0, theme_1.dim)(`${BOX.h.repeat(rightLen)}${BOX.tr}`));
    }
    else {
        lines.push((0, theme_1.dim)(`${BOX.tl}${BOX.h.repeat(w - 2)}${BOX.tr}`));
    }
    // Content lines
    for (const line of content) {
        const visible = stripAnsi(line);
        const spaces = Math.max(0, innerW - visible.length);
        lines.push((0, theme_1.dim)(BOX.v) + padStr + line + ' '.repeat(spaces) + padStr + (0, theme_1.dim)(BOX.v));
    }
    // Bottom border
    lines.push((0, theme_1.dim)(`${BOX.bl}${BOX.h.repeat(w - 2)}${BOX.br}`));
    return lines.join('\n');
}
/**
 * Render a simple divider line
 */
function renderDivider(width) {
    const w = width !== null && width !== void 0 ? width : clamp(termWidth() - 4, 40, 80);
    return (0, theme_1.dim)(BOX.h.repeat(w));
}
/**
 * Render a clean bordered table
 */
function renderTable(columns, rows) {
    const lines = [];
    const totalW = columns.reduce((sum, c) => sum + c.width, 0) + columns.length + 1;
    // Header separator
    const headerSep = (0, theme_1.dim)(columns.map(c => BOX.th.repeat(c.width)).join((0, theme_1.dim)('─┬─')));
    lines.push(`  ${headerSep}`);
    // Header row
    const headerCells = columns.map(c => {
        const text = padCell(c.header, c.width, c.align);
        return (0, theme_1.dim)(text);
    });
    lines.push(`  ${headerCells.join((0, theme_1.dim)(' │ '))}`);
    // Header underline
    lines.push(`  ${headerSep}`);
    // Data rows
    for (const row of rows) {
        const cells = columns.map(c => {
            const val = row[c.header] || '—';
            const display = padCell(stripAnsi(val).length > c.width ? stripAnsi(val).substring(0, c.width - 1) + '…' : val, c.width, c.align);
            return c.color ? c.color(display) : display;
        });
        lines.push(`  ${cells.join((0, theme_1.dim)(' │ '))}`);
    }
    // Bottom separator
    lines.push(`  ${headerSep}`);
    return lines.join('\n');
}
function padCell(str, width, align) {
    const visible = stripAnsi(str);
    const diff = Math.max(0, width - visible.length);
    if (align === 'right')
        return ' '.repeat(diff) + str;
    if (align === 'center') {
        const left = Math.floor(diff / 2);
        return ' '.repeat(left) + str + ' '.repeat(diff - left);
    }
    return str + ' '.repeat(diff);
}
// ─── Progress Bar ──────────────────────────────────────────────────────────
/**
 * Render a colored progress bar
 */
function renderProgressBar(pct, width) {
    const w = width !== null && width !== void 0 ? width : 16;
    const filled = Math.round((clamp(pct, 0, 100) / 100) * w);
    const empty = w - filled;
    const color = pct >= 100 ? theme_1.success : pct >= 60 ? chalk_1.default.hex(theme_1.COLORS.success) : pct >= 30 ? theme_1.warning : theme_1.error;
    return color('█'.repeat(filled)) + (0, theme_1.muted)('░'.repeat(empty)) + (0, theme_1.dim)(` ${pct}%`);
}
// ─── Status Badge ──────────────────────────────────────────────────────────
const BADGE_COLORS = {
    'backlog': chalk_1.default.hex(theme_1.COLORS.backlog),
    'in-progress': chalk_1.default.hex(theme_1.COLORS.inProgress),
    'review': chalk_1.default.hex(theme_1.COLORS.warning),
    'done': chalk_1.default.hex(theme_1.COLORS.done),
    'success': chalk_1.default.hex(theme_1.COLORS.success),
    'failed': chalk_1.default.hex(theme_1.COLORS.error),
    'pending': chalk_1.default.hex(theme_1.COLORS.warning),
    'running': chalk_1.default.hex(theme_1.COLORS.inProgress),
};
/**
 * Render a colored status badge: ● status
 */
function renderBadge(status) {
    const color = BADGE_COLORS[status] || theme_1.dim;
    return color(`${theme_1.ICONS.dot} ${status}`);
}
/**
 * Render priority badge
 */
function renderPriority(priority) {
    const color = theme_1.PRI[priority] || theme_1.dim;
    return color(`${theme_1.ICONS.dot} ${priority}`);
}
// ─── Speech Bubble ─────────────────────────────────────────────────────────
/**
 * Render a hamster speech bubble
 */
function renderSpeechBubble(message) {
    const w = stripAnsi(message).length + 4;
    return [
        (0, theme_1.dim)(`  ╭${'─'.repeat(w)}╮`),
        (0, theme_1.dim)(`  │`) + `  ${message}  ` + (0, theme_1.dim)(`│`),
        (0, theme_1.dim)(`  ╰${'─'.repeat(w)}╯`),
        (0, theme_1.dim)(`  ╰─`),
    ].join('\n');
}
// ─── Step Indicator ────────────────────────────────────────────────────────
/**
 * Render onboarding step progress: Step 2 of 5  ●●○○○
 */
function renderStepProgress(current, total) {
    const dots = Array.from({ length: total }, (_, i) => i < current ? (0, theme_1.brand)(theme_1.ICONS.dot) : (0, theme_1.muted)(theme_1.ICONS.dotEmpty)).join(' ');
    return `  ${(0, theme_1.dim)('Step')} ${(0, theme_1.brand)(String(current))} ${(0, theme_1.dim)('of')} ${(0, theme_1.dim)(String(total))}  ${dots}`;
}
// ─── Footer ────────────────────────────────────────────────────────────────
/**
 * Render a footer hint bar
 */
function renderFooter(hints) {
    return `  ${hints.map(h => (0, theme_1.dim)(h)).join((0, theme_1.dim)(' • '))}`;
}
// ─── Utilities ─────────────────────────────────────────────────────────────
/**
 * Strip ANSI escape codes for width calculations
 */
function stripAnsi(str) {
    // eslint-disable-next-line no-control-regex
    return str.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '').replace(/\x1B\]8;[^;]*;[^\x1B]*\x1B\\/g, '');
}
