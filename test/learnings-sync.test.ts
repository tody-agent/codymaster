import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import {
  anonymize,
  mergeLearnings,
  learningKey,
  readLearningsFile,
  writeLearningsFile,
  addLearning,
  type Learning,
} from '../src/learnings';
import { syncLearnings } from '../src/cli/commands/learn';

function tmp(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function git(cwd: string, args: string[]): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8' });
}

describe('anonymize', () => {
  it('strips absolute /Users paths', () => {
    const l: Learning = {
      ts: '2026-05-07T00:00:00Z',
      type: 'fact',
      scope: 'general',
      note: 'see /Users/alice/projects/foo for details',
    };
    expect(anonymize(l).note).toContain('~/projects/foo');
    expect(anonymize(l).note).not.toContain('alice');
  });

  it('strips emails', () => {
    const l: Learning = {
      ts: '2026-05-07T00:00:00Z',
      type: 'fact',
      scope: 'general',
      note: 'ping bob@example.com about it',
    };
    expect(anonymize(l).note).toContain('<email>');
  });

  it('strips long opaque tokens', () => {
    const l: Learning = {
      ts: '2026-05-07T00:00:00Z',
      type: 'fact',
      scope: 'general',
      note: 'token=abc123ABC456_def789ghi012JKL345mno',
    };
    expect(anonymize(l).note).toContain('<token>');
  });

  it('leaves short content alone', () => {
    const l: Learning = {
      ts: '2026-05-07T00:00:00Z',
      type: 'fact',
      scope: 'ui',
      note: 'use semantic colors',
    };
    expect(anonymize(l).note).toBe('use semantic colors');
  });
});

describe('mergeLearnings', () => {
  it('dedups by (type, scope, note) and keeps earliest ts', () => {
    const a: Learning = { ts: '2026-05-07T00:00:00Z', type: 'fact', scope: 'x', note: 'hello' };
    const b: Learning = { ts: '2026-04-01T00:00:00Z', type: 'fact', scope: 'x', note: 'hello' };
    const merged = mergeLearnings([a], [b]);
    expect(merged).toHaveLength(1);
    expect(merged[0].ts).toBe(b.ts);
  });

  it('keeps distinct entries', () => {
    const a: Learning = { ts: '2026-05-07T00:00:00Z', type: 'fact', scope: 'x', note: 'hello' };
    const b: Learning = { ts: '2026-04-01T00:00:00Z', type: 'fact', scope: 'y', note: 'hello' };
    expect(mergeLearnings([a], [b])).toHaveLength(2);
  });

  it('learningKey is stable', () => {
    const a: Learning = { ts: '2026-05-07', type: 'fact', scope: 's', note: 'n' };
    expect(learningKey(a)).toBe('fact|s|n');
  });
});

describe('syncLearnings (against bare git remote)', () => {
  let project: string;
  let bareRepo: string;
  let syncDir: string;

  beforeEach(() => {
    project = tmp('cm-proj-');
    bareRepo = tmp('cm-bare-') + '.git';
    syncDir = tmp('cm-sync-');
    fs.rmSync(syncDir, { recursive: true, force: true });

    fs.mkdirSync(bareRepo, { recursive: true });
    execFileSync('git', ['init', '--bare', '-b', 'main', bareRepo]);

    // Seed the bare repo with an empty learnings.jsonl committed on main.
    const seed = tmp('cm-seed-');
    git(seed, ['init', '-b', 'main']);
    git(seed, ['config', 'user.email', 'test@test']);
    git(seed, ['config', 'user.name', 'test']);
    fs.writeFileSync(path.join(seed, 'learnings.jsonl'), '');
    git(seed, ['add', '.']);
    git(seed, ['commit', '-m', 'init']);
    git(seed, ['remote', 'add', 'origin', bareRepo]);
    git(seed, ['push', '-u', 'origin', 'main']);
  });

  it('round-trips: push local, then another project pulls', () => {
    addLearning(project, { type: 'fact', scope: 'deploy', note: 'pin node 20' });
    addLearning(project, {
      type: 'pitfall',
      scope: 'auth',
      note: 'leaking key abc123ABC456_def789ghi012JKL345mno',
    });

    const r1 = syncLearnings(project, { remote: bareRepo, pullOnly: false, syncDir });
    expect(r1.pushed).toBeGreaterThan(0);

    // Remote mirror should be anonymized.
    const remoteEntries = readLearningsFile(path.join(syncDir, 'learnings.jsonl'));
    expect(remoteEntries.some(e => e.note.includes('<token>'))).toBe(true);
    expect(remoteEntries.some(e => e.note.includes('abc123ABC456_def789'))).toBe(false);

    // Second project pulls.
    const project2 = tmp('cm-proj2-');
    const syncDir2 = tmp('cm-sync2-');
    fs.rmSync(syncDir2, { recursive: true, force: true });
    const r2 = syncLearnings(project2, { remote: bareRepo, pullOnly: true, syncDir: syncDir2 });
    expect(r2.pulled).toBeGreaterThan(0);
    expect(r2.pushed).toBe(0);
    const local2 = readLearningsFile(path.join(project2, '.cm', 'learnings.jsonl'));
    expect(local2.some(e => e.scope === 'deploy')).toBe(true);
  });

  it('--pull-only does not push', () => {
    // Seed remote via direct write
    const direct = tmp('cm-direct-');
    git(direct, ['clone', bareRepo, '.']);
    git(direct, ['config', 'user.email', 't@t']);
    git(direct, ['config', 'user.name', 't']);
    writeLearningsFile(path.join(direct, 'learnings.jsonl'), [
      { ts: '2026-04-01T00:00:00Z', type: 'fact', scope: 'shared', note: 'remote-only entry' },
    ]);
    git(direct, ['add', '.']);
    git(direct, ['commit', '-m', 'seed']);
    git(direct, ['push', 'origin', 'main']);

    addLearning(project, { type: 'fact', scope: 'local', note: 'should not push' });
    const r = syncLearnings(project, { remote: bareRepo, pullOnly: true, syncDir });
    expect(r.pushed).toBe(0);
    expect(r.pulled).toBeGreaterThan(0);

    // Remote mirror still lacks "should not push"
    const remoteEntries = readLearningsFile(path.join(syncDir, 'learnings.jsonl'));
    expect(remoteEntries.some(e => e.note === 'should not push')).toBe(false);
    expect(remoteEntries.some(e => e.note === 'remote-only entry')).toBe(true);
  });
});
