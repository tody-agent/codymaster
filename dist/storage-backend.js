"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqliteBackend = void 0;
exports.getBackend = getBackend;
const context_db_1 = require("./context-db");
const cm_config_1 = require("./cm-config");
// ─── SqliteBackend ────────────────────────────────────────────────────────────
/**
 * Default backend — thin wrapper around context-db.ts (better-sqlite3 + FTS5).
 * context-db.ts is NOT modified; this class is purely additive.
 */
class SqliteBackend {
    constructor(projectPath) {
        this.dbPath = (0, context_db_1.getDbPath)(projectPath);
    }
    initialize() { (0, context_db_1.openDb)(this.dbPath); }
    close() { (0, context_db_1.closeDb)(this.dbPath); }
    insertLearning(l) { (0, context_db_1.insertLearning)(this.dbPath, l); }
    getLearningById(id) { return (0, context_db_1.getLearningById)(this.dbPath, id); }
    queryLearnings(q, scope, limit = 10) {
        return (0, context_db_1.queryLearnings)(this.dbPath, q, scope, limit);
    }
    insertDecision(d) { (0, context_db_1.insertDecision)(this.dbPath, d); }
    queryDecisions(q, limit = 10) { return (0, context_db_1.queryDecisions)(this.dbPath, q, limit); }
    upsertIndex(resource, level, content, sourceHash) {
        (0, context_db_1.upsertIndex)(this.dbPath, resource, level, content, sourceHash);
    }
    getIndex(resource, level) {
        return (0, context_db_1.getIndex)(this.dbPath, resource, level);
    }
    writeSkillOutput(o) { (0, context_db_1.writeSkillOutput)(this.dbPath, o); }
    getSkillOutputs(sessionId) { return (0, context_db_1.getSkillOutputs)(this.dbPath, sessionId); }
    recordExecutionAnalysis(a) { (0, context_db_1.recordExecutionAnalysis)(this.dbPath, a); }
    getExecutionAnalyses(limit = 20) { return (0, context_db_1.getExecutionAnalyses)(this.dbPath, limit); }
    getSkillMetric(skill) { return (0, context_db_1.getSkillMetric)(this.dbPath, skill); }
    listSkillMetrics(limit = 50) { return (0, context_db_1.listSkillMetrics)(this.dbPath, limit); }
}
exports.SqliteBackend = SqliteBackend;
// ─── Factory ─────────────────────────────────────────────────────────────────
/**
 * Returns the configured StorageBackend for the given project.
 *
 * Reads `.cm/config.yaml → storage.backend` via `loadCmConfig` (default: `sqlite`).
 * Legacy `storage.backend: viking` configs are warned and routed back to sqlite.
 *
 * Usage:
 *   const backend = getBackend('/path/to/project');
 *   backend.initialize();
 *   const results = backend.queryLearnings('i18n locale');
 */
function getBackend(projectPath) {
    var _a, _b;
    const cfg = (0, cm_config_1.loadCmConfig)(projectPath);
    const engine = ((_b = (_a = cfg.storage) === null || _a === void 0 ? void 0 : _a.backend) !== null && _b !== void 0 ? _b : 'sqlite').toLowerCase();
    switch (engine) {
        case 'viking': {
            console.warn('[CodyMaster] storage.backend: viking has been removed. ' +
                'Falling back to sqlite for the supported default path.');
            return new SqliteBackend(projectPath);
        }
        case 'sqlite':
        default:
            return new SqliteBackend(projectPath);
    }
}
