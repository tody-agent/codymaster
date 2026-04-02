"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerProjectCommands = registerProjectCommands;
const crypto_1 = __importDefault(require("crypto"));
const chalk_1 = __importDefault(require("chalk"));
const data_1 = require("../../data");
const theme_1 = require("../../ui/theme");
const box_1 = require("../../ui/box");
const cli_utils_1 = require("../../utils/cli-utils");
function registerProjectCommands(program) {
    // ─── Project Command ───────────────────────────────────────────────────────
    program
        .command('project <cmd> [args...]')
        .alias('p')
        .description('Project management (add|list|rm)')
        .action((cmd, args, opts) => {
        switch (cmd) {
            case 'add':
                projectAdd(args[0], opts);
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
    // ─── Deploy Command ────────────────────────────────────────────────────────
    program
        .command('deploy <cmd> [args...]')
        .alias('d')
        .description('Deployment management (staging|production|list)')
        .option('-p, --project <name>', 'Project name or ID')
        .option('-m, --message <msg>', 'Deployment message')
        .option('-c, --commit <sha>', 'Commit SHA')
        .option('-b, --branch <name>', 'Branch name', 'main')
        .option('--agent <agent>', 'Agent name')
        .action((cmd, args, opts) => {
        switch (cmd) {
            case 'staging':
            case 'stg':
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
    // ─── Rollback Command ───────────────────────────────────────────────────────
    program
        .command('rollback <deployId>')
        .alias('rb')
        .description('Rollback a deployment')
        .option('--agent <agent>', 'Agent name')
        .action((deployId, opts) => {
        const data = (0, data_1.loadData)();
        const dep = data.deployments.find((d) => d.id === deployId || d.id.startsWith(deployId));
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
            acts = acts.filter((a) => a.projectId === p.id);
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
            const proj = data.projects.find((p) => p.id === a.projectId);
            const projTag = proj ? (0, theme_1.dim)(` [${proj.name}]`) : '';
            const agentTag = a.agent ? (0, theme_1.dim)(` @${a.agent}`) : '';
            const time = (0, cli_utils_1.formatTimeAgoCli)(a.createdAt);
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
}
function projectAdd(name, opts) {
    if (!name) {
        console.log((0, box_1.renderResult)('error', 'Name required. Usage: cm project add "My Project"'));
        return;
    }
    const data = (0, data_1.loadData)();
    const project = {
        id: crypto_1.default.randomUUID(), name, path: process.cwd(), agents: [],
        createdAt: new Date().toISOString(),
    };
    data.projects.push(project);
    (0, data_1.logActivity)(data, 'project_created', `Project "${name}" created via CLI`, project.id);
    (0, data_1.saveData)(data);
    console.log((0, box_1.renderResult)('success', `Project created: ${name}`, [`${(0, theme_1.dim)('ID:')} ${(0, theme_1.brand)((0, data_1.shortId)(project.id))}`]));
}
function projectList() {
    const data = (0, data_1.loadData)();
    if (data.projects.length === 0) {
        console.log(`\n  ${(0, theme_1.dim)('No projects found.')}\n`);
        return;
    }
    console.log((0, box_1.renderCommandHeader)('Projects', '📦'));
    for (const p of data.projects) {
        const tasks = data.tasks.filter((t) => t.projectId === p.id);
        const done = tasks.filter((t) => t.column === 'done').length;
        console.log(`  ${(0, theme_1.brand)((0, data_1.shortId)(p.id))} ${(0, cli_utils_1.padRight)(p.name, 30)} ${(0, theme_1.dim)(`${done}/${tasks.length} tasks`)}`);
    }
    console.log();
}
function projectRemove(query) {
    if (!query) {
        console.log((0, box_1.renderResult)('error', 'Query required. Usage: cm project rm <name|id>'));
        return;
    }
    const data = (0, data_1.loadData)();
    const p = (0, data_1.findProjectByNameOrId)(data, query);
    if (!p) {
        console.log((0, box_1.renderResult)('error', `Project not found: ${query}`));
        return;
    }
    data.projects = data.projects.filter((proj) => proj.id !== p.id);
    data.tasks = data.tasks.filter((t) => t.projectId !== p.id);
    (0, data_1.logActivity)(data, 'project_deleted', `Project "${p.name}" deleted`, p.id);
    (0, data_1.saveData)(data);
    console.log((0, box_1.renderResult)('success', `Project deleted: ${p.name}`));
}
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
    const now = new Date().toISOString();
    const dep = {
        id: crypto_1.default.randomUUID(), projectId: projectId || '', env, status: 'success',
        commit: opts.commit || '', branch: opts.branch || 'main',
        message: opts.message || 'Manual deployment',
        agent: opts.agent || '', startedAt: now, finishedAt: now,
    };
    data.deployments.unshift(dep);
    (0, data_1.logActivity)(data, env === 'staging' ? 'deploy_staging' : 'deploy_production', `Deployed to ${env}: ${dep.message}`, projectId, opts.agent || '', { deploymentId: dep.id });
    (0, data_1.saveData)(data);
    const envColor = env === 'production' ? theme_1.success : theme_1.warning;
    const project = data.projects.find((p) => p.id === projectId);
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
        deps = deps.filter((d) => d.projectId === p.id);
    }
    if (deps.length === 0) {
        console.log(`\n  ${(0, theme_1.dim)('No deployments yet.')}\n`);
        return;
    }
    console.log((0, box_1.renderCommandHeader)('Deployment History', '🚀'));
    console.log((0, theme_1.dim)('  ' + (0, cli_utils_1.padRight)('ID', 10) + (0, cli_utils_1.padRight)('Env', 12) + (0, cli_utils_1.padRight)('Status', 14) + (0, cli_utils_1.padRight)('Message', 32) + (0, cli_utils_1.padRight)('Branch', 12) + 'Time'));
    console.log((0, theme_1.dim)('  ' + '─'.repeat(100)));
    for (const dep of deps.slice(0, 20)) {
        const sc = theme_1.STATUS[dep.status] || chalk_1.default.white;
        const ec = dep.env === 'production' ? theme_1.success : theme_1.warning;
        const timeAgo = (0, cli_utils_1.formatTimeAgoCli)(dep.startedAt);
        const rollbackFlag = dep.rollbackOf ? ' ⏪' : '';
        console.log('  ' + (0, theme_1.dim)((0, cli_utils_1.padRight)((0, data_1.shortId)(dep.id), 10)) + ec((0, cli_utils_1.padRight)(dep.env, 12)) + sc((0, cli_utils_1.padRight)(dep.status.replace('_', ' ') + rollbackFlag, 14)) + (0, cli_utils_1.padRight)(dep.message.substring(0, 30), 32) + (0, theme_1.dim)((0, cli_utils_1.padRight)(dep.branch || '—', 12)) + (0, theme_1.dim)(timeAgo));
    }
    console.log((0, theme_1.dim)(`\n  Total: ${deps.length} deployments\n`));
}
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
        entries = entries.filter((c) => c.projectId === p.id);
    }
    if (entries.length === 0) {
        console.log(`\n  ${(0, theme_1.dim)('No changelog entries.')}\n`);
        return;
    }
    console.log((0, box_1.renderCommandHeader)('Changelog', '📝'));
    for (const entry of entries) {
        const proj = data.projects.find((p) => p.id === entry.projectId);
        console.log((0, theme_1.brand)(`  ${entry.version}`) + ` — ${entry.title}` + (0, theme_1.dim)(` (${(0, cli_utils_1.formatTimeAgoCli)(entry.createdAt)})${proj ? ' [' + proj.name + ']' : ''}`));
        if (entry.changes.length > 0) {
            entry.changes.forEach((c) => console.log((0, theme_1.dim)(`    • ${c}`)));
        }
    }
    console.log();
}
