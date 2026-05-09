import { execFileSync, spawn } from 'child_process';
import type {
  AgentBackend,
  AgentSession,
  AgentMessage,
  AgentResult,
  AgentResultStatus,
  ExecOptions,
} from './backend';

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

function spawnTextProcess(opts: {
  command: string;
  args: string[];
  cwd: string;
  env?: Record<string, string>;
  timeoutMs?: number;
}): { messages: AsyncIterable<AgentMessage>; cancel(): Promise<void> } {
  const mergedEnv = { ...process.env, ...opts.env };
  const child = spawn(opts.command, opts.args, {
    cwd: opts.cwd,
    env: mergedEnv,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  const emitter = new AsyncIterableEmitter<AgentMessage>();
  let timeoutTimer: ReturnType<typeof setTimeout> | undefined;

  if (opts.timeoutMs) {
    timeoutTimer = setTimeout(() => {
      child.kill('SIGKILL');
    }, opts.timeoutMs);
  }

  let stdoutBuffer = '';
  child.stdout!.on('data', (chunk: Buffer) => {
    stdoutBuffer += chunk.toString('utf8');
    const lines = stdoutBuffer.split('\n');
    stdoutBuffer = lines.pop()!;
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed) {
        emitter.emit({ type: 'text', content: trimmed });
      }
    }
  });

  child.on('exit', () => {
    if (timeoutTimer) clearTimeout(timeoutTimer);
    if (stdoutBuffer.trim()) {
      emitter.emit({ type: 'text', content: stdoutBuffer.trim() });
    }
    emitter.close();
  });

  child.on('error', () => {
    if (timeoutTimer) clearTimeout(timeoutTimer);
    emitter.close();
  });

  return {
    messages: emitter,
    cancel: async () => {
      if (timeoutTimer) clearTimeout(timeoutTimer);
      try {
        child.kill('SIGTERM');
        await new Promise<void>((resolve) => {
          const grace = setTimeout(() => {
            child.kill('SIGKILL');
            resolve();
          }, 5_000);
          child.on('exit', () => {
            clearTimeout(grace);
            resolve();
          });
        });
      } catch {
        // already dead
      }
    },
  };
}

function collectResult(proc: {
  messages: AsyncIterable<AgentMessage>;
  cancel(): Promise<void>;
}): Promise<AgentResult> {
  const start = Date.now();

  return new Promise<AgentResult>((resolve) => {
    let output = '';
    let lastError: string | undefined;
    let status: AgentResultStatus = 'completed';

    (async () => {
      try {
        for await (const msg of proc.messages) {
          if (msg.type === 'text') {
            output += msg.content + '\n';
          }
        }
      } catch (err) {
        status = 'failed';
        lastError = err instanceof Error ? err.message : String(err);
      }

      resolve({
        status,
        output: output.trim(),
        error: lastError,
        durationMs: Date.now() - start,
      });
    })();
  });
}

export class OpenCodeBackend implements AgentBackend {
  name = 'opencode';

  async detectVersion(): Promise<string> {
    try {
      return execFileSync('opencode', ['--version'], {
        encoding: 'utf8',
        timeout: 10_000,
      }).trim();
    } catch {
      return 'unknown';
    }
  }

  async execute(prompt: string, opts: ExecOptions): Promise<AgentSession> {
    const args = ['run'];

    if (opts.model) args.push('--model', opts.model);
    if (opts.customArgs) args.push(...opts.customArgs);

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
  }
}
