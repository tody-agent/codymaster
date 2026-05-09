import * as fs from 'fs';
import * as path from 'path';
import { Profile } from './types';
import { findCmRoot } from './paths';

const VALID_PROFILES: Profile[] = ['core', 'growth', 'design', 'knowledge', 'full'];

export function isValidProfile(p: string): p is Profile {
  return (VALID_PROFILES as string[]).includes(p);
}

/**
 * Load the skill allowlist for a profile. `full` returns null = no filter.
 */
export function loadProfileAllowlist(profile: Profile, cmRoot?: string): string[] | null {
  if (profile === 'full') return null;
  const root = cmRoot || findCmRoot();
  const file = path.join(root, 'skills', 'profiles', `${profile}.txt`);
  if (!fs.existsSync(file)) {
    throw new Error(`Profile not found: ${profile} (expected ${file})`);
  }
  const allow: string[] = [];
  for (const raw of fs.readFileSync(file, 'utf-8').split('\n')) {
    const line = raw.replace(/#.*$/, '').trim();
    if (line) allow.push(line);
  }
  return allow;
}

export function listAllSkills(cmRoot?: string): string[] {
  const root = cmRoot || findCmRoot();
  const skillsDir = path.join(root, 'skills');
  if (!fs.existsSync(skillsDir)) return [];
  return fs
    .readdirSync(skillsDir)
    .filter((n) => n.startsWith('cm-'))
    .filter((n) => fs.existsSync(path.join(skillsDir, n, 'SKILL.md')))
    .sort();
}
