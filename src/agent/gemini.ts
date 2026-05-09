import { execFileSync } from 'child_process';
import { spawnProcess, type NDJSONMessage } from './spawn-helper';
import type {
  AgentBackend,
  AgentSession,
  AgentMessage,
  AgentResult,
  AgentResultStatus,
  ExecOptions,
} from './backend';

async function* asyncTransform(
  raw: AsyncIterable<NDJSONMessage>,
): AsyncGenerator<AgentMessage> {
  for await (const msg of raw) {
    const text = (msg as unknown as { content?: string }).content;
    if (typeof text === 'string' && text.length > 0) {
      yield { type: 'text', content: text };
    }
  }
}

function collectResult(proc: {
  messages: AsyncIterable<NDJSONMessage>;
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
          const text = (msg as unknown as { content?: string }).content;
          if (typeof text === 'string' && text.length > 0) {
            output += text + '\n';
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

export class GeminiBackend implements AgentBackend {
  name = 'gemini';

  async detectVersion(): Promise<string> {
    try {
      return execFileSync('gemini', ['--version'], {
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

    const proc = spawnProcess({
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
  }
}
