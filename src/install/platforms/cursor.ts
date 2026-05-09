import * as fs from 'fs';
import * as path from 'path';
import { PlatformInstaller, InstallOptions, InstallResult, DetectResult } from '../types';
import { homeDir } from '../paths';
import { copySkills } from '../copy';

export const cursor: PlatformInstaller = {
  id: 'cursor',
  name: 'Cursor',
  emoji: '⬡',

  detect(): DetectResult {
    if (fs.existsSync(path.join(homeDir(), '.cursor'))) {
      return { installed: true, detail: '~/.cursor exists' };
    }
    return { installed: false };
  },

  async install(opts: InstallOptions): Promise<InstallResult> {
    const target =
      opts.scope === 'project'
        ? path.resolve(opts.cwd || process.cwd(), '.cursor/rules')
        : path.join(homeDir(), '.cursor/rules');
    const { installed, skipped } = copySkills(target, 'mdc', opts);
    return {
      platform: this.id,
      installed,
      skipped,
      targetPath: target,
      postInstallHints: [
        'Cursor auto-loads .mdc rules — restart the IDE if it was open.',
      ],
    };
  },
};
