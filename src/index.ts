#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import crypto from 'crypto';
import fs from 'fs';
import { exec } from 'child_process';
import { loadData, saveData, logActivity, findProjectByNameOrId, findTaskByIdPrefix, shortId, DATA_FILE, PID_FILE, DEFAULT_PORT } from './data';
import type { Project, Task, Deployment, ChangelogEntry } from './data';
import { launchDashboard } from './dashboard';
import { dispatchTaskToAgent, validateDispatch } from './agent-dispatch';
import { ensureCmDir, getContinuityStatus, getLearnings, getDecisions, resetContinuity, hasCmDir, readContinuityState } from './continuity';

const VERSION = '3.1.0';

// ─── Branding ───────────────────────────────────────────────────────────────

function showBanner() {
  console.log(chalk.cyan(`
  ██████╗ ███╗   ███╗
 ██╔════╝ ████╗ ████║   CodyMaster v${VERSION}
 ██║      ██╔████╔██║   Universal AI Agent Skills Platform
 ██║      ██║╚██╔╝██║   Dashboard: http://localhost:${DEFAULT_PORT}
  ╚██████╗██║ ╚═╝ ██║
   ╚═════╝╚═╝     ╚═╝
`));
}

// ─── Utility ────────────────────────────────────────────────────────────────

const COL_COLORS: Record<string, (s: string) => string> = {
  'backlog': chalk.gray, 'in-progress': chalk.blue, 'review': chalk.yellow, 'done': chalk.green,
};

const PRIORITY_COLORS: Record<string, (s: string) => string> = {
  'low': chalk.green, 'medium': chalk.yellow, 'high': chalk.red, 'urgent': chalk.magenta,
};

const STATUS_COLORS: Record<string, (s: string) => string> = {
  'success': chalk.green, 'failed': chalk.red, 'pending': chalk.yellow,
  'running': chalk.blue, 'rolled_back': chalk.magenta,
};

function padRight(str: string, len: number): string {
  return str.length >= len ? str.substring(0, len) : str + ' '.repeat(len - str.length);
}

function openUrl(url: string) {
  const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  exec(`${cmd} ${url}`);
}

// ─── Program ────────────────────────────────────────────────────────────────

const program = new Command();

program
  .name('codymaster')
  .description('CodyMaster — Universal AI Agent Skills Platform')
  .version(VERSION, '-v, --version', 'Show version')
  .action(() => {
    showBanner();
    console.log(chalk.white('Usage: codymaster <command> [options]\n'));
    console.log(chalk.white('Commands:'));
    console.log(`  ${chalk.cyan('dashboard [cmd]')}     Dashboard server (start|stop|status|open)`);
    console.log(`  ${chalk.cyan('task <cmd>')}          Task management (add|list|move|done|rm)`);
    console.log(`  ${chalk.cyan('project <cmd>')}       Project management (add|list|rm)`);
    console.log(`  ${chalk.cyan('deploy <cmd>')}        Deploy management (staging|production|list)`);
    console.log(`  ${chalk.cyan('rollback <id>')}       Rollback a deployment`);
    console.log(`  ${chalk.cyan('history')}             Show activity history`);
    console.log(`  ${chalk.cyan('changelog <cmd>')}     Changelog (add|list)`);
    console.log(`  ${chalk.cyan('status')}              Show summary`);
    console.log(`  ${chalk.cyan('install <skill>')}     Install an agent skill`);
    console.log(`  ${chalk.cyan('version')}             Show version`);
    console.log(`  ${chalk.cyan('help')}                Show this help`);
    console.log();
    console.log(chalk.white('Examples:'));
    console.log(chalk.gray('  codymaster dashboard start                   # Start dashboard'));
    console.log(chalk.gray('  codymaster deploy staging -m "Fix login"     # Record staging deploy'));
    console.log(chalk.gray('  codymaster deploy production                 # Record production deploy'));
    console.log(chalk.gray('  codymaster deploy list                       # Deploy history'));
    console.log(chalk.gray('  codymaster rollback <deploy-id>              # Rollback deployment'));
    console.log(chalk.gray('  codymaster history                           # Activity timeline'));
    console.log(chalk.gray('  codymaster changelog add v1.2 "Bug fixes"   # Add changelog'));
    console.log(chalk.gray('  codymaster changelog list                    # Show changelog'));
    console.log(chalk.gray('  codymaster task add "Fix bug" --priority high'));
    console.log(chalk.gray('  codymaster status                            # Overview'));
    console.log();
    console.log(chalk.gray(`Data: ${DATA_FILE}`));
    console.log(chalk.gray(`Port: ${DEFAULT_PORT}\n`));
  });

