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

const PLAN_TASK_KEYS = [
  'id',
  'goal',
  'deliverable',
  'files',
  'dependencies',
  'interfaces',
  'acceptance_criteria',
  'steps',
  'verification',
  'commit_boundary',
] as const;

const PLACEHOLDER_PATTERN =
  /\b(?:TODO|TBD|implement later|fill in details|add tests|handle edge cases|appropriate error handling|write tests for the above|similar to task)\b/i;

function requireObject(value: unknown, location: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new HandoffError(`${location} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requireString(value: unknown, location: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new HandoffError(`${location} must be a non-empty string`);
  }
  return value;
}

function requireStringArray(
  value: unknown,
  location: string,
  allowEmpty = true
): string[] {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) {
    throw new HandoffError(`${location} must be ${allowEmpty ? 'an' : 'a non-empty'} array`);
  }
  return value.map((item, index) => requireString(item, `${location}[${index}]`));
}

function rejectPlaceholders(value: unknown, location: string): void {
  if (typeof value === 'string' && PLACEHOLDER_PATTERN.test(value)) {
    throw new HandoffError(`${location} contains placeholder text`);
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => rejectPlaceholders(item, `${location}[${index}]`));
  } else if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      rejectPlaceholders(item, `${location}.${key}`);
    }
  }
}

function validatePlanTaskSpecs(data: Record<string, unknown>): void {
  if (!('task_specs' in data)) return;
  if (!Array.isArray(data.task_specs) || data.task_specs.length === 0) {
    throw new HandoffError('handoff[plan@1].data.task_specs must be a non-empty array');
  }

  const taskIds = new Set<string>();
  data.task_specs.forEach((value, taskIndex) => {
    const location = `handoff[plan@1].data.task_specs[${taskIndex}]`;
    const task = requireObject(value, location);
    for (const key of PLAN_TASK_KEYS) {
      if (!(key in task)) throw new HandoffError(`${location} missing key: ${key}`);
    }

    const id = requireString(task.id, `${location}.id`);
    if (taskIds.has(id)) throw new HandoffError(`${location}.id must be unique: ${id}`);
    taskIds.add(id);
    requireString(task.goal, `${location}.goal`);
    requireString(task.deliverable, `${location}.deliverable`);
    requireString(task.commit_boundary, `${location}.commit_boundary`);
    requireStringArray(task.dependencies, `${location}.dependencies`);
    requireStringArray(task.acceptance_criteria, `${location}.acceptance_criteria`, false);

    if (!Array.isArray(task.files) || task.files.length === 0) {
      throw new HandoffError(`${location}.files must be a non-empty array`);
    }
    const taskFiles = new Set<string>();
    task.files.forEach((fileValue, fileIndex) => {
      const fileLocation = `${location}.files[${fileIndex}]`;
      const file = requireObject(fileValue, fileLocation);
      taskFiles.add(requireString(file.path, `${fileLocation}.path`));
      if (!['create', 'modify', 'delete'].includes(String(file.action))) {
        throw new HandoffError(`${fileLocation}.action must be create, modify, or delete`);
      }
    });

    const interfaces = requireObject(task.interfaces, `${location}.interfaces`);
    requireStringArray(interfaces.consumes, `${location}.interfaces.consumes`);
    requireStringArray(interfaces.produces, `${location}.interfaces.produces`);

    if (!Array.isArray(task.steps) || task.steps.length === 0) {
      throw new HandoffError(`${location}.steps must be a non-empty array`);
    }
    const stepIds = new Set<string>();
    const tddPhases: string[] = [];
    task.steps.forEach((stepValue, stepIndex) => {
      const stepLocation = `${location}.steps[${stepIndex}]`;
      const step = requireObject(stepValue, stepLocation);
      const stepId = requireString(step.id, `${stepLocation}.id`);
      if (stepIds.has(stepId)) {
        throw new HandoffError(`${stepLocation}.id must be unique: ${stepId}`);
      }
      stepIds.add(stepId);
      requireString(step.action, `${stepLocation}.action`);
      const stepFiles = requireStringArray(step.files, `${stepLocation}.files`, false);
      stepFiles.forEach((stepFile, fileIndex) => {
        if (!taskFiles.has(stepFile)) {
          throw new HandoffError(
            `${stepLocation}.files[${fileIndex}] must be within the task scope`,
          );
        }
      });
      const cycle = requireObject(step.test_cycle, `${stepLocation}.test_cycle`);
      if (!['red', 'green', 'refactor', 'verify'].includes(String(cycle.phase))) {
        throw new HandoffError(`${stepLocation}.test_cycle.phase is invalid`);
      }
      if (cycle.phase === 'red' || cycle.phase === 'green') {
        tddPhases.push(cycle.phase);
      }
      requireString(cycle.command, `${stepLocation}.test_cycle.command`);
      requireString(cycle.expected_result, `${stepLocation}.test_cycle.expected_result`);
    });
    if (tddPhases.length > 0 && (!tddPhases.includes('red') || !tddPhases.includes('green'))) {
      throw new HandoffError(`${location}.steps using TDD must include both RED and GREEN phases`);
    }
    if (
      tddPhases.length > 0
      && (tddPhases[0] !== 'red' || tddPhases[tddPhases.length - 1] !== 'green')
    ) {
      throw new HandoffError(`${location}.steps must put RED before GREEN`);
    }

    const verification = requireObject(task.verification, `${location}.verification`);
    requireString(verification.command, `${location}.verification.command`);
    requireString(verification.expected_result, `${location}.verification.expected_result`);
    rejectPlaceholders(task, location);
  });

  for (const firstTask of requireStringArray(
    data.first_tasks,
    'handoff[plan@1].data.first_tasks'
  )) {
    if (!taskIds.has(firstTask)) {
      throw new HandoffError(
        `handoff[plan@1].data.first_tasks references missing task_specs id: ${firstTask}`
      );
    }
  }
}

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
  if (schema === 'plan@1') {
    validatePlanTaskSpecs(data as Record<string, unknown>);
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
