import { describe, it, expect, vi, afterEach } from 'vitest';
import { Command } from 'commander';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { registerBrainCommands } from '../src/cli/commands/brain';

function makeTempProject(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'cm-token-skill-cli-'));
}

function write(filePath: string, content: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf-8');
}

async function runCli(argv: string[]) {
  const logs: string[] = [];
  const logSpy = vi.spyOn(console, 'log').mockImplementation((msg?: unknown) => {
    logs.push(String(msg ?? ''));
  });

  const program = new Command();
  program.name('cm');
  registerBrainCommands(program);

  try {
    await program.parseAsync(argv, { from: 'user' });
  } finally {
    logSpy.mockRestore();
  }

  return logs.join('\n');
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('cm token skill', () => {
  it('prints a human-readable token report', async () => {
    const project = makeTempProject();
    try {
      write(path.join(project, 'skills', 'cm-demo', 'SKILL.md'), '# Demo\n\nCore body\n');
      write(path.join(project, 'skills', 'cm-demo', 'references', 'mode-a.md'), 'Ref body\n');

      const output = await runCli(['token', 'skill', 'cm-demo', '--project', project]);

      expect(output).toContain('Skill Token Report: cm-demo');
      expect(output).toContain('core:');
      expect(output).toContain('progressive_min:');
      expect(output).toContain('progressive_max:');
      expect(output).toContain('Reference files:');
      expect(output).toContain('mode-a.md');
    } finally {
      fs.rmSync(project, { recursive: true, force: true });
    }
  });

  it('prints stable JSON with baseline information', async () => {
    const project = makeTempProject();
    try {
      write(path.join(project, 'skills', 'cm-json', 'SKILL.md'), '# Json\n\nCore\n');
      write(path.join(project, 'skills', 'cm-json', 'references', 'ref.md'), 'Reference\n');
      write(path.join(project, 'skills', 'cm-json', 'SKILL.old.md'), '# Json Old\n\nCore\nReference\n');

      const output = await runCli([
        'token',
        'skill',
        'cm-json',
        '--project',
        project,
        '--baseline',
        'skills/cm-json/SKILL.old.md',
        '--json',
      ]);

      const parsed = JSON.parse(output) as {
        skill: string;
        references: Array<{ path: string; tokens: number }>;
        progressive_min: { tokens: number };
        progressive_max: { tokens: number };
        baseline?: {
          tokens: number;
          delta_vs_progressive_min: { tokens: number };
          delta_vs_progressive_max: { tokens: number };
        };
      };

      expect(parsed.skill).toBe('cm-json');
      expect(parsed.references).toHaveLength(1);
      expect(typeof parsed.progressive_min.tokens).toBe('number');
      expect(typeof parsed.progressive_max.tokens).toBe('number');
      expect(parsed.baseline).toBeDefined();
      expect(typeof parsed.baseline?.delta_vs_progressive_min.tokens).toBe('number');
      expect(typeof parsed.baseline?.delta_vs_progressive_max.tokens).toBe('number');
    } finally {
      fs.rmSync(project, { recursive: true, force: true });
    }
  });
});
