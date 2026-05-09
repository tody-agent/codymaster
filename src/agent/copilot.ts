import { spawn } from 'child_process';
import { execFileSync } from 'child_process';
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

interface TextProcess {
  child: import('child_process').ChildProcess;
  messages: AsyncIterable<AgentMessage>;
  cancel(): Promise<void>;
}

function spawnTextProcess(opts: {
  command: string;
  args: string[];
  cwd: string;
  env?: Record<string, string>;
  timeoutMs?: number;
  semanticInactivityMs?: number;
}): TextProcess {
  const mergedEnv = { ...process.env, ...opts.env };
  const child = spawn(opts.command, opts.args, {
    cwd: opts.cwd,
    env: mergedEnv,
    stdio: ['pipe', 'pipe', 'pipe'],
    detached: true,
  });

  const pgid = child.pid ?? 0;
  const emitter = new AsyncIterableEmitter<AgentMessage>();
  const stderrLines: string[] = [];
  let lastMessageTime = Date.now();
  let inactivityTimer: ReturnType<typeof setTimeout> | undefined;
  let timeoutTimer: ReturnType<typeof setTimeout> | undefined;

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

  if (opts.timeoutMs) {
    timeoutTimer = setTimeout(() => {
      killProcess();
    }, opts.timeoutMs);
  }

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

  resetInactivityWatchdog();

  // stdout: emit each line as a text message
  let stdoutBuffer = '';
  child.stdout!.on('data', (chunk: Buffer) => {
    stdoutBuffer += chunk.toString('utf8');
    const lines = stdoutBuffer.split('\n');
    stdoutBuffer = lines.pop()!;
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      lastMessageTime = Date.now();
      emitter.emit({ type: 'text', content: trimmed });
    }
  });

  // stderr: collect lines
  let stderrBuffer = '';
  child.stderr!.on('data', (chunk: Buffer) => {
    stderrBuffer += chunk.toString('utf8');
    const lines = stderrBuffer.split('\n');
    stderrBuffer = lines.pop()!;
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed) stderrLines.push(trimmed);
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

  async function cancel(): Promise<void> {
    clearTimers();
    try {
      if (pgid > 0) {
        process.kill(-pgid, 'SIGTERM');
      } else if (child.pid) {
        child.kill('SIGTERM');
      }
    } catch {
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
      }, 5_000);

      child.on('exit', () => {
        clearTimeout(graceTimer);
        resolve();
      });
    });
  }

  return { child, messages: emitter, cancel };
}

function collectResult(proc: TextProcess): Promise<AgentResult> {
  const start = Date.now();

  return new Promise<AgentResult>((resolve) => {
    let resultText = '';
    let status: AgentResultStatus = 'completed';
    let errorText: string | undefined;
    const stderrLines: string[] = [];

    proc.child.stderr!.on('data', (chunk: Buffer) => {
      stderrLines.push(chunk.toString('utf8'));
    });

    (async () => {
      try {
        for await (const msg of proc.messages) {
          if (msg.type === 'text') {
            resultText += (resultText ? '\n' : '') + msg.content;
          } else if (msg.type === 'error') {
            status = 'failed';
            errorText = msg.content;
          }
        }
      } catch (err) {
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
    })();
  });
}

export class CopilotBackend implements AgentBackend {
  name = 'copilot';

  async detectVersion(): Promise<string> {
    try {
      return execFileSync('copilot', ['--version'], {
        encoding: 'utf8',
        timeout: 10_000,
      }).trim();
    } catch {
      return 'unknown';
    }
  }

  async execute(prompt: string, opts: ExecOptions): Promise<AgentSession> {
    const args = ['-p', prompt];

    if (opts.model) args.push('--model', opts.model);
    if (opts.customArgs) args.push(...opts.customArgs);

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
  }
}
