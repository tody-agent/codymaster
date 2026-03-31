import Database from 'better-sqlite3';
import path from 'path';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DbLearning {
  id: string;
  what_failed: string;
  why_failed: string;
  how_to_prevent: string;
  scope?: string;
  ttl?: number;
  reinforce_count?: number;
  status?: string;
  created_at: string;
  updated_at: string;
  agent?: string;
  task_id?: string;
  module?: string;
}

export interface DbDecision {
  id: string;
  decision: string;
  rationale: string;
  scope?: string;
  status?: string;
  superseded_by?: string;
  created_at: string;
  agent?: string;
}

export interface DbIndex {
  resource: string;
  level: string;
  content: string;
  token_count?: number;
  generated_at: string;
  source_hash?: string;
}

export interface DbSkillOutput {
  session_id: string;
  chain_id?: string;
  skill: string;
  output_path?: string;
  summary?: string;
  affected_files?: string;
  metadata?: string;
  created_at: string;
}

// ─── DB Cache (one connection per path) ─────────────────────────────────────

const dbCache = new Map<string, Database.Database>();

function getDb(dbPath: string): Database.Database {
  if (dbCache.has(dbPath)) return dbCache.get(dbPath)!;
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  dbCache.set(dbPath, db);
  return db;
}

// ─── Schema ─────────────────────────────────────────────────────────────────

const SCHEMA = `
CREATE TABLE IF NOT EXISTS learnings (
  id TEXT PRIMARY KEY,
  what_failed TEXT NOT NULL,
  why_failed TEXT NOT NULL DEFAULT '',
  how_to_prevent TEXT NOT NULL DEFAULT '',
  scope TEXT DEFAULT 'global',
  ttl INTEGER DEFAULT 60,
  reinforce_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  agent TEXT,
  task_id TEXT,
  module TEXT
);

CREATE VIRTUAL TABLE IF NOT EXISTS learnings_fts USING fts5(
  what_failed, why_failed, how_to_prevent,
  content=learnings, content_rowid=rowid
);

CREATE TRIGGER IF NOT EXISTS learnings_ai AFTER INSERT ON learnings BEGIN
  INSERT INTO learnings_fts(rowid, what_failed, why_failed, how_to_prevent)
  VALUES (new.rowid, new.what_failed, new.why_failed, new.how_to_prevent);
END;

CREATE TRIGGER IF NOT EXISTS learnings_ad AFTER DELETE ON learnings BEGIN
  INSERT INTO learnings_fts(learnings_fts, rowid, what_failed, why_failed, how_to_prevent)
  VALUES('delete', old.rowid, old.what_failed, old.why_failed, old.how_to_prevent);
END;

CREATE TABLE IF NOT EXISTS decisions (
  id TEXT PRIMARY KEY,
  decision TEXT NOT NULL,
  rationale TEXT NOT NULL DEFAULT '',
  scope TEXT DEFAULT 'global',
  status TEXT DEFAULT 'active',
  superseded_by TEXT,
  created_at TEXT NOT NULL,
  agent TEXT
);

CREATE VIRTUAL TABLE IF NOT EXISTS decisions_fts USING fts5(
  decision, rationale,
  content=decisions, content_rowid=rowid
);

CREATE TRIGGER IF NOT EXISTS decisions_ai AFTER INSERT ON decisions BEGIN
  INSERT INTO decisions_fts(rowid, decision, rationale)
  VALUES (new.rowid, new.decision, new.rationale);
END;

CREATE TRIGGER IF NOT EXISTS decisions_ad AFTER DELETE ON decisions BEGIN
  INSERT INTO decisions_fts(decisions_fts, rowid, decision, rationale)
  VALUES ('delete', old.rowid, old.decision, old.rationale);
END;

CREATE TABLE IF NOT EXISTS skill_outputs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  chain_id TEXT,
  skill TEXT NOT NULL,
  output_path TEXT,
  summary TEXT,
  affected_files TEXT,
  metadata TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS indexes (
  resource TEXT NOT NULL,
  level TEXT NOT NULL,
  content TEXT NOT NULL,
  token_count INTEGER,
  generated_at TEXT NOT NULL,
  source_hash TEXT,
  PRIMARY KEY (resource, level)
);

CREATE TABLE IF NOT EXISTS token_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  category TEXT NOT NULL,
  tokens_used INTEGER NOT NULL,
  timestamp TEXT NOT NULL
);
`;

// ─── Open / Close ────────────────────────────────────────────────────────────

export function openDb(dbPath: string): Database.Database {
  const db = getDb(dbPath);
  db.exec(SCHEMA);
  return db;
}

export function closeDb(dbPath: string): void {
  const db = dbCache.get(dbPath);
  if (db) {
    try { db.close(); } catch { /* already closed */ }
    dbCache.delete(dbPath);
  }
}

// ─── Learnings ───────────────────────────────────────────────────────────────

export function insertLearning(dbPath: string, learning: DbLearning): void {
  const db = openDb(dbPath);
  db.prepare(`
    INSERT OR REPLACE INTO learnings
      (id, what_failed, why_failed, how_to_prevent, scope, ttl, reinforce_count,
       status, created_at, updated_at, agent, task_id, module)
    VALUES
      (@id, @what_failed, @why_failed, @how_to_prevent, @scope, @ttl, @reinforce_count,
       @status, @created_at, @updated_at, @agent, @task_id, @module)
  `).run({
    id: learning.id,
    what_failed: learning.what_failed,
    why_failed: learning.why_failed ?? '',
    how_to_prevent: learning.how_to_prevent ?? '',
    scope: learning.scope ?? 'global',
    ttl: learning.ttl ?? 60,
    reinforce_count: learning.reinforce_count ?? 0,
    status: learning.status ?? 'active',
    created_at: learning.created_at,
    updated_at: learning.updated_at,
    agent: learning.agent ?? null,
    task_id: learning.task_id ?? null,
    module: learning.module ?? null,
  });
}

