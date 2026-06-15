import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFile } from 'child_process';
import chalk from 'chalk';
import crypto from 'crypto';

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
  if (plat === 'win32') {
    execFile('cmd.exe', ['/c', 'start', '""', url]);
  } else {
    const command = plat === 'darwin' ? 'open' : 'xdg-open';
    execFile(command, [url]);
  }
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

/**
 * Returns a cryptographically secure fallback token.
 * Persists it to .cm/browse_token with 0o600 permissions so it can be reused across processes.
 */
export async function getFallbackToken(repoRoot: string): Promise<string> {
  const cmDir = path.join(repoRoot, '.cm');
  const tokenFile = path.join(cmDir, 'browse_token');

  try {
    await fs.promises.mkdir(cmDir, { recursive: true });
    try {
      const existing = await fs.promises.readFile(tokenFile, 'utf-8');
      if (existing.trim()) return existing.trim();
    } catch (e: any) {
      if (e.code !== 'ENOENT') throw e;
    }

    const token = crypto.randomBytes(16).toString('hex');
    await fs.promises.writeFile(tokenFile, token, { mode: 0o600, encoding: 'utf-8' });
    return token;
  } catch (err: any) {
    // If fs fails (e.g. read-only filesystem), fallback to in-memory generation
    return crypto.randomBytes(16).toString('hex');
  }
}
