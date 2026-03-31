import fs from 'fs';
import path from 'path';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SkillOutput {
  output_path?: string;
  summary?: string;
  affected_files?: string[];
  metadata?: Record<string, unknown>;
}

export interface ResourceState {
  skeleton_generated: string | null;
  learnings_indexed: string | null;
  codegraph_indexed: string | null;
  qmd_synced: string | null;
}

export interface ContextBus {
  version: '1.0';
  session_id: string;
  pipeline: string;
  current_step: string;
  started_at: string;
  updated_at: string;
  shared_context: Record<string, SkillOutput>;
  resource_state: ResourceState;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const CM_DIR = '.cm';
const BUS_FILE = 'context-bus.json';

function getBusPath(projectPath: string): string {
  return path.join(projectPath, CM_DIR, BUS_FILE);
}

// ─── Init ───────────────────────────────────────────────────────────────────

export function initBus(
  projectPath: string,
  pipeline: string,
  sessionId: string
): ContextBus {
  const now = new Date().toISOString();
  const bus: ContextBus = {
    version: '1.0',
    session_id: sessionId,
    pipeline,
    current_step: '',
    started_at: now,
    updated_at: now,
    shared_context: {},
    resource_state: {
      skeleton_generated: null,
      learnings_indexed: null,
      codegraph_indexed: null,
      qmd_synced: null,
    },
  };

  writeBus(projectPath, bus);
  return bus;
}

// ─── Read ───────────────────────────────────────────────────────────────────

export function readBus(projectPath: string): ContextBus | null {
  const busPath = getBusPath(projectPath);
  if (!fs.existsSync(busPath)) return null;

  try {
    return JSON.parse(fs.readFileSync(busPath, 'utf-8')) as ContextBus;
  } catch {
    return null;
  }
}

// ─── Write ──────────────────────────────────────────────────────────────────

export function writeBus(projectPath: string, bus: ContextBus): void {
  const busPath = getBusPath(projectPath);
  const dir = path.dirname(busPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(busPath, JSON.stringify(bus, null, 2), 'utf-8');
}

// ─── Update Step ────────────────────────────────────────────────────────────

export function updateBusStep(
  projectPath: string,
  skill: string,
  output: SkillOutput
): void {
  const bus = readBus(projectPath);
  if (!bus) {
    throw new Error(
      `Context bus not initialized at ${projectPath}. Call initBus() first.`
    );
  }

  bus.current_step = skill;
  bus.updated_at = new Date().toISOString();
  bus.shared_context[skill] = output;

  writeBus(projectPath, bus);
}
