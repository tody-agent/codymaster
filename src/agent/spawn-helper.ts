import { spawn, type ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

export interface SpawnOpts {
  command: string;
  args: string[];
  cwd: string;
  env?: Record<string, string>;
  timeoutMs?: number;
  semanticInactivityMs?: number;
  outputFormat?: 'ndjson' | 'text';
}

export interface SpawnedProcess {
  child: ChildProcess;
  pgid: number;
  messages: AsyncIterable<NDJSONMessage>;
  cancel(): Promise<void>;
  kill(): Promise<void>;
}

export interface NDJSONMessage {
  type: string;
  [key: string]: unknown;
}

const STDERR_RING_BUFFER_SIZE = 64 * 1024; // 64KB
const CANCEL_SIGTERM_GRACE_MS = 5_000;

class RingBuffer {
  private buf = Buffer.alloc(STDERR_RING_BUFFER_SIZE);
  private writePos = 0;
  private full = false;

  append(chunk: Buffer | string): void {
    const data = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
    for (let i = 0; i < data.length; i++) {
      this.buf[this.writePos] = data[i];
      this.writePos = (this.writePos + 1) % STDERR_RING_BUFFER_SIZE;
      if (this.writePos === 0) this.full = true;
    }
  }

  toString(): string {
    if (!this.full) {
      return this.buf.subarray(0, this.writePos).toString('utf8');
    }
    const tail = this.buf.subarray(this.writePos).toString('utf8');
    const head = this.buf.subarray(0, this.writePos).toString('utf8');
    return tail + head;
  }
}

class AsyncIterableEmitter<T> implements AsyncIterable<T> {
  private queue: T[] = [];
  private resolvers: Array<(value: IteratorResult<T>) => void> = [];
  private done = false;

  emit(value: T): void {
    if (this.done) return;
    const resolver = this.resolvers.shift();
    if (resolver) {
      resolver({ value, done: false });
    } else {
      this.queue.push(value);
    }
  }

  close(): void {
    this.done = true;
    while (this.resolvers.length > 0) {
      this.resolvers.shift()!({ value: undefined as unknown as T, done: true });
    }
  }

  [Symbol.asyncIterator](): AsyncIterator<T> {
    return {
      next: (): Promise<IteratorResult<T>> => {
        if (this.queue.length > 0) {
          return Promise.resolve({ value: this.queue.shift()!, done: false });
        }
        if (this.done) {
          return Promise.resolve({ value: undefined as unknown as T, done: true });
        }
        return new Promise<IteratorResult<T>>((resolve) => {
          this.resolvers.push(resolve);
        });
      },
    };
  }
}

export function spawnProcess(opts: SpawnOpts): SpawnedProcess {
  const mergedEnv = { ...process.env, ...opts.env };
  const child = spawn(opts.command, opts.args, {
    cwd: opts.cwd,
    env: mergedEnv,
    stdio: ['pipe', 'pipe', 'pipe'],
    detached: true,
  });

  const pgid = child.pid ?? 0;
  const emitter = new EventEmitter();
  const messageIterable = new AsyncIterableEmitter<NDJSONMessage>();
  const stderrRing = new RingBuffer();
  let lastMessageTime = Date.now();
  let inactivityTimer: ReturnType<typeof setTimeout> | undefined;
  let timeoutTimer: ReturnType<typeof setTimeout> | undefined;

  // Line parsing from stdout
  const isTextMode = opts.outputFormat === 'text';
  let stdoutBuffer = '';
  child.stdout!.on('data', (chunk: Buffer) => {
    stdoutBuffer += chunk.toString('utf8');
    const lines = stdoutBuffer.split('\n');
    stdoutBuffer = lines.pop()!;
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (isTextMode) {
        const msg: NDJSONMessage = { type: 'text', content: trimmed };
        lastMessageTime = Date.now();
        emitter.emit('message', msg);
        messageIterable.emit(msg);
      } else {
        try {
          const msg = JSON.parse(trimmed) as NDJSONMessage;
          lastMessageTime = Date.now();
          emitter.emit('message', msg);
          messageIterable.emit(msg);
        } catch {
          // skip non-JSON lines
        }
      }
    }
  });

  // stderr ring buffer
  child.stderr!.on('data', (chunk: Buffer) => {
    stderrRing.append(chunk);
  });

  // Inactivity watchdog
  function resetInactivityWatchdog(): void {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    if (!opts.semanticInactivityMs) return;
    inactivityTimer = setTimeout(() => {
      const elapsed = Date.now() - lastMessageTime;
      if (elapsed >= opts.semanticInactivityMs!) {
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

  function clearTimers(): void {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    if (timeoutTimer) clearTimeout(timeoutTimer);
  }

  function killProcess(): Promise<void> {
    clearTimers();
    return new Promise((resolve) => {
      try {
        if (pgid > 0) {
          process.kill(-pgid, 'SIGKILL');
        } else if (child.pid) {
          child.kill('SIGKILL');
        }
      } catch {
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

  async function cancel(): Promise<void> {
    clearTimers();

    // Graceful cancel: SIGTERM -> wait 5s -> SIGKILL
    try {
      if (pgid > 0) {
        process.kill(-pgid, 'SIGTERM');
      } else if (child.pid) {
        child.kill('SIGTERM');
      }
    } catch {
      // process may already be dead
      return;
    }

    await new Promise<void>((resolve) => {
      const graceTimer = setTimeout(() => {
        try {
          if (pgid > 0) {
            process.kill(-pgid, 'SIGKILL');
          } else if (child.pid) {
            child.kill('SIGKILL');
          }
        } catch {
          // ignore
        }
        resolve();
      }, CANCEL_SIGTERM_GRACE_MS);

      child.on('exit', () => {
        clearTimeout(graceTimer);
        resolve();
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

export function getStderr(child: ChildProcess): string {
  // This is a helper to retrieve stderr from a ring buffer if attached
  // In practice, users should capture stderr via the ring buffer instance
  return '';
}
