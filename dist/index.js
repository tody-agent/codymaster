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
const VERSION = '3.4.0';
// ─── Branding ───────────────────────────────────────────────────────────────
function showBanner() {
    console.log(chalk_1.default.cyan(`
   ██████╗ ██████╗  ██████╗  ██╗   ██╗
  ██╔════╝██╔═══██╗██╔══██╗ ╚██╗ ██╔╝   Cody v${VERSION}
  ██║     ██║   ██║██║  ██║  ╚████╔╝    33 Skills. Ship 10x faster.
  ██║     ██║   ██║██║  ██║   ╚██╔╝     Dashboard: http://codymaster.localhost:${data_1.DEFAULT_PORT}
  ╚██████╗╚██████╔╝██████╔╝    ██║
   ╚═════╝ ╚═════╝ ╚═════╝     ╚═╝
`));
}
// ─── Utility ────────────────────────────────────────────────────────────────
const COL_COLORS = {
    'backlog': chalk_1.default.gray, 'in-progress': chalk_1.default.blue, 'review': chalk_1.default.yellow, 'done': chalk_1.default.green,
};
const PRIORITY_COLORS = {
    'low': chalk_1.default.green, 'medium': chalk_1.default.yellow, 'high': chalk_1.default.red, 'urgent': chalk_1.default.magenta,
};
const STATUS_COLORS = {
    'success': chalk_1.default.green, 'failed': chalk_1.default.red, 'pending': chalk_1.default.yellow,
    'running': chalk_1.default.blue, 'rolled_back': chalk_1.default.magenta,
};
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
        console.log();
        console.log(chalk_1.default.green('╔══════════════════════════════════════════════════╗'));
        console.log(chalk_1.default.green('║  🎉 You\'re all set! What would you like to do?   ║'));
        console.log(chalk_1.default.green('╚══════════════════════════════════════════════════╝'));
        console.log();
        const p = (yield Promise.resolve().then(() => __importStar(require('prompts')))).default;
        const invoke = platform === 'claude' ? '/cm:demo  (type in Claude Code)' :
            platform === 'gemini' ? '@[/cm-planning] in Gemini CLI' :
                platform === 'cursor' ? '@cm-planning in Cursor Agent' :
                    '@cm-planning in your AI tool';
        const resp = yield p({
            type: 'select',
            name: 'action',
            message: 'Choose an action:',
            choices: [
                { title: chalk_1.default.cyan('📊 Launch Dashboard'), value: 'dashboard',
                    description: `Open Mission Control → http://codymaster.localhost:${data_1.DEFAULT_PORT}` },
                { title: chalk_1.default.magenta('🚀 Start in ' + platform.charAt(0).toUpperCase() + platform.slice(1)), value: 'invoke',
                    description: invoke },
                { title: chalk_1.default.white('🧩 Browse all 33 skills'), value: 'skills',
                    description: 'See every skill, domain, and usage' },
                { title: chalk_1.default.yellow('⚡ Install `cody` globally'), value: 'global',
                    description: 'Add cody / cm / codymaster to your PATH' },
                { title: chalk_1.default.gray('✅ Done'), value: 'done' },
            ],
            hint: '↑↓ navigate · Enter select · Ctrl+C exit',
        });
        switch (resp === null || resp === void 0 ? void 0 : resp.action) {
            case 'dashboard': {
                console.log();
                if (!isDashboardRunning()) {
                    (0, dashboard_1.launchDashboard)(data_1.DEFAULT_PORT, false);
                    yield new Promise(r => setTimeout(r, 800)); // let server start
                }
                console.log(chalk_1.default.cyan(`🌐 Opening http://codymaster.localhost:${data_1.DEFAULT_PORT} ...`));
                openUrl(`http://codymaster.localhost:${data_1.DEFAULT_PORT}`);
                console.log(chalk_1.default.gray('   Dashboard is running. Press Ctrl+C to stop.\n'));
                break;
            }
            case 'invoke':
                console.log();
                if (platform === 'claude') {
                    console.log(chalk_1.default.white('Open Claude Code and type:\n'));
                    console.log(chalk_1.default.cyan('  /cm:demo'));
                    console.log(chalk_1.default.gray('\n  This will run an interactive tour of all 33 skills.\n'));
                }
                else {
                    console.log(chalk_1.default.cyan(`  ${invoke}\n`));
                }
                break;
            case 'skills':
                console.log();
                skillList();
                break;
            case 'global':
                console.log();
                console.log(chalk_1.default.white('Run this to install the `cody` CLI globally:\n'));
                console.log(chalk_1.default.cyan('  npm install -g codymaster'));
                console.log(chalk_1.default.gray('\nThen use:'));
                console.log(chalk_1.default.cyan('  cody task add "My task"'));
                console.log(chalk_1.default.cyan('  cody dashboard'));
                console.log(chalk_1.default.cyan('  cody status\n'));
                break;
            default:
                console.log(chalk_1.default.gray('\nRun `npx codymaster` any time to open the menu.\n'));
        }
    });
}
// ─── Interactive Quick Menu (no-args entry point) ─────────────────────────────
function showInteractiveMenu() {
    return __awaiter(this, void 0, void 0, function* () {
        showBanner();
        const dashStatus = isDashboardRunning()
            ? chalk_1.default.green('● RUNNING') + chalk_1.default.gray(` http://codymaster.localhost:${data_1.DEFAULT_PORT}`)
            : chalk_1.default.gray('○ stopped');
        console.log(chalk_1.default.gray(`  Dashboard: ${dashStatus}`));
        console.log();
        const p = (yield Promise.resolve().then(() => __importStar(require('prompts')))).default;
        const resp = yield p({
            type: 'select',
            name: 'action',
            message: 'Quick menu:',
            choices: [
                { title: chalk_1.default.cyan('📊 Dashboard'), value: 'dashboard',
                    description: isDashboardRunning() ? 'Open in browser' : 'Start & open in browser' },
                { title: chalk_1.default.white('📋 My Tasks'), value: 'tasks',
                    description: 'View all tasks across projects' },
                { title: chalk_1.default.white('📈 Status'), value: 'status',
                    description: 'Project health snapshot' },
                { title: chalk_1.default.magenta('🧩 Browse Skills'), value: 'skills',
                    description: 'All 33 skills by domain' },
                { title: chalk_1.default.yellow('➕ Add a Task'), value: 'addtask',
                    description: 'Quickly add a task to backlog' },
                { title: chalk_1.default.green('⚡ Install/Update Skills'), value: 'install',
                    description: 'npx codymaster add --all' },
                { title: chalk_1.default.gray('❓ Help'), value: 'help' },
            ],
            hint: '↑↓ navigate · Enter select · Ctrl+C exit',
        });
        console.log();
        switch (resp === null || resp === void 0 ? void 0 : resp.action) {
            case 'dashboard':
                if (!isDashboardRunning()) {
                    (0, dashboard_1.launchDashboard)(data_1.DEFAULT_PORT, false);
                    yield new Promise(r => setTimeout(r, 800));
                }
                console.log(chalk_1.default.cyan(`🌐 Opening http://codymaster.localhost:${data_1.DEFAULT_PORT} ...`));
                openUrl(`http://codymaster.localhost:${data_1.DEFAULT_PORT}`);
                console.log(chalk_1.default.gray('Dashboard is running. Ctrl+C to stop.\n'));
                break;
            case 'tasks':
                // Inline task list
                require('child_process').spawnSync(process.execPath, [process.argv[1], 'task', 'list'], { stdio: 'inherit' });
                break;
            case 'status':
                require('child_process').spawnSync(process.execPath, [process.argv[1], 'status'], { stdio: 'inherit' });
                break;
            case 'skills':
                skillList();
                break;
            case 'addtask': {
                const t = yield p({ type: 'text', name: 'title', message: 'Task title:' });
                if (t === null || t === void 0 ? void 0 : t.title) {
                    require('child_process').spawnSync(process.execPath, [process.argv[1], 'task', 'add', t.title], { stdio: 'inherit' });
                }
                break;
            }
            case 'install':
                console.log(chalk_1.default.cyan('Run:  npx codymaster add --all\n'));
                break;
            case 'help':
            default:
                console.log(chalk_1.default.white('Usage: cody <command> [options]\n'));
                console.log(chalk_1.default.gray('  cody dashboard          Open Mission Control'));
                console.log(chalk_1.default.gray('  cody status             Project overview'));
                console.log(chalk_1.default.gray('  cody task add "Title"   Add a task'));
                console.log(chalk_1.default.gray('  cody task list          View tasks'));
                console.log(chalk_1.default.gray('  cody list               Browse 33 skills'));
                console.log(chalk_1.default.gray('  cody deploy staging     Record deployment'));
                console.log(chalk_1.default.gray('  npx codymaster add --all   Install/update skills\n'));
        }
    });
}
// ─── Program ────────────────────────────────────────────────────────────────
const program = new commander_1.Command();
program
    .name('cody')
    .description('Cody — 33 Skills. Ship 10x faster.')
    .version(VERSION, '-v, --version', 'Show version')
    .action(() => __awaiter(void 0, void 0, void 0, function* () {
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
                console.log(chalk_1.default.yellow('⚠️  Dashboard already running.'));
                console.log(chalk_1.default.gray(`   URL: http://codymaster.localhost:${port}`));
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
            console.log(chalk_1.default.blue(`🌐 Opening http://codymaster.localhost:${port} ...`));
            openUrl(`http://codymaster.localhost:${port}`);
            break;
        case 'url':
            console.log(`http://codymaster.localhost:${port}`);
            break;
        default:
            console.log(chalk_1.default.red(`Unknown: ${cmd}`));
            console.log(chalk_1.default.gray('Available: start, stop, status, open, url'));
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
            console.log(chalk_1.default.yellow('⚠️  No dashboard running.'));
            return;
        }
        const pid = parseInt(fs_1.default.readFileSync(data_1.PID_FILE, 'utf-8').trim());
        process.kill(pid, 'SIGTERM');
        try {
            fs_1.default.unlinkSync(data_1.PID_FILE);
        }
        catch (_a) { }
        console.log(chalk_1.default.green(`✅ Dashboard stopped (PID ${pid}).`));
    }
    catch (err) {
        console.log(chalk_1.default.red(`Failed to stop: ${err.message}`));
        try {
            fs_1.default.unlinkSync(data_1.PID_FILE);
        }
        catch (_b) { }
    }
}
function dashboardStatus(port) {
    if (isDashboardRunning()) {
        const pid = fs_1.default.readFileSync(data_1.PID_FILE, 'utf-8').trim();
        console.log(chalk_1.default.green(`✅ Dashboard RUNNING`));
        console.log(chalk_1.default.gray(`   PID: ${pid}`));
        console.log(chalk_1.default.gray(`   URL: http://codymaster.localhost:${port}`));
    }
    else {
        console.log(chalk_1.default.yellow('⚫ Dashboard NOT running'));
        console.log(chalk_1.default.gray('   Start with: cody dashboard start'));
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
        default:
            console.log(chalk_1.default.red(`Unknown: ${cmd}`));
            console.log(chalk_1.default.gray('Available: add, list, move, done, rm, dispatch, stuck'));
    }
});
function taskAdd(title, opts) {
    if (!title) {
        console.log(chalk_1.default.red('❌ Title required. Usage: cody task add "My task"'));
        return;
    }
    const data = (0, data_1.loadData)();
    let projectId;
    if (opts.project) {
        const project = (0, data_1.findProjectByNameOrId)(data, opts.project);
        if (!project) {
            console.log(chalk_1.default.red(`❌ Project not found: ${opts.project}`));
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
    console.log(chalk_1.default.green(`✅ Task created: ${title}`));
    console.log(chalk_1.default.gray(`   ID: ${(0, data_1.shortId)(task.id)} | Project: ${(project === null || project === void 0 ? void 0 : project.name) || 'Default'} | ${column} | ${opts.priority || 'medium'}`));
}
function taskList(opts) {
    const data = (0, data_1.loadData)();
    let tasks = data.tasks;
    if (opts.project && !opts.all) {
        const project = (0, data_1.findProjectByNameOrId)(data, opts.project);
        if (!project) {
            console.log(chalk_1.default.red(`❌ Project not found: ${opts.project}`));
            return;
        }
        tasks = tasks.filter(t => t.projectId === project.id);
        console.log(chalk_1.default.cyan(`\n📋 Tasks — ${project.name}\n`));
    }
    else {
        console.log(chalk_1.default.cyan('\n📋 All Tasks\n'));
    }
    if (tasks.length === 0) {
        console.log(chalk_1.default.gray('  No tasks found.\n'));
        return;
    }
    console.log(chalk_1.default.gray('  ' + padRight('ID', 10) + padRight('Title', 36) + padRight('Column', 14) + padRight('Priority', 10) + padRight('Agent', 14) + 'Project'));
    console.log(chalk_1.default.gray('  ' + '─'.repeat(100)));
    const co = ['backlog', 'in-progress', 'review', 'done'];
    tasks.sort((a, b) => co.indexOf(a.column) - co.indexOf(b.column) || a.order - b.order);
    for (const task of tasks) {
        const cc = COL_COLORS[task.column] || chalk_1.default.white;
        const pc = PRIORITY_COLORS[task.priority] || chalk_1.default.white;
        const project = data.projects.find(p => p.id === task.projectId);
        console.log('  ' + chalk_1.default.gray(padRight((0, data_1.shortId)(task.id), 10)) + padRight(task.title.substring(0, 34), 36) + cc(padRight(task.column, 14)) + pc(padRight(task.priority, 10)) + chalk_1.default.gray(padRight(task.agent || '—', 14)) + chalk_1.default.gray((project === null || project === void 0 ? void 0 : project.name) || '—'));
    }
    console.log(chalk_1.default.gray(`\n  Total: ${tasks.length} tasks\n`));
}
function taskMove(idPrefix, targetColumn) {
    if (!idPrefix || !targetColumn) {
        console.log(chalk_1.default.red('❌ Usage: cody task move <id> <column>'));
        return;
    }
    const vc = ['backlog', 'in-progress', 'review', 'done'];
    if (!vc.includes(targetColumn)) {
        console.log(chalk_1.default.red(`❌ Invalid column: ${targetColumn}. Valid: ${vc.join(', ')}`));
        return;
    }
    const data = (0, data_1.loadData)();
    const task = (0, data_1.findTaskByIdPrefix)(data, idPrefix);
    if (!task) {
        console.log(chalk_1.default.red(`❌ Task not found: ${idPrefix}`));
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
        console.log(chalk_1.default.red(`❌ Invalid transition: ${oldCol} → ${targetColumn}`));
        console.log(chalk_1.default.gray(`   Allowed transitions: ${allowed.join(', ')}`));
        return;
    }
    if (oldCol === targetColumn) {
        console.log(chalk_1.default.gray(`  Task already in ${targetColumn}.`));
        return;
    }
    task.column = targetColumn;
    task.updatedAt = new Date().toISOString();
    task.stuckSince = undefined;
    (0, data_1.logActivity)(data, targetColumn === 'done' ? 'task_done' : 'task_transitioned', `Task "${task.title}" moved: ${oldCol} → ${targetColumn} (CLI)`, task.projectId, task.agent, { from: oldCol, to: targetColumn });
    (0, data_1.saveData)(data);
    console.log(chalk_1.default.green(`✅ Moved "${task.title}"`));
    console.log(chalk_1.default.gray(`   ${oldCol} → `) + (COL_COLORS[targetColumn] || chalk_1.default.white)(targetColumn));
}
function taskStuck(opts) {
    const data = (0, data_1.loadData)();
    const thresholdMin = 30;
    const now = Date.now();
    let tasks = data.tasks.filter(t => t.column === 'in-progress');
    if (opts.project) {
        const project = (0, data_1.findProjectByNameOrId)(data, opts.project);
        if (!project) {
            console.log(chalk_1.default.red(`❌ Project not found: ${opts.project}`));
            return;
        }
        tasks = tasks.filter(t => t.projectId === project.id);
    }
    const stuck = tasks.filter(t => {
        const elapsed = now - new Date(t.updatedAt).getTime();
        return elapsed > thresholdMin * 60 * 1000;
    }).sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
    if (stuck.length === 0) {
        console.log(chalk_1.default.green(`\n  ✅ No stuck tasks! All in-progress tasks updated within ${thresholdMin}m.\n`));
        return;
    }
    console.log(chalk_1.default.yellow(`\n⚠️  ${stuck.length} Stuck Tasks (>${thresholdMin}m in progress)\n`));
    console.log(chalk_1.default.gray('  ' + padRight('ID', 10) + padRight('Title', 36) + padRight('Stuck For', 12) + padRight('Agent', 14) + 'Priority'));
    console.log(chalk_1.default.gray('  ' + '─'.repeat(86)));
    for (const task of stuck) {
        const elapsed = now - new Date(task.updatedAt).getTime();
        const minutes = Math.round(elapsed / 60000);
        const timeStr = minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
        const project = data.projects.find(p => p.id === task.projectId);
        const pc = PRIORITY_COLORS[task.priority] || chalk_1.default.white;
        console.log('  ' + chalk_1.default.gray(padRight((0, data_1.shortId)(task.id), 10)) + padRight(task.title.substring(0, 34), 36) + chalk_1.default.yellow(padRight(timeStr, 12)) + chalk_1.default.gray(padRight(task.agent || '—', 14)) + pc(task.priority));
    }
    console.log();
    console.log(chalk_1.default.gray('  Tip: Move tasks with: cody task move <id> review|done|backlog'));
    console.log();
}
function taskDone(idPrefix) {
    if (!idPrefix) {
        console.log(chalk_1.default.red('❌ Usage: cody task done <id>'));
        return;
    }
    taskMove(idPrefix, 'done');
}
function taskRemove(idPrefix) {
    if (!idPrefix) {
        console.log(chalk_1.default.red('❌ Usage: cody task rm <id>'));
        return;
    }
    const data = (0, data_1.loadData)();
    const idx = data.tasks.findIndex(t => t.id === idPrefix || t.id.startsWith(idPrefix));
    if (idx === -1) {
        console.log(chalk_1.default.red(`❌ Task not found: ${idPrefix}`));
        return;
    }
    const [removed] = data.tasks.splice(idx, 1);
    (0, data_1.logActivity)(data, 'task_deleted', `Task "${removed.title}" deleted via CLI`, removed.projectId, removed.agent);
    (0, data_1.saveData)(data);
    console.log(chalk_1.default.green(`✅ Deleted: "${removed.title}" (${(0, data_1.shortId)(removed.id)})`));
}
function taskDispatch(idPrefix, opts) {
    if (!idPrefix) {
        console.log(chalk_1.default.red('❌ Usage: cody task dispatch <id> [--force]'));
        return;
    }
    const data = (0, data_1.loadData)();
    const task = (0, data_1.findTaskByIdPrefix)(data, idPrefix);
    if (!task) {
        console.log(chalk_1.default.red(`❌ Task not found: ${idPrefix}`));
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
        console.log(chalk_1.default.green(`\n🚀 Task dispatched to ${task.agent}!`));
        console.log(chalk_1.default.gray(`   Task:    ${task.title}`));
        console.log(chalk_1.default.gray(`   Agent:   ${task.agent}`));
        if (task.skill)
            console.log(chalk_1.default.gray(`   Skill:   ${task.skill}`));
        console.log(chalk_1.default.gray(`   File:    ${result.filePath}`));
        console.log();
    }
    else {
        task.dispatchStatus = 'failed';
        task.dispatchError = result.error;
        task.updatedAt = new Date().toISOString();
        (0, data_1.saveData)(data);
        console.log(chalk_1.default.red(`❌ Dispatch failed: ${result.error}`));
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
        default:
            console.log(chalk_1.default.red(`Unknown: ${cmd}`));
            console.log(chalk_1.default.gray('Available: add, list, rm'));
    }
});
function projectAdd(name, opts) {
    if (!name) {
        console.log(chalk_1.default.red('❌ Usage: cody project add "my-project"'));
        return;
    }
    const data = (0, data_1.loadData)();
    const project = { id: crypto_1.default.randomUUID(), name: name.trim(), path: opts.path || process.cwd(), agents: [], createdAt: new Date().toISOString() };
    data.projects.push(project);
    (0, data_1.logActivity)(data, 'project_created', `Project "${project.name}" created via CLI`, project.id);
    (0, data_1.saveData)(data);
    console.log(chalk_1.default.green(`✅ Project created: ${name}`));
    console.log(chalk_1.default.gray(`   ID: ${(0, data_1.shortId)(project.id)} | Path: ${project.path}`));
}
function projectList() {
    const data = (0, data_1.loadData)();
    if (data.projects.length === 0) {
        console.log(chalk_1.default.gray('\n  No projects.\n'));
        return;
    }
    console.log(chalk_1.default.cyan('\n📦 Projects\n'));
    console.log(chalk_1.default.gray('  ' + padRight('ID', 10) + padRight('Name', 24) + padRight('Tasks', 8) + padRight('Agents', 20) + 'Path'));
    console.log(chalk_1.default.gray('  ' + '─'.repeat(90)));
    for (const project of data.projects) {
        const pt = data.tasks.filter(t => t.projectId === project.id);
        const agents = [...new Set(pt.map(t => t.agent).filter(Boolean))];
        const done = pt.filter(t => t.column === 'done').length;
        console.log('  ' + chalk_1.default.gray(padRight((0, data_1.shortId)(project.id), 10)) + chalk_1.default.white(padRight(project.name, 24)) + chalk_1.default.gray(padRight(`${done}/${pt.length}`, 8)) + chalk_1.default.gray(padRight(agents.join(', ') || '—', 20)) + chalk_1.default.gray(project.path || '—'));
    }
    console.log();
}
function projectRemove(query) {
    if (!query) {
        console.log(chalk_1.default.red('❌ Usage: cody project rm <name-or-id>'));
        return;
    }
    const data = (0, data_1.loadData)();
    const project = (0, data_1.findProjectByNameOrId)(data, query);
    if (!project) {
        console.log(chalk_1.default.red(`❌ Project not found: ${query}`));
        return;
    }
    const tc = data.tasks.filter(t => t.projectId === project.id).length;
    data.projects = data.projects.filter(p => p.id !== project.id);
    data.tasks = data.tasks.filter(t => t.projectId !== project.id);
    (0, data_1.logActivity)(data, 'project_deleted', `Project "${project.name}" deleted via CLI`, project.id);
    (0, data_1.saveData)(data);
    console.log(chalk_1.default.green(`✅ Deleted project "${project.name}" and ${tc} tasks.`));
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
        default:
            console.log(chalk_1.default.red(`Unknown: ${cmd}`));
            console.log(chalk_1.default.gray('Available: staging, production, list'));
    }
});
function deployRecord(env, opts) {
    const data = (0, data_1.loadData)();
    let projectId;
    if (opts.project) {
        const p = (0, data_1.findProjectByNameOrId)(data, opts.project);
        if (!p) {
            console.log(chalk_1.default.red(`❌ Project not found: ${opts.project}`));
            return;
        }
        projectId = p.id;
    }
    else if (data.projects.length > 0) {
        projectId = data.projects[0].id;
    }
    else {
        console.log(chalk_1.default.red('❌ No projects. Create one first: cody project add "my-project"'));
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
    const envColor = env === 'production' ? chalk_1.default.green : chalk_1.default.yellow;
    const project = data.projects.find(p => p.id === projectId);
    console.log(chalk_1.default.green(`\n🚀 Deployment recorded!`));
    console.log(chalk_1.default.gray(`   ID:      ${(0, data_1.shortId)(dep.id)}`));
    console.log(`   Env:     ${envColor(env)}`);
    console.log(chalk_1.default.gray(`   Project: ${(project === null || project === void 0 ? void 0 : project.name) || '—'}`));
    console.log(chalk_1.default.gray(`   Message: ${dep.message}`));
    if (dep.commit)
        console.log(chalk_1.default.gray(`   Commit:  ${dep.commit}`));
    console.log(chalk_1.default.gray(`   Branch:  ${dep.branch}`));
    console.log();
}
function deployList(opts) {
    const data = (0, data_1.loadData)();
    let deps = data.deployments;
    if (opts.project) {
        const p = (0, data_1.findProjectByNameOrId)(data, opts.project);
        if (!p) {
            console.log(chalk_1.default.red(`❌ Project not found: ${opts.project}`));
            return;
        }
        deps = deps.filter(d => d.projectId === p.id);
    }
    if (deps.length === 0) {
        console.log(chalk_1.default.gray('\n  No deployments yet.\n'));
        return;
    }
    console.log(chalk_1.default.cyan('\n🚀 Deployment History\n'));
    console.log(chalk_1.default.gray('  ' + padRight('ID', 10) + padRight('Env', 12) + padRight('Status', 14) + padRight('Message', 32) + padRight('Branch', 12) + 'Time'));
    console.log(chalk_1.default.gray('  ' + '─'.repeat(100)));
    for (const dep of deps.slice(0, 20)) {
        const sc = STATUS_COLORS[dep.status] || chalk_1.default.white;
        const ec = dep.env === 'production' ? chalk_1.default.green : chalk_1.default.yellow;
        const timeAgo = formatTimeAgoCli(dep.startedAt);
        const rollbackFlag = dep.rollbackOf ? ' ⏪' : '';
        console.log('  ' + chalk_1.default.gray(padRight((0, data_1.shortId)(dep.id), 10)) + ec(padRight(dep.env, 12)) + sc(padRight(dep.status.replace('_', ' ') + rollbackFlag, 14)) + padRight(dep.message.substring(0, 30), 32) + chalk_1.default.gray(padRight(dep.branch || '—', 12)) + chalk_1.default.gray(timeAgo));
    }
    console.log(chalk_1.default.gray(`\n  Total: ${deps.length} deployments\n`));
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
        console.log(chalk_1.default.red(`❌ Deployment not found: ${deployId}`));
        return;
    }
    if (dep.status === 'rolled_back') {
        console.log(chalk_1.default.yellow('⚠️  Already rolled back.'));
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
    console.log(chalk_1.default.magenta(`\n⏪ Rollback complete!`));
    console.log(chalk_1.default.gray(`   Original deploy: ${(0, data_1.shortId)(dep.id)} (${dep.env})`));
    console.log(chalk_1.default.gray(`   Rollback ID:     ${(0, data_1.shortId)(rollback.id)}`));
    console.log(chalk_1.default.gray(`   Status:          ${dep.message} → rolled back\n`));
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
            console.log(chalk_1.default.red(`❌ Project not found: ${opts.project}`));
            return;
        }
        acts = acts.filter(a => a.projectId === p.id);
    }
    const limit = parseInt(opts.limit) || 20;
    acts = acts.slice(0, limit);
    if (acts.length === 0) {
        console.log(chalk_1.default.gray('\n  No activity yet.\n'));
        return;
    }
    const ICONS = {
        'task_created': '✨', 'task_moved': '↔️', 'task_done': '✅', 'task_deleted': '🗑️', 'task_updated': '✏️',
        'project_created': '📦', 'project_deleted': '🗑️',
        'deploy_staging': '🟡', 'deploy_production': '🚀', 'deploy_failed': '❌', 'rollback': '⏪',
        'git_push': '📤', 'changelog_added': '📝',
    };
    console.log(chalk_1.default.cyan(`\n📜 Activity History (latest ${acts.length})\n`));
    for (const a of acts) {
        const icon = ICONS[a.type] || '📌';
        const proj = data.projects.find(p => p.id === a.projectId);
        const projTag = proj ? chalk_1.default.gray(` [${proj.name}]`) : '';
        const agentTag = a.agent ? chalk_1.default.gray(` @${a.agent}`) : '';
        const time = formatTimeAgoCli(a.createdAt);
        console.log(`  ${icon} ${a.message}${projTag}${agentTag} ${chalk_1.default.gray(`← ${time}`)}`);
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
        default:
            console.log(chalk_1.default.red(`Unknown: ${cmd}`));
            console.log(chalk_1.default.gray('Available: add, list'));
    }
});
function changelogAdd(args, opts) {
    if (args.length < 2) {
        console.log(chalk_1.default.red('❌ Usage: cody changelog add <version> "<title>" [changes...]'));
        return;
    }
    const data = (0, data_1.loadData)();
    let projectId = '';
    if (opts.project) {
        const p = (0, data_1.findProjectByNameOrId)(data, opts.project);
        if (!p) {
            console.log(chalk_1.default.red(`❌ Project not found: ${opts.project}`));
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
    console.log(chalk_1.default.green(`\n📝 Changelog entry added!`));
    console.log(chalk_1.default.gray(`   Version: ${version}`));
    console.log(chalk_1.default.gray(`   Title:   ${title}`));
    if (changes.length > 0) {
        changes.forEach(c => console.log(chalk_1.default.gray(`   • ${c}`)));
    }
    console.log();
}
function changelogList(opts) {
    const data = (0, data_1.loadData)();
    let entries = data.changelog;
    if (opts.project) {
        const p = (0, data_1.findProjectByNameOrId)(data, opts.project);
        if (!p) {
            console.log(chalk_1.default.red(`❌ Project not found: ${opts.project}`));
            return;
        }
        entries = entries.filter(c => c.projectId === p.id);
    }
    if (entries.length === 0) {
        console.log(chalk_1.default.gray('\n  No changelog entries.\n'));
        return;
    }
    console.log(chalk_1.default.cyan('\n📝 Changelog\n'));
    for (const entry of entries) {
        const proj = data.projects.find(p => p.id === entry.projectId);
        console.log(chalk_1.default.blue(`  ${entry.version}`) + chalk_1.default.white(` — ${entry.title}`) + chalk_1.default.gray(` (${formatTimeAgoCli(entry.createdAt)})${proj ? ' [' + proj.name + ']' : ''}`));
        if (entry.changes.length > 0) {
            entry.changes.forEach(c => console.log(chalk_1.default.gray(`    • ${c}`)));
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
    console.log(chalk_1.default.white('📊 Status Overview\n'));
    // Projects
    console.log(chalk_1.default.cyan(`  Projects: ${data.projects.length}`));
    for (const p of data.projects) {
        const pt = data.tasks.filter(t => t.projectId === p.id);
        const done = pt.filter(t => t.column === 'done').length;
        const pct = pt.length > 0 ? Math.round((done / pt.length) * 100) : 0;
        console.log(chalk_1.default.gray(`    📦 ${padRight(p.name, 20)} ${progressBar(pct)} ${done}/${pt.length} (${pct}%)`));
    }
    // Tasks
    const total = data.tasks.length;
    const byCol = { backlog: 0, 'in-progress': 0, review: 0, done: 0 };
    data.tasks.forEach(t => { byCol[t.column] = (byCol[t.column] || 0) + 1; });
    console.log();
    console.log(chalk_1.default.white(`  Tasks: ${total}`));
    console.log(chalk_1.default.gray(`    ⚪ Backlog:     ${byCol.backlog}`));
    console.log(chalk_1.default.blue(`    🔵 In Progress: ${byCol['in-progress']}`));
    console.log(chalk_1.default.yellow(`    🟡 Review:      ${byCol.review}`));
    console.log(chalk_1.default.green(`    🟢 Done:        ${byCol.done}`));
    // Deploys
    if (data.deployments.length > 0) {
        console.log();
        console.log(chalk_1.default.white(`  Deployments: ${data.deployments.length}`));
        const latest = data.deployments[0];
        const sc = STATUS_COLORS[latest.status] || chalk_1.default.white;
        console.log(chalk_1.default.gray(`    Latest: ${latest.env} — ${sc(latest.status)} — ${latest.message} (${formatTimeAgoCli(latest.startedAt)})`));
    }
    // Agents
    const agentCounts = {};
    data.tasks.forEach(t => { if (t.agent)
        agentCounts[t.agent] = (agentCounts[t.agent] || 0) + 1; });
    const agentNames = Object.keys(agentCounts);
    if (agentNames.length > 0) {
        console.log();
        console.log(chalk_1.default.white(`  Active Agents: ${agentNames.length}`));
        for (const agent of agentNames.sort()) {
            console.log(chalk_1.default.gray(`    🤖 ${padRight(agent, 16)} ${agentCounts[agent]} tasks`));
        }
    }
    // Dashboard
    console.log();
    if (isDashboardRunning()) {
        console.log(chalk_1.default.green(`  🚀 Dashboard: RUNNING at http://codymaster.localhost:${data_1.DEFAULT_PORT}`));
    }
    else {
        console.log(chalk_1.default.gray(`  ⚫ Dashboard: not running (start with: cody dashboard)`));
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
    console.log(chalk_1.default.blue(`Installing skill: ${skill}...`));
    if (!opts.platform) {
        const prompts = (yield Promise.resolve().then(() => __importStar(require('prompts')))).default;
        const response = yield prompts({
            type: 'select', name: 'platform', message: 'Which platform?',
            choices: [
                { title: 'Google Antigravity', value: 'gemini' },
                { title: 'Claude Code', value: 'claude' },
                { title: 'Cursor', value: 'cursor' },
                { title: 'Windsurf', value: 'windsurf' },
                { title: 'Cline / RooCode', value: 'cline' },
            ]
        });
        opts.platform = response.platform;
    }
    console.log(chalk_1.default.green(`\n✅ Skill '${skill}' installed for ${opts.platform}!`));
}));
// ─── Add Command (npx codymaster add --skill cm-debugging) ───────────────────
const ALL_SKILLS = [
    // Engineering
    'cm-tdd', 'cm-debugging', 'cm-quality-gate', 'cm-test-gate', 'cm-code-review',
    // Operations
    'cm-safe-deploy', 'cm-identity-guard', 'cm-git-worktrees', 'cm-terminal', 'cm-secret-shield', 'cm-safe-i18n',
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
            console.log(chalk_1.default.magenta('🟣 Claude Code — Installing via plugin system'));
            console.log(chalk_1.default.gray('   (Claude installs all 33 skills as one bundle)\n'));
            // Step 1: Register marketplace — "already installed" is OK, just continue
            console.log(chalk_1.default.gray('   $ claude plugin marketplace add tody-agent/codymaster'));
            try {
                // Use 'pipe' so we can inspect output on failure; print stdout ourselves
                const r1 = require('child_process').spawnSync('claude', ['plugin', 'marketplace', 'add', 'tody-agent/codymaster'], { encoding: 'utf8' });
                if (r1.stdout)
                    process.stdout.write(r1.stdout);
                if (r1.stderr)
                    process.stderr.write(r1.stderr);
                const combined = String(r1.stdout || '') + String(r1.stderr || '');
                if (r1.status !== 0 && !combined.includes('already installed') && !combined.includes('already exists')) {
                    console.log(chalk_1.default.yellow('   ⚠️  Marketplace warning — continuing anyway'));
                }
                else if (combined.includes('already installed') || combined.includes('already exists')) {
                    console.log(chalk_1.default.gray('   ℹ️  Marketplace already registered'));
                }
            }
            catch (_a) {
                console.log(chalk_1.default.yellow('   ⚠️  Could not reach marketplace — continuing'));
            }
            // Step 2: Install / update the plugin
            console.log(chalk_1.default.gray('   $ claude plugin install cody-master@cody-master'));
            try {
                execFileSync('claude', ['plugin', 'install', 'cody-master@cody-master'], { stdio: 'inherit' });
                console.log('\n' + chalk_1.default.green('✅ All 33 skills installed!'));
                yield postInstallOnboarding('claude');
            }
            catch (_b) {
                console.log(chalk_1.default.yellow('\n⚠️  Plugin install failed. Run manually:\n'));
                console.log(chalk_1.default.cyan('  claude plugin install cody-master@cody-master'));
                console.log(chalk_1.default.gray('\n  Or one-liner:'));
                console.log(chalk_1.default.cyan('  bash <(curl -fsSL https://raw.githubusercontent.com/tody-agent/codymaster/main/install.sh) --claude'));
            }
            return;
        }
        if (platform === 'gemini') {
            console.log(chalk_1.default.cyan('💻 Gemini CLI — Installing via extensions'));
            try {
                execFileSync('gemini', ['extensions', 'install', 'https://github.com/tody-agent/codymaster'], { stdio: 'inherit' });
                console.log('\n' + chalk_1.default.green('✅ All 33 skills installed for Gemini CLI!'));
                yield postInstallOnboarding('gemini');
            }
            catch (_c) {
                console.log(chalk_1.default.yellow('💡 Run this in your terminal:\n'));
                console.log(chalk_1.default.cyan('   gemini extensions install https://github.com/tody-agent/codymaster\n'));
            }
            return;
        }
        const target = PLATFORM_TARGETS[platform];
        if (!target) {
            console.log(chalk_1.default.red(`❌ Unknown platform: ${platform}`));
            console.log(chalk_1.default.gray(`   Supported: claude, gemini, cursor, windsurf, cline, opencode, kiro, copilot`));
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
            console.log(chalk_1.default.green(`✅ ${skills.length} skills referenced in ${instrFile}`));
            console.log(chalk_1.default.gray('   GitHub Copilot will use these as context automatically.'));
            return;
        }
        const icons = { cursor: '🔵', windsurf: '🟠', cline: '⚫', opencode: '📦', kiro: '🔶' };
        const icon = icons[platform] || '📦';
        const label = skills.length === ALL_SKILLS.length ? 'all 33 skills' : skills.join(', ');
        console.log(`${icon} ${platform} — Installing ${label}`);
        console.log(chalk_1.default.gray(`   Target: ./${target.dir}/\n`));
        let ok = 0, fail = 0;
        for (const skill of skills) {
            const url = `${RAW_BASE}/skills/${skill}/SKILL.md`;
            const dest = path_1.default.join(target.dir, skill, 'SKILL.md');
            const success = yield downloadFile(url, dest);
            if (success) {
                process.stdout.write(chalk_1.default.green(`  ✅ ${skill}\n`));
                ok++;
            }
            else {
                process.stdout.write(chalk_1.default.red(`  ❌ ${skill}\n`));
                fail++;
            }
        }
        console.log();
        if (ok > 0) {
            console.log(chalk_1.default.green(`✅ ${ok} skill${ok > 1 ? 's' : ''} installed → ./${target.dir}/`));
            const invoke = target.invoke.replace('<skill>', skills[0]);
            console.log(chalk_1.default.cyan(`📖 Usage: ${invoke}  Your prompt here`));
            if (target.note)
                console.log(chalk_1.default.gray(`   Note: ${target.note}`));
            yield postInstallOnboarding(platform);
        }
        if (fail > 0) {
            console.log(chalk_1.default.yellow(`⚠️  ${fail} failed — check connection or clone manually:`));
            console.log(chalk_1.default.gray(`   git clone https://github.com/tody-agent/codymaster.git`));
        }
    });
}
program
    .command('add')
    .description('Add skills to your AI agent  (npx codymaster add --skill cm-debugging)')
    .option('--skill <name>', 'Specific skill to add (e.g. cm-debugging)')
    .option('--all', 'Add all 33 skills')
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
            console.log(chalk_1.default.red(`❌ Unknown skill: ${opts.skill}`));
            console.log(chalk_1.default.gray('   Run: npx codymaster add --list'));
            return;
        }
        skills = [opts.skill];
    }
    // Detect or prompt platform
    let platform = opts.platform || autoDetectPlatform();
    if (platform === 'manual') {
        const prompts = (yield Promise.resolve().then(() => __importStar(require('prompts')))).default;
        const resp = yield prompts({
            type: 'select', name: 'platform', message: 'Select your AI coding platform:',
            choices: [
                { title: '🟣 Claude Code  (recommended)', value: 'claude' },
                { title: '💻 Gemini CLI', value: 'gemini' },
                { title: '🔵 Cursor', value: 'cursor' },
                { title: '🟠 Windsurf', value: 'windsurf' },
                { title: '⚫ Cline / RooCode', value: 'cline' },
                { title: '📦 OpenCode', value: 'opencode' },
                { title: '🔶 Kiro (AWS)', value: 'kiro' },
                { title: '🐙 GitHub Copilot', value: 'copilot' },
            ],
        });
        if (!resp.platform)
            return;
        platform = resp.platform;
    }
    // If no skills chosen yet, prompt
    if (!skills) {
        if (platform === 'claude' || platform === 'gemini') {
            skills = ALL_SKILLS;
        }
        else {
            const prompts = (yield Promise.resolve().then(() => __importStar(require('prompts')))).default;
            const resp = yield prompts({
                type: 'select', name: 'mode', message: 'What to install?',
                choices: [
                    { title: 'All 33 skills (full kit)', value: 'all' },
                    { title: 'Search & pick one skill', value: 'pick' },
                ],
            });
            if (resp.mode === 'all') {
                skills = ALL_SKILLS;
            }
            else {
                const pick = yield prompts({
                    type: 'autocomplete', name: 'skill', message: 'Type to search skill:',
                    choices: ALL_SKILLS.map(s => ({ title: s, value: s })),
                });
                if (!pick.skill)
                    return;
                skills = [pick.skill];
            }
        }
    }
    yield doAddSkills(skills, platform);
}));
// ─── List Command (quick alias for `cody skill list`) ─────────────────────────
program
    .command('list')
    .alias('ls')
    .description('List all 33 available skills')
    .option('-d, --domain <domain>', 'Filter by domain')
    .action((opts) => {
    skillList(opts.domain);
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
        console.log(chalk_1.default.yellow('⚠️  .cm/ directory already exists.'));
        console.log(chalk_1.default.gray(`   Path: ${projectPath}/.cm/`));
        return;
    }
    (0, continuity_1.ensureCmDir)(projectPath);
    console.log(chalk_1.default.green('✅ Working memory initialized!'));
    console.log(chalk_1.default.gray(`   Created: ${projectPath}/.cm/`));
    console.log(chalk_1.default.gray('   ├── CONTINUITY.md     (working memory)'));
    console.log(chalk_1.default.gray('   ├── config.yaml       (RARV settings)'));
    console.log(chalk_1.default.gray('   └── memory/'));
    console.log(chalk_1.default.gray('       ├── learnings.json (error patterns)'));
    console.log(chalk_1.default.gray('       └── decisions.json (architecture decisions)'));
    console.log();
    console.log(chalk_1.default.cyan('💡 Protocol: Read CONTINUITY.md at session start, update at session end.'));
}
function continuityStatus(projectPath) {
    const status = (0, continuity_1.getContinuityStatus)(projectPath);
    if (!status.initialized) {
        console.log(chalk_1.default.yellow('⚫ Working memory not initialized.'));
        console.log(chalk_1.default.gray('   Run: cody continuity init'));
        return;
    }
    console.log(chalk_1.default.cyan('\n🧠 Working Memory Status\n'));
    console.log(`  ${chalk_1.default.white('Project:')}     ${status.project}`);
    console.log(`  ${chalk_1.default.white('Phase:')}       ${phaseColor(status.phase)(status.phase)}`);
    console.log(`  ${chalk_1.default.white('Iteration:')}   ${status.iteration}`);
    if (status.activeGoal) {
        console.log(`  ${chalk_1.default.white('Goal:')}        ${status.activeGoal}`);
    }
    if (status.currentTask) {
        console.log(`  ${chalk_1.default.white('Task:')}        ${status.currentTask}`);
    }
    console.log();
    console.log(chalk_1.default.gray(`  ✅ Completed: ${status.completedCount}  |  🚧 Blockers: ${status.blockerCount}`));
    console.log(chalk_1.default.gray(`  📚 Learnings: ${status.learningCount}  |  📋 Decisions: ${status.decisionCount}`));
    if (status.lastUpdated) {
        console.log(chalk_1.default.gray(`  🕐 Updated:   ${formatTimeAgoCli(status.lastUpdated)}`));
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
        console.log(chalk_1.default.yellow('⚠️  No .cm/ directory found.'));
        return;
    }
    (0, continuity_1.resetContinuity)(projectPath);
    console.log(chalk_1.default.green('✅ Working memory reset.'));
    console.log(chalk_1.default.gray('   CONTINUITY.md cleared. Learnings preserved.'));
}
function continuityLearnings(projectPath) {
    if (!(0, continuity_1.hasCmDir)(projectPath)) {
        console.log(chalk_1.default.yellow('⚠️  No .cm/ directory found. Run: cody continuity init'));
        return;
    }
    const learnings = (0, continuity_1.getLearnings)(projectPath);
    if (learnings.length === 0) {
        console.log(chalk_1.default.gray('\n  No learnings captured yet. 🎉\n'));
        return;
    }
    console.log(chalk_1.default.cyan(`\n📚 Mistakes & Learnings (${learnings.length})\n`));
    for (const l of learnings.slice(-10)) {
        console.log(chalk_1.default.red(`  ❌ ${l.whatFailed}`));
        console.log(chalk_1.default.gray(`     Why: ${l.whyFailed}`));
        console.log(chalk_1.default.green(`     Fix: ${l.howToPrevent}`));
        console.log(chalk_1.default.gray(`     ${formatTimeAgoCli(l.timestamp)} | ${l.agent || 'unknown'}\n`));
    }
}
function continuityDecisions(projectPath) {
    if (!(0, continuity_1.hasCmDir)(projectPath)) {
        console.log(chalk_1.default.yellow('⚠️  No .cm/ directory found. Run: cody continuity init'));
        return;
    }
    const decisions = (0, continuity_1.getDecisions)(projectPath);
    if (decisions.length === 0) {
        console.log(chalk_1.default.gray('\n  No decisions recorded yet.\n'));
        return;
    }
    console.log(chalk_1.default.cyan(`\n📋 Key Decisions (${decisions.length})\n`));
    for (const d of decisions.slice(-10)) {
        console.log(chalk_1.default.white(`  📌 ${d.decision}`));
        console.log(chalk_1.default.gray(`     Rationale: ${d.rationale}`));
        console.log(chalk_1.default.gray(`     ${formatTimeAgoCli(d.timestamp)} | ${d.agent || 'unknown'}\n`));
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
            { name: 'cm-how-it-work', desc: 'Interactive explainer for all 33 skills' },
            { name: 'cm-example', desc: 'Minimal template for new skills' },
        ],
    },
};
program
    .command('skill [cmd] [name]')
    .alias('sk')
    .description('Skill management (list|info|domains)')
    .action((cmd, name) => {
    switch (cmd) {
        case 'list':
        case 'ls':
        case undefined:
            skillList();
            break;
        case 'info':
            if (!name) {
                console.log(chalk_1.default.red('❌ Usage: cody skill info <skill-name>'));
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
        console.log(chalk_1.default.red(`❌ Domain not found: ${filterDomain}`));
        console.log(chalk_1.default.gray('   Domains: engineering, operations, product, growth, orchestration, workflow'));
        return;
    }
    console.log(chalk_1.default.cyan('\n🧩 Cody Master — 33 Skills\n'));
    let total = 0;
    for (const [domain, data] of entries) {
        console.log(chalk_1.default.white(`  ${data.icon} ${domain.charAt(0).toUpperCase() + domain.slice(1)}`));
        for (const skill of data.skills) {
            console.log(`    ${chalk_1.default.cyan(padRight(skill.name, 26))} ${chalk_1.default.gray(skill.desc)}`);
            total++;
        }
        console.log();
    }
    console.log(chalk_1.default.gray(`  ${total} skills across ${entries.length} domains`));
    console.log(chalk_1.default.gray(`  Install: npx codymaster add --all`));
    console.log(chalk_1.default.gray(`  Add one: npx codymaster add --skill <name>\n`));
}
function skillInfo(name) {
    for (const [domain, data] of Object.entries(SKILL_CATALOG)) {
        const skill = data.skills.find(s => s.name === name);
        if (skill) {
            console.log(chalk_1.default.cyan(`\n🧩 Skill: ${skill.name}\n`));
            console.log(`  ${chalk_1.default.white('Domain:')}      ${domain}`);
            console.log(`  ${chalk_1.default.white('Description:')} ${skill.desc}`);
            const agents = (0, judge_1.suggestAgentsForSkill)(skill.name);
            console.log(`  ${chalk_1.default.white('Best Agents:')} ${agents.join(', ')}`);
            console.log(`  ${chalk_1.default.white('Invoke:')}      @[/${skill.name}]  (Antigravity/Gemini)`);
            console.log(`               /${skill.name}  (Claude Code)`);
            console.log(`               @${skill.name}  (Cursor/Windsurf/Cline)`);
            console.log();
            return;
        }
    }
    console.log(chalk_1.default.red(`❌ Skill not found: ${name}`));
    console.log(chalk_1.default.gray('   Use "cody skill list" to see all available skills.'));
}
function skillDomains() {
    console.log(chalk_1.default.cyan('\n🎯 Skill Domains\n'));
    let total = 0;
    for (const [domain, data] of Object.entries(SKILL_CATALOG)) {
        console.log(`  ${data.icon} ${chalk_1.default.white(padRight(domain.charAt(0).toUpperCase() + domain.slice(1), 16))} ${chalk_1.default.gray(`${data.skills.length} skills`)}`);
        total += data.skills.length;
    }
    console.log(chalk_1.default.gray(`\n  Total: ${total} skills across ${Object.keys(SKILL_CATALOG).length} domains`));
    console.log();
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
            console.log(chalk_1.default.red(`❌ Task not found: ${taskId}`));
            return;
        }
        const project = data.projects.find(p => p.id === task.projectId);
        let learnings = [];
        if ((project === null || project === void 0 ? void 0 : project.path) && (0, continuity_1.hasCmDir)(project.path)) {
            learnings = (0, continuity_1.getLearnings)(project.path);
        }
        const decision = (0, judge_1.evaluateTaskState)(task, data.tasks, learnings);
        console.log(chalk_1.default.cyan(`\n🤖 Judge Decision\n`));
        console.log(`  ${chalk_1.default.white('Task:')}       ${task.title}`);
        console.log(`  ${chalk_1.default.white('Column:')}     ${task.column}`);
        console.log(`  ${chalk_1.default.white('Action:')}     ${decision.badge} ${decision.action}`);
        console.log(`  ${chalk_1.default.white('Reason:')}     ${decision.reason}`);
        console.log(`  ${chalk_1.default.white('Confidence:')} ${Math.round(decision.confidence * 100)}%`);
        if (decision.suggestedNextSkill) {
            console.log(`  ${chalk_1.default.white('Suggested:')}  ${decision.suggestedNextSkill}`);
        }
        console.log();
    }
    else {
        // All active tasks
        let tasks = data.tasks;
        if (opts.project) {
            const project = (0, data_1.findProjectByNameOrId)(data, opts.project);
            if (!project) {
                console.log(chalk_1.default.red(`❌ Project not found: ${opts.project}`));
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
            console.log(chalk_1.default.gray('\n  No active tasks to evaluate.\n'));
            return;
        }
        console.log(chalk_1.default.cyan(`\n🤖 Judge Decisions (${decisions.size} active tasks)\n`));
        console.log(chalk_1.default.gray('  ' + padRight('Badge', 8) + padRight('Action', 12) + padRight('Confidence', 12) + 'Task'));
        console.log(chalk_1.default.gray('  ' + '─'.repeat(70)));
        for (const [tid, dec] of decisions) {
            const task = tasks.find(t => t.id === tid);
            const actionColor = dec.action === 'CONTINUE' ? chalk_1.default.green
                : dec.action === 'COMPLETE' ? chalk_1.default.blue
                    : dec.action === 'ESCALATE' ? chalk_1.default.yellow
                        : chalk_1.default.magenta;
            console.log('  ' + padRight(dec.badge, 8) + actionColor(padRight(dec.action, 12)) + chalk_1.default.gray(padRight(`${Math.round(dec.confidence * 100)}%`, 12)) + ((task === null || task === void 0 ? void 0 : task.title) || tid.substring(0, 8)));
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
        console.log(chalk_1.default.yellow(`⚠️  Project already exists: ${existing.name}`));
        console.log(chalk_1.default.gray(`   ID: ${(0, data_1.shortId)(existing.id)} | Path: ${existing.path}`));
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
    console.log(chalk_1.default.green(`\n✅ Project initialized: ${projectName}`));
    console.log(chalk_1.default.gray(`   ID:   ${(0, data_1.shortId)(project.id)}`));
    console.log(chalk_1.default.gray(`   Path: ${projectPath}`));
    console.log(chalk_1.default.gray(`   .cm/  Working memory created`));
    console.log();
    if (!isDashboardRunning()) {
        (0, dashboard_1.launchDashboard)(data_1.DEFAULT_PORT);
        console.log(chalk_1.default.green(`   🚀 Dashboard auto-started! You can track progress at http://codymaster.localhost:${data_1.DEFAULT_PORT}`));
    }
    console.log(chalk_1.default.cyan('💡 Next steps:'));
    console.log(chalk_1.default.gray('   cody task add "My first task"'));
    console.log(chalk_1.default.gray('   cody open'));
    console.log();
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
        console.log(chalk_1.default.yellow('⚠️  Dashboard not running. Starting it first...'));
        (0, dashboard_1.launchDashboard)(port);
        setTimeout(() => openUrl(`http://codymaster.localhost:${port}`), 1500);
    }
    else {
        console.log(chalk_1.default.blue(`🌐 Opening http://codymaster.localhost:${port} ...`));
        openUrl(`http://codymaster.localhost:${port}`);
    }
});
// ─── Config Command ─────────────────────────────────────────────────────────
program
    .command('config')
    .alias('cfg')
    .description('Show configuration & data paths')
    .action(() => {
    console.log(chalk_1.default.cyan(`\n⚙️  Cody Configuration\n`));
    console.log(`  ${chalk_1.default.white('Version:')}    ${VERSION}`);
    console.log(`  ${chalk_1.default.white('Data Dir:')}   ${data_1.DATA_DIR}`);
    console.log(`  ${chalk_1.default.white('Data File:')}  ${data_1.DATA_FILE}`);
    console.log(`  ${chalk_1.default.white('PID File:')}   ${data_1.PID_FILE}`);
    console.log(`  ${chalk_1.default.white('Port:')}       ${data_1.DEFAULT_PORT}`);
    console.log(`  ${chalk_1.default.white('CLI Names:')}  cody | cm | codymaster`);
    console.log();
    // Show data stats
    const data = (0, data_1.loadData)();
    console.log(chalk_1.default.white('  Data Stats:'));
    console.log(chalk_1.default.gray(`    Projects:    ${data.projects.length}`));
    console.log(chalk_1.default.gray(`    Tasks:       ${data.tasks.length}`));
    console.log(chalk_1.default.gray(`    Deploys:     ${data.deployments.length}`));
    console.log(chalk_1.default.gray(`    Activities:  ${data.activities.length}`));
    console.log(chalk_1.default.gray(`    Changelog:   ${data.changelog.length}`));
    console.log();
    // Dashboard status
    if (isDashboardRunning()) {
        console.log(chalk_1.default.green(`  🚀 Dashboard: RUNNING at http://codymaster.localhost:${data_1.DEFAULT_PORT}`));
    }
    else {
        console.log(chalk_1.default.gray(`  ⚫ Dashboard: not running`));
    }
    console.log();
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
        console.log(chalk_1.default.cyan(`\n🤖 Agent Suggestions for ${chalk_1.default.white(skill)}\n`));
        console.log(chalk_1.default.gray(`   Domain: ${domain}\n`));
        agents.forEach((agentId, index) => {
            const agent = AGENT_LIST.find(a => a.id === agentId);
            const affinity = index === 0 ? chalk_1.default.green('★ BEST') : index === 1 ? chalk_1.default.yellow('● GOOD') : chalk_1.default.gray('○ OK');
            console.log(`  ${(agent === null || agent === void 0 ? void 0 : agent.icon) || '🤖'} ${padRight((agent === null || agent === void 0 ? void 0 : agent.name) || agentId, 24)} ${affinity}`);
        });
        console.log();
    }
    else {
        // List all agents
        console.log(chalk_1.default.cyan('\n🤖 Available Agents\n'));
        for (const agent of AGENT_LIST) {
            console.log(`  ${agent.icon} ${chalk_1.default.white(padRight(agent.name, 24))} ${chalk_1.default.gray(agent.id)}`);
        }
        console.log();
        console.log(chalk_1.default.gray('  💡 Tip: cody agents <skill-name> to see best agents for a skill'));
        console.log();
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
        console.log(chalk_1.default.red(`❌ File not found: ${filePath}`));
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
        console.log(chalk_1.default.red(`❌ Invalid JSON file: ${err.message}`));
        console.log(chalk_1.default.gray('   Expected format: [{"title": "...", "priority": "...", "column": "..."}]'));
        return;
    }
    const data = (0, data_1.loadData)();
    let projectId;
    if (opts.project) {
        const p = (0, data_1.findProjectByNameOrId)(data, opts.project);
        if (!p) {
            console.log(chalk_1.default.red(`❌ Project not found: ${opts.project}`));
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
    console.log(chalk_1.default.green(`\n✅ Synced ${count} tasks!`));
    console.log(chalk_1.default.gray(`   Project: ${(project === null || project === void 0 ? void 0 : project.name) || 'Default'}`));
    console.log(chalk_1.default.gray(`   Source:  ${filePath}`));
    if (opts.agent)
        console.log(chalk_1.default.gray(`   Agent:   ${opts.agent}`));
    console.log();
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
            console.log(chalk_1.default.red(`Unknown: ${cmd}`));
            console.log(chalk_1.default.gray('Available: list, info, start, status, advance, skip, abort, auto, history'));
    }
});
function chainList() {
    const chains = (0, skill_chain_1.listChains)();
    console.log(chalk_1.default.cyan('\n🔗 Available Skill Chains\n'));
    for (const chain of chains) {
        console.log(`  ${chain.icon} ${chalk_1.default.white(padRight(chain.name, 24))} ${chalk_1.default.gray(chain.description)}`);
        console.log(chalk_1.default.gray(`     ID: ${chain.id} | Steps: ${chain.steps.length} | Triggers: ${chain.triggers.slice(0, 4).join(', ')}...`));
        console.log();
    }
    console.log(chalk_1.default.gray(`  Total: ${chains.length} chains\n`));
    console.log(chalk_1.default.cyan('💡 Quick start:'));
    console.log(chalk_1.default.gray('   cody chain auto "Build user authentication"    # Auto-detect chain'));
    console.log(chalk_1.default.gray('   cody chain start feature-development "My task"  # Start specific chain'));
    console.log();
}
function chainInfo(chainId) {
    if (!chainId) {
        console.log(chalk_1.default.red('❌ Usage: cody chain info <chain-id>'));
        return;
    }
    const chain = (0, skill_chain_1.findChain)(chainId);
    if (!chain) {
        console.log(chalk_1.default.red(`❌ Chain not found: ${chainId}`));
        console.log(chalk_1.default.gray('   Use "cody chain list" to see available chains.'));
        return;
    }
    console.log(chalk_1.default.cyan(`\n${chain.icon} Chain: ${chain.name}\n`));
    console.log(`  ${chalk_1.default.white('ID:')}          ${chain.id}`);
    console.log(`  ${chalk_1.default.white('Description:')} ${chain.description}`);
    console.log(`  ${chalk_1.default.white('Steps:')}       ${chain.steps.length}`);
    console.log(`  ${chalk_1.default.white('Triggers:')}    ${chain.triggers.join(', ')}`);
    console.log();
    console.log(chalk_1.default.white('  Pipeline:'));
    for (let i = 0; i < chain.steps.length; i++) {
        const step = chain.steps[i];
        const condBadge = step.condition === 'always' ? chalk_1.default.green('ALWAYS') : step.condition === 'if-complex' ? chalk_1.default.yellow('IF-COMPLEX') : chalk_1.default.blue('IF-READY');
        const optBadge = step.optional ? chalk_1.default.gray(' (optional)') : '';
        const connector = i < chain.steps.length - 1 ? '  │' : '   ';
        console.log(`  ${chalk_1.default.cyan(`${i + 1}.`)} ${padRight(step.skill, 24)} ${condBadge}${optBadge}`);
        console.log(chalk_1.default.gray(`  ${connector}  ${step.description}`));
        if (i < chain.steps.length - 1)
            console.log(chalk_1.default.gray('  │'));
    }
    console.log();
}
function chainStart(chainId, taskTitle, opts) {
    var _a, _b, _c;
    if (!chainId) {
        console.log(chalk_1.default.red('❌ Usage: cody chain start <chain-id> "Task title"'));
        return;
    }
    if (!taskTitle) {
        console.log(chalk_1.default.red('❌ Task title required. Usage: cody chain start <chain-id> "My task"'));
        return;
    }
    const chain = (0, skill_chain_1.findChain)(chainId);
    if (!chain) {
        console.log(chalk_1.default.red(`❌ Chain not found: ${chainId}`));
        return;
    }
    const data = (0, data_1.loadData)();
    let projectId;
    if (opts.project) {
        const project = (0, data_1.findProjectByNameOrId)(data, opts.project);
        if (!project) {
            console.log(chalk_1.default.red(`❌ Project not found: ${opts.project}`));
            return;
        }
        projectId = project.id;
    }
    else if (data.projects.length > 0) {
        projectId = data.projects[0].id;
    }
    else {
        console.log(chalk_1.default.red('❌ No projects. Create one first: cody init'));
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
    console.log(chalk_1.default.green(`\n🔗 Chain started!`));
    console.log(chalk_1.default.gray(`   Chain:     ${chain.icon} ${chain.name}`));
    console.log(chalk_1.default.gray(`   Task:      ${taskTitle}`));
    console.log(chalk_1.default.gray(`   Project:   ${(project === null || project === void 0 ? void 0 : project.name) || '—'}`));
    console.log(chalk_1.default.gray(`   Agent:     ${agent}`));
    console.log(chalk_1.default.gray(`   Steps:     ${chain.steps.length}`));
    console.log(chalk_1.default.gray(`   Exec ID:   ${(0, data_1.shortId)(execution.id)}`));
    console.log();
    console.log(chalk_1.default.cyan(`  ▶ Current step: ${(_b = execution.steps[0]) === null || _b === void 0 ? void 0 : _b.skill} — ${(_c = execution.steps[0]) === null || _c === void 0 ? void 0 : _c.description}`));
    console.log();
    console.log(chalk_1.default.gray(`  Next: cody chain advance ${(0, data_1.shortId)(execution.id)} "output summary"`));
    console.log();
}
function chainStatus(execIdPrefix) {
    const data = (0, data_1.loadData)();
    if (execIdPrefix) {
        // Show specific execution
        const exec = data.chainExecutions.find(e => e.id === execIdPrefix || e.id.startsWith(execIdPrefix));
        if (!exec) {
            console.log(chalk_1.default.red(`❌ Chain execution not found: ${execIdPrefix}`));
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
        console.log(chalk_1.default.gray('\n  No active chain executions.'));
        console.log(chalk_1.default.gray('  Start one with: cody chain auto "task description"\n'));
        return;
    }
    console.log(chalk_1.default.cyan(`\n🔗 Active Chains (${active.length})\n`));
    for (const exec of active) {
        const project = data.projects.find(p => p.id === exec.projectId);
        const currentSkill = (0, skill_chain_1.getCurrentSkill)(exec);
        const progressBar = (0, skill_chain_1.formatChainProgressBar)(exec);
        console.log(`  ${chalk_1.default.white(exec.chainName)} — "${exec.taskTitle}"`);
        console.log(chalk_1.default.gray(`   ${progressBar} | Step ${exec.currentStepIndex + 1}/${exec.steps.length}: ${currentSkill || 'done'}`));
        console.log(chalk_1.default.gray(`   ID: ${(0, data_1.shortId)(exec.id)} | Agent: ${exec.agent} | Project: ${(project === null || project === void 0 ? void 0 : project.name) || '—'}`));
        console.log();
    }
}
function chainAdvance(execIdPrefix, output) {
    if (!execIdPrefix) {
        console.log(chalk_1.default.red('❌ Usage: cody chain advance <exec-id> ["output summary"]'));
        return;
    }
    const data = (0, data_1.loadData)();
    const exec = data.chainExecutions.find(e => e.id === execIdPrefix || e.id.startsWith(execIdPrefix));
    if (!exec) {
        console.log(chalk_1.default.red(`❌ Chain execution not found: ${execIdPrefix}`));
        return;
    }
    if (exec.status !== 'running') {
        console.log(chalk_1.default.yellow(`⚠️  Chain is ${exec.status}, cannot advance.`));
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
        console.log(chalk_1.default.green(`\n✅ Chain completed! All ${exec.steps.length} steps done.`));
        console.log(chalk_1.default.gray(`   Chain: ${exec.chainName}`));
        console.log(chalk_1.default.gray(`   Task:  ${exec.taskTitle}`));
        console.log();
    }
    else {
        (0, data_1.logActivity)(data, 'chain_step_completed', `Chain step completed: ${completedStep === null || completedStep === void 0 ? void 0 : completedStep.skill} → next: ${result.nextSkill}`, exec.projectId, exec.agent, {
            executionId: exec.id, completedSkill: completedStep === null || completedStep === void 0 ? void 0 : completedStep.skill, nextSkill: result.nextSkill,
        });
        (0, data_1.saveData)(data);
        const nextStep = exec.steps[exec.currentStepIndex];
        console.log(chalk_1.default.green(`\n✅ Step completed: ${completedStep === null || completedStep === void 0 ? void 0 : completedStep.skill}`));
        console.log(chalk_1.default.cyan(`  ▶ Next step: ${result.nextSkill} — ${nextStep === null || nextStep === void 0 ? void 0 : nextStep.description}`));
        console.log(chalk_1.default.gray(`   Progress: ${(0, skill_chain_1.formatChainProgressBar)(exec)}`));
        console.log();
    }
}
function chainSkip(execIdPrefix, reason) {
    if (!execIdPrefix) {
        console.log(chalk_1.default.red('❌ Usage: cody chain skip <exec-id> ["reason"]'));
        return;
    }
    const data = (0, data_1.loadData)();
    const exec = data.chainExecutions.find(e => e.id === execIdPrefix || e.id.startsWith(execIdPrefix));
    if (!exec) {
        console.log(chalk_1.default.red(`❌ Chain execution not found: ${execIdPrefix}`));
        return;
    }
    if (exec.status !== 'running') {
        console.log(chalk_1.default.yellow(`⚠️  Chain is ${exec.status}, cannot skip.`));
        return;
    }
    const skippedStep = exec.steps[exec.currentStepIndex];
    const result = (0, skill_chain_1.skipChainStep)(exec, reason);
    (0, data_1.saveData)(data);
    console.log(chalk_1.default.yellow(`  ⏭️  Skipped: ${skippedStep === null || skippedStep === void 0 ? void 0 : skippedStep.skill}`));
    if (result.completed) {
        console.log(chalk_1.default.green(`  ✅ Chain completed!`));
    }
    else {
        console.log(chalk_1.default.cyan(`  ▶ Next: ${result.nextSkill}`));
    }
    console.log();
}
function chainAbort(execIdPrefix, reason) {
    if (!execIdPrefix) {
        console.log(chalk_1.default.red('❌ Usage: cody chain abort <exec-id> ["reason"]'));
        return;
    }
    const data = (0, data_1.loadData)();
    const exec = data.chainExecutions.find(e => e.id === execIdPrefix || e.id.startsWith(execIdPrefix));
    if (!exec) {
        console.log(chalk_1.default.red(`❌ Chain execution not found: ${execIdPrefix}`));
        return;
    }
    if (exec.status !== 'running' && exec.status !== 'paused') {
        console.log(chalk_1.default.yellow(`⚠️  Chain already ${exec.status}.`));
        return;
    }
    (0, skill_chain_1.abortChain)(exec, reason);
    (0, data_1.logActivity)(data, 'chain_aborted', `Chain "${exec.chainName}" aborted: ${reason || 'no reason'}`, exec.projectId, exec.agent, {
        executionId: exec.id,
    });
    (0, data_1.saveData)(data);
    console.log(chalk_1.default.red(`\n🛑 Chain aborted: ${exec.chainName}`));
    if (reason)
        console.log(chalk_1.default.gray(`   Reason: ${reason}`));
    console.log();
}
function chainAuto(taskTitle, opts) {
    if (!taskTitle) {
        console.log(chalk_1.default.red('❌ Usage: cody chain auto "task description"'));
        console.log(chalk_1.default.gray('   Example: cody chain auto "Build user authentication"'));
        return;
    }
    const chain = (0, skill_chain_1.matchChain)(taskTitle);
    if (!chain) {
        console.log(chalk_1.default.yellow(`\n⚠️  No matching chain found for: "${taskTitle}"`));
        console.log(chalk_1.default.gray('   Available chains:'));
        for (const c of (0, skill_chain_1.listChains)()) {
            console.log(chalk_1.default.gray(`     ${c.icon} ${c.id}: ${c.triggers.slice(0, 3).join(', ')}...`));
        }
        console.log(chalk_1.default.gray('\n   Use "cody chain start <chain-id> <title>" to start manually.'));
        return;
    }
    console.log(chalk_1.default.cyan(`\n🤖 Auto-detected chain: ${chain.icon} ${chain.name}`));
    console.log(chalk_1.default.gray(`   Matched from: "${taskTitle}"`));
    console.log();
    // Delegate to chainStart
    chainStart(chain.id, taskTitle, opts);
}
function chainHistory() {
    const data = (0, data_1.loadData)();
    const execs = data.chainExecutions;
    if (execs.length === 0) {
        console.log(chalk_1.default.gray('\n  No chain executions yet.\n'));
        return;
    }
    const STATUS_ICONS = {
        pending: '⚪', running: '🔵', paused: '⏸️', completed: '✅', failed: '❌', aborted: '🛑',
    };
    console.log(chalk_1.default.cyan(`\n🔗 Chain History (${execs.length})\n`));
    console.log(chalk_1.default.gray('  ' + padRight('Status', 8) + padRight('Chain', 24) + padRight('Task', 30) + padRight('Progress', 14) + 'Time'));
    console.log(chalk_1.default.gray('  ' + '─'.repeat(86)));
    for (const exec of execs.slice(0, 20)) {
        const icon = STATUS_ICONS[exec.status] || '❓';
        const completed = exec.steps.filter(s => s.status === 'completed' || s.status === 'skipped').length;
        const progress = `${completed}/${exec.steps.length} steps`;
        const time = formatTimeAgoCli(exec.startedAt);
        console.log('  ' + padRight(icon, 8) + padRight(exec.chainName.substring(0, 22), 24) + padRight(exec.taskTitle.substring(0, 28), 30) + chalk_1.default.gray(padRight(progress, 14)) + chalk_1.default.gray(time));
    }
    console.log();
}
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
program.parse(process.argv);
