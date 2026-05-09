import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { PlatformInstaller, InstallOptions, InstallResult, DetectResult } from '../types';
import { homeDir } from '../paths';
import { copySkills } from '../copy';

/**
 * Claude Code: prefers `claude plugin install` via the official marketplace.
 * Falls back to copying skills into ~/.claude/skills (or ./.claude/skills for project scope).
 */
export const claudeCode: PlatformInstaller = {
  id: 'claude-code',
  name: 'Claude Code',
  emoji: '🟣',

  detect(): DetectResult {
    const r = spawnSync('claude', ['--version'], { stdio: 'pipe' });
    if (r.status === 0) return { installed: true, detail: (r.stdout || '').toString().trim() };
    if (fs.existsSync(path.join(homeDir(), '.claude'))) {
      return { installed: true, detail: '~/.claude exists' };
    }
    return { installed: false };
  },

  async install(opts: InstallOptions): Promise<InstallResult> {
    const target =
      opts.scope === 'project'
        ? path.resolve(opts.cwd || process.cwd(), '.claude/skills')
        : path.join(homeDir(), '.claude/skills');

    const claudeAvailable = spawnSync('claude', ['--version'], { stdio: 'pipe' }).status === 0;

    if (claudeAvailable && !opts.dryRun) {
      spawnSync('claude', ['plugin', 'marketplace', 'remove', 'cody-master'], { stdio: 'ignore' });
      const m = spawnSync(
        'claude',
        ['plugin', 'marketplace', 'add', 'tody-agent/codymaster'],
        { stdio: opts.silent ? 'ignore' : 'inherit' }
      );
      const i = spawnSync(
        'claude',
        ['plugin', 'install', 'cm@codymaster', '--scope', opts.scope],
        { stdio: opts.silent ? 'ignore' : 'inherit' }
      );
      if (m.status === 0 && i.status === 0) {
        return {
          platform: this.id,
          installed: ['cm@codymaster (via marketplace)'],
          skipped: [],
          targetPath: `${opts.scope} scope`,
          postInstallHints: [
            'Run `/cm:demo` inside Claude Code to verify the plugin loaded.',
          ],
        };
      }
    }

    const { installed, skipped } = copySkills(target, 'raw', opts);
    return {
      platform: this.id,
      installed,
      skipped,
      targetPath: target,
      postInstallHints: claudeAvailable
        ? ['Restart Claude Code to pick up the skills.']
        : [
            'Claude Code CLI not detected — copied skills as a fallback.',
            'Install Claude Code from https://claude.ai/code, then run:',
            '  claude plugin marketplace add tody-agent/codymaster',
            `  claude plugin install cm@codymaster --scope ${opts.scope}`,
          ],
    };
  },
};
