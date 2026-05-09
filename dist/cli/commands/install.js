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
const engine_1 = require("../../install/engine");
const profiles_1 = require("../../install/profiles");
function registerInstallCommands(program) {
    program
        .command('install [platform]')
        .description('Install CodyMaster skills to an AI coding platform')
        .option('-p, --profile <name>', 'Skill profile: core | growth | design | knowledge | full', 'full')
        .option('-s, --scope <scope>', 'Install scope for platforms that support it: user | project', 'user')
        .option('--all', 'Install to every detected platform')
        .option('--list', 'List supported platforms and exit')
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
        console.log('');
    }));
    program
        .command('doctor')
        .description('Check which AI platforms are installed and which have CodyMaster skills')
        .action(() => {
        console.log(chalk_1.default.bold('\nDetected platforms:\n'));
        for (const d of (0, engine_1.detectPlatforms)()) {
            const mark = d.installed ? chalk_1.default.green('●') : chalk_1.default.dim('○');
            const detail = d.detail ? chalk_1.default.dim(`  (${d.detail})`) : '';
            console.log(`  ${mark} ${d.platform.emoji}  ${d.platform.name}${detail}`);
        }
        console.log('');
    });
}
function printPlatforms() {
    console.log(chalk_1.default.bold('\nSupported platforms:\n'));
    for (const p of (0, engine_1.listPlatforms)()) {
        console.log(`  ${p.emoji}  ${chalk_1.default.cyan(p.id.padEnd(16))} ${chalk_1.default.dim(p.name)}`);
    }
}
