import { type ChildProcess } from 'child_process';
import { spawnProcess } from './spawn-helper';
import type {
  AgentBackend,
  AgentSession,
  AgentMessage,
  AgentResult,
  AgentResultStatus,
  ExecOptions,
} from './backend';

const NAME = 'cursor';

function transformStdoutLines(
  child: ChildProcess,
  emit: (msg: AgentMessage) => void,
): Promise<void> {
  return new Promise<void>((resolve) => {
    let buffer = '';

    child.stdout?.on('data', (chunk: Buffer) => {
      buffer += chunk.toString('utf8');
      const lines = buffer.split('\n');
      buffer = lines.pop()!;
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed) {
          emit({ type: 'text', content: trimmed });
        }
      }
    });

    child.stderr?.on('data', (chunk: Buffer) => {
      const text = chunk.toString('utf8').trim();
      if (text) {
        emit({ type: 'log', level: 'warn', content: text });
      }
    });

    child.stdout?.on('end', () => {
      if (buffer.trim()) {
        emit({ type: 'text', content: buffer.trim() });
      }
      resolve();
    });

    child.on('error', () => resolve());
    child.on('exit', () => resolve());
  });
}

class AsyncMessageEmitter implements AsyncIterable<AgentMessage> {
  private queue: AgentMessage[] = [];
  private resolvers: Array<(value: IteratorResult<AgentMessage>) => void> = [];
  private done = false;

  emit(value: AgentMessage): void {
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
      this.resolvers.shift()!({ value: undefined as unknown as AgentMessage, done: true });
    }
  }

  [Symbol.asyncIterator](): AsyncIterator<AgentMessage> {
    return {
      next: (): Promise<IteratorResult<AgentMessage>> => {
        if (this.queue.length > 0) {
          return Promise.resolve({ value: this.queue.shift()!, done: false });
        }
        if (this.done) {
          return Promise.resolve({ value: undefined as unknown as AgentMessage, done: true });
        }
        return new Promise<IteratorResult<AgentMessage>>((resolve) => {
          this.resolvers.push(resolve);
        });
      },
    };
  }
}

export class CursorBackend implements AgentBackend {
  name = NAME;

  async detectVersion(): Promise<string> {
    const { spawn } = await import('child_process');
    return new Promise<string>((resolve, reject) => {
      const child = spawn('cursor', ['--version'], {
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let stdout = '';
      child.stdout?.on('data', (chunk: Buffer) => {
        stdout += chunk.toString('utf8');
      });
      child.on('close', (code: number | null) => {
        if (code === 0) {
          resolve(stdout.trim());
        } else {
          reject(new Error(`cursor --version exited with code ${code}`));
        }
      });
      child.on('error', (err: Error) => {
        reject(new Error(`Failed to run cursor: ${err.message}`));
      });
    });
  }

  async execute(prompt: string, opts: ExecOptions): Promise<AgentSession> {
    const args: string[] = ['chat'];

    if (opts.model) {
      args.push('--model', opts.model);
    }
    if (opts.customArgs) {
      args.push(...opts.customArgs);
    }

    args.push(prompt);

    const proc = spawnProcess({
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

    const resultPromise = drainPromise.then<AgentResult>(() => {
      return new Promise<AgentResult>((resolve) => {
        proc.child.on('exit', (code: number | null, signal: string | null) => {
          const durationMs = Date.now() - startTime;
          let status: AgentResultStatus = 'completed';
          let error: string | undefined;

          if (signal === 'SIGTERM' || signal === 'SIGKILL') {
            status = 'cancelled';
          } else if (code !== null && code !== 0) {
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

        proc.child.on('error', (err: Error) => {
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
  }
}
