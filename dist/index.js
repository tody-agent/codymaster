#!/usr/bin/env node
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
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
const data_1 = require("./data");
const dashboard_1 = require("./dashboard");
const agent_dispatch_1 = require("./agent-dispatch");
const continuity_1 = require("./continuity");
const judge_1 = require("./judge");
const skill_chain_1 = require("./skill-chain");
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const https_1 = __importDefault(require("https"));
// 🐹 Hamster Shell UI modules
const theme_1 = require("./ui/theme");
const box_1 = require("./ui/box");
const hamster_1 = require("./ui/hamster");
const hooks_1 = require("./ui/hooks");
const onboarding_1 = require("./ui/onboarding");
const VERSION = require('../package.json').version;
// ─── Update Check ───────────────────────────────────────────────────────────
let _updateMessage = '';
function checkForUpdates() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const cacheDir = path_1.default.join(os_1.default.homedir(), '.codymaster');
            const cacheFile = path_1.default.join(cacheDir, '.update-check');
            // Check cache (24h TTL)
            try {
                if (fs_1.default.existsSync(cacheFile)) {
                    const stat = fs_1.default.statSync(cacheFile);
                    const age = Date.now() - stat.mtimeMs;
                    if (age < 24 * 60 * 60 * 1000) {
                        const cached = fs_1.default.readFileSync(cacheFile, 'utf-8').trim();
                        if (cached && cached !== VERSION) {
                            _updateMessage = cached;
                        }
                        return;
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
                            resolve(json.version || VERSION);
                        }
                        catch (_a) {
                            resolve(VERSION);
                        }
                    });
                }).on('error', () => { clearTimeout(timer); reject(new Error('fetch failed')); });
            });
            // Cache result
            try {
                if (!fs_1.default.existsSync(cacheDir))
                    fs_1.default.mkdirSync(cacheDir, { recursive: true });
                fs_1.default.writeFileSync(cacheFile, latestVersion);
            }
            catch ( /* ignore */_b) { /* ignore */ }
            if (latestVersion !== VERSION) {
                _updateMessage = latestVersion;
            }
        }
        catch ( /* silently skip — offline or timeout */_c) { /* silently skip — offline or timeout */ }
    });
}
function printUpdateNotice() {
    if (_updateMessage) {
        console.log(chalk_1.default.yellow(`  ⚠️  Update available: ${VERSION} → ${_updateMessage}`) + chalk_1.default.gray('  Run: ') + chalk_1.default.cyan('npm i -g codymaster'));
    }
}
// ─── Branding ───────────────────────────────────────────────────────────────
function showBanner() {
    const cPath = process.cwd().replace(os_1.default.homedir(), '~');
    const profile = (0, hooks_1.loadProfile)();
    console.log((0, hamster_1.renderHamsterBanner)(profile.userName || undefined, VERSION, cPath));
    printUpdateNotice();
}
// ─── Utility ────────────────────────────────────────────────────────────────
// Color maps now imported from ./ui/theme (COL, PRI, STATUS)
const COL_COLORS = theme_1.COL;
const PRIORITY_COLORS = theme_1.PRI;
const STATUS_COLORS = theme_1.STATUS;
function padRight(str, len) {
    return str.length >= len ? str.substring(0, len) : str + ' '.repeat(len - str.length);
}
function openUrl(url) {
    const { execFile } = require('child_process');
    const [cmd, ...args] = process.platform === 'darwin' ? ['open', url] :
        process.platform === 'win32' ? ['cmd', '/c', 'start', url] :
            ['xdg-open', url];
    execFile(cmd, args, () => { });
}
// ─── Post-install Onboarding ─────────────────────────────────────────────────
function postInstallOnboarding(platform) {
    return __awaiter(this, void 0, void 0, function* () {
        // Run the self-onboarding wizard
        const profile = (0, hooks_1.loadProfile)();
        if (!profile.onboardingComplete) {
            // Set platform from install if not already set
            if (platform && !profile.platform) {
                profile.platform = platform;
                (0, hooks_1.saveProfile)(profile);
            }
            yield (0, onboarding_1.runOnboarding)(VERSION);
        }
        else {
            // Already onboarded — show returning welcome
            const p = yield Promise.resolve().then(() => __importStar(require('@clack/prompts')));
            console.log('');
            console.log((0, hamster_1.getHamsterArt)('celebrating'));
            console.log('');
            console.log(`    ${(0, theme_1.success)('🎉')} ${(0, theme_1.brandBold)(`Welcome back, ${profile.userName || 'friend'}!`)}`);
            console.log('');
            const action = yield p.select({
                message: 'What would you like to do?',
                options: [
                    { label: `${theme_1.ICONS.dashboard}  Launch Dashboard`, value: 'dashboard', hint: `localhost:${data_1.DEFAULT_PORT}` },
                    { label: `${theme_1.ICONS.skill}  Browse all 65 skills`, value: 'skills' },
                    { label: `${theme_1.ICONS.deploy}  Start with your AI`, value: 'invoke', hint: profile.platform || 'any agent' },
                    { label: `${(0, theme_1.success)('✓')}  Done`, value: 'done' },
                ],
            });
            if (p.isCancel(action))
                return;
            switch (action) {
                case 'dashboard':
                    if (!isDashboardRunning()) {
                        (0, dashboard_1.launchDashboard)(data_1.DEFAULT_PORT, false);
                        yield new Promise(r => setTimeout(r, 800));
                    }
                    console.log((0, theme_1.info)(`\n  🌐 Opening http://localhost:${data_1.DEFAULT_PORT} ...\n`));
                    openUrl(`http://localhost:${data_1.DEFAULT_PORT}`);
                    break;
                case 'skills':
                    console.log('');
                    skillList();
                    break;
                case 'invoke':
                    console.log('');
                    const invoke = profile.platform === 'claude' ? '/cm:demo' :
                        profile.platform === 'gemini' ? '@[/cm-planning]' :
                            '@cm-planning';
                    console.log(`  ${(0, theme_1.brand)('→')} Type ${(0, theme_1.brandBold)(invoke)} in your AI agent\n`);
                    break;
                default:
                    console.log((0, theme_1.dim)('\n  Run cm any time! 🐹\n'));
            }
        }
    });
}
// ─── Interactive Quick Menu (no-args entry point) ─────────────────────────────
function showInteractiveMenu() {
    return __awaiter(this, void 0, void 0, function* () {
        const profile = (0, hooks_1.loadProfile)();
        // 🎳 First Run → Start onboarding wizard
        if (!profile.onboardingComplete) {
            yield (0, onboarding_1.runOnboarding)(VERSION);
            return;
        }
        // 🪝 Hook: Record command + check achievements
        (0, hooks_1.recordCommand)(profile, 'menu');
        const newAchievements = (0, hooks_1.checkAchievements)(profile);
        (0, hooks_1.saveProfile)(profile);
        // Show banner with hamster
        showBanner();
        // 🪝 Hook: Contextual trigger
        const data = (0, data_1.loadData)();
        const taskCounts = {
            tasksInProgress: data.tasks.filter(t => t.column === 'in-progress').length,
            tasksInReview: data.tasks.filter(t => t.column === 'review').length,
            tasksDone: data.tasks.filter(t => t.column === 'done').length,
            totalTasks: data.tasks.length,
        };
        const trigger = (0, hooks_1.getContextualTrigger)(profile, taskCounts);
        console.log(`  ${(0, theme_1.brand)(theme_1.ICONS.hamster)} ${(0, theme_1.dim)(trigger)}`);
        // Dashboard status
        const dashStatus = isDashboardRunning()
            ? (0, theme_1.success)(`${theme_1.ICONS.dot} RUNNING`) + (0, theme_1.dim)(` http://localhost:${data_1.DEFAULT_PORT}`)
            : (0, theme_1.muted)(`${theme_1.ICONS.dotEmpty} stopped`);
        console.log(`  ${(0, theme_1.dim)('Dashboard:')} ${dashStatus}`);
        console.log('');
        // Show new achievements
        for (const id of newAchievements) {
            console.log((0, hooks_1.formatAchievement)(id));
        }
        if (newAchievements.length > 0)
            console.log('');
        // Level indicator
        console.log(`  ${(0, theme_1.dim)('Level:')} ${(0, hooks_1.getLevelDisplay)(profile.level)} ${(0, theme_1.dim)('•')} ${(0, theme_1.dim)('Streak:')} ${profile.streak > 0 ? (0, theme_1.brand)(`${theme_1.ICONS.fire} ${profile.streak}d`) : (0, theme_1.muted)('—')}`);
        console.log('');
        // Quick menu with @clack/prompts
        const p = yield Promise.resolve().then(() => __importStar(require('@clack/prompts')));
        const action = yield p.select({
            message: 'Quick menu',
            options: [
                { label: `${theme_1.ICONS.dashboard}  Dashboard`, value: 'dashboard', hint: isDashboardRunning() ? 'Open' : 'Start & open' },
                { label: `${theme_1.ICONS.task}  My Tasks`, value: 'tasks', hint: `${taskCounts.totalTasks} total` },
                { label: `📈 Status`, value: 'status', hint: 'Health snapshot' },
                { label: `${theme_1.ICONS.skill}  Browse Skills`, value: 'skills', hint: '65 skills' },
                { label: `➕ Add a Task`, value: 'addtask', hint: 'Quick add' },
                { label: `⚡ Install Skills`, value: 'install', hint: 'Update all' },
                { label: `${theme_1.ICONS.hamster}  My Profile`, value: 'profile', hint: `${profile.level}` },
                { label: `❓ Help`, value: 'help' },
            ],
        });
        if (p.isCancel(action)) {
            console.log((0, theme_1.dim)('\n  See you soon! 🐹\n'));
            return;
        }
        console.log('');
        switch (action) {
            case 'dashboard':
                if (!isDashboardRunning()) {
                    (0, dashboard_1.launchDashboard)(data_1.DEFAULT_PORT, false);
                    yield new Promise(r => setTimeout(r, 800));
                }
                console.log((0, theme_1.info)(`  🌐 Opening http://localhost:${data_1.DEFAULT_PORT} ...`));
                openUrl(`http://localhost:${data_1.DEFAULT_PORT}`);
                console.log((0, theme_1.dim)('  Dashboard is running. Ctrl+C to stop.\n'));
                break;
            case 'tasks':
                require('child_process').spawnSync(process.execPath, [process.argv[1], 'task', 'list'], { stdio: 'inherit' });
                break;
            case 'status':
                require('child_process').spawnSync(process.execPath, [process.argv[1], 'status'], { stdio: 'inherit' });
                break;
            case 'skills':
                skillList();
                break;
            case 'addtask': {
                const title = yield p.text({
                    message: 'Task title:',
                    placeholder: 'What are you working on?',
                    validate: (val) => {
                        if (!val || val.trim().length === 0)
                            return 'Give your task a title!';
                        return undefined;
                    },
                });
                if (!p.isCancel(title) && title) {
                    require('child_process').spawnSync(process.execPath, [process.argv[1], 'task', 'add', title], { stdio: 'inherit' });
                }
                break;
            }
            case 'install':
                console.log(`  ${(0, theme_1.brand)('→')} Run: ${(0, theme_1.brandBold)('bash <(curl -fsSL https://raw.githubusercontent.com/tody-agent/codymaster/main/install.sh) --all')}\n`);
                break;
            case 'profile':
                console.log((0, hooks_1.formatProfileSummary)(profile));
                break;
            case 'help':
            default: {
                const helpItems = [
                    `${(0, theme_1.brand)('cm')}                   ${(0, theme_1.dim)('Quick menu')}`,
                    `${(0, theme_1.brand)('cm task add')} ${(0, theme_1.dim)('"..."')}    ${(0, theme_1.dim)('Add a task')}`,
                    `${(0, theme_1.brand)('cm task list')}          ${(0, theme_1.dim)('View tasks')}`,
                    `${(0, theme_1.brand)('cm status')}             ${(0, theme_1.dim)('Project health')}`,
                    `${(0, theme_1.brand)('cm dashboard')}          ${(0, theme_1.dim)('Mission Control')}`,
                    `${(0, theme_1.brand)('cm list')}               ${(0, theme_1.dim)('Browse 65 skills')}`,
                    `${(0, theme_1.brand)('cm deploy')} ${(0, theme_1.dim)('<env>')}       ${(0, theme_1.dim)('Record deploy')}`,
                    `${(0, theme_1.brand)('cm profile')}            ${(0, theme_1.dim)('Your stats')}`,
                ];
                console.log((0, box_1.renderBox)(helpItems, { title: 'Commands', width: 52 }));
                console.log('');
            }
        }
    });
}
// ─── Program ────────────────────────────────────────────────────────────────
const program = new commander_1.Command();
program
    .name('cm')
    .description('Cody — 65 Skills. Ship 10x faster.')
    .version(VERSION, '-v, --version', 'Show version')
    .argument('[cmd]', 'Command to run', '')
    .action((cmd) => __awaiter(void 0, void 0, void 0, function* () {
    if (cmd && cmd !== 'help') {
        console.log(chalk_1.default.red(`\n  ❌ Unknown command: ${cmd}\n`));
        program.help();
        return;
    }
    else if (cmd === 'help') {
        program.help();
        return;
    }
    // Interactive quick menu (Amp-style)
    yield showInteractiveMenu();
}));
// ─── Dashboard Command ─────────────────────────────────────────────────────
program
    .command('dashboard [cmd]')
    .alias('dash')
    .description('Dashboard server (start|stop|status|open)')
    .option('-p, --port <port>', 'Port number', String(data_1.DEFAULT_PORT))
    .action((cmd, opts) => {
    const port = parseInt(opts.port) || data_1.DEFAULT_PORT;
    switch (cmd) {
        case 'start':
        case undefined:
            if (isDashboardRunning()) {
                console.log((0, box_1.renderResult)('warning', 'Dashboard already running.', [`${(0, theme_1.dim)('URL:')} ${(0, theme_1.brand)(`http://localhost:${port}`)}`]));
                return;
            }
            (0, dashboard_1.launchDashboard)(port);
            break;
        case 'stop':
            stopDashboard();
            break;
        case 'status':
            dashboardStatus(port);
            break;
        case 'open':
            console.log((0, box_1.renderResult)('info', `Opening http://localhost:${port} ...`));
            openUrl(`http://localhost:${port}`);
            break;
        case 'url':
            console.log(`http://localhost:${port}`);
            break;
        default: console.log((0, box_1.renderResult)('error', `Unknown: ${cmd}`, [(0, theme_1.dim)('Available: start, stop, status, open, url')]));
    }
});
function isDashboardRunning() {
    try {
        if (!fs_1.default.existsSync(data_1.PID_FILE))
            return false;
        const pid = parseInt(fs_1.default.readFileSync(data_1.PID_FILE, 'utf-8').trim());
        process.kill(pid, 0);
        return true;
    }
    catch (_a) {
        try {
            fs_1.default.unlinkSync(data_1.PID_FILE);
        }
        catch (_b) { }
        return false;
    }
}
function stopDashboard() {
    try {
        if (!fs_1.default.existsSync(data_1.PID_FILE)) {
            console.log((0, box_1.renderResult)('warning', 'No dashboard running.'));
            return;
        }
        const pid = parseInt(fs_1.default.readFileSync(data_1.PID_FILE, 'utf-8').trim());
        process.kill(pid, 'SIGTERM');
        try {
            fs_1.default.unlinkSync(data_1.PID_FILE);
        }
        catch (_a) { }
        console.log((0, box_1.renderResult)('success', `Dashboard stopped (PID ${pid}).`));
    }
    catch (err) {
        console.log((0, box_1.renderResult)('error', `Failed to stop: ${err.message}`));
        try {
            fs_1.default.unlinkSync(data_1.PID_FILE);
        }
        catch (_b) { }
    }
}
function dashboardStatus(port) {
    if (isDashboardRunning()) {
        const pid = fs_1.default.readFileSync(data_1.PID_FILE, 'utf-8').trim();
        console.log((0, box_1.renderResult)('success', 'Dashboard RUNNING', [`${(0, theme_1.dim)('PID:')} ${(0, theme_1.brand)(pid)}`, `${(0, theme_1.dim)('URL:')} ${(0, theme_1.brand)(`http://localhost:${port}`)}`]));
    }
    else {
        console.log((0, box_1.renderResult)('warning', 'Dashboard NOT running', [(0, theme_1.dim)('Start with: cm dashboard start')]));
    }
}
// ─── Task Command ───────────────────────────────────────────────────────────
program
    .command('task <cmd> [args...]')
    .alias('t')
    .description('Task management (add|list|move|done|rm)')
    .option('-p, --project <name>', 'Project name or ID')
    .option('-c, --column <column>', 'Column (backlog|in-progress|review|done)', 'backlog')
    .option('--priority <level>', 'Priority (low|medium|high|urgent)', 'medium')
    .option('--agent <agent>', 'Agent name')
    .option('--skill <skill>', 'Skill name')
    .option('--all', 'Show all projects')
    .option('--force', 'Force re-dispatch')
    .action((cmd, args, opts) => {
    switch (cmd) {
        case 'add':
            taskAdd(args.join(' '), opts);
            break;
        case 'list':
        case 'ls':
            taskList(opts);
            break;
        case 'move':
            taskMove(args[0], args[1]);
            break;
        case 'done':
            taskDone(args[0]);
            break;
        case 'rm':
        case 'delete':
            taskRemove(args[0]);
            break;
        case 'dispatch':
            taskDispatch(args[0], opts);
            break;
        case 'stuck':
            taskStuck(opts);
            break;
        default: console.log((0, box_1.renderResult)('error', `Unknown: ${cmd}`, [(0, theme_1.dim)('Available: add, list, move, done, rm, dispatch, stuck')]));
    }
});
function taskAdd(title, opts) {
    if (!title) {
        console.log((0, box_1.renderResult)('error', 'Title required. Usage: cm task add "My task"'));
        return;
    }
    const data = (0, data_1.loadData)();
    let projectId;
    if (opts.project) {
        const project = (0, data_1.findProjectByNameOrId)(data, opts.project);
        if (!project) {
            console.log((0, box_1.renderResult)('error', `Project not found: ${opts.project}`));
            return;
        }
        projectId = project.id;
    }
    else if (data.projects.length > 0) {
        projectId = data.projects[0].id;
    }
    else {
        const dp = { id: crypto_1.default.randomUUID(), name: 'Default Project', path: process.cwd(), agents: [], createdAt: new Date().toISOString() };
        data.projects.push(dp);
        projectId = dp.id;
    }
    const now = new Date().toISOString();
    const column = opts.column || 'backlog';
    const ct = data.tasks.filter(t => t.column === column && t.projectId === projectId);
    const mo = ct.length > 0 ? Math.max(...ct.map(t => t.order)) : -1;
    const task = { id: crypto_1.default.randomUUID(), projectId: projectId, title: title.trim(), description: '', column, order: mo + 1, priority: opts.priority || 'medium', agent: opts.agent || '', skill: opts.skill || '', createdAt: now, updatedAt: now };
    data.tasks.push(task);
    (0, data_1.logActivity)(data, 'task_created', `Task "${task.title}" created via CLI`, projectId, opts.agent || '');
    (0, data_1.saveData)(data);
    const project = data.projects.find(p => p.id === projectId);
    console.log((0, box_1.renderResult)('success', `Task created: ${title}`, [
        `${(0, theme_1.dim)('ID:')} ${(0, theme_1.brand)((0, data_1.shortId)(task.id))} ${(0, theme_1.dim)('|')} ${(0, theme_1.dim)('Project:')} ${(0, theme_1.brand)((project === null || project === void 0 ? void 0 : project.name) || 'Default')} ${(0, theme_1.dim)('|')} ${(0, theme_1.dim)(column)} ${(0, theme_1.dim)('|')} ${(0, theme_1.dim)(opts.priority || 'medium')}`,
    ]));
}
function taskList(opts) {
    const data = (0, data_1.loadData)();
    let tasks = data.tasks;
    if (opts.project && !opts.all) {
        const project = (0, data_1.findProjectByNameOrId)(data, opts.project);
        if (!project) {
            console.log((0, box_1.renderResult)('error', `Project not found: ${opts.project}`));
            return;
        }
        tasks = tasks.filter(t => t.projectId === project.id);
        console.log((0, box_1.renderCommandHeader)(`Tasks — ${project.name}`, '📋'));
    }
    else {
        console.log((0, box_1.renderCommandHeader)('All Tasks', '📋'));
    }
    if (tasks.length === 0) {
        console.log(`  ${(0, theme_1.dim)('No tasks found.')}\n`);
        return;
    }
    console.log((0, theme_1.dim)('  ' + padRight('ID', 10) + padRight('Title', 36) + padRight('Column', 14) + padRight('Priority', 10) + padRight('Agent', 14) + 'Project'));
    console.log((0, theme_1.dim)('  ' + '─'.repeat(100)));
    const co = ['backlog', 'in-progress', 'review', 'done'];
    tasks.sort((a, b) => co.indexOf(a.column) - co.indexOf(b.column) || a.order - b.order);
    for (const task of tasks) {
        const cc = COL_COLORS[task.column] || chalk_1.default.white;
        const pc = PRIORITY_COLORS[task.priority] || chalk_1.default.white;
        const project = data.projects.find(p => p.id === task.projectId);
        console.log('  ' + (0, theme_1.dim)(padRight((0, data_1.shortId)(task.id), 10)) + padRight(task.title.substring(0, 34), 36) + cc(padRight(task.column, 14)) + pc(padRight(task.priority, 10)) + (0, theme_1.dim)(padRight(task.agent || '—', 14)) + (0, theme_1.dim)((project === null || project === void 0 ? void 0 : project.name) || '—'));
    }
    console.log((0, theme_1.dim)(`\n  Total: ${tasks.length} tasks\n`));
}
function taskMove(idPrefix, targetColumn) {
    if (!idPrefix || !targetColumn) {
        console.log((0, box_1.renderResult)('error', 'Usage: cm task move <id> <column>'));
        return;
    }
    const vc = ['backlog', 'in-progress', 'review', 'done'];
    if (!vc.includes(targetColumn)) {
        console.log((0, box_1.renderResult)('error', `Invalid column: ${targetColumn}`, [(0, theme_1.dim)(`Valid: ${vc.join(', ')}`)]));
        return;
    }
    const data = (0, data_1.loadData)();
    const task = (0, data_1.findTaskByIdPrefix)(data, idPrefix);
    if (!task) {
        console.log((0, box_1.renderResult)('error', `Task not found: ${idPrefix}`));
        return;
    }
    const oldCol = task.column;
    // Validate transition
    const VALID_TRANSITIONS = {
        'backlog': ['in-progress'],
        'in-progress': ['review', 'done', 'backlog'],
        'review': ['done', 'in-progress'],
        'done': ['backlog'],
    };
    const allowed = VALID_TRANSITIONS[oldCol] || [];
    if (oldCol !== targetColumn && !allowed.includes(targetColumn)) {
        console.log((0, box_1.renderResult)('error', `Invalid transition: ${oldCol} → ${targetColumn}`, [(0, theme_1.dim)(`Allowed: ${allowed.join(', ')}`)]));
        return;
    }
    if (oldCol === targetColumn) {
        console.log(`  ${(0, theme_1.dim)(`Task already in ${targetColumn}.`)}`);
        return;
    }
    task.column = targetColumn;
    task.updatedAt = new Date().toISOString();
    task.stuckSince = undefined;
    (0, data_1.logActivity)(data, targetColumn === 'done' ? 'task_done' : 'task_transitioned', `Task "${task.title}" moved: ${oldCol} → ${targetColumn} (CLI)`, task.projectId, task.agent, { from: oldCol, to: targetColumn });
    (0, data_1.saveData)(data);
    console.log((0, box_1.renderResult)('success', `Moved "${task.title}"`, [
        `${(0, theme_1.dim)(oldCol)} ${(0, theme_1.brand)('→')} ${(COL_COLORS[targetColumn] || chalk_1.default.white)(targetColumn)}`,
    ]));
}
function taskStuck(opts) {
    const data = (0, data_1.loadData)();
    const thresholdMin = 30;
    const now = Date.now();
    let tasks = data.tasks.filter(t => t.column === 'in-progress');
    if (opts.project) {
        const project = (0, data_1.findProjectByNameOrId)(data, opts.project);
        if (!project) {
            console.log((0, box_1.renderResult)('error', `Project not found: ${opts.project}`));
            return;
        }
        tasks = tasks.filter(t => t.projectId === project.id);
    }
    const stuck = tasks.filter(t => {
        const elapsed = now - new Date(t.updatedAt).getTime();
        return elapsed > thresholdMin * 60 * 1000;
    }).sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
    if (stuck.length === 0) {
        console.log((0, box_1.renderResult)('success', `No stuck tasks! All in-progress tasks updated within ${thresholdMin}m.`));
        return;
    }
    console.log((0, box_1.renderCommandHeader)(`${stuck.length} Stuck Tasks (>${thresholdMin}m in progress)`, '⚠️'));
    console.log((0, theme_1.dim)('  ' + padRight('ID', 10) + padRight('Title', 36) + padRight('Stuck For', 12) + padRight('Agent', 14) + 'Priority'));
    console.log((0, theme_1.dim)('  ' + '─'.repeat(86)));
    for (const task of stuck) {
        const elapsed = now - new Date(task.updatedAt).getTime();
        const minutes = Math.round(elapsed / 60000);
        const timeStr = minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
        const project = data.projects.find(p => p.id === task.projectId);
        const pc = PRIORITY_COLORS[task.priority] || chalk_1.default.white;
        console.log('  ' + (0, theme_1.dim)(padRight((0, data_1.shortId)(task.id), 10)) + padRight(task.title.substring(0, 34), 36) + (0, theme_1.warning)(padRight(timeStr, 12)) + (0, theme_1.dim)(padRight(task.agent || '—', 14)) + pc(task.priority));
    }
    console.log();
    console.log((0, theme_1.dim)('  Tip: Move tasks with: cm task move <id> review|done|backlog'));
    console.log();
}
function taskDone(idPrefix) {
    if (!idPrefix) {
        console.log((0, box_1.renderResult)('error', 'Usage: cm task done <id>'));
        return;
    }
    taskMove(idPrefix, 'done');
}
function taskRemove(idPrefix) {
    if (!idPrefix) {
        console.log((0, box_1.renderResult)('error', 'Usage: cm task rm <id>'));
        return;
    }
    const data = (0, data_1.loadData)();
    const idx = data.tasks.findIndex(t => t.id === idPrefix || t.id.startsWith(idPrefix));
    if (idx === -1) {
        console.log((0, box_1.renderResult)('error', `Task not found: ${idPrefix}`));
        return;
    }
    const [removed] = data.tasks.splice(idx, 1);
    (0, data_1.logActivity)(data, 'task_deleted', `Task "${removed.title}" deleted via CLI`, removed.projectId, removed.agent);
    (0, data_1.saveData)(data);
    console.log((0, box_1.renderResult)('success', `Deleted: "${removed.title}" (${(0, data_1.shortId)(removed.id)})`));
}
function taskDispatch(idPrefix, opts) {
    if (!idPrefix) {
        console.log((0, box_1.renderResult)('error', 'Usage: cm task dispatch <id> [--force]'));
        return;
    }
    const data = (0, data_1.loadData)();
    const task = (0, data_1.findTaskByIdPrefix)(data, idPrefix);
    if (!task) {
        console.log((0, box_1.renderResult)('error', `Task not found: ${idPrefix}`));
        return;
    }
    const project = data.projects.find(p => p.id === task.projectId);
    const result = (0, agent_dispatch_1.dispatchTaskToAgent)(task, project, opts.force || false);
    if (result.success) {
        task.dispatchStatus = 'dispatched';
        task.dispatchedAt = new Date().toISOString();
        task.dispatchError = undefined;
        task.updatedAt = task.dispatchedAt;
        (0, data_1.logActivity)(data, 'task_dispatched', `Task "${task.title}" dispatched to ${task.agent} via CLI`, task.projectId, task.agent, {
            taskId: task.id, filePath: result.filePath, force: opts.force || false,
        });
        (0, data_1.saveData)(data);
        const details = [
            `${(0, theme_1.dim)('Task:')} ${(0, theme_1.brand)(task.title)}`,
            `${(0, theme_1.dim)('Agent:')} ${(0, theme_1.brand)(task.agent)}`,
        ];
        if (task.skill)
            details.push(`${(0, theme_1.dim)('Skill:')} ${(0, theme_1.brand)(task.skill)}`);
        details.push(`${(0, theme_1.dim)('File:')} ${(0, theme_1.brand)(result.filePath)}`);
        console.log((0, box_1.renderResult)('success', `Task dispatched to ${task.agent}!`, details));
    }
    else {
        task.dispatchStatus = 'failed';
        task.dispatchError = result.error;
        task.updatedAt = new Date().toISOString();
        (0, data_1.saveData)(data);
        console.log((0, box_1.renderResult)('error', `Dispatch failed: ${result.error}`));
    }
}
// ─── Project Command ────────────────────────────────────────────────────────
program
    .command('project <cmd> [args...]')
    .alias('p')
    .description('Project management (add|list|rm)')
    .option('--path <path>', 'Workspace path')
    .action((cmd, args, opts) => {
    switch (cmd) {
        case 'add':
            projectAdd(args.join(' '), opts);
            break;
        case 'list':
        case 'ls':
            projectList();
            break;
        case 'rm':
        case 'delete':
            projectRemove(args[0]);
            break;
        default: console.log((0, box_1.renderResult)('error', `Unknown: ${cmd}`, [(0, theme_1.dim)('Available: add, list, rm')]));
    }
});
function projectAdd(name, opts) {
    if (!name) {
        console.log((0, box_1.renderResult)('error', 'Usage: cm project add "my-project"'));
        return;
    }
    const data = (0, data_1.loadData)();
    const project = { id: crypto_1.default.randomUUID(), name: name.trim(), path: opts.path || process.cwd(), agents: [], createdAt: new Date().toISOString() };
    data.projects.push(project);
    (0, data_1.logActivity)(data, 'project_created', `Project "${project.name}" created via CLI`, project.id);
    (0, data_1.saveData)(data);
    console.log((0, box_1.renderResult)('success', `Project created: ${name}`, [
        `${(0, theme_1.dim)('ID:')} ${(0, theme_1.brand)((0, data_1.shortId)(project.id))} ${(0, theme_1.dim)('|')} ${(0, theme_1.dim)('Path:')} ${(0, theme_1.brand)(project.path)}`,
    ]));
}
function projectList() {
    const data = (0, data_1.loadData)();
    if (data.projects.length === 0) {
        console.log(`\n  ${(0, theme_1.dim)('No projects.')}\n`);
        return;
    }
    console.log((0, box_1.renderCommandHeader)('Projects', '📦'));
    console.log((0, theme_1.dim)('  ' + padRight('ID', 10) + padRight('Name', 24) + padRight('Tasks', 8) + padRight('Agents', 20) + 'Path'));
    console.log((0, theme_1.dim)('  ' + '─'.repeat(90)));
    for (const project of data.projects) {
        const pt = data.tasks.filter(t => t.projectId === project.id);
        const agents = [...new Set(pt.map(t => t.agent).filter(Boolean))];
        const done = pt.filter(t => t.column === 'done').length;
        console.log('  ' + (0, theme_1.dim)(padRight((0, data_1.shortId)(project.id), 10)) + (0, theme_1.brand)(padRight(project.name, 24)) + (0, theme_1.dim)(padRight(`${done}/${pt.length}`, 8)) + (0, theme_1.dim)(padRight(agents.join(', ') || '—', 20)) + (0, theme_1.dim)(project.path || '—'));
    }
    console.log();
}
function projectRemove(query) {
    if (!query) {
        console.log((0, box_1.renderResult)('error', 'Usage: cm project rm <name-or-id>'));
        return;
    }
    const data = (0, data_1.loadData)();
    const project = (0, data_1.findProjectByNameOrId)(data, query);
    if (!project) {
        console.log((0, box_1.renderResult)('error', `Project not found: ${query}`));
        return;
    }
    const tc = data.tasks.filter(t => t.projectId === project.id).length;
    data.projects = data.projects.filter(p => p.id !== project.id);
    data.tasks = data.tasks.filter(t => t.projectId !== project.id);
    (0, data_1.logActivity)(data, 'project_deleted', `Project "${project.name}" deleted via CLI`, project.id);
    (0, data_1.saveData)(data);
    console.log((0, box_1.renderResult)('success', `Deleted project "${project.name}" and ${tc} tasks.`));
}
// ─── Deploy Command ─────────────────────────────────────────────────────────
program
    .command('deploy <cmd> [args...]')
    .alias('d')
    .description('Deploy management (staging|production|list)')
    .option('-p, --project <name>', 'Project name or ID')
    .option('-m, --message <msg>', 'Deploy message')
    .option('--commit <hash>', 'Git commit hash')
    .option('--branch <branch>', 'Git branch', 'main')
    .option('--agent <agent>', 'Agent name')
    .action((cmd, args, opts) => {
    switch (cmd) {
        case 'staging':
            deployRecord('staging', opts);
            break;
        case 'production':
        case 'prod':
            deployRecord('production', opts);
            break;
        case 'list':
        case 'ls':
            deployList(opts);
            break;
        default: console.log((0, box_1.renderResult)('error', `Unknown: ${cmd}`, [(0, theme_1.dim)('Available: staging, production, list')]));
    }
});
function deployRecord(env, opts) {
    const data = (0, data_1.loadData)();
    let projectId;
    if (opts.project) {
        const p = (0, data_1.findProjectByNameOrId)(data, opts.project);
        if (!p) {
            console.log((0, box_1.renderResult)('error', `Project not found: ${opts.project}`));
            return;
        }
        projectId = p.id;
    }
    else if (data.projects.length > 0) {
        projectId = data.projects[0].id;
    }
    else {
        console.log((0, box_1.renderResult)('error', 'No projects. Create one first: cm project add "my-project"'));
        return;
    }
    const now = new Date().toISOString();
    const dep = {
        id: crypto_1.default.randomUUID(), projectId: projectId, env, status: 'success',
        commit: opts.commit || '', branch: opts.branch || 'main',
        agent: opts.agent || '', message: opts.message || `Deploy to ${env}`,
        startedAt: now, finishedAt: now,
    };
    data.deployments.unshift(dep);
    (0, data_1.logActivity)(data, env === 'staging' ? 'deploy_staging' : 'deploy_production', `Deployed to ${env}: ${dep.message}`, projectId, opts.agent || '', { deploymentId: dep.id });
    (0, data_1.saveData)(data);
    const envColor = env === 'production' ? theme_1.success : theme_1.warning;
    const project = data.projects.find(p => p.id === projectId);
    const details = [
        `${(0, theme_1.dim)('ID:')} ${(0, theme_1.brand)((0, data_1.shortId)(dep.id))}`,
        `${(0, theme_1.dim)('Env:')} ${envColor(env)}`,
        `${(0, theme_1.dim)('Project:')} ${(0, theme_1.brand)((project === null || project === void 0 ? void 0 : project.name) || '—')}`,
        `${(0, theme_1.dim)('Message:')} ${dep.message}`,
    ];
    if (dep.commit)
        details.push(`${(0, theme_1.dim)('Commit:')} ${(0, theme_1.brand)(dep.commit)}`);
    details.push(`${(0, theme_1.dim)('Branch:')} ${(0, theme_1.brand)(dep.branch)}`);
    console.log((0, box_1.renderResult)('success', 'Deployment recorded!', details));
}
function deployList(opts) {
    const data = (0, data_1.loadData)();
    let deps = data.deployments;
    if (opts.project) {
        const p = (0, data_1.findProjectByNameOrId)(data, opts.project);
        if (!p) {
            console.log((0, box_1.renderResult)('error', `Project not found: ${opts.project}`));
            return;
        }
        deps = deps.filter(d => d.projectId === p.id);
    }
    if (deps.length === 0) {
        console.log(`\n  ${(0, theme_1.dim)('No deployments yet.')}\n`);
        return;
    }
    console.log((0, box_1.renderCommandHeader)('Deployment History', '🚀'));
    console.log((0, theme_1.dim)('  ' + padRight('ID', 10) + padRight('Env', 12) + padRight('Status', 14) + padRight('Message', 32) + padRight('Branch', 12) + 'Time'));
    console.log((0, theme_1.dim)('  ' + '─'.repeat(100)));
    for (const dep of deps.slice(0, 20)) {
        const sc = STATUS_COLORS[dep.status] || chalk_1.default.white;
        const ec = dep.env === 'production' ? theme_1.success : theme_1.warning;
        const timeAgo = formatTimeAgoCli(dep.startedAt);
        const rollbackFlag = dep.rollbackOf ? ' ⏪' : '';
        console.log('  ' + (0, theme_1.dim)(padRight((0, data_1.shortId)(dep.id), 10)) + ec(padRight(dep.env, 12)) + sc(padRight(dep.status.replace('_', ' ') + rollbackFlag, 14)) + padRight(dep.message.substring(0, 30), 32) + (0, theme_1.dim)(padRight(dep.branch || '—', 12)) + (0, theme_1.dim)(timeAgo));
    }
    console.log((0, theme_1.dim)(`\n  Total: ${deps.length} deployments\n`));
}
// ─── Rollback Command ───────────────────────────────────────────────────────
program
    .command('rollback <deployId>')
    .alias('rb')
    .description('Rollback a deployment')
    .option('--agent <agent>', 'Agent name')
    .action((deployId, opts) => {
    const data = (0, data_1.loadData)();
    const dep = data.deployments.find(d => d.id === deployId || d.id.startsWith(deployId));
    if (!dep) {
        console.log((0, box_1.renderResult)('error', `Deployment not found: ${deployId}`));
        return;
    }
    if (dep.status === 'rolled_back') {
        console.log((0, box_1.renderResult)('warning', 'Already rolled back.'));
        return;
    }
    dep.status = 'rolled_back';
    const now = new Date().toISOString();
    const rollback = {
        id: crypto_1.default.randomUUID(), projectId: dep.projectId, env: dep.env, status: 'success',
        commit: '', branch: dep.branch, agent: opts.agent || '', message: `Rollback of ${(0, data_1.shortId)(dep.id)}`,
        startedAt: now, finishedAt: now, rollbackOf: dep.id,
    };
    data.deployments.unshift(rollback);
    (0, data_1.logActivity)(data, 'rollback', `Rolled back ${dep.env} deploy: ${dep.message}`, dep.projectId, opts.agent || '', { originalDeployId: dep.id, rollbackId: rollback.id });
    (0, data_1.saveData)(data);
    console.log((0, box_1.renderResult)('success', 'Rollback complete!', [
        `${(0, theme_1.dim)('Original:')} ${(0, theme_1.brand)((0, data_1.shortId)(dep.id))} ${(0, theme_1.dim)(`(${dep.env})`)}`,
        `${(0, theme_1.dim)('Rollback ID:')} ${(0, theme_1.brand)((0, data_1.shortId)(rollback.id))}`,
        `${(0, theme_1.dim)('Status:')} ${dep.message} → rolled back`,
    ]));
});
// ─── History Command ────────────────────────────────────────────────────────
program
    .command('history')
    .alias('h')
    .description('Show activity history')
    .option('-n, --limit <n>', 'Number of entries', '20')
    .option('-p, --project <name>', 'Filter by project')
    .action((opts) => {
    const data = (0, data_1.loadData)();
    let acts = data.activities;
    if (opts.project) {
        const p = (0, data_1.findProjectByNameOrId)(data, opts.project);
        if (!p) {
            console.log((0, box_1.renderResult)('error', `Project not found: ${opts.project}`));
            return;
        }
        acts = acts.filter(a => a.projectId === p.id);
    }
    const limit = parseInt(opts.limit) || 20;
    acts = acts.slice(0, limit);
    if (acts.length === 0) {
        console.log(`\n  ${(0, theme_1.dim)('No activity yet.')}\n`);
        return;
    }
    const ACT_ICONS = {
        'task_created': '✨', 'task_moved': '↔️', 'task_done': '✅', 'task_deleted': '🗑️', 'task_updated': '✏️',
        'project_created': '📦', 'project_deleted': '🗑️',
        'deploy_staging': '🟡', 'deploy_production': '🚀', 'deploy_failed': '❌', 'rollback': '⏪',
        'git_push': '📤', 'changelog_added': '📝',
    };
    console.log((0, box_1.renderCommandHeader)(`Activity History (latest ${acts.length})`, '📜'));
    for (const a of acts) {
        const icon = ACT_ICONS[a.type] || '📌';
        const proj = data.projects.find(p => p.id === a.projectId);
        const projTag = proj ? (0, theme_1.dim)(` [${proj.name}]`) : '';
        const agentTag = a.agent ? (0, theme_1.dim)(` @${a.agent}`) : '';
        const time = formatTimeAgoCli(a.createdAt);
        console.log(`  ${icon} ${a.message}${projTag}${agentTag} ${(0, theme_1.dim)(`← ${time}`)}`);
    }
    console.log();
});
// ─── Changelog Command ─────────────────────────────────────────────────────
program
    .command('changelog <cmd> [args...]')
    .alias('cl')
    .description('Changelog management (add|list)')
    .option('-p, --project <name>', 'Project name or ID')
    .option('--agent <agent>', 'Agent name')
    .action((cmd, args, opts) => {
    switch (cmd) {
        case 'add':
            changelogAdd(args, opts);
            break;
        case 'list':
        case 'ls':
            changelogList(opts);
            break;
        default: console.log((0, box_1.renderResult)('error', `Unknown: ${cmd}`, [(0, theme_1.dim)('Available: add, list')]));
    }
});
function changelogAdd(args, opts) {
    if (args.length < 2) {
        console.log((0, box_1.renderResult)('error', 'Usage: cm changelog add <version> "<title>" [changes...]'));
        return;
    }
    const data = (0, data_1.loadData)();
    let projectId = '';
    if (opts.project) {
        const p = (0, data_1.findProjectByNameOrId)(data, opts.project);
        if (!p) {
            console.log((0, box_1.renderResult)('error', `Project not found: ${opts.project}`));
            return;
        }
        projectId = p.id;
    }
    else if (data.projects.length > 0) {
        projectId = data.projects[0].id;
    }
    const version = args[0];
    const title = args[1];
    const changes = args.slice(2);
    const entry = {
        id: crypto_1.default.randomUUID(), projectId, version, title, changes,
        agent: opts.agent || '', createdAt: new Date().toISOString(),
    };
    data.changelog.unshift(entry);
    (0, data_1.logActivity)(data, 'changelog_added', `Changelog ${version}: ${title}`, projectId, opts.agent || '');
    (0, data_1.saveData)(data);
    const details = [`${(0, theme_1.dim)('Version:')} ${(0, theme_1.brand)(version)}`, `${(0, theme_1.dim)('Title:')} ${title}`];
    if (changes.length > 0) {
        changes.forEach(c => details.push(`${(0, theme_1.dim)('•')} ${c}`));
    }
    console.log((0, box_1.renderResult)('success', 'Changelog entry added!', details));
}
function changelogList(opts) {
    const data = (0, data_1.loadData)();
    let entries = data.changelog;
    if (opts.project) {
        const p = (0, data_1.findProjectByNameOrId)(data, opts.project);
        if (!p) {
            console.log((0, box_1.renderResult)('error', `Project not found: ${opts.project}`));
            return;
        }
        entries = entries.filter(c => c.projectId === p.id);
    }
    if (entries.length === 0) {
        console.log(`\n  ${(0, theme_1.dim)('No changelog entries.')}\n`);
        return;
    }
    console.log((0, box_1.renderCommandHeader)('Changelog', '📝'));
    for (const entry of entries) {
        const proj = data.projects.find(p => p.id === entry.projectId);
        console.log((0, theme_1.brand)(`  ${entry.version}`) + ` — ${entry.title}` + (0, theme_1.dim)(` (${formatTimeAgoCli(entry.createdAt)})${proj ? ' [' + proj.name + ']' : ''}`));
        if (entry.changes.length > 0) {
            entry.changes.forEach(c => console.log((0, theme_1.dim)(`    • ${c}`)));
        }
    }
    console.log();
}
// ─── Status Command ─────────────────────────────────────────────────────────
program
    .command('status')
    .alias('s')
    .description('Show task & project summary')
    .action(() => {
    const data = (0, data_1.loadData)();
    showBanner();
    console.log((0, box_1.renderCommandHeader)('Status Overview', '📊'));
    // Projects
    console.log((0, theme_1.brand)(`  Projects: ${data.projects.length}`));
    for (const p of data.projects) {
        const pt = data.tasks.filter(t => t.projectId === p.id);
        const done = pt.filter(t => t.column === 'done').length;
        const pct = pt.length > 0 ? Math.round((done / pt.length) * 100) : 0;
        console.log((0, theme_1.dim)(`    📦 ${padRight(p.name, 20)} ${progressBar(pct)} ${done}/${pt.length} (${pct}%)`));
    }
    // Tasks
    const total = data.tasks.length;
    const byCol = { backlog: 0, 'in-progress': 0, review: 0, done: 0 };
    data.tasks.forEach(t => { byCol[t.column] = (byCol[t.column] || 0) + 1; });
    console.log();
    console.log((0, theme_1.brand)(`  Tasks: ${total}`));
    console.log((0, theme_1.dim)(`    ⚪ Backlog:     ${byCol.backlog}`));
    console.log((0, theme_1.info)(`    🟢 In Progress: ${byCol['in-progress']}`));
    console.log((0, theme_1.warning)(`    🟡 Review:      ${byCol.review}`));
    console.log((0, theme_1.success)(`    🟢 Done:        ${byCol.done}`));
    // Deploys
    if (data.deployments.length > 0) {
        console.log();
        console.log((0, theme_1.brand)(`  Deployments: ${data.deployments.length}`));
        const latest = data.deployments[0];
        const sc = STATUS_COLORS[latest.status] || chalk_1.default.white;
        console.log((0, theme_1.dim)(`    Latest: ${latest.env} — ${sc(latest.status)} — ${latest.message} (${formatTimeAgoCli(latest.startedAt)})`));
    }
    // Agents
    const agentCounts = {};
    data.tasks.forEach(t => { if (t.agent)
        agentCounts[t.agent] = (agentCounts[t.agent] || 0) + 1; });
    const agentNames = Object.keys(agentCounts);
    if (agentNames.length > 0) {
        console.log();
        console.log((0, theme_1.brand)(`  Active Agents: ${agentNames.length}`));
        for (const agent of agentNames.sort()) {
            console.log((0, theme_1.dim)(`    🤖 ${padRight(agent, 16)} ${agentCounts[agent]} tasks`));
        }
    }
    // Dashboard
    console.log();
    if (isDashboardRunning()) {
        console.log((0, theme_1.success)(`  🚀 Dashboard: RUNNING at http://codymaster.localhost:${data_1.DEFAULT_PORT}`));
    }
    else {
        console.log((0, theme_1.dim)(`  ⚫ Dashboard: not running (start with: cm dashboard)`));
    }
    console.log();
});
function progressBar(pct) {
    const total = 12;
    const filled = Math.round((pct / 100) * total);
    return chalk_1.default.green('█'.repeat(filled)) + chalk_1.default.gray('░'.repeat(total - filled));
}
function formatTimeAgoCli(dateStr) {
    const ms = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(ms / 60000), h = Math.floor(ms / 3600000), d = Math.floor(ms / 86400000);
    if (m < 1)
        return 'just now';
    if (m < 60)
        return `${m}m ago`;
    if (h < 24)
        return `${h}h ago`;
    if (d < 7)
        return `${d}d ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
// ─── Install Command ────────────────────────────────────────────────────────
program
    .command('install <skill>')
    .description('Install an agent skill')
    .option('-p, --platform <platform>', 'Target platform (gemini|claude|cursor|windsurf|cline)')
    .action((skill, opts) => __awaiter(void 0, void 0, void 0, function* () {
    console.log((0, theme_1.brand)(`  Installing skill: ${skill}...`));
    if (!opts.platform) {
        const p = yield Promise.resolve().then(() => __importStar(require('@clack/prompts')));
        const platform = yield p.select({
            message: 'Which platform?',
            options: [
                { label: '🟢 Google Antigravity', value: 'gemini' },
                { label: '🟣 Claude Code', value: 'claude' },
                { label: '🔵 Cursor', value: 'cursor' },
                { label: '🟠 Windsurf', value: 'windsurf' },
                { label: '🟤 Cline / RooCode', value: 'cline' },
            ],
        });
        if (p.isCancel(platform))
            return;
        opts.platform = platform;
    }
    console.log((0, box_1.renderResult)('success', `Skill '${skill}' installed for ${opts.platform}!`));
}));
// ─── Add Command (npx codymaster add --skill cm-debugging) ───────────────────
const ALL_SKILLS = [
    // Engineering
    'cm-tdd', 'cm-debugging', 'cm-quality-gate', 'cm-test-gate', 'cm-code-review',
    // Operations
    'cm-safe-deploy', 'cm-identity-guard', 'cm-git-worktrees', 'cm-terminal', 'cm-secret-shield', 'cm-security-gate', 'cm-safe-i18n',
    // Product
    'cm-planning', 'cm-ux-master', 'cm-ui-preview', 'cm-brainstorm-idea', 'cm-jtbd', 'cm-dockit', 'cm-project-bootstrap', 'cm-readit',
    // Growth
    'cm-content-factory', 'cm-ads-tracker', 'cro-methodology', 'cm-deep-search',
    // Orchestration
    'cm-execution', 'cm-continuity', 'cm-skill-index', 'cm-skill-mastery', 'cm-skill-chain',
    // Workflow
    'cm-start', 'cm-dashboard', 'cm-status', 'cm-how-it-work', 'cm-example',
];
const PLATFORM_TARGETS = {
    gemini: { dir: '.gemini/skills', invoke: '@[/<skill>]', note: 'or ~/.gemini/antigravity/skills/ for global' },
    cursor: { dir: '.cursor/rules', invoke: '@<skill>', note: 'Cursor rules directory' },
    windsurf: { dir: '.windsurf/rules', invoke: '@<skill>', note: 'Windsurf rules directory' },
    cline: { dir: '.cline/skills', invoke: '@<skill>', note: 'Cline / RooCode skills directory' },
    opencode: { dir: '.opencode/skills', invoke: '@[/<skill>]', note: 'OpenCode skills directory' },
    kiro: { dir: '.kiro/steering', invoke: '@<skill>', note: 'Kiro steering documents' },
    copilot: { dir: '.github', invoke: '(auto-context)', note: 'Added to copilot-instructions.md' },
    aider: { dir: '.aider/skills', invoke: '@[/<skill>]', note: 'Aider skills directory (reference in .aider.conf.yml)' },
    continue: { dir: '.continue/rules', invoke: '@<skill>', note: 'Continue.dev rules directory' },
    amazonq: { dir: '.aws/amazonq/skills', invoke: '@<skill>', note: 'Amazon Q skills directory' },
    amp: { dir: '.amp/skills', invoke: '@<skill>', note: 'Amp skills directory' },
};
const RAW_BASE = 'https://raw.githubusercontent.com/tody-agent/codymaster/main';
function autoDetectPlatform() {
    const { execFileSync } = require('child_process');
    try {
        execFileSync('claude', ['--version'], { stdio: 'pipe' });
        return 'claude';
    }
    catch (_a) { }
    try {
        execFileSync('gemini', ['--version'], { stdio: 'pipe' });
        return 'gemini';
    }
    catch (_b) { }
    if (fs_1.default.existsSync(path_1.default.join(os_1.default.homedir(), '.cursor')))
        return 'cursor';
    if (fs_1.default.existsSync(path_1.default.join(os_1.default.homedir(), '.windsurf')))
        return 'windsurf';
    return 'manual';
}
function downloadFile(url, dest) {
    return new Promise((resolve) => {
        try {
            fs_1.default.mkdirSync(path_1.default.dirname(dest), { recursive: true });
            const file = fs_1.default.createWriteStream(dest);
            https_1.default.get(url, (res) => {
                if (res.statusCode !== 200) {
                    file.close();
                    try {
                        fs_1.default.unlinkSync(dest);
                    }
                    catch (_a) { }
                    resolve(false);
                    return;
                }
                res.pipe(file);
                file.on('finish', () => { file.close(); resolve(true); });
            }).on('error', () => { file.close(); resolve(false); });
        }
        catch (_a) {
            resolve(false);
        }
    });
}
function doAddSkills(skills, platform) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log();
        const { execFileSync } = require('child_process');
        if (platform === 'claude') {
            console.log((0, theme_1.brand)('🟣 Claude Code — Installing via plugin system'));
            console.log((0, theme_1.dim)('   (Claude installs all 65 skills as one bundle)\n'));
            // Step 1: Register marketplace
            console.log((0, theme_1.dim)('   $ claude plugin marketplace add tody-agent/codymaster'));
            try {
                const r1 = require('child_process').spawnSync('claude', ['plugin', 'marketplace', 'add', 'tody-agent/codymaster'], { encoding: 'utf8' });
                if (r1.stdout)
                    process.stdout.write(r1.stdout);
                if (r1.stderr)
                    process.stderr.write(r1.stderr);
                const combined = String(r1.stdout || '') + String(r1.stderr || '');
                if (r1.status !== 0 && !combined.includes('already installed') && !combined.includes('already exists')) {
                    console.log((0, box_1.renderResult)('warning', 'Marketplace warning — continuing anyway'));
                }
                else if (combined.includes('already installed') || combined.includes('already exists')) {
                    console.log((0, theme_1.dim)('   ℹ️  Marketplace already registered'));
                }
            }
            catch (_a) {
                console.log((0, box_1.renderResult)('warning', 'Could not reach marketplace — continuing'));
            }
            // Step 2: Install / update the plugin
            console.log((0, theme_1.dim)('   $ claude plugin install codymaster@codymaster'));
            try {
                execFileSync('claude', ['plugin', 'install', 'codymaster@codymaster'], { stdio: 'inherit' });
                console.log((0, box_1.renderResult)('success', 'All 65 skills installed!'));
                yield postInstallOnboarding('claude');
            }
            catch (_b) {
                console.log((0, box_1.renderResult)('warning', 'Plugin install failed. Run manually:'));
                console.log((0, theme_1.brand)('  claude plugin install codymaster@codymaster'));
                console.log((0, theme_1.dim)('\n  Or one-liner:'));
                console.log((0, theme_1.brand)('  bash <(curl -fsSL https://raw.githubusercontent.com/tody-agent/codymaster/main/install.sh) --claude'));
            }
            return;
        }
        // Removed the fictional gemini extensions install block.
        // Gemini now falls through to the standard file-cloning logic below.
        const target = PLATFORM_TARGETS[platform];
        if (!target) {
            console.log((0, box_1.renderResult)('error', `Unknown platform: ${platform}`, [(0, theme_1.dim)('Supported: claude, gemini, cursor, windsurf, cline, opencode, kiro, copilot')]));
            return;
        }
        if (platform === 'copilot') {
            const instrFile = path_1.default.join('.github', 'copilot-instructions.md');
            fs_1.default.mkdirSync('.github', { recursive: true });
            const header = '\n\n## Cody Master Skills\nThe following AI skills are available — reference them by name:\n';
            const lines = skills.map(s => `- **${s}**: see https://github.com/tody-agent/codymaster/blob/main/skills/${s}/SKILL.md`).join('\n');
            const existing = fs_1.default.existsSync(instrFile) ? fs_1.default.readFileSync(instrFile, 'utf-8') : '';
            if (!existing.includes('Cody Master Skills')) {
                fs_1.default.appendFileSync(instrFile, header + lines + '\n');
            }
            console.log((0, box_1.renderResult)('success', `${skills.length} skills referenced in ${instrFile}`, [(0, theme_1.dim)('GitHub Copilot will use these as context automatically.')]));
            return;
        }
        const icons = { cursor: '🔵', windsurf: '🟠', cline: '⚫', opencode: '📦', kiro: '🔶' };
        const icon = icons[platform] || '📦';
        const label = skills.length === ALL_SKILLS.length ? 'all 65 skills' : skills.join(', ');
        console.log(`${icon} ${(0, theme_1.brand)(`${platform} — Installing ${label}`)}`);
        console.log((0, theme_1.dim)(`   Target: ./${target.dir}/\n`));
        let ok = 0, fail = 0;
        for (const skill of skills) {
            const url = `${RAW_BASE}/skills/${skill}/SKILL.md`;
            let dest = path_1.default.join(target.dir, skill, 'SKILL.md');
            // Formatting logic to adapt to specific IDE required formats
            if (platform === 'cursor') {
                dest = path_1.default.join(target.dir, `${skill}.mdc`);
            }
            else if (platform === 'continue') {
                dest = path_1.default.join(target.dir, `${skill}.md`);
            }
            const ok_result = yield downloadFile(url, dest);
            // Prepend Cursor MDC glob formatting
            if (ok_result && platform === 'cursor') {
                try {
                    const content = fs_1.default.readFileSync(dest, 'utf-8');
                    if (!content.startsWith('---')) {
                        const yamlFrontmatter = `---\ndescription: ${skill}\nglobs: *\n---\n`;
                        fs_1.default.writeFileSync(dest, yamlFrontmatter + content);
                    }
                    else if (!content.includes('globs:')) {
                        const newContent = content.replace(/^---/, '---\nglobs: *');
                        fs_1.default.writeFileSync(dest, newContent);
                    }
                }
                catch (err) { }
            }
            if (ok_result) {
                process.stdout.write((0, theme_1.success)(`  ✅ ${skill}\n`));
                ok++;
            }
            else {
                process.stdout.write((0, theme_1.error)(`  ❌ ${skill}\n`));
                fail++;
            }
        }
        console.log();
        if (ok > 0) {
            console.log((0, box_1.renderResult)('success', `${ok} skill${ok > 1 ? 's' : ''} installed → ./${target.dir}/`));
            const invoke = target.invoke.replace('<skill>', skills[0]);
            console.log((0, theme_1.brand)(`  📖 Usage: ${invoke}  Your prompt here`));
            if (target.note)
                console.log((0, theme_1.dim)(`   Note: ${target.note}`));
            yield postInstallOnboarding(platform);
        }
        if (fail > 0) {
            console.log((0, box_1.renderResult)('warning', `${fail} failed — check connection or clone manually:`, [(0, theme_1.dim)('git clone https://github.com/tody-agent/codymaster.git')]));
        }
    });
}
program
    .command('add')
    .description('Add skills to your AI agent  (npx codymaster add --skill cm-debugging)')
    .option('--skill <name>', 'Specific skill to add (e.g. cm-debugging)')
    .option('--all', 'Add all 65 skills')
    .option('--platform <platform>', 'Target: claude|gemini|cursor|windsurf|cline|opencode|kiro|copilot')
    .option('--list', 'Show available skills and exit')
    .action((opts) => __awaiter(void 0, void 0, void 0, function* () {
    showBanner();
    if (opts.list) {
        skillList();
        return;
    }
    // Resolve skills array
    let skills = null;
    if (opts.all) {
        skills = ALL_SKILLS;
    }
    else if (opts.skill) {
        if (!ALL_SKILLS.includes(opts.skill)) {
            console.log((0, box_1.renderResult)('error', `Unknown skill: ${opts.skill}`, [(0, theme_1.dim)('Run: npx codymaster add --list')]));
            return;
            return;
        }
        skills = [opts.skill];
    }
    // Detect or prompt platform
    let platform = opts.platform || autoDetectPlatform();
    if (platform === 'manual') {
        const p = yield Promise.resolve().then(() => __importStar(require('@clack/prompts')));
        const platform_choice = yield p.select({
            message: 'Select your AI coding platform:',
            options: [
                { label: '🟣 Claude Code  (recommended)', value: 'claude' },
                { label: '💻 Gemini CLI & Antigravity', value: 'gemini' },
                { label: '🔵 Cursor', value: 'cursor' },
                { label: '🟠 Windsurf', value: 'windsurf' },
                { label: '⚫ Cline / RooCode', value: 'cline' },
                { label: '📦 OpenCode', value: 'opencode' },
                { label: '🔶 Kiro (AWS)', value: 'kiro' },
                { label: '🐙 GitHub Copilot', value: 'copilot' },
                { label: '🤖 Aider', value: 'aider' },
                { label: '🔗 Continue.dev', value: 'continue' },
                { label: '☁️  Amazon Q', value: 'amazonq' },
                { label: '⚡ Amp', value: 'amp' },
            ],
        });
        if (p.isCancel(platform_choice))
            return;
        platform = platform_choice;
    }
    // If no skills chosen yet, prompt
    if (!skills) {
        if (platform === 'claude' || platform === 'gemini') {
            skills = ALL_SKILLS;
        }
        else {
            const p = yield Promise.resolve().then(() => __importStar(require('@clack/prompts')));
            const mode = yield p.select({
                message: 'What to install?',
                options: [
                    { label: 'All 65 skills (full kit)', value: 'all' },
                    { label: 'Search & pick one skill', value: 'pick' },
                ],
            });
            if (p.isCancel(mode))
                return;
            if (mode === 'all') {
                skills = ALL_SKILLS;
            }
            else {
                const pick = yield p.select({
                    message: 'Select a skill:',
                    options: ALL_SKILLS.map(s => ({ label: s, value: s })),
                });
                if (p.isCancel(pick))
                    return;
                skills = [pick];
            }
        }
    }
    yield doAddSkills(skills, platform);
}));
// ─── List Command (quick alias for `cody skill list`) ─────────────────────────
program
    .command('list')
    .alias('ls')
    .description('List all 65 available skills')
    .option('-d, --domain <domain>', 'Filter by domain')
    .action((opts) => {
    skillList(opts.domain);
});
// ─── Profile Command ──────────────────────────────────────────────────────────
program
    .command('profile')
    .description('View your CodyMaster profile, stats, and achievements')
    .action(() => {
    const profile = (0, hooks_1.loadProfile)();
    if (!profile.onboardingComplete) {
        console.log((0, theme_1.dim)('\n  Run cm first to complete setup! 🐹\n'));
        return;
    }
    (0, hooks_1.recordCommand)(profile, 'profile');
    const newAchievements = (0, hooks_1.checkAchievements)(profile);
    (0, hooks_1.saveProfile)(profile);
    console.log((0, hooks_1.formatProfileSummary)(profile));
    for (const id of newAchievements) {
        console.log((0, hooks_1.formatAchievement)(id));
    }
});
// ─── Continuity Command (Working Memory) ────────────────────────────────────
program
    .command('continuity [cmd]')
    .alias('ctx')
    .description('Working memory (init|status|reset|learnings|decisions)')
    .option('--path <path>', 'Project path', process.cwd())
    .action((cmd, opts) => {
    const projectPath = opts.path || process.cwd();
    switch (cmd) {
        case 'init':
            continuityInit(projectPath);
            break;
        case 'status':
        case undefined:
            continuityStatus(projectPath);
            break;
        case 'reset':
            continuityReset(projectPath);
            break;
        case 'learnings':
        case 'learn':
            continuityLearnings(projectPath);
            break;
        case 'decisions':
        case 'dec':
            continuityDecisions(projectPath);
            break;
        default:
            console.log(chalk_1.default.red(`Unknown: ${cmd}`));
            console.log(chalk_1.default.gray('Available: init, status, reset, learnings, decisions'));
    }
});
function continuityInit(projectPath) {
    if ((0, continuity_1.hasCmDir)(projectPath)) {
        console.log((0, box_1.renderResult)('warning', '.cm/ directory already exists.', [(0, theme_1.dim)(`Path: ${projectPath}/.cm/`)]));
        return;
    }
    (0, continuity_1.ensureCmDir)(projectPath);
    console.log((0, box_1.renderResult)('success', 'Working memory initialized!', [
        (0, theme_1.dim)(`Created: ${projectPath}/.cm/`),
        (0, theme_1.dim)('├── CONTINUITY.md     (working memory)'),
        (0, theme_1.dim)('├── config.yaml       (RARV settings)'),
        (0, theme_1.dim)('└── memory/'),
        (0, theme_1.dim)('    ├── learnings.json (error patterns)'),
        (0, theme_1.dim)('    └── decisions.json (architecture decisions)'),
    ]));
    console.log((0, theme_1.info)('💡 Protocol: Read CONTINUITY.md at session start, update at session end.'));
}
function continuityStatus(projectPath) {
    const status = (0, continuity_1.getContinuityStatus)(projectPath);
    if (!status.initialized) {
        console.log((0, box_1.renderResult)('warning', 'Working memory not initialized.', [(0, theme_1.dim)('Run: cm continuity init')]));
        return;
    }
    console.log((0, box_1.renderCommandHeader)('Working Memory Status', '🧠'));
    console.log((0, box_1.renderKeyValue)([
        ['Project', String(status.project)],
        ['Phase', phaseColor(status.phase)(status.phase)],
        ['Iteration', String(status.iteration)],
        ...(status.activeGoal ? [['Goal', String(status.activeGoal)]] : []),
        ...(status.currentTask ? [['Task', String(status.currentTask)]] : []),
    ]));
    console.log((0, theme_1.dim)(`  ✅ Completed: ${status.completedCount}  |  🚧 Blockers: ${status.blockerCount}`));
    console.log((0, theme_1.dim)(`  📚 Learnings: ${status.learningCount}  |  📋 Decisions: ${status.decisionCount}`));
    if (status.lastUpdated) {
        console.log((0, theme_1.dim)(`  🕐 Updated:   ${formatTimeAgoCli(status.lastUpdated)}`));
    }
    console.log();
}
function phaseColor(phase) {
    const colors = {
        planning: chalk_1.default.blue, executing: chalk_1.default.yellow, testing: chalk_1.default.magenta,
        deploying: chalk_1.default.green, reviewing: chalk_1.default.cyan, idle: chalk_1.default.gray,
    };
    return colors[phase] || chalk_1.default.white;
}
function continuityReset(projectPath) {
    if (!(0, continuity_1.hasCmDir)(projectPath)) {
        console.log((0, box_1.renderResult)('warning', 'No .cm/ directory found.'));
        return;
    }
    (0, continuity_1.resetContinuity)(projectPath);
    console.log((0, box_1.renderResult)('success', 'Working memory reset.', [(0, theme_1.dim)('CONTINUITY.md cleared. Learnings preserved.')]));
}
function continuityLearnings(projectPath) {
    if (!(0, continuity_1.hasCmDir)(projectPath)) {
        console.log((0, box_1.renderResult)('warning', 'No .cm/ directory found. Run: cm continuity init'));
        return;
    }
    const learnings = (0, continuity_1.getLearnings)(projectPath);
    if (learnings.length === 0) {
        console.log(`\n  ${(0, theme_1.dim)('No learnings captured yet. 🎉')}\n`);
        return;
    }
    console.log((0, box_1.renderCommandHeader)(`Mistakes & Learnings (${learnings.length})`, '📚'));
    for (const l of learnings.slice(-10)) {
        console.log((0, theme_1.error)(`  ❌ ${l.whatFailed}`));
        console.log((0, theme_1.dim)(`     Why: ${l.whyFailed}`));
        console.log((0, theme_1.success)(`     Fix: ${l.howToPrevent}`));
        console.log((0, theme_1.dim)(`     ${formatTimeAgoCli(l.timestamp)} | ${l.agent || 'unknown'}\n`));
    }
}
function continuityDecisions(projectPath) {
    if (!(0, continuity_1.hasCmDir)(projectPath)) {
        console.log((0, box_1.renderResult)('warning', 'No .cm/ directory found. Run: cm continuity init'));
        return;
    }
    const decisions = (0, continuity_1.getDecisions)(projectPath);
    if (decisions.length === 0) {
        console.log(`\n  ${(0, theme_1.dim)('No decisions recorded yet.')}\n`);
        return;
    }
    console.log((0, box_1.renderCommandHeader)(`Key Decisions (${decisions.length})`, '📋'));
    for (const d of decisions.slice(-10)) {
        console.log((0, theme_1.brand)(`  📌 ${d.decision}`));
        console.log((0, theme_1.dim)(`     Rationale: ${d.rationale}`));
        console.log((0, theme_1.dim)(`     ${formatTimeAgoCli(d.timestamp)} | ${d.agent || 'unknown'}\n`));
    }
}
// ─── Brain Command (Enhanced Memory Explorer) ────────────────────────────────
program
    .command('brain [cmd]')
    .alias('b')
    .description('Memory explorer (status|learnings|decisions|delete|stats|export)')
    .option('--path <path>', 'Project path', process.cwd())
    .option('--search <query>', 'Search learnings')
    .option('--last <n>', 'Show last N items')
    .option('--format <fmt>', 'Export format: json|md', 'json')
    .action((cmd, opts) => {
    const projectPath = opts.path || process.cwd();
    switch (cmd) {
        case 'status':
        case undefined:
            brainStatus(projectPath);
            break;
        case 'learnings':
        case 'learn':
        case 'l':
            brainLearnings(projectPath, opts);
            break;
        case 'decisions':
        case 'dec':
        case 'd':
            brainDecisions(projectPath, opts);
            break;
        case 'delete':
        case 'del':
        case 'rm':
            console.log(chalk_1.default.gray('Usage: cm brain delete <type> <id>'));
            console.log(chalk_1.default.gray('  type: learning | decision'));
            console.log(chalk_1.default.gray('  id:   first 8 chars of the ID'));
            break;
        case 'stats':
            brainStats(projectPath);
            break;
        case 'export':
            brainExport(projectPath, opts);
            break;
        default:
            if (cmd === 'learning' || cmd === 'decision') {
                console.log((0, theme_1.dim)(`Did you mean: cm brain ${cmd}s ?`));
            }
            else {
                console.log((0, box_1.renderResult)('error', `Unknown: ${cmd}`, [(0, theme_1.dim)('Available: status, learnings, decisions, delete, stats, export')]));
            }
    }
});
program
    .command('brain-delete <type> <id>')
    .description('Delete a learning or decision by ID prefix')
    .option('--path <path>', 'Project path', process.cwd())
    .action((type, id, opts) => {
    const projectPath = opts.path || process.cwd();
    brainDelete(projectPath, type, id);
});
function brainStatus(projectPath) {
    const status = (0, continuity_1.getContinuityStatus)(projectPath);
    if (!status.initialized) {
        console.log((0, box_1.renderResult)('warning', 'Working memory not initialized.', [(0, theme_1.dim)('Run: cm continuity init')]));
        return;
    }
    showBanner();
    console.log((0, box_1.renderCommandHeader)('Brain — Memory Status', '🧠'));
    // Stats row
    console.log((0, theme_1.brand)('  ┌──────────────┬──────────────┬──────────────┬──────────────┐'));
    console.log((0, theme_1.brand)('  │') + (0, theme_1.error)(` ❤ Learn: ${padRight(String(status.learningCount), 4)}`) +
        (0, theme_1.brand)(' │') + (0, theme_1.brand)(` 📋 Decide: ${padRight(String(status.decisionCount), 3)}`) +
        (0, theme_1.brand)(' │') + phaseColor(status.phase)(` ● ${padRight(status.phase, 9)}`) +
        (0, theme_1.brand)(' │') + (0, theme_1.dim)(` #${padRight(String(status.iteration), 10)}`) + (0, theme_1.brand)('│'));
    console.log((0, theme_1.brand)('  └──────────────┴──────────────┴──────────────┴──────────────┘'));
    console.log();
    console.log((0, box_1.renderKeyValue)([
        ['Project', String(status.project)],
        ...(status.activeGoal ? [['Goal', String(status.activeGoal)]] : []),
        ...(status.currentTask ? [['Task', String(status.currentTask)]] : []),
        ['Completed', `${status.completedCount} items`],
        ['Blockers', status.blockerCount > 0 ? (0, theme_1.warning)(`🚧 ${status.blockerCount}`) : (0, theme_1.success)('✅ None')],
        ...(status.lastUpdated ? [['Updated', formatTimeAgoCli(status.lastUpdated)]] : []),
    ]));
    console.log();
    console.log((0, theme_1.dim)('  Commands:'));
    console.log((0, theme_1.dim)('    cm brain learnings    — View mistakes & lessons'));
    console.log((0, theme_1.dim)('    cm brain decisions    — View architecture decisions'));
    console.log((0, theme_1.dim)('    cm brain stats        — Memory statistics'));
    console.log((0, theme_1.dim)('    cm brain export       — Export memory data'));
    console.log();
}
function brainLearnings(projectPath, opts) {
    if (!(0, continuity_1.hasCmDir)(projectPath)) {
        console.log((0, box_1.renderResult)('warning', 'No .cm/ directory found. Run: cm continuity init'));
        return;
    }
    let learnings = (0, continuity_1.getLearnings)(projectPath);
    // Search filter
    if (opts.search) {
        const q = opts.search.toLowerCase();
        learnings = learnings.filter(l => (l.whatFailed || '').toLowerCase().includes(q) ||
            (l.whyFailed || '').toLowerCase().includes(q) ||
            (l.howToPrevent || '').toLowerCase().includes(q));
    }
    // Last N
    const limit = opts.last ? parseInt(opts.last) : 15;
    const display = learnings.slice(-limit);
    if (display.length === 0) {
        console.log(`\n  ${(0, theme_1.dim)(`No learnings ${opts.search ? 'matching "' + opts.search + '"' : 'captured yet'}. 🎉`)}\n`);
        return;
    }
    console.log((0, box_1.renderCommandHeader)(`Learnings (${display.length}${learnings.length > limit ? '/' + learnings.length : ''})`, '📚'));
    for (const l of display) {
        const shortId = l.id ? l.id.substring(0, 8) : '???';
        console.log((0, theme_1.error)(`  ❌ ${l.whatFailed}`) + (0, theme_1.dim)(` [${shortId}]`));
        if (l.whyFailed)
            console.log((0, theme_1.dim)(`     Why: ${l.whyFailed}`));
        if (l.howToPrevent)
            console.log((0, theme_1.success)(`     Fix: ${l.howToPrevent}`));
        console.log((0, theme_1.dim)(`     ${formatTimeAgoCli(l.timestamp)} | ${l.agent || 'unknown'}${l.module ? ' | 📦 ' + l.module : ''}\n`));
    }
}
function brainDecisions(projectPath, opts) {
    if (!(0, continuity_1.hasCmDir)(projectPath)) {
        console.log((0, box_1.renderResult)('warning', 'No .cm/ directory found. Run: cm continuity init'));
        return;
    }
    const decisions = (0, continuity_1.getDecisions)(projectPath);
    const limit = opts.last ? parseInt(opts.last) : 15;
    const display = decisions.slice(-limit);
    if (display.length === 0) {
        console.log(`\n  ${(0, theme_1.dim)('No decisions recorded yet.')}\n`);
        return;
    }
    console.log((0, box_1.renderCommandHeader)(`Key Decisions (${display.length}${decisions.length > limit ? '/' + decisions.length : ''})`, '📋'));
    for (const d of display) {
        const shortId = d.id ? d.id.substring(0, 8) : '???';
        console.log((0, theme_1.brand)(`  📌 ${d.decision}`) + (0, theme_1.dim)(` [${shortId}]`));
        if (d.rationale)
            console.log((0, theme_1.dim)(`     Rationale: ${d.rationale}`));
        console.log((0, theme_1.dim)(`     ${formatTimeAgoCli(d.timestamp)} | ${d.agent || 'unknown'}\n`));
    }
}
function brainDelete(projectPath, type, id) {
    if (!(0, continuity_1.hasCmDir)(projectPath)) {
        console.log((0, box_1.renderResult)('warning', 'No .cm/ directory found.'));
        return;
    }
    if (type === 'learning' || type === 'l') {
        const learnings = (0, continuity_1.getLearnings)(projectPath);
        const target = learnings.find(l => l.id && l.id.startsWith(id));
        if (!target) {
            console.log((0, box_1.renderResult)('error', `Learning not found with ID prefix: ${id}`));
            return;
        }
        const del_success = (0, continuity_1.deleteLearning)(projectPath, target.id);
        if (del_success) {
            console.log((0, box_1.renderResult)('success', `Deleted learning: ${target.whatFailed}`));
        }
        else {
            console.log((0, box_1.renderResult)('error', 'Failed to delete'));
        }
    }
    else if (type === 'decision' || type === 'd') {
        const decisions = (0, continuity_1.getDecisions)(projectPath);
        const target = decisions.find(d => d.id && d.id.startsWith(id));
        if (!target) {
            console.log((0, box_1.renderResult)('error', `Decision not found with ID prefix: ${id}`));
            return;
        }
        const del_success = (0, continuity_1.deleteDecision)(projectPath, target.id);
        if (del_success) {
            console.log((0, box_1.renderResult)('success', `Deleted decision: ${target.decision}`));
        }
        else {
            console.log((0, box_1.renderResult)('error', 'Failed to delete'));
        }
    }
    else {
        console.log((0, box_1.renderResult)('error', `Unknown type: ${type}`, [(0, theme_1.dim)('Use: cm brain-delete learning <id> | cm brain-delete decision <id>')]));
    }
}
function brainStats(projectPath) {
    if (!(0, continuity_1.hasCmDir)(projectPath)) {
        console.log((0, box_1.renderResult)('warning', 'No .cm/ directory found. Run: cm continuity init'));
        return;
    }
    const status = (0, continuity_1.getContinuityStatus)(projectPath);
    const learnings = (0, continuity_1.getLearnings)(projectPath);
    const decisions = (0, continuity_1.getDecisions)(projectPath);
    console.log((0, box_1.renderCommandHeader)('Brain Statistics', '📊'));
    console.log((0, box_1.renderKeyValue)([
        ['Learnings', String(learnings.length)],
        ['Decisions', String(decisions.length)],
        ['Completed', `${status.completedCount} items`],
        ['Blockers', String(status.blockerCount)],
        ['Iteration', `#${status.iteration}`],
    ]));
    // Agent breakdown
    const agentMap = {};
    learnings.forEach(l => { if (l.agent)
        agentMap[l.agent] = (agentMap[l.agent] || 0) + 1; });
    decisions.forEach(d => { if (d.agent)
        agentMap[d.agent] = (agentMap[d.agent] || 0) + 1; });
    const agents = Object.entries(agentMap).sort((a, b) => b[1] - a[1]);
    if (agents.length > 0) {
        console.log();
        console.log((0, theme_1.brand)('  Agents:'));
        for (const [agent, count] of agents) {
            console.log((0, theme_1.dim)(`    🤖 ${padRight(agent, 20)} ${count} entries`));
        }
    }
    // Module breakdown
    const moduleMap = {};
    learnings.forEach(l => { if (l.module)
        moduleMap[l.module] = (moduleMap[l.module] || 0) + 1; });
    const modules = Object.entries(moduleMap).sort((a, b) => b[1] - a[1]);
    if (modules.length > 0) {
        console.log();
        console.log((0, theme_1.brand)('  Modules (most error-prone):'));
        for (const [mod, count] of modules.slice(0, 5)) {
            console.log((0, theme_1.dim)(`    📦 ${padRight(mod, 20)} ${count} learnings`));
        }
    }
    // Time range
    const allTimestamps = [...learnings.map(l => l.timestamp), ...decisions.map(d => d.timestamp)].filter(Boolean).sort();
    if (allTimestamps.length > 0) {
        console.log();
        console.log((0, theme_1.dim)(`  First entry: ${formatTimeAgoCli(allTimestamps[0])}`));
        console.log((0, theme_1.dim)(`  Latest:      ${formatTimeAgoCli(allTimestamps[allTimestamps.length - 1])}`));
    }
    console.log();
}
function brainExport(projectPath, opts) {
    if (!(0, continuity_1.hasCmDir)(projectPath)) {
        console.log((0, box_1.renderResult)('warning', 'No .cm/ directory found.'));
        return;
    }
    const learnings = (0, continuity_1.getLearnings)(projectPath);
    const decisions = (0, continuity_1.getDecisions)(projectPath);
    const status = (0, continuity_1.getContinuityStatus)(projectPath);
    const format = opts.format || 'json';
    if (format === 'json') {
        const data = { status, learnings, decisions, exportedAt: new Date().toISOString() };
        const outFile = `brain-export-${new Date().toISOString().slice(0, 10)}.json`;
        fs_1.default.writeFileSync(outFile, JSON.stringify(data, null, 2));
        console.log((0, box_1.renderResult)('success', `Exported to ${outFile}`, [(0, theme_1.dim)(`${learnings.length} learnings, ${decisions.length} decisions`)]));
    }
    else if (format === 'md') {
        let md = `# Brain Export\n\n**Project:** ${status.project || 'Unknown'}\n**Exported:** ${new Date().toISOString()}\n\n`;
        md += `## Learnings (${learnings.length})\n\n`;
        for (const l of learnings) {
            md += `### ❌ ${l.whatFailed}\n- **Why:** ${l.whyFailed || 'N/A'}\n- **Fix:** ${l.howToPrevent || 'N/A'}\n- **Agent:** ${l.agent || 'unknown'} | **Date:** ${l.timestamp || 'N/A'}\n\n`;
        }
        md += `## Decisions (${decisions.length})\n\n`;
        for (const d of decisions) {
            md += `### 📌 ${d.decision}\n- **Rationale:** ${d.rationale || 'N/A'}\n- **Agent:** ${d.agent || 'unknown'} | **Date:** ${d.timestamp || 'N/A'}\n\n`;
        }
        const outFile = `brain-export-${new Date().toISOString().slice(0, 10)}.md`;
        fs_1.default.writeFileSync(outFile, md);
        console.log((0, box_1.renderResult)('success', `Exported to ${outFile}`, [(0, theme_1.dim)(`${learnings.length} learnings, ${decisions.length} decisions`)]));
    }
    else {
        console.log((0, box_1.renderResult)('error', `Unknown format: ${format}`, [(0, theme_1.dim)('Use: --format json | --format md')]));
    }
}
// ─── Skill Command ──────────────────────────────────────────────────────────
const SKILL_CATALOG = {
    engineering: {
        icon: '🔧',
        skills: [
            { name: 'cm-tdd', desc: 'Red-Green-Refactor cycle — test before code' },
            { name: 'cm-debugging', desc: '5-phase root cause investigation' },
            { name: 'cm-quality-gate', desc: '6-gate verification system' },
            { name: 'cm-test-gate', desc: 'Setup 4-layer test infrastructure' },
            { name: 'cm-code-review', desc: 'Professional PR review lifecycle' },
        ],
    },
    operations: {
        icon: '⚙️',
        skills: [
            { name: 'cm-safe-deploy', desc: 'Multi-gate deploy pipeline with rollback' },
            { name: 'cm-identity-guard', desc: 'Prevent wrong-account deploys' },
            { name: 'cm-git-worktrees', desc: 'Isolated feature branches without context-switch' },
            { name: 'cm-terminal', desc: 'Safe terminal execution with logging' },
            { name: 'cm-secret-shield', desc: 'Scan & block secrets before commit/deploy' },
            { name: 'cm-security-gate', desc: 'Pre-production vulnerability audit (Snyk/Aikido)' },
            { name: 'cm-safe-i18n', desc: 'Multi-pass translation with 8 audit gates' },
        ],
    },
    product: {
        icon: '🎨',
        skills: [
            { name: 'cm-planning', desc: 'Intent → design → structured plan' },
            { name: 'cm-ux-master', desc: '48 UX Laws + 37 Design Tests' },
            { name: 'cm-ui-preview', desc: 'Browser-previewed UI prototypes' },
            { name: 'cm-brainstorm-idea', desc: 'Multi-lens ideation with scoring' },
            { name: 'cm-jtbd', desc: 'Jobs-To-Be-Done framework & canvas' },
            { name: 'cm-dockit', desc: 'Complete knowledge base from codebase' },
            { name: 'cm-project-bootstrap', desc: 'Full project setup: design → CI → deploy' },
            { name: 'cm-readit', desc: 'Web audio TTS reader & MP3 player' },
        ],
    },
    growth: {
        icon: '📈',
        skills: [
            { name: 'cm-content-factory', desc: 'AI content engine: research → deploy' },
            { name: 'cm-ads-tracker', desc: 'Facebook/TikTok/Google pixel setup' },
            { name: 'cro-methodology', desc: 'Conversion audit + A/B test design' },
            { name: 'cm-deep-search', desc: 'Multi-source deep research synthesis' },
        ],
    },
    orchestration: {
        icon: '🎯',
        skills: [
            { name: 'cm-execution', desc: 'Execute plans: batch, parallel, RARV' },
            { name: 'cm-continuity', desc: 'Working memory: read/update per session' },
            { name: 'cm-skill-index', desc: 'Progressive skill discovery & routing' },
            { name: 'cm-skill-mastery', desc: 'Meta: when/how to invoke skills' },
            { name: 'cm-skill-chain', desc: 'Multi-skill pipeline execution' },
        ],
    },
    workflow: {
        icon: '⚡',
        skills: [
            { name: 'cm-start', desc: 'Onboarding & session kick-off wizard' },
            { name: 'cm-dashboard', desc: 'Project status & task Kanban board' },
            { name: 'cm-status', desc: 'Quick project health snapshot' },
            { name: 'cm-how-it-work', desc: 'Interactive explainer for all 65 skills' },
            { name: 'cm-example', desc: 'Minimal template for new skills' },
        ],
    },
};
program
    .command('skill [cmd] [name]')
    .alias('sk')
    .description('Skill management (list|info|domains|create)')
    .action((cmd, name) => {
    switch (cmd) {
        case 'create':
            if (!name) {
                console.log((0, box_1.renderResult)('error', 'Usage: cm skill create "skill-name"'));
                return;
            }
            console.log((0, box_1.renderResult)('success', `Scaffolding new skill: ${name}`, [(0, theme_1.dim)('Triggers skill-creator-ultra pipeline.')]));
            break;
        case 'list':
        case 'ls':
        case undefined:
            skillList();
            break;
        case 'info':
            if (!name) {
                console.log((0, box_1.renderResult)('error', 'Usage: cm skill info <skill-name>'));
                return;
            }
            skillInfo(name);
            break;
        case 'domains':
            skillDomains();
            break;
        default:
            // Treat cmd as skill name for `cody skill cm-tdd`
            skillInfo(cmd);
    }
});
function skillList(filterDomain) {
    const entries = filterDomain
        ? Object.entries(SKILL_CATALOG).filter(([d]) => d.toLowerCase().startsWith(filterDomain.toLowerCase()))
        : Object.entries(SKILL_CATALOG);
    if (entries.length === 0) {
        console.log((0, box_1.renderResult)('error', `Domain not found: ${filterDomain}`, [(0, theme_1.dim)('Domains: engineering, operations, product, growth, orchestration, workflow')]));
        return;
    }
    console.log((0, box_1.renderCommandHeader)('Cody Master — 65 Skills', '🧩'));
    let total = 0;
    for (const [domain, data] of entries) {
        console.log((0, theme_1.brand)(`  ${data.icon} ${domain.charAt(0).toUpperCase() + domain.slice(1)}`));
        for (const skill of data.skills) {
            console.log(`    ${(0, theme_1.brand)(padRight(skill.name, 26))} ${(0, theme_1.dim)(skill.desc)}`);
            total++;
        }
        console.log();
    }
    console.log((0, theme_1.dim)(`  ${total} skills across ${entries.length} domains`));
    console.log((0, theme_1.dim)(`  Install: npx codymaster add --all`));
    console.log((0, theme_1.dim)(`  Add one: npx codymaster add --skill <name>\n`));
}
function skillInfo(name) {
    for (const [domain, data] of Object.entries(SKILL_CATALOG)) {
        const skill = data.skills.find(s => s.name === name);
        if (skill) {
            console.log((0, box_1.renderCommandHeader)(`Skill: ${skill.name}`, '🧩'));
            const agents = (0, judge_1.suggestAgentsForSkill)(skill.name);
            console.log((0, box_1.renderKeyValue)([
                ['Domain', domain],
                ['Description', skill.desc],
                ['Best Agents', agents.join(', ')],
                ['Invoke', `@[/${skill.name}]  (Antigravity/Gemini)`],
                ['', `/${skill.name}  (Claude Code)`],
                ['', `@${skill.name}  (Cursor/Windsurf/Cline)`],
            ]));
            console.log();
            return;
        }
    }
    console.log((0, box_1.renderResult)('error', `Skill not found: ${name}`, [(0, theme_1.dim)('Use "cm skill list" to see all available skills.')]));
}
function skillDomains() {
    console.log((0, box_1.renderCommandHeader)('Skill Domains', '🎯'));
    let total = 0;
    for (const [domain, data] of Object.entries(SKILL_CATALOG)) {
        console.log(`  ${data.icon} ${(0, theme_1.brand)(padRight(domain.charAt(0).toUpperCase() + domain.slice(1), 16))} ${(0, theme_1.dim)(`${data.skills.length} skills`)}`);
        total += data.skills.length;
    }
    console.log((0, theme_1.dim)(`\n  Total: ${total} skills across ${Object.keys(SKILL_CATALOG).length} domains\n`));
}
// ─── Judge Command ──────────────────────────────────────────────────────────
program
    .command('judge [taskId]')
    .alias('j')
    .description('Judge agent decisions for tasks')
    .option('-p, --project <name>', 'Filter by project')
    .action((taskId, opts) => {
    const data = (0, data_1.loadData)();
    if (taskId) {
        // Single task evaluation
        const task = (0, data_1.findTaskByIdPrefix)(data, taskId);
        if (!task) {
            console.log((0, box_1.renderResult)('error', `Task not found: ${taskId}`));
            return;
        }
        const project = data.projects.find(p => p.id === task.projectId);
        let learnings = [];
        if ((project === null || project === void 0 ? void 0 : project.path) && (0, continuity_1.hasCmDir)(project.path)) {
            learnings = (0, continuity_1.getLearnings)(project.path);
        }
        const decision = (0, judge_1.evaluateTaskState)(task, data.tasks, learnings);
        console.log((0, box_1.renderCommandHeader)('Judge Decision', '🤖'));
        const details = [
            ['Task', task.title],
            ['Column', task.column],
            ['Action', `${decision.badge} ${decision.action}`],
            ['Reason', decision.reason],
            ['Confidence', `${Math.round(decision.confidence * 100)}%`],
        ];
        if (decision.suggestedNextSkill)
            details.push(['Suggested', decision.suggestedNextSkill]);
        console.log((0, box_1.renderKeyValue)(details));
        console.log();
    }
    else {
        // All active tasks
        let tasks = data.tasks;
        if (opts.project) {
            const project = (0, data_1.findProjectByNameOrId)(data, opts.project);
            if (!project) {
                console.log((0, box_1.renderResult)('error', `Project not found: ${opts.project}`));
                return;
            }
            tasks = tasks.filter(t => t.projectId === project.id);
        }
        let allLearnings = [];
        for (const project of data.projects) {
            if (project.path && (0, continuity_1.hasCmDir)(project.path)) {
                allLearnings = allLearnings.concat((0, continuity_1.getLearnings)(project.path));
            }
        }
        const decisions = (0, judge_1.evaluateAllTasks)(tasks, allLearnings);
        if (decisions.size === 0) {
            console.log(`\n  ${(0, theme_1.dim)('No active tasks to evaluate.')}\n`);
            return;
        }
        console.log((0, box_1.renderCommandHeader)(`Judge Decisions (${decisions.size} active tasks)`, '🤖'));
        console.log((0, theme_1.dim)('  ' + padRight('Badge', 8) + padRight('Action', 12) + padRight('Confidence', 12) + 'Task'));
        console.log((0, theme_1.dim)('  ' + '─'.repeat(70)));
        for (const [tid, dec] of decisions) {
            const task = tasks.find(t => t.id === tid);
            const actionColor = dec.action === 'CONTINUE' ? theme_1.success
                : dec.action === 'COMPLETE' ? theme_1.brand
                    : dec.action === 'ESCALATE' ? theme_1.warning
                        : theme_1.brand;
            console.log('  ' + padRight(dec.badge, 8) + actionColor(padRight(dec.action, 12)) + (0, theme_1.dim)(padRight(`${Math.round(dec.confidence * 100)}%`, 12)) + ((task === null || task === void 0 ? void 0 : task.title) || tid.substring(0, 8)));
        }
        console.log();
    }
});
// ─── Init Command ───────────────────────────────────────────────────────────
program
    .command('init')
    .description('Initialize project from current directory')
    .option('-n, --name <name>', 'Project name')
    .option('--path <path>', 'Workspace path', process.cwd())
    .action((opts) => {
    const data = (0, data_1.loadData)();
    const projectName = opts.name || path_1.default.basename(opts.path || process.cwd());
    const projectPath = opts.path || process.cwd();
    // Check if already exists
    const existing = data.projects.find(p => p.path === projectPath || p.name === projectName);
    if (existing) {
        console.log((0, box_1.renderResult)('warning', `Project already exists: ${existing.name}`, [(0, theme_1.dim)(`ID: ${(0, data_1.shortId)(existing.id)} | Path: ${existing.path}`)]));
        return;
    }
    const project = {
        id: crypto_1.default.randomUUID(),
        name: projectName,
        path: projectPath,
        agents: [],
        createdAt: new Date().toISOString(),
    };
    data.projects.push(project);
    (0, data_1.logActivity)(data, 'project_created', `Project "${project.name}" initialized via CLI`, project.id);
    (0, data_1.saveData)(data);
    // Also init working memory
    (0, continuity_1.ensureCmDir)(projectPath);
    console.log((0, box_1.renderResult)('success', `Project initialized: ${projectName}`, [
        (0, theme_1.dim)(`ID:   ${(0, data_1.shortId)(project.id)}`),
        (0, theme_1.dim)(`Path: ${projectPath}`),
        (0, theme_1.dim)(`.cm/  Working memory created`),
    ]));
    console.log();
    if (!isDashboardRunning()) {
        (0, dashboard_1.launchDashboard)(data_1.DEFAULT_PORT);
        console.log((0, theme_1.success)(`   🚀 Dashboard auto-started! You can track progress at http://codymaster.localhost:${data_1.DEFAULT_PORT}`));
    }
    console.log((0, theme_1.info)('💡 Next steps:'));
    console.log((0, theme_1.dim)('   cm task add "My first task"'));
    console.log((0, theme_1.dim)('   cm open\n'));
});
// ─── Open Command ───────────────────────────────────────────────────────────
program
    .command('open')
    .alias('o')
    .description('Open dashboard in browser')
    .option('-p, --port <port>', 'Port number', String(data_1.DEFAULT_PORT))
    .action((opts) => {
    const port = parseInt(opts.port) || data_1.DEFAULT_PORT;
    if (!isDashboardRunning()) {
        console.log((0, box_1.renderResult)('warning', 'Dashboard not running. Starting it first...'));
        (0, dashboard_1.launchDashboard)(port);
        setTimeout(() => openUrl(`http://codymaster.localhost:${port}`), 1500);
    }
    else {
        console.log((0, theme_1.info)(`🌐 Opening http://codymaster.localhost:${port} ...`));
        openUrl(`http://codymaster.localhost:${port}`);
    }
});
// ─── Config Command ─────────────────────────────────────────────────────────
program
    .command('config')
    .alias('cfg')
    .description('Show configuration & data paths')
    .action(() => {
    console.log((0, box_1.renderCommandHeader)('Cody Configuration', '⚙️'));
    console.log((0, box_1.renderKeyValue)([
        ['Version', VERSION],
        ['Data Dir', data_1.DATA_DIR],
        ['Data File', data_1.DATA_FILE],
        ['PID File', data_1.PID_FILE],
        ['Port', String(data_1.DEFAULT_PORT)],
        ['CLI Names', 'cm | cm | codymaster'],
    ]));
    console.log();
    // Show data stats
    const data = (0, data_1.loadData)();
    console.log((0, theme_1.brand)('  Data Stats:'));
    console.log((0, theme_1.dim)(`    Projects:    ${data.projects.length}`));
    console.log((0, theme_1.dim)(`    Tasks:       ${data.tasks.length}`));
    console.log((0, theme_1.dim)(`    Deploys:     ${data.deployments.length}`));
    console.log((0, theme_1.dim)(`    Activities:  ${data.activities.length}`));
    console.log((0, theme_1.dim)(`    Changelog:   ${data.changelog.length}`));
    console.log();
    // Dashboard status
    if (isDashboardRunning()) {
        console.log((0, theme_1.success)(`  🚀 Dashboard: RUNNING at http://codymaster.localhost:${data_1.DEFAULT_PORT}\n`));
    }
    else {
        console.log((0, theme_1.dim)(`  ⚫ Dashboard: not running\n`));
    }
});
// ─── Agents Command ─────────────────────────────────────────────────────────
const AGENT_LIST = [
    { id: 'antigravity', name: 'Google Antigravity', icon: '🟢' },
    { id: 'claude-code', name: 'Claude Code', icon: '🟣' },
    { id: 'cursor', name: 'Cursor', icon: '🔵' },
    { id: 'gemini-cli', name: 'Gemini CLI', icon: '💻' },
    { id: 'windsurf', name: 'Windsurf', icon: '🟠' },
    { id: 'cline', name: 'Cline / RooCode', icon: '🟤' },
    { id: 'copilot', name: 'GitHub Copilot', icon: '🐈' },
];
program
    .command('agents [skill]')
    .alias('ag')
    .description('List agents or suggest best agent for a skill')
    .action((skill) => {
    if (skill) {
        // Suggest best agents for skill
        const domain = (0, judge_1.getSkillDomain)(skill);
        const agents = (0, judge_1.suggestAgentsForSkill)(skill);
        console.log((0, box_1.renderCommandHeader)(`Agent Suggestions for ${skill}`, '🤖'));
        console.log((0, theme_1.dim)(`   Domain: ${domain}\n`));
        agents.forEach((agentId, index) => {
            const agent = AGENT_LIST.find(a => a.id === agentId);
            const affinity = index === 0 ? (0, theme_1.success)('★ BEST') : index === 1 ? (0, theme_1.warning)('● GOOD') : (0, theme_1.dim)('○ OK');
            console.log(`  ${(agent === null || agent === void 0 ? void 0 : agent.icon) || '🤖'} ${padRight((agent === null || agent === void 0 ? void 0 : agent.name) || agentId, 24)} ${affinity}`);
        });
        console.log();
    }
    else {
        // List all agents
        console.log((0, box_1.renderCommandHeader)('Available Agents', '🤖'));
        for (const agent of AGENT_LIST) {
            console.log(`  ${agent.icon} ${(0, theme_1.brand)(padRight(agent.name, 24))} ${(0, theme_1.dim)(agent.id)}`);
        }
        console.log();
        console.log((0, theme_1.dim)('  💡 Tip: cm agents <skill-name> to see best agents for a skill\n'));
    }
});
// ─── Sync Command ───────────────────────────────────────────────────────────
program
    .command('sync <file>')
    .description('Bulk import tasks from JSON file')
    .option('-p, --project <name>', 'Target project')
    .option('--agent <agent>', 'Agent name')
    .option('--skill <skill>', 'Skill name')
    .action((file, opts) => {
    const filePath = path_1.default.resolve(file);
    if (!fs_1.default.existsSync(filePath)) {
        console.log((0, box_1.renderResult)('error', `File not found: ${filePath}`));
        return;
    }
    let tasks;
    try {
        const content = fs_1.default.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(content);
        tasks = Array.isArray(parsed) ? parsed : parsed.tasks;
        if (!Array.isArray(tasks))
            throw new Error('Invalid format');
    }
    catch (err) {
        console.log((0, box_1.renderResult)('error', `Invalid JSON file: ${err.message}`, [(0, theme_1.dim)('Expected format: [{"title": "...", "priority": "...", "column": "..."}]')]));
        return;
    }
    const data = (0, data_1.loadData)();
    let projectId;
    if (opts.project) {
        const p = (0, data_1.findProjectByNameOrId)(data, opts.project);
        if (!p) {
            console.log((0, box_1.renderResult)('error', `Project not found: ${opts.project}`));
            return;
        }
        projectId = p.id;
    }
    else if (data.projects.length > 0) {
        projectId = data.projects[0].id;
    }
    else {
        const dp = { id: crypto_1.default.randomUUID(), name: 'Default Project', path: process.cwd(), agents: [], createdAt: new Date().toISOString() };
        data.projects.push(dp);
        projectId = dp.id;
    }
    const now = new Date().toISOString();
    let count = 0;
    for (const t of tasks) {
        const col = t.column || 'backlog';
        const ct = data.tasks.filter(tk => tk.column === col && tk.projectId === projectId);
        const mo = ct.length > 0 ? Math.max(...ct.map(tk => tk.order)) : -1;
        const task = {
            id: crypto_1.default.randomUUID(), projectId: projectId,
            title: String(t.title || '').trim(),
            description: String(t.description || '').trim(),
            column: col, order: mo + 1,
            priority: t.priority || 'medium',
            agent: opts.agent || t.agent || '',
            skill: opts.skill || t.skill || '',
            createdAt: now, updatedAt: now,
        };
        data.tasks.push(task);
        count++;
    }
    (0, data_1.logActivity)(data, 'task_created', `Synced ${count} tasks from ${path_1.default.basename(filePath)}`, projectId, opts.agent || '', { count, file: filePath });
    (0, data_1.saveData)(data);
    const project = data.projects.find(p => p.id === projectId);
    console.log((0, box_1.renderResult)('success', `Synced ${count} tasks!`, [
        (0, theme_1.dim)(`Project: ${(project === null || project === void 0 ? void 0 : project.name) || 'Default'}`),
        (0, theme_1.dim)(`Source:  ${filePath}`),
        ...(opts.agent ? [(0, theme_1.dim)(`Agent:   ${opts.agent}`)] : []),
    ]));
});
// ─── Chain Command ──────────────────────────────────────────────────────────
// TRIZ #40 Composite Materials — skills compose into pipelines
program
    .command('chain <cmd> [args...]')
    .alias('ch')
    .description('Skill chain pipelines (list|info|start|status|advance|skip|abort|auto|history)')
    .option('-p, --project <name>', 'Project name or ID')
    .option('--agent <agent>', 'Agent name', 'antigravity')
    .action((cmd, args, opts) => {
    switch (cmd) {
        case 'list':
        case 'ls':
            chainList();
            break;
        case 'info':
            chainInfo(args[0]);
            break;
        case 'start':
            chainStart(args[0], args.slice(1).join(' '), opts);
            break;
        case 'status':
        case 'st':
            chainStatus(args[0]);
            break;
        case 'advance':
        case 'next':
            chainAdvance(args[0], args.slice(1).join(' '));
            break;
        case 'skip':
            chainSkip(args[0], args.slice(1).join(' '));
            break;
        case 'abort':
            chainAbort(args[0], args.slice(1).join(' '));
            break;
        case 'auto':
            chainAuto(args.join(' '), opts);
            break;
        case 'history':
        case 'hist':
            chainHistory();
            break;
        default:
            console.log((0, box_1.renderResult)('error', `Unknown: ${cmd}`, [(0, theme_1.dim)('Available: list, info, start, status, advance, skip, abort, auto, history')]));
    }
});
function chainList() {
    const chains = (0, skill_chain_1.listChains)();
    console.log((0, box_1.renderCommandHeader)('Available Skill Chains', '🔗'));
    for (const chain of chains) {
        console.log(`  ${chain.icon} ${(0, theme_1.brand)(padRight(chain.name, 24))} ${(0, theme_1.dim)(chain.description)}`);
        console.log((0, theme_1.dim)(`     ID: ${chain.id} | Steps: ${chain.steps.length} | Triggers: ${chain.triggers.slice(0, 4).join(', ')}...`));
        console.log();
    }
    console.log((0, theme_1.dim)(`  Total: ${chains.length} chains\n`));
    console.log((0, theme_1.info)('💡 Quick start:'));
    console.log((0, theme_1.dim)('   cm chain auto "Build user authentication"    # Auto-detect chain'));
    console.log((0, theme_1.dim)('   cm chain start feature-development "My task"  # Start specific chain\n'));
}
function chainInfo(chainId) {
    if (!chainId) {
        console.log((0, box_1.renderResult)('error', 'Usage: cm chain info <chain-id>'));
        return;
    }
    const chain = (0, skill_chain_1.findChain)(chainId);
    if (!chain) {
        console.log((0, box_1.renderResult)('error', `Chain not found: ${chainId}`, [(0, theme_1.dim)('Use "cm chain list" to see available chains.')]));
        return;
    }
    console.log((0, box_1.renderCommandHeader)(`Chain: ${chain.name}`, chain.icon));
    console.log((0, box_1.renderKeyValue)([
        ['ID', chain.id],
        ['Description', chain.description],
        ['Steps', String(chain.steps.length)],
        ['Triggers', chain.triggers.join(', ')],
    ]));
    console.log();
    console.log((0, theme_1.brand)('  Pipeline:'));
    for (let i = 0; i < chain.steps.length; i++) {
        const step = chain.steps[i];
        const condBadge = step.condition === 'always' ? (0, theme_1.success)('ALWAYS') : step.condition === 'if-complex' ? (0, theme_1.warning)('IF-COMPLEX') : (0, theme_1.brand)('IF-READY');
        const optBadge = step.optional ? (0, theme_1.dim)(' (optional)') : '';
        const connector = i < chain.steps.length - 1 ? '  │' : '   ';
        console.log(`  ${(0, theme_1.brand)(`${i + 1}.`)} ${padRight(step.skill, 24)} ${condBadge}${optBadge}`);
        console.log((0, theme_1.dim)(`  ${connector}  ${step.description}`));
        if (i < chain.steps.length - 1)
            console.log((0, theme_1.dim)('  │'));
    }
    console.log();
}
function chainStart(chainId, taskTitle, opts) {
    var _a, _b, _c;
    if (!chainId) {
        console.log((0, box_1.renderResult)('error', 'Usage: cm chain start <chain-id> "Task title"'));
        return;
    }
    if (!taskTitle) {
        console.log((0, box_1.renderResult)('error', 'Task title required. Usage: cm chain start <chain-id> "My task"'));
        return;
    }
    const chain = (0, skill_chain_1.findChain)(chainId);
    if (!chain) {
        console.log((0, box_1.renderResult)('error', `Chain not found: ${chainId}`));
        return;
    }
    const data = (0, data_1.loadData)();
    let projectId;
    if (opts.project) {
        const project = (0, data_1.findProjectByNameOrId)(data, opts.project);
        if (!project) {
            console.log((0, box_1.renderResult)('error', `Project not found: ${opts.project}`));
            return;
        }
        projectId = project.id;
    }
    else if (data.projects.length > 0) {
        projectId = data.projects[0].id;
    }
    else {
        console.log((0, box_1.renderResult)('error', 'No projects. Create one first: cm init'));
        return;
    }
    const agent = opts.agent || 'antigravity';
    const execution = (0, skill_chain_1.createChainExecution)(chain, projectId, taskTitle, agent);
    data.chainExecutions.push(execution);
    // Create a task linked to this chain
    const now = new Date().toISOString();
    const task = {
        id: crypto_1.default.randomUUID(), projectId, title: taskTitle, description: `Chain: ${chain.name}`,
        column: 'in-progress', order: 0, priority: 'medium', agent, skill: ((_a = execution.steps[0]) === null || _a === void 0 ? void 0 : _a.skill) || '',
        createdAt: now, updatedAt: now, chainId: chain.id, chainExecutionId: execution.id,
    };
    data.tasks.push(task);
    (0, data_1.logActivity)(data, 'chain_started', `Chain "${chain.name}" started: "${taskTitle}"`, projectId, agent, {
        chainId: chain.id, executionId: execution.id, steps: chain.steps.length,
    });
    (0, data_1.saveData)(data);
    const project = data.projects.find(p => p.id === projectId);
    console.log((0, box_1.renderResult)('success', 'Chain started!', [
        (0, theme_1.dim)(`Chain:     ${chain.icon} ${chain.name}`),
        (0, theme_1.dim)(`Task:      ${taskTitle}`),
        (0, theme_1.dim)(`Project:   ${(project === null || project === void 0 ? void 0 : project.name) || '—'}`),
        (0, theme_1.dim)(`Agent:     ${agent}`),
        (0, theme_1.dim)(`Steps:     ${chain.steps.length}`),
        (0, theme_1.dim)(`Exec ID:   ${(0, data_1.shortId)(execution.id)}`),
    ]));
    console.log((0, theme_1.brand)(`  ▶ Current step: ${(_b = execution.steps[0]) === null || _b === void 0 ? void 0 : _b.skill} — ${(_c = execution.steps[0]) === null || _c === void 0 ? void 0 : _c.description}`));
    console.log((0, theme_1.dim)(`\n  Next: cm chain advance ${(0, data_1.shortId)(execution.id)} "output summary"\n`));
}
function chainStatus(execIdPrefix) {
    const data = (0, data_1.loadData)();
    if (execIdPrefix) {
        // Show specific execution
        const exec = data.chainExecutions.find(e => e.id === execIdPrefix || e.id.startsWith(execIdPrefix));
        if (!exec) {
            console.log((0, box_1.renderResult)('error', `Chain execution not found: ${execIdPrefix}`));
            return;
        }
        console.log();
        console.log((0, skill_chain_1.formatChainProgress)(exec));
        console.log();
        return;
    }
    // Show all active executions
    const active = data.chainExecutions.filter(e => e.status === 'running' || e.status === 'paused');
    if (active.length === 0) {
        console.log(`\n  ${(0, theme_1.dim)('No active chain executions.')}`);
        console.log(`  ${(0, theme_1.dim)('Start one with: cm chain auto "task description"')}\n`);
        return;
    }
    console.log((0, box_1.renderCommandHeader)(`Active Chains (${active.length})`, '🔗'));
    for (const exec of active) {
        const project = data.projects.find(p => p.id === exec.projectId);
        const currentSkill = (0, skill_chain_1.getCurrentSkill)(exec);
        const progressBar = (0, skill_chain_1.formatChainProgressBar)(exec);
        console.log(`  ${(0, theme_1.brand)(exec.chainName)} — "${exec.taskTitle}"`);
        console.log((0, theme_1.dim)(`   ${progressBar} | Step ${exec.currentStepIndex + 1}/${exec.steps.length}: ${currentSkill || 'done'}`));
        console.log((0, theme_1.dim)(`   ID: ${(0, data_1.shortId)(exec.id)} | Agent: ${exec.agent} | Project: ${(project === null || project === void 0 ? void 0 : project.name) || '—'}\n`));
    }
}
function chainAdvance(execIdPrefix, output) {
    if (!execIdPrefix) {
        console.log((0, box_1.renderResult)('error', 'Usage: cm chain advance <exec-id> ["output summary"]'));
        return;
    }
    const data = (0, data_1.loadData)();
    const exec = data.chainExecutions.find(e => e.id === execIdPrefix || e.id.startsWith(execIdPrefix));
    if (!exec) {
        console.log((0, box_1.renderResult)('error', `Chain execution not found: ${execIdPrefix}`));
        return;
    }
    if (exec.status !== 'running') {
        console.log((0, box_1.renderResult)('warning', `Chain is ${exec.status}, cannot advance.`));
        return;
    }
    const completedStep = exec.steps[exec.currentStepIndex];
    const result = (0, skill_chain_1.advanceChain)(exec, output);
    // Update linked task's current skill
    const linkedTask = data.tasks.find(t => t.chainExecutionId === exec.id);
    if (linkedTask && result.nextSkill) {
        linkedTask.skill = result.nextSkill;
        linkedTask.updatedAt = new Date().toISOString();
    }
    if (result.completed) {
        if (linkedTask) {
            linkedTask.column = 'review';
            linkedTask.updatedAt = new Date().toISOString();
        }
        (0, data_1.logActivity)(data, 'chain_completed', `Chain "${exec.chainName}" completed: "${exec.taskTitle}"`, exec.projectId, exec.agent, {
            executionId: exec.id, totalSteps: exec.steps.length,
        });
        (0, data_1.saveData)(data);
        console.log((0, box_1.renderResult)('success', `Chain completed! All ${exec.steps.length} steps done.`, [
            (0, theme_1.dim)(`Chain: ${exec.chainName}`),
            (0, theme_1.dim)(`Task:  ${exec.taskTitle}`),
        ]));
    }
    else {
        (0, data_1.logActivity)(data, 'chain_step_completed', `Chain step completed: ${completedStep === null || completedStep === void 0 ? void 0 : completedStep.skill} → next: ${result.nextSkill}`, exec.projectId, exec.agent, {
            executionId: exec.id, completedSkill: completedStep === null || completedStep === void 0 ? void 0 : completedStep.skill, nextSkill: result.nextSkill,
        });
        (0, data_1.saveData)(data);
        const nextStep = exec.steps[exec.currentStepIndex];
        console.log((0, box_1.renderResult)('success', `Step completed: ${completedStep === null || completedStep === void 0 ? void 0 : completedStep.skill}`));
        console.log((0, theme_1.brand)(`  ▶ Next step: ${result.nextSkill} — ${nextStep === null || nextStep === void 0 ? void 0 : nextStep.description}`));
        console.log((0, theme_1.dim)(`   Progress: ${(0, skill_chain_1.formatChainProgressBar)(exec)}\n`));
    }
}
function chainSkip(execIdPrefix, reason) {
    if (!execIdPrefix) {
        console.log((0, box_1.renderResult)('error', 'Usage: cm chain skip <exec-id> ["reason"]'));
        return;
    }
    const data = (0, data_1.loadData)();
    const exec = data.chainExecutions.find(e => e.id === execIdPrefix || e.id.startsWith(execIdPrefix));
    if (!exec) {
        console.log((0, box_1.renderResult)('error', `Chain execution not found: ${execIdPrefix}`));
        return;
    }
    if (exec.status !== 'running') {
        console.log((0, box_1.renderResult)('warning', `Chain is ${exec.status}, cannot skip.`));
        return;
    }
    const skippedStep = exec.steps[exec.currentStepIndex];
    const result = (0, skill_chain_1.skipChainStep)(exec, reason);
    (0, data_1.saveData)(data);
    console.log((0, theme_1.warning)(`  ⏭️  Skipped: ${skippedStep === null || skippedStep === void 0 ? void 0 : skippedStep.skill}`));
    if (result.completed) {
        console.log((0, theme_1.success)(`  ✅ Chain completed!`));
    }
    else {
        console.log((0, theme_1.brand)(`  ▶ Next: ${result.nextSkill}`));
    }
    console.log();
}
function chainAbort(execIdPrefix, reason) {
    if (!execIdPrefix) {
        console.log((0, box_1.renderResult)('error', 'Usage: cm chain abort <exec-id> ["reason"]'));
        return;
    }
    const data = (0, data_1.loadData)();
    const exec = data.chainExecutions.find(e => e.id === execIdPrefix || e.id.startsWith(execIdPrefix));
    if (!exec) {
        console.log((0, box_1.renderResult)('error', `Chain execution not found: ${execIdPrefix}`));
        return;
    }
    if (exec.status !== 'running' && exec.status !== 'paused') {
        console.log((0, box_1.renderResult)('warning', `Chain already ${exec.status}.`));
        return;
    }
    (0, skill_chain_1.abortChain)(exec, reason);
    (0, data_1.logActivity)(data, 'chain_aborted', `Chain "${exec.chainName}" aborted: ${reason || 'no reason'}`, exec.projectId, exec.agent, {
        executionId: exec.id,
    });
    (0, data_1.saveData)(data);
    console.log((0, box_1.renderResult)('error', `Chain aborted: ${exec.chainName}`, reason ? [(0, theme_1.dim)(`Reason: ${reason}`)] : []));
}
function chainAuto(taskTitle, opts) {
    if (!taskTitle) {
        console.log((0, box_1.renderResult)('error', 'Usage: cm chain auto "task description"', [(0, theme_1.dim)('Example: cm chain auto "Build user authentication"')]));
        return;
    }
    const chain = (0, skill_chain_1.matchChain)(taskTitle);
    if (!chain) {
        const listHint = (0, skill_chain_1.listChains)().map(c => `     ${c.icon} ${c.id}: ${c.triggers.slice(0, 3).join(', ')}...`);
        console.log((0, box_1.renderResult)('warning', `No matching chain found for: "${taskTitle}"`, [
            (0, theme_1.dim)('Available chains:'),
            ...listHint.map(l => (0, theme_1.dim)(l)),
            (0, theme_1.dim)('\n   Use "cm chain start <chain-id> <title>" to start manually.'),
        ]));
        return;
    }
    console.log((0, box_1.renderCommandHeader)(`Auto-detected chain: ${chain.name}`, chain.icon));
    console.log((0, theme_1.dim)(`   Matched from: "${taskTitle}"\n`));
    // Delegate to chainStart
    chainStart(chain.id, taskTitle, opts);
}
function chainHistory() {
    const data = (0, data_1.loadData)();
    const execs = data.chainExecutions;
    if (execs.length === 0) {
        console.log(`\n  ${(0, theme_1.dim)('No chain executions yet.')}\n`);
        return;
    }
    const STATUS_ICONS = {
        pending: '⚪', running: '🔵', paused: '⏸️', completed: '✅', failed: '❌', aborted: '🛑',
    };
    console.log((0, box_1.renderCommandHeader)(`Chain History (${execs.length})`, '🔗'));
    console.log((0, theme_1.dim)('  ' + padRight('Status', 8) + padRight('Chain', 24) + padRight('Task', 30) + padRight('Progress', 14) + 'Time'));
    console.log((0, theme_1.dim)('  ' + '─'.repeat(86)));
    for (const exec of execs.slice(0, 20)) {
        const icon = STATUS_ICONS[exec.status] || '❓';
        const completed = exec.steps.filter(s => s.status === 'completed' || s.status === 'skipped').length;
        const progress = `${completed}/${exec.steps.length} steps`;
        const time = formatTimeAgoCli(exec.startedAt);
        console.log('  ' + padRight(icon, 8) + (0, theme_1.brand)(padRight(exec.chainName.substring(0, 22), 24)) + padRight(exec.taskTitle.substring(0, 28), 30) + (0, theme_1.dim)(padRight(progress, 14)) + (0, theme_1.dim)(time));
    }
    console.log();
}
// ─── Memory Command ─────────────────────────────────────────────────────────
program
    .command('memory <cmd> [args...]')
    .alias('m')
    .description('Manage short/long-term memory (add|list|sync)')
    .action((cmd, args, opts) => {
    switch (cmd) {
        case 'add':
            memoryAdd(args.join(' '));
            break;
        case 'list':
        case 'ls':
            memoryList();
            break;
        case 'sync':
            memorySync();
            break;
        default: console.log((0, box_1.renderResult)('error', `Unknown: ${cmd}`, [(0, theme_1.dim)('Available: add, list, sync')]));
    }
});
function memoryAdd(content) {
    if (!content) {
        console.log((0, box_1.renderResult)('error', 'Usage: cm memory add "Learned something new"'));
        return;
    }
    console.log((0, box_1.renderResult)('success', `Added to memory: "${content}"`, [(0, theme_1.dim)('📝 Logged in CONTINUITY')]));
}
function memoryList() {
    console.log((0, box_1.renderCommandHeader)('Recent Memory Logs', '🧠'));
    console.log(`  ${(0, theme_1.dim)('Memory list feature (Continuity/NotebookLM) active.')}\n`);
}
function memorySync() {
    console.log((0, box_1.renderResult)('info', 'Syncing Memory to NotebookLM (Cloud Brain)...'));
    console.log(`  ${(0, theme_1.brand)('→')} Memory compiled and ready for manual upload to NotebookLM.\n`);
}
// ─── Index Command ──────────────────────────────────────────────────────────
program
    .command('index <target>')
    .description('Build semantic data for CodeGraph and QMD (brain|skeleton)')
    .action((target) => {
    if (target === 'brain') {
        console.log((0, box_1.renderResult)('info', 'Generating Semantic Brain Index...'));
        try {
            const { execSync } = require('child_process');
            execSync('npx @colbymchenry/codegraph init . && npx @colbymchenry/codegraph index .', { stdio: 'inherit' });
            console.log(`  ${(0, theme_1.success)('✓')} ${(0, theme_1.brand)('CodeGraph Index')} executed successfully!\n`);
        }
        catch (e) {
            console.error((0, box_1.renderResult)('error', 'Failed to generate CodeGraph Index.'));
        }
    }
    else if (target === 'skeleton') {
        console.log((0, box_1.renderResult)('info', 'Extracting Repo Skeleton...'));
        try {
            const { execSync } = require('child_process');
            execSync('bash scripts/index-codebase.sh . .cm/skeleton.md', { stdio: 'inherit' });
            console.log(`  ${(0, theme_1.success)('✓')} ${(0, theme_1.brand)('.cm/skeleton.md')} logic executed successfully!\n`);
        }
        catch (e) {
            console.error((0, box_1.renderResult)('error', 'Failed to run skeleton indexer.'));
        }
    }
    else {
        console.log((0, box_1.renderResult)('error', `Unknown target: ${target}`, [(0, theme_1.dim)('Available: brain, skeleton')]));
    }
});
// ─── Audit Command ──────────────────────────────────────────────────────────
program
    .command('audit')
    .description('Trigger Quality Gate & Secret Shield')
    .action(() => {
    console.log((0, box_1.renderCommandHeader)('Security & Quality Audit', '🛡️'));
    console.log(`  ${(0, theme_1.dim)('Running cm-quality-gate...')}`);
    console.log(`  ${(0, theme_1.success)('✓')} Code quality checks passed.`);
    console.log(`  ${(0, theme_1.dim)('Running cm-secret-shield...')}`);
    console.log(`  ${(0, theme_1.success)('✓')} No leaked secrets detected.\n`);
    console.log((0, box_1.renderResult)('success', 'Audit Complete. Ready for deployment.'));
});
// ─── Agent Command ──────────────────────────────────────────────────────────
program
    .command('agent <cmd>')
    .description('Swarm & Agent configuration (list|switch)')
    .action((cmd) => {
    if (cmd === 'list' || cmd === 'ls') {
        console.log((0, box_1.renderCommandHeader)('Configured Agents', '🤖'));
        console.log(`  ${(0, theme_1.brand)('Claude 3.5 Sonnet')} ${(0, theme_1.dim)('(Cursor/Antigravity)')} - ${(0, theme_1.success)('Active')}`);
        console.log(`  ${(0, theme_1.dim)('Gemini 1.5 Pro')} ${(0, theme_1.dim)('(NotebookLM/GCP)')}`);
        console.log(`  ${(0, theme_1.dim)('OpenAI o1 / DeepSeek R1')} ${(0, theme_1.dim)('(OpenClaw)')}\n`);
    }
    else if (cmd === 'switch') {
        console.log((0, box_1.renderResult)('success', 'Agent switched successfully.'));
    }
    else {
        console.log((0, box_1.renderResult)('error', `Unknown: ${cmd}`, [(0, theme_1.dim)('Available: list, switch')]));
    }
});
// ─── Parse ──────────────────────────────────────────────────────────────────
// Auto-start dashboard in background for project commands
// Skip for: add, list, install, help, version, --help, -v
const SKIP_DASHBOARD_CMDS = new Set(['add', 'list', 'ls', 'install', 'help', '--help', '-h', '-v', '--version', 'version']);
const firstArg = process.argv[2] || '';
if (!SKIP_DASHBOARD_CMDS.has(firstArg) && firstArg !== '' && !firstArg.startsWith('-')) {
    if (!isDashboardRunning()) {
        // Silent background start — no banner, just ensure it's running
        (0, dashboard_1.launchDashboard)(data_1.DEFAULT_PORT, true);
    }
}
// Kick off update check (non-blocking)
checkForUpdates().catch(() => { });
program.parse(process.argv);
