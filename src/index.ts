#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import crypto from 'crypto';
import fs from 'fs';
import { exec } from 'child_process';
import { loadData, saveData, logActivity, findProjectByNameOrId, findTaskByIdPrefix, shortId, DATA_FILE, DATA_DIR, PID_FILE, DEFAULT_PORT } from './data';
import type { Project, Task, Deployment, ChangelogEntry } from './data';
import { launchDashboard } from './dashboard';
import { dispatchTaskToAgent, validateDispatch } from './agent-dispatch';
import { ensureCmDir, getContinuityStatus, getLearnings, getDecisions, resetContinuity, hasCmDir, readContinuityState } from './continuity';
import { evaluateAllTasks, evaluateTaskState, suggestAgentsForSkill, suggestAgentsForTask, getSkillDomain } from './judge';
import type { Learning } from './continuity';
import path from 'path';

const VERSION = '3.2.0';

// ─── Branding ───────────────────────────────────────────────────────────────

function showBanner() {
  console.log(chalk.cyan(`
   ██████╗ ██████╗  ██████╗  ██╗   ██╗
  ██╔════╝██╔═══██╗██╔══██╗ ╚██╗ ██╔╝   Cody v${VERSION}
  ██║     ██║   ██║██║  ██║  ╚████╔╝    Universal AI Agent Skills Platform
  ██║     ██║   ██║██║  ██║   ╚██╔╝     Dashboard: http://localhost:${DEFAULT_PORT}
  ╚██████╗╚██████╔╝██████╔╝    ██║
   ╚═════╝ ╚═════╝ ╚═════╝     ╚═╝
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
  .name('cody')
  .description('Cody — Universal AI Agent Skills Platform')
  .version(VERSION, '-v, --version', 'Show version')
  .action(() => {
    showBanner();
    console.log(chalk.white('Usage: cody <command> [options]\n'));
    console.log(chalk.white('Core Commands:'));
    console.log(`  ${chalk.cyan('dashboard [cmd]')}     Dashboard server (start|stop|status|open)`);
    console.log(`  ${chalk.cyan('open')}                Open dashboard in browser (shortcut)`);
    console.log(`  ${chalk.cyan('init')}                Initialize project from current directory`);
    console.log(`  ${chalk.cyan('status')}              Show task & project summary`);
    console.log();
    console.log(chalk.white('Task & Project:'));
    console.log(`  ${chalk.cyan('task <cmd>')}          Task management (add|list|move|done|rm|dispatch)`);
    console.log(`  ${chalk.cyan('project <cmd>')}       Project management (add|list|rm)`);
    console.log(`  ${chalk.cyan('sync <file>')}         Bulk import tasks from JSON file`);
    console.log();
    console.log(chalk.white('Deploy & Release:'));
    console.log(`  ${chalk.cyan('deploy <cmd>')}        Deploy management (staging|production|list)`);
    console.log(`  ${chalk.cyan('rollback <id>')}       Rollback a deployment`);
    console.log(`  ${chalk.cyan('changelog <cmd>')}     Changelog (add|list)`);
    console.log(`  ${chalk.cyan('history')}             Show activity history`);
    console.log();
    console.log(chalk.white('AI & Skills:'));
    console.log(`  ${chalk.cyan('skill <cmd>')}         Skill management (list|info|domains)`);
    console.log(`  ${chalk.cyan('agents [skill]')}      List agents / suggest best for skill`);
    console.log(`  ${chalk.cyan('judge [task-id]')}     Judge agent decisions for tasks`);
    console.log(`  ${chalk.cyan('install <skill>')}     Install an agent skill`);
    console.log();
    console.log(chalk.white('System:'));
    console.log(`  ${chalk.cyan('continuity [cmd]')}    Working memory (init|status|reset|learnings)`);
    console.log(`  ${chalk.cyan('config')}              Show configuration & data paths`);
    console.log(`  ${chalk.cyan('version')}             Show version`);
    console.log(`  ${chalk.cyan('help')}                Show this help`);
    console.log();
    console.log(chalk.white('Examples:'));
    console.log(chalk.gray('  cody init                                    # Init project'));
    console.log(chalk.gray('  cody task add "Fix bug" --priority high       # Add task'));
    console.log(chalk.gray('  cody task dispatch <id>                      # Dispatch to agent'));
    console.log(chalk.gray('  cody skill list                              # Browse skills'));
    console.log(chalk.gray('  cody agents cm-tdd                           # Best agents for skill'));
    console.log(chalk.gray('  cody judge                                   # Check task health'));
    console.log(chalk.gray('  cody deploy staging -m "Fix login"           # Record deploy'));
    console.log(chalk.gray('  cody open                                    # Open dashboard'));
    console.log(chalk.gray('  cody status                                  # Overview'));
    console.log();
    console.log(chalk.gray(`Data: ${DATA_FILE}`));
    console.log(chalk.gray(`Port: ${DEFAULT_PORT}`));
    console.log(chalk.gray(`Aliases: cody | cm | codymaster\n`));
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
  } else { console.log(chalk.yellow('⚫ Dashboard NOT running')); console.log(chalk.gray('   Start with: cody dashboard start')); }
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
      case 'stuck': taskStuck(opts); break;
      default: console.log(chalk.red(`Unknown: ${cmd}`)); console.log(chalk.gray('Available: add, list, move, done, rm, dispatch, stuck'));
    }
  });

function taskAdd(title: string, opts: any) {
  if (!title) { console.log(chalk.red('❌ Title required. Usage: cody task add "My task"')); return; }
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
  if (!idPrefix || !targetColumn) { console.log(chalk.red('❌ Usage: cody task move <id> <column>')); return; }
  const vc = ['backlog', 'in-progress', 'review', 'done'];
  if (!vc.includes(targetColumn)) { console.log(chalk.red(`❌ Invalid column: ${targetColumn}. Valid: ${vc.join(', ')}`)); return; }
  const data = loadData();
  const task = findTaskByIdPrefix(data, idPrefix);
  if (!task) { console.log(chalk.red(`❌ Task not found: ${idPrefix}`)); return; }
  const oldCol = task.column;

  // Validate transition
  const VALID_TRANSITIONS: Record<string, string[]> = {
    'backlog': ['in-progress'],
    'in-progress': ['review', 'done', 'backlog'],
    'review': ['done', 'in-progress'],
    'done': ['backlog'],
  };
  const allowed = VALID_TRANSITIONS[oldCol] || [];
  if (oldCol !== targetColumn && !allowed.includes(targetColumn)) {
    console.log(chalk.red(`❌ Invalid transition: ${oldCol} → ${targetColumn}`));
    console.log(chalk.gray(`   Allowed transitions: ${allowed.join(', ')}`));
    return;
  }
  if (oldCol === targetColumn) {
    console.log(chalk.gray(`  Task already in ${targetColumn}.`));
    return;
  }

  task.column = targetColumn as Task['column'];
  task.updatedAt = new Date().toISOString();
  task.stuckSince = undefined;
  logActivity(data, targetColumn === 'done' ? 'task_done' : 'task_transitioned', `Task "${task.title}" moved: ${oldCol} → ${targetColumn} (CLI)`, task.projectId, task.agent, { from: oldCol, to: targetColumn });
  saveData(data);
  console.log(chalk.green(`✅ Moved "${task.title}"`));
  console.log(chalk.gray(`   ${oldCol} → `) + (COL_COLORS[targetColumn] || chalk.white)(targetColumn));
}

function taskStuck(opts: any) {
  const data = loadData();
  const thresholdMin = 30;
  const now = Date.now();
  let tasks = data.tasks.filter(t => t.column === 'in-progress');
  if (opts.project) {
    const project = findProjectByNameOrId(data, opts.project);
    if (!project) { console.log(chalk.red(`❌ Project not found: ${opts.project}`)); return; }
    tasks = tasks.filter(t => t.projectId === project.id);
  }
  const stuck = tasks.filter(t => {
    const elapsed = now - new Date(t.updatedAt).getTime();
    return elapsed > thresholdMin * 60 * 1000;
  }).sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());

  if (stuck.length === 0) {
    console.log(chalk.green(`\n  ✅ No stuck tasks! All in-progress tasks updated within ${thresholdMin}m.\n`));
    return;
  }

  console.log(chalk.yellow(`\n⚠️  ${stuck.length} Stuck Tasks (>${thresholdMin}m in progress)\n`));
  console.log(chalk.gray('  ' + padRight('ID', 10) + padRight('Title', 36) + padRight('Stuck For', 12) + padRight('Agent', 14) + 'Priority'));
  console.log(chalk.gray('  ' + '─'.repeat(86)));
  for (const task of stuck) {
    const elapsed = now - new Date(task.updatedAt).getTime();
    const minutes = Math.round(elapsed / 60000);
    const timeStr = minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    const project = data.projects.find(p => p.id === task.projectId);
    const pc = PRIORITY_COLORS[task.priority] || chalk.white;
    console.log('  ' + chalk.gray(padRight(shortId(task.id), 10)) + padRight(task.title.substring(0, 34), 36) + chalk.yellow(padRight(timeStr, 12)) + chalk.gray(padRight(task.agent || '—', 14)) + pc(task.priority));
  }
  console.log();
  console.log(chalk.gray('  Tip: Move tasks with: cody task move <id> review|done|backlog'));
  console.log();
}

function taskDone(idPrefix: string) {
  if (!idPrefix) { console.log(chalk.red('❌ Usage: cody task done <id>')); return; }
  taskMove(idPrefix, 'done');
}

function taskRemove(idPrefix: string) {
  if (!idPrefix) { console.log(chalk.red('❌ Usage: cody task rm <id>')); return; }
  const data = loadData();
  const idx = data.tasks.findIndex(t => t.id === idPrefix || t.id.startsWith(idPrefix));
  if (idx === -1) { console.log(chalk.red(`❌ Task not found: ${idPrefix}`)); return; }
  const [removed] = data.tasks.splice(idx, 1);
  logActivity(data, 'task_deleted', `Task "${removed.title}" deleted via CLI`, removed.projectId, removed.agent);
  saveData(data);
  console.log(chalk.green(`✅ Deleted: "${removed.title}" (${shortId(removed.id)})`));
}

function taskDispatch(idPrefix: string, opts: any) {
  if (!idPrefix) { console.log(chalk.red('❌ Usage: cody task dispatch <id> [--force]')); return; }
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
  if (!name) { console.log(chalk.red('❌ Usage: cody project add "my-project"')); return; }
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
  if (!query) { console.log(chalk.red('❌ Usage: cody project rm <name-or-id>')); return; }
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
  else { console.log(chalk.red('❌ No projects. Create one first: cody project add "my-project"')); return; }

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
  if (args.length < 2) { console.log(chalk.red('❌ Usage: cody changelog add <version> "<title>" [changes...]')); return; }
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
    else { console.log(chalk.gray(`  ⚫ Dashboard: not running (start with: cody dashboard)`)); }
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
    console.log(chalk.gray('   Run: cody continuity init'));
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
    console.log(chalk.yellow('⚠️  No .cm/ directory found. Run: cody continuity init'));
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
    console.log(chalk.yellow('⚠️  No .cm/ directory found. Run: cody continuity init'));
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

// ─── Skill Command ──────────────────────────────────────────────────────────

const SKILL_CATALOG: Record<string, { skills: { name: string; desc: string }[] }> = {
  engineering: {
    skills: [
      { name: 'cm-tdd', desc: 'Red-Green-Refactor cycle — test before code' },
      { name: 'cm-debugging', desc: '5-phase root cause investigation' },
      { name: 'cm-quality-gate', desc: '6-gate verification system' },
      { name: 'cm-test-gate', desc: 'Setup 4-layer test infrastructure' },
      { name: 'cm-code-review', desc: 'Professional PR review lifecycle' },
    ],
  },
  operations: {
    skills: [
      { name: 'cm-safe-deploy', desc: 'Multi-gate deploy pipeline with rollback' },
      { name: 'cm-identity-guard', desc: 'Prevent wrong-account deploys' },
      { name: 'cm-git-worktrees', desc: 'Isolated feature branches' },
      { name: 'cm-terminal', desc: 'Safe terminal execution with logging' },
    ],
  },
  product: {
    skills: [
      { name: 'cm-planning', desc: 'Brainstorm intent → design → plan' },
      { name: 'cm-ux-master', desc: '48 UX Laws + 37 Design Tests' },
      { name: 'cm-dockit', desc: 'Complete knowledge base from codebase' },
      { name: 'cm-project-bootstrap', desc: 'Full project setup: design → CI → deploy' },
    ],
  },
  growth: {
    skills: [
      { name: 'cm-content-factory', desc: 'AI content engine: research → deploy' },
      { name: 'cm-ads-tracker', desc: 'Facebook/TikTok/Google tracking setup' },
      { name: 'cro-methodology', desc: 'Conversion audit + A/B test design' },
      { name: 'booking-calendar', desc: 'Calendar CRO engine with .ics export' },
    ],
  },
  orchestration: {
    skills: [
      { name: 'cm-execution', desc: 'Execute plans: batch, parallel, RARV' },
      { name: 'cm-continuity', desc: 'Working memory: read/update per session' },
      { name: 'cm-skill-index', desc: 'Progressive disclosure — scan skills fast' },
      { name: 'cm-safe-i18n', desc: 'Multi-pass translation with 8 audit gates' },
      { name: 'cm-skill-mastery', desc: 'Meta: when/how to invoke skills' },
    ],
  },
};

program
  .command('skill [cmd] [name]')
  .alias('sk')
  .description('Skill management (list|info|domains)')
  .action((cmd, name) => {
    switch (cmd) {
      case 'list': case 'ls': case undefined:
        skillList();
        break;
      case 'info':
        if (!name) { console.log(chalk.red('❌ Usage: cody skill info <skill-name>')); return; }
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

function skillList() {
  console.log(chalk.cyan('\n🧩 Skills Library\n'));
  const DOMAIN_ICONS: Record<string, string> = {
    engineering: '🔧', operations: '⚙️', product: '🎨', growth: '📈', orchestration: '🎯',
  };
  let total = 0;
  for (const [domain, data] of Object.entries(SKILL_CATALOG)) {
    const icon = DOMAIN_ICONS[domain] || '📦';
    console.log(chalk.white(`  ${icon} ${domain.charAt(0).toUpperCase() + domain.slice(1)} Swarm`));
    for (const skill of data.skills) {
      console.log(`    ${chalk.cyan(padRight(skill.name, 24))} ${chalk.gray(skill.desc)}`);
      total++;
    }
    console.log();
  }
  console.log(chalk.gray(`  Total: ${total} skills across ${Object.keys(SKILL_CATALOG).length} domains\n`));
}

function skillInfo(name: string) {
  for (const [domain, data] of Object.entries(SKILL_CATALOG)) {
    const skill = data.skills.find(s => s.name === name);
    if (skill) {
      console.log(chalk.cyan(`\n🧩 Skill: ${skill.name}\n`));
      console.log(`  ${chalk.white('Domain:')}      ${domain}`);
      console.log(`  ${chalk.white('Description:')} ${skill.desc}`);
      const agents = suggestAgentsForSkill(skill.name);
      console.log(`  ${chalk.white('Best Agents:')} ${agents.join(', ')}`);
      console.log(`  ${chalk.white('Invoke:')}      @[/${skill.name}]  (Antigravity/Gemini)`);
      console.log(`               /${skill.name}  (Claude Code)`);
      console.log(`               @${skill.name}  (Cursor/Windsurf/Cline)`);
      console.log();
      return;
    }
  }
  console.log(chalk.red(`❌ Skill not found: ${name}`));
  console.log(chalk.gray('   Use "cody skill list" to see all available skills.'));
}

function skillDomains() {
  const DOMAIN_ICONS: Record<string, string> = {
    engineering: '🔧', operations: '⚙️', product: '🎨', growth: '📈', orchestration: '🎯',
  };
  console.log(chalk.cyan('\n🎯 Skill Domains (Swarms)\n'));
  for (const [domain, data] of Object.entries(SKILL_CATALOG)) {
    const icon = DOMAIN_ICONS[domain] || '📦';
    console.log(`  ${icon} ${chalk.white(padRight(domain.charAt(0).toUpperCase() + domain.slice(1), 16))} ${chalk.gray(`${data.skills.length} skills`)}`);
  }
  console.log();
}

// ─── Judge Command ──────────────────────────────────────────────────────────

program
  .command('judge [taskId]')
  .alias('j')
  .description('Judge agent decisions for tasks')
  .option('-p, --project <name>', 'Filter by project')
  .action((taskId, opts) => {
    const data = loadData();
    if (taskId) {
      // Single task evaluation
      const task = findTaskByIdPrefix(data, taskId);
      if (!task) { console.log(chalk.red(`❌ Task not found: ${taskId}`)); return; }

      const project = data.projects.find(p => p.id === task.projectId);
      let learnings: Learning[] = [];
      if (project?.path && hasCmDir(project.path)) {
        learnings = getLearnings(project.path);
      }

      const decision = evaluateTaskState(task, data.tasks, learnings);
      console.log(chalk.cyan(`\n🤖 Judge Decision\n`));
      console.log(`  ${chalk.white('Task:')}       ${task.title}`);
      console.log(`  ${chalk.white('Column:')}     ${task.column}`);
      console.log(`  ${chalk.white('Action:')}     ${decision.badge} ${decision.action}`);
      console.log(`  ${chalk.white('Reason:')}     ${decision.reason}`);
      console.log(`  ${chalk.white('Confidence:')} ${Math.round(decision.confidence * 100)}%`);
      if (decision.suggestedNextSkill) {
        console.log(`  ${chalk.white('Suggested:')}  ${decision.suggestedNextSkill}`);
      }
      console.log();
    } else {
      // All active tasks
      let tasks = data.tasks;
      if (opts.project) {
        const project = findProjectByNameOrId(data, opts.project);
        if (!project) { console.log(chalk.red(`❌ Project not found: ${opts.project}`)); return; }
        tasks = tasks.filter(t => t.projectId === project.id);
      }

      let allLearnings: Learning[] = [];
      for (const project of data.projects) {
        if (project.path && hasCmDir(project.path)) {
          allLearnings = allLearnings.concat(getLearnings(project.path));
        }
      }

      const decisions = evaluateAllTasks(tasks, allLearnings);
      if (decisions.size === 0) {
        console.log(chalk.gray('\n  No active tasks to evaluate.\n'));
        return;
      }

      console.log(chalk.cyan(`\n🤖 Judge Decisions (${decisions.size} active tasks)\n`));
      console.log(chalk.gray('  ' + padRight('Badge', 8) + padRight('Action', 12) + padRight('Confidence', 12) + 'Task'));
      console.log(chalk.gray('  ' + '─'.repeat(70)));

      for (const [tid, dec] of decisions) {
        const task = tasks.find(t => t.id === tid);
        const actionColor = dec.action === 'CONTINUE' ? chalk.green
          : dec.action === 'COMPLETE' ? chalk.blue
          : dec.action === 'ESCALATE' ? chalk.yellow
          : chalk.magenta;
        console.log('  ' + padRight(dec.badge, 8) + actionColor(padRight(dec.action, 12)) + chalk.gray(padRight(`${Math.round(dec.confidence * 100)}%`, 12)) + (task?.title || tid.substring(0, 8)));
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
    const data = loadData();
    const projectName = opts.name || path.basename(opts.path || process.cwd());
    const projectPath = opts.path || process.cwd();

    // Check if already exists
    const existing = data.projects.find(p => p.path === projectPath || p.name === projectName);
    if (existing) {
      console.log(chalk.yellow(`⚠️  Project already exists: ${existing.name}`));
      console.log(chalk.gray(`   ID: ${shortId(existing.id)} | Path: ${existing.path}`));
      return;
    }

    const project: Project = {
      id: crypto.randomUUID(),
      name: projectName,
      path: projectPath,
      agents: [],
      createdAt: new Date().toISOString(),
    };
    data.projects.push(project);
    logActivity(data, 'project_created', `Project "${project.name}" initialized via CLI`, project.id);
    saveData(data);

    // Also init working memory
    ensureCmDir(projectPath);

    console.log(chalk.green(`\n✅ Project initialized: ${projectName}`));
    console.log(chalk.gray(`   ID:   ${shortId(project.id)}`));
    console.log(chalk.gray(`   Path: ${projectPath}`));
    console.log(chalk.gray(`   .cm/  Working memory created`));
    console.log();
    console.log(chalk.cyan('💡 Next steps:'));
    console.log(chalk.gray('   cody task add "My first task"'));
    console.log(chalk.gray('   cody dashboard start'));
    console.log(chalk.gray('   cody open'));
    console.log();
  });

// ─── Open Command ───────────────────────────────────────────────────────────

program
  .command('open')
  .alias('o')
  .description('Open dashboard in browser')
  .option('-p, --port <port>', 'Port number', String(DEFAULT_PORT))
  .action((opts) => {
    const port = parseInt(opts.port) || DEFAULT_PORT;
    if (!isDashboardRunning()) {
      console.log(chalk.yellow('⚠️  Dashboard not running. Starting it first...'));
      launchDashboard(port);
      setTimeout(() => openUrl(`http://localhost:${port}`), 1500);
    } else {
      console.log(chalk.blue(`🌐 Opening http://localhost:${port} ...`));
      openUrl(`http://localhost:${port}`);
    }
  });

