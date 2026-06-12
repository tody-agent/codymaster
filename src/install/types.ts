export type Scope = 'user' | 'project';
export type Profile = 'core' | 'growth' | 'design' | 'knowledge' | 'full';
export type SkillFormat = 'raw' | 'md' | 'mdc';

export interface InstallOptions {
  scope: Scope;
  profile: Profile;
  dryRun?: boolean;
  cwd?: string;
  silent?: boolean;
}

export interface InstallResult {
  platform: string;
  installed: string[];
  skipped: string[];
  targetPath: string;
  postInstallHints: string[];
}

export interface DetectResult {
  installed: boolean;
  detail?: string;
}

export interface PlatformInstaller {
  id: string;
  name: string;
  emoji: string;
  detect(): DetectResult;
  install(opts: InstallOptions): Promise<InstallResult>;
  uninstall?(opts: InstallOptions): Promise<void>;
}
