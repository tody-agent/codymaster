"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openDb = openDb;
exports.closeDb = closeDb;
exports.insertLearning = insertLearning;
exports.getLearningById = getLearningById;
exports.queryLearnings = queryLearnings;
exports.insertDecision = insertDecision;
exports.queryDecisions = queryDecisions;
exports.upsertIndex = upsertIndex;
exports.getIndex = getIndex;
exports.writeSkillOutput = writeSkillOutput;
exports.getSkillOutputs = getSkillOutputs;
exports.recordExecutionAnalysis = recordExecutionAnalysis;
exports.getExecutionAnalyses = getExecutionAnalyses;
exports.getSkillMetric = getSkillMetric;
exports.listSkillMetrics = listSkillMetrics;
exports.getDbPath = getDbPath;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
// ─── DB Cache (one connection per path) ─────────────────────────────────────
const dbCache = new Map();
function getDb(dbPath) {
    if (dbCache.has(dbPath))
        return dbCache.get(dbPath);
    const db = new better_sqlite3_1.default(dbPath);
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
function openDb(dbPath) {
    const db = getDb(dbPath);
    db.exec(SCHEMA);
    return db;
}
function closeDb(dbPath) {
    const db = dbCache.get(dbPath);
    if (db) {
        try {
            db.close();
        }
        catch ( /* already closed */_a) { /* already closed */ }
        dbCache.delete(dbPath);
    }
}
// ─── Learnings ───────────────────────────────────────────────────────────────
function insertLearning(dbPath, learning) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
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
        why_failed: (_a = learning.why_failed) !== null && _a !== void 0 ? _a : '',
        how_to_prevent: (_b = learning.how_to_prevent) !== null && _b !== void 0 ? _b : '',
        scope: (_c = learning.scope) !== null && _c !== void 0 ? _c : 'global',
        ttl: (_d = learning.ttl) !== null && _d !== void 0 ? _d : 60,
        reinforce_count: (_e = learning.reinforce_count) !== null && _e !== void 0 ? _e : 0,
        status: (_f = learning.status) !== null && _f !== void 0 ? _f : 'active',
        created_at: learning.created_at,
        updated_at: learning.updated_at,
        agent: (_g = learning.agent) !== null && _g !== void 0 ? _g : null,
        task_id: (_h = learning.task_id) !== null && _h !== void 0 ? _h : null,
        module: (_j = learning.module) !== null && _j !== void 0 ? _j : null,
    });
}
function getLearningById(dbPath, id) {
    var _a;
    const db = openDb(dbPath);
    return (_a = db.prepare('SELECT * FROM learnings WHERE id = ?').get(id)) !== null && _a !== void 0 ? _a : null;
}
function queryLearnings(dbPath, query, scope, limit = 10) {
    const db = openDb(dbPath);
    if (!query.trim()) {
        const sql = scope
            ? "SELECT * FROM learnings WHERE scope = ? AND status != 'archived' ORDER BY created_at DESC LIMIT ?"
            : "SELECT * FROM learnings WHERE status != 'archived' ORDER BY created_at DESC LIMIT ?";
        return scope
            ? db.prepare(sql).all(scope, limit)
            : db.prepare(sql).all(limit);
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
  `).all(query, limit);
}
// ─── Decisions ───────────────────────────────────────────────────────────────
function insertDecision(dbPath, decision) {
    var _a, _b, _c, _d, _e;
    const db = openDb(dbPath);
    db.prepare(`
    INSERT OR REPLACE INTO decisions
      (id, decision, rationale, scope, status, superseded_by, created_at, agent)
    VALUES
      (@id, @decision, @rationale, @scope, @status, @superseded_by, @created_at, @agent)
  `).run({
        id: decision.id,
        decision: decision.decision,
        rationale: (_a = decision.rationale) !== null && _a !== void 0 ? _a : '',
        scope: (_b = decision.scope) !== null && _b !== void 0 ? _b : 'global',
        status: (_c = decision.status) !== null && _c !== void 0 ? _c : 'active',
        superseded_by: (_d = decision.superseded_by) !== null && _d !== void 0 ? _d : null,
        created_at: decision.created_at,
        agent: (_e = decision.agent) !== null && _e !== void 0 ? _e : null,
    });
}
function queryDecisions(dbPath, query, limit = 10) {
    const db = openDb(dbPath);
    if (!query.trim()) {
        return db.prepare("SELECT * FROM decisions WHERE status != 'archived' ORDER BY created_at DESC LIMIT ?").all(limit);
    }
    return db.prepare(`
    SELECT decisions.* FROM decisions
    JOIN decisions_fts ON decisions.rowid = decisions_fts.rowid
    WHERE decisions_fts MATCH ?
      AND decisions.status != 'archived'
    ORDER BY bm25(decisions_fts)
    LIMIT ?
  `).all(query, limit);
}
// ─── Index Cache ─────────────────────────────────────────────────────────────
function upsertIndex(dbPath, resource, level, content, sourceHash) {
    const db = openDb(dbPath);
    const tokenCount = Math.ceil(content.length / 4);
    db.prepare(`
    INSERT OR REPLACE INTO indexes (resource, level, content, token_count, generated_at, source_hash)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(resource, level, content, tokenCount, new Date().toISOString(), sourceHash !== null && sourceHash !== void 0 ? sourceHash : null);
}
function getIndex(dbPath, resource, level) {
    var _a;
    const db = openDb(dbPath);
    return (_a = db.prepare('SELECT * FROM indexes WHERE resource = ? AND level = ?').get(resource, level)) !== null && _a !== void 0 ? _a : null;
}
// ─── Skill Outputs ────────────────────────────────────────────────────────────
function writeSkillOutput(dbPath, output) {
    var _a, _b, _c, _d, _e;
    const db = openDb(dbPath);
    db.prepare(`
    INSERT INTO skill_outputs
      (session_id, chain_id, skill, output_path, summary, affected_files, metadata, created_at)
    VALUES
      (@session_id, @chain_id, @skill, @output_path, @summary, @affected_files, @metadata, @created_at)
  `).run({
        session_id: output.session_id,
        chain_id: (_a = output.chain_id) !== null && _a !== void 0 ? _a : null,
        skill: output.skill,
        output_path: (_b = output.output_path) !== null && _b !== void 0 ? _b : null,
        summary: (_c = output.summary) !== null && _c !== void 0 ? _c : null,
        affected_files: (_d = output.affected_files) !== null && _d !== void 0 ? _d : null,
        metadata: (_e = output.metadata) !== null && _e !== void 0 ? _e : null,
        created_at: output.created_at,
    });
}
function getSkillOutputs(dbPath, sessionId) {
    const db = openDb(dbPath);
    return db.prepare('SELECT * FROM skill_outputs WHERE session_id = ? ORDER BY id ASC').all(sessionId);
}
// ─── Execution Analyses ─────────────────────────────────────────────────────
function safeParseJsonArray(raw) {
    if (!raw)
        return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    }
    catch (_a) {
        return [];
    }
}
function rowToExecutionAnalysis(row) {
    var _a;
    return {
        id: String(row.id),
        task_title: String(row.task_title),
        status: row.status,
        summary: String((_a = row.summary) !== null && _a !== void 0 ? _a : ''),
        source_task_type: typeof row.source_task_type === 'string' ? row.source_task_type : undefined,
        session_id: typeof row.session_id === 'string' ? row.session_id : undefined,
        chain_id: typeof row.chain_id === 'string' ? row.chain_id : undefined,
        selected_skills: safeParseJsonArray(row.selected_skills_json),
        token_estimate: typeof row.token_estimate === 'number' ? row.token_estimate : undefined,
        latency_bucket: typeof row.latency_bucket === 'string' ? row.latency_bucket : undefined,
        bus_snapshot: typeof row.bus_snapshot === 'string' ? row.bus_snapshot : undefined,
        retro_summary: typeof row.retro_summary === 'string' ? row.retro_summary : undefined,
        recommended_action: row.recommended_action,
        confidence: typeof row.confidence === 'number' ? row.confidence : undefined,
        skill_judgments: safeParseJsonArray(row.skill_judgments_json),
        created_at: String(row.created_at),
    };
}
function recordExecutionAnalysis(dbPath, analysis) {
    var _a, _b;
    const db = openDb(dbPath);
    const now = analysis.created_at || new Date().toISOString();
    const selectedSkills = JSON.stringify((_a = analysis.selected_skills) !== null && _a !== void 0 ? _a : []);
    const skillJudgments = JSON.stringify((_b = analysis.skill_judgments) !== null && _b !== void 0 ? _b : []);
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
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
        insertAnalysis.run({
            id: analysis.id,
            task_title: analysis.task_title,
            status: analysis.status,
            summary: analysis.summary,
            source_task_type: (_a = analysis.source_task_type) !== null && _a !== void 0 ? _a : null,
            session_id: (_b = analysis.session_id) !== null && _b !== void 0 ? _b : null,
            chain_id: (_c = analysis.chain_id) !== null && _c !== void 0 ? _c : null,
            selected_skills_json: selectedSkills,
            token_estimate: (_d = analysis.token_estimate) !== null && _d !== void 0 ? _d : 0,
            latency_bucket: (_e = analysis.latency_bucket) !== null && _e !== void 0 ? _e : null,
            bus_snapshot: (_f = analysis.bus_snapshot) !== null && _f !== void 0 ? _f : null,
            retro_summary: (_g = analysis.retro_summary) !== null && _g !== void 0 ? _g : null,
            recommended_action: (_h = analysis.recommended_action) !== null && _h !== void 0 ? _h : null,
            confidence: (_j = analysis.confidence) !== null && _j !== void 0 ? _j : null,
            skill_judgments_json: skillJudgments,
            created_at: now,
        });
        for (const judgment of (_k = analysis.skill_judgments) !== null && _k !== void 0 ? _k : []) {
            const skill = (_l = judgment.skill) === null || _l === void 0 ? void 0 : _l.trim();
            if (!skill)
                continue;
            upsertMetric.run({
                skill,
                selections: judgment.selected ? 1 : 0,
                applications: judgment.applied ? 1 : 0,
                task_completions: judgment.task_completed ? 1 : 0,
                fallbacks: judgment.fallback_used ? 1 : 0,
                total_token_estimate: (_m = judgment.token_estimate) !== null && _m !== void 0 ? _m : 0,
                last_task_type: (_o = analysis.source_task_type) !== null && _o !== void 0 ? _o : null,
                last_recommended_action: (_p = analysis.recommended_action) !== null && _p !== void 0 ? _p : null,
                last_used_at: now,
                updated_at: now,
            });
        }
    });
    txn();
}
function getExecutionAnalyses(dbPath, limit = 20) {
    const db = openDb(dbPath);
    const rows = db.prepare('SELECT * FROM execution_analyses ORDER BY created_at DESC LIMIT ?').all(limit);
    return rows.map(rowToExecutionAnalysis);
}
function getSkillMetric(dbPath, skill) {
    var _a;
    const db = openDb(dbPath);
    return (_a = db.prepare('SELECT * FROM skill_metrics WHERE skill = ?').get(skill)) !== null && _a !== void 0 ? _a : null;
}
function listSkillMetrics(dbPath, limit = 50) {
    const db = openDb(dbPath);
    return db.prepare('SELECT * FROM skill_metrics ORDER BY updated_at DESC LIMIT ?').all(limit);
}
// ─── DB Path Helper ──────────────────────────────────────────────────────────
function getDbPath(projectPath) {
    return path_1.default.join(projectPath, '.cm', 'context.db');
}
