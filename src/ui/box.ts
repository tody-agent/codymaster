/**
 * 📦 Box Drawing — Terminal UI components
 * Bordered panels, tables, progress bars, badges
 */

import chalk from 'chalk';
import { brand, dim, muted, success, warning, error, COLORS, ICONS, COL, PRI } from './theme';

// ─── Terminal Width ────────────────────────────────────────────────────────

export function termWidth(): number {
  return process.stdout.columns || 80;
}

function clamp(val: number, min: number, max: number): number {
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
export function renderBox(content: string[], opts?: { title?: string; width?: number; padding?: number }): string {
  const pad = opts?.padding ?? 1;
  const w = opts?.width ?? clamp(termWidth() - 4, 40, 80);
  const innerW = w - 2 - (pad * 2);

  const lines: string[] = [];
  const padStr = ' '.repeat(pad);

  // Top border with optional title
  if (opts?.title) {
    const title = ` ${opts.title} `;
    const leftLen = 2;
    const rightLen = Math.max(0, w - 2 - leftLen - stripAnsi(title).length);
    lines.push(dim(`${BOX.tl}${BOX.h.repeat(leftLen)}`) + brand(title) + dim(`${BOX.h.repeat(rightLen)}${BOX.tr}`));
  } else {
    lines.push(dim(`${BOX.tl}${BOX.h.repeat(w - 2)}${BOX.tr}`));
  }

  // Content lines
  for (const line of content) {
    const visible = stripAnsi(line);
    const spaces = Math.max(0, innerW - visible.length);
    lines.push(dim(BOX.v) + padStr + line + ' '.repeat(spaces) + padStr + dim(BOX.v));
  }

  // Bottom border
  lines.push(dim(`${BOX.bl}${BOX.h.repeat(w - 2)}${BOX.br}`));

  return lines.join('\n');
}

/**
 * Render a simple divider line
 */
export function renderDivider(width?: number): string {
  const w = width ?? clamp(termWidth() - 4, 40, 80);
  return dim(BOX.h.repeat(w));
}

// ─── Table ─────────────────────────────────────────────────────────────────

export interface TableColumn {
  header: string;
  width: number;
  align?: 'left' | 'right' | 'center';
  color?: (s: string) => string;
}

export interface TableRow {
  [key: string]: string;
}

/**
 * Render a clean bordered table
 */
export function renderTable(columns: TableColumn[], rows: TableRow[]): string {
  const lines: string[] = [];
  const totalW = columns.reduce((sum, c) => sum + c.width, 0) + columns.length + 1;

  // Header separator
  const headerSep = dim(columns.map(c => BOX.th.repeat(c.width)).join(dim('─┬─')));
  lines.push(`  ${headerSep}`);

  // Header row
  const headerCells = columns.map(c => {
    const text = padCell(c.header, c.width, c.align);
    return dim(text);
  });
  lines.push(`  ${headerCells.join(dim(' │ '))}`);

  // Header underline
  lines.push(`  ${headerSep}`);

  // Data rows
  for (const row of rows) {
    const cells = columns.map(c => {
      const val = row[c.header] || '—';
      const display = padCell(stripAnsi(val).length > c.width ? stripAnsi(val).substring(0, c.width - 1) + '…' : val, c.width, c.align);
      return c.color ? c.color(display) : display;
    });
    lines.push(`  ${cells.join(dim(' │ '))}`);
  }

  // Bottom separator
  lines.push(`  ${headerSep}`);

  return lines.join('\n');
}

function padCell(str: string, width: number, align?: string): string {
  const visible = stripAnsi(str);
  const diff = Math.max(0, width - visible.length);
  if (align === 'right') return ' '.repeat(diff) + str;
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
export function renderProgressBar(pct: number, width?: number): string {
  const w = width ?? 16;
  const filled = Math.round((clamp(pct, 0, 100) / 100) * w);
  const empty = w - filled;
  const color = pct >= 100 ? success : pct >= 60 ? chalk.hex(COLORS.success) : pct >= 30 ? warning : error;
  return color('█'.repeat(filled)) + muted('░'.repeat(empty)) + dim(` ${pct}%`);
}

// ─── Status Badge ──────────────────────────────────────────────────────────

const BADGE_COLORS: Record<string, (s: string) => string> = {
  'backlog': chalk.hex(COLORS.backlog),
  'in-progress': chalk.hex(COLORS.inProgress),
  'review': chalk.hex(COLORS.warning),
  'done': chalk.hex(COLORS.done),
  'success': chalk.hex(COLORS.success),
  'failed': chalk.hex(COLORS.error),
  'pending': chalk.hex(COLORS.warning),
  'running': chalk.hex(COLORS.inProgress),
};

/**
 * Render a colored status badge: ● status
 */
export function renderBadge(status: string): string {
  const color = BADGE_COLORS[status] || dim;
  return color(`${ICONS.dot} ${status}`);
}

/**
 * Render priority badge
 */
export function renderPriority(priority: string): string {
  const color = PRI[priority] || dim;
  return color(`${ICONS.dot} ${priority}`);
}

// ─── Speech Bubble ─────────────────────────────────────────────────────────

/**
 * Render a hamster speech bubble
 */
export function renderSpeechBubble(message: string): string {
  const w = stripAnsi(message).length + 4;
  return [
    dim(`  ╭${'─'.repeat(w)}╮`),
    dim(`  │`) + `  ${message}  ` + dim(`│`),
    dim(`  ╰${'─'.repeat(w)}╯`),
    dim(`  ╰─`),
  ].join('\n');
}

// ─── Step Indicator ────────────────────────────────────────────────────────

/**
 * Render onboarding step progress: Step 2 of 5  ●●○○○
 */
export function renderStepProgress(current: number, total: number): string {
  const dots = Array.from({ length: total }, (_, i) =>
    i < current ? brand(ICONS.dot) : muted(ICONS.dotEmpty)
  ).join(' ');
  return `  ${dim('Step')} ${brand(String(current))} ${dim('of')} ${dim(String(total))}  ${dots}`;
}

// ─── Footer ────────────────────────────────────────────────────────────────

/**
 * Render a footer hint bar
 */
export function renderFooter(hints: string[]): string {
  return `  ${hints.map(h => dim(h)).join(dim(' • '))}`;
}

// ─── Utilities ─────────────────────────────────────────────────────────────

/**
 * Strip ANSI escape codes for width calculations
 */
export function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '').replace(/\x1B\]8;[^;]*;[^\x1B]*\x1B\\/g, '');
}
