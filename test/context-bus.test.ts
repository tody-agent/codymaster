import { test, expect, describe, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  initBus,
  readBus,
  writeBus,
  updateBusStep,
} from '../src/context-bus';
import type { ContextBus } from '../src/context-bus';

// ─── Test Helpers ───────────────────────────────────────────────────────────

let tempDir: string;

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'context-bus-test-'));
  fs.mkdirSync(path.join(tempDir, '.cm'), { recursive: true });
});

afterEach(() => {
  fs.rmSync(tempDir, { recursive: true, force: true });
});

// ─── Init ───────────────────────────────────────────────────────────────────

describe('initBus', () => {
  test('creates context-bus.json with correct structure', () => {
    const bus = initBus(tempDir, 'feature-development', 'session-001');

    expect(bus.version).toBe('1.0');
    expect(bus.session_id).toBe('session-001');
    expect(bus.pipeline).toBe('feature-development');
    expect(bus.current_step).toBe('');
    expect(bus.shared_context).toEqual({});
    expect(bus.resource_state).toBeDefined();

    // File should exist on disk
    const filePath = path.join(tempDir, '.cm', 'context-bus.json');
    expect(fs.existsSync(filePath)).toBe(true);
  });

  test('initializes resource_state with null timestamps', () => {
    const bus = initBus(tempDir, 'bug-fix', 'session-002');

    expect(bus.resource_state.skeleton_generated).toBeNull();
    expect(bus.resource_state.learnings_indexed).toBeNull();
    expect(bus.resource_state.codegraph_indexed).toBeNull();
    expect(bus.resource_state.qmd_synced).toBeNull();
  });

  test('sets started_at and updated_at to ISO timestamps', () => {
    const before = new Date().toISOString();
    const bus = initBus(tempDir, 'feature-development', 'session-003');
    const after = new Date().toISOString();

    expect(bus.started_at >= before).toBe(true);
    expect(bus.updated_at <= after).toBe(true);
  });
});

// ─── Read/Write Roundtrip ───────────────────────────────────────────────────

describe('readBus / writeBus', () => {
  test('reads back what was written', () => {
    const bus = initBus(tempDir, 'feature-development', 'session-004');
    bus.current_step = 'cm-planning';
    bus.shared_context['cm-brainstorm-idea'] = {
      output_path: 'openspec/changes/test/proposal.md',
      summary: 'Evaluated 3 options, recommended Option C',
    };
    writeBus(tempDir, bus);

    const loaded = readBus(tempDir);

    expect(loaded).not.toBeNull();
    expect(loaded!.current_step).toBe('cm-planning');
    expect(loaded!.shared_context['cm-brainstorm-idea']?.summary).toContain('Option C');
  });

  test('returns null when no bus file exists', () => {
    const loaded = readBus(tempDir);
    expect(loaded).toBeNull();
  });

  test('preserves all fields through write/read cycle', () => {
    const bus: ContextBus = {
      version: '1.0',
      session_id: 'roundtrip-test',
      pipeline: 'new-project',
      current_step: 'cm-execution',
      started_at: '2026-03-30T10:00:00Z',
      updated_at: '2026-03-30T12:00:00Z',
      shared_context: {
        'cm-planning': {
          output_path: 'openspec/changes/test/tasks.md',
          summary: 'Created 20 tasks',
          affected_files: ['src/auth.ts', 'src/api.ts'],
          metadata: { task_count: 20 },
        },
      },
      resource_state: {
        skeleton_generated: '2026-03-30T10:00:00Z',
        learnings_indexed: '2026-03-30T10:00:00Z',
        codegraph_indexed: null,
        qmd_synced: null,
      },
    };

    writeBus(tempDir, bus);
    const loaded = readBus(tempDir)!;

    expect(loaded.version).toBe('1.0');
    expect(loaded.session_id).toBe('roundtrip-test');
    expect(loaded.pipeline).toBe('new-project');
    expect(loaded.shared_context['cm-planning']?.affected_files).toEqual(['src/auth.ts', 'src/api.ts']);
    expect(loaded.resource_state.skeleton_generated).toBe('2026-03-30T10:00:00Z');
    expect(loaded.resource_state.codegraph_indexed).toBeNull();
  });
});

// ─── Update Step ────────────────────────────────────────────────────────────

describe('updateBusStep', () => {
  test('adds skill output to shared_context', () => {
    initBus(tempDir, 'feature-development', 'session-005');

    updateBusStep(tempDir, 'cm-brainstorm-idea', {
      output_path: 'openspec/changes/spine/proposal.md',
      summary: 'Recommended Smart Spine approach',
      affected_files: [],
    });

    const bus = readBus(tempDir)!;
    expect(bus.shared_context['cm-brainstorm-idea']).toBeDefined();
    expect(bus.shared_context['cm-brainstorm-idea']?.summary).toContain('Smart Spine');
    expect(bus.current_step).toBe('cm-brainstorm-idea');
  });

  test('updates updated_at timestamp', () => {
    const bus = initBus(tempDir, 'feature-development', 'session-006');
    const originalUpdated = bus.updated_at;

    // Small delay to ensure different timestamp
    updateBusStep(tempDir, 'cm-tdd', {
      summary: 'Wrote 15 tests',
    });

    const loaded = readBus(tempDir)!;
    expect(loaded.updated_at >= originalUpdated).toBe(true);
  });

  test('preserves previous skill outputs when adding new one', () => {
    initBus(tempDir, 'feature-development', 'session-007');

    updateBusStep(tempDir, 'cm-brainstorm-idea', {
      summary: 'Step 1 done',
    });
    updateBusStep(tempDir, 'cm-planning', {
      summary: 'Step 2 done',
    });

    const bus = readBus(tempDir)!;
    expect(bus.shared_context['cm-brainstorm-idea']?.summary).toBe('Step 1 done');
    expect(bus.shared_context['cm-planning']?.summary).toBe('Step 2 done');
  });

  test('overwrites output for same skill name', () => {
    initBus(tempDir, 'feature-development', 'session-008');

    updateBusStep(tempDir, 'cm-execution', { summary: 'First attempt' });
    updateBusStep(tempDir, 'cm-execution', { summary: 'Retry succeeded' });

    const bus = readBus(tempDir)!;
    expect(bus.shared_context['cm-execution']?.summary).toBe('Retry succeeded');
  });

  test('throws when bus not initialized', () => {
    expect(() => {
      updateBusStep(tempDir, 'cm-tdd', { summary: 'test' });
    }).toThrow();
  });
});
