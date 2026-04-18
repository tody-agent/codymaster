import { describe, expect, it } from 'vitest';
import { selectTopSkills, type ChainDefinition } from '../src/skill-chain';
import type { DbSkillMetric } from '../src/storage-backend';

describe('selectTopSkills', () => {
  it('uses quality-weighted metrics to break ties between optional skills', () => {
    const chain: ChainDefinition = {
      id: 'quality-aware',
      name: 'Quality Aware Chain',
      description: 'Prefer healthier optional skills when relevance is similar.',
      icon: 'Q',
      triggers: [],
      steps: [
        { skill: 'cm-planning', condition: 'always', description: 'Plan the rollout' },
        { skill: 'cm-weaker', condition: 'if-ready', optional: true, description: 'Handle release workflow' },
        { skill: 'cm-healthier', condition: 'if-ready', optional: true, description: 'Handle release workflow' },
      ],
    };

    const metrics = new Map<string, DbSkillMetric>([
      ['cm-healthier', {
        skill: 'cm-healthier',
        selections: 8,
        applications: 8,
        task_completions: 7,
        fallbacks: 0,
        total_token_estimate: 400,
        last_recommended_action: 'DERIVED',
        last_used_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }],
      ['cm-weaker', {
        skill: 'cm-weaker',
        selections: 8,
        applications: 4,
        task_completions: 1,
        fallbacks: 5,
        total_token_estimate: 400,
        last_recommended_action: 'FIX',
        last_used_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }],
    ]);

    const selected = selectTopSkills('release workflow', chain, 2, {
      getSkillMetric: (skill) => metrics.get(skill) ?? null,
    });

    expect(selected.map((step) => step.skill)).toEqual(['cm-planning', 'cm-healthier']);
  });
});
