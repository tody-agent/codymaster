"use strict";
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
exports.CursorBackend = void 0;
const spawn_helper_1 = require("./spawn-helper");
const NAME = 'cursor';
function transformStdoutLines(child, emit) {
    return new Promise((resolve) => {
        var _a, _b, _c;
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
        (_b = child.stderr) === null || _b === void 0 ? void 0 : _b.on('data', (chunk) => {
            const text = chunk.toString('utf8').trim();
            if (text) {
                emit({ type: 'log', level: 'warn', content: text });
            }
        });
        (_c = child.stdout) === null || _c === void 0 ? void 0 : _c.on('end', () => {
            if (buffer.trim()) {
                emit({ type: 'text', content: buffer.trim() });
            }
            resolve();
        });
        child.on('error', () => resolve());
        child.on('exit', () => resolve());
    });
}
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
class CursorBackend {
    constructor() {
        this.name = NAME;
    }
    detectVersion() {
        return __awaiter(this, void 0, void 0, function* () {
            const { spawn } = yield Promise.resolve().then(() => __importStar(require('child_process')));
            return new Promise((resolve, reject) => {
                var _a;
                const child = spawn('cursor', ['--version'], {
                    stdio: ['ignore', 'pipe', 'pipe'],
                });
                let stdout = '';
                (_a = child.stdout) === null || _a === void 0 ? void 0 : _a.on('data', (chunk) => {
                    stdout += chunk.toString('utf8');
                });
                child.on('close', (code) => {
                    if (code === 0) {
                        resolve(stdout.trim());
                    }
                    else {
                        reject(new Error(`cursor --version exited with code ${code}`));
                    }
                });
                child.on('error', (err) => {
                    reject(new Error(`Failed to run cursor: ${err.message}`));
                });
            });
        });
    }
    execute(prompt, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const args = ['chat'];
            if (opts.model) {
                args.push('--model', opts.model);
            }
            if (opts.customArgs) {
                args.push(...opts.customArgs);
            }
            args.push(prompt);
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
            const drainPromise = transformStdoutLines(proc.child, (msg) => emitter.emit(msg));
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
                            error = `cursor exited with code ${code}`;
                        }
                        emitter.close();
                        resolve({
                            status,
                            output: '',
                            error,
                            durationMs,
                        });
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
exports.CursorBackend = CursorBackend;
