import * as fs from 'fs';
import * as path from 'path';
import { PlatformInstaller, InstallOptions, InstallResult, DetectResult } from '../types';
import { homeDir } from '../paths';
import { copySkills } from '../copy';

const HINT_LINE = '@~/.gemini/antigravity/skills/cm-skill-index/SKILL.md';

export const antigravity: PlatformInstaller = {
  id: 'antigravity',
  name: 'Google Antigravity / Gemini',
  emoji: '✦',

  detect(): DetectResult {
    if (fs.existsSync(path.join(homeDir(), '.gemini'))) {
      return { installed: true, detail: '~/.gemini exists' };
    }
    return { installed: false };
  },

  async install(opts: InstallOptions): Promise<InstallResult> {
    const target = path.join(homeDir(), '.gemini/antigravity/skills');
    const { installed, skipped } = copySkills(target, 'raw', opts);
    if (!opts.dryRun) ensureGeminiMdHint();
    return {
      platform: this.id,
      installed,
      skipped,
      targetPath: target,
      postInstallHints: [
        `GEMINI.md should reference: ${HINT_LINE}`,
        'Restart Gemini / Antigravity if it was open during install.',
      ],
    };
  },
};

function ensureGeminiMdHint(): void {
  const file = path.join(homeDir(), '.gemini/GEMINI.md');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  let body = '';
  if (fs.existsSync(file)) body = fs.readFileSync(file, 'utf-8');
  if (body.includes(HINT_LINE)) return;
  const block =
    (body && !body.endsWith('\n') ? '\n' : '') +
    `\n# CodyMaster skills\n${HINT_LINE}\n`;
  fs.writeFileSync(file, body + block);
}
