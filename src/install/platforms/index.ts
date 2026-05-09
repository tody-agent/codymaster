import { PlatformInstaller } from '../types';
import { claudeCode } from './claude-code';
import { cursor } from './cursor';
import { antigravity } from './antigravity';
import {
  codex,
  opencode,
  claudeDesktop,
  windsurf,
  cline,
  kiro,
  aider,
  continueDev,
  amazonQ,
  amp,
  copilot,
} from './simple';

export const PLATFORMS: PlatformInstaller[] = [
  claudeCode,
  claudeDesktop,
  cursor,
  windsurf,
  antigravity,
  codex,
  opencode,
  cline,
  kiro,
  copilot,
  aider,
  continueDev,
  amazonQ,
  amp,
];

export function getPlatform(id: string): PlatformInstaller | undefined {
  return PLATFORMS.find((p) => p.id === id);
}
