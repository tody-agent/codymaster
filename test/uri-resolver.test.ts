import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { resolve } from '../src/uri-resolver';
import { initBus } from '../src/context-bus';

function makeTmpProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cm-uri-'));
  const cmDir = path.join(dir, '.cm');
  fs.mkdirSync(path.join(cmDir, 'memory'), { recursive: true });
  return dir;
}

function rmrf(p: string) {
  fs.rmSync(p, { recursive: true, force: true });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('cm:// URI resolver', () => {
  let tmpDir: string;

  beforeEach(() => { tmpDir = makeTmpProject(); });
  afterEach(() => { rmrf(tmpDir); });

  // ── cm://memory/working ──────────────────────────────────────────────────

  describe('cm://memory/working', () => {
    it('returns not-found when CONTINUITY.md missing', () => {
      const r = resolve('cm://memory/working', tmpDir);
      expect(r.found).toBe(false);
      expect(r.uri).toBe('cm://memory/working');
    });

    it('returns content when CONTINUITY.md exists', () => {
      const cont = path.join(tmpDir, '.cm', 'CONTINUITY.md');
      fs.writeFileSync(cont, '# Working Memory\n\n## Active Goal\nBuild auth module', 'utf-8');
      const r = resolve('cm://memory/working', tmpDir);
      expect(r.found).toBe(true);
      expect(r.content).toContain('Active Goal');
    });

    it('L0 returns abstract (first 5 lines)', () => {
      const lines = Array.from({ length: 30 }, (_, i) => `line ${i}`).join('\n');
      fs.writeFileSync(path.join(tmpDir, '.cm', 'CONTINUITY.md'), lines, 'utf-8');
      const r = resolve('cm://memory/working', tmpDir, 'L0');
      expect(r.depth).toBe('L0');
      const lineCount = r.content.split('\n').length;
      expect(lineCount).toBeLessThanOrEqual(10);
    });
  });

  // ── cm://memory/learnings ────────────────────────────────────────────────

  describe('cm://memory/learnings', () => {
    it('returns found=true with empty array when no index and no JSON (graceful fallback)', () => {
      // At L0 with no learnings-index.md, falls through to SQLite → returns found=true + '[]'
      const r = resolve('cm://memory/learnings', tmpDir, 'L0');
      expect(r.found).toBe(true);
    });

    it('returns learnings-index.md at L0', () => {
      const idx = path.join(tmpDir, '.cm', 'learnings-index.md');
      fs.writeFileSync(idx, '## L0 Index\n\nL001 — i18n missing\n', 'utf-8');
      const r = resolve('cm://memory/learnings', tmpDir, 'L0');
      expect(r.found).toBe(true);
      expect(r.content).toContain('L001');
      expect(r.depth).toBe('L0');
    });

    it('returns learnings.json content at L2', () => {
      const lPath = path.join(tmpDir, '.cm', 'memory', 'learnings.json');
      fs.writeFileSync(lPath, JSON.stringify([{ id: 'L001', error: 'test', scope: 'global', status: 'active' }]), 'utf-8');
      const r = resolve('cm://memory/learnings', tmpDir, 'L2');
      expect(r.found).toBe(true);
      expect(r.content).toContain('L001');
    });
  });

  // ── cm://memory/learnings/{id} ───────────────────────────────────────────

  describe('cm://memory/learnings/{id}', () => {
    it('returns not-found for unknown id', () => {
      const r = resolve('cm://memory/learnings/L999', tmpDir);
      expect(r.found).toBe(false);
    });
  });

  // ── cm://memory/decisions ────────────────────────────────────────────────

  describe('cm://memory/decisions', () => {
    it('returns found=true with empty array when no files exist (graceful empty)', () => {
      // uri-resolver returns found=true with '[]' even when empty — graceful fallback
      const r = resolve('cm://memory/decisions', tmpDir, 'L2');
      expect(r.found).toBe(true);
      expect(r.content).toBe('[]');
    });

    it('returns content when decisions.json exists', () => {
      const dPath = path.join(tmpDir, '.cm', 'memory', 'decisions.json');
      fs.writeFileSync(
        dPath,
        JSON.stringify([{ id: 'D001', decision: 'Use SQLite', scope: 'global', status: 'active' }]),
        'utf-8',
      );
      const r = resolve('cm://memory/decisions', tmpDir, 'L2');
      expect(r.found).toBe(true);
      expect(r.content).toContain('D001');
    });
  });

  // ── cm://skills/{name} ───────────────────────────────────────────────────

  describe('cm://skills/{name}', () => {
    it('returns not-found for unknown skill', () => {
      const r = resolve('cm://skills/nonexistent-xyz', tmpDir);
      expect(r.found).toBe(false);
    });

    it('finds SKILL.md in project skills/ directory', () => {
      const skillDir = path.join(tmpDir, 'skills', 'my-skill');
      fs.mkdirSync(skillDir, { recursive: true });
      fs.writeFileSync(
        path.join(skillDir, 'SKILL.md'),
        '---\nname: my-skill\ndescription: test skill\n---\n\n# My Skill\n\nDoes things.',
        'utf-8',
      );
      const r = resolve('cm://skills/my-skill', tmpDir, 'L2');
      expect(r.found).toBe(true);
      expect(r.content).toContain('My Skill');
    });

    it('L0 returns only front matter + description', () => {
      const skillDir = path.join(tmpDir, 'skills', 'test-skill');
      fs.mkdirSync(skillDir, { recursive: true });
      const content = Array.from({ length: 50 }, (_, i) => `line ${i}`).join('\n');
      fs.writeFileSync(path.join(skillDir, 'SKILL.md'), `---\nname: test-skill\n---\n\n${content}`, 'utf-8');
      const r = resolve('cm://skills/test-skill', tmpDir, 'L0');
      expect(r.found).toBe(true);
      const lines = r.content.split('\n').length;
      expect(lines).toBeLessThan(30);
    });
  });

  // ── cm://resources/skeleton ──────────────────────────────────────────────

  describe('cm://resources/skeleton', () => {
    it('returns not-found when no skeleton files', () => {
      const r = resolve('cm://resources/skeleton', tmpDir, 'L0');
      expect(r.found).toBe(false);
    });

    it('returns skeleton-index.md at L0', () => {
      const idx = path.join(tmpDir, '.cm', 'skeleton-index.md');
      fs.writeFileSync(idx, '## Skeleton L0\n\nsrc/index.ts — entry\n', 'utf-8');
      const r = resolve('cm://resources/skeleton', tmpDir, 'L0');
      expect(r.found).toBe(true);
      expect(r.content).toContain('entry');
    });

    it('returns full skeleton.md at L2', () => {
      const full = path.join(tmpDir, '.cm', 'skeleton.md');
      fs.writeFileSync(full, '# Full Skeleton\n\n## src/index.ts\n\nexport function main() {}', 'utf-8');
      const r = resolve('cm://resources/skeleton', tmpDir, 'L2');
      expect(r.found).toBe(true);
      expect(r.content).toContain('Full Skeleton');
    });
  });

  // ── cm://pipeline/current ────────────────────────────────────────────────

  describe('cm://pipeline/current', () => {
    it('returns not-found when no bus', () => {
      const r = resolve('cm://pipeline/current', tmpDir);
      expect(r.found).toBe(false);
    });

    it('returns bus JSON when active', () => {
      initBus(tmpDir, 'feature-development', 'sess-001');
      const r = resolve('cm://pipeline/current', tmpDir);
      expect(r.found).toBe(true);
      expect(r.content).toContain('feature-development');
    });
  });

  // ── invalid URIs ─────────────────────────────────────────────────────────

  describe('invalid URIs', () => {
    it('rejects non-cm:// URIs', () => {
      const r = resolve('https://example.com', tmpDir);
      expect(r.found).toBe(false);
    });

    it('rejects empty path', () => {
      const r = resolve('cm://', tmpDir);
      expect(r.found).toBe(false);
    });

    it('rejects unknown namespace', () => {
      const r = resolve('cm://unknown/something', tmpDir);
      expect(r.found).toBe(false);
    });
  });

  // ── depth param ──────────────────────────────────────────────────────────

  describe('depth parameter', () => {
    it('defaults to L1 when not specified', () => {
      const r = resolve('cm://memory/working', tmpDir);
      expect(r.depth).toBe('L1');
    });

    it('respects explicit L0, L1, L2', () => {
      fs.writeFileSync(path.join(tmpDir, '.cm', 'CONTINUITY.md'), '# State', 'utf-8');
      expect(resolve('cm://memory/working', tmpDir, 'L0').depth).toBe('L0');
      expect(resolve('cm://memory/working', tmpDir, 'L1').depth).toBe('L1');
      expect(resolve('cm://memory/working', tmpDir, 'L2').depth).toBe('L2');
    });
  });

  // ── tokenEstimate ────────────────────────────────────────────────────────

  describe('tokenEstimate', () => {
    it('returns positive token estimate for found content', () => {
      fs.writeFileSync(path.join(tmpDir, '.cm', 'CONTINUITY.md'), '# Working Memory\n\nsome content here', 'utf-8');
      const r = resolve('cm://memory/working', tmpDir);
      expect(r.tokenEstimate).toBeGreaterThan(0);
    });

    it('returns positive token estimate for not-found URIs (reason message has tokens)', () => {
      // notFound() includes a reason string, so tokenEstimate > 0 even when found=false
      const r = resolve('cm://memory/working', tmpDir);
      expect(r.found).toBe(false);
      expect(r.tokenEstimate).toBeGreaterThan(0);
    });
  });
});
