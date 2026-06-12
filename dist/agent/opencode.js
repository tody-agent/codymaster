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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenCodeBackend = void 0;
const child_process_1 = require("child_process");
class AsyncIterableEmitter {
    constructor() {
        this.queue = [];
        this.resolvers = [];
        this.done = false;
    }
    emit(value) {
        if (this.done)
            return;
        const resolver = this.resolvers.shift();
        if (resolver) {
            resolver({ value, done: false });
        }
        else {
            this.queue.push(value);
        }
    }
    close() {
        this.done = true;
        while (this.resolvers.length > 0) {
            this.resolvers.shift()({ value: undefined, done: true });
        }
    }
    [Symbol.asyncIterator]() {
        return {
            next: () => {
                if (this.queue.length > 0) {
                    return Promise.resolve({ value: this.queue.shift(), done: false });
                }
                if (this.done) {
                    return Promise.resolve({ value: undefined, done: true });
                }
                return new Promise((resolve) => {
                    this.resolvers.push(resolve);
                });
            },
        };
    }
}
function spawnTextProcess(opts) {
    const mergedEnv = Object.assign(Object.assign({}, process.env), opts.env);
    const child = (0, child_process_1.spawn)(opts.command, opts.args, {
        cwd: opts.cwd,
        env: mergedEnv,
        stdio: ['pipe', 'pipe', 'pipe'],
    });
    const emitter = new AsyncIterableEmitter();
    let timeoutTimer;
    if (opts.timeoutMs) {
        timeoutTimer = setTimeout(() => {
            child.kill('SIGKILL');
        }, opts.timeoutMs);
    }
    let stdoutBuffer = '';
    child.stdout.on('data', (chunk) => {
        stdoutBuffer += chunk.toString('utf8');
        const lines = stdoutBuffer.split('\n');
        stdoutBuffer = lines.pop();
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed) {
                emitter.emit({ type: 'text', content: trimmed });
            }
        }
    });
    child.on('exit', () => {
        if (timeoutTimer)
            clearTimeout(timeoutTimer);
        if (stdoutBuffer.trim()) {
            emitter.emit({ type: 'text', content: stdoutBuffer.trim() });
        }
        emitter.close();
    });
    child.on('error', () => {
        if (timeoutTimer)
            clearTimeout(timeoutTimer);
        emitter.close();
    });
    return {
        messages: emitter,
        cancel: () => __awaiter(this, void 0, void 0, function* () {
            if (timeoutTimer)
                clearTimeout(timeoutTimer);
            try {
                child.kill('SIGTERM');
                yield new Promise((resolve) => {
                    const grace = setTimeout(() => {
                        child.kill('SIGKILL');
                        resolve();
                    }, 5000);
                    child.on('exit', () => {
                        clearTimeout(grace);
                        resolve();
                    });
                });
            }
            catch (_a) {
                // already dead
            }
        }),
    };
}
function collectResult(proc) {
    const start = Date.now();
    return new Promise((resolve) => {
        let output = '';
        let lastError;
        let status = 'completed';
        (() => __awaiter(this, void 0, void 0, function* () {
            var _a, e_1, _b, _c;
            try {
                try {
                    for (var _d = true, _e = __asyncValues(proc.messages), _f; _f = yield _e.next(), _a = _f.done, !_a; _d = true) {
                        _c = _f.value;
                        _d = false;
                        const msg = _c;
                        if (msg.type === 'text') {
                            output += msg.content + '\n';
                        }
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (!_d && !_a && (_b = _e.return)) yield _b.call(_e);
                    }
                    finally { if (e_1) throw e_1.error; }
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
class OpenCodeBackend {
    constructor() {
        this.name = 'opencode';
    }
    detectVersion() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return (0, child_process_1.execFileSync)('opencode', ['--version'], {
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
            const args = ['run'];
            if (opts.model)
                args.push('--model', opts.model);
            if (opts.customArgs)
                args.push(...opts.customArgs);
            args.push(prompt);
            const proc = spawnTextProcess({
                command: 'opencode',
                args,
                cwd: opts.cwd,
                env: opts.customEnv,
                timeoutMs: opts.timeoutMs,
            });
            const messages = proc.messages;
            const result = collectResult(proc);
            return {
                messages,
                result,
                cancel: () => proc.cancel(),
            };
        });
    }
}
exports.OpenCodeBackend = OpenCodeBackend;