// ─── Config Command ─────────────────────────────────────────────────────────

program
  .command('config')
  .alias('cfg')
  .description('Show configuration & data paths')
  .action(() => {
    console.log(chalk.cyan(`\n⚙️  Cody Configuration\n`));
    console.log(`  ${chalk.white('Version:')}    ${VERSION}`);
    console.log(`  ${chalk.white('Data Dir:')}   ${DATA_DIR}`);
    console.log(`  ${chalk.white('Data File:')}  ${DATA_FILE}`);
    console.log(`  ${chalk.white('PID File:')}   ${PID_FILE}`);
    console.log(`  ${chalk.white('Port:')}       ${DEFAULT_PORT}`);
    console.log(`  ${chalk.white('CLI Names:')}  cody | cm | codymaster`);
    console.log();

    // Show data stats
    const data = loadData();
    console.log(chalk.white('  Data Stats:'));
    console.log(chalk.gray(`    Projects:    ${data.projects.length}`));
    console.log(chalk.gray(`    Tasks:       ${data.tasks.length}`));
    console.log(chalk.gray(`    Deploys:     ${data.deployments.length}`));
    console.log(chalk.gray(`    Activities:  ${data.activities.length}`));
    console.log(chalk.gray(`    Changelog:   ${data.changelog.length}`));
    console.log();

    // Dashboard status
    if (isDashboardRunning()) {
      console.log(chalk.green(`  🚀 Dashboard: RUNNING at http://localhost:${DEFAULT_PORT}`));
    } else {
      console.log(chalk.gray(`  ⚫ Dashboard: not running`));
    }
    console.log();
  });

