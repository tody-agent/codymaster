"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncLearnings = syncLearnings;
exports.registerLearnCommands = registerLearnCommands;
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const fs_1 = __importDefault(require("fs"));
const child_process_1 = require("child_process");
const learnings_1 = require("../../learnings");
const VALID_TYPES = ['pitfall', 'preference', 'pattern', 'fact'];
function resolveProject(opts) {
    var _a;
    return path_1.default.resolve((_a = opts.project) !== null && _a !== void 0 ? _a : process.cwd());
}
function git(cwd, args) {
    return (0, child_process_1.execFileSync)('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}
function syncLearnings(projectPath, opts) {
    var _a;
    const syncDir = (_a = opts.syncDir) !== null && _a !== void 0 ? _a : path_1.default.join(os_1.default.homedir(), '.cm', 'learnings-sync');
    const remoteFile = path_1.default.join(syncDir, 'learnings.jsonl');
    if (!fs_1.default.existsSync(path_1.default.join(syncDir, '.git'))) {
        fs_1.default.mkdirSync(path_1.default.dirname(syncDir), { recursive: true });
        if (fs_1.default.existsSync(syncDir)) {
            // Existing non-git dir — abort rather than wipe.
            throw new Error(`${syncDir} exists but is not a git checkout`);
        }
        git(path_1.default.dirname(syncDir), ['clone', opts.remote, path_1.default.basename(syncDir)]);
        // Ensure a local identity exists so commits succeed even when the host
        // has no global git config (CI runners, fresh containers).
        try {
            git(syncDir, ['config', 'user.email', 'cm-learn-sync@codymaster.local']);
        }
        catch (_b) { }
        try {
            git(syncDir, ['config', 'user.name', 'cm-learn-sync']);
        }
        catch (_c) { }
    }
    else {
        // Make sure we point at the requested remote, then refresh.
        try {
            git(syncDir, ['remote', 'set-url', 'origin', opts.remote]);
        }
        catch (_d) {
            git(syncDir, ['remote', 'add', 'origin', opts.remote]);
        }
        try {
            git(syncDir, ['pull', '--ff-only', 'origin', 'HEAD']);
        }
        catch (_e) {
            // Empty repo / unborn HEAD — ignore; nothing to pull.
        }
    }
    const localFile = (0, learnings_1.learningsPath)(projectPath);
    const localBefore = (0, learnings_1.readLearningsFile)(localFile);
    const remoteBefore = (0, learnings_1.readLearningsFile)(remoteFile);
    const merged = (0, learnings_1.mergeLearnings)(localBefore, remoteBefore);
    // Local: write merged set verbatim (keeps full fidelity for the user).
    (0, learnings_1.writeLearningsFile)(localFile, merged);
    const pulled = merged.length - localBefore.length;
    if (opts.pullOnly) {
        return { pulled, pushed: 0, localTotal: merged.length };
    }
    // Remote: write anonymized merge.
    const anonMerged = (0, learnings_1.mergeLearnings)(remoteBefore, localBefore.map(learnings_1.anonymize));
    (0, learnings_1.writeLearningsFile)(remoteFile, anonMerged);
    const pushed = anonMerged.length - remoteBefore.length;
    if (pushed > 0) {
        git(syncDir, ['add', 'learnings.jsonl']);
        try {
            git(syncDir, ['commit', '-m', `learn: +${pushed} from ${path_1.default.basename(projectPath)}`]);
            git(syncDir, ['push', 'origin', 'HEAD']);
        }
        catch (e) {
            // Bubble up so the caller can decide; non-zero pushes left in local mirror are fine.
            throw new Error(`git push failed: ${e.message}`);
        }
    }
    return { pulled, pushed, localTotal: merged.length };
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
        .option('--remote <url>', 'For sync: git remote URL of the shared learnings repo')
        .option('--pull-only', 'For sync: pull + merge only, do not push back')
        .option('--sync-dir <path>', 'For sync: working dir (default: ~/.cm/learnings-sync)')
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
            case 'sync': {
                if (!opts.remote) {
                    console.error(chalk_1.default.red('Usage: cm learn sync --remote <git-url> [--pull-only]'));
                    process.exitCode = 1;
                    return;
                }
                try {
                    const result = syncLearnings(project, {
                        remote: opts.remote,
                        pullOnly: !!opts.pullOnly,
                        syncDir: opts.syncDir,
                    });
                    console.log(chalk_1.default.green(`✓ sync ok — pulled=${result.pulled} pushed=${result.pushed} local=${result.localTotal}`));
                }
                catch (e) {
                    console.error(chalk_1.default.red(`✗ sync failed: ${e.message}`));
                    process.exitCode = 1;
                }
                return;
            }
            default:
                console.error(chalk_1.default.red(`Unknown subcommand: ${cmd}`));
                console.log(chalk_1.default.dim('Available: add, list, prune, sync'));
                process.exitCode = 1;
        }
    });
}
