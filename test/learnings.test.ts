import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  addLearning,
  listLearnings,
  pruneLearnings,
  renderLearningsForContinuity,
  learningsPath,
  LearningError,
} from '../src/learnings';

describe('learnings', () => {
  let tmp: string;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cm-learn-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('appends and reads back learnings, newest first', () => {
    addLearning(tmp, { type: 'pitfall', scope: 'deploy', note: 'wrangler.toml at root' });
    addLearning(tmp, { type: 'preference', scope: 'ui', note: 'Tailwind + shadcn' });
    const out = listLearnings(tmp);
    expect(out).toHaveLength(2);
    expect(out[0].scope).toBe('ui'); // newest first
    expect(out[1].scope).toBe('deploy');
  });

  it('filters by type and scope', () => {
    addLearning(tmp, { type: 'pitfall', scope: 'deploy', note: 'a' });
    addLearning(tmp, { type: 'preference', scope: 'deploy', note: 'b' });
    addLearning(tmp, { type: 'pitfall', scope: 'ui', note: 'c' });
    expect(listLearnings(tmp, { type: 'pitfall' })).toHaveLength(2);
    expect(listLearnings(tmp, { scope: 'deploy' })).toHaveLength(2);
    expect(listLearnings(tmp, { type: 'pitfall', scope: 'deploy' })).toHaveLength(1);
  });

  it('limit caps result count', () => {
    for (let i = 0; i < 5; i++) {
      addLearning(tmp, { type: 'fact', scope: 's', note: `n${i}` });
    }
    expect(listLearnings(tmp, { limit: 2 })).toHaveLength(2);
  });

  it('rejects invalid types and oversize notes', () => {
    expect(() =>
      addLearning(tmp, { type: 'wrong' as any, scope: 's', note: 'x' })
    ).toThrow(LearningError);
    expect(() =>
      addLearning(tmp, { type: 'fact', scope: 's', note: 'x'.repeat(501) })
    ).toThrow(/too long/);
    expect(() =>
      addLearning(tmp, { type: 'fact', scope: '', note: 'x' })
    ).toThrow(/scope/);
  });

  it('returns empty when file missing', () => {
    expect(listLearnings(tmp)).toEqual([]);
    expect(renderLearningsForContinuity(tmp)).toBe('');
  });

  it('skips malformed lines silently', () => {
    const file = learningsPath(tmp);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(
      file,
      'not json\n' +
        JSON.stringify({ ts: '2026-05-07T00:00:00Z', type: 'fact', scope: 's', note: 'ok' }) +
        '\n',
      'utf8'
    );
    const out = listLearnings(tmp);
    expect(out).toHaveLength(1);
    expect(out[0].note).toBe('ok');
  });

  it('prunes entries older than cutoff', () => {
    const oldTs = new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString();
    const newTs = new Date().toISOString();
    addLearning(tmp, { type: 'fact', scope: 's', note: 'old', ts: oldTs });
    addLearning(tmp, { type: 'fact', scope: 's', note: 'new', ts: newTs });
    const pruned = pruneLearnings(tmp, 180);
    expect(pruned).toBe(1);
    const remaining = listLearnings(tmp);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].note).toBe('new');
  });

  it('renders a continuity block', () => {
    addLearning(tmp, { type: 'pitfall', scope: 'deploy', note: 'A' });
    addLearning(tmp, { type: 'preference', scope: 'ui', note: 'B' });
    const md = renderLearningsForContinuity(tmp);
    expect(md).toMatch(/## Recent Learnings/);
    expect(md).toMatch(/preference\/ui.*B/);
    expect(md).toMatch(/pitfall\/deploy.*A/);
  });
});
