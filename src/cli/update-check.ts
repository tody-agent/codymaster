import fs from 'fs';
import path from 'path';
import os from 'os';
import https from 'https';

const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', '..', 'package.json'), 'utf-8'));
export const VERSION = pkg.version;

export interface UpdateInfo {
  currentVersion: string;
  latestVersion: string;
}

/**
 * Checks for updates to CodyMaster on the npm registry.
 * Caches results for 24 hours to avoid frequent network calls.
 * Returns UpdateInfo if a newer version is available, null otherwise.
 */
export async function checkForUpdates(): Promise<UpdateInfo | null> {
  try {
    const cacheDir = path.join(os.homedir(), '.codymaster');
    const cacheFile = path.join(cacheDir, '.update-check');

    // Ensure cache directory exists
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    // Check cache (24h TTL)
    try {
      if (fs.existsSync(cacheFile)) {
        const stat = fs.statSync(cacheFile);
        const age = Date.now() - stat.mtimeMs;
        if (age < 24 * 60 * 60 * 1000) {
          const cached = fs.readFileSync(cacheFile, 'utf-8').trim();
          if (cached && cached !== VERSION) {
            return { currentVersion: VERSION, latestVersion: cached };
          }
          if (!cached || cached === VERSION) {
            return null; // up to date
          }
        }
      }
    } catch { /* ignore cache errors */ }

    // Fetch latest version from npm (2s timeout)
    const latestVersion = await new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('timeout')), 2000);
      https.get('https://registry.npmjs.org/codymaster/latest', { headers: { 'Accept': 'application/json' } }, (res) => {
        let data = '';
        res.on('data', (chunk: Buffer) => { data += chunk; });
        res.on('end', () => {
          clearTimeout(timer);
          try {
            const json = JSON.parse(data);
            resolve(json.version || VERSION);
          } catch { resolve(VERSION); }
        });
      }).on('error', () => { clearTimeout(timer); reject(new Error('fetch failed')); });
    });

    // Cache result
    if (latestVersion && latestVersion !== VERSION) {
      fs.writeFileSync(cacheFile, latestVersion);
      return { currentVersion: VERSION, latestVersion };
    } else {
      fs.writeFileSync(cacheFile, '');
      return null;
    }
  } catch (e) {
    // Silent failure for update checks
    return null;
  }
}

/**
 * Display update notification with upgrade prompt.
 * Shows a colored banner and optionally prompts for upgrade.
 */
export function showUpdateNotification(info: UpdateInfo): void {
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
export async function promptForUpgrade(info: UpdateInfo): Promise<void> {
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
    rl.question(chalk.bold('  Upgrade now?') + chalk.dim(' (y/N) '), (answer: string) => {
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
        } catch (err) {
          console.log('');
          console.log(chalk.red('  ❌ Upgrade failed. Try manually:'));
          console.log(chalk.dim('    npm install -g codymaster@latest'));
          console.log('');
        }
      } else {
        console.log(chalk.dim('  Skipped. Run `cm upgrade` when ready.'));
        console.log('');
      }

      resolve();
    });
  });
}
