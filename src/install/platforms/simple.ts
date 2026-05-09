import * as path from 'path';
import { defineSimplePlatform } from './_simple';
import { homeDir } from '../paths';
import { InstallOptions } from '../types';

const userOrProject = (userPath: string, projectRel: string) => (opts: InstallOptions) =>
  opts.scope === 'project'
    ? path.resolve(opts.cwd || process.cwd(), projectRel)
    : path.join(homeDir(), userPath);

export const codex = defineSimplePlatform({
  id: 'codex',
  name: 'OpenAI Codex',
  emoji: '🟢',
  format: 'raw',
  detectPaths: ['~/.codex'],
  detectCommand: 'codex',
  targetPath: userOrProject('.codex/skills', '.codex/skills'),
  postInstallHints: (t) => [`Skills available under ${t}.`, 'Reference them from your AGENTS.md.'],
});

export const opencode = defineSimplePlatform({
  id: 'opencode',
  name: 'OpenCode',
  emoji: '📦',
  format: 'raw',
  detectPaths: ['~/.opencode', './.opencode'],
  detectCommand: 'opencode',
  targetPath: userOrProject('.opencode/skills', '.opencode/skills'),
  postInstallHints: ['OpenCode auto-loads .opencode/skills/. Restart if it was open.'],
});

export const claudeDesktop = defineSimplePlatform({
  id: 'claude-desktop',
  name: 'Claude Desktop',
  emoji: '🖥️',
  format: 'raw',
  detectPaths:
    process.platform === 'darwin'
      ? ['~/Library/Application Support/Claude']
      : process.platform === 'win32'
      ? [path.join(process.env.APPDATA || '', 'Claude')]
      : ['~/.config/Claude'],
  targetPath: () => {
    if (process.platform === 'darwin')
      return path.join(homeDir(), 'Library/Application Support/Claude/skills');
    if (process.platform === 'win32')
      return path.join(process.env.APPDATA || homeDir(), 'Claude/skills');
    return path.join(homeDir(), '.config/Claude/skills');
  },
  postInstallHints: ['Restart Claude Desktop to pick up new skills.'],
});

export const windsurf = defineSimplePlatform({
  id: 'windsurf',
  name: 'Windsurf',
  emoji: '🌊',
  format: 'raw',
  detectPaths: ['~/.windsurf', './.windsurf'],
  targetPath: userOrProject('.windsurf/rules', '.windsurf/rules'),
  postInstallHints: ['Windsurf auto-loads rules from .windsurf/rules/.'],
});

export const cline = defineSimplePlatform({
  id: 'cline',
  name: 'Cline / RooCode',
  emoji: '🔶',
  format: 'raw',
  detectPaths: ['~/.cline', './.cline'],
  targetPath: userOrProject('.cline/skills', '.cline/skills'),
  postInstallHints: ['Reference skills from your Cline workflow config.'],
});

export const kiro = defineSimplePlatform({
  id: 'kiro',
  name: 'Kiro',
  emoji: '🪁',
  format: 'raw',
  detectPaths: ['~/.kiro', './.kiro'],
  targetPath: userOrProject('.kiro/steering', '.kiro/steering'),
  postInstallHints: ['Kiro reads steering docs from .kiro/steering/.'],
});

export const aider = defineSimplePlatform({
  id: 'aider',
  name: 'Aider',
  emoji: '🛠️',
  format: 'raw',
  detectPaths: ['~/.aider', '~/.aider.conf.yml'],
  detectCommand: 'aider',
  targetPath: () => path.join(homeDir(), '.aider/skills'),
  postInstallHints: [
    'Add to .aider.conf.yml:',
    '  read: - ~/.aider/skills/cm-planning/SKILL.md',
  ],
});

export const continueDev = defineSimplePlatform({
  id: 'continue',
  name: 'Continue.dev',
  emoji: '➡️',
  format: 'md',
  detectPaths: ['~/.continue'],
  targetPath: () => path.join(homeDir(), '.continue/rules'),
  postInstallHints: ['Continue.dev auto-loads rules from ~/.continue/rules/.'],
});

export const amazonQ = defineSimplePlatform({
  id: 'amazon-q',
  name: 'Amazon Q CLI',
  emoji: '🟠',
  format: 'raw',
  detectPaths: ['~/.aws/amazonq'],
  detectCommand: 'q',
  targetPath: () => path.join(homeDir(), '.aws/amazonq/skills'),
  postInstallHints: ['q chat --context ~/.aws/amazonq/skills/cm-planning/SKILL.md'],
});

export const amp = defineSimplePlatform({
  id: 'amp',
  name: 'Amp',
  emoji: '⚡',
  format: 'raw',
  detectPaths: ['~/.amp'],
  detectCommand: 'amp',
  targetPath: () => path.join(homeDir(), '.amp/skills'),
  postInstallHints: ['Reference skills from your AGENTS.md or system prompt.'],
});

export const copilot = defineSimplePlatform({
  id: 'copilot',
  name: 'GitHub Copilot',
  emoji: '🤖',
  format: 'md',
  detectPaths: ['./.github'],
  targetPath: () =>
    path.resolve(process.cwd(), '.github/copilot-skills'),
  postInstallHints: (t) => [
    `Skills written to ${t}.`,
    'Append references in .github/copilot-instructions.md, e.g.:',
    '  See .github/copilot-skills/cm-planning.md',
  ],
});
