#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { checkForUpdates } from './cli/update-check';
import { registerAllCommands } from './cli/command-registry';

// Load version from package.json
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8'));
const VERSION = pkg.version;

async function main() {
  const program = new Command();

  program
    .name('cm')
    .description('CodyMaster CLI — The Hamster-Powered AI Agent Framework')
    .version(VERSION);

  // ─── Registration ──────────────────────────────────────────────────────────
  
  // Register all modular commands
  registerAllCommands(program);

  // ─── Update Check ──────────────────────────────────────────────────────────
  
  // Run update check in background (non-blocking)
  checkForUpdates().catch(() => {});

  // ─── Execution ─────────────────────────────────────────────────────────────
  
  // Parse arguments and execute
  program.parse(process.argv);

  // Default to 'status' if no command provided
  if (process.argv.length <= 2) {
    program.help();
  }
}

// Error handling for uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('\n  🛑 UNCAUGHT ERROR:', err.message);
  if (process.env.DEBUG) console.error(err.stack);
  process.exit(1);
});

main().catch((err) => {
  console.error('\n  🛑 FATAL ERROR:', err.message);
  process.exit(1);
});
