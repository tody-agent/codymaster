import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  initSprint,
  readSprintState,
  completeSprintStep,
  skipSprintStep,
  resetSprint,
} from '../src/sprint-pipeline';

describe('sprint-pipeline', () => {
  let tmp: string;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cm-sprint-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('skip advances current step and writes stub artifact', () => {
    initSprint(tmp);
    skipSprintStep(tmp, 'brainstorm');
    const st = readSprintState(tmp)!;
    expect(st.current_index).toBe(1);
    expect(st.skipped).toEqual(['brainstorm']);
    const art = path.join(tmp, '.cm', 'sprint', 'artifacts', 'brainstorm.md');
    expect(fs.readFileSync(art, 'utf8')).toContain('Skipped');
    const ev = fs.readFileSync(path.join(tmp, '.cm', 'sprint', 'events.jsonl'), 'utf8');
    expect(ev).toContain('"type":"skip"');
  });

  it('skip rejects wrong step', () => {
    initSprint(tmp);
    expect(() => skipSprintStep(tmp, 'plan')).toThrow(/Expected step "brainstorm"/);
  });

  it('complete leaves skipped empty and advances', () => {
    initSprint(tmp);
    completeSprintStep(tmp, 'brainstorm', '# done');
    const st = readSprintState(tmp)!;
    expect(st.completed).toEqual(['brainstorm']);
    expect(st.skipped).toEqual([]);
    expect(st.current_index).toBe(1);
  });

  it('reset with backup clears state and preserves backup files', () => {
    initSprint(tmp);
    skipSprintStep(tmp, 'brainstorm');
    const r = resetSprint(tmp, { backup: true });
    expect(r.ok).toBe(true);
    expect(r.backupDir).toBeDefined();
    expect(readSprintState(tmp)).toBeNull();
    expect(fs.existsSync(path.join(r.backupDir!, 'state.json'))).toBe(true);
    expect(fs.existsSync(path.join(r.backupDir!, 'events.jsonl'))).toBe(true);
    initSprint(tmp);
    expect(readSprintState(tmp)!.current_index).toBe(0);
  });

  it('reset without backup does not write backup dir', () => {
    initSprint(tmp);
    const r = resetSprint(tmp, { backup: false });
    expect(r.ok).toBe(true);
    expect(r.backupDir).toBeUndefined();
    const backupRoot = path.join(tmp, '.cm', 'sprint', 'backup');
    expect(fs.existsSync(backupRoot)).toBe(false);
  });

  it('reset reports no_sprint_data when empty project', () => {
    const r = resetSprint(tmp);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('no_sprint_data');
  });

  it('readSprintState normalizes v1 file without skipped', () => {
    initSprint(tmp);
    const stPath = path.join(tmp, '.cm', 'sprint', 'state.json');
    const raw = JSON.parse(fs.readFileSync(stPath, 'utf8')) as Record<string, unknown>;
    raw.version = 1;
    delete raw.skipped;
    fs.writeFileSync(stPath, JSON.stringify(raw, null, 2));
    const st = readSprintState(tmp)!;
    expect(st.skipped).toEqual([]);
    expect(st.version).toBe(1);
  });
});
