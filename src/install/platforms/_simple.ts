import * as fs from 'fs';
import * as path from 'path';
import { PlatformInstaller, InstallOptions, InstallResult, DetectResult, SkillFormat } from '../types';
import { homeDir } from '../paths';
import { copySkills } from '../copy';

export interface SimplePlatformConfig {
  id: string;
  name: string;
  emoji: string;
  format: SkillFormat;
  /** Sentinel paths (absolute or ~/) that indicate the platform is installed. */
  detectPaths: string[];
  /** Detect by command on PATH. */
  detectCommand?: string;
  /** Path resolver for the install target. */
  targetPath: (opts: InstallOptions) => string;
  postInstallHints?: string[] | ((targetPath: string) => string[]);
}

export function defineSimplePlatform(cfg: SimplePlatformConfig): PlatformInstaller {
  return {
    id: cfg.id,
    name: cfg.name,
    emoji: cfg.emoji,
    detect(): DetectResult {
      for (const p of cfg.detectPaths) {
        const expanded = p.startsWith('~') ? path.join(homeDir(), p.slice(1)) : p;
        if (fs.existsSync(expanded)) return { installed: true, detail: p };
      }
      if (cfg.detectCommand) {
        const r = require('child_process').spawnSync(cfg.detectCommand, ['--version'], { stdio: 'pipe' });
        if (r.status === 0) return { installed: true, detail: `${cfg.detectCommand} on PATH` };
      }
      return { installed: false };
    },
    async install(opts: InstallOptions): Promise<InstallResult> {
      const target = cfg.targetPath(opts);
      const { installed, skipped } = copySkills(target, cfg.format, opts);
      const hints =
        typeof cfg.postInstallHints === 'function'
          ? cfg.postInstallHints(target)
          : cfg.postInstallHints || [];
      return {
        platform: cfg.id,
        installed,
        skipped,
        targetPath: target,
        postInstallHints: hints,
      };
    },
  };
}