// ─── Dashboard Command ─────────────────────────────────────────────────────

program
  .command('dashboard [cmd]')
  .alias('dash')
  .description('Dashboard server (start|stop|status|open)')
  .option('-p, --port <port>', 'Port number', String(DEFAULT_PORT))
  .action((cmd, opts) => {
    const port = parseInt(opts.port) || DEFAULT_PORT;
    switch (cmd) {
      case 'start': case undefined:
        if (isDashboardRunning()) { console.log(chalk.yellow('⚠️  Dashboard already running.')); console.log(chalk.gray(`   URL: http://localhost:${port}`)); return; }
        launchDashboard(port); break;
      case 'stop': stopDashboard(); break;
      case 'status': dashboardStatus(port); break;
      case 'open': console.log(chalk.blue(`🌐 Opening http://localhost:${port} ...`)); openUrl(`http://localhost:${port}`); break;
      case 'url': console.log(`http://localhost:${port}`); break;
      default: console.log(chalk.red(`Unknown: ${cmd}`)); console.log(chalk.gray('Available: start, stop, status, open, url'));
    }
  });

function isDashboardRunning(): boolean {
  try { if (!fs.existsSync(PID_FILE)) return false; const pid = parseInt(fs.readFileSync(PID_FILE, 'utf-8').trim()); process.kill(pid, 0); return true; }
  catch { try { fs.unlinkSync(PID_FILE); } catch {} return false; }
}

function stopDashboard() {
  try {
    if (!fs.existsSync(PID_FILE)) { console.log(chalk.yellow('⚠️  No dashboard running.')); return; }
    const pid = parseInt(fs.readFileSync(PID_FILE, 'utf-8').trim());
    process.kill(pid, 'SIGTERM'); try { fs.unlinkSync(PID_FILE); } catch {}
    console.log(chalk.green(`✅ Dashboard stopped (PID ${pid}).`));
  } catch (err: any) { console.log(chalk.red(`Failed to stop: ${err.message}`)); try { fs.unlinkSync(PID_FILE); } catch {} }
}

function dashboardStatus(port: number) {
  if (isDashboardRunning()) {
    const pid = fs.readFileSync(PID_FILE, 'utf-8').trim();
    console.log(chalk.green(`✅ Dashboard RUNNING`)); console.log(chalk.gray(`   PID: ${pid}`)); console.log(chalk.gray(`   URL: http://localhost:${port}`));
  } else { console.log(chalk.yellow('⚫ Dashboard NOT running')); console.log(chalk.gray('   Start with: codymaster dashboard start')); }
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
      case 'add': taskAdd(args.join(' '), opts); break;
      case 'list': case 'ls': taskList(opts); break;
      case 'move': taskMove(args[0], args[1]); break;
      case 'done': taskDone(args[0]); break;
      case 'rm': case 'delete': taskRemove(args[0]); break;
      case 'dispatch': taskDispatch(args[0], opts); break;
      default: console.log(chalk.red(`Unknown: ${cmd}`)); console.log(chalk.gray('Available: add, list, move, done, rm, dispatch'));
    }
  });

function taskAdd(title: string, opts: any) {
  if (!title) { console.log(chalk.red('❌ Title required. Usage: codymaster task add "My task"')); return; }
  const data = loadData();
  let projectId: string | undefined;
  if (opts.project) {
    const project = findProjectByNameOrId(data, opts.project);
    if (!project) { console.log(chalk.red(`❌ Project not found: ${opts.project}`)); return; }
    projectId = project.id;
  } else if (data.projects.length > 0) { projectId = data.projects[0].id; }
  else {
    const dp: Project = { id: crypto.randomUUID(), name: 'Default Project', path: process.cwd(), agents: [], createdAt: new Date().toISOString() };
    data.projects.push(dp); projectId = dp.id;
  }
  const now = new Date().toISOString();
  const column = opts.column || 'backlog';
  const ct = data.tasks.filter(t => t.column === column && t.projectId === projectId);
  const mo = ct.length > 0 ? Math.max(...ct.map(t => t.order)) : -1;
  const task: Task = { id: crypto.randomUUID(), projectId: projectId!, title: title.trim(), description: '', column, order: mo + 1, priority: opts.priority || 'medium', agent: opts.agent || '', skill: opts.skill || '', createdAt: now, updatedAt: now };
  data.tasks.push(task);
  logActivity(data, 'task_created', `Task "${task.title}" created via CLI`, projectId!, opts.agent || '');
  saveData(data);
  const project = data.projects.find(p => p.id === projectId);
  console.log(chalk.green(`✅ Task created: ${title}`));
  console.log(chalk.gray(`   ID: ${shortId(task.id)} | Project: ${project?.name || 'Default'} | ${column} | ${opts.priority || 'medium'}`));
}

