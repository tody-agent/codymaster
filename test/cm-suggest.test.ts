import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { suggestFromContext, gitPorcelain } from '../src/cm-suggest';
import { initSprint } from '../src/sprint-pipeline';

describe('cm-suggest', () => {
  let tmp: string;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cm-suggest-'));
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('mentions sprint skill when sprint active', () => {
    initSprint(tmp);
    const list = suggestFromContext(tmp);
    const skills = list.map((s) => s.skill);
    expect(skills).toContain('cm-brainstorm-idea');
  });

  it('gitPorcelain is empty outside a repo', () => {
    expect(gitPorcelain(tmp)).toBe('');
  });
});