export function getLearningById(dbPath: string, id: string): DbLearning | null {
  const db = openDb(dbPath);
  return (db.prepare('SELECT * FROM learnings WHERE id = ?').get(id) as DbLearning) ?? null;
}

export function queryLearnings(
  dbPath: string,
  query: string,
  scope?: string,
  limit = 10
): DbLearning[] {
  const db = openDb(dbPath);

  if (!query.trim()) {
    const sql = scope
      ? "SELECT * FROM learnings WHERE scope = ? AND status != 'archived' ORDER BY created_at DESC LIMIT ?"
      : "SELECT * FROM learnings WHERE status != 'archived' ORDER BY created_at DESC LIMIT ?";
    return scope
      ? (db.prepare(sql).all(scope, limit) as DbLearning[])
      : (db.prepare(sql).all(limit) as DbLearning[]);
  }

  // Sanitize scope for SQL (not user-facing, but defensive)
  const scopeClause = scope ? `AND learnings.scope = '${scope.replace(/'/g, "''")}'` : '';

  return db.prepare(`
    SELECT learnings.* FROM learnings
    JOIN learnings_fts ON learnings.rowid = learnings_fts.rowid
    WHERE learnings_fts MATCH ?
      AND learnings.status != 'archived'
      ${scopeClause}
    ORDER BY bm25(learnings_fts)
    LIMIT ?
  `).all(query, limit) as DbLearning[];
}

// ─── Decisions ───────────────────────────────────────────────────────────────

export function insertDecision(dbPath: string, decision: DbDecision): void {
  const db = openDb(dbPath);
  db.prepare(`
    INSERT OR REPLACE INTO decisions
      (id, decision, rationale, scope, status, superseded_by, created_at, agent)
    VALUES
      (@id, @decision, @rationale, @scope, @status, @superseded_by, @created_at, @agent)
  `).run({
    id: decision.id,
    decision: decision.decision,
    rationale: decision.rationale ?? '',
    scope: decision.scope ?? 'global',
    status: decision.status ?? 'active',
    superseded_by: decision.superseded_by ?? null,
    created_at: decision.created_at,
    agent: decision.agent ?? null,
  });
}

export function queryDecisions(
  dbPath: string,
  query: string,
  limit = 10
): DbDecision[] {
  const db = openDb(dbPath);

  if (!query.trim()) {
    return db.prepare(
      "SELECT * FROM decisions WHERE status != 'archived' ORDER BY created_at DESC LIMIT ?"
    ).all(limit) as DbDecision[];
  }

  return db.prepare(`
    SELECT decisions.* FROM decisions
    JOIN decisions_fts ON decisions.rowid = decisions_fts.rowid
    WHERE decisions_fts MATCH ?
      AND decisions.status != 'archived'
    ORDER BY bm25(decisions_fts)
    LIMIT ?
  `).all(query, limit) as DbDecision[];
}

// ─── Index Cache ─────────────────────────────────────────────────────────────

export function upsertIndex(
  dbPath: string,
  resource: string,
  level: string,
  content: string,
  sourceHash?: string
): void {
  const db = openDb(dbPath);
  const tokenCount = Math.ceil(content.length / 4);
  db.prepare(`
    INSERT OR REPLACE INTO indexes (resource, level, content, token_count, generated_at, source_hash)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(resource, level, content, tokenCount, new Date().toISOString(), sourceHash ?? null);
}

export function getIndex(
  dbPath: string,
  resource: string,
  level: string
): DbIndex | null {
  const db = openDb(dbPath);
  return (db.prepare(
    'SELECT * FROM indexes WHERE resource = ? AND level = ?'
  ).get(resource, level) as DbIndex) ?? null;
}

// ─── Skill Outputs ────────────────────────────────────────────────────────────

export function writeSkillOutput(dbPath: string, output: DbSkillOutput): void {
  const db = openDb(dbPath);
  db.prepare(`
    INSERT INTO skill_outputs
      (session_id, chain_id, skill, output_path, summary, affected_files, metadata, created_at)
    VALUES
      (@session_id, @chain_id, @skill, @output_path, @summary, @affected_files, @metadata, @created_at)
  `).run({
    session_id: output.session_id,
    chain_id: output.chain_id ?? null,
    skill: output.skill,
    output_path: output.output_path ?? null,
    summary: output.summary ?? null,
    affected_files: output.affected_files ?? null,
    metadata: output.metadata ?? null,
    created_at: output.created_at,
  });
}

export function getSkillOutputs(dbPath: string, sessionId: string): DbSkillOutput[] {
  const db = openDb(dbPath);
  return db.prepare(
    'SELECT * FROM skill_outputs WHERE session_id = ? ORDER BY id ASC'
  ).all(sessionId) as DbSkillOutput[];
}

// ─── DB Path Helper ──────────────────────────────────────────────────────────

export function getDbPath(projectPath: string): string {
  return path.join(projectPath, '.cm', 'context.db');
}
