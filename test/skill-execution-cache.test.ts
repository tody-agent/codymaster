import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { SkillExecutionCache, formatCacheStats } from '../src/skill-execution-cache';

// ─── Test Helpers ────────────────────────────────────────────────────────────

let tmpDir: string;
let cache: SkillExecutionCache;

function createTmpProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cm-cache-test-'));
  const cmDir = path.join(dir, '.cm');
  fs.mkdirSync(cmDir, { recursive: true });
  return dir;
}

beforeEach(() => {
  tmpDir = createTmpProject();
  cache = new SkillExecutionCache(tmpDir);
  cache.initialize();
});

afterEach(() => {
  cache.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ─── cacheExecution ──────────────────────────────────────────────────────────

describe('cacheExecution', () => {
  it('caches a successful execution', () => {
    cache.cacheExecution('fix login bug', ['cm-debugging', 'cm-tdd'], 0.9, 5000);
    const entries = cache.listCachedChains();
    expect(entries).toHaveLength(1);
    expect(entries[0].taskPattern).toBe('fix login bug');
    expect(entries[0].skillChain).toEqual(['cm-debugging', 'cm-tdd']);
    expect(entries[0].effectiveness).toBe(0.9);
  });

  it('does NOT cache low effectiveness executions', () => {
    cache.cacheExecution('bad task', ['cm-debugging'], 0.3, 5000);
    const entries = cache.listCachedChains();
    expect(entries).toHaveLength(0);
  });

  it('does NOT cache empty task patterns', () => {
    cache.cacheExecution('', ['cm-debugging'], 0.9, 5000);
    cache.cacheExecution('  ', ['cm-debugging'], 0.9, 5000);
    const entries = cache.listCachedChains();
    expect(entries).toHaveLength(0);
  });

  it('does NOT cache empty skill chains', () => {
    cache.cacheExecution('some task', [], 0.9, 5000);
    const entries = cache.listCachedChains();
    expect(entries).toHaveLength(0);
  });

  it('updates existing entry when better effectiveness', () => {
    cache.cacheExecution('fix login bug', ['cm-debugging'], 0.8, 5000);
    cache.cacheExecution('fix login bug', ['cm-debugging', 'cm-tdd'], 0.95, 4000);
    const entries = cache.listCachedChains();
    expect(entries).toHaveLength(1);
    expect(entries[0].effectiveness).toBe(0.95);
    expect(entries[0].skillChain).toEqual(['cm-debugging', 'cm-tdd']);
  });

  it('increments hit count on duplicate pattern', () => {
    cache.cacheExecution('fix login bug', ['cm-debugging'], 0.9, 5000);
    cache.cacheExecution('fix login bug', ['cm-debugging'], 0.85, 5000);
    const entries = cache.listCachedChains();
    expect(entries[0].hitCount).toBe(2);
  });
});

// ─── findCachedChain ─────────────────────────────────────────────────────────

describe('findCachedChain', () => {
  it('finds a matching chain by BM25 similarity', () => {
    cache.cacheExecution('fix login bug authentication', ['cm-debugging', 'cm-tdd'], 0.9, 5000);
    // Search with overlapping keywords
    const result = cache.findCachedChain('fix login bug');
    expect(result).not.toBeNull();
    expect(result!.skillChain).toEqual(['cm-debugging', 'cm-tdd']);
  });

  it('finds a match with subset keywords', () => {
    cache.cacheExecution('deploy application to production server', ['cm-safe-deploy'], 0.95, 3000);
    const result = cache.findCachedChain('deploy production');
    expect(result).not.toBeNull();
    expect(result!.skillChain).toEqual(['cm-safe-deploy']);
  });

  it('returns null for no matches', () => {
    cache.cacheExecution('fix login bug', ['cm-debugging'], 0.9, 5000);
    const result = cache.findCachedChain('deploy to production server cloudflare');
    expect(result).toBeNull();
  });

  it('returns null for empty cache', () => {
    const result = cache.findCachedChain('fix something');
    expect(result).toBeNull();
  });

  it('returns null for empty query', () => {
    cache.cacheExecution('fix login bug', ['cm-debugging'], 0.9, 5000);
    const result = cache.findCachedChain('');
    expect(result).toBeNull();
  });

  it('handles special characters in query gracefully', () => {
    cache.cacheExecution('fix login bug', ['cm-debugging'], 0.9, 5000);
    const result = cache.findCachedChain('fix (login) bug [v2]');
    // Should not throw, may or may not match
    expect(result === null || result.skillChain.length > 0).toBe(true);
  });
});

// ─── getStats ────────────────────────────────────────────────────────────────

describe('getStats', () => {
  it('returns zeros for empty cache', () => {
    const stats = cache.getStats();
    expect(stats.totalEntries).toBe(0);
    expect(stats.totalHits).toBe(0);
    expect(stats.avgEffectiveness).toBe(0);
    expect(stats.estimatedTokensSaved).toBe(0);
  });

  it('computes correct statistics', () => {
    cache.cacheExecution('task1', ['cm-debugging'], 0.8, 5000);
    cache.cacheExecution('task2', ['cm-tdd'], 0.9, 3000);
    const stats = cache.getStats();
    expect(stats.totalEntries).toBe(2);
    expect(stats.totalHits).toBe(2); // Initial inserts count as 1 hit each
    expect(stats.avgEffectiveness).toBeGreaterThan(0.8);
  });
});

// ─── clearCache ──────────────────────────────────────────────────────────────

describe('clearCache', () => {
  it('removes all entries', () => {
    cache.cacheExecution('task1', ['cm-debugging'], 0.9, 5000);
    cache.cacheExecution('task2', ['cm-tdd'], 0.9, 3000);
    const cleared = cache.clearCache();
    expect(cleared).toBe(2);
    expect(cache.listCachedChains()).toHaveLength(0);
  });

  it('returns 0 for empty cache', () => {
    const cleared = cache.clearCache();
    expect(cleared).toBe(0);
  });
});

// ─── formatCacheStats ────────────────────────────────────────────────────────

describe('formatCacheStats', () => {
  it('produces readable output', () => {
    const output = formatCacheStats({
      totalEntries: 5,
      totalHits: 12,
      avgEffectiveness: 0.85,
      estimatedTokensSaved: 24000,
    });
    expect(output).toContain('Skill Execution Cache');
    expect(output).toContain('5');
    expect(output).toContain('12');
    expect(output).toContain('85.0%');
    expect(output).toContain('24,000');
  });
});
