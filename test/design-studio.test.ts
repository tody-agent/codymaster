import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { initDesignStudioArtifacts } from '../src/cli/commands/design-studio';

describe('design-studio', () => {
  let tmp: string;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cm-ds-'));
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('init creates four markdown files', () => {
    const { created, skipped } = initDesignStudioArtifacts(tmp);
    expect(created).toBe(4);
    expect(skipped).toBe(0);
    const handoff = path.join(tmp, '.cm', 'design-studio', 'HANDOFF.md');
    expect(fs.readFileSync(handoff, 'utf8')).toContain('Chosen variant');
  });

  it('second init skips existing', () => {
    initDesignStudioArtifacts(tmp);
    const { created, skipped } = initDesignStudioArtifacts(tmp);
    expect(created).toBe(0);
    expect(skipped).toBe(4);
  });
});
