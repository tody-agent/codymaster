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
const spawn_helper_1 = require("./spawn-helper");
class AgentMessageTransformer {
    constructor() {
        this.output = [];
    }
    transform(msg) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v;
        const t = msg.type;
        if (t === 'message' || t === 'text' || t === 'assistant') {
            const content = (_b = (_a = msg.content) !== null && _a !== void 0 ? _a : msg.text) !== null && _b !== void 0 ? _b : '';
            if (content) {
                this.output.push(content);
                return [{ type: 'text', content }];
            }
        }
        if (t === 'thinking') {
            return [{ type: 'thinking', content: (_c = msg.content) !== null && _c !== void 0 ? _c : '' }];
        }
        if (t === 'tool_use' || t === 'tool-use') {
            return [
                {
                    type: 'tool-use',
                    tool: (_e = (_d = msg.tool) !== null && _d !== void 0 ? _d : msg.name) !== null && _e !== void 0 ? _e : 'unknown',
                    callId: (_g = (_f = msg.callId) !== null && _f !== void 0 ? _f : msg.id) !== null && _g !== void 0 ? _g : '',
                    input: (_j = (_h = msg.input) !== null && _h !== void 0 ? _h : msg.arguments) !== null && _j !== void 0 ? _j : {},
                    attempt: (_k = msg.attempt) !== null && _k !== void 0 ? _k : 1,
                    parentCallId: msg.parentCallId,
                },
            ];
        }
        if (t === 'tool_result' || t === 'tool-result') {
            return [
                {
                    type: 'tool-result',
                    callId: (_m = (_l = msg.callId) !== null && _l !== void 0 ? _l : msg.id) !== null && _m !== void 0 ? _m : '',
                    output: (_p = (_o = msg.output) !== null && _o !== void 0 ? _o : msg.content) !== null && _p !== void 0 ? _p : '',
                    isError: (_q = msg.isError) !== null && _q !== void 0 ? _q : false,
                },
            ];
        }
        if (t === 'status') {
            return [{ type: 'status', status: (_r = msg.status) !== null && _r !== void 0 ? _r : '' }];
        }
        if (t === 'log') {
            return [
                {
                    type: 'log',
                    level: (_s = msg.level) !== null && _s !== void 0 ? _s : 'info',
                    content: (_t = msg.content) !== null && _t !== void 0 ? _t : '',
                },
            ];
        }
        if (t === 'error') {
            return [{ type: 'error', content: (_v = (_u = msg.content) !== null && _u !== void 0 ? _u : msg.message) !== null && _v !== void 0 ? _v : '' }];
        }
        // Unknown message types are surfaced as status
        return [{ type: 'status', status: JSON.stringify(msg) }];
    }
    getOutput() {
        return this.output.join('');
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
            });
        });
    });
}
class CodexBackend {
    constructor() {
        this.name = 'codex';
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
            const args = ['--full-auto'];
            if (opts.model)
                args.push('--model', opts.model);
            if (opts.customArgs)
                args.push(...opts.customArgs);
            args.push(prompt);
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
