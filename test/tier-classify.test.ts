import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { classifyProject, renderTierMarkdown } from '../src/tier-classify';

function tmp(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'cm-tier-'));
}

describe('tier-classify', () => {
  let dir: string;
  beforeEach(() => { dir = tmp(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it('LITE for empty project', () => {
    const r = classifyProject(dir);
    expect(r.tier).toBe('LITE');
    expect(r.vibe_mode_default).toBe('OFF');
    expect(r.prefer_tldr).toBe(true);
  });

  it('LITE for small project under thresholds', () => {
    fs.writeFileSync(path.join(dir, 'a.ts'), 'console.log(1)\n');
    fs.writeFileSync(path.join(dir, 'b.ts'), 'const x=1\n');
    const r = classifyProject(dir);
    expect(r.tier).toBe('LITE');
  });

  it('STANDARD when files exceed LITE threshold', () => {
    for (let i = 0; i < 60; i++) {
      fs.writeFileSync(path.join(dir, `f${i}.ts`), 'export const x = 1\n');
    }
    const r = classifyProject(dir);
    expect(['STANDARD', 'PROFESSIONAL']).toContain(r.tier);
  });

  it('counts dependencies from package.json', () => {
    fs.writeFileSync(
      path.join(dir, 'package.json'),
      JSON.stringify({ dependencies: { a: '1', b: '2' }, devDependencies: { c: '3' } }),
    );
    const r = classifyProject(dir);
    expect(r.metrics.deps).toBe(3);
  });

  it('renderTierMarkdown includes tier name', () => {
    const r = classifyProject(dir);
    expect(renderTierMarkdown(r)).toContain(r.tier);
  });

  it('skips node_modules', () => {
    const nm = path.join(dir, 'node_modules');
    fs.mkdirSync(nm);
    for (let i = 0; i < 100; i++) {
      fs.writeFileSync(path.join(nm, `n${i}.js`), 'x=1\n');
    }
    const r = classifyProject(dir);
    expect(r.metrics.files).toBe(0);
  });
});
