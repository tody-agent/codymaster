import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { SkillEvolver, formatEvolutionResult, formatEvolutionHistory } from '../src/skill-evolver';
import { SqliteBackend } from '../src/storage-backend';
import type { DbExecutionAnalysis } from '../src/context-db';

// ─── Test Helpers ────────────────────────────────────────────────────────────

let tmpDir: string;
let backend: SqliteBackend;

function createTestProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cm-evolver-test-'));
  const cmDir = path.join(dir, '.cm');
  fs.mkdirSync(cmDir, { recursive: true });

  // Create a test skill
  const skillDir = path.join(dir, 'skills', 'cm-test-skill');
  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(
    path.join(skillDir, 'SKILL.md'),
    '---\nname: cm-test-skill\ndescription: Test skill\n---\n\n# cm-test-skill\n\nTest content.\n',
    'utf-8'
  );

  return dir;
}

function insertTestAnalysis(
  be: SqliteBackend,
  overrides: Partial<DbExecutionAnalysis> = {}
): DbExecutionAnalysis {
  const analysis: DbExecutionAnalysis = {
    id: overrides.id ?? 'test-analysis-' + Date.now(),
    task_title: overrides.task_title ?? 'Fix login bug',
    status: overrides.status ?? 'failed',
    summary: overrides.summary ?? 'Login page crashed under load',
    selected_skills: overrides.selected_skills ?? ['cm-test-skill'],
    recommended_action: overrides.recommended_action ?? 'FIX',
    confidence: overrides.confidence ?? 0.85,
    skill_judgments: overrides.skill_judgments ?? [
      { skill: 'cm-test-skill', selected: true, applied: true, task_completed: false, fallback_used: false, note: 'Skill was applied but task failed' },
    ],
    created_at: overrides.created_at ?? new Date().toISOString(),
  };
  be.recordExecutionAnalysis(analysis);
  return analysis;
}

beforeEach(() => {
  tmpDir = createTestProject();
  backend = new SqliteBackend(tmpDir);
  backend.initialize();
});

