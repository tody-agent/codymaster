import { describe, it, expect, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';

const REPO_ROOT = path.resolve(__dirname, '..');
const SCRIPT = path.join(REPO_ROOT, 'scripts', 'build-skills.mjs');

function writeFile(filePath: string, content: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function makeTempRepo(): string {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cm-build-skills-'));
  fs.mkdirSync(path.join(tmp, 'scripts'), { recursive: true });
  fs.copyFileSync(SCRIPT, path.join(tmp, 'scripts', 'build-skills.mjs'));
  return tmp;
}

describe('build-skills sync guard', () => {
  const temps: string[] = [];

  afterEach(() => {
    while (temps.length) {
      fs.rmSync(temps.pop()!, { recursive: true, force: true });
    }
  });

  it('aborts platform sync when frontmatter.name does not match folder name', () => {
    const tmp = makeTempRepo();
    temps.push(tmp);

    writeFile(
      path.join(tmp, 'skills', 'cm-good', 'SKILL.md'),
      '---\nname: cm-good\ndescription: "ok"\n---\n\n# Good\n'
    );
    writeFile(
      path.join(tmp, 'skills', 'cm-bad', 'SKILL.md'),
      '---\nname: cm-continuity\ndescription: "wrong identity"\n---\n\n# Wrong\n'
    );

    expect(() => {
      execFileSync(process.execPath, ['scripts/build-skills.mjs', '--platforms', 'codex'], {
        cwd: tmp,
        encoding: 'utf8',
        stdio: 'pipe',
      });
    }).toThrowError(/frontmatter\.name='cm-continuity'/);
  });

  it('allows sync when frontmatter.name matches folder name', () => {
    const tmp = makeTempRepo();
    temps.push(tmp);

    writeFile(
      path.join(tmp, 'skills', 'cm-ux-master', 'SKILL.md'),
      '---\nname: cm-ux-master\ndescription: "restored"\n---\n\n# UX Master\n'
    );

    expect(() => {
      execFileSync(process.execPath, ['scripts/build-skills.mjs', '--platforms', 'codex'], {
        cwd: tmp,
        encoding: 'utf8',
        stdio: 'pipe',
      });
    }).not.toThrow();

    const mirrored = path.join(tmp, '.codex', 'skills', 'cm-ux-master', 'SKILL.md');
    expect(fs.existsSync(mirrored)).toBe(true);
    expect(fs.readFileSync(mirrored, 'utf8')).toContain('name: cm-ux-master');
  });

  it('syncs one shared asset without rewriting platform skills', () => {
    const tmp = makeTempRepo();
    temps.push(tmp);

    writeFile(
      path.join(tmp, 'skills', '_shared', 'autonomy-policy.md'),
      '# Canonical autonomy policy\n'
    );
    writeFile(
      path.join(tmp, 'skills', 'cm-existing', 'SKILL.md'),
      '---\nname: cm-existing\ndescription: "canonical"\n---\n\n# Canonical\n'
    );
    writeFile(
      path.join(tmp, '.codex', 'skills', 'cm-existing', 'SKILL.md'),
      '# Keep this platform-specific file\n'
    );

    execFileSync(
      process.execPath,
      ['scripts/build-skills.mjs', '--platforms', 'codex', '--shared-only', 'autonomy-policy.md'],
      { cwd: tmp, encoding: 'utf8', stdio: 'pipe' },
    );

    expect(fs.readFileSync(
      path.join(tmp, '.codex', 'skills', '_shared', 'autonomy-policy.md'),
      'utf8',
    )).toBe('# Canonical autonomy policy\n');
    expect(fs.readFileSync(
      path.join(tmp, '.codex', 'skills', 'cm-existing', 'SKILL.md'),
      'utf8',
    )).toBe('# Keep this platform-specific file\n');
  });
});
