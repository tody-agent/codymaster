import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { LearningPromoter, formatPromotionCandidates } from '../src/learning-promoter';
import { SqliteBackend } from '../src/storage-backend';
import type { DbLearning } from '../src/context-db';

// ─── Test Helpers ────────────────────────────────────────────────────────────

let tmpDir: string;
let backend: SqliteBackend;

function createTestProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cm-promoter-test-'));
  const cmDir = path.join(dir, '.cm');
  fs.mkdirSync(cmDir, { recursive: true });
  return dir;
}

function insertTestLearning(
  be: SqliteBackend,
  overrides: Partial<DbLearning> = {}
): DbLearning {
  const learning: DbLearning = {
    id: overrides.id ?? 'test-learning-' + Date.now() + Math.random(),
    what_failed: overrides.what_failed ?? 'Authentication token expired during deployment',
    why_failed: overrides.why_failed ?? 'Token lifetime is 1 hour, deployment took longer',
    how_to_prevent: overrides.how_to_prevent ?? 'Refresh token before starting long deployment',
    module: overrides.module ?? 'auth',
    agent: overrides.agent ?? 'test-agent',
    created_at: overrides.created_at ?? new Date().toISOString(),
    updated_at: overrides.updated_at ?? new Date().toISOString(),
  };
  be.insertLearning(learning);
  return learning;
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

// ─── Candidates ──────────────────────────────────────────────────────────────

describe('findCandidates', () => {
  it('requires minimum reinforcement count (3) to be a candidate', () => {
    insertTestLearning(backend, { what_failed: 'Memory leak in widget' });
    insertTestLearning(backend, { what_failed: 'Memory leak in widget' });

    const promoter = new LearningPromoter(tmpDir, backend);
    const candidates = promoter.findCandidates();
    expect(candidates).toHaveLength(0); // Only 2 occurrences

    // Add 3rd occurrence
    insertTestLearning(backend, { what_failed: 'Memory leak in widget' });
    const candidates2 = promoter.findCandidates();
    expect(candidates2).toHaveLength(1);
    expect(candidates2[0].reinforcementCount).toBe(3);
  });

  it('normalizes patterns to detect similar learnings', () => {
    // These should normalize to the same pattern
    insertTestLearning(backend, { what_failed: 'Database connection failed!' });
    insertTestLearning(backend, { what_failed: 'database connection failed' });
    insertTestLearning(backend, { what_failed: 'FAILED connection database' });

    const promoter = new LearningPromoter(tmpDir, backend);
    const candidates = promoter.findCandidates();
    expect(candidates).toHaveLength(1);
    expect(candidates[0].reinforcementCount).toBe(3);
  });

  it('sorts candidates by score', () => {
    // Pattern 1: 5 occurrences
    for (let i = 0; i < 5; i++) insertTestLearning(backend, { what_failed: 'Error A' });

    // Pattern 2: 3 occurrences
    for (let i = 0; i < 3; i++) insertTestLearning(backend, { what_failed: 'Error B' });

    const promoter = new LearningPromoter(tmpDir, backend);
    const candidates = promoter.findCandidates();

    expect(candidates).toHaveLength(2);
    expect(candidates[0].learning.what_failed).toBe('Error A'); // Higher reinforcement
    expect(candidates[1].learning.what_failed).toBe('Error B');
  });
});

// ─── Promotion ───────────────────────────────────────────────────────────────

describe('promote', () => {
  it('creates a skill markdown file from learning', () => {
    // Add 3 learnings to qualify for testing logic stability (though promote directly takes ID)
    const learning = insertTestLearning(backend, {
      what_failed: 'Regex timeout on large payload',
      why_failed: 'Catastrophic backtracking in regex string',
      how_to_prevent: 'Use non-backtracking regex or limit payload size'
    });

    const promoter = new LearningPromoter(tmpDir, backend);
    const result = promoter.promote(learning.id);

    expect(result.promoted).toBe(true);
    expect(result.skillPath).toBeTruthy();
    expect(fs.existsSync(result.skillPath)).toBe(true);

    const skillContent = fs.readFileSync(result.skillPath, 'utf-8');
    expect(skillContent).toContain('Regex timeout');
    expect(skillContent).toContain('Catastrophic backtracking');
    expect(skillContent).toContain('Use non-backtracking');
  });

  it('fails if learning does not exist', () => {
    const promoter = new LearningPromoter(tmpDir, backend);
    const result = promoter.promote('nonexistent-id');
    expect(result.promoted).toBe(false);
    expect(result.reason).toContain('not found');
  });

  it('fails if skill already exists', () => {
    const learning = insertTestLearning(backend, { what_failed: 'Duplicate task failure' });
    const promoter = new LearningPromoter(tmpDir, backend);

    // Call twice
    promoter.promote(learning.id);
    const result2 = promoter.promote(learning.id);

    expect(result2.promoted).toBe(false);
    expect(result2.reason).toContain('already exists');
  });
});

// ─── Auto-promote ────────────────────────────────────────────────────────────

describe('autoPromote', () => {
  it('promotes the highest scoring candidate', () => {
    for (let i = 0; i < 3; i++) insertTestLearning(backend, { what_failed: 'Auto deploy failed' });

    const promoter = new LearningPromoter(tmpDir, backend);
    const result = promoter.autoPromote();

    expect(result).not.toBeNull();
    expect(result!.promoted).toBe(true);
  });

  it('returns null if no candidates', () => {
    const promoter = new LearningPromoter(tmpDir, backend);
    const result = promoter.autoPromote();
    expect(result).toBeNull();
  });
});

// ─── History ─────────────────────────────────────────────────────────────────

describe('getPromotionHistory', () => {
  it('tracks promoted skills', () => {
    const learning = insertTestLearning(backend, { what_failed: 'History track test' });
    const promoter = new LearningPromoter(tmpDir, backend);

    promoter.promote(learning.id);

    const history = promoter.getPromotionHistory();
    expect(history).toHaveLength(1);
    expect(history[0].learningId).toBe(learning.id);
    expect(history[0].skillName).toContain('cm-learned-');
  });
});

// ─── Formatting ──────────────────────────────────────────────────────────────

describe('formatPromotionCandidates', () => {
  it('formats candidates list', () => {
    const output = formatPromotionCandidates([
      {
        learning: { id: '1', what_failed: 'Very long regex crash', why_failed: '', how_to_prevent: '', created_at: '', updated_at: '' },
        reinforcementCount: 5,
        score: 0.95,
        reason: 'Reinforced 5x'
      }
    ]);
    expect(output).toContain('95%');
    expect(output).toContain('5x');
    expect(output).toContain('Very long regex crash');
  });

  it('formats empty state', () => {
    const output = formatPromotionCandidates([]);
    expect(output).toContain('No learnings qualify');
  });
});
