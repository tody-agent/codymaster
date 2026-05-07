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
