/**
 * Skills-Lock — record canonical hashes for every active skill.
 *
 * Stored as `skills-lock.json` at the package root. Each entry records the
 * version (frontmatter), a sha256 of the SKILL.md content, and a generated
 * timestamp. The postinstall verifier compares the current SKILL.md hashes
 * against the lock and warns on drift.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface SkillLockEntry {
  /** Canonical hash of SKILL.md contents (sha256 hex). */
  sha256: string;
  /** Skill version from frontmatter when present. */
  version?: string;
  /** Whether the skill is marked deprecated. */
  deprecated?: boolean;
}

export interface SkillsLockFile {
  version: 2;
  generated_at: string;
  /** Map keyed by skill folder name (e.g. "cm-planning"). */
  skills: Record<string, SkillLockEntry>;
}

function sha256OfFile(file: string): string {
  const buf = fs.readFileSync(file);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function parseFrontmatter(text: string): { version?: string; deprecated?: boolean } {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const out: { version?: string; deprecated?: boolean } = {};
  const v = m[1].match(/^version:\s*['"]?([\w.\-+]+)['"]?\s*$/m);
  if (v) out.version = v[1];
  const d = m[1].match(/^deprecated:\s*(true|false)\s*$/m);
  if (d) out.deprecated = d[1] === 'true';
  return out;
}

export function buildSkillsLock(packageRoot: string): SkillsLockFile {
  const skillsDir = path.join(packageRoot, 'skills');
  const skills: Record<string, SkillLockEntry> = {};
  if (fs.existsSync(skillsDir)) {
    for (const entry of fs.readdirSync(skillsDir, { withFileTypes: true })) {
      if (!entry.isDirectory() || !entry.name.startsWith('cm-')) continue;
      const skillFile = path.join(skillsDir, entry.name, 'SKILL.md');
      if (!fs.existsSync(skillFile)) continue;
      const text = fs.readFileSync(skillFile, 'utf8');
      const fm = parseFrontmatter(text);
      skills[entry.name] = {
        sha256: sha256OfFile(skillFile),
        ...(fm.version ? { version: fm.version } : {}),
        ...(fm.deprecated ? { deprecated: true } : {}),
      };
    }
  }
  return {
    version: 2,
    generated_at: new Date().toISOString(),
    skills,
  };
}

export function writeSkillsLock(packageRoot: string): string {
  const lock = buildSkillsLock(packageRoot);
  const file = path.join(packageRoot, 'skills-lock.json');
  fs.writeFileSync(file, JSON.stringify(lock, null, 2) + '\n', 'utf8');
  return file;
}

export interface VerifyResult {
  ok: boolean;
  missing: string[];   // in lock but skill folder absent
  drifted: string[];   // hash mismatch
  unlocked: string[];  // skills present but no lock entry
}

export function verifySkillsLock(packageRoot: string): VerifyResult {
  const lockPath = path.join(packageRoot, 'skills-lock.json');
  const result: VerifyResult = { ok: true, missing: [], drifted: [], unlocked: [] };
  if (!fs.existsSync(lockPath)) {
    result.ok = false;
    return result;
  }
  let lock: SkillsLockFile;
  try {
    lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  } catch {
    result.ok = false;
    return result;
  }
  const current = buildSkillsLock(packageRoot);
  for (const [name, entry] of Object.entries(lock.skills ?? {})) {
    const cur = current.skills[name];
    if (!cur) {
      result.missing.push(name);
      continue;
    }
    if (cur.sha256 !== entry.sha256) result.drifted.push(name);
  }
  for (const name of Object.keys(current.skills)) {
    if (!(lock.skills ?? {})[name]) result.unlocked.push(name);
  }
  result.ok = result.missing.length === 0 && result.drifted.length === 0;
  return result;
}
