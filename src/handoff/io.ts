/**
 * Handoff JSON read/write helpers.
 *
 * Files live under `<projectPath>/.cm/handoff/<name>.json`.
 * Validation is intentionally lightweight (no zod dep) — schema field +
 * required key presence is enough to catch drift early.
 */

import fs from 'fs';
import path from 'path';
import {
  type AnyHandoff,
  type HandoffSchema,
  HANDOFF_FILENAMES,
} from './contracts.js';

export class HandoffError extends Error {}

function handoffDir(projectPath: string): string {
  return path.join(projectPath, '.cm', 'handoff');
}

export function handoffPath(projectPath: string, schema: HandoffSchema): string {
  return path.join(handoffDir(projectPath), HANDOFF_FILENAMES[schema]);
}

export function ensureHandoffDir(projectPath: string): void {
  const d = handoffDir(projectPath);
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

/** Required top-level keys for every envelope. */
const ENVELOPE_KEYS = ['schema', 'emitted_at', 'emitted_by', 'data'] as const;

/** Per-schema required keys inside `data`. */
const DATA_KEYS: Record<HandoffSchema, readonly string[]> = {
  'intent@1': ['problem', 'success_criteria', 'constraints', 'options_considered'],
  'plan@1': ['goal', 'decisions', 'first_tasks'],
  'exec@1': ['completed_tasks', 'pending_tasks', 'files_changed', 'test_status'],
  'review@1': ['verdict', 'findings', 'must_fix_count'],
  'quality@1': ['gates_passed', 'gates_failed', 'safe_to_ship', 'evidence'],
  'retro@1': ['sprint_id', 'learnings'],
  'party@1': ['topic', 'personas'],
};

export function validateHandoff(obj: unknown): asserts obj is AnyHandoff {
  if (!obj || typeof obj !== 'object') {
    throw new HandoffError('handoff must be an object');
  }
  const o = obj as Record<string, unknown>;
  for (const k of ENVELOPE_KEYS) {
    if (!(k in o)) throw new HandoffError(`handoff missing key: ${k}`);
  }
  const schema = o.schema;
  if (typeof schema !== 'string' || !(schema in HANDOFF_FILENAMES)) {
    throw new HandoffError(`unknown schema: ${String(schema)}`);
  }
  const data = o.data;
  if (!data || typeof data !== 'object') {
    throw new HandoffError('handoff.data must be an object');
  }
  const required = DATA_KEYS[schema as HandoffSchema];
  for (const k of required) {
    if (!(k in (data as Record<string, unknown>))) {
      throw new HandoffError(`handoff[${schema}].data missing key: ${k}`);
    }
  }
}

export function writeHandoff(projectPath: string, handoff: AnyHandoff): string {
  validateHandoff(handoff);
  ensureHandoffDir(projectPath);
  const file = handoffPath(projectPath, handoff.schema);
  fs.writeFileSync(file, JSON.stringify(handoff, null, 2), 'utf8');
  return file;
}

export function readHandoff<T extends AnyHandoff>(
  projectPath: string,
  schema: T['schema']
): T | null {
  const file = handoffPath(projectPath, schema);
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, 'utf8');
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new HandoffError(`handoff file is not valid JSON: ${file}`);
  }
  validateHandoff(parsed);
  if ((parsed as AnyHandoff).schema !== schema) {
    throw new HandoffError(
      `handoff schema mismatch: expected ${schema}, got ${(parsed as AnyHandoff).schema}`
    );
  }
  return parsed as T;
}

export function listHandoffs(projectPath: string): string[] {
  const d = handoffDir(projectPath);
  if (!fs.existsSync(d)) return [];
  return fs.readdirSync(d).filter((f) => f.endsWith('.json'));
}

export function clearHandoffs(projectPath: string): number {
  const d = handoffDir(projectPath);
  if (!fs.existsSync(d)) return 0;
  let n = 0;
  for (const f of fs.readdirSync(d)) {
    if (f.endsWith('.json')) {
      fs.unlinkSync(path.join(d, f));
      n++;
    }
  }
  return n;
}

export function nowIso(): string {
  return new Date().toISOString();
}
