import { test, expect, describe, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  analyzeDependencies,
  buildDependencyGraph,
  detectConflicts,
  adaptBatchSize,
  preFlightCheck,
  initConflictLedger,
  readConflictLedger,
  registerExpectedFiles,
  reportModifiedFiles,
  clearConflictLedger,
} from '../src/parallel-dispatch';
import type { ConflictLedger, ParallelHistory, ParallelTask } from '../src/parallel-dispatch';
import type { Task } from '../src/data';
import {
  compositeAgentPrompt,
  generateMiniGatePrompt,
  validateAgentReport,
  getQualityContractForTask,
} from '../src/parallel-quality';

// ─── Test Helpers ───────────────────────────────────────────────────────────

function createTestTask(overrides: Partial<Task> = {}): Task {
  return {
    id: overrides.id || `task-${Math.random().toString(36).substring(7)}`,
    projectId: 'proj-1',
    title: overrides.title || 'Test Task',
    description: overrides.description || '',
    column: 'backlog',
    order: 0,
    priority: overrides.priority || 'medium',
    agent: 'antigravity',
    skill: 'cm-tdd',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function createParallelTask(overrides: Partial<ParallelTask> = {}): ParallelTask {
  const base = createTestTask(overrides);
  return {
    ...base,
    affectedFiles: overrides.affectedFiles || [],
    batchId: overrides.batchId || 'batch-0',
    qualityContract: overrides.qualityContract || {
      mustPassSyntax: true,
      mustPassTests: true,
      mustSelfReview: true,
      maxModifiedFiles: 10,
      timeoutMs: 300_000,
    },
  };
}

let tempDir: string;

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'parallel-test-'));
  // Create .cm directory
  fs.mkdirSync(path.join(tempDir, '.cm'), { recursive: true });
  fs.mkdirSync(path.join(tempDir, '.cm', 'memory'), { recursive: true });
  // Create minimal CONTINUITY.md
  fs.writeFileSync(path.join(tempDir, '.cm', 'CONTINUITY.md'), '# CodyMaster Working Memory\nLast Updated: test\nCurrent Phase: idle\nCurrent Iteration: 0\nProject: test\n');
});

afterEach(() => {
  fs.rmSync(tempDir, { recursive: true, force: true });
});

// ─── TRIZ #1: Segmentation — Dependency Analysis ───────────────────────────

describe('analyzeDependencies (TRIZ #1: Segmentation)', () => {
  test('extracts file paths from task descriptions', () => {
    const tasks = [
      createTestTask({
        id: 'task-a',
        title: 'Update `src/index.ts` and `src/data.ts`',
        description: 'Modify the main entry point and data layer',
      }),
      createTestTask({
        id: 'task-b',
        title: 'Fix styles',
        description: 'Update `public/styles.css` and `public/app.js`',
      }),
    ];

    const deps = analyzeDependencies(tasks);

    expect(deps.get('task-a')).toContain('src/index.ts');
    expect(deps.get('task-a')).toContain('src/data.ts');
    expect(deps.get('task-b')).toContain('public/styles.css');
    expect(deps.get('task-b')).toContain('public/app.js');
  });

  test('ignores non-code file extensions', () => {
    const tasks = [
      createTestTask({
        id: 'task-c',
        title: 'Update image',
        description: 'Replace `assets/logo.png` and update `src/app.ts`',
      }),
    ];

    const deps = analyzeDependencies(tasks);
    const files = deps.get('task-c') || [];

    expect(files).toContain('src/app.ts');
    expect(files).not.toContain('assets/logo.png');
  });

  test('returns empty array for tasks with no file references', () => {
    const tasks = [
      createTestTask({
        id: 'task-d',
        title: 'Think about architecture',
        description: 'No files mentioned here',
      }),
    ];

    const deps = analyzeDependencies(tasks);
    expect(deps.get('task-d')).toEqual([]);
  });
});

// ─── TRIZ #1: Segmentation — Dependency Graph ──────────────────────────────

