import fs from 'fs';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import chalk from 'chalk';

/**
 * Pads a string on the right with spaces.
 */
export function padRight(str: string, len: number): string {
  if (str.length >= len) return str;
  return str + ' '.repeat(len - str.length);
}

/**
 * Opens a URL in the default browser.
 */
export function openUrl(url: string) {
  const plat = os.platform();
  const command = plat === 'darwin' ? 'open' : plat === 'win32' ? 'start' : 'xdg-open';
  exec(`${command} "${url}"`);
}

/**
 * Formats a date string relative to now (e.g. "2m ago", "1h ago").
 */
export function formatTimeAgoCli(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Generates a green/gray progress bar string.
 */
export function progressBar(pct: number): string {
  const total = 12;
  const filled = Math.max(0, Math.min(total, Math.round((pct / 100) * total)));
  return chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(total - filled));
}

/**
 * Returns true if the dashboard is running (via PID file).
 */
export function isDashboardRunning(pidFile: string): boolean {
  try {
    if (!fs.existsSync(pidFile)) return false;
    const pidInput = fs.readFileSync(pidFile, 'utf-8').trim();
    if (!pidInput) return false;
    const pid = parseInt(pidInput);
    if (isNaN(pid)) return false;
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}
