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
exports.spawnProcess = spawnProcess;
exports.getStderr = getStderr;
const child_process_1 = require("child_process");
const events_1 = require("events");
const STDERR_RING_BUFFER_SIZE = 64 * 1024; // 64KB
const CANCEL_SIGTERM_GRACE_MS = 5000;
class RingBuffer {
    constructor() {
        this.buf = Buffer.alloc(STDERR_RING_BUFFER_SIZE);
        this.writePos = 0;
        this.full = false;
    }
    append(chunk) {
        const data = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
        for (let i = 0; i < data.length; i++) {
            this.buf[this.writePos] = data[i];
            this.writePos = (this.writePos + 1) % STDERR_RING_BUFFER_SIZE;
            if (this.writePos === 0)
                this.full = true;
        }
    }
    toString() {
        if (!this.full) {
            return this.buf.subarray(0, this.writePos).toString('utf8');
        }
        const tail = this.buf.subarray(this.writePos).toString('utf8');
        const head = this.buf.subarray(0, this.writePos).toString('utf8');
        return tail + head;
    }
}
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
function spawnProcess(opts) {
    var _a;
    const mergedEnv = Object.assign(Object.assign({}, process.env), opts.env);
    const child = (0, child_process_1.spawn)(opts.command, opts.args, {
        cwd: opts.cwd,
        env: mergedEnv,
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: true,
    });
    const pgid = (_a = child.pid) !== null && _a !== void 0 ? _a : 0;
    const emitter = new events_1.EventEmitter();
    const messageIterable = new AsyncIterableEmitter();
    const stderrRing = new RingBuffer();
    let lastMessageTime = Date.now();
    let inactivityTimer;
    let timeoutTimer;
    // Line parsing from stdout
    const isTextMode = opts.outputFormat === 'text';
    let stdoutBuffer = '';
    child.stdout.on('data', (chunk) => {
        stdoutBuffer += chunk.toString('utf8');
        const lines = stdoutBuffer.split('\n');
        stdoutBuffer = lines.pop();
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed)
                continue;
            if (isTextMode) {
                const msg = { type: 'text', content: trimmed };
                lastMessageTime = Date.now();
                emitter.emit('message', msg);
                messageIterable.emit(msg);
            }
            else {
                try {
                    const msg = JSON.parse(trimmed);
                    lastMessageTime = Date.now();
                    emitter.emit('message', msg);
                    messageIterable.emit(msg);
                }
                catch (_a) {
                    // skip non-JSON lines
                }
            }
        }
    });
    // stderr ring buffer
    child.stderr.on('data', (chunk) => {
        stderrRing.append(chunk);
    });
    // Inactivity watchdog
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
    // Process timeout
    if (opts.timeoutMs) {
        timeoutTimer = setTimeout(() => {
            killProcess();
        }, opts.timeoutMs);
    }
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
    child.on('exit', () => {
        clearTimers();
        messageIterable.close();
    });
    child.on('error', () => {
        clearTimers();
        messageIterable.close();
    });
    // Start inactivity watchdog
    resetInactivityWatchdog();
    // Listen for messages to reset watchdog
    emitter.on('message', () => {
        resetInactivityWatchdog();
    });
    function cancel() {
        return __awaiter(this, void 0, void 0, function* () {
            clearTimers();
            // Graceful cancel: SIGTERM -> wait 5s -> SIGKILL
            try {
                if (pgid > 0) {
                    process.kill(-pgid, 'SIGTERM');
                }
                else if (child.pid) {
                    child.kill('SIGTERM');
                }
            }
            catch (_a) {
                // process may already be dead
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
                }, CANCEL_SIGTERM_GRACE_MS);
                child.on('exit', () => {
                    clearTimeout(graceTimer);
                    resolve();
                });
            });
        });
    }
    return {
        child,
        pgid,
        messages: messageIterable,
        cancel,
        kill: killProcess,
    };
}
function getStderr(child) {
    // This is a helper to retrieve stderr from a ring buffer if attached
    // In practice, users should capture stderr via the ring buffer instance
    return '';
}
