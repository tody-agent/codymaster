import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { migrateJsonToSqlite, exportSqliteToJson } from '../src/migrate-json-to-sqlite';
import { openDb, getDbPath, queryLearnings, queryDecisions } from '../src/context-db';

function makeTmpProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cm-migrate-'));
  fs.mkdirSync(path.join(dir, '.cm', 'memory'), { recursive: true });
  return dir;
}

function rmrf(p: string) {
  fs.rmSync(p, { recursive: true, force: true });
}

function writeLearnings(projectPath: string, data: unknown[]) {
  fs.writeFileSync(
    path.join(projectPath, '.cm', 'memory', 'learnings.json'),
    JSON.stringify(data),
    'utf-8',
  );
}

function writeDecisions(projectPath: string, data: unknown[]) {
  fs.writeFileSync(
    path.join(projectPath, '.cm', 'memory', 'decisions.json'),
    JSON.stringify(data),
    'utf-8',
  );
}

// ─── migrate: JSON → SQLite ───────────────────────────────────────────────────

describe('migrateJsonToSqlite', () => {
  let tmpDir: string;

  beforeEach(() => { tmpDir = makeTmpProject(); });
  afterEach(() => { rmrf(tmpDir); });

  it('migrates learnings with camelCase fields', () => {
    writeLearnings(tmpDir, [
      {
        id: 'L001',
        whatFailed: 'i18n keys missing',
        whyFailed: 'batch skipped Thai locale',
        howToPrevent: 'run i18n-sync after each batch',
        scope: 'module:i18n',
        ttl: 30,
        reinforceCount: 2,
        status: 'active',
        date: '2026-01-01',
      },
    ]);

    const result = migrateJsonToSqlite(tmpDir);
    expect(result.learnings.migrated).toBe(1);
    expect(result.learnings.skipped).toBe(0);
    expect(result.backupCreated).toBe(true);

    const dbPath = getDbPath(tmpDir);
    openDb(dbPath);
    const rows = queryLearnings(dbPath, 'i18n');
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(rows[0].id).toBe('L001');
    expect(rows[0].what_failed).toBe('i18n keys missing');
    expect(rows[0].scope).toBe('module:i18n');
  });

  it('migrates learnings with snake_case fields', () => {
    writeLearnings(tmpDir, [
      {
        id: 'L002',
        what_failed: 'deploy failed',
        why_failed: 'wrong env var',
        how_to_prevent: 'check .env before deploy',
        scope: 'global',
        ttl: 60,
        reinforce_count: 0,
        status: 'active',
      },
    ]);

    const result = migrateJsonToSqlite(tmpDir);
    expect(result.learnings.migrated).toBe(1);

    const dbPath = getDbPath(tmpDir);
    openDb(dbPath);
    const rows = queryLearnings(dbPath, 'deploy');
    expect(rows[0].what_failed).toBe('deploy failed');
  });

  it('migrates legacy "error" field as what_failed', () => {
    writeLearnings(tmpDir, [
      { id: 'L003', error: 'TypeScript strict error', scope: 'global', status: 'active' },
    ]);
    const result = migrateJsonToSqlite(tmpDir);
    expect(result.learnings.migrated).toBe(1);

    const dbPath = getDbPath(tmpDir);
    openDb(dbPath);
    const rows = queryLearnings(dbPath, 'TypeScript');
    expect(rows[0].what_failed).toBe('TypeScript strict error');
  });

  it('migrates decisions', () => {
    writeDecisions(tmpDir, [
      {
        id: 'D001',
        decision: 'Use React Hook Form over Formik',
        rationale: 'Better performance',
        scope: 'module:forms',
        status: 'active',
        date: '2026-01-15',
      },
    ]);

    const result = migrateJsonToSqlite(tmpDir);
    expect(result.decisions.migrated).toBe(1);
    expect(result.decisions.skipped).toBe(0);

    const dbPath = getDbPath(tmpDir);
    openDb(dbPath);
    const rows = queryDecisions(dbPath, 'React Hook Form');
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(rows[0].id).toBe('D001');
  });

  it('handles supersededBy camelCase in decisions', () => {
    writeDecisions(tmpDir, [
      { id: 'D002', decision: 'Use axios', rationale: 'simpler', scope: 'global', status: 'superseded', supersededBy: 'D003' },
    ]);
    const result = migrateJsonToSqlite(tmpDir);
    expect(result.decisions.migrated).toBe(1);
  });

  it('creates .backup files', () => {
    writeLearnings(tmpDir, [{ id: 'L004', error: 'test', scope: 'global', status: 'active' }]);
    migrateJsonToSqlite(tmpDir);
    expect(fs.existsSync(path.join(tmpDir, '.cm', 'memory', 'learnings.json.backup'))).toBe(true);
  });

  it('migrates multiple learnings', () => {
    writeLearnings(tmpDir, [
      { id: 'L010', error: 'error A', scope: 'global', status: 'active' },
      { id: 'L011', error: 'error B', scope: 'module:auth', status: 'active' },
      { id: 'L012', error: 'error C', scope: 'global', status: 'archived' },
    ]);
    const result = migrateJsonToSqlite(tmpDir);
    expect(result.learnings.migrated).toBe(3);
  });

  it('returns zero counts when no JSON files exist', () => {
    const result = migrateJsonToSqlite(tmpDir);
    expect(result.learnings.migrated).toBe(0);
    expect(result.decisions.migrated).toBe(0);
    expect(result.backupCreated).toBe(false);
  });
});

// ─── export: SQLite → JSON ────────────────────────────────────────────────────

describe('exportSqliteToJson', () => {
  let tmpDir: string;

  beforeEach(() => { tmpDir = makeTmpProject(); });
  afterEach(() => { rmrf(tmpDir); });

  it('exports learnings back to JSON', () => {
    writeLearnings(tmpDir, [
      { id: 'L020', error: 'export test', scope: 'global', status: 'active' },
    ]);
    migrateJsonToSqlite(tmpDir);

    const result = exportSqliteToJson(tmpDir);
    expect(result.learnings).toBe(1);

    const exported = JSON.parse(fs.readFileSync(result.learningsPath, 'utf-8'));
    expect(exported[0].id).toBe('L020');
  });

  it('exports decisions back to JSON', () => {
    writeDecisions(tmpDir, [
      { id: 'D020', decision: 'Use SQLite', rationale: 'performance', scope: 'global', status: 'active' },
    ]);
    migrateJsonToSqlite(tmpDir);

    const result = exportSqliteToJson(tmpDir);
    expect(result.decisions).toBe(1);

    const exported = JSON.parse(fs.readFileSync(result.decisionsPath, 'utf-8'));
    expect(exported[0].decision).toBe('Use SQLite');
  });

  it('round-trip: migrate → export → same count', () => {
    writeLearnings(tmpDir, [
      { id: 'L030', error: 'A', scope: 'global', status: 'active' },
      { id: 'L031', error: 'B', scope: 'global', status: 'active' },
    ]);
    const migrated = migrateJsonToSqlite(tmpDir);
    const exported = exportSqliteToJson(tmpDir);
    expect(exported.learnings).toBe(migrated.learnings.migrated);
  });
});
