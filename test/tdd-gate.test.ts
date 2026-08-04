import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { findTestFile, suggestTestFile, hasTestFile, runTests } from '../src/execution/tdd-gate';
import child_process from 'child_process';
import path from 'path';

// Mock fs module
vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs');
  return {
    ...actual,
    existsSync: vi.fn(),
  };
});

import fs from 'fs';

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

  describe('runTests (integration)', () => {
    it('uses process.execPath and resolves vitest.mjs to avoid batch file issues', () => {
      // This test is designed to verify the fix for command injection via testRunner
      // We will spy on child_process to ensure it's called with the expected array format
      const child_process = require('child_process');
      const execFileSyncSpy = vi.spyOn(child_process, 'execFileSync').mockReturnValue('mock output');

      runTests('test/dummy.test.ts');

      expect(execFileSyncSpy).toHaveBeenCalled();
      const [cmd, args] = execFileSyncSpy.mock.calls[0];

      expect(cmd).toBe(process.execPath); // Uses node directly
      expect(args[0]).toContain('vitest.mjs'); // Points to JS entrypoint
      expect(args[1]).toBe('run');
      expect(args[2]).toBe('test/dummy.test.ts');
      expect(args[3]).toBe('--reporter=verbose');

      execFileSyncSpy.mockRestore();
    });

    it('returns failures when vitest exits with an error code', () => {
      const child_process = require('child_process');
      const execFileSyncSpy = vi.spyOn(child_process, 'execFileSync').mockImplementation(() => {
        const err = new Error('Command failed') as any;
        err.stdout = 'Tests failed\n2 failed\n1 passed';
        throw err;
      });

      const result = runTests('test/fail.test.ts');
      expect(result.failures).toBe(2);
      expect(result.output).toContain('2 failed');

      execFileSyncSpy.mockRestore();
    });
  });

});
