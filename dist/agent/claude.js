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
exports.ClaudeBackend = void 0;
const child_process_1 = require("child_process");
const spawn_helper_1 = require("./spawn-helper");
function asyncTransform(raw) {
    return __asyncGenerator(this, arguments, function* asyncTransform_1() {
        var _a, e_1, _b, _c;
        var _d, _e, _f;
        try {
            for (var _g = true, raw_1 = __asyncValues(raw), raw_1_1; raw_1_1 = yield __await(raw_1.next()), _a = raw_1_1.done, !_a; _g = true) {
                _c = raw_1_1.value;
                _g = false;
                const msg = _c;
                const nd = msg;
                if (nd.type === 'assistant') {
                    const assistant = nd;
                    const sessionId = assistant.session_id;
                    for (const block of assistant.message.content) {
                        if (block.type === 'text' && block.text) {
                            yield yield __await({ type: 'text', content: block.text, sessionId });
                        }
                        else if (block.type === 'tool_use' && block.id && block.name) {
                            yield yield __await({
                                type: 'tool-use',
                                tool: block.name,
                                callId: block.id,
                                input: (_d = block.input) !== null && _d !== void 0 ? _d : {},
                                attempt: 1,
                            });
                        }
                    }
                }
                else if (nd.type === 'tool_result') {
                    const tr = nd;
                    yield yield __await({
                        type: 'tool-result',
                        callId: tr.tool_use_id,
                        output: (_e = tr.content) !== null && _e !== void 0 ? _e : '',
                        isError: (_f = tr.is_error) !== null && _f !== void 0 ? _f : false,
                    });
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_g && !_a && (_b = raw_1.return)) yield __await(_b.call(raw_1));
            }
            finally { if (e_1) throw e_1.error; }
        }
    });
}
function collectResult(proc) {
    const start = Date.now();
    return new Promise((resolve) => {
        let lastSessionId;
        let lastResult = '';
        let lastError;
        let status = 'completed';
        let usage;
        (() => __awaiter(this, void 0, void 0, function* () {
            var _a, e_2, _b, _c;
            var _d;
            try {
                try {
                    for (var _e = true, _f = __asyncValues(proc.messages), _g; _g = yield _f.next(), _a = _g.done, !_a; _e = true) {
                        _c = _g.value;
                        _e = false;
                        const msg = _c;
                        const nd = msg;
                        if (nd.type === 'assistant') {
                            const a = nd;
                            if (a.session_id)
                                lastSessionId = a.session_id;
                        }
                        else if (nd.type === 'result') {
                            const r = nd;
                            lastResult = (_d = r.result) !== null && _d !== void 0 ? _d : '';
                            if (r.session_id)
                                lastSessionId = r.session_id;
                            if (r.is_error) {
                                status = 'failed';
                                lastError = r.result;
                            }
                            if (r.usage) {
                                usage = {};
                                for (const [model, u] of Object.entries(r.usage)) {
                                    usage[model] = { input: u.input_tokens, output: u.output_tokens };
                                }
                            }
                        }
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (!_e && !_a && (_b = _f.return)) yield _b.call(_f);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
            }
            catch (err) {
                status = 'failed';
                lastError = err instanceof Error ? err.message : String(err);
            }
            resolve({
                status,
                output: lastResult,
                error: lastError,
                durationMs: Date.now() - start,
                sessionId: lastSessionId,
                usage,
            });
        }))();
    });
}
class ClaudeBackend {
    constructor() {
        this.name = 'claude-code';
    }
    detectVersion() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return (0, child_process_1.execFileSync)('claude', ['--version'], {
                    encoding: 'utf8',
                    timeout: 10000,
                }).trim();
            }
            catch (_a) {
                return 'unknown';
            }
        });
    }
    execute(prompt, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const args = ['--print', '--output-format', 'stream-json'];
            if (opts.model)
                args.push('--model', opts.model);
            if (opts.maxTurns)
                args.push('--max-turns', String(opts.maxTurns));
            if (opts.systemPrompt)
                args.push('--system-prompt', opts.systemPrompt);
            if (opts.resumeSessionId)
                args.push('--resume', opts.resumeSessionId);
            if (opts.customArgs)
                args.push(...opts.customArgs);
            args.push(prompt);
            const proc = (0, spawn_helper_1.spawnProcess)({
                command: 'claude',
                args,
                cwd: opts.cwd,
                env: opts.customEnv,
                timeoutMs: opts.timeoutMs,
                semanticInactivityMs: opts.semanticInactivityMs,
            });
            const messages = asyncTransform(proc.messages);
            const result = collectResult(proc);
            return {
                messages,
                result,
                cancel: () => proc.cancel(),
            };
        });
    }
}
exports.ClaudeBackend = ClaudeBackend;
