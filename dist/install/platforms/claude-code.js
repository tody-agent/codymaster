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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.claudeCode = void 0;
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const paths_1 = require("../paths");
const copy_1 = require("../copy");
/**
 * Claude Code: prefers `claude plugin install` via the official marketplace.
 * Falls back to copying skills into ~/.claude/skills (or ./.claude/skills for project scope).
 */
exports.claudeCode = {
    id: 'claude-code',
    name: 'Claude Code',
    emoji: '🟣',
    detect() {
        const r = (0, child_process_1.spawnSync)('claude', ['--version'], { stdio: 'pipe' });
        if (r.status === 0)
            return { installed: true, detail: (r.stdout || '').toString().trim() };
        if (fs.existsSync(path.join((0, paths_1.homeDir)(), '.claude'))) {
            return { installed: true, detail: '~/.claude exists' };
        }
        return { installed: false };
    },
    install(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const target = opts.scope === 'project'
                ? path.resolve(opts.cwd || process.cwd(), '.claude/skills')
                : path.join((0, paths_1.homeDir)(), '.claude/skills');
            const claudeAvailable = (0, child_process_1.spawnSync)('claude', ['--version'], { stdio: 'pipe' }).status === 0;
            if (claudeAvailable && !opts.dryRun) {
                (0, child_process_1.spawnSync)('claude', ['plugin', 'marketplace', 'remove', 'cody-master'], { stdio: 'ignore' });
                const m = (0, child_process_1.spawnSync)('claude', ['plugin', 'marketplace', 'add', 'tody-agent/codymaster'], { stdio: opts.silent ? 'ignore' : 'inherit' });
                const i = (0, child_process_1.spawnSync)('claude', ['plugin', 'install', 'cm@codymaster', '--scope', opts.scope], { stdio: opts.silent ? 'ignore' : 'inherit' });
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
            const { installed, skipped } = (0, copy_1.copySkills)(target, 'raw', opts);
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
        });
    },
};
