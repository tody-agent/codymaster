"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillExecutionCache = void 0;
exports.formatCacheStats = formatCacheStats;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
// ─── Schema ─────────────────────────────────────────────────────────────────
const CACHE_SCHEMA = `
CREATE TABLE IF NOT EXISTS skill_cache (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  task_pattern     TEXT NOT NULL,
  skill_chain_json TEXT NOT NULL,
  effectiveness    REAL NOT NULL DEFAULT 0,
  token_used       INTEGER NOT NULL DEFAULT 0,
  hit_count        INTEGER NOT NULL DEFAULT 0,
  last_hit         TEXT NOT NULL,
  created_at       TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_skill_cache_pattern ON skill_cache(task_pattern);

CREATE VIRTUAL TABLE IF NOT EXISTS skill_cache_fts USING fts5(
  task_pattern,
  content=skill_cache, content_rowid=rowid
);

CREATE TRIGGER IF NOT EXISTS skill_cache_ai AFTER INSERT ON skill_cache BEGIN
  INSERT INTO skill_cache_fts(rowid, task_pattern)
  VALUES (new.rowid, new.task_pattern);
END;

CREATE TRIGGER IF NOT EXISTS skill_cache_ad AFTER DELETE ON skill_cache BEGIN
  INSERT INTO skill_cache_fts(skill_cache_fts, rowid, task_pattern)
  VALUES('delete', old.rowid, old.task_pattern);
END;
`;
// ─── DB Cache (share connection with context-db) ─────────────────────────────
const dbCache = new Map();
function getDb(dbPath) {
    if (dbCache.has(dbPath))
        return dbCache.get(dbPath);
    const db = new better_sqlite3_1.default(dbPath);
    db.pragma('journal_mode = WAL');
    dbCache.set(dbPath, db);
    return db;
}
// ─── Skill Execution Cache ───────────────────────────────────────────────────
// TRIZ #35 Parameter Changes — reuse successful execution patterns
/**
 * SkillExecutionCache — OpenSpace-inspired warm cache for skill chains.
 *
 * When a task succeeds with a specific skill chain, we cache the pattern.
 * For similar future tasks, skip BM25 ranking entirely and reuse the chain.
 *
 * Token savings: ~2000 tokens/task (skip ranking + LLM selection).
 */
