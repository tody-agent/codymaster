"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerLearnCommands = registerLearnCommands;
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importDefault(require("path"));
const learnings_1 = require("../../learnings");
const VALID_TYPES = ['pitfall', 'preference', 'pattern', 'fact'];
function resolveProject(opts) {
    var _a;
    return path_1.default.resolve((_a = opts.project) !== null && _a !== void 0 ? _a : process.cwd());
}
function registerLearnCommands(program) {
    program
        .command('learn <cmd> [args...]')
        .description('Per-project learnings log (.cm/learnings.jsonl) — gstack-style notes')
        .option('-p, --project <path>', 'Project path (default: cwd)')
        .option('-t, --type <type>', 'pitfall | preference | pattern | fact', 'fact')
        .option('-s, --scope <scope>', 'Scope tag (deploy, ui, test, ...)', 'general')
        .option('--source <source>', 'Origin label (e.g. cm-retro-cli)', 'manual')
        .option('--days <n>', 'For prune: max age in days', '180')
        .option('--limit <n>', 'For list: max rows', '20')
        .option('--filter-type <type>', 'For list: filter by type')
        .option('--filter-scope <scope>', 'For list: filter by scope')
        .action((cmd, args, opts) => {
        const project = resolveProject(opts);
        switch (cmd) {
            case 'add': {
                const note = args.join(' ').trim();
                if (!note) {
                    console.error(chalk_1.default.red('Usage: cm learn add "<note>"  [--type ... --scope ...]'));
                    process.exitCode = 1;
                    return;
                }
                if (!VALID_TYPES.includes(opts.type)) {
                    console.error(chalk_1.default.red(`Invalid --type. Use one of: ${VALID_TYPES.join(', ')}`));
                    process.exitCode = 1;
                    return;
                }
                try {
                    const l = (0, learnings_1.addLearning)(project, {
                        type: opts.type,
                        scope: opts.scope,
                        note,
                        source: opts.source,
                    });
                    console.log(chalk_1.default.green(`✓ Learned [${l.type}/${l.scope}]: ${l.note}`));
                }
                catch (e) {
                    console.error(chalk_1.default.red(`✗ ${e.message}`));
                    process.exitCode = 1;
                }
                return;
            }
            case 'list':
            case 'ls': {
                const items = (0, learnings_1.listLearnings)(project, {
                    limit: parseInt(opts.limit, 10),
                    type: opts.filterType,
                    scope: opts.filterScope,
                });
                if (items.length === 0) {
                    console.log(chalk_1.default.dim('(no learnings yet)'));
                    return;
                }
                for (const l of items) {
                    const date = l.ts.slice(0, 10);
                    console.log(`${chalk_1.default.gray(date)} ${chalk_1.default.cyan(l.type.padEnd(10))} ${chalk_1.default.yellow(l.scope.padEnd(12))} ${l.note}`);
                }
                console.log(chalk_1.default.dim(`\n${items.length} learning(s)`));
                return;
            }
            case 'prune': {
                const days = parseInt(opts.days, 10);
                const n = (0, learnings_1.pruneLearnings)(project, days);
                console.log(chalk_1.default.green(`✓ Pruned ${n} learning(s) older than ${days} days`));
                return;
            }
            default:
                console.error(chalk_1.default.red(`Unknown subcommand: ${cmd}`));
                console.log(chalk_1.default.dim('Available: add, list, prune'));
                process.exitCode = 1;
        }
    });
}
