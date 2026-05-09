import { describe, expect, it } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { SqliteBackend } from '../src/storage-backend';
import { buildAdvisoryHandoff, formatAdvisoryHandoffMarkdown } from '../src/advisory-handoff';

function makeTmpProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cm-advisory-handoff-'));
  fs.mkdirSync(path.join(dir, '.cm', 'memory'), { recursive: true });
  return dir;
}

function rmrf(p: string) {
  fs.rmSync(p, { recursive: true, force: true });
}

describe('advisory-handoff', () => {
  it('builds an evolution handoff from the latest advisory analysis', () => {
    const tmpDir = makeTmpProject();
    const backend = new SqliteBackend(tmpDir);
    backend.initialize();

    try {
      backend.recordExecutionAnalysis({
        id: 'EA-handoff-1',
        task_title: 'Repair flaky browser smoke',
        status: 'failed',
        summary: 'Smoke suite still falls back to manual retry',
        source_task_type: 'qa',
        recommended_action: 'FIX',
        confidence: 0.79,
        skill_judgments: [
          {
            skill: 'cm-browse',
            selected: true,
            applied: true,
            task_completed: false,
            fallback_used: true,
            token_estimate: 140,
          },
        ],
        created_at: new Date().toISOString(),
      });

      const handoff = buildAdvisoryHandoff(backend, {
        consumer: 'cm-skill-evolution',
      });

      expect(handoff.consumer).toBe('cm-skill-evolution');
      expect(handoff.recommendation.action).toBe('FIX');
      expect(handoff.skill.name).toBe('cm-browse');
      expect(handoff.skill.metric?.fallbacks).toBe(1);
      expect(handoff.evidence.summary).toContain('manual retry');
    } finally {
      backend.close();
      rmrf(tmpDir);
    }
  });

  it('formats a health handoff as markdown with recovery path and evidence', () => {
    const tmpDir = makeTmpProject();
    const backend = new SqliteBackend(tmpDir);
    backend.initialize();

    try {
      backend.recordExecutionAnalysis({
        id: 'EA-handoff-2',
        task_title: 'Promote undocumented skill flow',
        status: 'completed',
        summary: 'Task succeeded only after ad-hoc manual steps',
        source_task_type: 'docs',
        recommended_action: 'DERIVED',
        confidence: 0.74,
        skill_judgments: [
          {
            skill: 'cm-skill-health',
            selected: true,
            applied: true,
            task_completed: true,
            fallback_used: true,
            token_estimate: 60,
          },
        ],
        created_at: new Date().toISOString(),
      });

      const handoff = buildAdvisoryHandoff(backend, {
        consumer: 'cm-skill-health',
      });
      const markdown = formatAdvisoryHandoffMarkdown(handoff);

      expect(markdown).toContain('Advisory Handoff');
      expect(markdown).toContain('Consumer: cm-skill-health');
      expect(markdown).toContain('Recovery path: DERIVED');
      expect(markdown).toContain('cm-skill-health');
      expect(markdown).toContain('ad-hoc manual steps');
    } finally {
      backend.close();
      rmrf(tmpDir);
    }
  });
});
