"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateTaskState = evaluateTaskState;
exports.evaluateAllTasks = evaluateAllTasks;
exports.suggestAgentsForSkill = suggestAgentsForSkill;
exports.suggestAgentsForTask = suggestAgentsForTask;
exports.getSkillDomain = getSkillDomain;
exports.suggestTransitions = suggestTransitions;
exports.suggestChain = suggestChain;
const skill_chain_1 = require("./skill-chain");
// ─── Judge Configuration ────────────────────────────────────────────────────
const STUCK_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes
const MAX_FAIL_COUNT = 3;
// ─── Skill → Domain Mapping ────────────────────────────────────────────────
const SKILL_DOMAIN = {
    'cm-tdd': 'engineering',
    'cm-debugging': 'engineering',
    'cm-quality-gate': 'engineering',
    'cm-test-gate': 'engineering',
    'cm-code-review': 'engineering',
    'cm-safe-deploy': 'operations',
    'cm-identity-guard': 'operations',
    'cm-git-worktrees': 'operations',
    'cm-terminal': 'operations',
    'cm-planning': 'product',
    'cm-ux-master': 'product',
    'cm-dockit': 'product',
    'cm-project-bootstrap': 'product',
    'cm-content-factory': 'growth',
    'cm-ads-tracker': 'growth',
    'cro-methodology': 'growth',
    'booking-calendar': 'growth',
    'cm-execution': 'orchestration',
    'cm-continuity': 'orchestration',
    'cm-skill-mastery': 'orchestration',
    'cm-safe-i18n': 'orchestration',
};
// ─── Agent Affinity ─────────────────────────────────────────────────────────
const AGENT_AFFINITY = {
    engineering: ['claude-code', 'cursor', 'antigravity'],
    operations: ['claude-code', 'antigravity', 'cursor'],
    product: ['antigravity', 'claude-code', 'cursor'],
    growth: ['antigravity', 'claude-code', 'cursor'],
    orchestration: ['antigravity', 'claude-code', 'cursor'],
    specialized: ['antigravity', 'claude-code', 'cursor'],
    debugging: ['claude-code', 'cursor', 'antigravity'],
    review: ['antigravity', 'claude-code'],
    documentation: ['antigravity', 'claude-code'],
    design: ['cursor', 'antigravity'],
};
// ─── Agent Display ──────────────────────────────────────────────────────────
const AGENT_DISPLAY = {
    'antigravity': 'Google Antigravity',
    'claude-code': 'Claude Code',
    'cursor': 'Cursor',
    'gemini-cli': 'Gemini CLI',
    'windsurf': 'Windsurf',
    'cline': 'Cline / RooCode',
    'copilot': 'GitHub Copilot',
};
// ─── Judge Agent ────────────────────────────────────────────────────────────
/**
 * Evaluate the current state of a task and decide what action to take.
 * Returns a JudgeDecision with one of: CONTINUE, COMPLETE, ESCALATE, PIVOT.
 *
 * Inspired by Loki Mode's Judge Agent Protocol.
 */
function evaluateTaskState(task, allTasks, learnings = []) {
    // ─── COMPLETE: Task is already done ────────────────────────────────────
    if (task.column === 'done') {
        return {
            action: 'COMPLETE',
            reason: 'Task has been marked as done.',
            confidence: 1.0,
            badge: '🏁',
        };
    }
    // ─── ESCALATE: Task stuck for too long ─────────────────────────────────
    const updatedAt = new Date(task.updatedAt).getTime();
    const elapsed = Date.now() - updatedAt;
    if (task.column === 'in-progress' && elapsed > STUCK_THRESHOLD_MS) {
        const minutesStuck = Math.round(elapsed / 60000);
        return {
            action: 'ESCALATE',
            reason: `Task stuck in progress for ${minutesStuck} minutes without updates.`,
            confidence: 0.85,
            badge: '⚠️',
        };
    }
    // ─── PIVOT: Too many failures → change approach ────────────────────────
    const taskLearnings = learnings.filter(l => l.taskId === task.id);
    if (taskLearnings.length >= MAX_FAIL_COUNT) {
        const suggestedSkill = suggestAlternativeSkill(task.skill);
        return {
            action: 'PIVOT',
            reason: `Task has failed ${taskLearnings.length} times. Consider changing approach.`,
            confidence: 0.75,
            suggestedNextSkill: suggestedSkill,
            badge: '🔄',
        };
    }
    // ─── ESCALATE: Dispatch failed previously ──────────────────────────────
    if (task.dispatchStatus === 'failed' && task.dispatchError) {
        return {
            action: 'ESCALATE',
            reason: `Dispatch failed: ${task.dispatchError}`,
            confidence: 0.9,
            badge: '⚠️',
        };
    }
    // ─── COMPLETE: All related tasks in same project are done ──────────────
    const projectTasks = allTasks.filter(t => t.projectId === task.projectId);
    const allOthersDone = projectTasks
        .filter(t => t.id !== task.id)
        .every(t => t.column === 'done');
    if (task.column === 'review' && allOthersDone) {
        return {
            action: 'COMPLETE',
            reason: 'This is the last task in the project. Ready to finalize.',
            confidence: 0.8,
            badge: '🏁',
        };
    }
    // ─── CONTINUE: Normal progress ─────────────────────────────────────────
    // Check if task has a chain — suggest advancing
    if (task.chainId && task.column === 'review') {
        return {
            action: 'CHAIN_NEXT',
            reason: `Task is part of chain "${task.chainId}". Ready to advance to next step.`,
            confidence: 0.8,
            badge: '⛓️',
        };
    }
    return {
        action: 'CONTINUE',
        reason: 'Task is progressing normally.',
        confidence: 0.7,
        badge: '🟢',
    };
}
/**
 * Evaluate all in-progress/review tasks and return decisions for each.
 */
