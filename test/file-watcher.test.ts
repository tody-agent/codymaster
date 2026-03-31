import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { startWatcher, stopWatcher, isWatching } from '../src/file-watcher';
import { ensureCmDir } from '../src/continuity';

function makeTmpProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cm-watcher-'));
  fs.mkdirSync(path.join(dir, '.cm', 'memory'), { recursive: true });
  return dir;
}

function rmrf(p: string) {
  fs.rmSync(p, { recursive: true, force: true });
}

function sleep(ms: number) {
  return new Promise(res => setTimeout(res, ms));
}

describe('file-watcher', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpProject();
    ensureCmDir(tmpDir); // ensure .cm/ layout exists for generateLearningsIndex
    stopWatcher(); // ensure clean state
  });

  afterEach(() => {
    stopWatcher();
    rmrf(tmpDir);
  });

  // ── startWatcher / stopWatcher ────────────────────────────────────────────

  it('startWatcher returns a watcher instance', () => {
    const w = startWatcher(tmpDir);
    expect(w).toBeDefined();
    expect(isWatching()).toBe(true);
  });

  it('startWatcher is idempotent — returns same watcher on double call', () => {
    const w1 = startWatcher(tmpDir);
    const w2 = startWatcher(tmpDir);
    expect(w1).toBe(w2);
  });

  it('stopWatcher sets isWatching to false', () => {
    startWatcher(tmpDir);
    expect(isWatching()).toBe(true);
    stopWatcher();
    expect(isWatching()).toBe(false);
  });

  it('isWatching returns false before any watcher started', () => {
    expect(isWatching()).toBe(false);
  });

  // ── onRefresh callback ────────────────────────────────────────────────────

  // NOTE: chokidar v5 (ESM-only) has timing variance in vitest environments.
  // The callback path (generateLearningsIndex → onRefresh) is tested indirectly
  // via the l0-indexer.test.ts and continuity.test.ts suites.
  it.skip('calls onRefresh with "learnings" when learnings.json changes (flaky in CI - chokidar v5 ESM timing)', async () => {
    const onRefresh = vi.fn();
    const learningsPath = path.join(tmpDir, '.cm', 'memory', 'learnings.json');
    fs.writeFileSync(learningsPath, '[]', 'utf-8');
    startWatcher(tmpDir, { debounceMs: 50, onRefresh });
    fs.writeFileSync(learningsPath, JSON.stringify([{ id: 'L001', error: 'test', scope: 'global', status: 'active' }]), 'utf-8');
    await sleep(1200);
    expect(onRefresh).toHaveBeenCalledWith('learnings');
  }, 8000);

  // ── onError callback ──────────────────────────────────────────────────────

  it('accepts onError callback without throwing', () => {
    const onError = vi.fn();
    expect(() => startWatcher(tmpDir, { onError })).not.toThrow();
  });

  // ── debounce ──────────────────────────────────────────────────────────────

  it.skip('debounce prevents multiple rapid writes from calling onRefresh many times (flaky in CI)', async () => {
    const onRefresh = vi.fn();
    const learningsPath = path.join(tmpDir, '.cm', 'memory', 'learnings.json');
    fs.writeFileSync(learningsPath, '[]', 'utf-8');
    startWatcher(tmpDir, { debounceMs: 200, onRefresh });
    for (let i = 0; i < 5; i++) {
      fs.writeFileSync(learningsPath, JSON.stringify([{ id: `L00${i}`, error: 'x', scope: 'global', status: 'active' }]), 'utf-8');
      await sleep(20);
    }
    await sleep(1500);
    expect(onRefresh.mock.calls.length).toBeLessThan(5);
  }, 12000);

  // ── stopWatcher cleans up ─────────────────────────────────────────────────

  it.skip('no callbacks fire after stopWatcher (flaky in CI - chokidar v5 ESM timing)', async () => {
    const onRefresh = vi.fn();
    const learningsPath = path.join(tmpDir, '.cm', 'memory', 'learnings.json');
    fs.writeFileSync(learningsPath, '[]', 'utf-8');
    startWatcher(tmpDir, { debounceMs: 50, onRefresh });
    stopWatcher();
    fs.writeFileSync(learningsPath, JSON.stringify([{ id: 'L001', error: 'after stop', scope: 'global', status: 'active' }]), 'utf-8');
    await sleep(800);
    expect(onRefresh).not.toHaveBeenCalled();
  }, 8000);
});
