import { describe, it, expect, vi, beforeEach } from 'vitest';
import { findTestFile, suggestTestFile, hasTestFile, runTests } from '../src/execution/tdd-gate';

// Mock fs module
vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs');
  return {
    ...actual,
    existsSync: vi.fn(),
  };
});


import fs from 'fs';
import child_process from 'child_process';

vi.mock('child_process', async () => {
  const actual = await vi.importActual<typeof import('child_process')>('child_process');
  return {
    ...actual,
    default: {
      ...actual,
      execFileSync: vi.fn()
    },
    execFileSync: vi.fn()
  };
});

describe('TDD Gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findTestFile', () => {
    it('maps src/foo.ts to test/foo.test.ts', () => {
      vi.spyOn(fs, 'existsSync').mockImplementation((path: string) => path === 'test/foo.test.ts');
      expect(findTestFile('src/foo.ts')).toBe('test/foo.test.ts');
    });

    it('maps src/bar/baz.ts to test/bar/baz.test.ts', () => {
      vi.spyOn(fs, 'existsSync').mockImplementation((path: string) => path === 'test/bar/baz.test.ts');
      expect(findTestFile('src/bar/baz.ts')).toBe('test/bar/baz.test.ts');
    });

    it('returns null when test file does not exist', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);
      expect(findTestFile('src/nonexistent.ts')).toBeNull();
    });
  });

  describe('suggestTestFile', () => {
    it('suggests test/foo.test.ts for src/foo.ts', () => {
      expect(suggestTestFile('src/foo.ts')).toBe('test/foo.test.ts');
    });

    it('suggests test/bar/baz.test.ts for src/bar/baz.ts', () => {
      expect(suggestTestFile('src/bar/baz.ts')).toBe('test/bar/baz.test.ts');
    });

    it('suggests test/foo.test.js for src/foo.js', () => {
      expect(suggestTestFile('src/foo.js')).toBe('test/foo.test.js');
    });
  });

  describe('hasTestFile', () => {
    it('returns true when all source files have test files', () => {
      vi.spyOn(fs, 'existsSync').mockImplementation((path: string) => path.includes('.test.'));
      expect(hasTestFile(['src/foo.ts', 'src/bar.ts'])).toBe(true);
    });

    it('returns false when a source file is missing test file', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);
      expect(hasTestFile(['src/foo.ts'])).toBe(false);
    });

    it('skips test files themselves', () => {
      expect(hasTestFile(['test/foo.test.ts'])).toBe(true);
    });

    it('skips non-source files', () => {
      expect(hasTestFile(['README.md', 'package.json'])).toBe(true);
    });
  });

  describe('runTests', () => {
    it('executes vitest using process.execPath and avoids npx shell issues', () => {
      vi.mocked(child_process.execFileSync).mockReturnValue('tests passed output' as any);
      const result = runTests('test/dummy.test.ts');

      expect(result.failures).toBe(0);
      expect(result.output).toBe('tests passed output');

      const execCall = vi.mocked(child_process.execFileSync).mock.calls[0];
      expect(execCall[0]).toBe(process.execPath); // the executable is Node itself

      // The arguments array should include the vitest.mjs path, run, test file, and reporters
      expect(execCall[1]).toContain('run');
      expect(execCall[1]).toContain('test/dummy.test.ts');
      expect(execCall[1]).toContain('--reporter=verbose');

      // Ensure the first arg passed to node is vitest.mjs
      const vitestPathArg = (execCall[1] as string[])[0];
      expect(vitestPathArg.endsWith('vitest.mjs')).toBe(true);
    });

    it('returns failure count when vitest fails (non-zero exit code)', () => {
      // simulate vitest failing with "2 failed" in output
      const error = new Error('Command failed') as any;
      error.stdout = '2 failed in dummy.test.ts';
      vi.mocked(child_process.execFileSync).mockImplementationOnce(() => {
        throw error;
      });

      const result = runTests('test/dummy.test.ts');
      expect(result.failures).toBe(2);
      expect(result.output).toBe('2 failed in dummy.test.ts');
    });
  });
});
