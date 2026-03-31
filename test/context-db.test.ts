import { test, expect, describe, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  openDb,
  closeDb,
  insertLearning,
  queryLearnings,
  getLearningById,
  insertDecision,
  queryDecisions,
  upsertIndex,
  getIndex,
  writeSkillOutput,
  getSkillOutputs,
} from '../src/context-db';
import type { DbLearning, DbDecision } from '../src/context-db';

let tempDir: string;
let dbPath: string;

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'context-db-test-'));
  dbPath = path.join(tempDir, 'context.db');
});

afterEach(() => {
  closeDb(dbPath);
  fs.rmSync(tempDir, { recursive: true, force: true });
});

// ─── Schema Creation ─────────────────────────────────────────────────────────

describe('openDb', () => {
  test('creates database file and all tables', () => {
    openDb(dbPath);
    expect(fs.existsSync(dbPath)).toBe(true);
  });

  test('is idempotent — opening twice does not throw', () => {
    openDb(dbPath);
    expect(() => openDb(dbPath)).not.toThrow();
  });
});

// ─── Learnings CRUD + FTS5 ───────────────────────────────────────────────────

describe('learnings', () => {
  test('inserts and retrieves a learning by ID', () => {
    openDb(dbPath);
    const learning: DbLearning = {
      id: 'L001',
      what_failed: 'i18n batch extraction skipped locales',
      why_failed: 'Missing locale check in loop',
      how_to_prevent: 'Always validate locale list',
      scope: 'module',
      ttl: 60,
      reinforce_count: 2,
      status: 'active',
      created_at: '2026-03-28T00:00:00Z',
      updated_at: '2026-03-28T00:00:00Z',
    };

    insertLearning(dbPath, learning);
    const result = getLearningById(dbPath, 'L001');

    expect(result).not.toBeNull();
    expect(result!.id).toBe('L001');
    expect(result!.what_failed).toContain('i18n');
    expect(result!.scope).toBe('module');
    expect(result!.reinforce_count).toBe(2);
  });

  test('FTS5 search returns relevant results', () => {
    openDb(dbPath);
    insertLearning(dbPath, {
      id: 'L001', what_failed: 'i18n extraction failed', why_failed: 'missing locale', how_to_prevent: 'check locales',
      scope: 'module', ttl: 60, reinforce_count: 0, status: 'active',
      created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
    });
    insertLearning(dbPath, {
      id: 'L002', what_failed: 'CSS animation jitter on mobile', why_failed: 'wrong property', how_to_prevent: 'use transform',
      scope: 'component', ttl: 30, reinforce_count: 0, status: 'active',
      created_at: '2026-01-02T00:00:00Z', updated_at: '2026-01-02T00:00:00Z',
    });

    const results = queryLearnings(dbPath, 'i18n locale');

    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].id).toBe('L001');
  });

  test('FTS5 search returns empty for no match', () => {
    openDb(dbPath);
    insertLearning(dbPath, {
      id: 'L001', what_failed: 'auth token expired', why_failed: 'TTL too short', how_to_prevent: 'increase TTL',
      scope: 'global', ttl: 90, reinforce_count: 0, status: 'active',
      created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
    });

    const results = queryLearnings(dbPath, 'completely unrelated xyz');
    expect(results.length).toBe(0);
  });

  test('scope filter works alongside FTS5', () => {
    openDb(dbPath);
    insertLearning(dbPath, {
      id: 'L001', what_failed: 'login fails', why_failed: 'bad token', how_to_prevent: 'check token',
      scope: 'module', ttl: 30, reinforce_count: 0, status: 'active',
      created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
    });
    insertLearning(dbPath, {
      id: 'L002', what_failed: 'login redirect broken', why_failed: 'bad route', how_to_prevent: 'check routes',
      scope: 'global', ttl: 60, reinforce_count: 0, status: 'active',
      created_at: '2026-01-02T00:00:00Z', updated_at: '2026-01-02T00:00:00Z',
    });

    const results = queryLearnings(dbPath, 'login', 'module');
    expect(results.every(r => r.scope === 'module')).toBe(true);
  });

  test('returns empty array when no learnings exist', () => {
    openDb(dbPath);
    const results = queryLearnings(dbPath, 'anything');
    expect(results).toEqual([]);
  });
});

// ─── Decisions CRUD + FTS5 ───────────────────────────────────────────────────

describe('decisions', () => {
  test('inserts and retrieves decisions via FTS5', () => {
    openDb(dbPath);
    const decision: DbDecision = {
      id: 'D001',
      decision: 'Use namespace-split i18n architecture',
      rationale: 'Reduces bundle size per route',
      scope: 'module',
      status: 'active',
      created_at: '2026-03-01T00:00:00Z',
    };

    insertDecision(dbPath, decision);
    const results = queryDecisions(dbPath, 'i18n namespace');

    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].id).toBe('D001');
  });

  test('returns empty for no-match query', () => {
    openDb(dbPath);
    const results = queryDecisions(dbPath, 'xyz unrelated term');
    expect(results).toEqual([]);
  });
});

// ─── L0/L1 Index Cache ───────────────────────────────────────────────────────

describe('indexes', () => {
  test('upserts and retrieves a cached index', () => {
    openDb(dbPath);
    upsertIndex(dbPath, 'learnings', 'L0', '# Learnings Index\n- L001: i18n error', 'abc123');
    const idx = getIndex(dbPath, 'learnings', 'L0');

    expect(idx).not.toBeNull();
    expect(idx!.content).toContain('L001');
    expect(idx!.source_hash).toBe('abc123');
  });

  test('overwrites existing index on upsert', () => {
    openDb(dbPath);
    upsertIndex(dbPath, 'skeleton', 'L0', 'old content', 'hash1');
    upsertIndex(dbPath, 'skeleton', 'L0', 'new content', 'hash2');

    const idx = getIndex(dbPath, 'skeleton', 'L0');
    expect(idx!.content).toBe('new content');
    expect(idx!.source_hash).toBe('hash2');
  });

  test('returns null for missing index', () => {
    openDb(dbPath);
    const idx = getIndex(dbPath, 'nonexistent', 'L0');
    expect(idx).toBeNull();
  });
});

// ─── Skill Outputs ───────────────────────────────────────────────────────────

describe('skill_outputs', () => {
  test('writes and reads skill output by session', () => {
    openDb(dbPath);
    writeSkillOutput(dbPath, {
      session_id: 'sess-001',
      chain_id: 'feature-development',
      skill: 'cm-brainstorm-idea',
      output_path: 'openspec/changes/test/proposal.md',
      summary: 'Recommended Smart Spine',
      affected_files: JSON.stringify(['src/a.ts']),
      created_at: new Date().toISOString(),
    });

    const outputs = getSkillOutputs(dbPath, 'sess-001');
    expect(outputs.length).toBe(1);
    expect(outputs[0].skill).toBe('cm-brainstorm-idea');
    expect(outputs[0].summary).toContain('Smart Spine');
  });

  test('returns empty array for unknown session', () => {
    openDb(dbPath);
    const outputs = getSkillOutputs(dbPath, 'unknown-session');
    expect(outputs).toEqual([]);
  });
});
