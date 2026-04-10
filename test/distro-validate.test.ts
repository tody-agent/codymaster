import { describe, it, expect } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { validateSkillPackDir } from '../src/distro-validate';

describe('distro-validate', () => {
  it('fails on empty directory', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cm-distro-'));
    const r = validateSkillPackDir(tmp);
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.includes('SKILL'))).toBe(true);
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('passes skill folder with SKILL.md only', () => {
    const r = validateSkillPackDir(path.join(__dirname, '..', 'skills', 'cm-design-studio'));
    expect(r.ok).toBe(true);
  });

  it('validates meta.json when present', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cm-distro-'));
    fs.writeFileSync(path.join(tmp, 'SKILL.md'), '# x\n', 'utf8');
    fs.writeFileSync(path.join(tmp, 'meta.json'), '{}', 'utf8');
    const r = validateSkillPackDir(tmp);
    expect(r.ok).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
    fs.rmSync(tmp, { recursive: true, force: true });
  });
});
