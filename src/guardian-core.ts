/**
 * Runtime safety patterns for `cm guardian` (careful / freeze / guard style).
 */

import fs from 'fs';
import path from 'path';

export interface GuardianCheckResult {
  safe: boolean;
  reason?: string;
  matchedPattern?: string;
}

const DESTRUCTIVE_PATTERNS: RegExp[] = [
  /\brm\s+(-[rfFR]+\s*)+.*(\/\s*$|\/\*|\s\/\s)/,
  /\brm\s+-rf\b/i,
  /\bmkfs\./,
  /\bdd\s+if=/,
  />\s*\/dev\/sd/,
  /\bDROP\s+DATABASE\b/i,
  /\bDROP\s+TABLE\b/i,
  /\bTRUNCATE\s+TABLE\b/i,
  /\bgit\s+push\s+.*--force/i,
  /\bgit\s+push\s+-f\b/,
  /\bgit\s+reset\s+--hard\b/,
  /\bgit\s+clean\s+-fdx\b/,
  /\bcurl\s+.*\|\s*(ba)?sh\b/i,
  /\bwget\s+.*\|\s*(ba)?sh\b/i,
  /\bmysqladmin\s+drop\b/i,
  /\bredis-cli\s+.*FLUSHALL/i,
];

const DEFAULT_WHITELIST_PREFIXES = ['npm run build', 'npm test', 'npm run test', 'npx vitest'];

export function checkShellCommand(
  cmd: string,
  options?: { extraWhitelist?: string[] }
): GuardianCheckResult {
  const trimmed = cmd.trim();
  if (!trimmed) return { safe: true };

  const whitelist = [...DEFAULT_WHITELIST_PREFIXES, ...(options?.extraWhitelist ?? [])];
  for (const w of whitelist) {
    if (trimmed.startsWith(w)) return { safe: true };
  }

  for (const re of DESTRUCTIVE_PATTERNS) {
    if (re.test(trimmed)) {
      return {
        safe: false,
        reason: 'Command matches a destructive pattern. Confirm intent or use a safer alternative.',
        matchedPattern: re.source,
      };
    }
  }

  return { safe: true };
}

export function normalizeRoots(cwd: string, roots: string[]): string[] {
  return roots.map((r) => path.resolve(cwd, r));
}

/** Returns true if `targetPath` is under one of `roots` (after resolve). */
export function isPathUnderRoots(targetPath: string, roots: string[]): boolean {
  const abs = path.resolve(targetPath);
  for (const root of roots) {
    const r = path.resolve(root);
    if (abs === r || abs.startsWith(r + path.sep)) return true;
  }
  return false;
}

export function appendGuardianLog(projectPath: string, line: string): void {
  const dir = path.join(projectPath, '.cm');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const logPath = path.join(dir, 'guardian.log');
  fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${line}\n`, 'utf8');
}
