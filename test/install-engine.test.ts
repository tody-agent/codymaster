import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { installToPlatform, listPlatforms, detectPlatforms } from '../src/install/engine';
import { listAllSkills, loadProfileAllowlist } from '../src/install/profiles';

describe('install/engine', () => {
  let tmpHome: string;
  let prevHome: string | undefined;
  let prevCwd: string;

  beforeAll(() => {
    tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'cm-install-'));
    prevHome = process.env.HOME;
    process.env.HOME = tmpHome;
    prevCwd = process.cwd();
  });

  afterAll(() => {
    process.env.HOME = prevHome;
    process.chdir(prevCwd);
    fs.rmSync(tmpHome, { recursive: true, force: true });
  });

  it('lists 14 supported platforms', () => {
    const ids = listPlatforms().map((p) => p.id);
    expect(ids).toContain('claude-code');
    expect(ids).toContain('cursor');
    expect(ids).toContain('antigravity');
    expect(ids).toContain('codex');
    expect(ids).toContain('opencode');
    expect(ids.length).toBeGreaterThanOrEqual(14);
  });

  it('detectPlatforms returns one entry per platform', () => {
    const detected = detectPlatforms();
    expect(detected.length).toBe(listPlatforms().length);
    for (const d of detected) expect(typeof d.installed).toBe('boolean');
  }, 20000);

  it('core profile has fewer skills than full', () => {
    const all = listAllSkills();
    const core = loadProfileAllowlist('core');
    expect(core).not.toBeNull();
    expect(core!.length).toBeGreaterThan(0);
    expect(core!.length).toBeLessThan(all.length);
    expect(loadProfileAllowlist('full')).toBeNull();
  });

  it('rejects an unknown profile', () => {
    expect(() => loadProfileAllowlist('nope' as any)).toThrow(/Profile not found/);
  });

  it('installs antigravity in dry-run without writing', async () => {
    const r = await installToPlatform('antigravity', {
      profile: 'core',
      scope: 'user',
      dryRun: true,
    });
    expect(r.platform).toBe('antigravity');
    expect(r.installed.length).toBeGreaterThan(0);
    expect(fs.existsSync(path.join(tmpHome, '.gemini'))).toBe(false);
  });

  it('installs cursor with mdc format', async () => {
    const r = await installToPlatform('cursor', {
      profile: 'core',
      scope: 'user',
    });
    const target = path.join(tmpHome, '.cursor/rules');
    expect(r.targetPath).toBe(target);
    expect(fs.existsSync(target)).toBe(true);
    const files = fs.readdirSync(target).filter((f) => f.endsWith('.mdc'));
    expect(files.length).toBe(r.installed.length);
    const sample = fs.readFileSync(path.join(target, files[0]), 'utf-8');
    expect(sample.startsWith('---\n')).toBe(true);
    expect(sample).toMatch(/description:/);
  });

  it('installs antigravity for real and writes GEMINI.md hint', async () => {
    const r = await installToPlatform('antigravity', {
      profile: 'core',
      scope: 'user',
    });
    expect(fs.existsSync(r.targetPath)).toBe(true);
    const sampleSkill = fs.readdirSync(r.targetPath)[0];
    expect(fs.existsSync(path.join(r.targetPath, sampleSkill, 'SKILL.md'))).toBe(true);
    const gemini = fs.readFileSync(path.join(tmpHome, '.gemini/GEMINI.md'), 'utf-8');
    expect(gemini).toMatch(/cm-skill-index/);
  });

  it('rejects an unknown platform', async () => {
    await expect(
      installToPlatform('nonexistent', { profile: 'core', scope: 'user' })
    ).rejects.toThrow(/Unknown platform/);
  });
});
