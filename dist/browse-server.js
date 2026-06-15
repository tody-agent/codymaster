"use strict";
/**
 * Local HTTP browse daemon (Hybrid Bridge). Bearer auth.
 * Supports both Playwright and agent-browser via adapter pattern.
 * All existing endpoints are backward compatible.
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowseDaemon = void 0;
const express_1 = __importDefault(require("express"));
const adapter_factory_1 = require("./browse/adapter-factory");
const event_log_1 = require("./browse/event-log");
class BrowseDaemon {
    constructor(opts) {
        this.opts = opts;
        this.app = (0, express_1.default)();
        this.httpServer = null;
        this.adapter = null;
        this.eventLog = new event_log_1.EventLog({ maxSize: 1000 });
        this.engineName = 'unknown';
        this.sessionActive = false;
        this.app.disable('x-powered-by');
        this.app.use((_req, res, next) => {
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'DENY');
            res.setHeader('X-XSS-Protection', '1; mode=block');
            res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none';");
            next();
        });
        this.app.use(express_1.default.json({ limit: '2mb' }));
        this.app.use(this.authMiddleware.bind(this));
        this.routes();
    }
    authMiddleware(req, res, next) {
        // Defeat DNS-rebinding: a rebound attacker page still carries its original
        // hostname in the Host header, so only accept loopback Host values.
        const host = String(req.headers.host || '').split(':')[0].toLowerCase();
        if (!BrowseDaemon.LOOPBACK_HOSTS.has(host)) {
            res.status(403).json({ error: 'forbidden host' });
            return;
        }
        if (req.path === '/health')
            return next();
        const h = req.headers.authorization || '';
        const want = `Bearer ${this.opts.token}`;
        if (h !== want) {
            res.status(401).json({ error: 'unauthorized' });
            return;
        }
        next();
    }
    routes() {
        // ── Health (no auth) ───────────────────────────────────────────────────
        this.app.get('/health', (_req, res) => {
            res.json({ ok: true, session: this.sessionActive, engine: this.engineName });
        });
        // ── Session start ─────────────────────────────────────────────────────
        this.app.post('/session/start', (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f;
            try {
                const headless = (_c = (_b = (_a = req.body) === null || _a === void 0 ? void 0 : _a.headless) !== null && _b !== void 0 ? _b : this.opts.headless) !== null && _c !== void 0 ? _c : true;
                const engine = (_f = (_e = (_d = req.body) === null || _d === void 0 ? void 0 : _d.engine) !== null && _e !== void 0 ? _e : this.opts.engine) !== null && _f !== void 0 ? _f : 'auto';
                const result = yield (0, adapter_factory_1.createAdapter)(engine);
                this.adapter = result.adapter;
                this.engineName = result.engine;
                yield this.adapter.startSession({ headless });
                this.sessionActive = true;
                this.eventLog.push({
                    category: 'session',
                    type: 'start',
                    message: `Session started with ${result.engine}${result.fallback ? ' (fallback)' : ''}`,
                });
                res.json({ ok: true, engine: result.engine, fallback: result.fallback });
            }
            catch (e) {
                res.status(500).json({ error: e.message });
            }
        }));
        // ── Navigate ──────────────────────────────────────────────────────────
        this.app.post('/navigate', (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const url = (_a = req.body) === null || _a === void 0 ? void 0 : _a.url;
                if (!url || !this.adapter) {
                    res.status(400).json({ error: 'url required and session must be started' });
                    return;
                }
                yield this.adapter.navigate(url);
                this.eventLog.push({
                    category: 'session',
                    type: 'navigate',
                    message: url,
                    source: url,
                });
                res.json({ ok: true, url });
            }
            catch (e) {
                res.status(500).json({ error: e.message });
            }
        }));
        // ── Refs refresh (backward compat — still tags data-cm-ref) ───────────
        this.app.post('/refs/refresh', (_req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.adapter) {
                    res.status(400).json({ error: 'no session' });
                    return;
                }
                const snapshot = yield this.adapter.getSnapshot();
                this.eventLog.push({
                    category: 'interaction',
                    type: 'refs/refresh',
                    message: `Refreshed refs: ${Object.keys(snapshot.refs).length} elements`,
                });
                res.json({ ok: true, refs: snapshot.refs });
            }
            catch (e) {
                res.status(500).json({ error: e.message });
            }
        }));
        // ── Click ─────────────────────────────────────────────────────────────
        this.app.post('/click', (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const ref = (_a = req.body) === null || _a === void 0 ? void 0 : _a.ref;
                if (!ref || !this.adapter) {
                    res.status(400).json({ error: 'ref required' });
                    return;
                }
                yield this.adapter.click(ref);
                this.eventLog.push({
                    category: 'interaction',
                    type: 'click',
                    message: ref,
                });
                res.json({ ok: true });
            }
            catch (e) {
                res.status(500).json({ error: e.message });
            }
        }));
        // ── Fill ──────────────────────────────────────────────────────────────
        this.app.post('/fill', (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const ref = (_a = req.body) === null || _a === void 0 ? void 0 : _a.ref;
                const value = (_b = req.body) === null || _b === void 0 ? void 0 : _b.value;
                if (!ref || value === undefined || !this.adapter) {
                    res.status(400).json({ error: 'ref and value required' });
                    return;
                }
                yield this.adapter.fill(ref, value);
                this.eventLog.push({
                    category: 'interaction',
                    type: 'fill',
                    message: `${ref} = "${value.slice(0, 50)}"`,
                });
                res.json({ ok: true });
            }
            catch (e) {
                res.status(500).json({ error: e.message });
            }
        }));
        // ── Screenshot ────────────────────────────────────────────────────────
        this.app.get('/screenshot', (_req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.adapter) {
                    res.status(400).json({ error: 'no session' });
                    return;
                }
                const buf = yield this.adapter.screenshot();
                res.setHeader('Content-Type', 'image/png');
                res.send(buf);
            }
            catch (e) {
                res.status(500).json({ error: e.message });
            }
        }));
        // ── Console (backward compat) ─────────────────────────────────────────
        this.app.get('/console', (_req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.adapter) {
                    res.json({ entries: [] });
                    return;
                }
                const entries = yield this.adapter.getConsole();
                res.json({ entries });
            }
            catch (e) {
                res.status(500).json({ error: e.message });
            }
        }));
        // ── Network (backward compat) ─────────────────────────────────────────
        this.app.get('/network', (_req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.adapter) {
                    res.json({ entries: [] });
                    return;
                }
                const entries = yield this.adapter.getNetwork();
                res.json({ entries });
            }
            catch (e) {
                res.status(500).json({ error: e.message });
            }
        }));
        // ── NEW: Errors ───────────────────────────────────────────────────────
        this.app.get('/errors', (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.adapter) {
                    res.json({ errors: [] });
                    return;
                }
                const filter = {};
                if (req.query.type)
                    filter.type = req.query.type;
                if (req.query.severity)
                    filter.severity = req.query.severity;
                const errors = yield this.adapter.getErrors();
                let filtered = errors;
                if (filter.type)
                    filtered = filtered.filter(e => e.type === filter.type);
                if (filter.severity)
                    filtered = filtered.filter(e => e.severity === filter.severity);
                res.json({ errors: filtered, total: errors.length });
            }
            catch (e) {
                res.status(500).json({ error: e.message });
            }
        }));
        // ── NEW: A11y Snapshot ────────────────────────────────────────────────
        this.app.get('/a11y-snapshot', (_req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.adapter) {
                    res.status(400).json({ error: 'no session' });
                    return;
                }
                const snapshot = yield this.adapter.getSnapshot();
                res.json(snapshot);
            }
            catch (e) {
                res.status(500).json({ error: e.message });
            }
        }));
        // ── NEW: Record start ─────────────────────────────────────────────────
        this.app.post('/record/start', (_req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.adapter) {
                    res.status(400).json({ error: 'no session' });
                    return;
                }
                yield this.adapter.startRecording();
                this.eventLog.push({
                    category: 'session',
                    type: 'record/start',
                    message: 'Video recording started',
                });
                res.json({ ok: true });
            }
            catch (e) {
                res.status(500).json({ error: e.message });
            }
        }));
        // ── NEW: Record stop ──────────────────────────────────────────────────
        this.app.post('/record/stop', (_req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.adapter) {
                    res.status(400).json({ error: 'no session' });
                    return;
                }
                const path = yield this.adapter.stopRecording();
                this.eventLog.push({
                    category: 'session',
                    type: 'record/stop',
                    message: `Video saved: ${path}`,
                });
                res.json({ ok: true, path });
            }
            catch (e) {
                res.status(500).json({ error: e.message });
            }
        }));
        // ── NEW: Engine info ──────────────────────────────────────────────────
        this.app.get('/engine', (_req, res) => {
            if (!this.adapter) {
                res.json({ name: this.engineName, active: false });
                return;
            }
            const info = this.adapter.getEngineInfo();
            res.json(Object.assign(Object.assign({}, info), { active: this.sessionActive }));
        });
        // ── NEW: Event log ────────────────────────────────────────────────────
        this.app.get('/events', (req, res) => {
            const filter = {};
            if (req.query.category)
                filter.category = req.query.category;
            if (req.query.limit)
                filter.limit = req.query.limit;
            const entries = this.eventLog.query({
                category: filter.category,
                limit: filter.limit ? parseInt(filter.limit, 10) : undefined,
            });
            res.json({ entries, total: this.eventLog.size });
        });
    }
    listen() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const host = this.opts.host || '127.0.0.1';
            const port = (_a = this.opts.port) !== null && _a !== void 0 ? _a : 17395;
            return new Promise((resolve, reject) => {
                this.httpServer = this.app.listen(port, host, () => resolve());
                this.httpServer.on('error', reject);
            });
        });
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.adapter) {
                yield this.adapter.closeSession().catch(() => { });
                this.adapter = null;
            }
            this.sessionActive = false;
            this.eventLog.clear();
            if (this.httpServer) {
                yield new Promise((r) => this.httpServer.close(() => r()));
                this.httpServer = null;
            }
        });
    }
}
exports.BrowseDaemon = BrowseDaemon;
BrowseDaemon.LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '::1', '[::1]']);
