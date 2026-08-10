"use strict";
/**
 * TDD Enforcement Gate — blocks execution without tests.
 *
 * TRIZ Principle #10 (Prior Action):
 *   Pre-flight check scans for test files BEFORE execution starts.
 *
 * TRIZ Principle #3 (Local Quality):
 *   Each task must have its own test file before implementation.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findTestFile = findTestFile;
exports.suggestTestFile = suggestTestFile;
exports.runTests = runTests;
exports.enforceTDD = enforceTDD;
exports.hasTestFile = hasTestFile;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
/**
 * Find test file for a given source file.
 * Mapping: src/foo.ts → test/foo.test.ts
 *          src/bar/baz.ts → test/bar/baz.test.ts
 */
function findTestFile(sourceFile) {
    const testFile = sourceFile
        .replace(/^src\//, 'test/')
        .replace(/\.ts$/, '.test.ts')
        .replace(/\.js$/, '.test.js');
    return fs_1.default.existsSync(testFile) ? testFile : null;
}
/**
 * Suggest test file path for a given source file.
 */
function suggestTestFile(sourceFile) {
    return sourceFile
        .replace(/^src\//, 'test/')
        .replace(/\.ts$/, '.test.ts')
        .replace(/\.js$/, '.test.js');
}
/**
 * Run tests for a specific test file and return failure count.
 */
function runTests(testFile) {
    try {
        const pkgPath = require.resolve('vitest/package.json');
        const pkg = JSON.parse(fs_1.default.readFileSync(pkgPath, 'utf8'));
        const binPath = path_1.default.resolve(path_1.default.dirname(pkgPath), pkg.bin.vitest);
        const output = (0, child_process_1.execFileSync)(process.execPath, [binPath, 'run', testFile, '--reporter=verbose'], {
            encoding: 'utf-8',
            timeout: 30000,
            stdio: ['pipe', 'pipe', 'pipe'],
        });
        return { failures: 0, output };
    }
    catch (error) {
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
function enforceTDD(targetFiles) {
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
function hasTestFile(targetFiles) {
    for (const file of targetFiles) {
        if (file.includes('.test.') || file.includes('.spec.'))
            continue;
        if (!file.startsWith('src/') && !file.startsWith('lib/'))
            continue;
        if (!findTestFile(file))
            return false;
    }
    return true;
}
