/**
 * Design taste memory — per-project log of approved/rejected design choices
 * (color, font, layout). Each entry decays 5 % per week so old taste does
 * not lock in stale aesthetics; entries with weight < 0.1 are dropped on read.
 *
 * Storage: `.cm/design-taste.json` (JSON, not JSONL — small file, full rewrite).
 *
 * Consumed by cm-design-system and cm-ui-preview to bias token / prompt
 * generation toward what the user has already approved.
 */

import fs from 'fs';
import path from 'path';

export type Dimension = 'color' | 'font' | 'layout';
export type Verdict = 'approved' | 'rejected';

export interface TasteEntry {
  dimension: Dimension;
  value: string;
  verdict: Verdict;
  /** Weight at write-time (always 1.0 at insert; decayed at read-time). */
  weight: number;
  ts: string;
}

export interface TasteFile {
  version: 1;
  entries: TasteEntry[];
}

const FILENAME = path.join('.cm', 'design-taste.json');
const DECAY_PER_WEEK = 0.05;
const MIN_WEIGHT = 0.1;
const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

export function tastePath(projectPath: string): string {
  return path.join(projectPath, FILENAME);
}

function readRaw(p: string): TasteFile {
  if (!fs.existsSync(p)) return { version: 1, entries: [] };
  try {
    const raw = JSON.parse(fs.readFileSync(p, 'utf8')) as TasteFile;
    if (!raw || raw.version !== 1 || !Array.isArray(raw.entries)) {
      return { version: 1, entries: [] };
    }
    return raw;
  } catch {
    return { version: 1, entries: [] };
  }
}

function writeRaw(p: string, file: TasteFile): void {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(file, null, 2) + '\n');
}

export function recordTaste(
  projectPath: string,
  input: { dimension: Dimension; value: string; verdict: Verdict },
  now: Date = new Date(),
): TasteEntry {
  const p = tastePath(projectPath);
  const file = readRaw(p);
  // Idempotent on (dimension, value, verdict): refresh ts/weight instead of duplicating.
  const existing = file.entries.find(
    e => e.dimension === input.dimension && e.value === input.value && e.verdict === input.verdict,
  );
  const entry: TasteEntry = {
    dimension: input.dimension,
    value: input.value,
    verdict: input.verdict,
    weight: 1.0,
    ts: now.toISOString(),
  };
  if (existing) {
    existing.weight = 1.0;
    existing.ts = entry.ts;
  } else {
    file.entries.push(entry);
  }
  writeRaw(p, file);
  return existing ?? entry;
}

/**
 * Apply exponential decay (5 %/week) and drop entries below MIN_WEIGHT.
 * Pure: does not write back.
 */
export function decayEntries(entries: TasteEntry[], now: Date = new Date()): TasteEntry[] {
  const nowMs = now.getTime();
  const out: TasteEntry[] = [];
  for (const e of entries) {
    const ageWeeks = Math.max(0, (nowMs - new Date(e.ts).getTime()) / MS_PER_WEEK);
    const decayed = e.weight * Math.pow(1 - DECAY_PER_WEEK, ageWeeks);
    if (decayed >= MIN_WEIGHT) {
      out.push({ ...e, weight: Number(decayed.toFixed(4)) });
    }
  }
  return out;
}

export function loadTaste(projectPath: string, now: Date = new Date()): TasteEntry[] {
  return decayEntries(readRaw(tastePath(projectPath)).entries, now);
}

export interface TopTaste {
  approved: TasteEntry[];
  rejected: TasteEntry[];
}

export function topTaste(
  projectPath: string,
  dimension: Dimension,
  n = 5,
  now: Date = new Date(),
): TopTaste {
  const live = loadTaste(projectPath, now).filter(e => e.dimension === dimension);
  const sortDesc = (a: TasteEntry, b: TasteEntry) => b.weight - a.weight;
  return {
    approved: live.filter(e => e.verdict === 'approved').sort(sortDesc).slice(0, n),
    rejected: live.filter(e => e.verdict === 'rejected').sort(sortDesc).slice(0, n),
  };
}

/**
 * Rewrite the file with decayed entries, dropping stale ones.
 * Cm-continuity or a periodic task can call this; not required for reads.
 */
export function compactTaste(projectPath: string, now: Date = new Date()): number {
  const p = tastePath(projectPath);
  const before = readRaw(p).entries;
  const after = decayEntries(before, now);
  writeRaw(p, { version: 1, entries: after });
  return before.length - after.length;
}
