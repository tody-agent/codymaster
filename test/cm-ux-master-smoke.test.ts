import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const REPO_ROOT = path.resolve(__dirname, '..');
const SKILL_ROOT = path.join(REPO_ROOT, 'skills', 'cm-ux-master');
const SKILL_MD = path.join(SKILL_ROOT, 'SKILL.md');

describe('cm-ux-master smoke', () => {
  it('has the correct skill identity and core positioning', () => {
    const text = fs.readFileSync(SKILL_MD, 'utf8');
    expect(text).toContain('name: cm-ux-master');
    expect(text).toContain('# 🚀 CM UX Master');
    expect(text).toContain('48 UX Laws');
    expect(text).toContain('37 Design Tests');
    expect(text).toContain('scripts/search.py');
  });

  it('ships the required executable entrypoints and MCP server', () => {
    const requiredFiles = [
      'scripts/search.py',
      'scripts/extractor.py',
      'scripts/validation_engine.py',
      'scripts/harvester_browser.py',
      'mcp/server.py',
      'README.md',
    ];

    for (const rel of requiredFiles) {
      const full = path.join(SKILL_ROOT, rel);
      expect(fs.existsSync(full), `missing ${rel}`).toBe(true);
    }
  });

  it('is categorized as a product skill in the judge map', () => {
    const judgeTs = fs.readFileSync(path.join(REPO_ROOT, 'src', 'judge.ts'), 'utf8');
    expect(judgeTs).toContain("'cm-ux-master': 'product'");
  });
});
