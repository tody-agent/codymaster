import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { buildSkillsLock, writeSkillsLock, verifySkillsLock } from '../src/skills-lock';

function tmpRoot(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'cm-lock-'));
}

function makeSkill(root: string, name: string, body: string) {
  const dir = path.join(root, 'skills', name);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'SKILL.md'), body, 'utf8');
}

describe('skills-lock', () => {
  let root: string;
  beforeEach(() => { root = tmpRoot(); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  it('builds lock with sha256 per skill', () => {
    makeSkill(root, 'cm-foo', '---\nname: cm-foo\nversion: 1.0.0\n---\n# Foo\n');
    makeSkill(root, 'cm-bar', '---\nname: cm-bar\n---\n# Bar\n');
    const lock = buildSkillsLock(root);
    expect(lock.version).toBe(2);
    expect(lock.skills['cm-foo'].sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(lock.skills['cm-foo'].version).toBe('1.0.0');
    expect(lock.skills['cm-bar'].sha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it('records deprecated flag', () => {
    makeSkill(root, 'cm-old', '---\nname: cm-old\ndeprecated: true\n---\nstub\n');
    const lock = buildSkillsLock(root);
    expect(lock.skills['cm-old'].deprecated).toBe(true);
  });

  it('verify reports drift on hash change', () => {
    makeSkill(root, 'cm-foo', '---\nname: cm-foo\n---\noriginal\n');
    writeSkillsLock(root);
    fs.writeFileSync(path.join(root, 'skills', 'cm-foo', 'SKILL.md'), '---\nname: cm-foo\n---\nMODIFIED\n');
    const v = verifySkillsLock(root);
    expect(v.ok).toBe(false);
    expect(v.drifted).toContain('cm-foo');
  });

  it('verify reports unlocked skills', () => {
    makeSkill(root, 'cm-foo', '---\nname: cm-foo\n---\nbody\n');
    writeSkillsLock(root);
    makeSkill(root, 'cm-new', '---\nname: cm-new\n---\nbody\n');
    const v = verifySkillsLock(root);
    expect(v.unlocked).toContain('cm-new');
  });

  it('verify is ok after rebuild', () => {
    makeSkill(root, 'cm-foo', '---\nname: cm-foo\n---\nbody\n');
    writeSkillsLock(root);
    const v = verifySkillsLock(root);
    expect(v.ok).toBe(true);
  });
});