class SkillExecutionCache {
    constructor(projectPath) {
        this.dbPath = path_1.default.join(projectPath, '.cm', 'context.db');
    }
    /**
     * Initialize cache tables. Call once before use.
     */
    initialize() {
        const db = getDb(this.dbPath);
        db.exec(CACHE_SCHEMA);
    }
    /**
     * Cache a successful task execution pattern.
     * Only caches executions with effectiveness >= 0.7.
     */
    cacheExecution(taskPattern, skillChain, effectiveness, tokenUsed) {
        if (effectiveness < 0.7)
            return; // Only cache good executions
        if (!taskPattern.trim() || skillChain.length === 0)
            return;
        const db = getDb(this.dbPath);
        const now = new Date().toISOString();
        // Check if similar pattern already exists
        const existing = this.findExactMatch(taskPattern);
        if (existing) {
            // Update existing entry if new execution is better
            if (effectiveness >= existing.effectiveness) {
                db.prepare(`
          UPDATE skill_cache SET
            skill_chain_json = ?,
            effectiveness = ?,
            token_used = ?,
            hit_count = hit_count + 1,
            last_hit = ?
          WHERE task_pattern = ?
        `).run(JSON.stringify(skillChain), effectiveness, tokenUsed, now, taskPattern);
            }
            else {
                // Just increment hit count
                db.prepare(`
          UPDATE skill_cache SET hit_count = hit_count + 1, last_hit = ? WHERE task_pattern = ?
        `).run(now, taskPattern);
            }
            return;
        }
        db.prepare(`
      INSERT INTO skill_cache
        (task_pattern, skill_chain_json, effectiveness, token_used, hit_count, last_hit, created_at)
      VALUES (?, ?, ?, ?, 1, ?, ?)
    `).run(taskPattern, JSON.stringify(skillChain), effectiveness, tokenUsed, now, now);
    }
    /**
     * Find a cached chain for a task description using BM25 similarity.
     * Returns null if no suitable match (effectiveness >= 0.7).
     */
    findCachedChain(taskDescription) {
        const db = getDb(this.dbPath);
        const query = this.normalizeForSearch(taskDescription);
        if (!query)
            return null;
        try {
            const row = db.prepare(`
        SELECT skill_cache.* FROM skill_cache
        JOIN skill_cache_fts ON skill_cache.rowid = skill_cache_fts.rowid
        WHERE skill_cache_fts MATCH ?
          AND skill_cache.effectiveness >= 0.7
        ORDER BY bm25(skill_cache_fts) * skill_cache.effectiveness * (1.0 + skill_cache.hit_count * 0.1)
        LIMIT 1
      `).get(query);
            if (!row)
                return null;
            return this.rowToCachedChain(row);
        }
        catch (_a) {
            // FTS5 query might fail with special characters
            return null;
        }
    }
    /**
     * Record a cache hit (increment counter, update timestamp).
     */
    recordHit(taskPattern) {
        const db = getDb(this.dbPath);
        db.prepare(`
      UPDATE skill_cache SET hit_count = hit_count + 1, last_hit = ? WHERE task_pattern = ?
    `).run(new Date().toISOString(), taskPattern);
    }
    /**
     * Get cache statistics.
     */
    getStats() {
        const db = getDb(this.dbPath);
        try {
            const stats = db.prepare(`
        SELECT
          COUNT(*) as total_entries,
          COALESCE(SUM(hit_count), 0) as total_hits,
          COALESCE(AVG(effectiveness), 0) as avg_effectiveness,
          COALESCE(SUM(hit_count * token_used), 0) as estimated_tokens_saved
        FROM skill_cache
      `).get();
            return {
                totalEntries: stats.total_entries,
                totalHits: stats.total_hits,
                avgEffectiveness: Math.round(stats.avg_effectiveness * 100) / 100,
                estimatedTokensSaved: stats.estimated_tokens_saved,
            };
        }
        catch (_a) {
            return { totalEntries: 0, totalHits: 0, avgEffectiveness: 0, estimatedTokensSaved: 0 };
        }
    }
    /**
     * List all cached chains.
     */
    listCachedChains(limit = 20) {
        const db = getDb(this.dbPath);
        try {
            const rows = db.prepare('SELECT * FROM skill_cache ORDER BY hit_count DESC, effectiveness DESC LIMIT ?').all(limit);
            return rows.map(r => this.rowToCachedChain(r));
        }
        catch (_a) {
            return [];
        }
    }
    /**
     * Clear all cached chains.
     */
    clearCache() {
        const db = getDb(this.dbPath);
        const info = db.prepare('DELETE FROM skill_cache').run();
        return info.changes;
    }
    /**
     * Close the database connection.
     */
    close() {
        const db = dbCache.get(this.dbPath);
        if (db) {
            try {
                db.close();
            }
            catch ( /* already closed */_a) { /* already closed */ }
            dbCache.delete(this.dbPath);
        }
    }
    // ─── Private Helpers ────────────────────────────────────────────────────────
    findExactMatch(taskPattern) {
        const db = getDb(this.dbPath);
        const row = db.prepare('SELECT * FROM skill_cache WHERE task_pattern = ? LIMIT 1').get(taskPattern);
        return row ? this.rowToCachedChain(row) : null;
    }
    /**
     * Normalize a task description for FTS5 search.
     * Removes special characters that break FTS5 MATCH syntax.
     */
    normalizeForSearch(text) {
        return text
            .replace(/[^\w\s]/g, ' ') // Remove special chars
            .replace(/\s+/g, ' ') // Collapse whitespace
            .trim()
            .split(' ')
            .filter(w => w.length > 2) // Drop short words
            .slice(0, 10) // Limit query length
            .join(' ');
    }
    rowToCachedChain(row) {
        let chain = [];
        try {
            chain = JSON.parse(String(row.skill_chain_json || '[]'));
        }
        catch ( /* empty */_a) { /* empty */ }
        return {
            taskPattern: String(row.task_pattern || ''),
            skillChain: chain,
            effectiveness: Number(row.effectiveness || 0),
            tokenUsed: Number(row.token_used || 0),
            hitCount: Number(row.hit_count || 0),
            lastHit: String(row.last_hit || ''),
        };
    }
}
exports.SkillExecutionCache = SkillExecutionCache;
// ─── Display Helpers ─────────────────────────────────────────────────────────
function formatCacheStats(stats) {
    const lines = [
        `📦 Skill Execution Cache`,
        `─`.repeat(50),
        `Cached patterns:     ${stats.totalEntries}`,
        `Total cache hits:    ${stats.totalHits}`,
        `Avg effectiveness:   ${(stats.avgEffectiveness * 100).toFixed(1)}%`,
        `Est. tokens saved:   ~${stats.estimatedTokensSaved.toLocaleString()}`,
    ];
    return lines.join('\n');
}
