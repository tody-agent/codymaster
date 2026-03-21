"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchChain = matchChain;
exports.listChains = listChains;
exports.findChain = findChain;
exports.createChainExecution = createChainExecution;
exports.advanceChain = advanceChain;
exports.skipChainStep = skipChainStep;
exports.abortChain = abortChain;
exports.failChainStep = failChainStep;
exports.formatChainProgress = formatChainProgress;
exports.formatChainProgressBar = formatChainProgressBar;
exports.getCurrentSkill = getCurrentSkill;
const crypto_1 = __importDefault(require("crypto"));
const builtin_1 = require("./chains/builtin");
// ─── Chain Matching ─────────────────────────────────────────────────────────
// TRIZ #10: Preliminary Action — analyze task BEFORE dispatching
/**
 * Auto-detect the best chain for a task title using keyword matching.
 * Returns the best matching chain, or undefined if no match.
 */
function matchChain(taskTitle) {
    const title = taskTitle.toLowerCase();
    const chains = (0, builtin_1.getBuiltinChains)();
    let bestMatch;
    let bestScore = 0;
    for (const chain of chains) {
        let score = 0;
        for (const trigger of chain.triggers) {
            if (title.includes(trigger.toLowerCase())) {
                // Longer triggers get higher scores (more specific = better match)
                score += trigger.length;
            }
        }
        if (score > bestScore) {
            bestScore = score;
            bestMatch = chain;
        }
    }
    return bestMatch;
}
/**
 * List all available chains (built-in + user-defined in the future).
 */
function listChains() {
    return (0, builtin_1.getBuiltinChains)();
}
/**
 * Find a chain by ID.
 */
function findChain(chainId) {
    return (0, builtin_1.getChainById)(chainId);
}
// ─── Chain Execution Management ─────────────────────────────────────────────
// TRIZ #40: Composite Materials — skills compose into pipelines
/**
 * Create a new chain execution from a chain definition.
 */
function createChainExecution(chain, projectId, taskTitle, agent) {
    const now = new Date().toISOString();
    const steps = chain.steps.map((step, index) => ({
        index,
        skill: step.skill,
        description: step.description,
        condition: step.condition,
        optional: step.optional || false,
        status: 'pending',
    }));
    // First step starts immediately
    if (steps.length > 0) {
        steps[0].status = 'running';
        steps[0].startedAt = now;
    }
    return {
        id: crypto_1.default.randomUUID(),
        chainId: chain.id,
        chainName: chain.name,
        projectId,
        taskTitle,
        agent,
        status: 'running',
        currentStepIndex: 0,
        steps,
        startedAt: now,
        updatedAt: now,
    };
}
/**
 * Advance the chain to the next step. Marks current step as completed.
 * Returns the next step's skill name, or null if chain is complete.
 */
function advanceChain(execution, output) {
    const now = new Date().toISOString();
    const currentStep = execution.steps[execution.currentStepIndex];
    if (!currentStep) {
        return { nextSkill: null, completed: true };
    }
    // Mark current step as completed
    currentStep.status = 'completed';
    currentStep.completedAt = now;
    if (output)
        currentStep.output = output;
    execution.updatedAt = now;
    // Find next non-skipped step
    let nextIndex = execution.currentStepIndex + 1;
    while (nextIndex < execution.steps.length) {
        const nextStep = execution.steps[nextIndex];
        // Skip optional steps with conditions that aren't met
        if (nextStep.optional && nextStep.condition !== 'always') {
            nextStep.status = 'skipped';
            nextStep.completedAt = now;
            nextIndex++;
            continue;
        }
        break;
    }
    if (nextIndex >= execution.steps.length) {
        // Chain completed!
        execution.status = 'completed';
        execution.completedAt = now;
        execution.currentStepIndex = execution.steps.length;
        return { nextSkill: null, completed: true };
    }
    // Start next step
    execution.currentStepIndex = nextIndex;
    const nextStep = execution.steps[nextIndex];
    nextStep.status = 'running';
    nextStep.startedAt = now;
    return { nextSkill: nextStep.skill, completed: false };
}
/**
 * Skip the current step in the chain.
 */
