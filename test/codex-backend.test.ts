import { describe, it, expect } from 'vitest';
import { buildCodexArgs, buildCodexPrompt } from '../src/agent/codex';
import type { ExecOptions } from '../src/agent/backend';

function makeOpts(overrides: Partial<ExecOptions> = {}): ExecOptions {
  return {
    cwd: '/tmp/project',
    ...overrides,
  };
}

describe('Codex backend CLI shaping', () => {
  it('builds non-resume args with codex exec and json output', () => {
    const args = buildCodexArgs('Fix the bug', makeOpts({ model: 'gpt-5.5' }));
    expect(args.slice(0, 4)).toEqual(['exec', '--json', '--skip-git-repo-check', '--model']);
    expect(args).toContain('gpt-5.5');
    expect(args.at(-1)).toBe('Fix the bug');
  });

  it('builds resume args using exec resume subcommand', () => {
    const args = buildCodexArgs('Continue', makeOpts({ resumeSessionId: 'thread-123' }));
    expect(args.slice(0, 4)).toEqual(['exec', 'resume', '--json', '--skip-git-repo-check']);
    expect(args).toContain('thread-123');
    expect(args.at(-1)).toBe('Continue');
  });

  it('wraps system prompt into the prompt body', () => {
    const prompt = buildCodexPrompt('Implement feature', makeOpts({
      systemPrompt: 'Be concise and verify changes.',
    }));
    expect(prompt).toContain('<system_prompt>');
    expect(prompt).toContain('Be concise and verify changes.');
    expect(prompt).toContain('Implement feature');
  });
});
