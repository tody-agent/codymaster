import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { Task, Project } from './data';
import { dispatchTaskToAgent } from './agent-dispatch';
import { getCmDir, ensureCmDir } from './continuity';

// ─── TRIZ Principle Reference ───────────────────────────────────────────────
//
// #1  Segmentation    → analyzeDependencies + buildDependencyGraph
// #3  Local Quality   → Per-agent quality contract (parallel-quality.ts)
// #10 Prior Action    → Pre-flight conflict check before dispatch
// #15 Dynamicity      → Adaptive batch sizing based on conflict history
// #18 Feedback        → Real-time conflict detection via ledger
// #40 Composite       → Agent = implementer + tester + reviewer
//
// ────────────────────────────────────────────────────────────────────────────

// ─── Types ──────────────────────────────────────────────────────────────────

export interface QualityContract {
  mustPassSyntax: boolean;
  mustPassTests: boolean;
  mustSelfReview: boolean;
  maxModifiedFiles: number;
  timeoutMs: number;
}

export interface ParallelTask extends Task {
  affectedFiles: string[];
  batchId: string;
  qualityContract: QualityContract;
}

export interface ConflictEntry {
  taskA: string;
  taskB: string;
  overlappingFiles: string[];
  detectedAt: string;
}

export interface ConflictLedger {
  sessionId: string;
  startedAt: string;
  entries: Record<string, string[]>; // agentTaskId → modifiedFiles
  conflicts: ConflictEntry[];
}

export interface DependencyGraph {
  batches: ParallelTask[][];
  totalTasks: number;
  batchSize: number;
  independentGroups: number;
}

export interface ParallelHistory {
  sessions: ParallelSession[];
}

export interface ParallelSession {
  sessionId: string;
  startedAt: string;
  completedAt?: string;
  batchSize: number;
  totalTasks: number;
  conflictCount: number;
  successCount: number;
}

