import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import Database from 'better-sqlite3';
import { createChainExecution } from '../src/skill-chain';

function makeTmpProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cm-skill-chain-'));
  fs.mkdirSync(path.join(dir, '.cm'), { recursive: true });
  return dir;
}

describe('skill-chain cache integration', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpProject();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('reuses a cached chain when available', () => {
    const dbPath = path.join(tmpDir, '.cm', 'context.db');
    const db = new Database(dbPath);
    db.exec(`
      CREATE TABLE IF NOT EXISTS skill_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_pattern TEXT NOT NULL,
        skill_chain_json TEXT NOT NULL,
        effectiveness REAL NOT NULL DEFAULT 0,
        token_used INTEGER NOT NULL DEFAULT 0,
        hit_count INTEGER NOT NULL DEFAULT 0,
        last_hit TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_skill_cache_pattern ON skill_cache(task_pattern);
      CREATE VIRTUAL TABLE IF NOT EXISTS skill_cache_fts USING fts5(
        task_pattern,
        content=skill_cache, content_rowid=rowid
      );
      CREATE TRIGGER IF NOT EXISTS skill_cache_ai AFTER INSERT ON skill_cache BEGIN
        INSERT INTO skill_cache_fts(rowid, task_pattern) VALUES (new.rowid, new.task_pattern);
      END;
    `);
    db.prepare(`
      INSERT INTO skill_cache
        (task_pattern, skill_chain_json, effectiveness, token_used, hit_count, last_hit, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      'fix login bug authentication',
      JSON.stringify(['cm-debugging', 'cm-tdd']),
      0.95,
      1200,
      3,
      new Date().toISOString(),
      new Date().toISOString(),
    );
    db.close();

    const execution = createChainExecution(
      {
        id: 'feature-development',
        name: 'Feature Development',
        description: 'Test chain',
        icon: 'x',
        triggers: ['fix'],
        steps: [
          { skill: 'cm-planning', condition: 'always', description: 'Plan', optional: false },
          { skill: 'cm-debugging', condition: 'always', description: 'Debug', optional: false },
          { skill: 'cm-tdd', condition: 'always', description: 'Test', optional: false },
        ],
      },
      'project-1',
      'fix login bug',
      'codex',
      tmpDir,
    );

    expect(execution.cacheHit).toBe(true);
    expect(execution.steps.map(step => step.skill)).toEqual(['cm-debugging', 'cm-tdd']);
  });
});
