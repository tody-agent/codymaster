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
exports.VERSION = void 0;
exports.checkForUpdates = checkForUpdates;
exports.showUpdateNotification = showUpdateNotification;
exports.promptForUpgrade = promptForUpgrade;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const https_1 = __importDefault(require("https"));
const pkg = JSON.parse(fs_1.default.readFileSync(path_1.default.resolve(__dirname, '..', '..', 'package.json'), 'utf-8'));
exports.VERSION = pkg.version;
/**
 * Checks for updates to CodyMaster on the npm registry.
 * Caches results for 24 hours to avoid frequent network calls.
 * Returns UpdateInfo if a newer version is available, null otherwise.
 */
function checkForUpdates() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const cacheDir = path_1.default.join(os_1.default.homedir(), '.codymaster');
            const cacheFile = path_1.default.join(cacheDir, '.update-check');
            // Ensure cache directory exists
            if (!fs_1.default.existsSync(cacheDir)) {
                fs_1.default.mkdirSync(cacheDir, { recursive: true });
            }
            // Check cache (24h TTL)
            try {
                if (fs_1.default.existsSync(cacheFile)) {
                    const stat = fs_1.default.statSync(cacheFile);
                    const age = Date.now() - stat.mtimeMs;
                    if (age < 24 * 60 * 60 * 1000) {
                        const cached = fs_1.default.readFileSync(cacheFile, 'utf-8').trim();
                        if (cached && cached !== exports.VERSION) {
                            return { currentVersion: exports.VERSION, latestVersion: cached };
                        }
                        if (!cached || cached === exports.VERSION) {
                            return null; // up to date
                        }
                    }
                }
            }
            catch ( /* ignore cache errors */_a) { /* ignore cache errors */ }
            // Fetch latest version from npm (2s timeout)
            const latestVersion = yield new Promise((resolve, reject) => {
                const timer = setTimeout(() => reject(new Error('timeout')), 2000);
                https_1.default.get('https://registry.npmjs.org/codymaster/latest', { headers: { 'Accept': 'application/json' } }, (res) => {
                    let data = '';
                    res.on('data', (chunk) => { data += chunk; });
                    res.on('end', () => {
                        clearTimeout(timer);
                        try {
                            const json = JSON.parse(data);
                            resolve(json.version || exports.VERSION);
                        }
                        catch (_a) {
                            resolve(exports.VERSION);
                        }
                    });
                }).on('error', () => { clearTimeout(timer); reject(new Error('fetch failed')); });
            });
            // Cache result
            if (latestVersion && latestVersion !== exports.VERSION) {
                fs_1.default.writeFileSync(cacheFile, latestVersion);
                return { currentVersion: exports.VERSION, latestVersion };
            }
            else {
                fs_1.default.writeFileSync(cacheFile, '');
                return null;
            }
        }
        catch (e) {
            // Silent failure for update checks
            return null;
        }
    });
}
/**
 * Display update notification with upgrade prompt.
 * Shows a colored banner and optionally prompts for upgrade.
 */
function showUpdateNotification(info) {
    const chalk = require('chalk');
    console.log('');
    console.log(chalk.yellow('  ┌──────────────────────────────────────────────┐'));
    console.log(chalk.yellow('  │ ') + chalk.bold('Update available!') + `  v${info.currentVersion} → v${info.latestVersion}` + chalk.yellow('  │'));
    console.log(chalk.yellow('  │ ') + chalk.dim('Run `cm upgrade` to update') + chalk.yellow('                      │'));
    console.log(chalk.yellow('  └──────────────────────────────────────────────┘'));
    console.log('');
}
/**
 * Show update notification and optionally prompt for upgrade.
 * Respects CM_NO_UPDATE_CHECK env var to skip entirely.
 * Only prompts in TTY environments (not pipes/CI).
 */
function promptForUpgrade(info) {
    return __awaiter(this, void 0, void 0, function* () {
        // Skip if user disabled it
        if (process.env.CM_NO_UPDATE_CHECK === '1' || process.env.CM_NO_UPDATE_CHECK === 'true') {
            return;
        }
        // Skip if not a TTY (piped, CI, etc.)
        if (!process.stdin.isTTY) {
            showUpdateNotification(info);
            return;
        }
        // Only prompt for interactive commands (not help, version, or help subcommands)
        const args = process.argv.slice(2);
        const skipPrompts = args.includes('--help') || args.includes('-h') || args.includes('--version') || args.includes('-V');
        if (skipPrompts) {
            return;
        }
        const chalk = require('chalk');
        const readline = require('readline');
        console.log('');
        console.log(chalk.yellow('  ┌──────────────────────────────────────────────┐'));
        console.log(chalk.yellow('  │ ') + chalk.bold('Update available!') + `  v${info.currentVersion} → v${info.latestVersion}` + chalk.yellow('  │'));
        console.log(chalk.yellow('  └──────────────────────────────────────────────┘'));
        console.log('');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        return new Promise((resolve) => {
            rl.question(chalk.bold('  Upgrade now?') + chalk.dim(' (y/N) '), (answer) => {
                rl.close();
                const choice = (answer || '').trim().toLowerCase();
                if (choice === 'y' || choice === 'yes') {
                    console.log('');
                    console.log(chalk.dim('  Running cm upgrade...'));
                    console.log('');
                    const { execSync } = require('child_process');
                    try {
                        execSync('npm update -g codymaster', { stdio: 'inherit', timeout: 60000 });
                        console.log('');
                        console.log(chalk.green('  ✅ Upgrade complete! Restart your shell or run:'));
                        console.log(chalk.dim('    hash -r'));
                        console.log('');
                    }
                    catch (err) {
                        console.log('');
                        console.log(chalk.red('  ❌ Upgrade failed. Try manually:'));
                        console.log(chalk.dim('    npm install -g codymaster@latest'));
                        console.log('');
                    }
                }
                else {
                    console.log(chalk.dim('  Skipped. Run `cm upgrade` when ready.'));
                    console.log('');
                }
                resolve();
            });
        });
    });
}
