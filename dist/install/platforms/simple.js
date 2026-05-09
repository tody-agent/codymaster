"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.copilot = exports.amp = exports.amazonQ = exports.continueDev = exports.aider = exports.kiro = exports.cline = exports.windsurf = exports.claudeDesktop = exports.opencode = exports.codex = void 0;
const path = __importStar(require("path"));
const _simple_1 = require("./_simple");
const paths_1 = require("../paths");
const userOrProject = (userPath, projectRel) => (opts) => opts.scope === 'project'
    ? path.resolve(opts.cwd || process.cwd(), projectRel)
    : path.join((0, paths_1.homeDir)(), userPath);
exports.codex = (0, _simple_1.defineSimplePlatform)({
    id: 'codex',
    name: 'OpenAI Codex',
    emoji: '🟢',
    format: 'raw',
    detectPaths: ['~/.codex'],
    detectCommand: 'codex',
    targetPath: userOrProject('.codex/skills', '.codex/skills'),
    postInstallHints: (t) => [`Skills available under ${t}.`, 'Reference them from your AGENTS.md.'],
});
exports.opencode = (0, _simple_1.defineSimplePlatform)({
    id: 'opencode',
    name: 'OpenCode',
    emoji: '📦',
    format: 'raw',
    detectPaths: ['~/.opencode', './.opencode'],
    detectCommand: 'opencode',
    targetPath: userOrProject('.opencode/skills', '.opencode/skills'),
    postInstallHints: ['OpenCode auto-loads .opencode/skills/. Restart if it was open.'],
});
exports.claudeDesktop = (0, _simple_1.defineSimplePlatform)({
    id: 'claude-desktop',
    name: 'Claude Desktop',
    emoji: '🖥️',
    format: 'raw',
    detectPaths: process.platform === 'darwin'
        ? ['~/Library/Application Support/Claude']
        : process.platform === 'win32'
            ? [path.join(process.env.APPDATA || '', 'Claude')]
            : ['~/.config/Claude'],
    targetPath: () => {
        if (process.platform === 'darwin')
            return path.join((0, paths_1.homeDir)(), 'Library/Application Support/Claude/skills');
        if (process.platform === 'win32')
            return path.join(process.env.APPDATA || (0, paths_1.homeDir)(), 'Claude/skills');
        return path.join((0, paths_1.homeDir)(), '.config/Claude/skills');
    },
    postInstallHints: ['Restart Claude Desktop to pick up new skills.'],
});
exports.windsurf = (0, _simple_1.defineSimplePlatform)({
    id: 'windsurf',
    name: 'Windsurf',
    emoji: '🌊',
    format: 'raw',
    detectPaths: ['~/.windsurf', './.windsurf'],
    targetPath: userOrProject('.windsurf/rules', '.windsurf/rules'),
    postInstallHints: ['Windsurf auto-loads rules from .windsurf/rules/.'],
});
exports.cline = (0, _simple_1.defineSimplePlatform)({
    id: 'cline',
    name: 'Cline / RooCode',
    emoji: '🔶',
    format: 'raw',
    detectPaths: ['~/.cline', './.cline'],
    targetPath: userOrProject('.cline/skills', '.cline/skills'),
    postInstallHints: ['Reference skills from your Cline workflow config.'],
});
exports.kiro = (0, _simple_1.defineSimplePlatform)({
    id: 'kiro',
    name: 'Kiro',
    emoji: '🪁',
    format: 'raw',
    detectPaths: ['~/.kiro', './.kiro'],
    targetPath: userOrProject('.kiro/steering', '.kiro/steering'),
    postInstallHints: ['Kiro reads steering docs from .kiro/steering/.'],
});
exports.aider = (0, _simple_1.defineSimplePlatform)({
    id: 'aider',
    name: 'Aider',
    emoji: '🛠️',
    format: 'raw',
    detectPaths: ['~/.aider', '~/.aider.conf.yml'],
    detectCommand: 'aider',
    targetPath: () => path.join((0, paths_1.homeDir)(), '.aider/skills'),
    postInstallHints: [
        'Add to .aider.conf.yml:',
        '  read: - ~/.aider/skills/cm-planning/SKILL.md',
    ],
});
exports.continueDev = (0, _simple_1.defineSimplePlatform)({
    id: 'continue',
    name: 'Continue.dev',
    emoji: '➡️',
    format: 'md',
    detectPaths: ['~/.continue'],
    targetPath: () => path.join((0, paths_1.homeDir)(), '.continue/rules'),
    postInstallHints: ['Continue.dev auto-loads rules from ~/.continue/rules/.'],
});
exports.amazonQ = (0, _simple_1.defineSimplePlatform)({
    id: 'amazon-q',
    name: 'Amazon Q CLI',
    emoji: '🟠',
    format: 'raw',
    detectPaths: ['~/.aws/amazonq'],
    detectCommand: 'q',
    targetPath: () => path.join((0, paths_1.homeDir)(), '.aws/amazonq/skills'),
    postInstallHints: ['q chat --context ~/.aws/amazonq/skills/cm-planning/SKILL.md'],
});
exports.amp = (0, _simple_1.defineSimplePlatform)({
    id: 'amp',
    name: 'Amp',
    emoji: '⚡',
    format: 'raw',
    detectPaths: ['~/.amp'],
    detectCommand: 'amp',
    targetPath: () => path.join((0, paths_1.homeDir)(), '.amp/skills'),
    postInstallHints: ['Reference skills from your AGENTS.md or system prompt.'],
});
exports.copilot = (0, _simple_1.defineSimplePlatform)({
    id: 'copilot',
    name: 'GitHub Copilot',
    emoji: '🤖',
    format: 'md',
    detectPaths: ['./.github'],
    targetPath: () => path.resolve(process.cwd(), '.github/copilot-skills'),
    postInstallHints: (t) => [
        `Skills written to ${t}.`,
        'Append references in .github/copilot-instructions.md, e.g.:',
        '  See .github/copilot-skills/cm-planning.md',
    ],
});
