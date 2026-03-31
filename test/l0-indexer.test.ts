import { test, expect, describe, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  generateLearningsIndex,
  generateSkeletonIndex,
  generateContinuityAbstract,
  refreshAllIndexes,
} from '../src/l0-indexer';

// ─── Test Helpers ───────────────────────────────────────────────────────────

let tempDir: string;

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'l0-indexer-test-'));
  fs.mkdirSync(path.join(tempDir, '.cm', 'memory'), { recursive: true });
});

afterEach(() => {
  fs.rmSync(tempDir, { recursive: true, force: true });
});

// ─── Learnings Index ────────────────────────────────────────────────────────

describe('generateLearningsIndex', () => {
  test('generates L0 index from learnings.json', () => {
    const learnings = [
      {
        id: 'L001',
        date: '2026-03-28',
        error: 'i18n batch extraction skipped locales',
        cause: 'Missing locale check in extraction loop',
        prevention: 'Always validate locale list before batch extraction',
        scope: 'module',
        ttl: 60,
        reinforceCount: 2,
        status: 'active',
      },
      {
        id: 'L002',
        date: '2026-03-29',
        error: 'Landing hero text jittering on mobile',
        cause: 'CSS animation not using transform',
        prevention: 'Use transform: translateY() instead of top/margin',
        scope: 'component',
        ttl: 30,
        reinforceCount: 0,
        status: 'active',
      },
    ];
    fs.writeFileSync(
      path.join(tempDir, '.cm', 'memory', 'learnings.json'),
      JSON.stringify(learnings, null, 2)
    );

    const index = generateLearningsIndex(tempDir);

    // Should produce markdown with entry count
    expect(index).toContain('2 entries');
    // Should contain each learning ID + summary
    expect(index).toContain('L001');
    expect(index).toContain('L002');
    expect(index).toContain('i18n batch extraction');
    expect(index).toContain('hero text jittering');
    // Should be compact — under 200 tokens (~800 chars)
    expect(index.length).toBeLessThan(800);
  });

  test('writes index file to .cm/learnings-index.md', () => {
    fs.writeFileSync(
      path.join(tempDir, '.cm', 'memory', 'learnings.json'),
      JSON.stringify([{ id: 'L001', error: 'test error', scope: 'global', ttl: 30, status: 'active' }])
    );

    generateLearningsIndex(tempDir);

    const indexPath = path.join(tempDir, '.cm', 'learnings-index.md');
    expect(fs.existsSync(indexPath)).toBe(true);
    const content = fs.readFileSync(indexPath, 'utf-8');
    expect(content).toContain('L001');
  });

  test('handles empty learnings.json', () => {
    fs.writeFileSync(
      path.join(tempDir, '.cm', 'memory', 'learnings.json'),
      JSON.stringify([])
    );

    const index = generateLearningsIndex(tempDir);

    expect(index).toContain('0 entries');
  });

  test('handles missing learnings.json', () => {
    const index = generateLearningsIndex(tempDir);

    expect(index).toContain('0 entries');
  });

  test('includes scope and TTL in index entries', () => {
    const learnings = [
      { id: 'L001', error: 'test error', scope: 'module', ttl: 60, status: 'active' },
    ];
    fs.writeFileSync(
      path.join(tempDir, '.cm', 'memory', 'learnings.json'),
      JSON.stringify(learnings)
    );

    const index = generateLearningsIndex(tempDir);

    expect(index).toContain('module');
    expect(index).toContain('60');
  });
});

// ─── Skeleton Index ─────────────────────────────────────────────────────────

