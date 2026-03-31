"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateJsonToSqlite = migrateJsonToSqlite;
exports.exportSqliteToJson = exportSqliteToJson;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const context_db_1 = require("./context-db");
function migrateJsonToSqlite(projectPath) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3;
    const cmDir = path_1.default.join(projectPath, '.cm');
    const dbPath = (0, context_db_1.getDbPath)(projectPath);
    (0, context_db_1.openDb)(dbPath);
    const result = {
        learnings: { migrated: 0, skipped: 0 },
        decisions: { migrated: 0, skipped: 0 },
        dbPath,
        backupCreated: false,
    };
    // ── Migrate learnings ─────────────────────────────────────────────────────
    const learningsPath = path_1.default.join(cmDir, 'memory', 'learnings.json');
    if (fs_1.default.existsSync(learningsPath)) {
        // Backup
        const backupPath = learningsPath + '.backup';
        fs_1.default.copyFileSync(learningsPath, backupPath);
        result.backupCreated = true;
        let raw = [];
        try {
            raw = JSON.parse(fs_1.default.readFileSync(learningsPath, 'utf-8'));
        }
        catch ( /* invalid JSON — skip */_4) { /* invalid JSON — skip */ }
        for (const l of raw) {
            try {
                const now = new Date().toISOString();
                const learning = {
                    id: (_a = l.id) !== null && _a !== void 0 ? _a : `L-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                    what_failed: (_d = (_c = (_b = l.whatFailed) !== null && _b !== void 0 ? _b : l.what_failed) !== null && _c !== void 0 ? _c : l.error) !== null && _d !== void 0 ? _d : '(unknown)',
                    why_failed: (_g = (_f = (_e = l.whyFailed) !== null && _e !== void 0 ? _e : l.why_failed) !== null && _f !== void 0 ? _f : l.cause) !== null && _g !== void 0 ? _g : '',
                    how_to_prevent: (_k = (_j = (_h = l.howToPrevent) !== null && _h !== void 0 ? _h : l.how_to_prevent) !== null && _j !== void 0 ? _j : l.prevention) !== null && _k !== void 0 ? _k : '',
                    scope: (_l = l.scope) !== null && _l !== void 0 ? _l : 'global',
                    ttl: (_m = l.ttl) !== null && _m !== void 0 ? _m : 60,
                    reinforce_count: (_p = (_o = l.reinforceCount) !== null && _o !== void 0 ? _o : l.reinforce_count) !== null && _p !== void 0 ? _p : 0,
                    status: (_q = l.status) !== null && _q !== void 0 ? _q : 'active',
                    created_at: (_s = (_r = l.date) !== null && _r !== void 0 ? _r : l.timestamp) !== null && _s !== void 0 ? _s : now,
                    updated_at: (_u = (_t = l.date) !== null && _t !== void 0 ? _t : l.timestamp) !== null && _u !== void 0 ? _u : now,
                    agent: l.agent,
                    task_id: (_v = l.taskId) !== null && _v !== void 0 ? _v : l.task_id,
                    module: l.module,
                };
                (0, context_db_1.insertLearning)(dbPath, learning);
                result.learnings.migrated++;
            }
            catch (_5) {
                result.learnings.skipped++;
            }
        }
    }
    // ── Migrate decisions ─────────────────────────────────────────────────────
    const decisionsPath = path_1.default.join(cmDir, 'memory', 'decisions.json');
    if (fs_1.default.existsSync(decisionsPath)) {
        const backupPath = decisionsPath + '.backup';
        fs_1.default.copyFileSync(decisionsPath, backupPath);
        let raw = [];
        try {
            raw = JSON.parse(fs_1.default.readFileSync(decisionsPath, 'utf-8'));
        }
        catch ( /* invalid JSON — skip */_6) { /* invalid JSON — skip */ }
        for (const d of raw) {
            try {
                const now = new Date().toISOString();
                const decision = {
                    id: (_w = d.id) !== null && _w !== void 0 ? _w : `D-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                    decision: (_x = d.decision) !== null && _x !== void 0 ? _x : '(unknown)',
                    rationale: (_y = d.rationale) !== null && _y !== void 0 ? _y : '',
                    scope: (_z = d.scope) !== null && _z !== void 0 ? _z : 'global',
                    status: (_0 = d.status) !== null && _0 !== void 0 ? _0 : 'active',
                    superseded_by: (_1 = d.supersededBy) !== null && _1 !== void 0 ? _1 : d.superseded_by,
                    created_at: (_3 = (_2 = d.date) !== null && _2 !== void 0 ? _2 : d.timestamp) !== null && _3 !== void 0 ? _3 : now,
                    agent: d.agent,
                };
                (0, context_db_1.insertDecision)(dbPath, decision);
                result.decisions.migrated++;
            }
            catch (_7) {
                result.decisions.skipped++;
            }
        }
    }
    return result;
}
function exportSqliteToJson(projectPath) {
    const cmDir = path_1.default.join(projectPath, '.cm');
    const memDir = path_1.default.join(cmDir, 'memory');
    const dbPath = (0, context_db_1.getDbPath)(projectPath);
    const db = (0, context_db_1.openDb)(dbPath);
    fs_1.default.mkdirSync(memDir, { recursive: true });
    // Export learnings
    const learnings = db.prepare(`
    SELECT id, what_failed, why_failed, how_to_prevent, scope, ttl,
           reinforce_count as reinforceCount, status, created_at as date,
           agent, task_id as taskId, module
    FROM learnings
    WHERE status != 'archived'
    ORDER BY created_at DESC
  `).all();
    const learningsPath = path_1.default.join(memDir, 'learnings.json');
    fs_1.default.writeFileSync(learningsPath, JSON.stringify(learnings, null, 2), 'utf-8');
    // Export decisions
    const decisions = db.prepare(`
    SELECT id, decision, rationale, scope, status,
           superseded_by as supersededBy, created_at as date, agent
    FROM decisions
    WHERE status != 'archived'
    ORDER BY created_at DESC
  `).all();
    const decisionsPath = path_1.default.join(memDir, 'decisions.json');
    fs_1.default.writeFileSync(decisionsPath, JSON.stringify(decisions, null, 2), 'utf-8');
    return {
        learnings: learnings.length,
        decisions: decisions.length,
        learningsPath,
        decisionsPath,
    };
}
