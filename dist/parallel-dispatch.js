"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeDependencies = analyzeDependencies;
exports.buildDependencyGraph = buildDependencyGraph;
exports.preFlightCheck = preFlightCheck;
exports.detectConflicts = detectConflicts;
exports.adaptBatchSize = adaptBatchSize;
exports.dispatchParallelBatch = dispatchParallelBatch;
exports.initConflictLedger = initConflictLedger;
exports.readConflictLedger = readConflictLedger;
exports.registerExpectedFiles = registerExpectedFiles;
exports.reportModifiedFiles = reportModifiedFiles;
exports.clearConflictLedger = clearConflictLedger;
exports.readParallelHistory = readParallelHistory;
exports.recordParallelSession = recordParallelSession;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const agent_dispatch_1 = require("./agent-dispatch");
const continuity_1 = require("./continuity");
// ─── Constants ──────────────────────────────────────────────────────────────
const PARALLEL_HISTORY_FILE = 'parallel-history.json';
const PARALLEL_LEDGER_FILE = 'parallel-ledger.json';
const DEFAULT_BATCH_SIZE = 2;
const MIN_BATCH_SIZE = 1;
const MAX_BATCH_SIZE = 5;
const CLEAN_RUNS_TO_SCALE_UP = 3;
const DEFAULT_QUALITY_CONTRACT = {
    mustPassSyntax: true,
    mustPassTests: true,
    mustSelfReview: true,
    maxModifiedFiles: 10,
    timeoutMs: 300000, // 5 minutes
};
// ─── TRIZ #1: Segmentation — Dependency Analysis ───────────────────────────
/**
 * Analyzes task descriptions to extract file paths that each task will modify.
 * Uses pattern matching on common file path formats.
 *
 * TRIZ Principle #1 (Segmentation): Divide the system into independent parts.
 */