function taskList(opts: any) {
  const data = loadData();
  let tasks = data.tasks;
  if (opts.project && !opts.all) {
    const project = findProjectByNameOrId(data, opts.project);
    if (!project) { console.log(chalk.red(`❌ Project not found: ${opts.project}`)); return; }
    tasks = tasks.filter(t => t.projectId === project.id);
    console.log(chalk.cyan(`\n📋 Tasks — ${project.name}\n`));
  } else { console.log(chalk.cyan('\n📋 All Tasks\n')); }
  if (tasks.length === 0) { console.log(chalk.gray('  No tasks found.\n')); return; }
  console.log(chalk.gray('  ' + padRight('ID', 10) + padRight('Title', 36) + padRight('Column', 14) + padRight('Priority', 10) + padRight('Agent', 14) + 'Project'));
  console.log(chalk.gray('  ' + '─'.repeat(100)));
  const co = ['backlog', 'in-progress', 'review', 'done'];
  tasks.sort((a, b) => co.indexOf(a.column) - co.indexOf(b.column) || a.order - b.order);
  for (const task of tasks) {
    const cc = COL_COLORS[task.column] || chalk.white;
    const pc = PRIORITY_COLORS[task.priority] || chalk.white;
    const project = data.projects.find(p => p.id === task.projectId);
    console.log('  ' + chalk.gray(padRight(shortId(task.id), 10)) + padRight(task.title.substring(0, 34), 36) + cc(padRight(task.column, 14)) + pc(padRight(task.priority, 10)) + chalk.gray(padRight(task.agent || '—', 14)) + chalk.gray(project?.name || '—'));
  }
  console.log(chalk.gray(`\n  Total: ${tasks.length} tasks\n`));
}

function taskMove(idPrefix: string, targetColumn: string) {
  if (!idPrefix || !targetColumn) { console.log(chalk.red('❌ Usage: codymaster task move <id> <column>')); return; }
  const vc = ['backlog', 'in-progress', 'review', 'done'];
  if (!vc.includes(targetColumn)) { console.log(chalk.red(`❌ Invalid column: ${targetColumn}`)); return; }
  const data = loadData();
  const task = findTaskByIdPrefix(data, idPrefix);
  if (!task) { console.log(chalk.red(`❌ Task not found: ${idPrefix}`)); return; }
  const oldCol = task.column;
  task.column = targetColumn as Task['column'];
  task.updatedAt = new Date().toISOString();
  logActivity(data, targetColumn === 'done' ? 'task_done' : 'task_moved', `Task "${task.title}" moved: ${oldCol} → ${targetColumn}`, task.projectId, task.agent, { from: oldCol, to: targetColumn });
  saveData(data);
  console.log(chalk.green(`✅ Moved "${task.title}"`));
  console.log(chalk.gray(`   ${oldCol} → `) + (COL_COLORS[targetColumn] || chalk.white)(targetColumn));
}

function taskDone(idPrefix: string) {
  if (!idPrefix) { console.log(chalk.red('❌ Usage: codymaster task done <id>')); return; }
  taskMove(idPrefix, 'done');
}

function taskRemove(idPrefix: string) {
  if (!idPrefix) { console.log(chalk.red('❌ Usage: codymaster task rm <id>')); return; }
  const data = loadData();
  const idx = data.tasks.findIndex(t => t.id === idPrefix || t.id.startsWith(idPrefix));
  if (idx === -1) { console.log(chalk.red(`❌ Task not found: ${idPrefix}`)); return; }
  const [removed] = data.tasks.splice(idx, 1);
  logActivity(data, 'task_deleted', `Task "${removed.title}" deleted via CLI`, removed.projectId, removed.agent);
  saveData(data);
  console.log(chalk.green(`✅ Deleted: "${removed.title}" (${shortId(removed.id)})`));
}

