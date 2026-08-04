import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';

const REPO_ROOT = path.resolve(__dirname, '..');
const CLI = path.join(REPO_ROOT, 'dist', 'index.js');

describe('bench command', () => {
  const temps: string[] = [];

  afterEach(() => {
    while (temps.length) fs.rmSync(temps.pop()!, { recursive: true, force: true });
  });

  it('runs from outside the package and writes results under the caller directory', () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cm-bench-command-'));
    temps.push(projectRoot);

    const output = execFileSync(
      process.execPath,
      [CLI, 'bench', '--suite', 'workflow-integration', '--runs', '1'],
      { cwd: projectRoot, encoding: 'utf8', stdio: 'pipe' },
    );
    const reportDir = path.join(projectRoot, 'codybench', 'reports');

    expect(output).toContain('Running Workflow Integration');
    expect(fs.readdirSync(reportDir)).toHaveLength(1);
    expect(fs.existsSync(path.join(projectRoot, 'skills'))).toBe(false);
  });
});
