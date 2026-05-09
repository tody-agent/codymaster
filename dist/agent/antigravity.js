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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AntigravityBackend = void 0;
const child_process_1 = require("child_process");
const spawn_helper_1 = require("./spawn-helper");
const NAME = 'antigravity';
class AsyncMessageEmitter {
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
function collectTextLines(child, emit) {
    return new Promise((resolve) => {
        var _a, _b;
        let buffer = '';
        (_a = child.stdout) === null || _a === void 0 ? void 0 : _a.on('data', (chunk) => {
            buffer += chunk.toString('utf8');
            const lines = buffer.split('\n');
            buffer = lines.pop();
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed) {
                    emit({ type: 'text', content: trimmed });
                }
            }
        });
        (_b = child.stdout) === null || _b === void 0 ? void 0 : _b.on('end', () => {
            if (buffer.trim()) {
                emit({ type: 'text', content: buffer.trim() });
            }
            resolve();
        });
        child.on('error', () => resolve());
        child.on('exit', () => resolve());
    });
}
class AntigravityBackend {
    constructor() {
        this.name = NAME;
    }
    detectVersion() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return (0, child_process_1.execFileSync)(NAME, ['--version'], {
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
                command: NAME,
                args,
                cwd: opts.cwd,
                env: opts.customEnv,
                timeoutMs: opts.timeoutMs,
                semanticInactivityMs: opts.semanticInactivityMs,
            });
            const emitter = new AsyncMessageEmitter();
            const startTime = Date.now();
            const drainPromise = collectTextLines(proc.child, (msg) => emitter.emit(msg));
            const resultPromise = drainPromise.then(() => {
                return new Promise((resolve) => {
                    proc.child.on('exit', (code, signal) => {
                        const durationMs = Date.now() - startTime;
                        let status = 'completed';
                        let error;
                        if (signal === 'SIGTERM' || signal === 'SIGKILL') {
                            status = 'cancelled';
                        }
                        else if (code !== null && code !== 0) {
                            status = 'failed';
                            error = `${NAME} exited with code ${code}`;
                        }
                        emitter.close();
                        resolve({ status, output: '', error, durationMs });
                    });
                    proc.child.on('error', (err) => {
                        const durationMs = Date.now() - startTime;
                        emitter.close();
                        resolve({
                            status: 'failed',
                            output: '',
                            error: err.message,
                            durationMs,
                            failureReason: 'agent_crash',
                        });
                    });
                });
            });
            return {
                messages: emitter,
                result: resultPromise,
                cancel: () => proc.cancel(),
            };
        });
    }
}
exports.AntigravityBackend = AntigravityBackend;
