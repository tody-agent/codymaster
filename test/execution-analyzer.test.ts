import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { initBus } from '../src/context-bus';
import { ExecutionAnalyzer, qualityWeight } from '../src/execution-analyzer';
import { getBackend } from '../src/storage-backend';

function makeTmpProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cm-analyzer-'));
  fs.mkdirSync(path.join(dir, '.cm'), { recursive: true });
  return dir;
}

describe('ExecutionAnalyzer', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpProject();
    initBus(tmpDir, 'feature-development', 'sess-analyzer');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('persists a FIX advisory for failed executions with active skills', () => {
    const analyzer = new ExecutionAnalyzer(tmpDir);
    const analysis = analyzer.analyzeExecution({
      taskTitle: 'Fix auth regression',
      taskStatus: 'failed',
      summary: 'Regression still failing',
      selectedSkills: ['cm-debugging'],
      skillObservations: [
        {
          skill: 'cm-debugging',
          selected: true,
          applied: true,
          fallbackUsed: true,
          tokenEstimate: 320,
        },
      ],
      sourceTaskType: 'debug',
      tokenEstimate: 320,
      latencyMs: 6200,
    });

    const backend = getBackend(tmpDir);
    const metric = backend.getSkillMetric('cm-debugging');

    expect(analysis.recommended_action).toBe('FIX');
    expect(analysis.latency_bucket).toBe('medium');
    expect(metric).not.toBeNull();
    expect(metric!.selections).toBe(1);
    expect(metric!.fallbacks).toBe(1);
  });

  it('returns CAPTURED when work completes without tracked skills', () => {
    const analyzer = new ExecutionAnalyzer(tmpDir);
    fs.writeFileSync(
      path.join(tmpDir, '.cm', 'operational-learnings.jsonl'),
      `${JSON.stringify({ ts: '2026-04-17T00:00:00Z', tool: 'cm-retro', note: 'Pattern was solved manually but repeatable.' })}\n`,
      'utf8'
    );

    const analysis = analyzer.analyzeExecution({
      taskTitle: 'Package reusable migration checklist',
      taskStatus: 'completed',
      summary: 'Manual workflow completed',
      sourceTaskType: 'ops',
      selectedSkills: [],
      skillObservations: [],
      latencyMs: 400,
    });

    expect(analysis.recommended_action).toBe('CAPTURED');
    expect(analysis.retro_summary).toContain('Pattern was solved manually');
  });

  it('qualityWeight rewards completion and penalizes fallback-heavy skills', () => {
    const strong = qualityWeight({
      skill: 'cm-planning',
      selections: 10,
      applications: 10,
      task_completions: 9,
      fallbacks: 1,
      total_token_estimate: 1000,
      last_used_at: '2026-04-17T00:00:00Z',
      updated_at: '2026-04-17T00:00:00Z',
    });
    const weak = qualityWeight({
      skill: 'cm-debugging',
      selections: 10,
      applications: 5,
      task_completions: 2,
      fallbacks: 6,
      total_token_estimate: 1000,
      last_used_at: '2026-04-17T00:00:00Z',
      updated_at: '2026-04-17T00:00:00Z',
    });

    expect(strong).toBeGreaterThan(weak);
  });
});