function taskDispatch(idPrefix: string, opts: any) {
  if (!idPrefix) { console.log(chalk.red('❌ Usage: codymaster task dispatch <id> [--force]')); return; }
  const data = loadData();
  const task = findTaskByIdPrefix(data, idPrefix);
  if (!task) { console.log(chalk.red(`❌ Task not found: ${idPrefix}`)); return; }
  const project = data.projects.find(p => p.id === task.projectId);

  const result = dispatchTaskToAgent(task, project!, opts.force || false);

  if (result.success) {
    task.dispatchStatus = 'dispatched';
    task.dispatchedAt = new Date().toISOString();
    task.dispatchError = undefined;
    task.updatedAt = task.dispatchedAt;
    logActivity(data, 'task_dispatched', `Task "${task.title}" dispatched to ${task.agent} via CLI`, task.projectId, task.agent, {
      taskId: task.id, filePath: result.filePath, force: opts.force || false,
    });
    saveData(data);
    console.log(chalk.green(`\n🚀 Task dispatched to ${task.agent}!`));
    console.log(chalk.gray(`   Task:    ${task.title}`));
    console.log(chalk.gray(`   Agent:   ${task.agent}`));
    if (task.skill) console.log(chalk.gray(`   Skill:   ${task.skill}`));
    console.log(chalk.gray(`   File:    ${result.filePath}`));
    console.log();
  } else {
    task.dispatchStatus = 'failed';
    task.dispatchError = result.error;
    task.updatedAt = new Date().toISOString();
    saveData(data);
    console.log(chalk.red(`❌ Dispatch failed: ${result.error}`));
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
      case 'add': projectAdd(args.join(' '), opts); break;
      case 'list': case 'ls': projectList(); break;
      case 'rm': case 'delete': projectRemove(args[0]); break;
      default: console.log(chalk.red(`Unknown: ${cmd}`)); console.log(chalk.gray('Available: add, list, rm'));
    }
  });

function projectAdd(name: string, opts: any) {
  if (!name) { console.log(chalk.red('❌ Usage: codymaster project add "my-project"')); return; }
  const data = loadData();
  const project: Project = { id: crypto.randomUUID(), name: name.trim(), path: opts.path || process.cwd(), agents: [], createdAt: new Date().toISOString() };
  data.projects.push(project);
  logActivity(data, 'project_created', `Project "${project.name}" created via CLI`, project.id);
  saveData(data);
  console.log(chalk.green(`✅ Project created: ${name}`));
  console.log(chalk.gray(`   ID: ${shortId(project.id)} | Path: ${project.path}`));
}

function projectList() {
  const data = loadData();
  if (data.projects.length === 0) { console.log(chalk.gray('\n  No projects.\n')); return; }
  console.log(chalk.cyan('\n📦 Projects\n'));
  console.log(chalk.gray('  ' + padRight('ID', 10) + padRight('Name', 24) + padRight('Tasks', 8) + padRight('Agents', 20) + 'Path'));
  console.log(chalk.gray('  ' + '─'.repeat(90)));
  for (const project of data.projects) {
    const pt = data.tasks.filter(t => t.projectId === project.id);
    const agents = [...new Set(pt.map(t => t.agent).filter(Boolean))];
    const done = pt.filter(t => t.column === 'done').length;
    console.log('  ' + chalk.gray(padRight(shortId(project.id), 10)) + chalk.white(padRight(project.name, 24)) + chalk.gray(padRight(`${done}/${pt.length}`, 8)) + chalk.gray(padRight(agents.join(', ') || '—', 20)) + chalk.gray(project.path || '—'));
  }
  console.log();
}

function projectRemove(query: string) {
  if (!query) { console.log(chalk.red('❌ Usage: codymaster project rm <name-or-id>')); return; }
  const data = loadData();
  const project = findProjectByNameOrId(data, query);
  if (!project) { console.log(chalk.red(`❌ Project not found: ${query}`)); return; }
  const tc = data.tasks.filter(t => t.projectId === project.id).length;
  data.projects = data.projects.filter(p => p.id !== project.id);
  data.tasks = data.tasks.filter(t => t.projectId !== project.id);
  logActivity(data, 'project_deleted', `Project "${project.name}" deleted via CLI`, project.id);
  saveData(data);
  console.log(chalk.green(`✅ Deleted project "${project.name}" and ${tc} tasks.`));
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
      case 'staging': deployRecord('staging', opts); break;
      case 'production': case 'prod': deployRecord('production', opts); break;
      case 'list': case 'ls': deployList(opts); break;
      default: console.log(chalk.red(`Unknown: ${cmd}`)); console.log(chalk.gray('Available: staging, production, list'));
    }
  });

