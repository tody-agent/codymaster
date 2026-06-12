"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerInstallCommands = registerInstallCommands;
const chalk_1 = __importDefault(require("chalk"));
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const engine_1 = require("../../install/engine");
const profiles_1 = require("../../install/profiles");
const repoRoot = path_1.default.join(__dirname, '..', '..', '..');
function registerInstallCommands(program) {
    program
        .command('install [platform]')
        .description('Install CodyMaster skills to an AI coding platform')
        .option('-p, --profile <name>', 'Skill profile: core | growth | design | knowledge | full', 'full')
        .option('-s, --scope <scope>', 'Install scope for platforms that support it: user | project', 'user')
        .option('--all', 'Install to every detected platform')
        .option('--list', 'List supported platforms and exit')
        .option('--sync', 'Sync skills to all platforms after install')
        .option('--dry-run', 'Show what would change without writing any files')
        .action((platform, opts) => __awaiter(this, void 0, void 0, function* () {
        if (opts.list)
            return printPlatforms();
        const profile = String(opts.profile);
        if (!(0, profiles_1.isValidProfile)(profile)) {
            console.error(chalk_1.default.red(`Invalid profile: ${profile}`));
            console.error(chalk_1.default.dim('Valid: core, growth, design, knowledge, full'));
            process.exit(1);
        }
        if (opts.scope !== 'user' && opts.scope !== 'project') {
            console.error(chalk_1.default.red(`Invalid scope: ${opts.scope} (expected user|project)`));
            process.exit(1);
        }
        const installOpts = {
            profile: profile,
            scope: opts.scope,
            dryRun: !!opts.dryRun,
        };
        let targets;
        if (opts.all) {
            targets = (0, engine_1.detectPlatforms)()
                .filter((p) => p.installed)
                .map((p) => p.platform.id);
            if (targets.length === 0) {
                console.error(chalk_1.default.red('No installed AI platforms detected.'));
                console.error(chalk_1.default.dim("Pass a platform id explicitly: cm install claude-code"));
                process.exit(1);
            }
        }
        else if (platform) {
            targets = [platform];
        }
        else {
            printPlatforms();
            console.log(chalk_1.default.dim('\nUsage: cm install <platform> [--profile core] [--scope user|project]'));
            return;
        }
        console.log(chalk_1.default.bold(`\nInstalling profile=${profile} scope=${opts.scope}${opts.dryRun ? ' (dry-run)' : ''}`));
        const results = yield (0, engine_1.installToMany)(targets, installOpts);
        for (const r of results) {
            console.log('');
            console.log(chalk_1.default.bold.magenta(`  ${r.platform}`));
            console.log(chalk_1.default.dim(`  → ${r.targetPath}`));
            console.log(chalk_1.default.green(`  ✓ ${r.installed.length} skills installed`) + chalk_1.default.dim(` (${r.skipped.length} skipped)`));
            for (const h of r.postInstallHints)
                console.log(chalk_1.default.cyan(`  ℹ  ${h}`));
        }
        // Auto-sync if --sync flag or --all flag
        if ((opts.sync || opts.all) && !opts.dryRun) {
            console.log(chalk_1.default.bold('\n  Syncing skills to all platforms...'));
            try {
                (0, child_process_1.execSync)('node scripts/build-skills.mjs --all-platforms', {
                    stdio: 'inherit',
                    cwd: repoRoot,
                    timeout: 60000,
                });
                console.log(chalk_1.default.green('  ✅ Skills synced to all platforms'));
            }
            catch (error) {
                console.log(chalk_1.default.yellow('  ⚠️  Sync failed (run `cm update --sync` manually)'));
            }
        }
        console.log('');
    }));
    // ─── Doctor Command ─────────────────────────────────────────
    program
        .command('doctor')
        .description('Check which AI platforms are installed and which have CodyMaster skills')
        .option('--sync-check', 'Check skill sync status across platforms')
        .action((opts) => {
        console.log(chalk_1.default.bold('\nDetected platforms:\n'));
        for (const d of (0, engine_1.detectPlatforms)()) {
            const mark = d.installed ? chalk_1.default.green('●') : chalk_1.default.dim('○');
            const detail = d.detail ? chalk_1.default.dim(`  (${d.detail})`) : '';
            console.log(`  ${mark} ${d.platform.emoji}  ${d.platform.name}${detail}`);
        }
        // Sync check
        if (opts.syncCheck) {
            console.log(chalk_1.default.bold('\n  Sync Status:\n'));
            checkSyncStatus();
        }
        console.log('');
    });
}
function checkSyncStatus() {
    const platforms = [
        { name: 'claude-code', dir: '.claude/skills' },
        { name: 'claude-desktop', dir: '.claude-desktop/skills' },
        { name: 'cursor', dir: '.cursor-plugin/skills' },
        { name: 'windsurf', dir: '.windsurf/skills' },
        { name: 'antigravity', dir: '.gemini/skills' },
        { name: 'codex', dir: '.codex/skills' },
        { name: 'opencode', dir: '.opencode/skills' },
        { name: 'cline', dir: '.cline/skills' },
        { name: 'kiro', dir: '.kiro/skills' },
        { name: 'copilot', dir: '.copilot/skills' },
        { name: 'aider', dir: '.aider/skills' },
        { name: 'continue', dir: '.continue/skills' },
        { name: 'amazon-q', dir: '.amazonq/skills' },
        { name: 'amp', dir: '.amp/skills' },
    ];
    let synced = 0;
    let missing = 0;
    for (const p of platforms) {
        const fullPath = path_1.default.join(repoRoot, p.dir);
        const hasShared = fs_1.default.existsSync(path_1.default.join(fullPath, '_shared', 'helpers.md'));
        if (hasShared) {
            synced++;
        }
        else {
            missing++;
            console.log(chalk_1.default.yellow(`    ⚠ ${p.name}: _shared/helpers.md missing`));
        }
    }
    if (missing === 0) {
        console.log(chalk_1.default.green(`    ✅ All ${synced} platforms synced`));
    }
    else {
        console.log(chalk_1.default.dim(`    ${synced} synced, ${missing} missing`));
        console.log(chalk_1.default.dim('    Run `cm update --sync` to fix.'));
    }
}
function printPlatforms() {
    console.log(chalk_1.default.bold('\nSupported platforms:\n'));
    for (const p of (0, engine_1.listPlatforms)()) {
        console.log(`  ${p.emoji}  ${chalk_1.default.cyan(p.id.padEnd(16))} ${chalk_1.default.dim(p.name)}`);
    }
}
