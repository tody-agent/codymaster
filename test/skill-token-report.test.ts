import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { analyzeSkillTokenFootprint } from '../src/skill-token-report';

let tempDir: string;

function write(filePath: string, content: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf-8');
}

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cm-skill-token-'));
});

afterEach(() => {
  fs.rmSync(tempDir, { recursive: true, force: true });
});

describe('analyzeSkillTokenFootprint', () => {
  it('reports a skill with only SKILL.md', () => {
    write(path.join(tempDir, 'skills', 'cm-solo', 'SKILL.md'), '# Solo\n\nAlpha\nBeta\n');

    const report = analyzeSkillTokenFootprint('cm-solo', { projectPath: tempDir });

    expect(report.skill).toBe('cm-solo');
    expect(report.references).toEqual([]);
    expect(report.progressive_min.tokens).toBe(report.core.tokens);
    expect(report.progressive_max.tokens).toBe(report.core.tokens);
    expect(report.core.lines).toBe(5);
  });

  it('includes direct reference files in progressive_max', () => {
    write(path.join(tempDir, 'skills', 'cm-split', 'SKILL.md'), '# Split\n\nCore body.\n');
    write(path.join(tempDir, 'skills', 'cm-split', 'references', 'a.md'), 'Alpha reference\n');
    write(path.join(tempDir, 'skills', 'cm-split', 'references', 'b.md'), 'Beta reference\nSecond line\n');
    write(path.join(tempDir, 'skills', 'cm-split', 'references', 'nested', 'ignored.md'), 'Ignored\n');

    const report = analyzeSkillTokenFootprint('cm-split', { projectPath: tempDir });

    expect(report.references).toHaveLength(2);
    expect(report.references.map((entry) => path.basename(entry.path))).toEqual(['a.md', 'b.md']);
    expect(report.progressive_max.tokens).toBe(
      report.core.tokens + report.references.reduce((sum, entry) => sum + entry.tokens, 0)
    );
    expect(report.progressive_max.lines).toBe(
      report.core.lines + report.references.reduce((sum, entry) => sum + entry.lines, 0)
    );
  });

  it('throws a clear error when the skill is missing', () => {
    expect(() => analyzeSkillTokenFootprint('cm-missing', { projectPath: tempDir })).toThrow(
      /Skill "cm-missing" not found/
    );
  });

  it('computes baseline deltas against min and max progressive loads', () => {
    write(path.join(tempDir, 'skills', 'cm-compare', 'SKILL.md'), '# Compare\n\nCore\n');
    write(path.join(tempDir, 'skills', 'cm-compare', 'references', 'mode-a.md'), 'Reference payload\n');
    const baselinePath = path.join(tempDir, 'skills', 'cm-compare', 'SKILL.old.md');
    write(baselinePath, '# Compare Old\n\nCore\nReference payload\n');

    const report = analyzeSkillTokenFootprint('cm-compare', {
      projectPath: tempDir,
      baselinePath: 'skills/cm-compare/SKILL.old.md',
    });

    expect(report.baseline).toBeDefined();
    expect(report.baseline?.path).toBe(baselinePath);
    expect(report.baseline?.delta_vs_progressive_min.tokens).toBe(
      report.baseline!.tokens - report.progressive_min.tokens
    );
    expect(report.baseline?.delta_vs_progressive_max.tokens).toBe(
      report.baseline!.tokens - report.progressive_max.tokens
    );
  });
});
