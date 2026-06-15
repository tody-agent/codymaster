"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.registerEngineeringCommands = registerEngineeringCommands;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const child_process_1 = require("child_process");
const http_1 = __importDefault(require("http"));
const chalk_1 = __importDefault(require("chalk"));
const browse_server_1 = require("../../browse-server");
const guardian_core_1 = require("../../guardian-core");
const cm_config_1 = require("../../cm-config");
const second_opinion_providers_1 = require("../../second-opinion-providers");
const sprint_pipeline_1 = require("../../sprint-pipeline");
const retro_summary_1 = require("../../retro-summary");
const cm_suggest_1 = require("../../cm-suggest");
const storage_backend_1 = require("../../storage-backend");
const advisory_report_1 = require("../../advisory-report");
const advisory_handoff_1 = require("../../advisory-handoff");
function projectPath(opt) {
    return path_1.default.resolve(opt || process.cwd());
}
/**
 * Resolve the browse-daemon bearer token.
 *
 * Order: explicit --token → CM_BROWSE_TOKEN → config browse.token → a random
 * token persisted to `.cm/browse_token` (0600). The persisted token lets the
 * daemon and the client subcommands in the same project agree on a value
 * instead of falling back to a publicly-known constant ('dev-token-change-me'),
 * which would let any local process / DNS-rebinding page drive the browser.
 */