afterEach(() => {
  backend.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ─── FIX Mode ────────────────────────────────────────────────────────────────

describe('FIX mode', () => {
  it('applies a fix patch to a skill', () => {
    insertTestAnalysis(backend);
    const evolver = new SkillEvolver(tmpDir, backend);
    const result = evolver.evolve('FIX', 'cm-test-skill', 0.85, undefined);
    expect(result.success).toBe(true);
    expect(result.mode).toBe('FIX');
    expect(result.backupPath).toBeTruthy();

    // Verify SKILL.md was modified
    const skillContent = fs.readFileSync(
      path.join(tmpDir, 'skills', 'cm-test-skill', 'SKILL.md'), 'utf-8'
    );
    expect(skillContent).toContain('Evolution Fix');
    expect(skillContent).toContain('SkillEvolver');
  });

  it('creates a backup before mutation', () => {
    insertTestAnalysis(backend);
    const evolver = new SkillEvolver(tmpDir, backend);
    const result = evolver.evolve('FIX', 'cm-test-skill', 0.85);
    expect(result.backupPath).toBeTruthy();
    expect(fs.existsSync(result.backupPath!)).toBe(true);

    // Verify backup contains original content
    const backup = fs.readFileSync(result.backupPath!, 'utf-8');
    expect(backup).toContain('Test content');
    expect(backup).not.toContain('Evolution Fix');
  });

  it('rejects low confidence', () => {
    insertTestAnalysis(backend);
    const evolver = new SkillEvolver(tmpDir, backend);
    const result = evolver.evolve('FIX', 'cm-test-skill', 0.50);
    expect(result.success).toBe(false);
    expect(result.error).toContain('below');
  });

  it('rejects unknown skills', () => {
    const evolver = new SkillEvolver(tmpDir, backend);
    const result = evolver.evolve('FIX', 'nonexistent-skill', 0.85);
    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  it('records evolution history', () => {
    insertTestAnalysis(backend);
    const evolver = new SkillEvolver(tmpDir, backend);
    evolver.evolve('FIX', 'cm-test-skill', 0.85);
    const history = evolver.getHistory('cm-test-skill');
    expect(history).toHaveLength(1);
    expect(history[0].mode).toBe('FIX');
    expect(history[0].skill_name).toBe('cm-test-skill');
  });

  it('updates skill record', () => {
    insertTestAnalysis(backend);
    const evolver = new SkillEvolver(tmpDir, backend);
    evolver.evolve('FIX', 'cm-test-skill', 0.85);
    const record = evolver.getSkillRecord('cm-test-skill');
    expect(record).not.toBeNull();
    expect(record!.evolution_count).toBe(1);
    expect(record!.origin).toBe('fix');
  });
});

// ─── Anti-loop Protection ────────────────────────────────────────────────────

describe('anti-loop protection', () => {
  it('blocks evolution at max depth', () => {
    insertTestAnalysis(backend);
    const evolver = new SkillEvolver(tmpDir, backend);

    // Manually set a high generation in the record
    const recordsDir = path.join(tmpDir, '.cm', 'evolution');
    fs.mkdirSync(recordsDir, { recursive: true });
    fs.writeFileSync(
      path.join(recordsDir, 'records.json'),
      JSON.stringify({
        'cm-test-skill': {
          id: 'test', skill_name: 'cm-test-skill', origin: 'fix',
          generation: 5, version: '5.0.0', created_at: '', updated_at: '',
          evolution_count: 5, last_evolution_mode: 'FIX',
        },
      })
    );

    const result = evolver.evolve('FIX', 'cm-test-skill', 0.85);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Anti-loop');
  });
});

// ─── DERIVED Mode ────────────────────────────────────────────────────────────

describe('DERIVED mode', () => {
  it('creates a derived skill variant', () => {
    insertTestAnalysis(backend, { recommended_action: 'DERIVED', status: 'completed',
      skill_judgments: [{ skill: 'cm-test-skill', selected: true, applied: true, task_completed: true, fallback_used: true }] });
    const evolver = new SkillEvolver(tmpDir, backend);
    const result = evolver.evolve('DERIVED', 'cm-test-skill', 0.80);
    expect(result.success).toBe(true);
    expect(result.skill).toContain('cm-test-skill-v');

    // Verify derived skill exists
    const derivedDir = path.join(tmpDir, 'skills', result.skill!);
    expect(fs.existsSync(path.join(derivedDir, 'SKILL.md'))).toBe(true);
  });
});

// ─── CAPTURED Mode ───────────────────────────────────────────────────────────

describe('CAPTURED mode', () => {
  it('creates a captured skill from analysis', () => {
    insertTestAnalysis(backend, { recommended_action: 'CAPTURED', status: 'completed',
      selected_skills: [] });
    const evolver = new SkillEvolver(tmpDir, backend);
    const result = evolver.evolve('CAPTURED', 'new-pattern', 0.85);
    expect(result.success).toBe(true);
    expect(result.skill).toContain('cm-captured-');

    // Verify captured skill exists
    const capturedDir = path.join(tmpDir, 'skills', result.skill!);
    expect(fs.existsSync(path.join(capturedDir, 'SKILL.md'))).toBe(true);
    const content = fs.readFileSync(path.join(capturedDir, 'SKILL.md'), 'utf-8');
    expect(content).toContain('Auto-captured');
  });
});

// ─── Rollback ────────────────────────────────────────────────────────────────

describe('rollback', () => {
  it('restores original SKILL.md from backup', () => {
    insertTestAnalysis(backend);
    const evolver = new SkillEvolver(tmpDir, backend);

    // First evolve
    evolver.evolve('FIX', 'cm-test-skill', 0.85);
    const afterFix = fs.readFileSync(
      path.join(tmpDir, 'skills', 'cm-test-skill', 'SKILL.md'), 'utf-8'
    );
    expect(afterFix).toContain('Evolution Fix');

    // Then rollback
    const result = evolver.rollback('cm-test-skill');
    expect(result.success).toBe(true);
    const afterRollback = fs.readFileSync(
      path.join(tmpDir, 'skills', 'cm-test-skill', 'SKILL.md'), 'utf-8'
    );
    expect(afterRollback).not.toContain('Evolution Fix');
    expect(afterRollback).toContain('Test content');
  });

  it('fails when no backup exists', () => {
    const evolver = new SkillEvolver(tmpDir, backend);
    const result = evolver.rollback('cm-test-skill');
    expect(result.success).toBe(false);
    expect(result.error).toContain('No backup');
  });
});

// ─── Display Helpers ─────────────────────────────────────────────────────────

describe('formatEvolutionResult', () => {
  it('formats success result', () => {
    const output = formatEvolutionResult({
      success: true, mode: 'FIX', skill: 'cm-test-skill',
      backupPath: '/tmp/backup.md', patchApplied: 'Fix patch line 1\nline 2',
    });
    expect(output).toContain('✅');
    expect(output).toContain('FIX');
    expect(output).toContain('cm-test-skill');
  });

  it('formats failure result', () => {
    const output = formatEvolutionResult({
      success: false, mode: 'FIX', skill: 'cm-test-skill',
      error: 'Confidence too low',
    });
    expect(output).toContain('❌');
    expect(output).toContain('Confidence too low');
  });
});

describe('formatEvolutionHistory', () => {
  it('shows empty message for no history', () => {
    expect(formatEvolutionHistory([])).toContain('No evolution history');
  });

  it('formats history entries', () => {
    const output = formatEvolutionHistory([{
      id: '1', skill_name: 'cm-test-skill', mode: 'FIX',
      before_hash: 'abc', after_hash: 'def', patch_summary: 'Fixed it',
      confidence: 0.85, created_at: '2026-04-18T12:00:00Z',
    }]);
    expect(output).toContain('Evolution History');
    expect(output).toContain('cm-test-skill');
    expect(output).toContain('FIX');
  });
});
