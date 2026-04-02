"use strict";
/**
 * viking-http-client.ts
 *
 * Thin HTTP wrapper around the OpenViking REST API (localhost:1933 by default).
 * Uses Node.js built-in `fetch` (Node 18+) — no extra dependencies.
 *
 * OpenViking API reference: https://github.com/volcengine/OpenViking
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
exports.VikingHttpClient = exports.DEFAULT_VIKING_CONFIG = void 0;
exports.DEFAULT_VIKING_CONFIG = {
    host: 'localhost',
    port: 1933,
    workspace: 'codymaster',
    timeout: 60000,
};
// ─── Client ─────────────────────────────────────────────────────────────────
class VikingHttpClient {
    constructor(config = exports.DEFAULT_VIKING_CONFIG) {
        this.baseUrl = `http://${config.host}:${config.port}`;
        this.workspace = config.workspace;
        this.timeout = config.timeout;
    }
    // ── Helpers ──────────────────────────────────────────────────────────────
    workspaceUri(path) {
        // Normalize: ov://<workspace>/<path>
        const clean = path.startsWith('/') ? path.slice(1) : path;
        return `ov://${this.workspace}/${clean}`;
    }
    request(method, endpoint, body) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${this.baseUrl}${endpoint}`;
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), this.timeout);
            try {
                const res = yield fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: body != null ? JSON.stringify(body) : undefined,
                    signal: controller.signal,
                });
                if (!res.ok) {
                    const text = yield res.text().catch(() => '');
                    throw new Error(`OpenViking HTTP ${res.status} at ${endpoint}: ${text}`);
                }
                // 204 No Content
                if (res.status === 204)
                    return {};
                return (yield res.json());
            }
            finally {
                clearTimeout(timer);
            }
        });
    }
    // ── Health ────────────────────────────────────────────────────────────────
    health() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request('GET', '/health');
        });
    }
    isHealthy() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const status = yield this.health();
                return status.healthy === true;
            }
            catch (_a) {
                return false;
            }
        });
    }
    // ── Filesystem ops ────────────────────────────────────────────────────────
    /**
     * Write content to a URI.
     * mode: 'overwrite' (default) | 'append'
     */
    write(uriPath_1, content_1) {
        return __awaiter(this, arguments, void 0, function* (uriPath, content, mode = 'overwrite') {
            return this.request('POST', '/write', {
                uri: this.workspaceUri(uriPath),
                content,
                mode,
                wait: true,
            });
        });
    }
    /** Read content from a URI. */
    read(uriPath) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const res = yield this.request('POST', '/read', {
                uri: this.workspaceUri(uriPath),
            });
            return (_a = res.content) !== null && _a !== void 0 ? _a : '';
        });
    }
    /** List items under a URI directory. */
    ls(uriPath) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const res = yield this.request('POST', '/ls', {
                uri: this.workspaceUri(uriPath),
            });
            return (_a = res.items) !== null && _a !== void 0 ? _a : [];
        });
    }
    /** Delete a URI (file or directory). */
    rm(uriPath_1) {
        return __awaiter(this, arguments, void 0, function* (uriPath, recursive = false) {
            yield this.request('POST', '/rm', {
                uri: this.workspaceUri(uriPath),
                recursive,
            });
        });
    }
    /** Create directory at URI. */
    mkdir(uriPath) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.request('POST', '/mkdir', {
                uri: this.workspaceUri(uriPath),
            });
        });
    }
    // ── Search ────────────────────────────────────────────────────────────────
    /**
     * Semantic vector search within a target URI scope.
     * Returns top-k results sorted by relevance score.
     */
    search(query_1, targetUriPath_1) {
        return __awaiter(this, arguments, void 0, function* (query, targetUriPath, limit = 10, scoreThreshold) {
            var _a;
            const body = {
                query,
                target_uri: this.workspaceUri(targetUriPath),
                limit,
            };
            if (scoreThreshold != null)
                body.score_threshold = scoreThreshold;
            const res = yield this.request('POST', '/search', body);
            return (_a = res.items) !== null && _a !== void 0 ? _a : [];
        });
    }
    // ── Tiered summaries ──────────────────────────────────────────────────────
    /** Get L0 abstract summary of a URI. */
    abstract(uriPath) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const res = yield this.request('POST', '/abstract', {
                uri: this.workspaceUri(uriPath),
            });
            return (_a = res.content) !== null && _a !== void 0 ? _a : '';
        });
    }
    /** Get L1 overview of a URI. */
    overview(uriPath) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const res = yield this.request('POST', '/overview', {
                uri: this.workspaceUri(uriPath),
            });
            return (_a = res.content) !== null && _a !== void 0 ? _a : '';
        });
    }
}
exports.VikingHttpClient = VikingHttpClient;
