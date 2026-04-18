import { describe, expect, it } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { SqliteBackend } from '../src/storage-backend';
import {
  buildAdvisoryMetricsData,
  buildAdvisoryReportData,
  formatAdvisoryMetrics,
  formatAdvisoryReport,
} from '../src/advisory-report';

function makeTmpProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cm-advisory-'));
  fs.mkdirSync(path.join(dir, '.cm', 'memory'), { recursive: true });
  return dir;
}

function rmrf(p: string) {
  fs.rmSync(p, { recursive: true, force: true });
}

describe('advisory-report', () => {
  it('formats recent analyses with recommended actions and target skills', () => {
    const tmpDir = makeTmpProject();
    const backend = new SqliteBackend(tmpDir);
    backend.initialize();

    try {
      backend.recordExecutionAnalysis({
        id: 'EA-report-1',
        task_title: 'Recover CI after flaky migration',
        status: 'failed',
        summary: 'Migration smoke test still fails in CI',
        source_task_type: 'ci',
        recommended_action: 'FIX',
        confidence: 0.81,
        skill_judgments: [
          {
            skill: 'cm-debugging',
            selected: true,
            applied: true,
            task_completed: false,
            fallback_used: true,
            token_estimate: 120,
          },
        ],
        created_at: new Date().toISOString(),
      });

      const report = formatAdvisoryReport(backend, { limit: 5 });

      expect(report).toContain('Advisory Report');
      expect(report).toContain('Recover CI after flaky migration');
      expect(report).toContain('FIX');
      expect(report).toContain('cm-debugging');
      expect(report).toContain('0.81');
    } finally {
      backend.close();
      rmrf(tmpDir);
    }
  });

  it('formats skill metrics with quality scores and fallback counters', () => {
    const tmpDir = makeTmpProject();
    const backend = new SqliteBackend(tmpDir);
    backend.initialize();

    try {
      backend.recordExecutionAnalysis({
        id: 'EA-metrics-1',
        task_title: 'Ship advisory report command',
        status: 'completed',
        summary: 'Implemented advisory report command',
        source_task_type: 'feature',
        recommended_action: 'DERIVED',
        confidence: 0.74,
        skill_judgments: [
          {
            skill: 'cm-tdd',
            selected: true,
            applied: true,
            task_completed: true,
            fallback_used: false,
            token_estimate: 80,
          },
        ],
        created_at: new Date().toISOString(),
      });

      const report = formatAdvisoryMetrics(backend, { limit: 5 });

      expect(report).toContain('Skill Metrics');
      expect(report).toContain('cm-tdd');
      expect(report).toContain('quality=');
      expect(report).toContain('fallbacks=0');
      expect(report).toContain('action=DERIVED');
    } finally {
      backend.close();
      rmrf(tmpDir);
    }
  });

  it('builds structured report and metrics data for JSON consumers', () => {
    const tmpDir = makeTmpProject();
    const backend = new SqliteBackend(tmpDir);
    backend.initialize();

    try {
      backend.recordExecutionAnalysis({
        id: 'EA-json-1',
        task_title: 'Route advisory data to MCP',
        status: 'completed',
        summary: 'Exposed advisory data as structured JSON',
        source_task_type: 'mcp',
        recommended_action: 'CAPTURED',
        confidence: 0.7,
        skill_judgments: [
          {
            skill: 'cm-mcp-engineering',
            selected: true,
            applied: true,
            task_completed: true,
            fallback_used: false,
            token_estimate: 40,
          },
        ],
        created_at: new Date().toISOString(),
      });

      const report = buildAdvisoryReportData(backend, { limit: 5 });
      const metrics = buildAdvisoryMetricsData(backend, { limit: 5 });

      expect(report[0].task_title).toBe('Route advisory data to MCP');
      expect(report[0].active_skills).toContain('cm-mcp-engineering');
      expect(metrics[0].skill).toBe('cm-mcp-engineering');
      expect(metrics[0].quality_weight).toBeGreaterThan(0);
    } finally {
      backend.close();
      rmrf(tmpDir);
    }
  });
});
