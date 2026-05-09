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

interface ClaudeAssistantContent {
  type: 'text' | 'tool_use';
  text?: string;
  id?: string;
  name?: string;
  input?: unknown;
}

interface ClaudeAssistantMessage {
  type: 'assistant';
  message: { content: ClaudeAssistantContent[] };
  session_id?: string;
}

interface ClaudeToolResultMessage {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
  is_error: boolean;
}

interface ClaudeResultMessage {
  type: 'result';
  result: string;
  session_id?: string;
  is_error?: boolean;
  duration_ms?: number;
  usage?: Record<string, { input_tokens: number; output_tokens: number }>;
}

type ClaudeNDJSON = ClaudeAssistantMessage | ClaudeToolResultMessage | ClaudeResultMessage;

async function* asyncTransform(
  raw: AsyncIterable<NDJSONMessage>,
): AsyncGenerator<AgentMessage> {
  for await (const msg of raw) {
    const nd = msg as unknown as ClaudeNDJSON;

    if (nd.type === 'assistant') {
      const assistant = nd as ClaudeAssistantMessage;
      const sessionId = assistant.session_id;
      for (const block of assistant.message.content) {
        if (block.type === 'text' && block.text) {
          yield { type: 'text', content: block.text, sessionId };
        } else if (block.type === 'tool_use' && block.id && block.name) {
          yield {
            type: 'tool-use',
            tool: block.name,
            callId: block.id,
            input: block.input ?? {},
            attempt: 1,
          };
        }
      }
    } else if (nd.type === 'tool_result') {
      const tr = nd as ClaudeToolResultMessage;
      yield {
        type: 'tool-result',
        callId: tr.tool_use_id,
        output: tr.content ?? '',
        isError: tr.is_error ?? false,
      };
    }
  }
}

function collectResult(proc: {
  messages: AsyncIterable<NDJSONMessage>;
  cancel(): Promise<void>;
}): Promise<AgentResult> {
  const start = Date.now();

  return new Promise<AgentResult>((resolve) => {
    let lastSessionId: string | undefined;
    let lastResult = '';
    let lastError: string | undefined;
    let status: AgentResultStatus = 'completed';
    let usage: Record<string, { input: number; output: number }> | undefined;

    (async () => {
      try {
        for await (const msg of proc.messages) {
          const nd = msg as unknown as ClaudeNDJSON;

          if (nd.type === 'assistant') {
            const a = nd as ClaudeAssistantMessage;
            if (a.session_id) lastSessionId = a.session_id;
          } else if (nd.type === 'result') {
            const r = nd as ClaudeResultMessage;
            lastResult = r.result ?? '';
            if (r.session_id) lastSessionId = r.session_id;
            if (r.is_error) {
              status = 'failed';
              lastError = r.result;
            }
            if (r.usage) {
              usage = {};
              for (const [model, u] of Object.entries(r.usage)) {
                usage[model] = { input: u.input_tokens, output: u.output_tokens };
              }
            }
          }
        }
      } catch (err) {
        status = 'failed';
        lastError = err instanceof Error ? err.message : String(err);
      }

      resolve({
        status,
        output: lastResult,
        error: lastError,
        durationMs: Date.now() - start,
        sessionId: lastSessionId,
        usage,
      });
    })();
  });
}

export class ClaudeBackend implements AgentBackend {
  name = 'claude-code';

  async detectVersion(): Promise<string> {
    try {
      return execFileSync('claude', ['--version'], {
        encoding: 'utf8',
        timeout: 10_000,
      }).trim();
    } catch {
      return 'unknown';
    }
  }

  async execute(prompt: string, opts: ExecOptions): Promise<AgentSession> {
    const args = ['--print', '--output-format', 'stream-json'];

    if (opts.model) args.push('--model', opts.model);
    if (opts.maxTurns) args.push('--max-turns', String(opts.maxTurns));
    if (opts.systemPrompt) args.push('--system-prompt', opts.systemPrompt);
    if (opts.resumeSessionId) args.push('--resume', opts.resumeSessionId);
    if (opts.customArgs) args.push(...opts.customArgs);

    args.push(prompt);

    const proc = spawnProcess({
      command: 'claude',
      args,
      cwd: opts.cwd,
      env: opts.customEnv,
      timeoutMs: opts.timeoutMs,
      semanticInactivityMs: opts.semanticInactivityMs,
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