function evaluateAllTasks(tasks, learnings = []) {
    const decisions = new Map();
    const activeTasks = tasks.filter(t => t.column === 'in-progress' || t.column === 'review');
    for (const task of activeTasks) {
        decisions.set(task.id, evaluateTaskState(task, tasks, learnings));
    }
    return decisions;
}
// ─── Dynamic Agent Selection ────────────────────────────────────────────────
/**
 * Suggest the best agents for a given skill, ordered by affinity.
 */
function suggestAgentsForSkill(skill) {
    const domain = SKILL_DOMAIN[skill] || 'specialized';
    const agents = AGENT_AFFINITY[domain] || AGENT_AFFINITY.engineering;
    return agents;
}
/**
 * Suggest the best agents for a task based on its skill.
 * Returns formatted display names.
 */
function suggestAgentsForTask(task) {
    const skill = task.skill || '';
    const domain = SKILL_DOMAIN[skill] || guessdomainFromTitle(task.title);
    const agents = AGENT_AFFINITY[domain] || AGENT_AFFINITY.engineering;
    return agents.map((id, index) => ({
        id,
        name: AGENT_DISPLAY[id] || id,
        affinity: index === 0 ? 'best' : index === 1 ? 'good' : 'acceptable',
    }));
}
/**
 * Get the domain of a skill.
 */
function getSkillDomain(skill) {
    return SKILL_DOMAIN[skill] || 'specialized';
}
// ─── Helpers ────────────────────────────────────────────────────────────────
function suggestAlternativeSkill(currentSkill) {
    const alternatives = {
        'cm-tdd': 'cm-debugging',
        'cm-debugging': 'cm-tdd',
        'cm-execution': 'cm-planning',
        'cm-safe-deploy': 'cm-quality-gate',
        'cm-quality-gate': 'cm-debugging',
    };
    return alternatives[currentSkill];
}
function guessdomainFromTitle(title) {
    const fTitle = title.toLowerCase();
    if (/test|bug|fix|error|debug/.test(fTitle))
        return 'engineering';
    if (/deploy|ci|cd|release|docker/.test(fTitle))
        return 'operations';
    if (/design|ui|ux|plan|feature/.test(fTitle))
        return 'product';
    if (/content|marketing|seo|ads|tracking/.test(fTitle))
        return 'growth';
    if (/i18n|translate|review|docs/.test(fTitle))
        return 'orchestration';
    return 'engineering'; // default
}
/**
 * Suggest transitions for stuck tasks based on heuristics:
 * - in-progress > 60 min + dispatched → suggest "review"
 * - in-progress > 120 min → suggest "review" even without dispatch
 * - review > 30 min → suggest "done"
 */
function suggestTransitions(tasks) {
    const now = Date.now();
    const suggestions = [];
    for (const task of tasks) {
        const elapsed = now - new Date(task.updatedAt).getTime();
        const minutes = Math.round(elapsed / 60000);
        if (task.column === 'in-progress') {
            if (task.dispatchStatus === 'dispatched' && elapsed > 60 * 60 * 1000) {
                suggestions.push({
                    taskId: task.id, from: 'in-progress', to: 'review',
                    reason: `Dispatched ${minutes}m ago, likely completed. Move to review?`,
                    confidence: 0.7, stuckMinutes: minutes,
                });
            }
            else if (elapsed > 120 * 60 * 1000) {
                suggestions.push({
                    taskId: task.id, from: 'in-progress', to: 'review',
                    reason: `Stuck for ${minutes}m. Consider moving to review or back to backlog.`,
                    confidence: 0.6, stuckMinutes: minutes,
                });
            }
        }
        if (task.column === 'review' && elapsed > 30 * 60 * 1000) {
            suggestions.push({
                taskId: task.id, from: 'review', to: 'done',
                reason: `In review for ${minutes}m. Ready to mark as done?`,
                confidence: 0.5, stuckMinutes: minutes,
            });
        }
    }
    return suggestions.sort((a, b) => b.stuckMinutes - a.stuckMinutes);
}
// ─── Chain Suggestions ───────────────────────────────────────────────────
// TRIZ #10: Preliminary Action — analyze task before dispatch
/**
 * Suggest the best chain for a task based on its title.
 * Returns the matching chain definition or undefined.
 */
function suggestChain(taskTitle) {
    return (0, skill_chain_1.matchChain)(taskTitle);
}