function deployRecord(env: 'staging' | 'production', opts: any) {
  const data = loadData();
  let projectId: string | undefined;
  if (opts.project) {
    const p = findProjectByNameOrId(data, opts.project);
    if (!p) { console.log(chalk.red(`❌ Project not found: ${opts.project}`)); return; }
    projectId = p.id;
  } else if (data.projects.length > 0) { projectId = data.projects[0].id; }
  else { console.log(chalk.red('❌ No projects. Create one first: codymaster project add "my-project"')); return; }

  const now = new Date().toISOString();
  const dep: Deployment = {
    id: crypto.randomUUID(), projectId: projectId!, env, status: 'success',
    commit: opts.commit || '', branch: opts.branch || 'main',
    agent: opts.agent || '', message: opts.message || `Deploy to ${env}`,
    startedAt: now, finishedAt: now,
  };
  data.deployments.unshift(dep);
  logActivity(data, env === 'staging' ? 'deploy_staging' : 'deploy_production', `Deployed to ${env}: ${dep.message}`, projectId!, opts.agent || '', { deploymentId: dep.id });
  saveData(data);

  const envColor = env === 'production' ? chalk.green : chalk.yellow;
  const project = data.projects.find(p => p.id === projectId);
  console.log(chalk.green(`\n🚀 Deployment recorded!`));
  console.log(chalk.gray(`   ID:      ${shortId(dep.id)}`));
  console.log(`   Env:     ${envColor(env)}`);
  console.log(chalk.gray(`   Project: ${project?.name || '—'}`));
  console.log(chalk.gray(`   Message: ${dep.message}`));
  if (dep.commit) console.log(chalk.gray(`   Commit:  ${dep.commit}`));
  console.log(chalk.gray(`   Branch:  ${dep.branch}`));
  console.log();
}

function deployList(opts: any) {
  const data = loadData();
  let deps = data.deployments;
  if (opts.project) {
    const p = findProjectByNameOrId(data, opts.project);
    if (!p) { console.log(chalk.red(`❌ Project not found: ${opts.project}`)); return; }
    deps = deps.filter(d => d.projectId === p.id);
  }

  if (deps.length === 0) { console.log(chalk.gray('\n  No deployments yet.\n')); return; }

  console.log(chalk.cyan('\n🚀 Deployment History\n'));
  console.log(chalk.gray('  ' + padRight('ID', 10) + padRight('Env', 12) + padRight('Status', 14) + padRight('Message', 32) + padRight('Branch', 12) + 'Time'));
  console.log(chalk.gray('  ' + '─'.repeat(100)));

  for (const dep of deps.slice(0, 20)) {
    const sc = STATUS_COLORS[dep.status] || chalk.white;
    const ec = dep.env === 'production' ? chalk.green : chalk.yellow;
    const timeAgo = formatTimeAgoCli(dep.startedAt);
    const rollbackFlag = dep.rollbackOf ? ' ⏪' : '';
    console.log('  ' + chalk.gray(padRight(shortId(dep.id), 10)) + ec(padRight(dep.env, 12)) + sc(padRight(dep.status.replace('_', ' ') + rollbackFlag, 14)) + padRight(dep.message.substring(0, 30), 32) + chalk.gray(padRight(dep.branch || '—', 12)) + chalk.gray(timeAgo));
  }
  console.log(chalk.gray(`\n  Total: ${deps.length} deployments\n`));
}

// ─── Rollback Command ───────────────────────────────────────────────────────

program
  .command('rollback <deployId>')
  .alias('rb')
  .description('Rollback a deployment')
  .option('--agent <agent>', 'Agent name')
  .action((deployId, opts) => {
    const data = loadData();
    const dep = data.deployments.find(d => d.id === deployId || d.id.startsWith(deployId));
    if (!dep) { console.log(chalk.red(`❌ Deployment not found: ${deployId}`)); return; }
    if (dep.status === 'rolled_back') { console.log(chalk.yellow('⚠️  Already rolled back.')); return; }

    dep.status = 'rolled_back';
    const now = new Date().toISOString();
    const rollback: Deployment = {
      id: crypto.randomUUID(), projectId: dep.projectId, env: dep.env, status: 'success',
      commit: '', branch: dep.branch, agent: opts.agent || '', message: `Rollback of ${shortId(dep.id)}`,
      startedAt: now, finishedAt: now, rollbackOf: dep.id,
    };
    data.deployments.unshift(rollback);
    logActivity(data, 'rollback', `Rolled back ${dep.env} deploy: ${dep.message}`, dep.projectId, opts.agent || '', { originalDeployId: dep.id, rollbackId: rollback.id });
    saveData(data);

    console.log(chalk.magenta(`\n⏪ Rollback complete!`));
    console.log(chalk.gray(`   Original deploy: ${shortId(dep.id)} (${dep.env})`));
    console.log(chalk.gray(`   Rollback ID:     ${shortId(rollback.id)}`));
    console.log(chalk.gray(`   Status:          ${dep.message} → rolled back\n`));
  });