function getBrowseToken(root, optToken) {
    var _a;
    const explicit = optToken || process.env.CM_BROWSE_TOKEN || ((_a = (0, cm_config_1.loadCmConfig)(root).browse) === null || _a === void 0 ? void 0 : _a.token);
    if (explicit)
        return String(explicit);
    const tokenPath = path_1.default.join(root, '.cm', 'browse_token');
    try {
        const existing = fs_1.default.readFileSync(tokenPath, 'utf-8').trim();
        if (existing)
            return existing;
    }
    catch ( /* not created yet */_b) { /* not created yet */ }
    const token = crypto_1.default.randomBytes(24).toString('hex');
    try {
        fs_1.default.mkdirSync(path_1.default.dirname(tokenPath), { recursive: true });
        fs_1.default.writeFileSync(tokenPath, token, { mode: 0o600 });
        fs_1.default.chmodSync(tokenPath, 0o600);
    }
    catch ( /* best effort; token still valid for this process */_c) { /* best effort; token still valid for this process */ }
    return token;
}
function registerEngineeringCommands(program) {
    const browse = program.command('browse').description('Browse daemon (Hybrid Bridge: agent-browser + Playwright)');
    browse
        .command('start')
        .option('-p, --port <n>', 'port (default: .cm/config.yaml browse.port or 17395)')
        .option('-H, --host <h>', 'bind host (default: config or 127.0.0.1)')
        .option('--token <t>', 'bearer token (or env CM_BROWSE_TOKEN or config browse.token)')
        .option('--headed', 'headed browser', false)
        .option('--engine <e>', 'browser engine: auto (default), agent-browser, playwright', 'auto')
        .action((opts) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f;
        const root = process.cwd();
        const cfg = (0, cm_config_1.loadCmConfig)(root);
        const port = parseInt(String((_c = (_a = opts.port) !== null && _a !== void 0 ? _a : (_b = cfg.browse) === null || _b === void 0 ? void 0 : _b.port) !== null && _c !== void 0 ? _c : 17395), 10);
        const host = String((_f = (_d = opts.host) !== null && _d !== void 0 ? _d : (_e = cfg.browse) === null || _e === void 0 ? void 0 : _e.host) !== null && _f !== void 0 ? _f : '127.0.0.1');
        const token = getBrowseToken(root, opts.token);
        const daemon = new browse_server_1.BrowseDaemon({
            host,
            port,
            token,
            headless: !opts.headed,
            engine: opts.engine,
        });
        yield daemon.listen();
        console.log(chalk_1.default.green(`cm-browse listening http://${host}:${port}`));
        console.log(chalk_1.default.dim(`Authorization: Bearer ${token.slice(0, 8)}…`));
        console.log(chalk_1.default.dim(`Engine: ${opts.engine}`));
        console.log(chalk_1.default.dim('Endpoints: POST /session/start, /navigate, /refs/refresh, /click, /fill'));
        console.log(chalk_1.default.dim('           GET /screenshot, /console, /network, /errors, /a11y-snapshot, /engine'));
        console.log(chalk_1.default.dim('           POST /record/start, /record/stop'));
        process.on('SIGINT', () => __awaiter(this, void 0, void 0, function* () {
            yield daemon.close();
            process.exit(0);
        }));
    }));
    browse
        .command('doctor')
        .description('Check browser engine availability')
        .action(() => __awaiter(this, void 0, void 0, function* () {
        const { checkEngines } = yield Promise.resolve().then(() => __importStar(require('../../browse/adapter-factory')));
        const engines = yield checkEngines();
        console.log(chalk_1.default.bold('Browser engine status:'));
        console.log(`  agent-browser: ${engines['agent-browser'] ? chalk_1.default.green('available') : chalk_1.default.red('not found')}`);
        console.log(`  playwright:    ${engines.playwright ? chalk_1.default.green('available') : chalk_1.default.red('not found')}`);
        if (!engines['agent-browser'] && !engines.playwright) {
            console.log(chalk_1.default.yellow('\nInstall one:'));
            console.log('  npm i -g agent-browser && agent-browser install');
            console.log('  npx playwright install chromium');
        }
        else if (!engines['agent-browser']) {
            console.log(chalk_1.default.dim('\nTip: Install agent-browser for better performance + a11y tree:'));
            console.log('  npm i -g agent-browser && agent-browser install');
        }
    }));
    browse
        .command('errors')
        .description('List collected browser errors')
        .option('--port <n>', 'browse daemon port (default: config or 17395)')
        .option('--token <t>', 'or env CM_BROWSE_TOKEN or config browse.token')
        .option('--type <t>', 'filter by type: js-error, network-fail, console-error, timeout, crash')
        .option('--severity <s>', 'filter by severity: critical, error, warning, info')
        .action((opts) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        const cfg = (0, cm_config_1.loadCmConfig)(process.cwd());
        const token = getBrowseToken(process.cwd(), opts.token);
        const port = parseInt(String((_c = (_a = opts.port) !== null && _a !== void 0 ? _a : (_b = cfg.browse) === null || _b === void 0 ? void 0 : _b.port) !== null && _c !== void 0 ? _c : 17395), 10);
        const auth = `Bearer ${token}`;
        try {
            let path = '/errors';
            const params = new URLSearchParams();
            if (opts.type)
                params.set('type', opts.type);
            if (opts.severity)
                params.set('severity', opts.severity);
            if (params.toString())
                path += `?${params.toString()}`;
            const raw = yield browseRaw(port, path, auth);
            const data = JSON.parse(raw);
            if (data.errors.length === 0) {
                console.log(chalk_1.default.green('No errors collected'));
            }
            else {
                console.log(chalk_1.default.bold(`Found ${data.errors.length} errors (total: ${data.total}):`));
                for (const e of data.errors) {
                    const icon = e.severity === 'critical' ? '🔴' : e.severity === 'error' ? '🟠' : '🟡';
                    console.log(`  ${icon} [${e.type}] ${e.message.slice(0, 120)}`);
                }
            }
        }
        catch (e) {
            console.error(chalk_1.default.red(e.message));
            process.exit(1);
        }
    }));
    browse
        .command('snapshot')
        .description('Get a11y tree snapshot with @eN refs')
        .option('--port <n>', 'browse daemon port')
        .option('--token <t>', 'or env CM_BROWSE_TOKEN or config')
        .action((opts) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        const cfg = (0, cm_config_1.loadCmConfig)(process.cwd());
        const token = getBrowseToken(process.cwd(), opts.token);
        const port = parseInt(String((_c = (_a = opts.port) !== null && _a !== void 0 ? _a : (_b = cfg.browse) === null || _b === void 0 ? void 0 : _b.port) !== null && _c !== void 0 ? _c : 17395), 10);
        const auth = `Bearer ${token}`;
        try {
            const raw = yield browseRaw(port, '/a11y-snapshot', auth);
            const snap = JSON.parse(raw);
            console.log(chalk_1.default.bold('A11y Snapshot:'));
            console.log(chalk_1.default.dim(`  Timestamp: ${snap.timestamp}`));
            console.log(chalk_1.default.dim(`  Refs: ${Object.keys(snap.refs).length} elements`));
            for (const [ref, desc] of Object.entries(snap.refs)) {
                console.log(`  @${ref}: ${desc}`);
            }
        }
        catch (e) {
            console.error(chalk_1.default.red(e.message));
            process.exit(1);
        }
    }));
    browse
        .command('engine')
        .description('Show current browser engine info')
        .option('--port <n>', 'browse daemon port')
        .option('--token <t>', 'or env CM_BROWSE_TOKEN or config')
        .action((opts) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        const cfg = (0, cm_config_1.loadCmConfig)(process.cwd());
        const token = getBrowseToken(process.cwd(), opts.token);
        const port = parseInt(String((_c = (_a = opts.port) !== null && _a !== void 0 ? _a : (_b = cfg.browse) === null || _b === void 0 ? void 0 : _b.port) !== null && _c !== void 0 ? _c : 17395), 10);
        const auth = `Bearer ${token}`;
        try {
            const raw = yield browseRaw(port, '/engine', auth);
            const info = JSON.parse(raw);
            console.log(chalk_1.default.bold('Engine:'), info.name);
            console.log(chalk_1.default.dim(`  Version: ${info.version}`));
            console.log(chalk_1.default.dim(`  Active: ${info.active}`));
            if (info.capabilities) {
                console.log(chalk_1.default.dim('  Capabilities:'));
                for (const [k, v] of Object.entries(info.capabilities)) {
                    console.log(`    ${k}: ${v ? '✅' : '❌'}`);
                }
            }
        }
        catch (e) {
            console.error(chalk_1.default.red(e.message));
            process.exit(1);
        }
    }));
    browse
        .command('record')
        .description('Video recording control')
        .argument('<action>', 'start or stop')
        .option('--port <n>', 'browse daemon port')
        .option('--token <t>', 'or env CM_BROWSE_TOKEN or config')
        .action((action, opts) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        const cfg = (0, cm_config_1.loadCmConfig)(process.cwd());
        const token = getBrowseToken(process.cwd(), opts.token);
        const port = parseInt(String((_c = (_a = opts.port) !== null && _a !== void 0 ? _a : (_b = cfg.browse) === null || _b === void 0 ? void 0 : _b.port) !== null && _c !== void 0 ? _c : 17395), 10);
        const auth = `Bearer ${token}`;
        try {
            if (action === 'start') {
                yield browseRequest(port, '/record/start', 'POST', auth, {});
                console.log(chalk_1.default.green('Recording started'));
            }
            else if (action === 'stop') {
                const raw = yield browseRequestRaw(port, '/record/stop', 'POST', auth);
                const data = JSON.parse(raw);
                console.log(chalk_1.default.green('Recording stopped'));
                if (data.path)
                    console.log(chalk_1.default.dim(`  Video: ${data.path}`));
            }
            else {
                console.error(chalk_1.default.red('Usage: cm browse record <start|stop>'));
                process.exit(1);
            }
        }
        catch (e) {
            console.error(chalk_1.default.red(e.message));
            process.exit(1);
        }
    }));
    const guardian = program.command('guardian').description('Runtime safety: destructive command patterns + path freeze');
    guardian
        .command('check')
        .argument('<cmd...>', 'shell command to check')
        .action((parts) => {
        var _a;
        const cmd = parts.join(' ');
        const cfg = (0, cm_config_1.loadCmConfig)(process.cwd());
        const extra = (_a = cfg.guardian) === null || _a === void 0 ? void 0 : _a.whitelist_prefixes;
        const r = (0, guardian_core_1.checkShellCommand)(cmd, (extra === null || extra === void 0 ? void 0 : extra.length) ? { extraWhitelist: extra } : undefined);
        if (!r.safe) {
            console.error(chalk_1.default.red('BLOCKED:'), r.reason);
            console.error(chalk_1.default.dim('Pattern:'), r.matchedPattern);
            (0, guardian_core_1.appendGuardianLog)(process.cwd(), `BLOCKED: ${cmd}`);
            process.exit(1);
        }
        console.log(chalk_1.default.green('OK'), chalk_1.default.dim(cmd));
    });
    guardian
        .command('path-check')
        .requiredOption('--file <f>', 'file path')
        .option('--roots <r>', 'comma-separated roots (default: config guardian.freeze_roots or src,lib)')
        .action((opts) => {
        var _a, _b, _c;
        const cwd = process.cwd();
        const cfg = (0, cm_config_1.loadCmConfig)(cwd);
        const rootsCsv = (_a = opts.roots) !== null && _a !== void 0 ? _a : (((_c = (_b = cfg.guardian) === null || _b === void 0 ? void 0 : _b.freeze_roots) === null || _c === void 0 ? void 0 : _c.length) ? cfg.guardian.freeze_roots.join(',') : 'src,lib');
        const roots = (0, guardian_core_1.normalizeRoots)(cwd, String(rootsCsv)
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean));
        const ok = (0, guardian_core_1.isPathUnderRoots)(opts.file, roots);
        if (!ok) {
            console.error(chalk_1.default.red('Path outside freeze roots:'), opts.file);
            (0, guardian_core_1.appendGuardianLog)(cwd, `FREEZE_VIOLATION: ${opts.file}`);
            process.exit(1);
        }
        console.log(chalk_1.default.green('OK'), opts.file);
    });
    const advisory = program
        .command('advisory')
        .description('Operator-facing execution analysis and skill quality reports');
    advisory
        .command('report')
        .description('Show recent execution analyses with recommended actions')
        .option('--project <dir>')
        .option('--limit <n>', 'number of analyses to show', '10')
        .action((opts) => {
        var _a;
        const root = projectPath(opts.project);
        const backend = (0, storage_backend_1.getBackend)(root);
        backend.initialize();
        try {
            const limit = Math.max(1, parseInt(String((_a = opts.limit) !== null && _a !== void 0 ? _a : '10'), 10) || 10);
            console.log((0, advisory_report_1.formatAdvisoryReport)(backend, { limit }));
        }
        finally {
            backend.close();
        }
    });
    advisory
        .command('metrics')
        .description('Show aggregated skill metrics with quality weights')
        .option('--project <dir>')
        .option('--limit <n>', 'number of skills to show', '10')
        .action((opts) => {
        var _a;
        const root = projectPath(opts.project);
        const backend = (0, storage_backend_1.getBackend)(root);
        backend.initialize();
        try {
            const limit = Math.max(1, parseInt(String((_a = opts.limit) !== null && _a !== void 0 ? _a : '10'), 10) || 10);
            console.log((0, advisory_report_1.formatAdvisoryMetrics)(backend, { limit }));
        }
        finally {
            backend.close();
        }
    });
    advisory
        .command('handoff')
        .description('Build a structured advisory handoff for cm-skill-health or cm-skill-evolution')
        .requiredOption('--for <consumer>', 'cm-skill-health | cm-skill-evolution')
        .option('--analysis <id>', 'analysis id prefix (default: latest)')
        .option('--skill <name>', 'override target skill')
        .option('--format <f>', 'md | json', 'md')
        .option('--project <dir>')
        .action((opts) => {
        var _a;
        const consumer = String(opts.for);
        if (consumer !== 'cm-skill-health' && consumer !== 'cm-skill-evolution') {
            console.error(chalk_1.default.red('Invalid --for value. Use cm-skill-health or cm-skill-evolution.'));
            process.exit(1);
        }
        const root = projectPath(opts.project);
        const backend = (0, storage_backend_1.getBackend)(root);
        backend.initialize();
        try {
            const handoff = (0, advisory_handoff_1.buildAdvisoryHandoff)(backend, {
                consumer,
                analysisId: opts.analysis,
                skill: opts.skill,
            });
            const format = String((_a = opts.format) !== null && _a !== void 0 ? _a : 'md').toLowerCase();
            if (format === 'json')
                console.log(JSON.stringify(handoff, null, 2));
            else
                console.log((0, advisory_handoff_1.formatAdvisoryHandoffMarkdown)(handoff));
        }
        catch (error) {
            console.error(chalk_1.default.red(error.message));
            process.exit(1);
        }
        finally {
            backend.close();
        }
    });
    const sprint = program.command('sprint').description('Opinionated pipeline + .cm/sprint Context Bus');
    sprint
        .command('init')
        .option('--project <dir>')
        .option('--from <step>', `one of: ${sprint_pipeline_1.SPRINT_STEPS.join(',')}`)
        .action((opts) => {
        const root = projectPath(opts.project);
        const from = opts.from;
        if (from && !sprint_pipeline_1.SPRINT_STEPS.includes(from)) {
            console.error(chalk_1.default.red('Invalid --from'));
            process.exit(1);
        }
        const state = (0, sprint_pipeline_1.initSprint)(root, from);
        console.log(chalk_1.default.green('Sprint initialized'));
        console.log(chalk_1.default.dim(JSON.stringify(state, null, 2)));
    });
    sprint
        .command('status')
        .option('--project <dir>')
        .action((opts) => {
        const root = projectPath(opts.project);
        const state = (0, sprint_pipeline_1.readSprintState)(root);
        if (!state) {
            console.log(chalk_1.default.yellow('No sprint state. Run: cm sprint init'));
            return;
        }
        const next = state.current_index >= state.pipeline.length
            ? '(done)'
            : state.pipeline[state.current_index];
        console.log(chalk_1.default.cyan('Current step:'), next);
        if (typeof next === 'string' && next !== '(done)')
            console.log(chalk_1.default.dim('Skill hint:'), (0, sprint_pipeline_1.skillMappingForStep)(next));
        console.log(chalk_1.default.dim('Completed:'), state.completed.join(', ') || '(none)');
        console.log(chalk_1.default.dim('Skipped:'), state.skipped.join(', ') || '(none)');
    });
    sprint
        .command('complete')
        .argument('<step>', 'step name')
        .option('--project <dir>')
        .option('-m, --message <text>', 'artifact markdown body', '')
        .action((step, opts) => {
        const root = projectPath(opts.project);
        if (!sprint_pipeline_1.SPRINT_STEPS.includes(step)) {
            console.error(chalk_1.default.red('Invalid step'));
            process.exit(1);
        }
        const body = opts.message ||
            `# ${step}\n\n_Completed via \`cm sprint complete\` — replace with real notes._\n`;
        try {
            const state = (0, sprint_pipeline_1.completeSprintStep)(root, step, body);
            console.log(chalk_1.default.green('Step recorded:', step));
            console.log(chalk_1.default.dim('Next index:', state.current_index));
        }
        catch (e) {
            console.error(chalk_1.default.red(e.message));
            process.exit(1);
        }
    });
    sprint
        .command('skip')
        .argument('[step]', 'step name (default: current step)')
        .option('--project <dir>')
        .action((step, opts) => {
        const root = projectPath(opts.project);
        const state = (0, sprint_pipeline_1.readSprintState)(root);
        if (!state) {
            console.error(chalk_1.default.red('No sprint state. Run: cm sprint init'));
            process.exit(1);
        }
        if (state.current_index >= state.pipeline.length) {
            console.error(chalk_1.default.red('Sprint pipeline already finished'));
            process.exit(1);
        }
        const current = state.pipeline[state.current_index];
        const target = (step || current);
        if (step && !sprint_pipeline_1.SPRINT_STEPS.includes(target)) {
            console.error(chalk_1.default.red('Invalid step'));
            process.exit(1);
        }
        try {
            const next = (0, sprint_pipeline_1.skipSprintStep)(root, target);
            console.log(chalk_1.default.green('Skipped step:', target));
            console.log(chalk_1.default.dim('Next index:', next.current_index));
        }
        catch (e) {
            console.error(chalk_1.default.red(e.message));
            process.exit(1);
        }
    });
    sprint
        .command('reset')
        .option('--project <dir>')
        .option('--no-backup', 'do not copy sprint files to .cm/sprint/backup before clearing')
        .action((opts) => {
        const root = projectPath(opts.project);
        const r = (0, sprint_pipeline_1.resetSprint)(root, { backup: opts.backup !== false });
        if (!r.ok) {
            console.log(chalk_1.default.yellow('Nothing to reset (no sprint data under .cm/sprint).'));
            return;
        }
        if (r.backupDir)
            console.log(chalk_1.default.dim('Backup:'), r.backupDir);
        console.log(chalk_1.default.green('Sprint data cleared. Run: cm sprint init'));
    });
    sprint
        .command('dry-run')
        .option('--project <dir>')
        .action((opts) => {
        const root = projectPath(opts.project);
        const d = (0, sprint_pipeline_1.sprintDryRun)(root);
        console.log(chalk_1.default.cyan('Steps:'), d.steps.join(' → '));
        d.artifacts.forEach((a) => console.log(chalk_1.default.dim(' -'), a));
    });
    program
        .command('second-opinion')
        .description('Send unified diff to a secondary model (redacts obvious secrets)')
        .option('--file <f>', 'file containing diff text')
        .option('--provider <p>', 'openai | anthropic', 'openai')
        .action((opts) => __awaiter(this, void 0, void 0, function* () {
        const provider = String(opts.provider || 'openai').toLowerCase();
        const raw = opts.file ? fs_1.default.readFileSync(opts.file, 'utf8') : '';
        const text = raw ? (0, second_opinion_providers_1.redactDiffForReview)(raw) : '';
        if (!opts.file || !text.trim()) {
            console.log(chalk_1.default.yellow('Pass --file <diff.txt>. Set OPENAI_API_KEY (openai) or ANTHROPIC_API_KEY (anthropic).'));
            console.log(chalk_1.default.dim('Diff content is redacted for common secret patterns before sending.'));
            return;
        }
        try {
            let out;
            if (provider === 'anthropic')
                out = yield (0, second_opinion_providers_1.reviewWithAnthropic)(text);
            else if (provider === 'openai')
                out = yield (0, second_opinion_providers_1.reviewWithOpenAI)(text);
            else {
                console.error(chalk_1.default.red('Unknown --provider (use openai or anthropic)'));
                process.exit(1);
            }
            console.log(out);
        }
        catch (e) {
            console.error(chalk_1.default.red(e.message));
            process.exit(1);
        }
    }));
    program
        .command('qa-visual')
        .description('Hit cm-browse for screenshot + health (requires browse running)')
        .requiredOption('--url <u>', 'page URL to navigate')
        .option('--port <n>', 'browse daemon port (default: config browse.port or 17395)')
        .option('--token <t>', 'or env CM_BROWSE_TOKEN or config browse.token')
        .action((opts) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        const cfg = (0, cm_config_1.loadCmConfig)(process.cwd());
        const token = getBrowseToken(process.cwd(), opts.token);
        const port = parseInt(String((_c = (_a = opts.port) !== null && _a !== void 0 ? _a : (_b = cfg.browse) === null || _b === void 0 ? void 0 : _b.port) !== null && _c !== void 0 ? _c : 17395), 10);
        const auth = `Bearer ${token}`;
        yield browseRequest(port, '/session/start', 'POST', auth, { headless: true });
        yield browseRequest(port, '/navigate', 'POST', auth, { url: opts.url });
        yield browseRequest(port, '/refs/refresh', 'POST', auth, {});
        const png = yield browseBuffer(port, '/screenshot', auth);
        const out = path_1.default.join(process.cwd(), 'cm-qa-visual.png');
        fs_1.default.writeFileSync(out, png);
        console.log(chalk_1.default.green('Screenshot saved'), out);
    }));
    program
        .command('canary')
        .description('Post-deploy smoke: HTTP fetch + optional browse console; baseline compare')
        .requiredOption('--url <u>', 'URL to fetch (http/https)')
        .option('--browse-port <n>', 'if set, GET /console from browse (default: config canary.browse_port)')
        .option('--token <t>', 'browse token (env CM_BROWSE_TOKEN or config)')
        .option('--save-baseline', 'write .cm/canary-baseline.json after check')
        .option('--compare-baseline', 'fail on HTTP regression or 2× latency vs baseline')
        .action((opts) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        const root = process.cwd();
        const cfg = (0, cm_config_1.loadCmConfig)(root);
        const u = new URL(opts.url);
        const { status, latency_ms } = yield httpProbeUrl(u.href);
        if (status >= 400) {
            console.error(chalk_1.default.red(`HTTP ${status}`), u.href);
            process.exit(1);
        }
        if (opts.compareBaseline) {
            const baselinePath = path_1.default.join(root, '.cm', 'canary-baseline.json');
            if (!fs_1.default.existsSync(baselinePath)) {
                console.error(chalk_1.default.red('No baseline file. Run once with --save-baseline'));
                process.exit(1);
            }
            const prev = JSON.parse(fs_1.default.readFileSync(baselinePath, 'utf8'));
            if (prev.http_status !== undefined &&
                prev.http_status < 400 &&
                status >= 400) {
                console.error(chalk_1.default.red('HTTP regression vs baseline'));
                process.exit(1);
            }
            if (typeof prev.latency_ms === 'number' &&
                prev.latency_ms > 50 &&
                latency_ms > prev.latency_ms * 2) {
                console.error(chalk_1.default.red(`Latency regression: ${latency_ms}ms vs baseline ${prev.latency_ms}ms`));
                process.exit(1);
            }
            console.log(chalk_1.default.dim('Baseline compare OK'));
        }
        if (opts.saveBaseline) {
            const baselinePath = path_1.default.join(root, '.cm', 'canary-baseline.json');
            fs_1.default.mkdirSync(path_1.default.dirname(baselinePath), { recursive: true });
            fs_1.default.writeFileSync(baselinePath, JSON.stringify({
                url: opts.url,
                http_status: status,
                latency_ms,
                at: new Date().toISOString(),
            }, null, 2), 'utf8');
            console.log(chalk_1.default.dim('Wrote'), baselinePath);
        }
        console.log(chalk_1.default.green('HTTP OK'), u.href, chalk_1.default.dim(`${status} ${latency_ms}ms`));
        const browsePort = (_a = opts.browsePort) !== null && _a !== void 0 ? _a : (((_b = cfg.canary) === null || _b === void 0 ? void 0 : _b.browse_port) != null ? String(cfg.canary.browse_port) : undefined);
        if (browsePort) {
            const token = opts.token || process.env.CM_BROWSE_TOKEN || ((_c = cfg.canary) === null || _c === void 0 ? void 0 : _c.token) || getBrowseToken(root);
            const raw = yield browseRaw(parseInt(browsePort, 10), '/console', `Bearer ${token}`);
            console.log(chalk_1.default.dim('Browse console (last messages):'), raw.slice(0, 500));
        }
    }));
    const conductor = program.command('conductor').description('Git worktree helpers for parallel sprints');
    conductor
        .command('add')
        .requiredOption('--at <dir>', 'new worktree directory')
        .requiredOption('--branch <b>', 'branch name')
        .option('--base <b>', 'start from branch', 'main')
        .action((opts) => {
        (0, child_process_1.execFileSync)('git', ['worktree', 'add', '-b', opts.branch, opts.at, opts.base], {
            stdio: 'inherit',
            cwd: process.cwd(),
        });
        console.log(chalk_1.default.green('Worktree created'));
    });
    conductor.command('list').action(() => {
        (0, child_process_1.execFileSync)('git', ['worktree', 'list'], { stdio: 'inherit', cwd: process.cwd() });
    });
    const retro = program
        .command('retro')
        .description('Append operational learning (.cm/operational-learnings.jsonl) or print summary');
    retro
        .command('summary')
        .description('Aggregate JSONL by tool; optional --since filter')
        .option('--project <dir>')
        .option('--since <iso>', 'include entries on or after this ISO timestamp')
        .option('--format <f>', 'json | md', 'md')
        .action((opts) => {
        const root = projectPath(opts.project);
        const j = path_1.default.join(root, '.cm', 'operational-learnings.jsonl');
        let entries = (0, retro_summary_1.loadRetroEntries)(j);
        if (opts.since)
            entries = (0, retro_summary_1.filterSince)(entries, opts.since);
        const byTool = (0, retro_summary_1.countByTool)(entries);
        const fmt = (opts.format || 'md').toLowerCase();
        if (fmt === 'json')
            console.log((0, retro_summary_1.formatRetroJson)(entries, byTool));
        else
            console.log((0, retro_summary_1.formatRetroMarkdown)(entries, byTool));
    });
    retro
        .option('--note <text>', 'append entry')
        .option('--tool <t>', 'tool label', 'cli')
        .option('--project <dir>')
        .option('--summary', 'print last 20 lines (legacy quick view)')
        .action((opts) => {
        const root = projectPath(opts.project);
        const dir = path_1.default.join(root, '.cm');
        if (!fs_1.default.existsSync(dir))
            fs_1.default.mkdirSync(dir, { recursive: true });
        const j = path_1.default.join(dir, 'operational-learnings.jsonl');
        if (opts.summary) {
            if (!fs_1.default.existsSync(j)) {
                console.log(chalk_1.default.yellow('No entries yet'));
                return;
            }
            const lines = fs_1.default.readFileSync(j, 'utf8').trim().split('\n').filter(Boolean).slice(-20);
            for (const line of lines)
                console.log(line);
            return;
        }
        if (!opts.note) {
            console.log(chalk_1.default.yellow('Pass --note "...", --summary, or: cm retro summary'));
            return;
        }
        const rec = {
            ts: new Date().toISOString(),
            tool: opts.tool,
            note: opts.note,
        };
        fs_1.default.appendFileSync(j, JSON.stringify(rec) + '\n', 'utf8');
        console.log(chalk_1.default.green('Recorded'));
    });
    program
        .command('suggest')
        .description('Proactive skill hints from git status + sprint state')
        .option('--project <dir>')
        .action((opts) => {
        const root = projectPath(opts.project);
        const list = (0, cm_suggest_1.suggestFromContext)(root);
        if (list.length === 0) {
            console.log(chalk_1.default.yellow('No strong signals. Try cm-start or cm-planning for the next step.'));
            return;
        }
        for (const s of list) {
            console.log(chalk_1.default.cyan(s.skill));
            console.log(chalk_1.default.dim(`  ${s.reason}`));
        }
    });
    const indexer = program.command('index').description('Project intelligence indexing');
    indexer
        .command('skills')
        .description('Detect tech stack and build .cm/project-skills.md')
        .option('--project <dir>')
        .action((opts) => {
        const root = projectPath(opts.project);
        // Lazy load to avoid module compilation issues at boot if not used
        const { generateProjectSkillsIndex } = require('../../indexer/skills');
        const idx = generateProjectSkillsIndex(root);
        const dotCm = path_1.default.join(root, '.cm');
        if (!fs_1.default.existsSync(dotCm)) {
            fs_1.default.mkdirSync(dotCm, { recursive: true });
        }
        const out = path_1.default.join(dotCm, 'project-skills.md');
        const md = [
            '# Local Project Skills Index',
            '',
            `Detected Technologies: **${idx.detectedTechnologies.join(', ') || 'None'}**`,
            '',
            '## Recommended Community Skills',
            ...idx.recommendedSkills.map((s) => `- \`${s}\``),
            '',
            '> Autogenerated by `cm index skills`. Agents should run `npx skills add <skill>` if needed.'
        ].join('\n');
        fs_1.default.writeFileSync(out, md, 'utf-8');
        console.log(chalk_1.default.green(`Indexed ${idx.detectedTechnologies.length} technologies and ${idx.recommendedSkills.length} skills to ${out}`));
    });
}
function browseRequest(port, pathname, method, auth, body) {
    return new Promise((resolve, reject) => {
        const data = Buffer.from(JSON.stringify(body));
        const req = http_1.default.request({
            hostname: '127.0.0.1',
            port,
            path: pathname,
            method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length,
                Authorization: auth,
            },
        }, (res) => {
            res.resume();
            if (res.statusCode && res.statusCode >= 400)
                reject(new Error(`HTTP ${res.statusCode}`));
            else
                resolve();
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}
function browseBuffer(port, pathname, auth) {
    return new Promise((resolve, reject) => {
        http_1.default.get({
            hostname: '127.0.0.1',
            port,
            path: pathname,
            headers: { Authorization: auth },
        }, (res) => {
            const chunks = [];
            res.on('data', (c) => chunks.push(c));
            res.on('end', () => {
                if (res.statusCode && res.statusCode >= 400)
                    reject(new Error(`HTTP ${res.statusCode}`));
                else
                    resolve(Buffer.concat(chunks));
            });
        }).on('error', reject);
    });
}
function browseRaw(port, pathname, auth) {
    return new Promise((resolve, reject) => {
        http_1.default.get({
            hostname: '127.0.0.1',
            port,
            path: pathname,
            headers: { Authorization: auth },
        }, (res) => {
            let s = '';
            res.on('data', (c) => (s += c));
            res.on('end', () => {
                if (res.statusCode && res.statusCode >= 400)
                    reject(new Error(`HTTP ${res.statusCode}`));
                else
                    resolve(s);
            });
        }).on('error', reject);
    });
}
function browseRequestRaw(port, pathname, method, auth, body = {}) {
    return new Promise((resolve, reject) => {
        const data = Buffer.from(JSON.stringify(body));
        const req = http_1.default.request({
            hostname: '127.0.0.1',
            port,
            path: pathname,
            method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length,
                Authorization: auth,
            },
        }, (res) => {
            let s = '';
            res.on('data', (c) => (s += c));
            res.on('end', () => {
                if (res.statusCode && res.statusCode >= 400)
                    reject(new Error(`HTTP ${res.statusCode}: ${s}`));
                else
                    resolve(s);
            });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}
function httpProbeUrl(url) {
    return __awaiter(this, void 0, void 0, function* () {
        const t0 = performance.now();
        const res = yield fetch(url, { redirect: 'follow' });
        yield res.arrayBuffer().catch(() => { });
        const latency_ms = Math.round(performance.now() - t0);
        return { status: res.status, latency_ms };
    });
}
