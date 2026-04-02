import fs from 'fs';
import path from 'path';

/**
 * Discovers and returns a list of available 'cm-' skills.
 */
export function getAvailableSkills(): string[] {
  try {
    const rootDir = path.resolve(__dirname, '..', '..');
    const skillsDir = path.join(rootDir, 'skills');
    
    if (!fs.existsSync(skillsDir)) {
      return [];
    }

    return fs.readdirSync(skillsDir)
      .filter(f => f.startsWith('cm-') && fs.statSync(path.join(skillsDir, f)).isDirectory());
  } catch {
    return [];
  }
}

/**
 * Returns the count of available 'cm-' skills.
 */
export function getSkillCount(): number {
  return getAvailableSkills().length;
}
