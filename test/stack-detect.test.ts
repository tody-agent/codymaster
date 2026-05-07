import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { detectStack, renderStackMarkdown, writeProjectSkills } from '../src/indexer/stack-detect';

function tmpProject(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'cm-stack-'));
}

describe('stack-detect', () => {
  let dir: string;
  beforeEach(() => { dir = tmpProject(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it('returns unknown when no signals present', () => {
    const r = detectStack(dir);
    expect(r.kinds).toContain('unknown');
    expect(r.frameworks.length).toBe(0);
  });

  it('detects node + react from package.json', () => {
    fs.writeFileSync(
      path.join(dir, 'package.json'),
      JSON.stringify({ dependencies: { react: '18.0.0', next: '14.0.0' } }),
    );
    const r = detectStack(dir);
    expect(r.kinds).toContain('node');
    expect(r.frameworks.find((f) => f.id === 'react')).toBeDefined();
    expect(r.frameworks.find((f) => f.id === 'next')).toBeDefined();
    expect(r.suggested_skills).toContain('cm-design-system');
  });

  it('detects python via pyproject.toml', () => {
    fs.writeFileSync(
      path.join(dir, 'pyproject.toml'),
      `[project]\ndependencies = ["django>=5", "pytest"]\n`,
    );
    const r = detectStack(dir);
    expect(r.kinds).toContain('python');
    expect(r.frameworks.find((f) => f.id === 'django')).toBeDefined();
    expect(r.frameworks.find((f) => f.id === 'pytest')).toBeDefined();
  });

  it('detects rust via Cargo.toml', () => {
    fs.writeFileSync(path.join(dir, 'Cargo.toml'), `[dependencies]\naxum = "0.7"\n`);
    const r = detectStack(dir);
    expect(r.kinds).toContain('rust');
    expect(r.frameworks.find((f) => f.id === 'axum')).toBeDefined();
  });

  it('writeProjectSkills writes .cm/project-skills.md', () => {
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ dependencies: { react: '18' } }));
    const r = detectStack(dir);
    const file = writeProjectSkills(dir, r);
    expect(fs.existsSync(file)).toBe(true);
    const content = fs.readFileSync(file, 'utf8');
    expect(content).toContain('Project Stack');
    expect(content).toContain('react');
  });

  it('renderStackMarkdown is token-light', () => {
    const r = detectStack(dir);
    const md = renderStackMarkdown(r);
    expect(md.length).toBeLessThan(800);
  });
});