function analyzeDependencies(tasks) {
    var _a;
    const depMap = new Map();
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
        const files = new Set();
        for (const pattern of filePatterns) {
            // Reset lastIndex for global regex
            pattern.lastIndex = 0;
            let match;
            while ((match = pattern.exec(searchText)) !== null) {
                const filePath = match[1];
                const ext = ((_a = filePath.split('.').pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || '';
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
function buildDependencyGraph(tasks, depMap, batchSize = DEFAULT_BATCH_SIZE) {
    // Build adjacency: two tasks conflict if they share any affected file
    const conflicts = new Map();
    for (const task of tasks) {
        conflicts.set(task.id, new Set());
    }
    for (let i = 0; i < tasks.length; i++) {
        const filesA = new Set(depMap.get(tasks[i].id) || []);
        for (let j = i + 1; j < tasks.length; j++) {
            const filesB = depMap.get(tasks[j].id) || [];
            const overlap = filesB.some(f => filesA.has(f));
            if (overlap) {
                conflicts.get(tasks[i].id).add(tasks[j].id);
                conflicts.get(tasks[j].id).add(tasks[i].id);
            }
        }
    }
    // Greedy graph coloring → assign each task to a batch
    const batchAssignment = new Map();
    let maxBatch = 0;
    // Sort tasks by number of conflicts (most constrained first)
    const sortedTasks = [...tasks].sort((a, b) => {
        var _a, _b;
        const conflictsA = ((_a = conflicts.get(a.id)) === null || _a === void 0 ? void 0 : _a.size) || 0;
        const conflictsB = ((_b = conflicts.get(b.id)) === null || _b === void 0 ? void 0 : _b.size) || 0;
        return conflictsB - conflictsA;
    });
    for (const task of sortedTasks) {
        const taskConflicts = conflicts.get(task.id);
        // Find used batch numbers among conflicting tasks
        const usedBatches = new Set();
        for (const conflictId of taskConflicts) {
            const batch = batchAssignment.get(conflictId);
            if (batch !== undefined)
                usedBatches.add(batch);
        }
        // Assign to first available batch
        let assigned = 0;
        while (usedBatches.has(assigned))
            assigned++;
        batchAssignment.set(task.id, assigned);
        maxBatch = Math.max(maxBatch, assigned);
    }
    // Group into batches, respecting batchSize limit
    const rawBatches = Array.from({ length: maxBatch + 1 }, () => []);
    for (const task of tasks) {
        const batchNum = batchAssignment.get(task.id) || 0;
        rawBatches[batchNum].push(task);
    }
    // Split large batches by batchSize limit
    const finalBatches = [];
    let batchCounter = 0;
    for (const rawBatch of rawBatches) {
        for (let i = 0; i < rawBatch.length; i += batchSize) {
            const slice = rawBatch.slice(i, i + batchSize);
            const batchId = `batch-${batchCounter++}`;
            const parallelTasks = slice.map(task => (Object.assign(Object.assign({}, task), { affectedFiles: depMap.get(task.id) || [], batchId, qualityContract: Object.assign({}, DEFAULT_QUALITY_CONTRACT) })));
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
function preFlightCheck(batch, projectPath) {
    const ledger = readConflictLedger(projectPath);
    const detectedConflicts = [];
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
function detectConflicts(ledger) {
    const conflicts = [];
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
function adaptBatchSize(history) {
    const sessions = history.sessions;
    if (sessions.length === 0)
        return DEFAULT_BATCH_SIZE;
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
        }
        else {
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
function dispatchParallelBatch(batch, project, force = false) {
    var _a;
    const batchId = ((_a = batch[0]) === null || _a === void 0 ? void 0 : _a.batchId) || `batch-${crypto_1.default.randomUUID().substring(0, 8)}`;
    const dispatched = [];
    const failed = [];
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
        const result = (0, agent_dispatch_1.dispatchTaskToAgent)(task, project, force);
        if (result.success) {
            dispatched.push(task.id);
        }
        else {
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
function getLedgerPath(projectPath) {
    return path_1.default.join((0, continuity_1.getCmDir)(projectPath), PARALLEL_LEDGER_FILE);
}
function initConflictLedger(projectPath, sessionId) {
    (0, continuity_1.ensureCmDir)(projectPath);
    const ledger = {
        sessionId,
        startedAt: new Date().toISOString(),
        entries: {},
        conflicts: [],
    };
    fs_1.default.writeFileSync(getLedgerPath(projectPath), JSON.stringify(ledger, null, 2));
}
function readConflictLedger(projectPath) {
    const ledgerPath = getLedgerPath(projectPath);
    try {
        if (fs_1.default.existsSync(ledgerPath)) {
            return JSON.parse(fs_1.default.readFileSync(ledgerPath, 'utf-8'));
        }
    }
    catch ( /* empty */_a) { /* empty */ }
    return { sessionId: '', startedAt: '', entries: {}, conflicts: [] };
}
function registerExpectedFiles(projectPath, taskId, files) {
    const ledger = readConflictLedger(projectPath);
    ledger.entries[taskId] = files;
    fs_1.default.writeFileSync(getLedgerPath(projectPath), JSON.stringify(ledger, null, 2));
}
function reportModifiedFiles(projectPath, taskId, actualFiles) {
    const ledger = readConflictLedger(projectPath);
    ledger.entries[taskId] = actualFiles;
    // Detect conflicts after update
    const conflicts = detectConflicts(ledger);
    ledger.conflicts = conflicts;
    fs_1.default.writeFileSync(getLedgerPath(projectPath), JSON.stringify(ledger, null, 2));
    return conflicts;
}
function clearConflictLedger(projectPath) {
    const ledgerPath = getLedgerPath(projectPath);
    if (fs_1.default.existsSync(ledgerPath)) {
        fs_1.default.unlinkSync(ledgerPath);
    }
}
// ─── Parallel History Persistence ───────────────────────────────────────────
function getHistoryPath(projectPath) {
    return path_1.default.join((0, continuity_1.getCmDir)(projectPath), PARALLEL_HISTORY_FILE);
}
function readParallelHistory(projectPath) {
    const historyPath = getHistoryPath(projectPath);
    try {
        if (fs_1.default.existsSync(historyPath)) {
            return JSON.parse(fs_1.default.readFileSync(historyPath, 'utf-8'));
        }
    }
    catch ( /* empty */_a) { /* empty */ }
    return { sessions: [] };
}
function recordParallelSession(projectPath, session) {
    (0, continuity_1.ensureCmDir)(projectPath);
    const history = readParallelHistory(projectPath);
    history.sessions.push(session);
    // Keep max 50 sessions
    if (history.sessions.length > 50) {
        history.sessions = history.sessions.slice(-50);
    }
    fs_1.default.writeFileSync(getHistoryPath(projectPath), JSON.stringify(history, null, 2));
}
