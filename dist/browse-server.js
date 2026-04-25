"use strict";
/**
 * Local HTTP browse daemon (Playwright + Express). Bearer auth.
 * Refs: POST /refs/refresh tags interactive elements with data-cm-ref.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
function createRing(max) {
    const buf = [];
    return {
        push(item) {
            buf.push(item);
            while (buf.length > max)
                buf.shift();
        },
        snapshot: () => [...buf],
    };
}
class BrowseDaemon {
    constructor(opts) {
        this.opts = opts;
        this.app = (0, express_1.default)();
        this.httpServer = null;
        this.browser = null;
        this.context = null;
        this.page = null;
        this.consoleBuf = createRing(200);
        this.networkBuf = createRing(200);
        this.refMap = {};
        this.app.disable('x-powered-by');
        // Security Headers
        this.app.use((_req, res, next) => {
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'DENY');
            res.setHeader('X-XSS-Protection', '1; mode=block');
            next();
        });
        this.app.use(express_1.default.json({ limit: '2mb' }));
        this.app.use(this.authMiddleware.bind(this));
        this.routes();
    }
    authMiddleware(req, res, next) {
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
        this.app.get('/health', (_req, res) => {
            res.json({ ok: true, hasPage: !!this.page });
        });
        this.app.post('/session/start', (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const headless = (_c = (_b = (_a = req.body) === null || _a === void 0 ? void 0 : _a.headless) !== null && _b !== void 0 ? _b : this.opts.headless) !== null && _c !== void 0 ? _c : true;
                const pw = yield Promise.resolve().then(() => __importStar(require('playwright')));
                this.browser = yield pw.chromium.launch({ headless });
                this.context = yield this.browser.newContext();
                this.page = yield this.context.newPage();
                this.page.on('console', (msg) => {
                    this.consoleBuf.push({
                        type: msg.type(),
                        text: msg.text(),
                        ts: new Date().toISOString(),
                    });
                });
                this.context.on('response', (response) => {
                    try {
                        this.networkBuf.push({
                            url: response.url(),
                            method: response.request().method(),
                            status: response.status(),
                            ts: new Date().toISOString(),
                        });
                    }
                    catch (_a) {
                        /* ignore */
                    }
                });
                res.json({ ok: true });
            }
            catch (e) {
                res.status(500).json({ error: e.message });
            }
        }));
        this.app.post('/navigate', (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const url = (_a = req.body) === null || _a === void 0 ? void 0 : _a.url;
                if (!url || !this.page) {
                    res.status(400).json({ error: 'url required and session must be started' });
                    return;
                }
                yield this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
                res.json({ ok: true, url: this.page.url() });
            }
            catch (e) {
                res.status(500).json({ error: e.message });
            }
        }));
        this.app.post('/refs/refresh', (_req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.page) {
                    res.status(400).json({ error: 'no session' });
                    return;
                }
                const mapping = yield this.page.evaluate(() => {
                    const sel = 'a[href],button,input,textarea,select,[role="button"],[onclick]';
                    const nodes = Array.from(document.querySelectorAll(sel));
                    const out = {};
                    nodes.forEach((el, i) => {
                        const id = `e${i + 1}`;
                        el.setAttribute('data-cm-ref', id);
                        const tag = el.tagName.toLowerCase();
                        const txt = (el.textContent || '').trim().slice(0, 80);
                        out[id] = `${tag}${txt ? `: ${txt}` : ''}`;
                    });
                    return out;
                });
                this.refMap = mapping;
                res.json({ ok: true, refs: mapping });
            }
            catch (e) {
                res.status(500).json({ error: e.message });
            }
        }));
        this.app.post('/click', (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const ref = (_b = (_a = req.body) === null || _a === void 0 ? void 0 : _a.ref) === null || _b === void 0 ? void 0 : _b.replace(/^@/, '');
                if (!ref || !this.page) {
                    res.status(400).json({ error: 'ref required' });
                    return;
                }
                yield this.page.click(`[data-cm-ref="${ref}"]`, { timeout: 15000 });
                res.json({ ok: true });
            }
            catch (e) {
                res.status(500).json({ error: e.message });
            }
        }));
        this.app.post('/fill', (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const ref = (_b = (_a = req.body) === null || _a === void 0 ? void 0 : _a.ref) === null || _b === void 0 ? void 0 : _b.replace(/^@/, '');
                const value = (_c = req.body) === null || _c === void 0 ? void 0 : _c.value;
                if (!ref || value === undefined || !this.page) {
                    res.status(400).json({ error: 'ref and value required' });
                    return;
                }
                yield this.page.fill(`[data-cm-ref="${ref}"]`, value, { timeout: 15000 });
                res.json({ ok: true });
            }
            catch (e) {
                res.status(500).json({ error: e.message });
            }
        }));
        this.app.get('/screenshot', (_req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.page) {
                    res.status(400).json({ error: 'no session' });
                    return;
                }
                const buf = yield this.page.screenshot({ type: 'png' });
                res.setHeader('Content-Type', 'image/png');
                res.send(buf);
            }
            catch (e) {
                res.status(500).json({ error: e.message });
            }
        }));
        this.app.get('/console', (_req, res) => {
            res.json({ entries: this.consoleBuf.snapshot() });
        });
        this.app.get('/network', (_req, res) => {
            res.json({ entries: this.networkBuf.snapshot() });
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
            if (this.page)
                yield this.page.close().catch(() => { });
            if (this.context)
                yield this.context.close().catch(() => { });
            if (this.browser)
                yield this.browser.close().catch(() => { });
            this.page = null;
            this.context = null;
            this.browser = null;
            if (this.httpServer) {
                yield new Promise((r) => this.httpServer.close(() => r()));
                this.httpServer = null;
            }
        });
    }
}
exports.BrowseDaemon = BrowseDaemon;