// ─── Agents Command ─────────────────────────────────────────────────────────

const AGENT_LIST: { id: string; name: string; icon: string }[] = [
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
      const domain = getSkillDomain(skill);
      const agents = suggestAgentsForSkill(skill);
      console.log(chalk.cyan(`\n🤖 Agent Suggestions for ${chalk.white(skill)}\n`));
      console.log(chalk.gray(`   Domain: ${domain}\n`));
      agents.forEach((agentId, index) => {
        const agent = AGENT_LIST.find(a => a.id === agentId);
        const affinity = index === 0 ? chalk.green('★ BEST') : index === 1 ? chalk.yellow('● GOOD') : chalk.gray('○ OK');
        console.log(`  ${agent?.icon || '🤖'} ${padRight(agent?.name || agentId, 24)} ${affinity}`);
      });
      console.log();
    } else {
      // List all agents
      console.log(chalk.cyan('\n🤖 Available Agents\n'));
      for (const agent of AGENT_LIST) {
        console.log(`  ${agent.icon} ${chalk.white(padRight(agent.name, 24))} ${chalk.gray(agent.id)}`);
      }
      console.log();
      console.log(chalk.gray('  💡 Tip: cody agents <skill-name> to see best agents for a skill'));
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
    const filePath = path.resolve(file);
    if (!fs.existsSync(filePath)) {
      console.log(chalk.red(`❌ File not found: ${filePath}`));
      return;
    }

    let tasks: any[];
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      tasks = Array.isArray(parsed) ? parsed : parsed.tasks;
      if (!Array.isArray(tasks)) throw new Error('Invalid format');
    } catch (err: any) {
      console.log(chalk.red(`❌ Invalid JSON file: ${err.message}`));
      console.log(chalk.gray('   Expected format: [{"title": "...", "priority": "...", "column": "..."}]'));
      return;
    }

    const data = loadData();
    let projectId: string | undefined;
    if (opts.project) {
      const p = findProjectByNameOrId(data, opts.project);
      if (!p) { console.log(chalk.red(`❌ Project not found: ${opts.project}`)); return; }
      projectId = p.id;
    } else if (data.projects.length > 0) {
      projectId = data.projects[0].id;
    } else {
      const dp: Project = { id: crypto.randomUUID(), name: 'Default Project', path: process.cwd(), agents: [], createdAt: new Date().toISOString() };
      data.projects.push(dp);
      projectId = dp.id;
    }

    const now = new Date().toISOString();
    let count = 0;
    for (const t of tasks) {
      const col = t.column || 'backlog';
      const ct = data.tasks.filter(tk => tk.column === col && tk.projectId === projectId);
      const mo = ct.length > 0 ? Math.max(...ct.map(tk => tk.order)) : -1;
      const task: Task = {
        id: crypto.randomUUID(), projectId: projectId!,
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

    logActivity(data, 'task_created', `Synced ${count} tasks from ${path.basename(filePath)}`, projectId!, opts.agent || '', { count, file: filePath });
    saveData(data);

    const project = data.projects.find(p => p.id === projectId);
    console.log(chalk.green(`\n✅ Synced ${count} tasks!`));
    console.log(chalk.gray(`   Project: ${project?.name || 'Default'}`));
    console.log(chalk.gray(`   Source:  ${filePath}`));
    if (opts.agent) console.log(chalk.gray(`   Agent:   ${opts.agent}`));
    console.log();
  });

// ─── Parse ──────────────────────────────────────────────────────────────────

program.parse(process.argv);