describe('buildDependencyGraph (TRIZ #1: Segmentation)', () => {
  test('groups independent tasks into same batch', () => {
    const tasks = [
      createTestTask({ id: 't1', description: 'Modify `src/a.ts`' }),
      createTestTask({ id: 't2', description: 'Modify `src/b.ts`' }),
    ];
    const deps = analyzeDependencies(tasks);
    const graph = buildDependencyGraph(tasks, deps, 5);

    // Independent tasks can be in same batch
    expect(graph.batches.length).toBe(1);
    expect(graph.batches[0].length).toBe(2);
  });

  test('separates dependent tasks into different batches', () => {
    const tasks = [
      createTestTask({ id: 't1', description: 'Modify `src/shared.ts`' }),
      createTestTask({ id: 't2', description: 'Modify `src/shared.ts` and `src/b.ts`' }),
    ];
    const deps = analyzeDependencies(tasks);
    const graph = buildDependencyGraph(tasks, deps, 5);

    // Dependent tasks must be in different batches
    expect(graph.batches.length).toBeGreaterThanOrEqual(2);

    // Verify no batch has both t1 and t2
    for (const batch of graph.batches) {
      const ids = batch.map(t => t.id);
      const hasBoth = ids.includes('t1') && ids.includes('t2');
      expect(hasBoth).toBe(false);
    }
  });

  test('respects batch size limit', () => {
    const tasks = [
      createTestTask({ id: 't1', description: 'Modify `src/a.ts`' }),
      createTestTask({ id: 't2', description: 'Modify `src/b.ts`' }),
      createTestTask({ id: 't3', description: 'Modify `src/c.ts`' }),
      createTestTask({ id: 't4', description: 'Modify `src/d.ts`' }),
    ];
    const deps = analyzeDependencies(tasks);
    const graph = buildDependencyGraph(tasks, deps, 2);

    // With batchSize=2, no batch should exceed 2 tasks
    for (const batch of graph.batches) {
      expect(batch.length).toBeLessThanOrEqual(2);
    }
  });
});

// ─── TRIZ #18: Feedback — Conflict Detection ───────────────────────────────

describe('detectConflicts (TRIZ #18: Feedback)', () => {
  test('catches overlapping modifications', () => {
    const ledger: ConflictLedger = {
      sessionId: 'test',
      startedAt: new Date().toISOString(),
      entries: {
        'task-1': ['src/shared.ts', 'src/a.ts'],
        'task-2': ['src/shared.ts', 'src/b.ts'],
      },
      conflicts: [],
    };

    const conflicts = detectConflicts(ledger);

    expect(conflicts.length).toBe(1);
    expect(conflicts[0].taskA).toBe('task-1');
    expect(conflicts[0].taskB).toBe('task-2');
    expect(conflicts[0].overlappingFiles).toContain('src/shared.ts');
  });

  test('passes when no overlap', () => {
    const ledger: ConflictLedger = {
      sessionId: 'test',
      startedAt: new Date().toISOString(),
      entries: {
        'task-1': ['src/a.ts'],
        'task-2': ['src/b.ts'],
      },
      conflicts: [],
    };

    const conflicts = detectConflicts(ledger);
    expect(conflicts.length).toBe(0);
  });

  test('detects multiple conflicts across multiple agents', () => {
    const ledger: ConflictLedger = {
      sessionId: 'test',
      startedAt: new Date().toISOString(),
      entries: {
        'task-1': ['src/shared.ts', 'src/config.ts'],
        'task-2': ['src/shared.ts'],
        'task-3': ['src/config.ts', 'src/other.ts'],
      },
      conflicts: [],
    };

    const conflicts = detectConflicts(ledger);

    // task-1 conflicts with task-2 (shared.ts) and task-3 (config.ts)
    expect(conflicts.length).toBe(2);
  });
});

// ─── TRIZ #15: Dynamicity — Adaptive Batch Sizing ──────────────────────────

