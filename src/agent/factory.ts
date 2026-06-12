import type { AgentBackend } from './backend';
import { ClaudeBackend } from './claude';
import { CodexBackend } from './codex';
import { CursorBackend } from './cursor';
import { GeminiBackend } from './gemini';
import { CopilotBackend } from './copilot';
import { AntigravityBackend } from './antigravity';
import { OpenCodeBackend } from './opencode';

const backends: Record<string, () => AgentBackend> = {
  'claude-code': () => new ClaudeBackend(),
  'codex': () => new CodexBackend(),
  'cursor': () => new CursorBackend(),
  'gemini': () => new GeminiBackend(),
  'copilot': () => new CopilotBackend(),
  'antigravity': () => new AntigravityBackend(),
  'opencode': () => new OpenCodeBackend(),
};

export function getBackend(name: string): AgentBackend {
  const factory = backends[name];
  if (!factory) {
    throw new Error(`Unknown agent backend: ${name}. Available: ${Object.keys(backends).join(', ')}`);
  }
  return factory();
}

export function listBackends(): string[] {
  return Object.keys(backends);
}
