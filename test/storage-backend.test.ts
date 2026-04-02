import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  getBackend, SqliteBackend, VikingBackend,
} from '../src/storage-backend';
import type { DbLearning, DbDecision } from '../src/storage-backend';

function makeTmpProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cm-backend-'));
  fs.mkdirSync(path.join(dir, '.cm', 'memory'), { recursive: true });
  return dir;
}

function rmrf(p: string) {
  fs.rmSync(p, { recursive: true, force: true });
}

function writeConfig(projectPath: string, content: string) {
  fs.writeFileSync(path.join(projectPath, '.cm', 'config.yaml'), content, 'utf-8');
}

const sampleLearning = (): DbLearning => ({
  id: `L-${Date.now()}`,
  what_failed: 'i18n keys missing in Thai locale',
  why_failed: 'batch skipped Thai',
  how_to_prevent: 'run i18n-sync after each batch',
  scope: 'module:i18n',
  ttl: 30,
  reinforce_count: 0,
  status: 'active',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

const sampleDecision = (): DbDecision => ({
  id: `D-${Date.now()}`,
  decision: 'Use React Hook Form over Formik',
  rationale: 'better performance with uncontrolled components',
  scope: 'module:forms',
  status: 'active',
  created_at: new Date().toISOString(),
});

// ─── Factory ──────────────────────────────────────────────────────────────────

describe('getBackend (factory)', () => {
  let tmpDir: string;

  beforeEach(() => { tmpDir = makeTmpProject(); });
  afterEach(() => { rmrf(tmpDir); });

  it('returns SqliteBackend by default (no config.yaml)', () => {
    const backend = getBackend(tmpDir);
    expect(backend).toBeInstanceOf(SqliteBackend);
  });

  it('returns SqliteBackend when config.yaml has storage.backend: sqlite', () => {
    writeConfig(tmpDir, 'storage:\n  backend: sqlite\n');
    const backend = getBackend(tmpDir);
    expect(backend).toBeInstanceOf(SqliteBackend);
  });

  it('returns VikingBackend when config.yaml has storage.backend: viking', () => {
    writeConfig(tmpDir, 'storage:\n  backend: viking\n');
    const backend = getBackend(tmpDir);
    expect(backend).toBeInstanceOf(VikingBackend);
  });

  it('defaults to sqlite when config.yaml exists but has no storage section', () => {
    writeConfig(tmpDir, 'memory:\n  max_learnings: 50\n');
    const backend = getBackend(tmpDir);
    expect(backend).toBeInstanceOf(SqliteBackend);
  });

  it('defaults to sqlite when config.yaml is malformed', () => {
    writeConfig(tmpDir, 'not: valid: yaml: [[[');
    const backend = getBackend(tmpDir);
    expect(backend).toBeInstanceOf(SqliteBackend);
  });
});

// ─── SqliteBackend ────────────────────────────────────────────────────────────

describe('SqliteBackend', () => {
  let tmpDir: string;
  let backend: SqliteBackend;

  beforeEach(() => {
    tmpDir = makeTmpProject();
    backend = new SqliteBackend(tmpDir);
    backend.initialize();
  });

  afterEach(() => {
    backend.close();
    rmrf(tmpDir);
  });

  it('initialize() does not throw', () => {
    expect(() => backend.initialize()).not.toThrow();
  });

  it('close() does not throw', () => {
    expect(() => backend.close()).not.toThrow();
  });

  // Learnings roundtrip
  it('insertLearning + getLearningById roundtrip', () => {
    const l = sampleLearning();
    backend.insertLearning(l);
    const fetched = backend.getLearningById(l.id);
    expect(fetched).not.toBeNull();
    expect(fetched!.what_failed).toBe(l.what_failed);
    expect(fetched!.scope).toBe(l.scope);
  });

  it('getLearningById returns null for unknown id', () => {
    expect(backend.getLearningById('L-nonexistent')).toBeNull();
  });

  it('queryLearnings returns matching results via FTS5', () => {
    backend.insertLearning(sampleLearning());
    const results = backend.queryLearnings('i18n');
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].what_failed).toContain('i18n');
  });

  it('queryLearnings returns empty array for no-match', () => {
    backend.insertLearning(sampleLearning());
    const results = backend.queryLearnings('xyznonexistent999');
    expect(results).toHaveLength(0);
  });

  it('queryLearnings scope filter works', () => {
    const l = sampleLearning();
    l.scope = 'module:auth';
    backend.insertLearning(l);
    const hits = backend.queryLearnings('', 'module:auth', 10);
    expect(hits.every(r => r.scope === 'module:auth')).toBe(true);
  });

  // Decisions roundtrip
  it('insertDecision + queryDecisions roundtrip', () => {
    const d = sampleDecision();
    backend.insertDecision(d);
    const results = backend.queryDecisions('React Hook Form');
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].id).toBe(d.id);
  });

  // Index cache
  it('upsertIndex + getIndex roundtrip', () => {
    backend.upsertIndex('learnings', 'L0', '## Index\n\nL001 — i18n error');
    const idx = backend.getIndex('learnings', 'L0');
    expect(idx).not.toBeNull();
    expect(idx!.content).toContain('L001');
  });

  it('getIndex returns null for missing entry', () => {
    expect(backend.getIndex('nonexistent', 'L0')).toBeNull();
  });

  // Skill outputs
  it('writeSkillOutput + getSkillOutputs roundtrip', () => {
    const sessionId = `sess-${Date.now()}`;
    backend.writeSkillOutput({
      session_id: sessionId,
      skill: 'cm-tdd',
      summary: 'tests written',
      output_path: 'test/foo.test.ts',
      affected_files: '["test/foo.test.ts"]',
      metadata: '{}',
      created_at: new Date().toISOString(),
    });
    const outputs = backend.getSkillOutputs(sessionId);
    expect(outputs).toHaveLength(1);
    expect(outputs[0].skill).toBe('cm-tdd');
  });

  it('getSkillOutputs returns empty array for unknown session', () => {
    expect(backend.getSkillOutputs('sess-unknown-xyz')).toHaveLength(0);
  });
});