// ─── History Command ────────────────────────────────────────────────────────

program
  .command('history')
  .alias('h')
  .description('Show activity history')
  .option('-n, --limit <n>', 'Number of entries', '20')
  .option('-p, --project <name>', 'Filter by project')
  .action((opts) => {
    const data = loadData();
    let acts = data.activities;
    if (opts.project) {
      const p = findProjectByNameOrId(data, opts.project);
      if (!p) { console.log(chalk.red(`❌ Project not found: ${opts.project}`)); return; }
      acts = acts.filter(a => a.projectId === p.id);
    }
    const limit = parseInt(opts.limit) || 20;
    acts = acts.slice(0, limit);

    if (acts.length === 0) { console.log(chalk.gray('\n  No activity yet.\n')); return; }

    const ICONS: Record<string, string> = {
      'task_created': '✨', 'task_moved': '↔️', 'task_done': '✅', 'task_deleted': '🗑️', 'task_updated': '✏️',
      'project_created': '📦', 'project_deleted': '🗑️',
      'deploy_staging': '🟡', 'deploy_production': '🚀', 'deploy_failed': '❌', 'rollback': '⏪',
      'git_push': '📤', 'changelog_added': '📝',
    };

    console.log(chalk.cyan(`\n📜 Activity History (latest ${acts.length})\n`));
    for (const a of acts) {
      const icon = ICONS[a.type] || '📌';
      const proj = data.projects.find(p => p.id === a.projectId);
      const projTag = proj ? chalk.gray(` [${proj.name}]`) : '';
      const agentTag = a.agent ? chalk.gray(` @${a.agent}`) : '';
      const time = formatTimeAgoCli(a.createdAt);
      console.log(`  ${icon} ${a.message}${projTag}${agentTag} ${chalk.gray(`← ${time}`)}`);
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
      case 'add': changelogAdd(args, opts); break;
      case 'list': case 'ls': changelogList(opts); break;
      default: console.log(chalk.red(`Unknown: ${cmd}`)); console.log(chalk.gray('Available: add, list'));
    }
  });

function changelogAdd(args: string[], opts: any) {
  if (args.length < 2) { console.log(chalk.red('❌ Usage: codymaster changelog add <version> "<title>" [changes...]')); return; }
  const data = loadData();
  let projectId = '';
  if (opts.project) {
    const p = findProjectByNameOrId(data, opts.project);
    if (!p) { console.log(chalk.red(`❌ Project not found: ${opts.project}`)); return; }
    projectId = p.id;
  } else if (data.projects.length > 0) { projectId = data.projects[0].id; }

  const version = args[0];
  const title = args[1];
  const changes = args.slice(2);
  const entry: ChangelogEntry = {
    id: crypto.randomUUID(), projectId, version, title, changes,
    agent: opts.agent || '', createdAt: new Date().toISOString(),
  };
  data.changelog.unshift(entry);
  logActivity(data, 'changelog_added', `Changelog ${version}: ${title}`, projectId, opts.agent || '');
  saveData(data);

  console.log(chalk.green(`\n📝 Changelog entry added!`));
  console.log(chalk.gray(`   Version: ${version}`));
  console.log(chalk.gray(`   Title:   ${title}`));
  if (changes.length > 0) { changes.forEach(c => console.log(chalk.gray(`   • ${c}`))); }
  console.log();
}

function changelogList(opts: any) {
  const data = loadData();
  let entries = data.changelog;
  if (opts.project) {
    const p = findProjectByNameOrId(data, opts.project);
    if (!p) { console.log(chalk.red(`❌ Project not found: ${opts.project}`)); return; }
    entries = entries.filter(c => c.projectId === p.id);
  }

  if (entries.length === 0) { console.log(chalk.gray('\n  No changelog entries.\n')); return; }

  console.log(chalk.cyan('\n📝 Changelog\n'));
  for (const entry of entries) {
    const proj = data.projects.find(p => p.id === entry.projectId);
    console.log(chalk.blue(`  ${entry.version}`) + chalk.white(` — ${entry.title}`) + chalk.gray(` (${formatTimeAgoCli(entry.createdAt)})${proj ? ' [' + proj.name + ']' : ''}`));
    if (entry.changes.length > 0) { entry.changes.forEach(c => console.log(chalk.gray(`    • ${c}`))); }
  }
  console.log();
}

