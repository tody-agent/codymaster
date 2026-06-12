import { PLATFORMS, getPlatform } from './platforms';
import { InstallOptions, InstallResult, PlatformInstaller } from './types';

export interface DetectedPlatform {
  platform: PlatformInstaller;
  installed: boolean;
  detail?: string;
}

export function detectPlatforms(): DetectedPlatform[] {
  return PLATFORMS.map((platform) => {
    const r = platform.detect();
    return { platform, installed: r.installed, detail: r.detail };
  });
}

export function listPlatforms(): PlatformInstaller[] {
  return [...PLATFORMS];
}

export async function installToPlatform(
  id: string,
  opts: InstallOptions
): Promise<InstallResult> {
  const p = getPlatform(id);
  if (!p) throw new Error(`Unknown platform: ${id}. Run 'cm install --list' to see options.`);
  return p.install(opts);
}

export async function installToMany(
  ids: string[],
  opts: InstallOptions
): Promise<InstallResult[]> {
  const results: InstallResult[] = [];
  for (const id of ids) {
    results.push(await installToPlatform(id, opts));
  }
  return results;
}
