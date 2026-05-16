/**
 * TDD Enforcement Gate — blocks execution without tests.
 *
 * TRIZ Principle #10 (Prior Action):
 *   Pre-flight check scans for test files BEFORE execution starts.
 *
 * TRIZ Principle #3 (Local Quality):
 *   Each task must have its own test file before implementation.
 */

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

export interface TDDGateResult {
  passed: boolean;
  testFile: string | null;
  message: string;
}

/**
 * Find test file for a given source file.
 * Mapping: src/foo.ts → test/foo.test.ts
 *          src/bar/baz.ts → test/bar/baz.test.ts
 */
export function findTestFile(sourceFile: string): string | null {
  const testFile = sourceFile
    .replace(/^src\//, 'test/')
    .replace(/\.ts$/, '.test.ts')
    .replace(/\.js$/, '.test.js');
  return fs.existsSync(testFile) ? testFile : null;
}

/**
 * Suggest test file path for a given source file.
 */
export function suggestTestFile(sourceFile: string): string {
  return sourceFile
    .replace(/^src\//, 'test/')
    .replace(/\.ts$/, '.test.ts')
    .replace(/\.js$/, '.test.js');
}

/**
 * Run tests for a specific test file and return failure count.
 */
export function runTests(testFile: string): { failures: number; output: string } {
  try {
    const output = execFileSync('npx', ['vitest', 'run', testFile, '--reporter=verbose'], {
      encoding: 'utf-8',
      timeout: 30000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { failures: 0, output };
  } catch (error: any) {
    // vitest exits with non-zero code when tests fail
    const output = error.stdout || error.stderr || '';
    const failMatch = output.match(/(\d+) failed/);
    const failures = failMatch ? parseInt(failMatch[1], 10) : 1;
    return { failures, output };
  }
}

/**
 * Enforce TDD: verify test file exists and has failing tests (RED phase).
 *
 * Rules:
 * 1. Test file MUST exist for target source file
 * 2. Tests MUST fail (RED phase) before implementation
 * 3. If all tests pass, user must write a failing test first
 */
export function enforceTDD(targetFiles: string[]): TDDGateResult {
  for (const file of targetFiles) {
    // Skip test files themselves
    if (file.includes('.test.') || file.includes('.spec.')) {
      continue;
    }

    // Skip non-source files
    if (!file.startsWith('src/') && !file.startsWith('lib/')) {
      continue;
    }

    const testFile = findTestFile(file);
    if (!testFile) {
      return {
        passed: false,
        testFile: null,
        message: `TDD GATE: No test file found for ${file}. Write test first: ${suggestTestFile(file)}`,
      };
    }

    const result = runTests(testFile);
    if (result.failures === 0) {
      return {
        passed: false,
        testFile,
        message: `TDD GATE: All tests pass in ${testFile}. Write a failing test for new behavior first (RED phase).`,
      };
    }
  }

  return { passed: true, testFile: null, message: 'TDD GATE: OK — failing tests found (RED phase)' };
}

/**
 * Quick check: does test file exist? (no execution, fast)
 */
export function hasTestFile(targetFiles: string[]): boolean {
  for (const file of targetFiles) {
    if (file.includes('.test.') || file.includes('.spec.')) continue;
    if (!file.startsWith('src/') && !file.startsWith('lib/')) continue;
    if (!findTestFile(file)) return false;
  }
  return true;
}
