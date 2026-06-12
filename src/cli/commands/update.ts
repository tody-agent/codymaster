/**
 * cm update — Unified update command for CodyMaster
 *
 * TRIZ Principle #15 (Dynamicity):
 *   Adapt update behavior based on flags.
 *
 * TRIZ Principle #40 (Composite):
 *   Combine sync + changelog + version check in one command.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { renderCommandHeader } from '../../ui/box';
import { detectPlatforms } from '../../install/engine';

const repoRoot = path.join(__dirname, '..', '..', '..');
const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf-8'));

export function registerUpdateCommands(program: Command) {
  program
    .command('update')
    .description('Update CodyMaster skills, changelog, and check for upgrades')
    .option('-s, --sync', 'Sync skills to all platforms')
    .option('-c, --changelog', 'Update CHANGELOG.md from git commits')
    .option('--check', 'Check for available updates')
    .option('-f, --full', 'Full update (sync + changelog)')
    .option('--dry-run', 'Show what would be done without making changes')
    .action(async (opts) => {
      console.log(renderCommandHeader('CodyMaster Update', '🔄'));

      // Default: full update if no flags
      if (!opts.sync && !opts.changelog && !opts.check) {
        opts.full = true;
      }

      // Check for updates
      if (opts.check) {
        await checkForUpdates();
        return;
      }

      // Sync skills
      if (opts.sync || opts.full) {
        await syncSkills(opts.dryRun);
      }

      // Update changelog
      if (opts.changelog || opts.full) {
        await updateChangelog(opts.dryRun);
      }

      // Summary
      console.log('');
      console.log(chalk.green('  ✅ Update complete!'));
      console.log('');
    });

  // ─── Upgrade Command ─────────────────────────────────────────
  program
    .command('upgrade')
    .description('Upgrade CodyMaster package and sync skills')
    .option('--dry-run', 'Show what would be done without making changes')
    .action(async (opts) => {
      console.log(renderCommandHeader('CodyMaster Upgrade', '⬆️'));

      if (opts.dryRun) {
        console.log(chalk.dim('  [DRY RUN] Would run: npm update -g codymaster'));
        console.log(chalk.dim('  [DRY RUN] Would run: cm update --full'));
        return;
      }

      // Step 1: Update package
      console.log(chalk.bold('  Step 1: Updating CodyMaster package...'));
      try {
        execSync('npm update -g codymaster', { stdio: 'inherit', cwd: repoRoot });
        console.log(chalk.green('  ✅ Package updated'));
      } catch (error) {
        console.log(chalk.yellow('  ⚠️  Package update failed (may already be latest)'));
      }

      // Step 2: Sync skills
      console.log(chalk.bold('\n  Step 2: Syncing skills...'));
      await syncSkills(false);

      // Step 3: Update changelog
      console.log(chalk.bold('\n  Step 3: Updating changelog...'));
      await updateChangelog(false);

      console.log('');
      console.log(chalk.green('  ✅ Upgrade complete!'));
      console.log(chalk.dim('  Run `cm --version` to verify.'));
      console.log('');
    });
}

async function checkForUpdates(): Promise<void> {
  console.log(chalk.bold('\n  Checking for updates...\n'));

  // Current version
  console.log(chalk.dim(`  Current: v${pkg.version}`));

  // Check npm for latest
  try {
    const latest = execSync('npm view codymaster version', { encoding: 'utf-8' }).trim();
    console.log(chalk.dim(`  Latest:  v${latest}`));

    if (latest !== pkg.version) {
      console.log(chalk.yellow(`\n  ⚠️  Update available: v${latest}`));
      console.log(chalk.dim('  Run `cm upgrade` to update.'));
    } else {
      console.log(chalk.green('\n  ✅ You are on the latest version.'));
    }
  } catch (error) {
    console.log(chalk.dim('  Could not check npm registry.'));
  }
}

async function syncSkills(dryRun: boolean): Promise<void> {
  console.log(chalk.bold('\n  Syncing skills to all platforms...'));

  if (dryRun) {
    console.log(chalk.dim('  [DRY RUN] Would run: node scripts/build-skills.mjs --all-platforms'));
    return;
  }

  try {
    const output = execSync('node scripts/build-skills.mjs --all-platforms', {
      encoding: 'utf-8',
      cwd: repoRoot,
      timeout: 60000,
    });
    console.log(chalk.green('  ✅ Skills synced'));
  } catch (error: any) {
    console.log(chalk.red('  ❌ Sync failed: ' + (error.message || 'Unknown error')));
  }
}

async function updateChangelog(dryRun: boolean): Promise<void> {
  console.log(chalk.bold('\n  Updating changelog...'));

  if (dryRun) {
    console.log(chalk.dim('  [DRY RUN] Would run: bash scripts/update-changelog.sh'));
    return;
  }

  try {
    const output = execSync('bash scripts/update-changelog.sh', {
      encoding: 'utf-8',
      cwd: repoRoot,
      timeout: 30000,
    });
    console.log(chalk.green('  ✅ Changelog updated'));
  } catch (error: any) {
    console.log(chalk.red('  ❌ Changelog update failed: ' + (error.message || 'Unknown error')));
  }
}
