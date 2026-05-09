import * as fs from 'fs';
import * as path from 'path';
import { SkillFormat, InstallOptions } from './types';
import { findCmRoot } from './paths';
import { loadProfileAllowlist, listAllSkills } from './profiles';

export interface CopyOutcome {
  installed: string[];
  skipped: string[];
}

/**
 * Copy skills to a target directory according to profile + format.
 * Mirrors install.sh `install_skills_to()` behavior.
 *
 *  raw  → cp -r skills/cm-foo/  →  <target>/cm-foo/
 *  md   → cp    SKILL.md         →  <target>/cm-foo.md
 *  mdc  → wrap with frontmatter  →  <target>/cm-foo.mdc   (Cursor format)
 */
export function copySkills(
  target: string,
  format: SkillFormat,
  opts: InstallOptions
): CopyOutcome {
  const root = findCmRoot();
  const allow = loadProfileAllowlist(opts.profile, root);
  const allSkills = listAllSkills(root);

  const installed: string[] = [];
  const skipped: string[] = [];

  if (!opts.dryRun) fs.mkdirSync(target, { recursive: true });

  for (const skillName of allSkills) {
    if (allow && !allow.includes(skillName)) {
      skipped.push(skillName);
      continue;
    }
    const skillDir = path.join(root, 'skills', skillName);
    const skillMd = path.join(skillDir, 'SKILL.md');
    if (!fs.existsSync(skillMd)) {
      skipped.push(skillName);
      continue;
    }

    if (opts.dryRun) {
      installed.push(skillName);
      continue;
    }

    if (format === 'mdc') {
      const out = path.join(target, `${skillName}.mdc`);
      const body = fs.readFileSync(skillMd, 'utf-8');
      const fm = `---\ndescription: ${skillName}\nglobs: *\n---\n`;
      fs.writeFileSync(out, fm + body);
    } else if (format === 'md') {
      fs.copyFileSync(skillMd, path.join(target, `${skillName}.md`));
    } else {
      copyDirRecursive(skillDir, path.join(target, skillName));
    }
    installed.push(skillName);
  }

  return { installed, skipped };
}

function copyDirRecursive(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDirRecursive(s, d);
    else if (entry.isFile()) fs.copyFileSync(s, d);
  }
}