function skipChainStep(execution, reason) {
    const now = new Date().toISOString();
    const currentStep = execution.steps[execution.currentStepIndex];
    if (!currentStep) {
        return { nextSkill: null, completed: true };
    }
    currentStep.status = 'skipped';
    currentStep.completedAt = now;
    if (reason)
        currentStep.output = `Skipped: ${reason}`;
    execution.updatedAt = now;
    // Find next step
    let nextIndex = execution.currentStepIndex + 1;
    if (nextIndex >= execution.steps.length) {
        execution.status = 'completed';
        execution.completedAt = now;
        execution.currentStepIndex = execution.steps.length;
        return { nextSkill: null, completed: true };
    }
    execution.currentStepIndex = nextIndex;
    const nextStep = execution.steps[nextIndex];
    nextStep.status = 'running';
    nextStep.startedAt = now;
    return { nextSkill: nextStep.skill, completed: false };
}
/**
 * Abort the entire chain.
 */
function abortChain(execution, reason) {
    const now = new Date().toISOString();
    execution.status = 'aborted';
    execution.completedAt = now;
    execution.updatedAt = now;
    // Mark remaining pending steps as skipped
    for (const step of execution.steps) {
        if (step.status === 'pending' || step.status === 'running') {
            step.status = 'skipped';
            step.completedAt = now;
            if (reason)
                step.output = `Aborted: ${reason}`;
        }
    }
}
/**
 * Mark the current step as failed.
 */
function failChainStep(execution, error) {
    const now = new Date().toISOString();
    const currentStep = execution.steps[execution.currentStepIndex];
    if (currentStep) {
        currentStep.status = 'failed';
        currentStep.completedAt = now;
        currentStep.error = error;
    }
    execution.status = 'failed';
    execution.updatedAt = now;
}
// ─── Display Helpers ────────────────────────────────────────────────────────
const STEP_ICONS = {
    pending: '⚪',
    running: '🔵',
    skipped: '⏭️',
    completed: '✅',
    failed: '❌',
};
const STATUS_ICONS = {
    pending: '⚪',
    running: '🔵',
    paused: '⏸️',
    completed: '✅',
    failed: '❌',
    aborted: '🛑',
};
/**
 * Format chain progress for CLI display.
 */
function formatChainProgress(execution) {
    const lines = [];
    const statusIcon = STATUS_ICONS[execution.status] || '❓';
    lines.push(`${statusIcon} Chain: ${execution.chainName} — "${execution.taskTitle}"`);
    lines.push(`   Status: ${execution.status} | Agent: ${execution.agent}`);
    lines.push(`   Progress: ${getCompletedCount(execution)}/${execution.steps.length} steps`);
    lines.push('');
    for (const step of execution.steps) {
        const icon = STEP_ICONS[step.status] || '❓';
        const current = step.index === execution.currentStepIndex && execution.status === 'running' ? ' ◄ CURRENT' : '';
        lines.push(`   ${icon} ${step.index + 1}. ${step.skill} — ${step.description}${current}`);
        if (step.error)
            lines.push(`      ⚠️  Error: ${step.error}`);
        if (step.output && step.status !== 'skipped')
            lines.push(`      📝 ${step.output}`);
    }
    return lines.join('\n');
}
/**
 * Format a compact chain progress bar.
 */
function formatChainProgressBar(execution) {
    const parts = execution.steps.map(step => {
        switch (step.status) {
            case 'completed': return '█';
            case 'running': return '▓';
            case 'skipped': return '░';
            case 'failed': return '✗';
            default: return '░';
        }
    });
    const pct = Math.round((getCompletedCount(execution) / execution.steps.length) * 100);
    return `[${parts.join('')}] ${pct}%`;
}
function getCompletedCount(execution) {
    return execution.steps.filter(s => s.status === 'completed' || s.status === 'skipped').length;
}
/**
 * Get the current step's skill name.
 */
function getCurrentSkill(execution) {
    var _a;
    if (execution.currentStepIndex >= execution.steps.length)
        return null;
    return ((_a = execution.steps[execution.currentStepIndex]) === null || _a === void 0 ? void 0 : _a.skill) || null;
}