export interface ParallelDispatchResult {
  success: boolean;
  batchId: string;
  dispatched: string[];
  failed: string[];
  conflicts: ConflictEntry[];
  error?: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const PARALLEL_HISTORY_FILE = 'parallel-history.json';
const PARALLEL_LEDGER_FILE = 'parallel-ledger.json';
const DEFAULT_BATCH_SIZE = 2;
const MIN_BATCH_SIZE = 1;
const MAX_BATCH_SIZE = 5;
const CLEAN_RUNS_TO_SCALE_UP = 3;

const DEFAULT_QUALITY_CONTRACT: QualityContract = {
  mustPassSyntax: true,
  mustPassTests: true,
  mustSelfReview: true,
  maxModifiedFiles: 10,
  timeoutMs: 300_000, // 5 minutes
};

// ─── TRIZ #1: Segmentation — Dependency Analysis ───────────────────────────

/**
 * Analyzes task descriptions to extract file paths that each task will modify.
 * Uses pattern matching on common file path formats.
 *
 * TRIZ Principle #1 (Segmentation): Divide the system into independent parts.
 */
export function analyzeDependencies(tasks: Task[]): Map<string, string[]> {
  const depMap = new Map<string, string[]>();

  // Common file path patterns in task descriptions
  const filePatterns = [
    // Explicit file paths: src/foo/bar.ts, ./components/Button.tsx
    /(?:^|\s|[`"'(])([a-zA-Z0-9_./-]+\.[a-zA-Z]{1,10})(?:\s|[`"')]|$)/g,
    // Backtick-quoted paths: `src/index.ts`
    /`([a-zA-Z0-9_./-]+\.[a-zA-Z]{1,10})`/g,
  ];

  // File extensions we care about
  const codeExtensions = new Set([
    'ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs',
    'json', 'yaml', 'yml', 'toml',
    'css', 'scss', 'less',
    'html', 'vue', 'svelte', 'astro',
    'md', 'mdx',
  ]);

  for (const task of tasks) {
    const searchText = `${task.title}\n${task.description}`;
    const files = new Set<string>();

    for (const pattern of filePatterns) {
      // Reset lastIndex for global regex
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(searchText)) !== null) {
        const filePath = match[1];
        const ext = filePath.split('.').pop()?.toLowerCase() || '';
        if (codeExtensions.has(ext) && !filePath.startsWith('http')) {
          // Normalize path separators
          files.add(filePath.replace(/\\/g, '/'));
        }
      }
    }

    depMap.set(task.id, Array.from(files));
  }

  return depMap;
}

// ─── TRIZ #1: Segmentation — Build Dependency Graph ────────────────────────

/**
 * Groups tasks into independent batches where no two tasks in the same batch
 * modify the same file. Uses greedy graph coloring for optimal grouping.
 *
 * TRIZ Principle #1 (Segmentation): Only truly independent tasks in same batch.
 */
export function buildDependencyGraph(
  tasks: Task[],
  depMap: Map<string, string[]>,
  batchSize: number = DEFAULT_BATCH_SIZE
): DependencyGraph {
  // Build adjacency: two tasks conflict if they share any affected file
  const conflicts = new Map<string, Set<string>>();

  for (const task of tasks) {
    conflicts.set(task.id, new Set());
  }

  for (let i = 0; i < tasks.length; i++) {
    const filesA = new Set(depMap.get(tasks[i].id) || []);
    for (let j = i + 1; j < tasks.length; j++) {
      const filesB = depMap.get(tasks[j].id) || [];
      const overlap = filesB.some(f => filesA.has(f));
      if (overlap) {
        conflicts.get(tasks[i].id)!.add(tasks[j].id);
        conflicts.get(tasks[j].id)!.add(tasks[i].id);
      }
    }
  }

  // Greedy graph coloring → assign each task to a batch
  const batchAssignment = new Map<string, number>();
  let maxBatch = 0;

  // Sort tasks by number of conflicts (most constrained first)
  const sortedTasks = [...tasks].sort((a, b) => {
    const conflictsA = conflicts.get(a.id)?.size || 0;
    const conflictsB = conflicts.get(b.id)?.size || 0;
    return conflictsB - conflictsA;
  });

  for (const task of sortedTasks) {
    const taskConflicts = conflicts.get(task.id)!;

    // Find used batch numbers among conflicting tasks
    const usedBatches = new Set<number>();
    for (const conflictId of taskConflicts) {
      const batch = batchAssignment.get(conflictId);
      if (batch !== undefined) usedBatches.add(batch);
    }

    // Assign to first available batch
    let assigned = 0;
    while (usedBatches.has(assigned)) assigned++;
    batchAssignment.set(task.id, assigned);
    maxBatch = Math.max(maxBatch, assigned);
  }

  // Group into batches, respecting batchSize limit
  const rawBatches: Task[][] = Array.from({ length: maxBatch + 1 }, () => []);
  for (const task of tasks) {
    const batchNum = batchAssignment.get(task.id) || 0;
    rawBatches[batchNum].push(task);
  }

  // Split large batches by batchSize limit
  const finalBatches: ParallelTask[][] = [];
  let batchCounter = 0;

  for (const rawBatch of rawBatches) {
    for (let i = 0; i < rawBatch.length; i += batchSize) {
      const slice = rawBatch.slice(i, i + batchSize);
      const batchId = `batch-${batchCounter++}`;

      const parallelTasks: ParallelTask[] = slice.map(task => ({
        ...task,
        affectedFiles: depMap.get(task.id) || [],
        batchId,
        qualityContract: { ...DEFAULT_QUALITY_CONTRACT },
      }));

      finalBatches.push(parallelTasks);
    }
  }

  return {
    batches: finalBatches,
    totalTasks: tasks.length,
    batchSize,
    independentGroups: maxBatch + 1,
  };
}

// ─── TRIZ #10: Prior Action — Pre-flight Check ─────────────────────────────

/**
 * Checks for potential conflicts BEFORE dispatching a batch.
 * Reads the current conflict ledger and ensures no overlap with running agents.
 *
 * TRIZ Principle #10 (Prior Action): Place objects before they are needed.
 */
export function preFlightCheck(
  batch: ParallelTask[],
  projectPath: string
): { safe: boolean; conflicts: ConflictEntry[] } {
  const ledger = readConflictLedger(projectPath);
  const detectedConflicts: ConflictEntry[] = [];

  // Check against already-running agents
  for (const task of batch) {
    for (const [existingTaskId, existingFiles] of Object.entries(ledger.entries)) {
      const overlap = task.affectedFiles.filter(f => existingFiles.includes(f));
      if (overlap.length > 0) {
        detectedConflicts.push({
          taskA: existingTaskId,
          taskB: task.id,
          overlappingFiles: overlap,
          detectedAt: new Date().toISOString(),
        });
      }
    }
  }

  return {
    safe: detectedConflicts.length === 0,
    conflicts: detectedConflicts,
  };
}

// ─── TRIZ #18: Feedback — Conflict Detection ───────────────────────────────

/**
 * Detects conflicts in the conflict ledger after agents report their modified files.
 *
 * TRIZ Principle #18 (Mechanical Vibration / Feedback):
 * If an action is insufficient, use periodic/feedback-driven correction.
 */
export function detectConflicts(ledger: ConflictLedger): ConflictEntry[] {
  const conflicts: ConflictEntry[] = [];
  const entries = Object.entries(ledger.entries);

  for (let i = 0; i < entries.length; i++) {
    const [taskIdA, filesA] = entries[i];
    const setA = new Set(filesA);

    for (let j = i + 1; j < entries.length; j++) {
      const [taskIdB, filesB] = entries[j];
      const overlap = filesB.filter(f => setA.has(f));

      if (overlap.length > 0) {
        conflicts.push({
          taskA: taskIdA,
          taskB: taskIdB,
          overlappingFiles: overlap,
          detectedAt: new Date().toISOString(),
        });
      }
    }
  }

  return conflicts;
}

// ─── TRIZ #15: Dynamicity — Adaptive Batch Sizing ──────────────────────────

/**
 * Adapts batch size based on conflict history.
 * - 3 clean runs → increase batch size by 1 (max 5)
 * - Any conflict → decrease by 1 (min 1)
 *
 * TRIZ Principle #15 (Dynamicity): Allow characteristics to change
 * to be optimal at each stage.
 */
export function adaptBatchSize(history: ParallelHistory): number {
  const sessions = history.sessions;

  if (sessions.length === 0) return DEFAULT_BATCH_SIZE;

  const lastSession = sessions[sessions.length - 1];

  // If last session had conflicts → decrease
  if (lastSession.conflictCount > 0) {
    return Math.max(MIN_BATCH_SIZE, lastSession.batchSize - 1);
  }

  // Count consecutive clean sessions
  let cleanCount = 0;
  for (let i = sessions.length - 1; i >= 0; i--) {
    if (sessions[i].conflictCount === 0) {
      cleanCount++;
    } else {
      break;
    }
  }

  // 3+ clean → scale up
  if (cleanCount >= CLEAN_RUNS_TO_SCALE_UP) {
    return Math.min(MAX_BATCH_SIZE, lastSession.batchSize + 1);
  }

  return lastSession.batchSize;
}

// ─── Dispatch Parallel Batch ────────────────────────────────────────────────

/**
 * Dispatches a batch of independent tasks in parallel.
 * Each task gets its own .agent-tasks file with parallel context.
 */
export function dispatchParallelBatch(
  batch: ParallelTask[],
  project: Project,
  force: boolean = false
): ParallelDispatchResult {
  const batchId = batch[0]?.batchId || `batch-${crypto.randomUUID().substring(0, 8)}`;
  const dispatched: string[] = [];
  const failed: string[] = [];

  // TRIZ #10: Pre-flight check
  const preflight = preFlightCheck(batch, project.path);
  if (!preflight.safe) {
    return {
      success: false,
      batchId,
      dispatched: [],
      failed: batch.map(t => t.id),
      conflicts: preflight.conflicts,
      error: `Pre-flight check failed: ${preflight.conflicts.length} potential conflict(s) detected`,
    };
  }

  // Initialize conflict ledger for this batch
  initConflictLedger(project.path, batchId);

  // Dispatch each task
  for (const task of batch) {
    // Register expected files in the ledger BEFORE dispatch
    registerExpectedFiles(project.path, task.id, task.affectedFiles);

    const result = dispatchTaskToAgent(task, project, force);
    if (result.success) {
      dispatched.push(task.id);
    } else {
      failed.push(task.id);
    }
  }

  return {
    success: failed.length === 0,
    batchId,
    dispatched,
    failed,
    conflicts: [],
  };
}

// ─── Conflict Ledger Persistence ────────────────────────────────────────────

function getLedgerPath(projectPath: string): string {
  return path.join(getCmDir(projectPath), PARALLEL_LEDGER_FILE);
}

export function initConflictLedger(projectPath: string, sessionId: string): void {
  ensureCmDir(projectPath);
  const ledger: ConflictLedger = {
    sessionId,
    startedAt: new Date().toISOString(),
    entries: {},
    conflicts: [],
  };
  fs.writeFileSync(getLedgerPath(projectPath), JSON.stringify(ledger, null, 2));
}

export function readConflictLedger(projectPath: string): ConflictLedger {
  const ledgerPath = getLedgerPath(projectPath);
  try {
    if (fs.existsSync(ledgerPath)) {
      return JSON.parse(fs.readFileSync(ledgerPath, 'utf-8'));
    }
  } catch { /* empty */ }
  return { sessionId: '', startedAt: '', entries: {}, conflicts: [] };
}

export function registerExpectedFiles(
  projectPath: string,
  taskId: string,
  files: string[]
): void {
  const ledger = readConflictLedger(projectPath);
  ledger.entries[taskId] = files;
  fs.writeFileSync(getLedgerPath(projectPath), JSON.stringify(ledger, null, 2));
}

export function reportModifiedFiles(
  projectPath: string,
  taskId: string,
  actualFiles: string[]
): ConflictEntry[] {
  const ledger = readConflictLedger(projectPath);
  ledger.entries[taskId] = actualFiles;

  // Detect conflicts after update
  const conflicts = detectConflicts(ledger);
  ledger.conflicts = conflicts;

  fs.writeFileSync(getLedgerPath(projectPath), JSON.stringify(ledger, null, 2));
  return conflicts;
}

export function clearConflictLedger(projectPath: string): void {
  const ledgerPath = getLedgerPath(projectPath);
  if (fs.existsSync(ledgerPath)) {
    fs.unlinkSync(ledgerPath);
  }
}

// ─── Parallel History Persistence ───────────────────────────────────────────

function getHistoryPath(projectPath: string): string {
  return path.join(getCmDir(projectPath), PARALLEL_HISTORY_FILE);
}

export function readParallelHistory(projectPath: string): ParallelHistory {
  const historyPath = getHistoryPath(projectPath);
  try {
    if (fs.existsSync(historyPath)) {
      return JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
    }
  } catch { /* empty */ }
  return { sessions: [] };
}

export function recordParallelSession(
  projectPath: string,
  session: ParallelSession
): void {
  ensureCmDir(projectPath);
  const history = readParallelHistory(projectPath);
  history.sessions.push(session);

  // Keep max 50 sessions
  if (history.sessions.length > 50) {
    history.sessions = history.sessions.slice(-50);
  }

  fs.writeFileSync(getHistoryPath(projectPath), JSON.stringify(history, null, 2));
}