describe('adaptBatchSize (TRIZ #15: Dynamicity)', () => {
  test('returns default size for empty history', () => {
    const history: ParallelHistory = { sessions: [] };
    expect(adaptBatchSize(history)).toBe(2);
  });

  test('scales up after 3 consecutive clean runs', () => {
    const history: ParallelHistory = {
      sessions: [
        { sessionId: '1', startedAt: '', batchSize: 2, totalTasks: 4, conflictCount: 0, successCount: 4 },
        { sessionId: '2', startedAt: '', batchSize: 2, totalTasks: 4, conflictCount: 0, successCount: 4 },
        { sessionId: '3', startedAt: '', batchSize: 2, totalTasks: 4, conflictCount: 0, successCount: 4 },
      ],
    };

    expect(adaptBatchSize(history)).toBe(3); // 2 + 1
  });

  test('scales down after conflict', () => {
    const history: ParallelHistory = {
      sessions: [
        { sessionId: '1', startedAt: '', batchSize: 3, totalTasks: 6, conflictCount: 0, successCount: 6 },
        { sessionId: '2', startedAt: '', batchSize: 3, totalTasks: 6, conflictCount: 1, successCount: 5 },
      ],
    };

    expect(adaptBatchSize(history)).toBe(2); // 3 - 1
  });

  test('never goes below 1', () => {
    const history: ParallelHistory = {
      sessions: [
        { sessionId: '1', startedAt: '', batchSize: 1, totalTasks: 2, conflictCount: 1, successCount: 1 },
      ],
    };

    expect(adaptBatchSize(history)).toBe(1); // min is 1
  });

  test('never exceeds 5', () => {
    const history: ParallelHistory = {
      sessions: Array.from({ length: 20 }, (_, i) => ({
        sessionId: `${i}`,
        startedAt: '',
        batchSize: 5,
        totalTasks: 10,
        conflictCount: 0,
        successCount: 10,
      })),
    };

    expect(adaptBatchSize(history)).toBe(5); // max is 5
  });
});

// ─── TRIZ #10: Prior Action — Pre-flight Check ─────────────────────────────

describe('preFlightCheck (TRIZ #10: Prior Action)', () => {
  test('passes when no existing agents in ledger', () => {
    initConflictLedger(tempDir, 'test-session');

    const batch = [
      createParallelTask({ id: 'new-task', affectedFiles: ['src/a.ts'] }),
    ];

    const result = preFlightCheck(batch, tempDir);
    expect(result.safe).toBe(true);
    expect(result.conflicts).toHaveLength(0);
  });

  test('catches overlap with running agents', () => {
    initConflictLedger(tempDir, 'test-session');
    registerExpectedFiles(tempDir, 'running-task', ['src/shared.ts']);

    const batch = [
      createParallelTask({ id: 'new-task', affectedFiles: ['src/shared.ts'] }),
    ];

    const result = preFlightCheck(batch, tempDir);
    expect(result.safe).toBe(false);
    expect(result.conflicts.length).toBe(1);
    expect(result.conflicts[0].overlappingFiles).toContain('src/shared.ts');
  });
});

// ─── TRIZ #40: Composite — Agent Prompts ────────────────────────────────────

describe('compositeAgentPrompt (TRIZ #40: Composite)', () => {
  test('includes all 3 roles in prompt', () => {
    const task = createParallelTask({
      title: 'Add auth module',
      description: 'Implement JWT auth',
      affectedFiles: ['src/auth.ts'],
    });

    const prompt = compositeAgentPrompt(
      task,
      { name: 'TestProject', path: '/test' },
      { batchId: 'batch-0', batchSize: 2, position: 0 }
    );

    expect(prompt).toContain('Role 1: IMPLEMENTER');
    expect(prompt).toContain('Role 2: TESTER');
    expect(prompt).toContain('Role 3: REVIEWER');
    expect(prompt).toContain('Quality Contract');
    expect(prompt).toContain('src/auth.ts');
  });
});

// ─── TRIZ #3: Local Quality — Mini Gate ─────────────────────────────────────

