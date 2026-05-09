import { describe, it, expect } from 'vitest';
import {
  compressGitStatus,
  compressNpmTest,
  collapseRepeatedLines,
  summarizeBuildLog,
  compressFor,
} from '../src/utils/output-compress';

describe('compressGitStatus', () => {
  it('keeps only changed entries and a count', () => {
    const input = [
      'On branch main',
      "Your branch is up to date with 'origin/main'.",
      '',
      'Changes not staged for commit:',
      '  (use "git add <file>..." to update what will be committed)',
      ' M src/foo.ts',
      ' M src/bar.ts',
      '?? new-file.ts',
      '',
    ].join('\n');
    const out = compressGitStatus(input);
    expect(out).toContain('On branch main');
    expect(out).toContain('M src/foo.ts');
    expect(out).toContain('M src/bar.ts');
    expect(out).toContain('?? new-file.ts');
    expect(out).toContain('(3 changed)');
    expect(out).not.toContain('Your branch is up to date');
    expect(out).not.toContain('use "git add');
  });

  it('reports clean tree', () => {
    expect(compressGitStatus('On branch main\nnothing to commit, working tree clean\n')).toContain(
      '(clean)',
    );
  });
});

describe('compressNpmTest', () => {
  it('keeps failing assertions and summary, drops passing logs', () => {
    const input = [
      'PASS  test/a.test.ts',
      'PASS  test/b.test.ts',
      'FAIL  test/c.test.ts',
      '  ✗ does the thing',
      '    AssertionError: expected 1 to equal 2',
      '    at Object.<anonymous> (/x/c.test.ts:10:5)',
      '',
      'Tests: 1 failed, 2 passed',
      'Test Files 1 failed | 2 passed',
    ].join('\n');
    const out = compressNpmTest(input);
    expect(out).toContain('FAIL  test/c.test.ts');
    expect(out).toContain('AssertionError');
    expect(out).toContain('Tests: 1 failed, 2 passed');
    expect(out).not.toContain('PASS  test/a.test.ts');
  });

  it('reports no failures when nothing matches', () => {
    expect(compressNpmTest('all good')).toContain('no failures');
  });
});

describe('collapseRepeatedLines', () => {
  it('collapses runs >= threshold', () => {
    const input = ['a', 'a', 'a', 'a', 'b', 'b', 'c'].join('\n');
    const out = collapseRepeatedLines(input, 3);
    expect(out).toContain('a  … (× 4)');
    expect(out).toContain('b\nb');
    expect(out).toContain('c');
  });

  it('leaves short runs alone', () => {
    expect(collapseRepeatedLines('x\nx\ny', 3)).toBe('x\nx\ny');
  });
});

describe('summarizeBuildLog', () => {
  it('keeps errors/warnings/status, drops noise', () => {
    const input = [
      'Compiling…',
      'Building bundle',
      'src/x.ts: warning TS6133: unused',
      'error TS2322: type mismatch',
      'Done in 4.21s',
    ].join('\n');
    const out = summarizeBuildLog(input);
    expect(out).toContain('warning');
    expect(out).toContain('error');
    expect(out).toContain('Done in');
    expect(out).not.toContain('Compiling…');
  });
});

describe('compressFor', () => {
  it('routes git status', () => {
    expect(compressFor('git status', 'On branch main\n M f.ts\n')).toContain('(1 changed)');
  });
  it('routes npm test', () => {
    expect(compressFor('npm test', 'FAIL  x\n  ✗ y\n')).toContain('FAIL  x');
  });
  it('falls back to collapse for unknown commands', () => {
    expect(compressFor('echo hi', 'q\nq\nq\nq\n')).toContain('× 4');
  });
});
