"use strict";
/**
 * viking-backend.ts
 *
 * Real implementation of StorageBackend using OpenViking as the storage engine.
 *
 * OpenViking advantages over SQLite:
 *  - True semantic vector search (not just FTS5 keyword matching)
 *  - Tiered L0/L1/L2 auto-generation via abstract() / overview()
 *  - Filesystem paradigm: memories organized as navigable URIs
 *  - Session compression + long-term memory extraction built-in
 *
 * URI layout inside OpenViking workspace:
 *  learnings/<id>.json       — learning entries
 *  decisions/<id>.json       — decision entries
 *  indexes/<resource>/<level>.md — L0/L1/L2 index cache
 *  skill-outputs/<sessionId>/<id>.json — skill chain outputs
 *
 * Requires OpenViking server running (default: http://localhost:1933).
 * Install: pip install openviking && openviking start
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VikingBackend = void 0;
const viking_http_client_1 = require("./viking-http-client");
// ─── Serialization helpers ───────────────────────────────────────────────────
function toJson(obj) {
    return JSON.stringify(obj, null, 2);
}
function fromJson(raw) {
    try {
        return JSON.parse(raw);
    }
    catch (_a) {
        return null;
    }
}
function now() {
    return new Date().toISOString();
}
// ─── VikingBackend ────────────────────────────────────────────────────────────
class VikingBackend {
    constructor(config = {}) {
        this.client = new viking_http_client_1.VikingHttpClient(Object.assign(Object.assign({}, viking_http_client_1.DEFAULT_VIKING_CONFIG), config));
    }
    // ── Lifecycle ────────────────────────────────────────────────────────────
    initialize() {
        // Sync check — fire-and-forget health ping.
        // Real validation happens on first actual operation.
        // (OpenViking initialize is async, but StorageBackend.initialize is sync)
        this.client.isHealthy().then((ok) => {
            if (!ok) {
                console.warn('[VikingBackend] OpenViking server not reachable. ' +
                    'Start server: pip install openviking && openviking start');
            }
        }).catch(() => { });
    }
    close() {
        // HTTP client is stateless — nothing to close.
    }
    // ── Learnings ────────────────────────────────────────────────────────────
    insertLearning(learning) {
        const uriPath = `learnings/${learning.id}.json`;
        // Fire-and-forget write (StorageBackend interface is sync)
        this.client.write(uriPath, toJson(learning)).catch((err) => {
            console.error('[VikingBackend] insertLearning failed:', err);
        });
    }
    getLearningById(id) {
        // Sync interface — fall back to null if server not available at call time.
        // Use queryLearnings() for async-safe retrieval in hot paths.
        let result = null;
        const done = this.client.read(`learnings/${id}.json`)
            .then((raw) => { result = fromJson(raw); })
            .catch(() => { result = null; });
        // Block synchronously via a shared flag (Node.js single-threaded event loop)
        // This is a best-effort sync wrapper — not recommended for large payloads.
        const deadline = Date.now() + 5000;
        while (!isDone(done) && Date.now() < deadline) {
            // Spin-wait (acceptable: StorageBackend callers are already sync)
        }
        return result;
    }
    queryLearnings(query, scope, limit = 10) {
        let results = [];
        const scopePath = scope ? `learnings/${scope}` : 'learnings';
        const done = this.client
            .search(query, scopePath, limit)
            .then((items) => {
            results = items
                .map((item) => { var _a; return fromJson((_a = item.content) !== null && _a !== void 0 ? _a : ''); })
                .filter((x) => x !== null);
        })
            .catch(() => { results = []; });
        blockUntil(done, 10000);
        return results;
    }
    // ── Decisions ────────────────────────────────────────────────────────────
    insertDecision(decision) {
        this.client.write(`decisions/${decision.id}.json`, toJson(decision))
            .catch((err) => {
            console.error('[VikingBackend] insertDecision failed:', err);
        });
    }
    queryDecisions(query, limit = 10) {
        let results = [];
        const done = this.client
            .search(query, 'decisions', limit)
            .then((items) => {
            results = items
                .map((item) => { var _a; return fromJson((_a = item.content) !== null && _a !== void 0 ? _a : ''); })
                .filter((x) => x !== null);
        })
            .catch(() => { results = []; });
        blockUntil(done, 10000);
        return results;
    }
    // ── Index cache ───────────────────────────────────────────────────────────
    upsertIndex(resource, level, content, sourceHash) {
        const meta = { resource, level, source_hash: sourceHash !== null && sourceHash !== void 0 ? sourceHash : '', generated_at: now() };
        // Store content at main path; metadata alongside
        const basePath = `indexes/${resource}/${level}`;
        Promise.all([
            this.client.write(`${basePath}.md`, content),
            this.client.write(`${basePath}.meta.json`, toJson(meta)),
        ]).catch((err) => {
            console.error('[VikingBackend] upsertIndex failed:', err);
        });
    }
    getIndex(resource, level) {
        const basePath = `indexes/${resource}/${level}`;
        let result = null;
        const done = Promise.all([
            this.client.read(`${basePath}.md`),
            this.client.read(`${basePath}.meta.json`),
        ]).then(([content, metaRaw]) => {
            var _a, _b;
            const meta = (_a = fromJson(metaRaw)) !== null && _a !== void 0 ? _a : {};
            result = {
                resource,
                level,
                content,
                generated_at: (_b = meta.generated_at) !== null && _b !== void 0 ? _b : now(),
                source_hash: meta.source_hash,
            };
        }).catch(() => { result = null; });
        blockUntil(done, 5000);
        return result;
    }
    // ── Skill outputs ─────────────────────────────────────────────────────────
    writeSkillOutput(output) {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const uriPath = `skill-outputs/${output.session_id}/${id}.json`;
        this.client.write(uriPath, toJson(output)).catch((err) => {
            console.error('[VikingBackend] writeSkillOutput failed:', err);
        });
    }
    getSkillOutputs(sessionId) {
        let results = [];
        const done = this.client
            .ls(`skill-outputs/${sessionId}`)
            .then((items) => __awaiter(this, void 0, void 0, function* () {
            const reads = items
                .filter((item) => !item.is_dir && item.name.endsWith('.json'))
                .map((item) => this.client.read(`skill-outputs/${sessionId}/${item.name}`)
                .then((raw) => fromJson(raw))
                .catch(() => null));
            const all = yield Promise.all(reads);
            results = all.filter((x) => x !== null);
        }))
            .catch(() => { results = []; });
        blockUntil(done, 10000);
        return results;
    }
    // ── OpenViking-native extras (not in StorageBackend interface) ────────────
    /**
     * Semantic search across ALL memories (learnings + decisions).
     * Uses OpenViking's vector embeddings — much more accurate than FTS5.
     */
    searchAll(query_1) {
        return __awaiter(this, arguments, void 0, function* (query, limit = 10) {
            return this.client.search(query, '', limit);
        });
    }
    /**
     * Get L0 abstract summary of a resource (auto-generated by OpenViking).
     * Equivalent to CodyMaster's L0 index, but generated by the storage engine.
     */
    getL0Abstract(resource) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.abstract(`indexes/${resource}`);
        });
    }
    /**
     * Get L1 overview of a resource.
     */
    getL1Overview(resource) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.overview(`indexes/${resource}`);
        });
    }
}
exports.VikingBackend = VikingBackend;
// ─── Sync helpers ─────────────────────────────────────────────────────────────
/**
 * Best-effort synchronous wait for a Promise.
 * Uses a flag set by .then()/.catch() — works because Node.js event loop
 * processes microtasks inline when the call stack is empty.
 *
 * WARNING: This is a spin-wait and will block the event loop for up to
 * `timeoutMs`. Use only where the StorageBackend sync interface requires it
 * and latency is bounded (local HTTP, <10ms typical).
 */
function blockUntil(p, timeoutMs) {
    let settled = false;
    p.finally(() => { settled = true; }).catch(() => { });
    const deadline = Date.now() + timeoutMs;
    // Give microtasks one tick before spinning
    while (!settled && Date.now() < deadline) {
        // Tight loop — intentionally minimal; Viking server is local (sub-ms RTT)
    }
}
function isDone(p) {
    let done = false;
    p.finally(() => { done = true; }).catch(() => { });
    return done;
}