// ─── Status Command ─────────────────────────────────────────────────────────

program
  .command('status')
  .alias('s')
  .description('Show task & project summary')
  .action(() => {
    const data = loadData();
    showBanner();
    console.log(chalk.white('📊 Status Overview\n'));

    // Projects
    console.log(chalk.cyan(`  Projects: ${data.projects.length}`));
    for (const p of data.projects) {
      const pt = data.tasks.filter(t => t.projectId === p.id);
      const done = pt.filter(t => t.column === 'done').length;
      const pct = pt.length > 0 ? Math.round((done / pt.length) * 100) : 0;
      console.log(chalk.gray(`    📦 ${padRight(p.name, 20)} ${progressBar(pct)} ${done}/${pt.length} (${pct}%)`));
    }

    // Tasks
    const total = data.tasks.length;
    const byCol: Record<string, number> = { backlog: 0, 'in-progress': 0, review: 0, done: 0 };
    data.tasks.forEach(t => { byCol[t.column] = (byCol[t.column] || 0) + 1; });
    console.log(); console.log(chalk.white(`  Tasks: ${total}`));
    console.log(chalk.gray(`    ⚪ Backlog:     ${byCol.backlog}`));
    console.log(chalk.blue(`    🔵 In Progress: ${byCol['in-progress']}`));
    console.log(chalk.yellow(`    🟡 Review:      ${byCol.review}`));
    console.log(chalk.green(`    🟢 Done:        ${byCol.done}`));

    // Deploys
    if (data.deployments.length > 0) {
      console.log(); console.log(chalk.white(`  Deployments: ${data.deployments.length}`));
      const latest = data.deployments[0];
      const sc = STATUS_COLORS[latest.status] || chalk.white;
      console.log(chalk.gray(`    Latest: ${latest.env} — ${sc(latest.status)} — ${latest.message} (${formatTimeAgoCli(latest.startedAt)})`));
    }

    // Agents
    const agentCounts: Record<string, number> = {};
    data.tasks.forEach(t => { if (t.agent) agentCounts[t.agent] = (agentCounts[t.agent] || 0) + 1; });
    const agentNames = Object.keys(agentCounts);
    if (agentNames.length > 0) {
      console.log(); console.log(chalk.white(`  Active Agents: ${agentNames.length}`));
      for (const agent of agentNames.sort()) { console.log(chalk.gray(`    🤖 ${padRight(agent, 16)} ${agentCounts[agent]} tasks`)); }
    }

    // Dashboard
    console.log();
    if (isDashboardRunning()) { console.log(chalk.green(`  🚀 Dashboard: RUNNING at http://localhost:${DEFAULT_PORT}`)); }
    else { console.log(chalk.gray(`  ⚫ Dashboard: not running (start with: codymaster dashboard)`)); }
    console.log();
  });

function progressBar(pct: number): string {
  const total = 12; const filled = Math.round((pct / 100) * total);
  return chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(total - filled));
}

