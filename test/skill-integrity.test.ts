import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  extractFrontmatterName,
  setFrontmatterName,
  safeWriteSkillMd,
  scanSkillIntegrity,
  formatIntegrityReport,
  SkillIntegrityError,
} from '../src/skill-integrity';

let tmpDir: string;

function skillMd(name: string, body = 'content'): string {
  return `---\nname: ${name}\ndescription: Test ${name}\n---\n\n# ${name}\n\n${body}\n`;
}

function writeSkill(dir: string, folder: string, content: string): string {
  const skillDir = path.join(dir, 'skills', folder);
  fs.mkdirSync(skillDir, { recursive: true });
  const p = path.join(skillDir, 'SKILL.md');
  fs.writeFileSync(p, content, 'utf-8');
  return p;
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cm-integrity-test-'));
  fs.mkdirSync(path.join(tmpDir, 'skills'), { recursive: true });
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('extractFrontmatterName', () => {
  it('reads the name from frontmatter', () => {
    expect(extractFrontmatterName(skillMd('cm-foo'))).toBe('cm-foo');
  });
  it('strips quotes', () => {
    expect(extractFrontmatterName('---\nname: "cm-bar"\n---\n')).toBe('cm-bar');
  });
  it('returns null when no frontmatter', () => {
    expect(extractFrontmatterName('# just a heading\n')).toBeNull();
  });
  it('returns null when name field absent', () => {
    expect(extractFrontmatterName('---\ndescription: x\n---\n')).toBeNull();
  });
});

describe('setFrontmatterName', () => {
  it('replaces an existing name', () => {
    const out = setFrontmatterName(skillMd('cm-foo'), 'cm-foo-v1');
    expect(extractFrontmatterName(out)).toBe('cm-foo-v1');
    expect(out).toContain('description: Test cm-foo'); // other fields preserved
  });
  it('adds frontmatter when missing', () => {
    const out = setFrontmatterName('# body only\n', 'cm-new');
    expect(extractFrontmatterName(out)).toBe('cm-new');
  });
  it('does not treat $ in name as a backreference', () => {
    const out = setFrontmatterName(skillMd('cm-foo'), 'cm-$weird');
    expect(extractFrontmatterName(out)).toBe('cm-$weird');
  });
});

describe('safeWriteSkillMd', () => {
  it('writes when frontmatter name matches the folder', () => {
    const p = path.join(tmpDir, 'skills', 'cm-foo', 'SKILL.md');
    safeWriteSkillMd(p, skillMd('cm-foo'));
    expect(extractFrontmatterName(fs.readFileSync(p, 'utf-8'))).toBe('cm-foo');
  });

  it('refuses (throws + no write) when name does not match folder', () => {
    const p = path.join(tmpDir, 'skills', 'cm-foo', 'SKILL.md');
    expect(() => safeWriteSkillMd(p, skillMd('cm-other'))).toThrow(SkillIntegrityError);
    expect(fs.existsSync(p)).toBe(false);
  });

  it('refuses content without a name', () => {
    const p = path.join(tmpDir, 'skills', 'cm-foo', 'SKILL.md');
    expect(() => safeWriteSkillMd(p, '# no frontmatter\n')).toThrow(/no frontmatter/);
    expect(fs.existsSync(p)).toBe(false);
  });

  it('does NOT clobber an existing good skill when the new content is mislabeled', () => {
    const p = writeSkill(tmpDir, 'cm-ux-master', skillMd('cm-ux-master', 'real ux content'));
    // Attempt the exact corruption class: continuity body into ux-master folder
    expect(() => safeWriteSkillMd(p, skillMd('cm-continuity', 'memory protocol'))).toThrow(SkillIntegrityError);
    // Original survives untouched
    expect(fs.readFileSync(p, 'utf-8')).toContain('real ux content');
    expect(extractFrontmatterName(fs.readFileSync(p, 'utf-8'))).toBe('cm-ux-master');
  });

  it('backs up the existing file before a valid overwrite when backupDir is set', () => {
    const p = writeSkill(tmpDir, 'cm-foo', skillMd('cm-foo', 'v1'));
    const backupDir = path.join(tmpDir, '.cm', 'skill-backups', 'cm-foo');
    const res = safeWriteSkillMd(p, skillMd('cm-foo', 'v2'), { backupDir });
    expect(res.backupPath).toBeTruthy();
    expect(fs.readFileSync(res.backupPath!, 'utf-8')).toContain('v1');
    expect(fs.readFileSync(p, 'utf-8')).toContain('v2');
  });
});

describe('scanSkillIntegrity', () => {
  it('reports no issues for a clean skills dir', () => {
    writeSkill(tmpDir, 'cm-a', skillMd('cm-a', 'aaa'));
    writeSkill(tmpDir, 'cm-b', skillMd('cm-b', 'bbb'));
    const issues = scanSkillIntegrity(path.join(tmpDir, 'skills'));
    expect(issues).toHaveLength(0);
    expect(formatIntegrityReport(issues)).toContain('all skills pass');
  });

  it('detects a name/folder mismatch (the cm-ux-master corruption signature)', () => {
    writeSkill(tmpDir, 'cm-ux-master', skillMd('cm-continuity', 'memory protocol'));
    const issues = scanSkillIntegrity(path.join(tmpDir, 'skills'));
    const mismatch = issues.find(i => i.type === 'name_mismatch');
    expect(mismatch).toBeDefined();
    expect(mismatch!.folder).toBe('cm-ux-master');
    expect(mismatch!.detail).toContain('cm-continuity');
  });

  it('detects duplicate (byte-identical) bodies across two skills', () => {
    // Same content under two folders — but names still match folders, so the
    // duplicate-content check is what catches a copy/clobber across skills.
    const shared = skillMd('cm-dup', 'identical');
    writeSkill(tmpDir, 'cm-dup', shared);
    writeSkill(tmpDir, 'cm-dup2', shared);
    const issues = scanSkillIntegrity(path.join(tmpDir, 'skills'));
    expect(issues.filter(i => i.type === 'duplicate_content').length).toBe(2);
  });

  it('flags a missing name field', () => {
    writeSkill(tmpDir, 'cm-nameless', '---\ndescription: no name\n---\n# body\n');
    const issues = scanSkillIntegrity(path.join(tmpDir, 'skills'));
    expect(issues.some(i => i.type === 'missing_name' && i.folder === 'cm-nameless')).toBe(true);
  });

  it('ignores underscore and dot folders and non-skill dirs', () => {
    fs.mkdirSync(path.join(tmpDir, 'skills', '_shared'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'skills', '_shared', 'SKILL.md'), skillMd('whatever'), 'utf-8');
    fs.mkdirSync(path.join(tmpDir, 'skills', 'scripts'), { recursive: true }); // no SKILL.md
    writeSkill(tmpDir, 'cm-a', skillMd('cm-a'));
    const issues = scanSkillIntegrity(path.join(tmpDir, 'skills'));
    expect(issues).toHaveLength(0);
  });
});
