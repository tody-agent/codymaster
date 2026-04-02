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
exports.registerTaskCommands = registerTaskCommands;
const crypto_1 = __importDefault(require("crypto"));
const chalk_1 = __importDefault(require("chalk"));
const data_1 = require("../../data");
const agent_dispatch_1 = require("../../agent-dispatch");
const theme_1 = require("../../ui/theme");
const box_1 = require("../../ui/box");
const cli_utils_1 = require("../../utils/cli-utils");
const COL_COLORS = theme_1.COL;
const PRIORITY_COLORS = theme_1.PRI;
function registerTaskCommands(program) {
    program
        .command('task <cmd> [args...]')
        .alias('t')
        .description('Task management (add|list|move|done|rm|dispatch|stuck)')
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
}
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
        const dp = {
            id: crypto_1.default.randomUUID(),
            name: 'Default Project',
            path: process.cwd(),
            agents: [],
            createdAt: new Date().toISOString()
        };
        data.projects.push(dp);
        projectId = dp.id;
    }
    const now = new Date().toISOString();
    const column = (opts.column || 'backlog');
    const ct = data.tasks.filter((t) => t.column === column && t.projectId === projectId);
    const mo = ct.length > 0 ? Math.max(...ct.map((t) => t.order)) : -1;
    const task = {
        id: crypto_1.default.randomUUID(),
        projectId: projectId,
        title: title.trim(),
        description: '',
        column,
        order: mo + 1,
        priority: (opts.priority || 'medium'),
        agent: opts.agent || '',
        skill: opts.skill || '',
        createdAt: now,
        updatedAt: now
    };
    data.tasks.push(task);
    (0, data_1.logActivity)(data, 'task_created', `Task "${task.title}" created via CLI`, projectId, opts.agent || '');
    (0, data_1.saveData)(data);
    const project = data.projects.find((p) => p.id === projectId);
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
        tasks = tasks.filter((t) => t.projectId === project.id);
        console.log((0, box_1.renderCommandHeader)(`Tasks — ${project.name}`, '📋'));
    }
    else {
        console.log((0, box_1.renderCommandHeader)('All Tasks', '📋'));
    }
    if (tasks.length === 0) {
        console.log(`  ${(0, theme_1.dim)('No tasks found.')}\n`);
        return;
    }
    console.log((0, theme_1.dim)('  ' + (0, cli_utils_1.padRight)('ID', 10) + (0, cli_utils_1.padRight)('Title', 36) + (0, cli_utils_1.padRight)('Column', 14) + (0, cli_utils_1.padRight)('Priority', 10) + (0, cli_utils_1.padRight)('Agent', 14) + 'Project'));
    console.log((0, theme_1.dim)('  ' + '─'.repeat(100)));
    const co = ['backlog', 'in-progress', 'review', 'done'];
    tasks.sort((a, b) => co.indexOf(a.column) - co.indexOf(b.column) || a.order - b.order);
    for (const task of tasks) {
        const cc = COL_COLORS[task.column] || chalk_1.default.white;
        const pc = PRIORITY_COLORS[task.priority] || chalk_1.default.white;
        const project = data.projects.find((p) => p.id === task.projectId);
        console.log('  ' + (0, theme_1.dim)((0, cli_utils_1.padRight)((0, data_1.shortId)(task.id), 10)) + (0, cli_utils_1.padRight)(task.title.substring(0, 34), 36) + cc((0, cli_utils_1.padRight)(task.column, 14)) + pc((0, cli_utils_1.padRight)(task.priority, 10)) + (0, theme_1.dim)((0, cli_utils_1.padRight)(task.agent || '—', 14)) + (0, theme_1.dim)((project === null || project === void 0 ? void 0 : project.name) || '—'));
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
    (0, data_1.saveData)(data);
    (0, data_1.logActivity)(data, 'task_moved', `Task "${task.title}" moved ${oldCol} → ${targetColumn}`, task.projectId);
    console.log((0, box_1.renderResult)('success', `Task moved: ${(0, data_1.shortId)(task.id)}`, [`${(0, theme_1.dim)('New column:')} ${(0, theme_1.brand)(targetColumn)}`]));
}
function taskDone(idPrefix) {
    taskMove(idPrefix, 'done');
}
function taskRemove(idPrefix) {
    if (!idPrefix) {
        console.log((0, box_1.renderResult)('error', 'Usage: cm task rm <id>'));
        return;
    }
    const data = (0, data_1.loadData)();
    const task = (0, data_1.findTaskByIdPrefix)(data, idPrefix);
    if (!task) {
        console.log((0, box_1.renderResult)('error', `Task not found: ${idPrefix}`));
        return;
    }
    data.tasks = data.tasks.filter((t) => t.id !== task.id);
    (0, data_1.logActivity)(data, 'task_deleted', `Task "${task.title}" deleted`, task.projectId);
    (0, data_1.saveData)(data);
    console.log((0, box_1.renderResult)('success', `Task deleted: ${task.title}`));
}
function taskDispatch(idPrefix, opts) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!idPrefix) {
            console.log((0, box_1.renderResult)('error', 'Usage: cm task dispatch <id>'));
            return;
        }
        const data = (0, data_1.loadData)();
        const task = (0, data_1.findTaskByIdPrefix)(data, idPrefix);
        if (!task) {
            console.log((0, box_1.renderResult)('error', `Task not found: ${idPrefix}`));
            return;
        }
        const project = data.projects.find((p) => p.id === task.projectId);
        if (!project) {
            console.log((0, box_1.renderResult)('error', `Project not found for task: ${task.id}`));
            return;
        }
        console.log((0, box_1.renderResult)('info', `Dispatching task: ${task.title}...`));
        const success = yield (0, agent_dispatch_1.dispatchTaskToAgent)(task, project, opts.force);
        if (success) {
            task.column = 'in-progress';
            task.updatedAt = new Date().toISOString();
            (0, data_1.saveData)(data);
        }
    });
}
function taskStuck(opts) {
    const data = (0, data_1.loadData)();
    const now = new Date().getTime();
    const STUCK_THRESHOLD = 30 * 60 * 1000; // 30 mins
    const stuckTasks = data.tasks.filter((t) => {
        if (t.column !== 'in-progress')
            return false;
        const lastUpdate = new Date(t.updatedAt).getTime();
        return (now - lastUpdate) > STUCK_THRESHOLD;
    });
    if (stuckTasks.length === 0) {
        console.log((0, box_1.renderResult)('success', 'No stuck tasks detected.'));
        return;
    }
    console.log((0, box_1.renderCommandHeader)('Stuck Tasks Detected', '⚠️'));
    for (const t of stuckTasks) {
        const project = data.projects.find((p) => p.id === t.projectId);
        console.log(`  ${(0, theme_1.dim)((0, data_1.shortId)(t.id))} ${(0, cli_utils_1.padRight)(t.title, 40)} ${(0, theme_1.brand)((project === null || project === void 0 ? void 0 : project.name) || '—')} ${(0, theme_1.dim)('Stuck for ' + Math.round((now - new Date(t.updatedAt).getTime()) / 60000) + 'm')}`);
    }
}
