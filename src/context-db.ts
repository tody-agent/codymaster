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

export type DbExecutionStatus = 'completed' | 'partial' | 'failed';
export type DbEvolutionRecommendation = 'FIX' | 'DERIVED' | 'CAPTURED';

export interface DbSkillJudgment {
  skill: string;
  selected?: boolean;
  applied?: boolean;
  task_completed?: boolean;
  fallback_used?: boolean;
  token_estimate?: number;
  note?: string;
  relevance_score?: number;
}

export interface DbExecutionAnalysis {
  id: string;
  task_title: string;
  status: DbExecutionStatus;
  summary: string;
  source_task_type?: string;
  session_id?: string;
  chain_id?: string;
  selected_skills?: string[];
  token_estimate?: number;
  latency_bucket?: string;
  bus_snapshot?: string;
  retro_summary?: string;
  recommended_action?: DbEvolutionRecommendation;
  confidence?: number;
  skill_judgments: DbSkillJudgment[];
  created_at: string;
}

export interface DbSkillMetric {
  skill: string;
  selections: number;
  applications: number;
  task_completions: number;
  fallbacks: number;
  total_token_estimate: number;
  last_task_type?: string;
  last_recommended_action?: string;
  last_used_at: string;
  updated_at: string;
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

CREATE TABLE IF NOT EXISTS execution_analyses (
  id TEXT PRIMARY KEY,
  task_title TEXT NOT NULL,
  status TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  source_task_type TEXT,
  session_id TEXT,
  chain_id TEXT,
  selected_skills_json TEXT NOT NULL DEFAULT '[]',
  token_estimate INTEGER DEFAULT 0,
  latency_bucket TEXT,
  bus_snapshot TEXT,
  retro_summary TEXT,
  recommended_action TEXT,
  confidence REAL,
  skill_judgments_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS skill_metrics (
  skill TEXT PRIMARY KEY,
  selections INTEGER NOT NULL DEFAULT 0,
  applications INTEGER NOT NULL DEFAULT 0,
  task_completions INTEGER NOT NULL DEFAULT 0,
  fallbacks INTEGER NOT NULL DEFAULT 0,
  total_token_estimate INTEGER NOT NULL DEFAULT 0,
  last_task_type TEXT,
  last_recommended_action TEXT,
  last_used_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
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

// ─── Execution Analyses ─────────────────────────────────────────────────────

function safeParseJsonArray<T>(raw: string | null | undefined): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function rowToExecutionAnalysis(row: Record<string, unknown>): DbExecutionAnalysis {
  return {
    id: String(row.id),
    task_title: String(row.task_title),
    status: row.status as DbExecutionStatus,
    summary: String(row.summary ?? ''),
    source_task_type: typeof row.source_task_type === 'string' ? row.source_task_type : undefined,
    session_id: typeof row.session_id === 'string' ? row.session_id : undefined,
    chain_id: typeof row.chain_id === 'string' ? row.chain_id : undefined,
    selected_skills: safeParseJsonArray<string>(row.selected_skills_json as string | null | undefined),
    token_estimate: typeof row.token_estimate === 'number' ? row.token_estimate : undefined,
    latency_bucket: typeof row.latency_bucket === 'string' ? row.latency_bucket : undefined,
    bus_snapshot: typeof row.bus_snapshot === 'string' ? row.bus_snapshot : undefined,
    retro_summary: typeof row.retro_summary === 'string' ? row.retro_summary : undefined,
    recommended_action: row.recommended_action as DbEvolutionRecommendation | undefined,
    confidence: typeof row.confidence === 'number' ? row.confidence : undefined,
    skill_judgments: safeParseJsonArray<DbSkillJudgment>(row.skill_judgments_json as string | null | undefined),
    created_at: String(row.created_at),
  };
}

export function recordExecutionAnalysis(dbPath: string, analysis: DbExecutionAnalysis): void {
  const db = openDb(dbPath);
  const now = analysis.created_at || new Date().toISOString();
  const selectedSkills = JSON.stringify(analysis.selected_skills ?? []);
  const skillJudgments = JSON.stringify(analysis.skill_judgments ?? []);

  const insertAnalysis = db.prepare(`
    INSERT OR REPLACE INTO execution_analyses
      (id, task_title, status, summary, source_task_type, session_id, chain_id,
       selected_skills_json, token_estimate, latency_bucket, bus_snapshot,
       retro_summary, recommended_action, confidence, skill_judgments_json, created_at)
    VALUES
      (@id, @task_title, @status, @summary, @source_task_type, @session_id, @chain_id,
       @selected_skills_json, @token_estimate, @latency_bucket, @bus_snapshot,
       @retro_summary, @recommended_action, @confidence, @skill_judgments_json, @created_at)
  `);

  const upsertMetric = db.prepare(`
    INSERT INTO skill_metrics
      (skill, selections, applications, task_completions, fallbacks, total_token_estimate,
       last_task_type, last_recommended_action, last_used_at, updated_at)
    VALUES
      (@skill, @selections, @applications, @task_completions, @fallbacks, @total_token_estimate,
       @last_task_type, @last_recommended_action, @last_used_at, @updated_at)
    ON CONFLICT(skill) DO UPDATE SET
      selections = skill_metrics.selections + excluded.selections,
      applications = skill_metrics.applications + excluded.applications,
      task_completions = skill_metrics.task_completions + excluded.task_completions,
      fallbacks = skill_metrics.fallbacks + excluded.fallbacks,
      total_token_estimate = skill_metrics.total_token_estimate + excluded.total_token_estimate,
      last_task_type = COALESCE(excluded.last_task_type, skill_metrics.last_task_type),
      last_recommended_action = COALESCE(excluded.last_recommended_action, skill_metrics.last_recommended_action),
      last_used_at = excluded.last_used_at,
      updated_at = excluded.updated_at
  `);

  const txn = db.transaction(() => {
    insertAnalysis.run({
      id: analysis.id,
      task_title: analysis.task_title,
      status: analysis.status,
      summary: analysis.summary,
      source_task_type: analysis.source_task_type ?? null,
      session_id: analysis.session_id ?? null,
      chain_id: analysis.chain_id ?? null,
      selected_skills_json: selectedSkills,
      token_estimate: analysis.token_estimate ?? 0,
      latency_bucket: analysis.latency_bucket ?? null,
      bus_snapshot: analysis.bus_snapshot ?? null,
      retro_summary: analysis.retro_summary ?? null,
      recommended_action: analysis.recommended_action ?? null,
      confidence: analysis.confidence ?? null,
      skill_judgments_json: skillJudgments,
      created_at: now,
    });

    for (const judgment of analysis.skill_judgments ?? []) {
      const skill = judgment.skill?.trim();
      if (!skill) continue;
      upsertMetric.run({
        skill,
        selections: judgment.selected ? 1 : 0,
        applications: judgment.applied ? 1 : 0,
        task_completions: judgment.task_completed ? 1 : 0,
        fallbacks: judgment.fallback_used ? 1 : 0,
        total_token_estimate: judgment.token_estimate ?? 0,
        last_task_type: analysis.source_task_type ?? null,
        last_recommended_action: analysis.recommended_action ?? null,
        last_used_at: now,
        updated_at: now,
      });
    }
  });

  txn();
}

export function getExecutionAnalyses(dbPath: string, limit = 20): DbExecutionAnalysis[] {
  const db = openDb(dbPath);
  const rows = db.prepare(
    'SELECT * FROM execution_analyses ORDER BY created_at DESC LIMIT ?'
  ).all(limit) as Record<string, unknown>[];
  return rows.map(rowToExecutionAnalysis);
}

export function getSkillMetric(dbPath: string, skill: string): DbSkillMetric | null {
  const db = openDb(dbPath);
  return (db.prepare(
    'SELECT * FROM skill_metrics WHERE skill = ?'
  ).get(skill) as DbSkillMetric) ?? null;
}

export function listSkillMetrics(dbPath: string, limit = 50): DbSkillMetric[] {
  const db = openDb(dbPath);
  return db.prepare(
    'SELECT * FROM skill_metrics ORDER BY updated_at DESC LIMIT ?'
  ).all(limit) as DbSkillMetric[];
}

// ─── DB Path Helper ──────────────────────────────────────────────────────────

export function getDbPath(projectPath: string): string {
  return path.join(projectPath, '.cm', 'context.db');
}
