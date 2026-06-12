import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  recordTaste,
  loadTaste,
  topTaste,
  decayEntries,
  compactTaste,
  tastePath,
  type TasteEntry,
} from '../src/utils/design-taste';

function makeTmp(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'cm-taste-'));
}

describe('design-taste', () => {
  let tmp: string;
  beforeEach(() => {
    tmp = makeTmp();
  });

  it('records an entry and roundtrips', () => {
    recordTaste(tmp, { dimension: 'color', value: '#FF6B35', verdict: 'approved' });
    const live = loadTaste(tmp);
    expect(live).toHaveLength(1);
    expect(live[0].value).toBe('#FF6B35');
    expect(live[0].weight).toBeCloseTo(1.0, 3);
  });

  it('is idempotent on (dimension, value, verdict)', () => {
    recordTaste(tmp, { dimension: 'color', value: '#000', verdict: 'approved' });
    recordTaste(tmp, { dimension: 'color', value: '#000', verdict: 'approved' });
    const file = JSON.parse(fs.readFileSync(tastePath(tmp), 'utf8'));
    expect(file.entries).toHaveLength(1);
  });

  it('decays 5%/week and drops below 0.1', () => {
    const old: TasteEntry = {
      dimension: 'color',
      value: '#abc',
      verdict: 'approved',
      weight: 1.0,
      ts: new Date('2026-01-01T00:00:00Z').toISOString(),
    };
    // ~18 weeks later → 0.95^18 ≈ 0.397
    const after18w = decayEntries([old], new Date('2026-05-07T00:00:00Z'));
    expect(after18w).toHaveLength(1);
    expect(after18w[0].weight).toBeGreaterThan(0.3);
    expect(after18w[0].weight).toBeLessThan(0.5);

    // 100 weeks → below 0.1, dropped
    const after100w = decayEntries([old], new Date('2027-12-01T00:00:00Z'));
    expect(after100w).toHaveLength(0);
  });

  it('topTaste splits approved vs rejected and respects n', () => {
    recordTaste(tmp, { dimension: 'color', value: 'red', verdict: 'approved' });
    recordTaste(tmp, { dimension: 'color', value: 'blue', verdict: 'approved' });
    recordTaste(tmp, { dimension: 'color', value: 'magenta', verdict: 'rejected' });
    recordTaste(tmp, { dimension: 'font', value: 'Comic Sans', verdict: 'rejected' });

    const colors = topTaste(tmp, 'color', 1);
    expect(colors.approved).toHaveLength(1);
    expect(colors.rejected).toHaveLength(1);
    expect(colors.rejected[0].value).toBe('magenta');

    const fonts = topTaste(tmp, 'font');
    expect(fonts.approved).toHaveLength(0);
    expect(fonts.rejected[0].value).toBe('Comic Sans');
  });

  it('compactTaste drops stale entries on disk', () => {
    // Hand-write an old entry directly
    fs.mkdirSync(path.join(tmp, '.cm'), { recursive: true });
    fs.writeFileSync(
      tastePath(tmp),
      JSON.stringify({
        version: 1,
        entries: [
          {
            dimension: 'color',
            value: 'olive',
            verdict: 'approved',
            weight: 1.0,
            ts: new Date('2020-01-01').toISOString(),
          },
        ],
      }),
    );
    const dropped = compactTaste(tmp, new Date('2026-05-07'));
    expect(dropped).toBe(1);
    const file = JSON.parse(fs.readFileSync(tastePath(tmp), 'utf8'));
    expect(file.entries).toHaveLength(0);
  });
});
