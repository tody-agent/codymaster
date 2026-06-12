/**
 * Opinionated sprint pipeline + Context Bus files under `.cm/sprint/`.
 * Complements root `context-bus.json` with step artifacts (ADR 002).
 *
 * v2.0: optional structured handoff JSON via `src/handoff/`. Sprint skills
 * may call `completeSprintStepWithHandoff()` to emit a typed handoff file
 * alongside the Markdown artifact.
 */

import fs from 'fs';
import path from 'path';
import { writeHandoff, type AnyHandoff } from './handoff';

export const SPRINT_STEPS = [
  'brainstorm',
  'plan',
  'design',
  'tdd',
  'build',
  'review',
  'qa',
  'security',
  'ship',
  'monitor',
  'retro',
] as const;

export type SprintStep = (typeof SPRINT_STEPS)[number];

/** Parsed from disk; `skipped` may be absent on v1 files. */
interface RawSprintState {
  version: 1 | 2;
  pipeline: SprintStep[];
  current_index: number;
  completed: SprintStep[];
  skipped?: SprintStep[];
  started_at: string;
  updated_at: string;
  artifacts_dir: string;
}

export interface SprintState {
  /** 2 = includes `skipped[]`; 1 = legacy files (normalized on read). */
  version: 1 | 2;
  pipeline: SprintStep[];
  current_index: number;
  completed: SprintStep[];
  /** Steps advanced via `skipSprintStep` (empty for v1 files until normalized). */
  skipped: SprintStep[];
  started_at: string;
  updated_at: string;
  artifacts_dir: string;
}

function sprintDir(projectPath: string): string {
  return path.join(projectPath, '.cm', 'sprint');
}

function statePath(projectPath: string): string {
  return path.join(sprintDir(projectPath), 'state.json');
}

function ensureSprintDir(projectPath: string): void {
  const d = sprintDir(projectPath);
  const art = path.join(d, 'artifacts');
  if (!fs.existsSync(art)) fs.mkdirSync(art, { recursive: true });
}

function normalizeSprintState(raw: RawSprintState): SprintState {
  return {
    ...raw,
    version: raw.version === 2 ? 2 : 1,
    skipped: raw.skipped ?? [],
  };
}

export function readSprintState(projectPath: string): SprintState | null {
  const p = statePath(projectPath);
  if (!fs.existsSync(p)) return null;
  try {
    const raw = JSON.parse(fs.readFileSync(p, 'utf8')) as RawSprintState;
    return normalizeSprintState(raw);
  } catch {
    return null;
  }
}

export function writeSprintState(projectPath: string, state: SprintState): void {
  ensureSprintDir(projectPath);
  fs.writeFileSync(statePath(projectPath), JSON.stringify(state, null, 2), 'utf8');
}

export function initSprint(projectPath: string, fromStep?: SprintStep): SprintState {
  ensureSprintDir(projectPath);
  const now = new Date().toISOString();
  let pipeline = [...SPRINT_STEPS];
  let startIdx = 0;
  if (fromStep) {
    const i = pipeline.indexOf(fromStep);
    if (i >= 0) startIdx = i;
  }
  const state: SprintState = {
    version: 2,
    pipeline,
    current_index: startIdx,
    completed: [],
    skipped: [],
    started_at: now,
    updated_at: now,
    artifacts_dir: path.join(sprintDir(projectPath), 'artifacts'),
  };
  writeSprintState(projectPath, state);
  appendEvent(projectPath, { type: 'init', from: fromStep ?? null, at: now });
  return state;
}

export function completeSprintStep(
  projectPath: string,
  step: SprintStep,
  artifactBody: string
): SprintState {
  let state = readSprintState(projectPath);
  if (!state) state = initSprint(projectPath);

  if (state.current_index >= state.pipeline.length) {
    throw new Error('Sprint pipeline already finished');
  }

  const expected = state.pipeline[state.current_index];
  if (expected !== step) {
    throw new Error(`Expected step "${expected}", got "${step}"`);
  }

  const artFile = path.join(state.artifacts_dir, `${step}.md`);
  fs.writeFileSync(artFile, artifactBody, 'utf8');

  state.completed.push(step);
  state.current_index = Math.min(state.current_index + 1, state.pipeline.length);
  state.updated_at = new Date().toISOString();
  state.version = 2;
  writeSprintState(projectPath, state);
  appendEvent(projectPath, { type: 'complete', step, at: state.updated_at });
  return state;
}

/**
 * Complete a sprint step AND emit a typed handoff JSON under `.cm/handoff/`.
 *
 * Use this from sprint skills (cm-planning, cm-execution, cm-code-review,
 * cm-quality-gate, cm-brainstorm-idea, cm-retro-cli) to make their output
 * machine-readable for the next phase.
 *
 * The Markdown artifact is still written; handoff is additive.
 */
export function completeSprintStepWithHandoff(
  projectPath: string,
  step: SprintStep,
  artifactBody: string,
  handoff: AnyHandoff
): { state: SprintState; handoffFile: string } {
  const state = completeSprintStep(projectPath, step, artifactBody);
  const handoffFile = writeHandoff(projectPath, handoff);
  appendEvent(projectPath, {
    type: 'handoff',
    step,
    schema: handoff.schema,
    at: state.updated_at,
  } as any);
  return { state, handoffFile };
}

