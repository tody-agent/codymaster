import { qualityWeight } from './execution-analyzer';
import type {
  DbExecutionAnalysis,
  DbEvolutionRecommendation,
  DbSkillJudgment,
  DbSkillMetric,
  StorageBackend,
} from './storage-backend';

export type AdvisoryConsumer = 'cm-skill-health' | 'cm-skill-evolution';

export interface AdvisoryHandoffOptions {
  consumer: AdvisoryConsumer;
  analysisId?: string;
  skill?: string;
  searchLimit?: number;
}

export interface AdvisoryHandoff {
  version: 1;
  generated_at: string;
  consumer: AdvisoryConsumer;
  recommendation: {
    action: DbEvolutionRecommendation | 'NONE';
    confidence?: number;
  };
  source: {
    analysis_id: string;
    task_title: string;
    task_status: DbExecutionAnalysis['status'];
    source_task_type?: string;
    created_at: string;
  };
  skill: {
    name?: string;
    judgment?: DbSkillJudgment;
    metric?: (DbSkillMetric & { quality_weight: number }) | null;
  };
  evidence: {
    summary: string;
    selected_skills: string[];
    target_skills: string[];
  };
  next_step: string;
}

function resolveAnalysis(
  backend: StorageBackend,
  options: AdvisoryHandoffOptions
): DbExecutionAnalysis {
  const analyses = backend.getExecutionAnalyses(options.searchLimit ?? 50);
  if (analyses.length === 0) {
    throw new Error('No execution analyses recorded yet.');
  }

  if (!options.analysisId) return analyses[0];

  const match = analyses.find((analysis) => analysis.id.startsWith(options.analysisId!));
  if (!match) {
    throw new Error(`No advisory analysis found for id prefix: ${options.analysisId}`);
  }
  return match;
}

function resolveSkillName(analysis: DbExecutionAnalysis, explicitSkill?: string): string | undefined {
  if (explicitSkill) return explicitSkill;
  return analysis.skill_judgments.find((judgment) => judgment.selected || judgment.applied)?.skill;
}

function buildNextStep(consumer: AdvisoryConsumer, action: string, skill?: string): string {
  const subject = skill ?? 'the affected skill';
  if (consumer === 'cm-skill-health') {
    return `Run cm-skill-health on ${subject} and confirm whether ${action} is still the truthful recovery path.`;
  }
  return `Run cm-skill-evolution in ${action} mode for ${subject} using this advisory evidence as the starting note.`;
}

export function buildAdvisoryHandoff(
  backend: StorageBackend,
  options: AdvisoryHandoffOptions
): AdvisoryHandoff {
  const analysis = resolveAnalysis(backend, options);
  const skillName = resolveSkillName(analysis, options.skill);
  const judgment = skillName
    ? analysis.skill_judgments.find((item) => item.skill === skillName)
    : undefined;
  const metric = skillName ? backend.getSkillMetric(skillName) : null;
  const action = analysis.recommended_action ?? 'NONE';

  return {
    version: 1,
    generated_at: new Date().toISOString(),
    consumer: options.consumer,
    recommendation: {
      action,
      confidence: analysis.confidence,
    },
    source: {
      analysis_id: analysis.id,
      task_title: analysis.task_title,
      task_status: analysis.status,
      source_task_type: analysis.source_task_type,
      created_at: analysis.created_at,
    },
    skill: {
      name: skillName,
      judgment,
      metric: metric ? { ...metric, quality_weight: qualityWeight(metric) } : null,
    },
    evidence: {
      summary: analysis.summary,
      selected_skills: analysis.selected_skills ?? [],
      target_skills: analysis.skill_judgments
        .filter((item) => item.selected || item.applied)
        .map((item) => item.skill),
    },
    next_step: buildNextStep(options.consumer, action, skillName),
  };
}

export function formatAdvisoryHandoffMarkdown(handoff: AdvisoryHandoff): string {
  return [
    '## Advisory Handoff',
    `- Consumer: ${handoff.consumer}`,
    `- Skill: ${handoff.skill.name ?? '-'}`,
    `- Recovery path: ${handoff.recommendation.action}`,
    `- Confidence: ${handoff.recommendation.confidence?.toFixed(2) ?? '-'}`,
    `- Source analysis: ${handoff.source.analysis_id}`,
    `- Task: ${handoff.source.task_title}`,
    `- Status: ${handoff.source.task_status}`,
    `- Evidence: ${handoff.evidence.summary}`,
    `- Selected skills: ${handoff.evidence.selected_skills.join(', ') || '-'}`,
    `- Target skills: ${handoff.evidence.target_skills.join(', ') || '-'}`,
    `- Quality weight: ${handoff.skill.metric ? handoff.skill.metric.quality_weight.toFixed(2) : '-'}`,
    `- Next step: ${handoff.next_step}`,
  ].join('\n');
}
