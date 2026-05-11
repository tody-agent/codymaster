import { describe, it, expect, vi, beforeEach } from 'vitest';
import { findTestFile, suggestTestFile, hasTestFile } from '../src/execution/tdd-gate';

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
});
