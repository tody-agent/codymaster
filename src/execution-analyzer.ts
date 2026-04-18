import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { readBus } from './context-bus';
import { getBackend, type DbExecutionAnalysis, type DbEvolutionRecommendation, type DbSkillJudgment, type DbSkillMetric, type StorageBackend } from './storage-backend';
import { loadRetroEntries } from './retro-summary';

export interface SkillObservation {
  skill: string;
  selected?: boolean;
  applied?: boolean;
  fallbackUsed?: boolean;
  tokenEstimate?: number;
  note?: string;
  relevanceScore?: number;
}

export interface AnalyzeExecutionInput {
  taskTitle: string;
  taskStatus: 'completed' | 'partial' | 'failed';
  summary?: string;
  selectedSkills?: string[];
  skillObservations?: SkillObservation[];
  sourceTaskType?: string;
  sessionId?: string;
  chainId?: string;
  tokenEstimate?: number;
  latencyMs?: number;
}

export interface ExecutionAdvisory {
  action?: DbEvolutionRecommendation;
  confidence?: number;
  reason: string;
  targetSkills: string[];
}

function bucketLatency(latencyMs?: number): string | undefined {
  if (latencyMs === undefined || latencyMs < 0) return undefined;
  if (latencyMs < 1_000) return 'subsecond';
  if (latencyMs < 5_000) return 'fast';
  if (latencyMs < 15_000) return 'medium';
  return 'slow';
}

function buildRetroSummary(projectPath: string, limit = 3): string | undefined {
  const retroPath = path.join(projectPath, '.cm', 'operational-learnings.jsonl');
  const entries = loadRetroEntries(retroPath).slice(-limit);
  if (entries.length === 0) return undefined;
  return entries.map((entry) => `- [${entry.tool}] ${entry.note}`).join('\n');
}

function normalizeJudgments(input: AnalyzeExecutionInput): DbSkillJudgment[] {
  const map = new Map<string, DbSkillJudgment>();

  for (const skill of input.selectedSkills ?? []) {
    map.set(skill, {
      skill,
      selected: true,
      applied: true,
      task_completed: input.taskStatus === 'completed',
      fallback_used: false,
    });
  }

  for (const observation of input.skillObservations ?? []) {
    const current = map.get(observation.skill) ?? { skill: observation.skill };
    map.set(observation.skill, {
      skill: observation.skill,
      selected: observation.selected ?? current.selected ?? false,
      applied: observation.applied ?? current.applied ?? (observation.selected ?? current.selected ?? false),
      task_completed: input.taskStatus === 'completed',
      fallback_used: observation.fallbackUsed ?? current.fallback_used ?? false,
      token_estimate: observation.tokenEstimate ?? current.token_estimate,
      note: observation.note ?? current.note,
      relevance_score: observation.relevanceScore ?? current.relevance_score,
    });
  }

  return Array.from(map.values());
}

export function qualityWeight(metric: DbSkillMetric | null): number {
  if (!metric) return 0.5;
  const base = Math.max(metric.selections, 1);
  const applicationRate = metric.applications / base;
  const completionRate = metric.task_completions / base;
  const fallbackPenalty = metric.fallbacks / base;
  const weighted = (applicationRate * 0.35) + (completionRate * 0.5) + ((1 - fallbackPenalty) * 0.15);
  return Math.max(0, Math.min(1, weighted));
}

function buildAdvisory(
  taskStatus: AnalyzeExecutionInput['taskStatus'],
  judgments: DbSkillJudgment[],
  backend: StorageBackend
): ExecutionAdvisory {
  const activeSkills = judgments.filter((judgment) => judgment.selected || judgment.applied).map((judgment) => judgment.skill);
  const fallbackSkills = judgments.filter((judgment) => judgment.fallback_used).map((judgment) => judgment.skill);

  if (taskStatus !== 'completed' && activeSkills.length > 0) {
    const weakest = activeSkills
      .map((skill) => ({ skill, weight: qualityWeight(backend.getSkillMetric(skill)) }))
      .sort((a, b) => a.weight - b.weight)[0];
    const targetSkills = weakest ? [weakest.skill] : activeSkills.slice(0, 1);
    return {
      action: 'FIX',
      confidence: weakest ? Math.max(0.68, 0.82 - weakest.weight * 0.2) : 0.72,
      reason: 'Task did not complete successfully while selected skills were active.',
      targetSkills,
    };
  }

  if (taskStatus === 'completed' && activeSkills.length === 0) {
    return {
      action: 'CAPTURED',
      confidence: 0.76,
      reason: 'Task completed without any tracked skill usage, suggesting a reusable pattern worth capturing.',
      targetSkills: [],
    };
  }

  if (taskStatus === 'completed' && fallbackSkills.length > 0) {
    return {
      action: 'DERIVED',
      confidence: 0.74,
      reason: 'Task completed, but fallback handling suggests the current skill may need a specialized derived variant.',
      targetSkills: fallbackSkills,
    };
  }

  return {
    reason: 'No evolution action recommended from the current execution signal.',
    targetSkills: [],
  };
}

export class ExecutionAnalyzer {
  private readonly backend: StorageBackend;

  constructor(private readonly projectPath: string, backend?: StorageBackend) {
    this.backend = backend ?? getBackend(projectPath);
    this.backend.initialize();
  }

  analyzeExecution(input: AnalyzeExecutionInput): DbExecutionAnalysis {
    const judgments = normalizeJudgments(input);
    const bus = readBus(this.projectPath);
    const retroSummary = buildRetroSummary(this.projectPath);
    const advisory = buildAdvisory(input.taskStatus, judgments, this.backend);

    const analysis: DbExecutionAnalysis = {
      id: crypto.randomUUID(),
      task_title: input.taskTitle,
      status: input.taskStatus,
      summary: input.summary ?? `${input.taskStatus.toUpperCase()}: ${input.taskTitle}`,
      source_task_type: input.sourceTaskType,
      session_id: input.sessionId ?? bus?.session_id,
      chain_id: input.chainId,
      selected_skills: input.selectedSkills ?? judgments.filter((judgment) => judgment.selected).map((judgment) => judgment.skill),
      token_estimate: input.tokenEstimate,
      latency_bucket: bucketLatency(input.latencyMs),
      bus_snapshot: bus ? JSON.stringify(bus.shared_context) : undefined,
      retro_summary: retroSummary,
      recommended_action: advisory.action,
      confidence: advisory.confidence,
      skill_judgments: judgments,
      created_at: new Date().toISOString(),
    };

    this.backend.recordExecutionAnalysis(analysis);
    return analysis;
  }
}
