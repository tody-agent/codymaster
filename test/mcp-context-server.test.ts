/**
 * MCP Context Server tests — unit-level, no stdio process spawning.
 * We test the tool logic by importing the internals indirectly through
 * the modules they delegate to (context-db, uri-resolver, context-bus, token-budget).
 * Integration of JSON-RPC framing is covered by the existing mcp-bridge pattern.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { openDb, getDbPath, insertLearning, insertDecision } from '../src/context-db';
import { queryLearnings, queryDecisions } from '../src/context-db';
import { resolve as resolveUri } from '../src/uri-resolver';
import { initBus, readBus, updateBusStep } from '../src/context-bus';
import { loadBudget, checkBudget, estimateTokens } from '../src/token-budget';
import { refreshAllIndexes } from '../src/l0-indexer';
import { ensureCmDir } from '../src/continuity';

function makeTmpProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cm-mcp-'));
  fs.mkdirSync(path.join(dir, '.cm', 'memory'), { recursive: true });
  return dir;
}

function rmrf(p: string) {
  fs.rmSync(p, { recursive: true, force: true });
}

// ─── cm_query ─────────────────────────────────────────────────────────────────

describe('cm_query (FTS5 search)', () => {
  let tmpDir: string;
  let dbPath: string;

  beforeEach(() => {
    tmpDir = makeTmpProject();
    dbPath = getDbPath(tmpDir);
    openDb(dbPath);
    insertLearning(dbPath, {
      id: 'L001', what_failed: 'i18n keys missing in Thai locale',
      why_failed: 'batch skipped', how_to_prevent: 'run i18n-sync',
      scope: 'module:i18n', ttl: 30, reinforce_count: 0,
      status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    });
    insertLearning(dbPath, {
      id: 'L002', what_failed: 'deploy failed on prod',
      why_failed: 'wrong env', how_to_prevent: 'check .env',
      scope: 'global', ttl: 60, reinforce_count: 2,
      status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    });
    insertDecision(dbPath, {
      id: 'D001', decision: 'Use React Hook Form over Formik',
      rationale: 'better perf', scope: 'module:forms', status: 'active',
      created_at: new Date().toISOString(),
    });
  });

  afterEach(() => { rmrf(tmpDir); });

  it('returns matching learnings for keyword query', () => {
    const results = queryLearnings(dbPath, 'i18n', undefined, 10);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].id).toBe('L001');
  });

  it('returns matching decisions for keyword query', () => {
    const results = queryDecisions(dbPath, 'React Hook Form', 10);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].id).toBe('D001');
  });

  it('returns empty array for no-match query', () => {
    const results = queryLearnings(dbPath, 'xyznonexistent999', undefined, 10);
    expect(results.length).toBe(0);
  });

  it('scope filter narrows learnings', () => {
    const global = queryLearnings(dbPath, 'deploy', 'global', 10);
    expect(global.every(r => r.scope === 'global')).toBe(true);
  });

  it('limit parameter is respected', () => {
    for (let i = 10; i < 20; i++) {
      insertLearning(dbPath, {
        id: `L0${i}`, what_failed: `deploy error ${i}`,
        why_failed: '', how_to_prevent: '', scope: 'global',
        ttl: 30, reinforce_count: 0, status: 'active',
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      });
    }
    const results = queryLearnings(dbPath, 'deploy', undefined, 3);
    expect(results.length).toBeLessThanOrEqual(3);
  });
});

// ─── cm_resolve ───────────────────────────────────────────────────────────────

describe('cm_resolve (URI resolver)', () => {
  let tmpDir: string;

  beforeEach(() => { tmpDir = makeTmpProject(); });
  afterEach(() => { rmrf(tmpDir); });

  it('resolves cm://memory/working when file exists', () => {
    fs.writeFileSync(path.join(tmpDir, '.cm', 'CONTINUITY.md'), '# State\n\n## Active Goal\nBuild auth', 'utf-8');
    const r = resolveUri('cm://memory/working', tmpDir, 'L1');
    expect(r.found).toBe(true);
    expect(r.tokenEstimate).toBeGreaterThan(0);
  });

  it('returns found=false with reason tokens for missing file', () => {
    // notFound() includes a reason message string, so tokenEstimate > 0 even when found=false
    const r = resolveUri('cm://memory/working', tmpDir, 'L1');
    expect(r.found).toBe(false);
    expect(r.tokenEstimate).toBeGreaterThan(0);
  });

  it('resolves cm://pipeline/current when bus active', () => {
    initBus(tmpDir, 'feature-development', 'sess-test');
    const r = resolveUri('cm://pipeline/current', tmpDir);
    expect(r.found).toBe(true);
    expect(r.content).toContain('feature-development');
  });

  it('returns found=false for unknown namespace', () => {
    const r = resolveUri('cm://invalid/path', tmpDir);
    expect(r.found).toBe(false);
  });
});

// ─── cm_bus_read / cm_bus_write ───────────────────────────────────────────────

describe('cm_bus_read / cm_bus_write', () => {
  let tmpDir: string;

  beforeEach(() => { tmpDir = makeTmpProject(); });
  afterEach(() => { rmrf(tmpDir); });

  it('bus is null before chain starts', () => {
    expect(readBus(tmpDir)).toBeNull();
  });

  it('bus active after initBus', () => {
    initBus(tmpDir, 'bug-fix', 'sess-001');
    const bus = readBus(tmpDir);
    expect(bus).not.toBeNull();
    expect(bus!.pipeline).toBe('bug-fix');
  });

  it('updateBusStep records skill output', () => {
    initBus(tmpDir, 'feature-development', 'sess-002');
    updateBusStep(tmpDir, 'cm-brainstorm-idea', {
      summary: 'Recommended Smart Spine',
      output_path: 'openspec/proposal.md',
      affected_files: [],
      metadata: {},
    });
    const bus = readBus(tmpDir);
    expect(bus!.shared_context['cm-brainstorm-idea']).toBeDefined();
    expect(bus!.shared_context['cm-brainstorm-idea'].summary).toBe('Recommended Smart Spine');
  });

  it('updateBusStep throws when no bus initialized', () => {
    expect(() =>
      updateBusStep(tmpDir, 'cm-tdd', { summary: '', output_path: '', affected_files: [], metadata: {} })
    ).toThrow();
  });
});

// ─── cm_budget_check ──────────────────────────────────────────────────────────

describe('cm_budget_check', () => {
  let tmpDir: string;

  beforeEach(() => { tmpDir = makeTmpProject(); });
  afterEach(() => { rmrf(tmpDir); });

  it('allows request within budget', () => {
    const budget = loadBudget(tmpDir);
    const result = checkBudget(budget, 'memory_learnings', 100);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThan(0);
  });

  it('provides suggestion when over soft limit (soft mode allows but warns)', () => {
    // Default enforcement is 'soft' — allowed=true but suggestion is set as warning
    const budget = loadBudget(tmpDir);
    const result = checkBudget(budget, 'memory_learnings', 999999);
    // In soft mode: over-budget returns suggestion but still allows
    expect(result.suggestion).toBeDefined();
    expect(result.remaining).toBeLessThan(0);
  });

  it('blocks request in hard enforcement mode', () => {
    const budget = { ...loadBudget(tmpDir), enforcement: 'hard' as const };
    const result = checkBudget(budget, 'memory_learnings', 999999);
    expect(result.allowed).toBe(false);
    expect(result.suggestion).toBeDefined();
  });

  it('estimateTokens returns positive value for non-empty text', () => {
    const tokens = estimateTokens('Hello world this is a test sentence with many words.');
    expect(tokens).toBeGreaterThan(0);
  });

  it('estimateTokens returns 0 for empty string', () => {
    expect(estimateTokens('')).toBe(0);
  });
});

// ─── cm_memory_decay (TTL logic) ─────────────────────────────────────────────

describe('cm_memory_decay', () => {
  let tmpDir: string;
  let dbPath: string;

  beforeEach(() => {
    tmpDir = makeTmpProject();
    dbPath = getDbPath(tmpDir);
    openDb(dbPath);
  });

  afterEach(() => { rmrf(tmpDir); });

  it('recent learnings are not expired', () => {
    const db = openDb(dbPath);
    insertLearning(dbPath, {
      id: 'L100', what_failed: 'recent error',
      why_failed: '', how_to_prevent: '', scope: 'global',
      ttl: 30, reinforce_count: 0, status: 'active',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    });
    const rows = db.prepare(`SELECT id FROM learnings WHERE id = 'L100' AND status = 'active'`).all();
    expect(rows.length).toBe(1);
  });

  it('old learnings past TTL would be detected', () => {
    const db = openDb(dbPath);
    // Insert with old date (60 days ago) and TTL 30
    const old = new Date(Date.now() - 65 * 24 * 60 * 60 * 1000).toISOString();
    insertLearning(dbPath, {
      id: 'L200', what_failed: 'very old error',
      why_failed: '', how_to_prevent: '', scope: 'global',
      ttl: 30, reinforce_count: 0, status: 'active',
      created_at: old, updated_at: old,
    });

    // Simulate decay logic
    const now = new Date();
    const candidates = db.prepare(`
      SELECT id, created_at, ttl FROM learnings
      WHERE status = 'active' AND ttl IS NOT NULL AND ttl > 0
    `).all() as Array<{ id: string; created_at: string; ttl: number }>;

    const expired = candidates.filter(row => {
      const daysSince = (now.getTime() - new Date(row.created_at).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince >= row.ttl;
    });

    expect(expired.some(r => r.id === 'L200')).toBe(true);
  });
});

// ─── cm_index_refresh ────────────────────────────────────────────────────────

describe('cm_index_refresh', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpProject();
    ensureCmDir(tmpDir);
  });

  afterEach(() => { rmrf(tmpDir); });

  it('refreshAllIndexes creates learnings-index.md', () => {
    refreshAllIndexes(tmpDir);
    expect(fs.existsSync(path.join(tmpDir, '.cm', 'learnings-index.md'))).toBe(true);
  });

  it('refreshAllIndexes creates skeleton-index.md', () => {
    refreshAllIndexes(tmpDir);
    expect(fs.existsSync(path.join(tmpDir, '.cm', 'skeleton-index.md'))).toBe(true);
  });

  it('refresh result has learnings and skeleton fields', () => {
    const result = refreshAllIndexes(tmpDir);
    expect(typeof result.learnings).toBe('string');
    expect(typeof result.skeleton).toBe('string');
  });
});
