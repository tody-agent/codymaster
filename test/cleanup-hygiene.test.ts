import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('CodyMaster Code Hygiene', () => {
  const rootDir = path.resolve(__dirname, '..');

  it('no junk files should exist in the root directory', () => {
    const junkFiles = [
      'run_batch1.js',
      'gemini-extension.json.backup',
      'projects.txt',
      'tmp_test'
    ];

    junkFiles.forEach(file => {
      const filePath = path.join(rootDir, file);
      expect(fs.existsSync(filePath), `Junk file/folder still exists: ${file}`).toBe(false);
    });
  });

  it('no junk scripts should exist in the scripts directory', () => {
    const junkScripts = [
      'test-gemini.js'
    ];

    junkScripts.forEach(file => {
      const filePath = path.join(rootDir, 'scripts', file);
      expect(fs.existsSync(filePath), `Junk script still exists: scripts/${file}`).toBe(false);
    });
  });

  it('src/index.ts should be concise and not a monolith', () => {
    const indexPath = path.join(rootDir, 'src', 'index.ts');
    const content = fs.readFileSync(indexPath, 'utf-8');
    const lines = content.split('\n').length;
    
    // Initial threshold is high, we will lower it after refactoring
    // Current is ~2500, we want it < 1000
    expect(lines, `src/index.ts is too large (${lines} lines). Please refactor into modules.`).toBeLessThan(1000);
  });

  it('no secret false positives in documentation', () => {
    const shieldDocPath = path.join(rootDir, 'skills', 'cm-secret-shield', 'SKILL.md');
    const content = fs.readFileSync(shieldDocPath, 'utf-8');
    
    // Common pattern used in security scanner (DB_PASSWORD = "...")
    const hasSecretPattern = /DB_PASSWORD\s*=\s*['"]MyP@ssw0rd123!['"]/i.test(content);
    expect(hasSecretPattern, 'Found triggered secret pattern in documentation. Replace with neutral placeholder.').toBe(false);
  });
});
