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
exports.CopilotBackend = void 0;
const child_process_1 = require("child_process");
const child_process_2 = require("child_process");
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
    var _a;
    const mergedEnv = Object.assign(Object.assign({}, process.env), opts.env);
    const child = (0, child_process_1.spawn)(opts.command, opts.args, {
        cwd: opts.cwd,
        env: mergedEnv,
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: true,
    });
    const pgid = (_a = child.pid) !== null && _a !== void 0 ? _a : 0;
    const emitter = new AsyncIterableEmitter();
    const stderrLines = [];
    let lastMessageTime = Date.now();
    let inactivityTimer;
    let timeoutTimer;
    function clearTimers() {
        if (inactivityTimer)
            clearTimeout(inactivityTimer);
        if (timeoutTimer)
            clearTimeout(timeoutTimer);
    }
    function killProcess() {
        clearTimers();
        return new Promise((resolve) => {
            try {
                if (pgid > 0) {
                    process.kill(-pgid, 'SIGKILL');
                }
                else if (child.pid) {
                    child.kill('SIGKILL');
                }
            }
            catch (_a) {
                // process may already be dead
            }
            resolve();
        });
    }
    if (opts.timeoutMs) {
        timeoutTimer = setTimeout(() => {
            killProcess();
        }, opts.timeoutMs);
    }
    function resetInactivityWatchdog() {
        if (inactivityTimer)
            clearTimeout(inactivityTimer);
        if (!opts.semanticInactivityMs)
            return;
        inactivityTimer = setTimeout(() => {
            const elapsed = Date.now() - lastMessageTime;
            if (elapsed >= opts.semanticInactivityMs) {
                killProcess();
            }
        }, opts.semanticInactivityMs);
    }
    resetInactivityWatchdog();
    // stdout: emit each line as a text message
    let stdoutBuffer = '';
    child.stdout.on('data', (chunk) => {
        stdoutBuffer += chunk.toString('utf8');
        const lines = stdoutBuffer.split('\n');
        stdoutBuffer = lines.pop();
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed)
                continue;
            lastMessageTime = Date.now();
            emitter.emit({ type: 'text', content: trimmed });
        }
    });
    // stderr: collect lines
    let stderrBuffer = '';
    child.stderr.on('data', (chunk) => {
        stderrBuffer += chunk.toString('utf8');
        const lines = stderrBuffer.split('\n');
        stderrBuffer = lines.pop();
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed)
                stderrLines.push(trimmed);
        }
    });
    child.on('exit', () => {
        clearTimers();
        emitter.close();
    });
    child.on('error', () => {
        clearTimers();
        emitter.close();
    });
    function cancel() {
        return __awaiter(this, void 0, void 0, function* () {
            clearTimers();
            try {
                if (pgid > 0) {
                    process.kill(-pgid, 'SIGTERM');
                }
                else if (child.pid) {
                    child.kill('SIGTERM');
                }
            }
            catch (_a) {
                return;
            }
            yield new Promise((resolve) => {
                const graceTimer = setTimeout(() => {
                    try {
                        if (pgid > 0) {
                            process.kill(-pgid, 'SIGKILL');
                        }
                        else if (child.pid) {
                            child.kill('SIGKILL');
                        }
                    }
                    catch (_a) {
                        // ignore
                    }
                    resolve();
                }, 5000);
                child.on('exit', () => {
                    clearTimeout(graceTimer);
                    resolve();
                });
            });
        });
    }
    return { child, messages: emitter, cancel };
}
function collectResult(proc) {
    const start = Date.now();
    return new Promise((resolve) => {
        let resultText = '';
        let status = 'completed';
        let errorText;
        const stderrLines = [];
        proc.child.stderr.on('data', (chunk) => {
            stderrLines.push(chunk.toString('utf8'));
        });
        (() => __awaiter(this, void 0, void 0, function* () {
            var _a, e_1, _b, _c;
            try {
                try {
                    for (var _d = true, _e = __asyncValues(proc.messages), _f; _f = yield _e.next(), _a = _f.done, !_a; _d = true) {
                        _c = _f.value;
                        _d = false;
                        const msg = _c;
                        if (msg.type === 'text') {
                            resultText += (resultText ? '\n' : '') + msg.content;
                        }
                        else if (msg.type === 'error') {
                            status = 'failed';
                            errorText = msg.content;
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
                errorText = err instanceof Error ? err.message : String(err);
            }
            proc.child.on('exit', (code) => {
                if (status === 'completed' && code !== 0) {
                    status = 'failed';
                    const stderr = stderrLines.join('');
                    errorText = stderr || `Process exited with code ${code}`;
                }
                resolve({
                    status,
                    output: resultText,
                    error: errorText,
                    durationMs: Date.now() - start,
                });
            });
        }))();
    });
}
class CopilotBackend {
    constructor() {
        this.name = 'copilot';
    }
    detectVersion() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return (0, child_process_2.execFileSync)('copilot', ['--version'], {
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
            const proc = spawnTextProcess({
                command: 'copilot',
                args,
                cwd: opts.cwd,
                env: opts.customEnv,
                timeoutMs: opts.timeoutMs,
                semanticInactivityMs: opts.semanticInactivityMs,
            });
            return {
                messages: proc.messages,
                result: collectResult(proc),
                cancel: () => proc.cancel(),
            };
        });
    }
}
exports.CopilotBackend = CopilotBackend;
