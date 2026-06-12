"use strict";
/**
 * AgentBrowserAdapter — BrowserAdapter implementation using agent-browser CLI.
 * Calls the Rust CLI via child_process, parses structured output.
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
exports.AgentBrowserAdapter = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const error_collector_1 = require("../error-collector");
const execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
class AgentBrowserAdapter {
    constructor() {
        this.name = 'agent-browser';
        this.errorCollector = new error_collector_1.ErrorCollector();
        this.consoleLog = [];
        this.networkLog = [];
        this.sessionActive = false;
        this.currentUrl = '';
    }
    isAvailable() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { stdout } = yield execFileAsync('agent-browser', ['--version'], { timeout: 5000 });
                return stdout.trim().length > 0;
            }
            catch (_a) {
                return false;
            }
        });
    }
    startSession(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const args = ['open'];
            if ((opts === null || opts === void 0 ? void 0 : opts.headless) === false)
                args.push('--headed');
            yield this.exec(args);
            this.sessionActive = true;
        });
    }
    navigate(url) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.exec(['navigate', url]);
            this.currentUrl = url;
        });
    }
    click(ref) {
        return __awaiter(this, void 0, void 0, function* () {
            const cleanRef = ref.startsWith('@') ? ref : `@${ref}`;
            yield this.exec(['click', cleanRef]);
        });
    }
    fill(ref, value) {
        return __awaiter(this, void 0, void 0, function* () {
            const cleanRef = ref.startsWith('@') ? ref : `@${ref}`;
            yield this.exec(['fill', cleanRef, value]);
        });
    }
    type(ref, text, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const cleanRef = ref.startsWith('@') ? ref : `@${ref}`;
            const args = ['type', cleanRef, text];
            if (opts === null || opts === void 0 ? void 0 : opts.delay)
                args.push('--delay', String(opts.delay));
            yield this.exec(args);
        });
    }
    press(key) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.exec(['press', key]);
        });
    }
    screenshot(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const args = ['screenshot'];
            if (opts === null || opts === void 0 ? void 0 : opts.fullPage)
                args.push('--full-page');
            const { stdout } = yield this.exec(args);
            // agent-browser outputs base64 or file path
            if (stdout.startsWith('/')) {
                const fs = yield Promise.resolve().then(() => __importStar(require('fs')));
                return fs.readFileSync(stdout.trim());
            }
            return Buffer.from(stdout.trim(), 'base64');
        });
    }
    getSnapshot() {
        return __awaiter(this, void 0, void 0, function* () {
            const { stdout } = yield this.exec(['snapshot']);
            return this.parseSnapshot(stdout);
        });
    }
    getConsole() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { stdout } = yield this.exec(['console']);
                const entries = JSON.parse(stdout);
                this.consoleLog = entries.map((e) => {
                    var _a, _b, _c, _d, _e;
                    return ({
                        type: (_b = (_a = e.level) !== null && _a !== void 0 ? _a : e.type) !== null && _b !== void 0 ? _b : 'log',
                        text: (_d = (_c = e.text) !== null && _c !== void 0 ? _c : e.message) !== null && _d !== void 0 ? _d : '',
                        timestamp: (_e = e.timestamp) !== null && _e !== void 0 ? _e : new Date().toISOString(),
                    });
                });
            }
            catch (_a) {
                /* return cached */
            }
            return [...this.consoleLog];
        });
    }
    getNetwork() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { stdout } = yield this.exec(['network']);
                const entries = JSON.parse(stdout);
                this.networkLog = entries.map((e) => {
                    var _a, _b;
                    return ({
                        url: e.url,
                        method: (_a = e.method) !== null && _a !== void 0 ? _a : 'GET',
                        status: e.status,
                        timestamp: (_b = e.timestamp) !== null && _b !== void 0 ? _b : new Date().toISOString(),
                    });
                });
            }
            catch (_a) {
                /* return cached */
            }
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
            yield this.exec(['record', 'start']);
        });
    }
    stopRecording() {
        return __awaiter(this, void 0, void 0, function* () {
            const { stdout } = yield this.exec(['record', 'stop']);
            return stdout.trim();
        });
    }
    getEngineInfo() {
        return {
            name: 'agent-browser',
            version: 'latest',
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
            try {
                yield this.exec(['close']);
            }
            catch (_a) {
                /* ignore */
            }
            this.sessionActive = false;
            this.consoleLog = [];
            this.networkLog = [];
            this.errorCollector.clear();
        });
    }
    // ── Private helpers ─────────────────────────────────────────────────────────
    exec(args) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const proc = (0, child_process_1.spawn)('agent-browser', args, { timeout: 30000 });
                let stdout = '';
                let stderr = '';
                proc.stdout.on('data', (data) => { stdout += data.toString(); });
                proc.stderr.on('data', (data) => { stderr += data.toString(); });
                proc.on('close', (code) => {
                    if (code === 0) {
                        resolve({ stdout, stderr });
                    }
                    else {
                        const err = new Error(`agent-browser exited ${code}: ${stderr}`);
                        this.errorCollector.add({
                            type: 'js-error',
                            source: 'agent-browser',
                            message: stderr || `exit code ${code}`,
                        });
                        reject(err);
                    }
                });
                proc.on('error', (err) => {
                    this.errorCollector.add({
                        type: 'js-error',
                        source: 'agent-browser',
                        message: err.message,
                    });
                    reject(err);
                });
            });
        });
    }
    parseSnapshot(raw) {
        var _a;
        try {
            // Try JSON format first
            const parsed = JSON.parse(raw);
            return {
                root: this.normalizeA11yNode(parsed, 0),
                refs: (_a = parsed.refs) !== null && _a !== void 0 ? _a : {},
                timestamp: new Date().toISOString(),
            };
        }
        catch (_b) {
            // Fallback: parse text-based a11y tree
            return this.parseTextSnapshot(raw);
        }
    }
    normalizeA11yNode(node, depth) {
        var _a, _b, _c;
        if (!node)
            return { role: 'unknown', name: '', ref: `@e${depth}` };
        const result = {
            role: (_a = node.role) !== null && _a !== void 0 ? _a : 'unknown',
            name: (_b = node.name) !== null && _b !== void 0 ? _b : '',
            ref: (_c = node.ref) !== null && _c !== void 0 ? _c : `@e${depth}`,
        };
        if (node.value)
            result.value = String(node.value);
        if (node.focused)
            result.focused = true;
        if (node.disabled)
            result.disabled = true;
        if (node.children && Array.isArray(node.children)) {
            result.children = node.children.map((child, i) => this.normalizeA11yNode(child, depth * 10 + i + 1));
        }
        return result;
    }
    parseTextSnapshot(raw) {
        const refs = {};
        const lines = raw.split('\n').filter(l => l.trim());
        // Parse lines like: "  [button] Submit (@e1)"
        const root = { role: 'WebArea', name: this.currentUrl, ref: '@e0', children: [] };
        for (const line of lines) {
            const match = line.match(/\[(\w+)\]\s*(.+?)\s*\(@e(\d+)\)/);
            if (match) {
                const [, role, name, num] = match;
                const ref = `@e${num}`;
                refs[ref] = `${role}: ${name}`;
                root.children.push({ role, name, ref });
            }
        }
        return { root, refs, timestamp: new Date().toISOString() };
    }
}
exports.AgentBrowserAdapter = AgentBrowserAdapter;