describe('generateMiniGatePrompt (TRIZ #3: Local Quality)', () => {
  test('includes syntax check when required', () => {
    const task = createParallelTask({ affectedFiles: ['src/test.ts'] });
    const prompt = generateMiniGatePrompt(task, task.qualityContract);

    expect(prompt).toContain('Syntax Validation');
    expect(prompt).toContain('Test Execution');
    expect(prompt).toContain('Self-Review Checklist');
  });
});

describe('validateAgentReport', () => {
  test('passes clean report', () => {
    const result = validateAgentReport(
      {
        taskId: 'task-1',
        passed: true,
        modifiedFiles: ['src/a.ts'],
        testsPassed: 5,
        testsFailed: 0,
        issues: [],
      },
      { mustPassSyntax: true, mustPassTests: true, mustSelfReview: true, maxModifiedFiles: 10, timeoutMs: 300_000 }
    );

    expect(result.passed).toBe(true);
    expect(result.checks.every(c => c.passed)).toBe(true);
  });

  test('fails when too many files modified', () => {
    const result = validateAgentReport(
      {
        taskId: 'task-1',
        passed: true,
        modifiedFiles: Array.from({ length: 15 }, (_, i) => `file${i}.ts`),
        testsPassed: 5,
        testsFailed: 0,
        issues: [],
      },
      { mustPassSyntax: true, mustPassTests: true, mustSelfReview: true, maxModifiedFiles: 10, timeoutMs: 300_000 }
    );

    expect(result.passed).toBe(false);
  });

  test('fails when tests fail', () => {
    const result = validateAgentReport(
      {
        taskId: 'task-1',
        passed: false,
        modifiedFiles: ['src/a.ts'],
        testsPassed: 3,
        testsFailed: 2,
        issues: ['TypeError in auth module'],
      },
      { mustPassSyntax: true, mustPassTests: true, mustSelfReview: true, maxModifiedFiles: 10, timeoutMs: 300_000 }
    );

    expect(result.passed).toBe(false);
  });
});

// ─── Quality Contract Presets ───────────────────────────────────────────────

describe('getQualityContractForTask', () => {
  test('returns stricter contract for urgent tasks', () => {
    const urgentTask = createTestTask({ priority: 'urgent' });
    const contract = getQualityContractForTask(urgentTask);

    expect(contract.maxModifiedFiles).toBe(5);
    expect(contract.timeoutMs).toBe(180_000);
  });

  test('returns standard contract for medium priority', () => {
    const normalTask = createTestTask({ priority: 'medium' });
    const contract = getQualityContractForTask(normalTask);

    expect(contract.maxModifiedFiles).toBe(10);
    expect(contract.timeoutMs).toBe(300_000);
  });
});

// ─── Conflict Ledger Persistence ────────────────────────────────────────────

describe('Conflict Ledger Persistence', () => {
  test('init → register → read → clear lifecycle', () => {
    // Init
    initConflictLedger(tempDir, 'session-1');
    let ledger = readConflictLedger(tempDir);
    expect(ledger.sessionId).toBe('session-1');
    expect(Object.keys(ledger.entries)).toHaveLength(0);

    // Register files
    registerExpectedFiles(tempDir, 'task-a', ['src/a.ts', 'src/b.ts']);
    ledger = readConflictLedger(tempDir);
    expect(ledger.entries['task-a']).toEqual(['src/a.ts', 'src/b.ts']);

    // Report actual files (with potential new ones)
    const conflicts = reportModifiedFiles(tempDir, 'task-b', ['src/c.ts']);
    expect(conflicts).toHaveLength(0);

    // Clear
    clearConflictLedger(tempDir);
    ledger = readConflictLedger(tempDir);
    expect(ledger.sessionId).toBe('');
  });

  test('reportModifiedFiles detects conflicts', () => {
    initConflictLedger(tempDir, 'session-2');
    registerExpectedFiles(tempDir, 'task-a', ['src/shared.ts']);

    const conflicts = reportModifiedFiles(tempDir, 'task-b', ['src/shared.ts']);
    expect(conflicts.length).toBe(1);
    expect(conflicts[0].overlappingFiles).toContain('src/shared.ts');
  });
});
