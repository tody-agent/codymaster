"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCmDir = getCmDir;
exports.ensureCmDir = ensureCmDir;
exports.readContinuityState = readContinuityState;
exports.writeContinuityMd = writeContinuityMd;
exports.addLearning = addLearning;
exports.getLearnings = getLearnings;
exports.deleteLearning = deleteLearning;
exports.addDecision = addDecision;
exports.getDecisions = getDecisions;
exports.deleteDecision = deleteDecision;
exports.getContinuityStatus = getContinuityStatus;
exports.resetContinuity = resetContinuity;
exports.hasCmDir = hasCmDir;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
// ─── Constants ──────────────────────────────────────────────────────────────
const CM_DIR = '.cm';
const CONTINUITY_FILE = 'CONTINUITY.md';
const LEARNINGS_FILE = 'memory/learnings.json';
const DECISIONS_FILE = 'memory/decisions.json';
const CONFIG_FILE = 'config.yaml';
// ─── Directory Management ───────────────────────────────────────────────────
function getCmDir(projectPath) {
    return path_1.default.join(projectPath, CM_DIR);
}
function ensureCmDir(projectPath) {
    const cmDir = getCmDir(projectPath);
    const memoryDir = path_1.default.join(cmDir, 'memory');
    if (!fs_1.default.existsSync(cmDir)) {
        fs_1.default.mkdirSync(cmDir, { recursive: true });
    }
    if (!fs_1.default.existsSync(memoryDir)) {
        fs_1.default.mkdirSync(memoryDir, { recursive: true });
    }
    // Initialize files if they don't exist
    const continuityPath = path_1.default.join(cmDir, CONTINUITY_FILE);
    if (!fs_1.default.existsSync(continuityPath)) {
        writeContinuityMd(projectPath, createDefaultState(path_1.default.basename(projectPath)));
    }
    const learningsPath = path_1.default.join(cmDir, LEARNINGS_FILE);
    if (!fs_1.default.existsSync(learningsPath)) {
        fs_1.default.writeFileSync(learningsPath, JSON.stringify([], null, 2));
    }
    const decisionsPath = path_1.default.join(cmDir, DECISIONS_FILE);
    if (!fs_1.default.existsSync(decisionsPath)) {
        fs_1.default.writeFileSync(decisionsPath, JSON.stringify([], null, 2));
    }
    const configPath = path_1.default.join(cmDir, CONFIG_FILE);
    if (!fs_1.default.existsSync(configPath)) {
        fs_1.default.writeFileSync(configPath, generateDefaultConfig());
    }
    // Add .cm to .gitignore if not already there
    const gitignorePath = path_1.default.join(projectPath, '.gitignore');
    if (fs_1.default.existsSync(gitignorePath)) {
        const content = fs_1.default.readFileSync(gitignorePath, 'utf-8');
        if (!content.includes('.cm/')) {
            fs_1.default.appendFileSync(gitignorePath, '\n# CodyMaster working memory\n.cm/\n');
        }
    }
}
// ─── Default State ──────────────────────────────────────────────────────────
function createDefaultState(projectName) {
    return {
        lastUpdated: new Date().toISOString(),
        currentPhase: 'idle',
        currentIteration: 0,
        project: projectName,
        activeGoal: '',
        currentTask: null,
        justCompleted: [],
        nextActions: [],
        activeBlockers: [],
        keyDecisions: [],
        learnings: [],
        workingContext: '',
        filesModified: [],
    };
}
function generateDefaultConfig() {
    return `# CodyMaster Working Memory Configuration
# Inspired by Loki Mode (autonomi.dev)

rarv:
  max_retries: 3              # Max retry per task before marking blocked
  pre_act_attention: true     # Enable goal alignment check before every action
  self_correction: true       # Enable self-correction loop on verify failure

memory:
  max_learnings: 50           # Max learnings to keep in CONTINUITY.md (rotate to learnings.json)
  max_just_completed: 5       # Max recent completions to show
  max_decisions: 20           # Max decisions before archiving

quality:
  velocity_quality_tracking: true  # Track warnings/complexity over time
  blind_review: false              # Enable blind code review (Phase 2)
  anti_sycophancy: false           # Enable anti-sycophancy check (Phase 2)
`;
}
// ─── CONTINUITY.md Read/Write ───────────────────────────────────────────────
function readContinuityState(projectPath) {
    const filePath = path_1.default.join(getCmDir(projectPath), CONTINUITY_FILE);
    if (!fs_1.default.existsSync(filePath))
        return null;
    try {
        const content = fs_1.default.readFileSync(filePath, 'utf-8');
        return parseContinuityMd(content);
    }
    catch (_a) {
        return null;
    }
}
function parseContinuityMd(content) {
    const state = createDefaultState('');
    // Parse Last Updated
    const updatedMatch = content.match(/Last Updated:\s*(.+)/);
    if (updatedMatch)
        state.lastUpdated = updatedMatch[1].trim();
    // Parse Current Phase
    const phaseMatch = content.match(/Current Phase:\s*(.+)/);
    if (phaseMatch)
        state.currentPhase = phaseMatch[1].trim();
    // Parse Current Iteration
    const iterMatch = content.match(/Current Iteration:\s*(\d+)/);
    if (iterMatch)
        state.currentIteration = parseInt(iterMatch[1]);
    // Parse Project
    const projMatch = content.match(/Project:\s*(.+)/);
    if (projMatch)
        state.project = projMatch[1].trim();
    // Parse Active Goal
    const goalSection = extractSection(content, 'Active Goal');
    if (goalSection)
        state.activeGoal = goalSection.trim();
    // Parse Just Completed
    const completedSection = extractSection(content, 'Just Completed');
    if (completedSection) {
        state.justCompleted = completedSection.split('\n')
            .map(l => l.replace(/^[-*]\s*/, '').trim())
            .filter(l => l.length > 0);
    }
    // Parse Next Actions
    const nextSection = extractSection(content, 'Next Actions');
    if (nextSection) {
        state.nextActions = nextSection.split('\n')
            .map(l => l.replace(/^\d+\.\s*/, '').trim())
            .filter(l => l.length > 0);
    }
    // Parse Active Blockers
    const blockersSection = extractSection(content, 'Active Blockers');
    if (blockersSection) {
        state.activeBlockers = blockersSection.split('\n')
            .map(l => l.replace(/^[-*]\s*/, '').trim())
            .filter(l => l.length > 0);
    }
    // Parse Working Context
    const contextSection = extractSection(content, 'Working Context');
    if (contextSection)
        state.workingContext = contextSection.trim();
    return state;
}
function extractSection(content, heading) {
    const regex = new RegExp(`## ${heading}[^\\n]*\\n([\\s\\S]*?)(?=\\n## |$)`);
    const match = content.match(regex);
    return match ? match[1].trim() : null;
}
function writeContinuityMd(projectPath, state) {
    const filePath = path_1.default.join(getCmDir(projectPath), CONTINUITY_FILE);
    state.lastUpdated = new Date().toISOString();
    const content = `# CodyMaster Working Memory
Last Updated: ${state.lastUpdated}
Current Phase: ${state.currentPhase}
Current Iteration: ${state.currentIteration}
Project: ${state.project}

## Active Goal
${state.activeGoal || '[No active goal set]'}

## Current Task
${state.currentTask
        ? `- ID: ${state.currentTask.id}\n- Title: ${state.currentTask.title}\n- Status: ${state.currentTask.status}\n- Skill: ${state.currentTask.skill}\n- Started: ${state.currentTask.started}`
        : '[No active task]'}

## Just Completed
${state.justCompleted.length > 0
        ? state.justCompleted.map(c => `- ${c}`).join('\n')
        : '- [Nothing yet]'}

## Next Actions (Priority Order)
${state.nextActions.length > 0
        ? state.nextActions.map((a, i) => `${i + 1}. ${a}`).join('\n')
        : '1. [No actions planned]'}

## Active Blockers
${state.activeBlockers.length > 0
        ? state.activeBlockers.map(b => `- ${b}`).join('\n')
        : '- [No blockers]'}

## Key Decisions This Session
${state.keyDecisions.length > 0
        ? state.keyDecisions.map(d => `- ${d.decision}: ${d.rationale} — ${d.timestamp}`).join('\n')
        : '- [No decisions recorded]'}

## Mistakes & Learnings
${state.learnings.length > 0
        ? state.learnings.map(l => `
### ${l.whatFailed}
- **What Failed:** ${l.whatFailed}
- **Why It Failed:** ${l.whyFailed}
- **How to Prevent:** ${l.howToPrevent}
- **Timestamp:** ${l.timestamp}
- **Agent:** ${l.agent}
- **Task:** ${l.taskId}
`).join('\n')
        : '[No learnings yet — this is good!]'}

## Working Context
${state.workingContext || '[No additional context]'}

## Files Currently Being Modified
${state.filesModified.length > 0
        ? state.filesModified.map(f => `- ${f.path}: ${f.change}`).join('\n')
        : '- [No files being modified]'}
`;
    fs_1.default.writeFileSync(filePath, content, 'utf-8');
}
// ─── Learnings Management ───────────────────────────────────────────────────
function addLearning(projectPath, learning) {
    const fullLearning = Object.assign(Object.assign({}, learning), { id: crypto_1.default.randomUUID() });
    // Add to CONTINUITY.md
    const state = readContinuityState(projectPath);
    if (state) {
        state.learnings.push(fullLearning);
        // Keep max 10 in CONTINUITY.md (rotate old to learnings.json)
        if (state.learnings.length > 10) {
            const archived = state.learnings.splice(0, state.learnings.length - 10);
            archiveLearnings(projectPath, archived);
        }
        writeContinuityMd(projectPath, state);
    }
    // Also add to persistent learnings.json
    const learningsPath = path_1.default.join(getCmDir(projectPath), LEARNINGS_FILE);
    let learnings = [];
    try {
        learnings = JSON.parse(fs_1.default.readFileSync(learningsPath, 'utf-8'));
    }
    catch ( /* empty */_a) { /* empty */ }
    learnings.push(fullLearning);
    fs_1.default.writeFileSync(learningsPath, JSON.stringify(learnings, null, 2));
    return fullLearning;
}
function archiveLearnings(projectPath, learnings) {
    const learningsPath = path_1.default.join(getCmDir(projectPath), LEARNINGS_FILE);
    let existing = [];
    try {
        existing = JSON.parse(fs_1.default.readFileSync(learningsPath, 'utf-8'));
    }
    catch ( /* empty */_a) { /* empty */ }
    existing.push(...learnings);
    // Keep max 200 archived learnings
    if (existing.length > 200) {
        existing = existing.slice(existing.length - 200);
    }
    fs_1.default.writeFileSync(learningsPath, JSON.stringify(existing, null, 2));
}
function getLearnings(projectPath) {
    const learningsPath = path_1.default.join(getCmDir(projectPath), LEARNINGS_FILE);
    try {
        return JSON.parse(fs_1.default.readFileSync(learningsPath, 'utf-8'));
    }
    catch (_a) {
        return [];
    }
}
function deleteLearning(projectPath, learningId) {
    const learningsPath = path_1.default.join(getCmDir(projectPath), LEARNINGS_FILE);
    try {
        const learnings = JSON.parse(fs_1.default.readFileSync(learningsPath, 'utf-8'));
        const idx = learnings.findIndex(l => l.id === learningId);
        if (idx === -1)
            return false;
        learnings.splice(idx, 1);
        fs_1.default.writeFileSync(learningsPath, JSON.stringify(learnings, null, 2));
        return true;
    }
    catch (_a) {
        return false;
    }
}
// ─── Decisions Management ───────────────────────────────────────────────────
function addDecision(projectPath, decision) {
    const fullDecision = Object.assign(Object.assign({}, decision), { id: crypto_1.default.randomUUID() });
    const decisionsPath = path_1.default.join(getCmDir(projectPath), DECISIONS_FILE);
    let decisions = [];
    try {
        decisions = JSON.parse(fs_1.default.readFileSync(decisionsPath, 'utf-8'));
    }
    catch ( /* empty */_a) { /* empty */ }
    decisions.push(fullDecision);
    fs_1.default.writeFileSync(decisionsPath, JSON.stringify(decisions, null, 2));
    // Also update CONTINUITY.md
    const state = readContinuityState(projectPath);
    if (state) {
        state.keyDecisions.push(fullDecision);
        if (state.keyDecisions.length > 20) {
            state.keyDecisions = state.keyDecisions.slice(-20);
        }
        writeContinuityMd(projectPath, state);
    }
    return fullDecision;
}
function getDecisions(projectPath) {
    const decisionsPath = path_1.default.join(getCmDir(projectPath), DECISIONS_FILE);
    try {
        return JSON.parse(fs_1.default.readFileSync(decisionsPath, 'utf-8'));
    }
    catch (_a) {
        return [];
    }
}
function deleteDecision(projectPath, decisionId) {
    const decisionsPath = path_1.default.join(getCmDir(projectPath), DECISIONS_FILE);
    try {
        const decisions = JSON.parse(fs_1.default.readFileSync(decisionsPath, 'utf-8'));
        const idx = decisions.findIndex(d => d.id === decisionId);
        if (idx === -1)
            return false;
        decisions.splice(idx, 1);
        fs_1.default.writeFileSync(decisionsPath, JSON.stringify(decisions, null, 2));
        return true;
    }
    catch (_a) {
        return false;
    }
}
function getContinuityStatus(projectPath) {
    var _a;
    const cmDir = getCmDir(projectPath);
    const initialized = fs_1.default.existsSync(path_1.default.join(cmDir, CONTINUITY_FILE));
    if (!initialized) {
        return {
            initialized: false,
            phase: 'not initialized',
            iteration: 0,
            project: path_1.default.basename(projectPath),
            activeGoal: '',
            currentTask: null,
            completedCount: 0,
            blockerCount: 0,
            learningCount: 0,
            decisionCount: 0,
            lastUpdated: '',
        };
    }
    const state = readContinuityState(projectPath);
    const learnings = getLearnings(projectPath);
    const decisions = getDecisions(projectPath);
    return {
        initialized: true,
        phase: (state === null || state === void 0 ? void 0 : state.currentPhase) || 'idle',
        iteration: (state === null || state === void 0 ? void 0 : state.currentIteration) || 0,
        project: (state === null || state === void 0 ? void 0 : state.project) || path_1.default.basename(projectPath),
        activeGoal: (state === null || state === void 0 ? void 0 : state.activeGoal) || '',
        currentTask: ((_a = state === null || state === void 0 ? void 0 : state.currentTask) === null || _a === void 0 ? void 0 : _a.title) || null,
        completedCount: (state === null || state === void 0 ? void 0 : state.justCompleted.length) || 0,
        blockerCount: (state === null || state === void 0 ? void 0 : state.activeBlockers.length) || 0,
        learningCount: learnings.length,
        decisionCount: decisions.length,
        lastUpdated: (state === null || state === void 0 ? void 0 : state.lastUpdated) || '',
    };
}
// ─── Reset ──────────────────────────────────────────────────────────────────
function resetContinuity(projectPath) {
    const state = createDefaultState(path_1.default.basename(projectPath));
    writeContinuityMd(projectPath, state);
}
// ─── Has CM Directory ───────────────────────────────────────────────────────
function hasCmDir(projectPath) {
    return fs_1.default.existsSync(getCmDir(projectPath));
}
