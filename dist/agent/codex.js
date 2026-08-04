"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function () { return this; }, i;
    function awaitReturn(f) { return function (v) { return Promise.resolve(v).then(f, reject); }; }
    function verb(n, f) { if (g[n]) { i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; if (f) i[n] = f(i[n]); } }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodexBackend = void 0;
exports.buildCodexPrompt = buildCodexPrompt;
exports.buildCodexArgs = buildCodexArgs;
const spawn_helper_1 = require("./spawn-helper");
function buildCodexPrompt(prompt, opts) {
    var _a;
    if (!((_a = opts.systemPrompt) === null || _a === void 0 ? void 0 : _a.trim()))
        return prompt;
    return [
        '<system_prompt>',
        opts.systemPrompt.trim(),
        '</system_prompt>',
        '',
        prompt,
    ].join('\n');
}
function buildCodexArgs(prompt, opts) {
    const baseArgs = ['--json', '--skip-git-repo-check'];
    if (opts.model)
        baseArgs.push('--model', opts.model);
    if (opts.customArgs)
        baseArgs.push(...opts.customArgs);
    const finalPrompt = buildCodexPrompt(prompt, opts);
    if (opts.resumeSessionId) {
        return ['exec', 'resume', ...baseArgs, opts.resumeSessionId, finalPrompt];
    }
    return ['exec', ...baseArgs, finalPrompt];
}
class AgentMessageTransformer {
    constructor() {
        this.output = [];
    }
    transform(msg) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0;
        const codexEvent = msg;
        if (codexEvent.thread_id) {
            this.lastThreadId = codexEvent.thread_id;
        }
        if (codexEvent.type === 'item.completed' && ((_a = codexEvent.item) === null || _a === void 0 ? void 0 : _a.type) === 'agent_message') {
            const content = (_b = codexEvent.item.text) !== null && _b !== void 0 ? _b : '';
            if (content) {
                this.output.push(content);
                return [{ type: 'text', content, sessionId: this.lastThreadId }];
            }
        }
        if (codexEvent.type === 'turn.completed' && codexEvent.usage) {
            this.usage = {
                codex: {
                    input: (_c = codexEvent.usage.input_tokens) !== null && _c !== void 0 ? _c : 0,
                    output: (_d = codexEvent.usage.output_tokens) !== null && _d !== void 0 ? _d : 0,
                    cacheRead: (_e = codexEvent.usage.cached_input_tokens) !== null && _e !== void 0 ? _e : 0,
                },
            };
            return [];
        }
        const t = msg.type;
        if (t === 'message' || t === 'text' || t === 'assistant') {
            const content = (_g = (_f = msg.content) !== null && _f !== void 0 ? _f : msg.text) !== null && _g !== void 0 ? _g : '';
            if (content) {
                this.output.push(content);
                return [{ type: 'text', content, sessionId: this.lastThreadId }];
            }
        }
        if (t === 'thinking') {
            return [{ type: 'thinking', content: (_h = msg.content) !== null && _h !== void 0 ? _h : '' }];
        }
        if (t === 'tool_use' || t === 'tool-use') {
            return [
                {
                    type: 'tool-use',
                    tool: (_k = (_j = msg.tool) !== null && _j !== void 0 ? _j : msg.name) !== null && _k !== void 0 ? _k : 'unknown',
                    callId: (_m = (_l = msg.callId) !== null && _l !== void 0 ? _l : msg.id) !== null && _m !== void 0 ? _m : '',
                    input: (_p = (_o = msg.input) !== null && _o !== void 0 ? _o : msg.arguments) !== null && _p !== void 0 ? _p : {},
                    attempt: (_q = msg.attempt) !== null && _q !== void 0 ? _q : 1,
                    parentCallId: msg.parentCallId,
                },
            ];
        }
        if (t === 'tool_result' || t === 'tool-result') {
            return [
                {
                    type: 'tool-result',
                    callId: (_s = (_r = msg.callId) !== null && _r !== void 0 ? _r : msg.id) !== null && _s !== void 0 ? _s : '',
                    output: (_u = (_t = msg.output) !== null && _t !== void 0 ? _t : msg.content) !== null && _u !== void 0 ? _u : '',
                    isError: (_v = msg.isError) !== null && _v !== void 0 ? _v : false,
                },
            ];
        }
        if (t === 'status') {
            return [{ type: 'status', status: (_w = msg.status) !== null && _w !== void 0 ? _w : '' }];
        }
        if (t === 'log') {
            return [
                {
                    type: 'log',
                    level: (_x = msg.level) !== null && _x !== void 0 ? _x : 'info',
                    content: (_y = msg.content) !== null && _y !== void 0 ? _y : '',
                },
            ];
        }
        if (t === 'error') {
            return [{ type: 'error', content: (_0 = (_z = msg.content) !== null && _z !== void 0 ? _z : msg.message) !== null && _0 !== void 0 ? _0 : '' }];
        }
        // Unknown message types are surfaced as status
        return [{ type: 'status', status: JSON.stringify(msg) }];
    }
    getOutput() {
        return this.output.join('');
    }
    getSessionId() {
        return this.lastThreadId;
    }
    getUsage() {
        return this.usage;
    }
}
function transformMessages(raw, transformer) {
    return __asyncGenerator(this, arguments, function* transformMessages_1() {
        var _a, e_1, _b, _c;
        try {
            for (var _d = true, raw_1 = __asyncValues(raw), raw_1_1; raw_1_1 = yield __await(raw_1.next()), _a = raw_1_1.done, !_a; _d = true) {
                _c = raw_1_1.value;
                _d = false;
                const msg = _c;
                for (const agentMsg of transformer.transform(msg)) {
                    yield yield __await(agentMsg);
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = raw_1.return)) yield __await(_b.call(raw_1));
            }
            finally { if (e_1) throw e_1.error; }
        }
    });
}
function collectResult(proc, transformer, startTime) {
    return new Promise((resolve) => {
        proc.child.on('exit', (code, signal) => {
            const exitCode = typeof code === 'number' ? code : null;
            const durationMs = Date.now() - startTime;
            let status = 'completed';
            let failureReason;
            if (signal === 'SIGTERM' || signal === 'SIGKILL') {
                status = 'cancelled';
                failureReason = 'cancelled_by_user';
            }
            else if (exitCode !== null && exitCode !== 0) {
                status = 'failed';
                failureReason = 'agent_crash';
            }
            resolve({
                status,
                output: transformer.getOutput(),
                durationMs,
                failureReason,
                sessionId: transformer.getSessionId(),
                usage: transformer.getUsage(),
            });
        });
        proc.child.on('error', (err) => {
            const durationMs = Date.now() - startTime;
            resolve({
                status: 'failed',
                output: transformer.getOutput(),
                error: err instanceof Error ? err.message : String(err),
                failureReason: 'agent_crash',
                durationMs,
                sessionId: transformer.getSessionId(),
                usage: transformer.getUsage(),
            });
        });
    });
}
class CodexBackend {
    constructor() {
        this.name = 'codex';
        this.capabilities = { isolatedSessions: true, resumableSessions: true };
    }
    detectVersion() {
        return __awaiter(this, void 0, void 0, function* () {
            const proc = (0, spawn_helper_1.spawnProcess)({
                command: 'codex',
                args: ['--version'],
                cwd: process.cwd(),
                timeoutMs: 10000,
            });
            return new Promise((resolve, reject) => {
                var _a;
                let stdout = '';
                (_a = proc.child.stdout) === null || _a === void 0 ? void 0 : _a.on('data', (chunk) => {
                    stdout += chunk.toString('utf8');
                });
                proc.child.on('exit', () => {
                    resolve(stdout.trim() || 'unknown');
                });
                proc.child.on('error', (err) => {
                    reject(new Error(`codex --version failed: ${err.message}`));
                });
            });
        });
    }
    execute(prompt, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const args = buildCodexArgs(prompt, opts);
            const proc = (0, spawn_helper_1.spawnProcess)({
                command: 'codex',
                args,
                cwd: opts.cwd,
                env: opts.customEnv,
                timeoutMs: opts.timeoutMs,
                semanticInactivityMs: opts.semanticInactivityMs,
            });
            const transformer = new AgentMessageTransformer();
            const startTime = Date.now();
            return {
                messages: transformMessages(proc.messages, transformer),
                result: collectResult(proc, transformer, startTime),
                cancel: () => proc.cancel(),
            };
        });
    }
}
exports.CodexBackend = CodexBackend;