function formatTimeAgoCli(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(ms / 60000), h = Math.floor(ms / 3600000), d = Math.floor(ms / 86400000);
  if (m < 1) return 'just now'; if (m < 60) return `${m}m ago`; if (h < 24) return `${h}h ago`;
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Install Command ────────────────────────────────────────────────────────

program
  .command('install <skill>')
  .description('Install an agent skill')
  .option('-p, --platform <platform>', 'Target platform (gemini|claude|cursor|windsurf|cline)')
  .action(async (skill, opts) => {
    console.log(chalk.blue(`Installing skill: ${skill}...`));
    if (!opts.platform) {
      const prompts = (await import('prompts')).default;
      const response = await prompts({
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
    console.log(chalk.green(`\n✅ Skill '${skill}' installed for ${opts.platform}!`));
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
      case 'status': case undefined:
        continuityStatus(projectPath);
        break;
      case 'reset':
        continuityReset(projectPath);
        break;
      case 'learnings': case 'learn':
        continuityLearnings(projectPath);
        break;
      case 'decisions': case 'dec':
        continuityDecisions(projectPath);
        break;
      default:
        console.log(chalk.red(`Unknown: ${cmd}`));
        console.log(chalk.gray('Available: init, status, reset, learnings, decisions'));
    }
  });

function continuityInit(projectPath: string) {
  if (hasCmDir(projectPath)) {
    console.log(chalk.yellow('⚠️  .cm/ directory already exists.'));
    console.log(chalk.gray(`   Path: ${projectPath}/.cm/`));
    return;
  }
  ensureCmDir(projectPath);
  console.log(chalk.green('✅ Working memory initialized!'));
  console.log(chalk.gray(`   Created: ${projectPath}/.cm/`));
  console.log(chalk.gray('   ├── CONTINUITY.md     (working memory)'));
  console.log(chalk.gray('   ├── config.yaml       (RARV settings)'));
  console.log(chalk.gray('   └── memory/'));
  console.log(chalk.gray('       ├── learnings.json (error patterns)'));
  console.log(chalk.gray('       └── decisions.json (architecture decisions)'));
  console.log();
  console.log(chalk.cyan('💡 Protocol: Read CONTINUITY.md at session start, update at session end.'));
}

function continuityStatus(projectPath: string) {
  const status = getContinuityStatus(projectPath);
  if (!status.initialized) {
    console.log(chalk.yellow('⚫ Working memory not initialized.'));
    console.log(chalk.gray('   Run: codymaster continuity init'));
    return;
  }

  console.log(chalk.cyan('\n🧠 Working Memory Status\n'));
  console.log(`  ${chalk.white('Project:')}     ${status.project}`);
  console.log(`  ${chalk.white('Phase:')}       ${phaseColor(status.phase)(status.phase)}`);
  console.log(`  ${chalk.white('Iteration:')}   ${status.iteration}`);
  if (status.activeGoal) {
    console.log(`  ${chalk.white('Goal:')}        ${status.activeGoal}`);
  }
  if (status.currentTask) {
    console.log(`  ${chalk.white('Task:')}        ${status.currentTask}`);
  }
  console.log();
  console.log(chalk.gray(`  ✅ Completed: ${status.completedCount}  |  🚧 Blockers: ${status.blockerCount}`));
  console.log(chalk.gray(`  📚 Learnings: ${status.learningCount}  |  📋 Decisions: ${status.decisionCount}`));
  if (status.lastUpdated) {
    console.log(chalk.gray(`  🕐 Updated:   ${formatTimeAgoCli(status.lastUpdated)}`));
  }
  console.log();
}

function phaseColor(phase: string): (s: string) => string {
  const colors: Record<string, (s: string) => string> = {
    planning: chalk.blue, executing: chalk.yellow, testing: chalk.magenta,
    deploying: chalk.green, reviewing: chalk.cyan, idle: chalk.gray,
  };
  return colors[phase] || chalk.white;
}

function continuityReset(projectPath: string) {
  if (!hasCmDir(projectPath)) {
    console.log(chalk.yellow('⚠️  No .cm/ directory found.'));
    return;
  }
  resetContinuity(projectPath);
  console.log(chalk.green('✅ Working memory reset.'));
  console.log(chalk.gray('   CONTINUITY.md cleared. Learnings preserved.'));
}

function continuityLearnings(projectPath: string) {
  if (!hasCmDir(projectPath)) {
    console.log(chalk.yellow('⚠️  No .cm/ directory found. Run: codymaster continuity init'));
    return;
  }
  const learnings = getLearnings(projectPath);
  if (learnings.length === 0) {
    console.log(chalk.gray('\n  No learnings captured yet. 🎉\n'));
    return;
  }
  console.log(chalk.cyan(`\n📚 Mistakes & Learnings (${learnings.length})\n`));
  for (const l of learnings.slice(-10)) {
    console.log(chalk.red(`  ❌ ${l.whatFailed}`));
    console.log(chalk.gray(`     Why: ${l.whyFailed}`));
    console.log(chalk.green(`     Fix: ${l.howToPrevent}`));
    console.log(chalk.gray(`     ${formatTimeAgoCli(l.timestamp)} | ${l.agent || 'unknown'}\n`));
  }
}

function continuityDecisions(projectPath: string) {
  if (!hasCmDir(projectPath)) {
    console.log(chalk.yellow('⚠️  No .cm/ directory found. Run: codymaster continuity init'));
    return;
  }
  const decisions = getDecisions(projectPath);
  if (decisions.length === 0) {
    console.log(chalk.gray('\n  No decisions recorded yet.\n'));
    return;
  }
  console.log(chalk.cyan(`\n📋 Key Decisions (${decisions.length})\n`));
  for (const d of decisions.slice(-10)) {
    console.log(chalk.white(`  📌 ${d.decision}`));
    console.log(chalk.gray(`     Rationale: ${d.rationale}`));
    console.log(chalk.gray(`     ${formatTimeAgoCli(d.timestamp)} | ${d.agent || 'unknown'}\n`));
  }
}

// ─── Parse ──────────────────────────────────────────────────────────────────

program.parse(process.argv);