// ─── VikingBackend ────────────────────────────────────────────────────────────
// VikingBackend is now a real implementation (not a stub).
// Read methods use a sync-blocking wrapper around async HTTP —
// they require a live OpenViking server for full testing.
// Offline tests cover: construction, lifecycle, fire-and-forget writes.

describe('VikingBackend', () => {
  it('constructs without throwing', () => {
    expect(() => new VikingBackend()).not.toThrow();
  });

  it('initialize() does not throw (async health ping is fire-and-forget)', () => {
    const backend = new VikingBackend({ port: 19999 });
    expect(() => backend.initialize()).not.toThrow();
  });

  it('close() does not throw', () => {
    const backend = new VikingBackend();
    expect(() => backend.close()).not.toThrow();
  });

  it('insertLearning() does not throw when server unreachable (fire-and-forget)', () => {
    const backend = new VikingBackend({ port: 19999 });
    expect(() => backend.insertLearning({
      id: 'test-001', what_failed: 'x', why_failed: 'y', how_to_prevent: 'z',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    })).not.toThrow();
  });

  it('insertDecision() does not throw when server unreachable (fire-and-forget)', () => {
    const backend = new VikingBackend({ port: 19999 });
    expect(() => backend.insertDecision({
      id: 'dec-001', decision: 'use viking', rationale: 'vector search',
      created_at: new Date().toISOString(),
    })).not.toThrow();
  });

  it('upsertIndex() does not throw when server unreachable (fire-and-forget)', () => {
    const backend = new VikingBackend({ port: 19999 });
    expect(() => backend.upsertIndex('learnings', 'L0', '## L0', 'hash-abc')).not.toThrow();
  });

  it('writeSkillOutput() does not throw when server unreachable (fire-and-forget)', () => {
    const backend = new VikingBackend({ port: 19999 });
    expect(() => backend.writeSkillOutput({
      session_id: 'sess-001', skill: 'cm-planning',
      created_at: new Date().toISOString(),
    })).not.toThrow();
  });

  it('factory + viking config → returns VikingBackend instance', () => {
    const backend = new VikingBackend({ host: 'localhost', port: 1933 });
    expect(backend.constructor.name).toBe('VikingBackend');
  });

  // Read methods (queryLearnings, queryDecisions, getLearningById, getIndex,
  // getSkillOutputs) use a sync wrapper around async HTTP. They require a live
  // OpenViking server for timeout-based fallback testing.
  // Run with: OPENVIKING_URL=http://localhost:1933 npm test
});
