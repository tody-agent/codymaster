import { qualityWeight } from './execution-analyzer';
import type { DbExecutionAnalysis, DbSkillMetric, StorageBackend } from './storage-backend';

export interface AdvisoryReportOptions {
  limit?: number;
}

export interface AdvisoryReportEntry {
  id: string;
  task_title: string;
  status: DbExecutionAnalysis['status'];
  summary: string;
  source_task_type?: string;
  recommended_action?: DbExecutionAnalysis['recommended_action'];
  confidence?: number;
  created_at: string;
  active_skills: string[];
}

export interface AdvisoryMetricEntry {
  skill: string;
  quality_weight: number;
  selections: number;
  applications: number;
  task_completions: number;
  fallbacks: number;
  total_token_estimate: number;
  last_task_type?: string;
  last_recommended_action?: string;
  last_used_at: string;
  updated_at: string;
}

function fmtConfidence(value?: number): string {
  if (typeof value !== 'number') return '-';
  return value.toFixed(2);
}

function summarizeTargetSkills(analysis: DbExecutionAnalysis): string {
  const targets = analysis.skill_judgments
    .filter((judgment) => judgment.selected || judgment.applied)
    .map((judgment) => judgment.skill);
  return targets.length > 0 ? targets.join(', ') : '-';
}

function formatAnalysisLine(analysis: DbExecutionAnalysis): string {
  const action = analysis.recommended_action ?? 'NONE';
  return [
    `- ${analysis.task_title}`,
    `status=${analysis.status}`,
    `action=${action}`,
    `confidence=${fmtConfidence(analysis.confidence)}`,
    `skills=${summarizeTargetSkills(analysis)}`,
  ].join(' | ');
}

function formatMetricLine(metric: AdvisoryMetricEntry): string {
  return [
    `- ${metric.skill}`,
    `quality=${metric.quality_weight.toFixed(2)}`,
    `selected=${metric.selections}`,
    `applied=${metric.applications}`,
    `completed=${metric.task_completions}`,
    `fallbacks=${metric.fallbacks}`,
    `action=${metric.last_recommended_action ?? '-'}`,
  ].join(' | ');
}

export function buildAdvisoryReportData(
  backend: StorageBackend,
  options: AdvisoryReportOptions = {}
): AdvisoryReportEntry[] {
  const limit = options.limit ?? 10;
  return backend.getExecutionAnalyses(limit).map((analysis) => ({
    id: analysis.id,
    task_title: analysis.task_title,
    status: analysis.status,
    summary: analysis.summary,
    source_task_type: analysis.source_task_type,
    recommended_action: analysis.recommended_action,
    confidence: analysis.confidence,
    created_at: analysis.created_at,
    active_skills: analysis.skill_judgments
      .filter((judgment) => judgment.selected || judgment.applied)
      .map((judgment) => judgment.skill),
  }));
}

export function buildAdvisoryMetricsData(
  backend: StorageBackend,
  options: AdvisoryReportOptions = {}
): AdvisoryMetricEntry[] {
  const limit = options.limit ?? 10;
  return backend.listSkillMetrics(limit).map((metric) => ({
    skill: metric.skill,
    quality_weight: qualityWeight(metric),
    selections: metric.selections,
    applications: metric.applications,
    task_completions: metric.task_completions,
    fallbacks: metric.fallbacks,
    total_token_estimate: metric.total_token_estimate,
    last_task_type: metric.last_task_type,
    last_recommended_action: metric.last_recommended_action,
    last_used_at: metric.last_used_at,
    updated_at: metric.updated_at,
  }));
}

export function formatAdvisoryReport(
  backend: StorageBackend,
  options: AdvisoryReportOptions = {}
): string {
  const analyses = buildAdvisoryReportData(backend, options);

  if (analyses.length === 0) {
    return [
      'Advisory Report',
      '',
      'No execution analyses recorded yet.',
    ].join('\n');
  }

  return [
    'Advisory Report',
    '',
    ...analyses.map((analysis) => formatAnalysisLine({
      ...analysis,
      skill_judgments: analysis.active_skills.map((skill) => ({ skill, selected: true })),
    } as DbExecutionAnalysis)),
  ].join('\n');
}

export function formatAdvisoryMetrics(
  backend: StorageBackend,
  options: AdvisoryReportOptions = {}
): string {
  const metrics = buildAdvisoryMetricsData(backend, options);

  if (metrics.length === 0) {
    return [
      'Skill Metrics',
      '',
      'No skill metrics recorded yet.',
    ].join('\n');
  }

  return [
    'Skill Metrics',
    '',
    ...metrics.map(formatMetricLine),
  ].join('\n');
}
