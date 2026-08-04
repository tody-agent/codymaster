export interface ExecOptions {
  cwd: string;
  model?: string;
  systemPrompt?: string;
  maxTurns?: number;
  timeoutMs?: number;
  semanticInactivityMs?: number;
  resumeSessionId?: string;
  customArgs?: string[];
  customEnv?: Record<string, string>;
  mcpConfig?: unknown;
}

export interface AgentSession {
  messages: AsyncIterable<AgentMessage>;
  result: Promise<AgentResult>;
  cancel(reason?: string): Promise<void>;
}

export interface AgentBackendCapabilities {
  isolatedSessions: boolean;
  resumableSessions: boolean;
}

export type AgentMessage =
  | { type: 'text';        content: string;   sessionId?: string }
  | { type: 'thinking';    content: string }
  | { type: 'tool-use';    tool: string; callId: string; input: unknown; attempt: number; parentCallId?: string }
  | { type: 'tool-result'; callId: string; output: string; isError?: boolean }
  | { type: 'status';      status: string }
  | { type: 'log';         level: 'debug' | 'info' | 'warn' | 'error'; content: string }
  | { type: 'error';       content: string };

export type AgentResultStatus =
  'completed' | 'failed' | 'cancelled' | 'timeout' | 'aborted';

export interface AgentResult {
  status: AgentResultStatus;
  output: string;
  error?: string;
  failureReason?: FailureReason;
  durationMs: number;
  sessionId?: string;
  usage?: Record<string, TokenUsage>;
}

export interface TokenUsage {
  input: number;
  output: number;
  cacheRead?: number;
  cacheWrite?: number;
}

export type FailureReason =
  | 'agent_crash' | 'timeout' | 'cancelled_by_user'
  | 'prompt_too_large' | 'tool_loop' | 'policy_violation'
  | 'auth' | 'unknown';

export interface AgentBackend {
  name: string;
  capabilities?: AgentBackendCapabilities;
  detectVersion(): Promise<string>;
  execute(prompt: string, opts: ExecOptions): Promise<AgentSession>;
}
