import type { Task } from './data';
import type { Learning } from './continuity';

// ─── Types ──────────────────────────────────────────────────────────────────

export type JudgeAction = 'CONTINUE' | 'COMPLETE' | 'ESCALATE' | 'PIVOT';

export interface JudgeDecision {
  action: JudgeAction;
  reason: string;
  confidence: number; // 0-1
  suggestedNextSkill?: string;
  badge: string; // emoji for dashboard display
}

// ─── Judge Configuration ────────────────────────────────────────────────────

const STUCK_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes
const MAX_FAIL_COUNT = 3;

// ─── Skill → Domain Mapping ────────────────────────────────────────────────

const SKILL_DOMAIN: Record<string, string> = {
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

const AGENT_AFFINITY: Record<string, string[]> = {
  engineering:    ['claude-code', 'cursor', 'antigravity'],
  operations:     ['claude-code', 'antigravity', 'cursor'],
  product:        ['antigravity', 'claude-code', 'cursor'],
  growth:         ['antigravity', 'claude-code', 'cursor'],
  orchestration:  ['antigravity', 'claude-code', 'cursor'],
  specialized:    ['antigravity', 'claude-code', 'cursor'],
  debugging:      ['claude-code', 'cursor', 'antigravity'],
  review:         ['antigravity', 'claude-code'],
  documentation:  ['antigravity', 'claude-code'],
  design:         ['cursor', 'antigravity'],
};

// ─── Agent Display ──────────────────────────────────────────────────────────

const AGENT_DISPLAY: Record<string, string> = {
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
export function evaluateTaskState(
  task: Task,
  allTasks: Task[],
  learnings: Learning[] = []
): JudgeDecision {

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
export function evaluateAllTasks(
  tasks: Task[],
  learnings: Learning[] = []
): Map<string, JudgeDecision> {
  const decisions = new Map<string, JudgeDecision>();

  const activeTasks = tasks.filter(
    t => t.column === 'in-progress' || t.column === 'review'
  );

  for (const task of activeTasks) {
    decisions.set(task.id, evaluateTaskState(task, tasks, learnings));
  }

  return decisions;
}

// ─── Dynamic Agent Selection ────────────────────────────────────────────────

/**
 * Suggest the best agents for a given skill, ordered by affinity.
 */
export function suggestAgentsForSkill(skill: string): string[] {
  const domain = SKILL_DOMAIN[skill] || 'specialized';
  const agents = AGENT_AFFINITY[domain] || AGENT_AFFINITY.engineering;
  return agents;
}

/**
 * Suggest the best agents for a task based on its skill.
 * Returns formatted display names.
 */
export function suggestAgentsForTask(task: Task): Array<{ id: string; name: string; affinity: string }> {
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
export function getSkillDomain(skill: string): string {
  return SKILL_DOMAIN[skill] || 'specialized';
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function suggestAlternativeSkill(currentSkill: string): string | undefined {
  const alternatives: Record<string, string> = {
    'cm-tdd': 'cm-debugging',
    'cm-debugging': 'cm-tdd',
    'cm-execution': 'cm-planning',
    'cm-safe-deploy': 'cm-quality-gate',
    'cm-quality-gate': 'cm-debugging',
  };
  return alternatives[currentSkill];
}

function guessdomainFromTitle(title: string): string {
  const fTitle = title.toLowerCase();
  if (/test|bug|fix|error|debug/.test(fTitle)) return 'engineering';
  if (/deploy|ci|cd|release|docker/.test(fTitle)) return 'operations';
  if (/design|ui|ux|plan|feature/.test(fTitle)) return 'product';
  if (/content|marketing|seo|ads|tracking/.test(fTitle)) return 'growth';
  if (/i18n|translate|review|docs/.test(fTitle)) return 'orchestration';
  return 'engineering'; // default
}
