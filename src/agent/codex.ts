import { spawnProcess, type NDJSONMessage } from './spawn-helper';
import type {
  AgentBackend,
  AgentSession,
  AgentMessage,
  AgentResult,
  AgentResultStatus,
  ExecOptions,
} from './backend';

class AgentMessageTransformer {
  private output: string[] = [];

  transform(msg: NDJSONMessage): AgentMessage[] {
    const t = msg.type as string;

    if (t === 'message' || t === 'text' || t === 'assistant') {
      const content = (msg.content as string) ?? (msg.text as string) ?? '';
      if (content) {
        this.output.push(content);
        return [{ type: 'text', content }];
      }
    }

    if (t === 'thinking') {
      return [{ type: 'thinking', content: (msg.content as string) ?? '' }];
    }

    if (t === 'tool_use' || t === 'tool-use') {
      return [
        {
          type: 'tool-use',
          tool: (msg.tool as string) ?? (msg.name as string) ?? 'unknown',
          callId: (msg.callId as string) ?? (msg.id as string) ?? '',
          input: msg.input ?? msg.arguments ?? {},
          attempt: (msg.attempt as number) ?? 1,
          parentCallId: msg.parentCallId as string | undefined,
        },
      ];
    }

    if (t === 'tool_result' || t === 'tool-result') {
      return [
        {
          type: 'tool-result',
          callId: (msg.callId as string) ?? (msg.id as string) ?? '',
          output: (msg.output as string) ?? (msg.content as string) ?? '',
          isError: (msg.isError as boolean) ?? false,
        },
      ];
    }

    if (t === 'status') {
      return [{ type: 'status', status: (msg.status as string) ?? '' }];
    }

    if (t === 'log') {
      return [
        {
          type: 'log',
          level: (msg.level as 'debug' | 'info' | 'warn' | 'error') ?? 'info',
          content: (msg.content as string) ?? '',
        },
      ];
    }

    if (t === 'error') {
      return [{ type: 'error', content: (msg.content as string) ?? (msg.message as string) ?? '' }];
    }

    // Unknown message types are surfaced as status
    return [{ type: 'status', status: JSON.stringify(msg) }];
  }

  getOutput(): string {
    return this.output.join('');
  }
}

async function* transformMessages(
  raw: AsyncIterable<NDJSONMessage>,
  transformer: AgentMessageTransformer,
): AsyncIterable<AgentMessage> {
  for await (const msg of raw) {
    for (const agentMsg of transformer.transform(msg)) {
      yield agentMsg;
    }
  }
}

function collectResult(
  proc: { child: { on: (event: string, cb: (...args: unknown[]) => void) => void }; cancel(): Promise<void> },
  transformer: AgentMessageTransformer,
  startTime: number,
): Promise<AgentResult> {
  return new Promise<AgentResult>((resolve) => {
    proc.child.on('exit', (code: unknown, signal: unknown) => {
      const exitCode = typeof code === 'number' ? code : null;
      const durationMs = Date.now() - startTime;

      let status: AgentResultStatus = 'completed';
      let failureReason: AgentResult['failureReason'];

      if (signal === 'SIGTERM' || signal === 'SIGKILL') {
        status = 'cancelled';
        failureReason = 'cancelled_by_user';
      } else if (exitCode !== null && exitCode !== 0) {
        status = 'failed';
        failureReason = 'agent_crash';
      }

      resolve({
        status,
        output: transformer.getOutput(),
        durationMs,
        failureReason,
      });
    });

    proc.child.on('error', (err: unknown) => {
      const durationMs = Date.now() - startTime;
      resolve({
        status: 'failed',
        output: transformer.getOutput(),
        error: err instanceof Error ? err.message : String(err),
        failureReason: 'agent_crash',
        durationMs,
      });
    });
  });
}

export class CodexBackend implements AgentBackend {
  name = 'codex';

  async detectVersion(): Promise<string> {
    const proc = spawnProcess({
      command: 'codex',
      args: ['--version'],
      cwd: process.cwd(),
      timeoutMs: 10_000,
    });

    return new Promise<string>((resolve, reject) => {
      let stdout = '';
      proc.child.stdout?.on('data', (chunk: Buffer) => {
        stdout += chunk.toString('utf8');
      });
      proc.child.on('exit', () => {
        resolve(stdout.trim() || 'unknown');
      });
      proc.child.on('error', (err: Error) => {
        reject(new Error(`codex --version failed: ${err.message}`));
      });
    });
  }

  async execute(prompt: string, opts: ExecOptions): Promise<AgentSession> {
    const args = ['--full-auto'];

    if (opts.model) args.push('--model', opts.model);
    if (opts.customArgs) args.push(...opts.customArgs);

    args.push(prompt);

    const proc = spawnProcess({
      command: 'codex',
      args,
      cwd: opts.cwd,
      env: opts.customEnv,
      timeoutMs: opts.timeoutMs,
      semanticInactivityMs: opts.semanticInactivityMs,
    });

    const transformer = new AgentMessageTransformer();
    const startTime = Date.now();

    return {
      messages: transformMessages(proc.messages, transformer),
      result: collectResult(proc, transformer, startTime),
      cancel: () => proc.cancel(),
    };
  }
}
