/**
 * Project Tier Classification.
 *
 * Heuristic-based assignment to one of:
 *   LITE          — solo / prototype       (LOC < 2k, files < 50)
 *   STANDARD      — small project          (LOC < 20k, files < 300)
 *   PROFESSIONAL  — production project     (LOC < 100k, files < 1500)
 *   ENTERPRISE    — large codebase         (above)
 *
 * The tier dictates:
 *   - cm-quality-gate strictness (Vibe mode default)
 *   - Adaptive Depth (TL;DR vs full protocol rendering for skills)
 */

import fs from 'fs';
import path from 'path';
import type { VibeMode } from './vibecoding-index';

export type ProjectTier = 'LITE' | 'STANDARD' | 'PROFESSIONAL' | 'ENTERPRISE';

export interface TierMetrics {
  files: number;
  loc: number;
  deps: number;
}

export interface TierReport {
  tier: ProjectTier;
  metrics: TierMetrics;
  vibe_mode_default: VibeMode;
  /** Skills should render TL;DR only at this tier when this is true. */
  prefer_tldr: boolean;
}

const SKIP_DIR = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '.cache',
  '.venv', 'venv', '__pycache__', 'target', 'vendor', '.cm',
  'coverage', '.turbo', '.pnpm-store',
]);

const CODE_EXT = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.py', '.rb', '.go', '.rs', '.java', '.kt',
  '.swift', '.c', '.cc', '.cpp', '.h', '.hpp',
]);

function walk(root: string, acc: TierMetrics, depth = 0): void {
  if (depth > 12) return;
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(root, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (e.name.startsWith('.') && e.name !== '.cm') {
      // skip hidden dirs except for explicit ones
    }
    if (SKIP_DIR.has(e.name)) continue;
    const full = path.join(root, e.name);
    if (e.isDirectory()) {
      walk(full, acc, depth + 1);
    } else if (e.isFile()) {
      const ext = path.extname(e.name).toLowerCase();
      if (!CODE_EXT.has(ext)) continue;
      acc.files += 1;
      try {
        const content = fs.readFileSync(full, 'utf8');
        acc.loc += content.split('\n').length;
      } catch {
        // unreadable; ignore
      }
    }
  }
}

function countDeps(root: string): number {
  let n = 0;
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    n += Object.keys(pkg.dependencies ?? {}).length;
    n += Object.keys(pkg.devDependencies ?? {}).length;
  } catch { /* not a node project */ }
  try {
    const py = fs.readFileSync(path.join(root, 'requirements.txt'), 'utf8');
    n += py.split('\n').filter((l) => l.trim() && !l.startsWith('#')).length;
  } catch { /* no python reqs */ }
  return n;
}

export function classifyProject(root: string): TierReport {
  const metrics: TierMetrics = { files: 0, loc: 0, deps: 0 };
  walk(root, metrics);
  metrics.deps = countDeps(root);

  let tier: ProjectTier;
  if (metrics.files < 50 && metrics.loc < 2_000) tier = 'LITE';
  else if (metrics.files < 300 && metrics.loc < 20_000) tier = 'STANDARD';
  else if (metrics.files < 1_500 && metrics.loc < 100_000) tier = 'PROFESSIONAL';
  else tier = 'ENTERPRISE';

  const vibeDefault: Record<ProjectTier, VibeMode> = {
    LITE: 'OFF',
    STANDARD: 'WARNING',
    PROFESSIONAL: 'SOFT',
    ENTERPRISE: 'FULL',
  };

  return {
    tier,
    metrics,
    vibe_mode_default: vibeDefault[tier],
    prefer_tldr: tier === 'LITE' || tier === 'STANDARD',
  };
}

export function renderTierMarkdown(r: TierReport): string {
  return [
    `# Project Tier: ${r.tier}`,
    '',
    `Files: ${r.metrics.files}`,
    `LOC:   ${r.metrics.loc}`,
    `Deps:  ${r.metrics.deps}`,
    '',
    `Default Vibecoding mode: ${r.vibe_mode_default}`,
    `Adaptive depth: ${r.prefer_tldr ? 'TL;DR only' : 'Full protocol'}`,
    '',
  ].join('\n');
}

export function writeTierReport(root: string, r: TierReport): string {
  const dir = path.join(root, '.cm');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'project-tier.md');
  fs.writeFileSync(file, renderTierMarkdown(r), 'utf8');
  return file;
}
