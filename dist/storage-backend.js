"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VikingBackend = exports.SqliteBackend = void 0;
exports.getBackend = getBackend;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const context_db_1 = require("./context-db");
const viking_backend_1 = require("./backends/viking-backend");
Object.defineProperty(exports, "VikingBackend", { enumerable: true, get: function () { return viking_backend_1.VikingBackend; } });
const viking_http_client_1 = require("./backends/viking-http-client");
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
}
exports.SqliteBackend = SqliteBackend;
/**
 * Minimal YAML parser — reads `storage.backend` and `storage.viking.*` keys.
 * Avoids adding a js-yaml dependency for a handful of config fields.
 *
 * Supported format:
 *   storage:
 *     backend: viking
 *     viking:
 *       host: localhost
 *       port: 1933
 *       workspace: codymaster
 *       timeout: 60000
 */
function loadStorageConfig(projectPath) {
    var _a;
    const configPath = path_1.default.join(projectPath, '.cm', 'config.yaml');
    if (!fs_1.default.existsSync(configPath))
        return {};
    try {
        const raw = fs_1.default.readFileSync(configPath, 'utf-8');
        // Extract storage.backend
        const backendMatch = raw.match(/^storage:\s*\n(?:[ \t]+\S[^\n]*\n)*?[ \t]+backend:\s*(\S+)/m);
        const backend = (_a = backendMatch === null || backendMatch === void 0 ? void 0 : backendMatch[1]) === null || _a === void 0 ? void 0 : _a.trim();
        // Extract storage.viking.* keys
        const vikingBlock = raw.match(/[ \t]+viking:\s*\n((?:[ \t]{4,}[^\n]+\n?)*)/m);
        let viking;
        if (vikingBlock === null || vikingBlock === void 0 ? void 0 : vikingBlock[1]) {
            viking = {};
            for (const line of vikingBlock[1].split('\n')) {
                const kv = line.match(/[ \t]+(\w+):\s*(\S+)/);
                if (!kv)
                    continue;
                const [, key, val] = kv;
                if (key === 'host')
                    viking.host = val;
                if (key === 'workspace')
                    viking.workspace = val;
                if (key === 'port')
                    viking.port = parseInt(val, 10);
                if (key === 'timeout')
                    viking.timeout = parseInt(val, 10);
            }
        }
        if (!backend)
            return {};
        return { storage: Object.assign({ backend }, (viking ? { viking } : {})) };
    }
    catch (_b) {
        return {};
    }
}
// ─── Factory ─────────────────────────────────────────────────────────────────
/**
 * Returns the configured StorageBackend for the given project.
 *
 * Reads `.cm/config.yaml → storage.backend` (default: `sqlite`).
 * For `viking` backend, reads `storage.viking.*` for connection config.
 *
 * Usage:
 *   const backend = getBackend('/path/to/project');
 *   backend.initialize();
 *   const results = backend.queryLearnings('i18n locale');
 */
function getBackend(projectPath) {
    var _a, _b, _c;
    const config = loadStorageConfig(projectPath);
    const engine = (_b = (_a = config === null || config === void 0 ? void 0 : config.storage) === null || _a === void 0 ? void 0 : _a.backend) !== null && _b !== void 0 ? _b : 'sqlite';
    switch (engine) {
        case 'viking': {
            const vikingConfig = Object.assign(Object.assign({}, viking_http_client_1.DEFAULT_VIKING_CONFIG), (_c = config === null || config === void 0 ? void 0 : config.storage) === null || _c === void 0 ? void 0 : _c.viking);
            return new viking_backend_1.VikingBackend(vikingConfig);
        }
        case 'sqlite':
        default:
            return new SqliteBackend(projectPath);
    }
}
