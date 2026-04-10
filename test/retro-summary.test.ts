import { describe, it, expect } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  loadRetroEntries,
  filterSince,
  countByTool,
  formatRetroJson,
} from '../src/retro-summary';

describe('retro-summary', () => {
  it('loads and filters by since', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cm-retro-'));
    const j = path.join(tmp, 'x.jsonl');
    fs.writeFileSync(
      j,
      [
        JSON.stringify({ ts: '2026-01-01T00:00:00.000Z', tool: 'a', note: 'old' }),
        JSON.stringify({ ts: '2026-06-01T12:00:00.000Z', tool: 'b', note: 'new' }),
      ].join('\n') + '\n',
      'utf8'
    );
    const all = loadRetroEntries(j);
    expect(all).toHaveLength(2);
    const cut = filterSince(all, '2026-04-01T00:00:00.000Z');
    expect(cut).toHaveLength(1);
    expect(cut[0].note).toBe('new');
    expect(countByTool(cut)).toEqual({ b: 1 });
    const json = JSON.parse(formatRetroJson(cut, countByTool(cut)));
    expect(json.total).toBe(1);
    expect(json.by_tool.b).toBe(1);
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('skips malformed jsonl lines', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cm-retro-'));
    const j = path.join(tmp, 'x.jsonl');
    fs.writeFileSync(j, '{bad\n' + JSON.stringify({ ts: '2026-01-02T00:00:00Z', note: 'ok' }) + '\n', 'utf8');
    const entries = loadRetroEntries(j);
    expect(entries).toHaveLength(1);
    fs.rmSync(tmp, { recursive: true, force: true });
  });
});
