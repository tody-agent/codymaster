/**
 * Per-project learnings — append-only JSONL log under `.cm/learnings.jsonl`.
 *
 * Each learning is a small structured note that future sessions read at start
 * (via cm-continuity) so the agent doesn't repeat past pitfalls or forget
 * preferences. Inspired by gstack `/learn` but simpler — no sync required.
 *
 * Format (one JSON object per line):
 *   { "ts": "2026-05-07T12:00:00Z",
 *     "type": "pitfall" | "preference" | "pattern" | "fact",
 *     "scope": "deploy" | "ui" | "test" | ...,
 *     "note": "human readable note",
 *     "source": "cm-retro-cli" | "manual" | ... }
 */

import fs from 'fs';
import path from 'path';

export type LearningType = 'pitfall' | 'preference' | 'pattern' | 'fact';

export interface Learning {
  ts: string;
  type: LearningType;
  scope: string;
  note: string;
  source?: string;
}

export interface LearningQuery {
  type?: LearningType;
  scope?: string;
  /** ISO date; only return learnings emitted on/after this. */
  since?: string;
  /** Cap result count; newest-first by file order. */
  limit?: number;
}

const LEARNING_TYPES = new Set<LearningType>(['pitfall', 'preference', 'pattern', 'fact']);

export function learningsPath(projectPath: string): string {
  return path.join(projectPath, '.cm', 'learnings.jsonl');
}

function ensureDir(file: string): void {
  const d = path.dirname(file);
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

export class LearningError extends Error {}

function validate(input: Omit<Learning, 'ts'> & { ts?: string }): void {
  if (!LEARNING_TYPES.has(input.type)) {
    throw new LearningError(`invalid learning type: ${input.type}`);
  }
  if (!input.scope || typeof input.scope !== 'string') {
    throw new LearningError('learning.scope is required (string)');
  }
  if (!input.note || typeof input.note !== 'string') {
    throw new LearningError('learning.note is required (string)');
  }
  if (input.note.length > 500) {
    throw new LearningError(`learning.note too long (${input.note.length} > 500)`);
  }
}

export function addLearning(
  projectPath: string,
  input: Omit<Learning, 'ts'> & { ts?: string }
): Learning {
  validate(input);
  const learning: Learning = {
    ts: input.ts ?? new Date().toISOString(),
    type: input.type,
    scope: input.scope,
    note: input.note,
    ...(input.source ? { source: input.source } : {}),
  };
  const file = learningsPath(projectPath);
  ensureDir(file);
  fs.appendFileSync(file, JSON.stringify(learning) + '\n', 'utf8');
  return learning;
}

export function listLearnings(projectPath: string, query: LearningQuery = {}): Learning[] {
  const file = learningsPath(projectPath);
  if (!fs.existsSync(file)) return [];
  const raw = fs.readFileSync(file, 'utf8');
  const out: Learning[] = [];
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    let parsed: Learning;
    try {
      parsed = JSON.parse(line) as Learning;
    } catch {
      continue; // skip malformed lines
    }
    if (query.type && parsed.type !== query.type) continue;
    if (query.scope && parsed.scope !== query.scope) continue;
    if (query.since && parsed.ts < query.since) continue;
    out.push(parsed);
  }
  // Newest first.
  out.reverse();
  if (query.limit && out.length > query.limit) return out.slice(0, query.limit);
  return out;
}

/**
 * Remove learnings older than `maxAgeDays` (default 180).
 * Returns the number of pruned entries.
 */
export function pruneLearnings(projectPath: string, maxAgeDays = 180): number {
  const file = learningsPath(projectPath);
  if (!fs.existsSync(file)) return 0;
  const cutoff = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000).toISOString();
  const raw = fs.readFileSync(file, 'utf8');
  const kept: string[] = [];
  let pruned = 0;
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    try {
      const parsed = JSON.parse(line) as Learning;
      if (parsed.ts >= cutoff) {
        kept.push(line);
      } else {
        pruned++;
      }
    } catch {
      kept.push(line); // keep malformed lines as-is
    }
  }
  fs.writeFileSync(file, kept.join('\n') + (kept.length ? '\n' : ''), 'utf8');
  return pruned;
}

/**
 * Strip user-identifying / token-looking material from a learning before it
 * leaves the project. Used by `cm learn sync` to push to a shared remote
 * without leaking absolute paths, emails, or long credentials.
 */
export function anonymize(l: Learning): Learning {
  const stripPath = (s: string) =>
    s
      .replace(/\/Users\/[^/\s"']+/g, '~')
      .replace(/\/home\/[^/\s"']+/g, '~')
      .replace(/[A-Za-z]:\\Users\\[^\\\s"']+/g, '~');
  const stripEmail = (s: string) =>
    s.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '<email>');
  const stripToken = (s: string) =>
    // Long opaque tokens — runs of 24+ url-safe chars without spaces.
    s.replace(/[A-Za-z0-9_\-]{24,}/g, '<token>');
  const clean = (s: string) => stripToken(stripEmail(stripPath(s)));
  return {
    ts: l.ts,
    type: l.type,
    scope: clean(l.scope),
    note: clean(l.note),
    ...(l.source ? { source: clean(l.source) } : {}),
  };
}

/**
 * Stable identity hash for dedup across machines. Excludes `ts` so the same
 * note appearing on two days collapses to one entry.
 */
export function learningKey(l: Learning): string {
  return `${l.type}|${l.scope}|${l.note}`;
}

/**
 * Merge two learning lists, dropping duplicates by `learningKey`. The earliest
 * timestamp wins (we treat the original observation as canonical).
 */
export function mergeLearnings(a: Learning[], b: Learning[]): Learning[] {
  const map = new Map<string, Learning>();
  for (const l of [...a, ...b]) {
    const k = learningKey(l);
    const prev = map.get(k);
    if (!prev || l.ts < prev.ts) map.set(k, l);
  }
  return Array.from(map.values()).sort((x, y) => (x.ts < y.ts ? -1 : 1));
}

/**
 * Read the JSONL file at an arbitrary path (used by sync to read the remote
 * mirror copy). Returns [] if the file is missing.
 */
export function readLearningsFile(file: string): Learning[] {
  if (!fs.existsSync(file)) return [];
  const out: Learning[] = [];
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try {
      out.push(JSON.parse(line) as Learning);
    } catch {
      // skip malformed
    }
  }
  return out;
}

export function writeLearningsFile(file: string, list: Learning[]): void {
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const body = list.map(l => JSON.stringify(l)).join('\n');
  fs.writeFileSync(file, list.length ? body + '\n' : '', 'utf8');
}

/**
 * Render the most recent N learnings as a compact Markdown block, suitable
 * for injection into CONTINUITY.md by cm-continuity at session start.
 */
export function renderLearningsForContinuity(projectPath: string, limit = 10): string {
  const recent = listLearnings(projectPath, { limit });
  if (recent.length === 0) return '';
  const lines: string[] = ['## Recent Learnings (auto-loaded)'];
  for (const l of recent) {
    const date = l.ts.slice(0, 10);
    lines.push(`- [${date}] **${l.type}/${l.scope}**: ${l.note}`);
  }
  return lines.join('\n') + '\n';
}
