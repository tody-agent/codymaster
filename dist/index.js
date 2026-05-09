#!/usr/bin/env node
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
const commander_1 = require("commander");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const update_check_1 = require("./cli/update-check");
const command_registry_1 = require("./cli/command-registry");
// Load version from package.json
const pkg = JSON.parse(fs_1.default.readFileSync(path_1.default.join(__dirname, '..', 'package.json'), 'utf-8'));
const VERSION = pkg.version;
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const program = new commander_1.Command();
        program
            .name('cm')
            .description('CodyMaster CLI — The Hamster-Powered AI Agent Framework')
            .version(VERSION);
        // ─── Registration ──────────────────────────────────────────────────────────
        // Register all modular commands
        (0, command_registry_1.registerAllCommands)(program);
        // ─── Update Check ──────────────────────────────────────────────────────────
        // Run update check in background (non-blocking)
        (0, update_check_1.checkForUpdates)().catch(() => { });
        // ─── Execution ─────────────────────────────────────────────────────────────
        // Parse arguments and execute
        program.parse(process.argv);
        // Default to 'status' if no command provided
        if (process.argv.length <= 2) {
            program.help();
        }
    });
}
// Error handling for uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('\n  🛑 UNCAUGHT ERROR:', err.message);
    if (process.env.DEBUG)
        console.error(err.stack);
    process.exit(1);
});
main().catch((err) => {
    console.error('\n  🛑 FATAL ERROR:', err.message);
    process.exit(1);
});
