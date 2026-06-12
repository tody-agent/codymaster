"use strict";
/**
 * PlaywrightAdapter — BrowserAdapter implementation using Playwright.
 * Extracted from the original BrowseDaemon page operations.
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaywrightAdapter = void 0;
const error_collector_1 = require("../error-collector");
class PlaywrightAdapter {
    constructor() {
        this.name = 'playwright';
        this.browser = null;
        this.context = null;
        this.page = null;
        this.errorCollector = new error_collector_1.ErrorCollector();
        this.consoleLog = [];
        this.networkLog = [];
        this.videoDir = null;
        this.refMap = {};
    }
    isAvailable() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const pw = yield Promise.resolve().then(() => __importStar(require('playwright')));
                return !!pw.chromium;
            }
            catch (_a) {
                return false;
            }
        });
    }
    startSession(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const pw = yield Promise.resolve().then(() => __importStar(require('playwright')));
            const headless = (_a = opts === null || opts === void 0 ? void 0 : opts.headless) !== null && _a !== void 0 ? _a : true;
            this.browser = yield pw.chromium.launch({ headless });
            const contextOpts = {};
            if (opts === null || opts === void 0 ? void 0 : opts.viewport)
                contextOpts.viewport = opts.viewport;
            if (opts === null || opts === void 0 ? void 0 : opts.userAgent)
                contextOpts.userAgent = opts.userAgent;
            if (opts === null || opts === void 0 ? void 0 : opts.recordVideo) {
                this.videoDir = (_b = opts.videoDir) !== null && _b !== void 0 ? _b : '/tmp/cm-browse-videos';
                contextOpts.recordVideo = { dir: this.videoDir };
            }
            this.context = yield this.browser.newContext(contextOpts);
            this.page = yield this.context.newPage();
            // Wire console events
            this.page.on('console', (msg) => {
                const entry = {
                    type: msg.type(),
                    text: msg.text(),
                    timestamp: new Date().toISOString(),
                };
                this.consoleLog.push(entry);
                // Feed error collector
                if (msg.type() === 'error' || msg.type() === 'warning') {
                    this.errorCollector.addConsole(msg.type(), msg.text());
                }
            });
            // Wire page errors (uncaught exceptions)
            this.page.on('pageerror', (err) => {
                this.errorCollector.add({
                    type: 'js-error',
                    source: 'page',
                    message: err.message,
                    stack: err.stack,
                });
            });
            // Wire network events
            if (this.context) {
                this.context.on('response', (response) => {
                    try {
                        const entry = {
                            url: response.url(),
                            method: response.request().method(),
                            status: response.status(),
                            statusText: response.statusText(),
                            timestamp: new Date().toISOString(),
                            resourceType: response.request().resourceType(),
                        };
                        this.networkLog.push(entry);
                        // Capture failures
                        if (response.status() >= 400) {
                            this.errorCollector.addNetworkFailure(response.url(), response.request().method(), response.status());
                        }
                    }
                    catch (_a) {
                        /* ignore */
                    }
                });
                this.context.on('requestfailed', (request) => {
                    var _a;
                    this.errorCollector.addNetworkFailure(request.url(), request.method(), undefined, (_a = request.failure()) === null || _a === void 0 ? void 0 : _a.errorText);
                });
            }
        });
    }
    navigate(url) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.page)
                throw new Error('No active session');
            yield this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        });
    }
    click(ref) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.page)
                throw new Error('No active session');
            const cleanRef = ref.replace(/^@/, '');
            yield this.page.click(`[data-cm-ref="${cleanRef}"]`, { timeout: 15000 });
        });
    }
    fill(ref, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.page)
                throw new Error('No active session');
            const cleanRef = ref.replace(/^@/, '');
            yield this.page.fill(`[data-cm-ref="${cleanRef}"]`, value, { timeout: 15000 });
        });
    }
    type(ref, text, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.page)
                throw new Error('No active session');
            const cleanRef = ref.replace(/^@/, '');
            yield this.page.fill(`[data-cm-ref="${cleanRef}"]`, text, { timeout: 15000 });
        });
    }
    press(key) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.page)
                throw new Error('No active session');
            yield this.page.keyboard.press(key);
        });
    }
    screenshot(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.page)
                throw new Error('No active session');
            return this.page.screenshot({ type: 'png', fullPage: opts === null || opts === void 0 ? void 0 : opts.fullPage });
        });
    }
    getSnapshot() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.page)
                throw new Error('No active session');
            // Use Playwright's accessibility snapshot
            const pwSnapshot = yield this.page.accessibility.snapshot();
            // Also tag interactive elements with data-cm-ref
            const refMapping = yield this.page.evaluate(() => {
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
            this.refMap = refMapping;
            // Convert Playwright a11y tree to our format
            const root = this.convertA11yNode(pwSnapshot, 0);
            return {
                root,
                refs: refMapping,
                timestamp: new Date().toISOString(),
            };
        });
    }
    getConsole() {
        return __awaiter(this, void 0, void 0, function* () {
            return [...this.consoleLog];
        });
    }
    getNetwork() {
        return __awaiter(this, void 0, void 0, function* () {
            return [...this.networkLog];
        });
    }
    getErrors() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.errorCollector.getAll();
        });
    }
    startRecording() {
        return __awaiter(this, void 0, void 0, function* () {
            // Video recording must be set at context creation time in Playwright
            // This is a no-op if not started with recordVideo
            if (!this.context)
                throw new Error('No active session');
        });
    }
    stopRecording() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.page)
                throw new Error('No active session');
            // Playwright saves video on page close
            const video = this.page.video();
            if (video) {
                const path = yield video.path();
                return path;
            }
            return '';
        });
    }
    getEngineInfo() {
        return {
            name: 'playwright',
            version: '1.x',
            capabilities: {
                a11ySnapshot: true,
                videoRecording: true,
                networkCapture: true,
                consoleCapture: true,
            },
        };
    }
    closeSession() {
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
            this.consoleLog = [];
            this.networkLog = [];
            this.errorCollector.clear();
            this.refMap = {};
        });
    }
    // ── Private helpers ─────────────────────────────────────────────────────────
    convertA11yNode(node, depth) {
        var _a, _b;
        if (!node)
            return { role: 'unknown', name: '', ref: `@e${depth}` };
        const ref = `@e${depth}`;
        const result = {
            role: (_a = node.role) !== null && _a !== void 0 ? _a : 'unknown',
            name: (_b = node.name) !== null && _b !== void 0 ? _b : '',
            ref,
        };
        if (node.value !== undefined)
            result.value = String(node.value);
        if (node.focused)
            result.focused = true;
        if (node.disabled)
            result.disabled = true;
        if (node.expanded !== undefined)
            result.expanded = node.expanded;
        if (node.selected !== undefined)
            result.selected = node.selected;
        if (node.children && Array.isArray(node.children)) {
            result.children = node.children.map((child, i) => this.convertA11yNode(child, depth * 10 + i + 1));
        }
        return result;
    }
}
exports.PlaywrightAdapter = PlaywrightAdapter;
