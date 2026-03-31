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
// ─── DB Path Helper ──────────────────────────────────────────────────────────
function getDbPath(projectPath) {
    return path_1.default.join(projectPath, '.cm', 'context.db');
}
