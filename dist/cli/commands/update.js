"use strict";
/**
 * cm update — Unified update command for CodyMaster
 *
 * TRIZ Principle #15 (Dynamicity):
 *   Adapt update behavior based on flags.
 *
 * TRIZ Principle #40 (Composite):
 *   Combine sync + changelog + version check in one command.
 */
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
exports.registerUpdateCommands = registerUpdateCommands;
const chalk_1 = __importDefault(require("chalk"));
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const box_1 = require("../../ui/box");
const repoRoot = path_1.default.join(__dirname, '..', '..', '..');
const pkg = JSON.parse(fs_1.default.readFileSync(path_1.default.join(repoRoot, 'package.json'), 'utf-8'));
function registerUpdateCommands(program) {
    program
        .command('update')
        .description('Update CodyMaster skills, changelog, and check for upgrades')
        .option('-s, --sync', 'Sync skills to all platforms')
        .option('-c, --changelog', 'Update CHANGELOG.md from git commits')
        .option('--check', 'Check for available updates')
        .option('-f, --full', 'Full update (sync + changelog)')
        .option('--dry-run', 'Show what would be done without making changes')
        .action((opts) => __awaiter(this, void 0, void 0, function* () {
        console.log((0, box_1.renderCommandHeader)('CodyMaster Update', '🔄'));
        // Default: full update if no flags
        if (!opts.sync && !opts.changelog && !opts.check) {
            opts.full = true;
        }
        // Check for updates
        if (opts.check) {
            yield checkForUpdates();
            return;
        }
        // Sync skills
        if (opts.sync || opts.full) {
            yield syncSkills(opts.dryRun);
        }
        // Update changelog
        if (opts.changelog || opts.full) {
            yield updateChangelog(opts.dryRun);
        }
        // Summary
        console.log('');
        console.log(chalk_1.default.green('  ✅ Update complete!'));
        console.log('');
    }));
    // ─── Upgrade Command ─────────────────────────────────────────
    program
        .command('upgrade')
        .description('Upgrade CodyMaster package and sync skills')
        .option('--dry-run', 'Show what would be done without making changes')
        .action((opts) => __awaiter(this, void 0, void 0, function* () {
        console.log((0, box_1.renderCommandHeader)('CodyMaster Upgrade', '⬆️'));
        if (opts.dryRun) {
            console.log(chalk_1.default.dim('  [DRY RUN] Would run: npm update -g codymaster'));
            console.log(chalk_1.default.dim('  [DRY RUN] Would run: cm update --full'));
            return;
        }
        // Step 1: Update package
        console.log(chalk_1.default.bold('  Step 1: Updating CodyMaster package...'));
        try {
            (0, child_process_1.execSync)('npm update -g codymaster', { stdio: 'inherit', cwd: repoRoot });
            console.log(chalk_1.default.green('  ✅ Package updated'));
        }
        catch (error) {
            console.log(chalk_1.default.yellow('  ⚠️  Package update failed (may already be latest)'));
        }
        // Step 2: Sync skills
        console.log(chalk_1.default.bold('\n  Step 2: Syncing skills...'));
        yield syncSkills(false);
        // Step 3: Update changelog
        console.log(chalk_1.default.bold('\n  Step 3: Updating changelog...'));
        yield updateChangelog(false);
        console.log('');
        console.log(chalk_1.default.green('  ✅ Upgrade complete!'));
        console.log(chalk_1.default.dim('  Run `cm --version` to verify.'));
        console.log('');
    }));
}
function checkForUpdates() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(chalk_1.default.bold('\n  Checking for updates...\n'));
        // Current version
        console.log(chalk_1.default.dim(`  Current: v${pkg.version}`));
        // Check npm for latest
        try {
            const latest = (0, child_process_1.execSync)('npm view codymaster version', { encoding: 'utf-8' }).trim();
            console.log(chalk_1.default.dim(`  Latest:  v${latest}`));
            if (latest !== pkg.version) {
                console.log(chalk_1.default.yellow(`\n  ⚠️  Update available: v${latest}`));
                console.log(chalk_1.default.dim('  Run `cm upgrade` to update.'));
            }
            else {
                console.log(chalk_1.default.green('\n  ✅ You are on the latest version.'));
            }
        }
        catch (error) {
            console.log(chalk_1.default.dim('  Could not check npm registry.'));
        }
    });
}
function syncSkills(dryRun) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(chalk_1.default.bold('\n  Syncing skills to all platforms...'));
        if (dryRun) {
            console.log(chalk_1.default.dim('  [DRY RUN] Would run: node scripts/build-skills.mjs --all-platforms'));
            return;
        }
        try {
            const output = (0, child_process_1.execSync)('node scripts/build-skills.mjs --all-platforms', {
                encoding: 'utf-8',
                cwd: repoRoot,
                timeout: 60000,
            });
            console.log(chalk_1.default.green('  ✅ Skills synced'));
        }
        catch (error) {
            console.log(chalk_1.default.red('  ❌ Sync failed: ' + (error.message || 'Unknown error')));
        }
    });
}
function updateChangelog(dryRun) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(chalk_1.default.bold('\n  Updating changelog...'));
        if (dryRun) {
            console.log(chalk_1.default.dim('  [DRY RUN] Would run: bash scripts/update-changelog.sh'));
            return;
        }
        try {
            const output = (0, child_process_1.execSync)('bash scripts/update-changelog.sh', {
                encoding: 'utf-8',
                cwd: repoRoot,
                timeout: 30000,
            });
            console.log(chalk_1.default.green('  ✅ Changelog updated'));
        }
        catch (error) {
            console.log(chalk_1.default.red('  ❌ Changelog update failed: ' + (error.message || 'Unknown error')));
        }
    });
}