const SKIP_STUB = (step: SprintStep, at: string): string =>
  `# ${step}\n\n_Skipped via \`cm sprint skip\` at ${at}._\n`;

export function skipSprintStep(projectPath: string, step: SprintStep): SprintState {
  let state = readSprintState(projectPath);
  if (!state) state = initSprint(projectPath);

  if (state.current_index >= state.pipeline.length) {
    throw new Error('Sprint pipeline already finished');
  }

  const expected = state.pipeline[state.current_index];
  if (expected !== step) {
    throw new Error(`Expected step "${expected}", got "${step}"`);
  }

  const at = new Date().toISOString();
  const artFile = path.join(state.artifacts_dir, `${step}.md`);
  fs.writeFileSync(artFile, SKIP_STUB(step, at), 'utf8');

  state.skipped.push(step);
  state.current_index = Math.min(state.current_index + 1, state.pipeline.length);
  state.updated_at = at;
  state.version = 2;
  writeSprintState(projectPath, state);
  appendEvent(projectPath, { type: 'skip', step, at });
  return state;
}

export type SprintResetResult =
  | { ok: true; backupDir?: string }
  | { ok: false; reason: 'no_sprint_data' };

function backupDirName(): string {
  return new Date().toISOString().replace(/:/g, '-');
}

/** Remove sprint state; optional backup under `.cm/sprint/backup/<timestamp>/`. */
export function resetSprint(
  projectPath: string,
  options?: { backup?: boolean }
): SprintResetResult {
  const backup = options?.backup !== false;
  const sd = sprintDir(projectPath);
  const st = statePath(projectPath);
  const ev = eventsPath(projectPath);
  const art = path.join(sd, 'artifacts');

  const hasState = fs.existsSync(st);
  let hasEvents = false;
  if (fs.existsSync(ev)) {
    try {
      hasEvents = fs.statSync(ev).size > 0;
    } catch {
      hasEvents = false;
    }
  }
  let hasArtifacts = false;
  if (fs.existsSync(art)) {
    try {
      hasArtifacts = fs.readdirSync(art).length > 0;
    } catch {
      hasArtifacts = false;
    }
  }

  if (!hasState && !hasEvents && !hasArtifacts) {
    return { ok: false, reason: 'no_sprint_data' };
  }

  let backupPath: string | undefined;
  if (backup) {
    const stamp = backupDirName();
    backupPath = path.join(sd, 'backup', stamp);
    fs.mkdirSync(backupPath, { recursive: true });
    if (hasState) fs.copyFileSync(st, path.join(backupPath, 'state.json'));
    if (fs.existsSync(ev)) fs.copyFileSync(ev, path.join(backupPath, 'events.jsonl'));
    if (fs.existsSync(art)) {
      const destArt = path.join(backupPath, 'artifacts');
      fs.cpSync(art, destArt, { recursive: true });
    }
  }

  fs.rmSync(st, { force: true });
  fs.rmSync(ev, { force: true });
  fs.rmSync(art, { recursive: true, force: true });
  fs.mkdirSync(art, { recursive: true });

  return { ok: true, backupDir: backupPath };
}

export function sprintDryRun(projectPath: string): { steps: SprintStep[]; artifacts: string[] } {
  const state = readSprintState(projectPath) ?? initSprint(projectPath);
  return sprintArtifactPreview(state);
}

/** Read-only preview without creating files (for MCP / status). */
export function sprintArtifactPreviewFromDisk(projectPath: string): {
  steps: SprintStep[];
  artifacts: string[];
} {
  const state = readSprintState(projectPath);
  if (!state) {
    const base = path.join(projectPath, '.cm', 'sprint', 'artifacts');
    const artifacts = SPRINT_STEPS.map((s) => path.join(base, `${s}.md`));
    return { steps: [...SPRINT_STEPS], artifacts };
  }
  return sprintArtifactPreview(state);
}

function sprintArtifactPreview(state: SprintState): { steps: SprintStep[]; artifacts: string[] } {
  const artifacts = state.pipeline.map((s) => path.join(state.artifacts_dir, `${s}.md`));
  return { steps: [...state.pipeline], artifacts };
}

function eventsPath(projectPath: string): string {
  return path.join(sprintDir(projectPath), 'events.jsonl');
}

function appendEvent(projectPath: string, rec: Record<string, unknown>): void {
  ensureSprintDir(projectPath);
  fs.appendFileSync(eventsPath(projectPath), JSON.stringify(rec) + '\n', 'utf8');
}

export function skillMappingForStep(step: SprintStep): string {
  const map: Record<SprintStep, string> = {
    brainstorm: 'cm-brainstorm-idea',
    plan: 'cm-planning',
    design: 'cm-design-system',
    tdd: 'cm-tdd',
    build: 'cm-execution',
    review: 'cm-code-review',
    qa: 'cm-quality-gate',
    security: 'cm-safe-deploy / cm-identity-guard',
    ship: 'cm-safe-deploy',
    monitor: 'cm-canary (post-deploy)',
    retro: 'cm-retro',
  };
  return map[step];
}
