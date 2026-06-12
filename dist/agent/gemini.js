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
exports.GeminiBackend = void 0;
const child_process_1 = require("child_process");
const spawn_helper_1 = require("./spawn-helper");
function asyncTransform(raw) {
    return __asyncGenerator(this, arguments, function* asyncTransform_1() {
        var _a, e_1, _b, _c;
        try {
            for (var _d = true, raw_1 = __asyncValues(raw), raw_1_1; raw_1_1 = yield __await(raw_1.next()), _a = raw_1_1.done, !_a; _d = true) {
                _c = raw_1_1.value;
                _d = false;
                const msg = _c;
                const text = msg.content;
                if (typeof text === 'string' && text.length > 0) {
                    yield yield __await({ type: 'text', content: text });
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
function collectResult(proc) {
    const start = Date.now();
    return new Promise((resolve) => {
        let output = '';
        let lastError;
        let status = 'completed';
        (() => __awaiter(this, void 0, void 0, function* () {
            var _a, e_2, _b, _c;
            try {
                try {
                    for (var _d = true, _e = __asyncValues(proc.messages), _f; _f = yield _e.next(), _a = _f.done, !_a; _d = true) {
                        _c = _f.value;
                        _d = false;
                        const msg = _c;
                        const text = msg.content;
                        if (typeof text === 'string' && text.length > 0) {
                            output += text + '\n';
                        }
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (!_d && !_a && (_b = _e.return)) yield _b.call(_e);
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
                output: output.trim(),
                error: lastError,
                durationMs: Date.now() - start,
            });
        }))();
    });
}
class GeminiBackend {
    constructor() {
        this.name = 'gemini';
    }
    detectVersion() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return (0, child_process_1.execFileSync)('gemini', ['--version'], {
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
            const args = ['-p', prompt];
            if (opts.model)
                args.push('--model', opts.model);
            if (opts.customArgs)
                args.push(...opts.customArgs);
            const proc = (0, spawn_helper_1.spawnProcess)({
                command: 'gemini',
                args,
                cwd: opts.cwd,
                env: opts.customEnv,
                timeoutMs: opts.timeoutMs,
                semanticInactivityMs: opts.semanticInactivityMs,
                outputFormat: 'text',
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
exports.GeminiBackend = GeminiBackend;