describe('generateSkeletonIndex', () => {
  test('generates L0 index from skeleton.md', () => {
    const skeleton = `# Project Skeleton
## Entry Points
- dist/index.js (CLI)
- src/index.ts (source)

## Directory Structure
src/
  continuity.ts (469 lines)
  skill-chain.ts (332 lines)
  dashboard.ts (861 lines)
  judge.ts (310 lines)
  parallel-dispatch.ts (496 lines)
  data.ts (202 lines)
  ui/
    box.ts (9843 lines)
    theme.ts (200 lines)
    hamster.ts (150 lines)
    hooks.ts (300 lines)
    onboarding.ts (100 lines)
  chains/
    builtin.ts (88 lines)

## Config Files
- package.json
- tsconfig.json
- .cm/config.yaml

## Tests
test/
  security-scan.test.ts
  parallel-dispatch.test.ts
  business-logic.test.ts
`;
    fs.writeFileSync(path.join(tempDir, '.cm', 'skeleton.md'), skeleton);

    const index = generateSkeletonIndex(tempDir);

    // Should list key modules
    expect(index).toContain('continuity');
    expect(index).toContain('skill-chain');
    expect(index).toContain('dashboard');
    // Should list entry points
    expect(index).toContain('index.js');
    // Should be compact — under 600 tokens (~2400 chars)
    expect(index.length).toBeLessThan(2400);
  });

  test('writes index file to .cm/skeleton-index.md', () => {
    fs.writeFileSync(
      path.join(tempDir, '.cm', 'skeleton.md'),
      '# Skeleton\n## Entry Points\n- src/index.ts\n'
    );

    generateSkeletonIndex(tempDir);

    const indexPath = path.join(tempDir, '.cm', 'skeleton-index.md');
    expect(fs.existsSync(indexPath)).toBe(true);
  });

  test('handles missing skeleton.md', () => {
    const index = generateSkeletonIndex(tempDir);

    expect(index).toContain('No skeleton');
  });
});

// ─── Continuity Abstract ────────────────────────────────────────────────────

describe('generateContinuityAbstract', () => {
  test('extracts abstract from CONTINUITY.md state', () => {
    const continuity = `# CodyMaster Working Memory
Last Updated: 2026-03-30T17:00:00+07:00
Current Phase: planning
Current Iteration: 5
Project: CodyMaster (v4.4.5)

## Active Goal
Build Smart Spine — MCP-Native Context Layer.

## Current Task
- ID: context-backbone-v5
- Title: Smart Spine
- Status: planning
- Skill: cm-planning

## Next Actions (Priority Order)
1. Write tests for Phase 1
2. Implement l0-indexer.ts
3. Implement context-bus.ts
`;
    fs.writeFileSync(path.join(tempDir, '.cm', 'CONTINUITY.md'), continuity);

    const abstract = generateContinuityAbstract(tempDir);

    // Should be 2-3 lines, very compact
    expect(abstract.split('\n').filter(l => l.trim()).length).toBeLessThanOrEqual(4);
    // Should contain phase, goal, and current task
    expect(abstract).toContain('planning');
    expect(abstract).toContain('Smart Spine');
    // Should be under 100 tokens (~400 chars)
    expect(abstract.length).toBeLessThan(400);
  });

  test('handles missing CONTINUITY.md', () => {
    const abstract = generateContinuityAbstract(tempDir);

    expect(abstract).toContain('No session');
  });
});

// ─── Refresh All ────────────────────────────────────────────────────────────

describe('refreshAllIndexes', () => {
  test('generates all 3 index types', () => {
    // Setup minimal files
    fs.writeFileSync(
      path.join(tempDir, '.cm', 'memory', 'learnings.json'),
      JSON.stringify([{ id: 'L001', error: 'test', scope: 'global', ttl: 30, status: 'active' }])
    );
    fs.writeFileSync(path.join(tempDir, '.cm', 'skeleton.md'), '# Skeleton\n');
    fs.writeFileSync(path.join(tempDir, '.cm', 'CONTINUITY.md'), '# CodyMaster Working Memory\nCurrent Phase: idle\n\n## Active Goal\nNone\n');

    const result = refreshAllIndexes(tempDir);

    expect(result.learnings).toBeTruthy();
    expect(result.skeleton).toBeTruthy();
    expect(result.continuity).toBeTruthy();

    // All index files should exist
    expect(fs.existsSync(path.join(tempDir, '.cm', 'learnings-index.md'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, '.cm', 'skeleton-index.md'))).toBe(true);
  });
});
