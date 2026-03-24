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
import { ensureCmDir, getContinuityStatus, getLearnings, getDecisions, resetContinuity, hasCmDir, readContinuityState, deleteLearning, deleteDecision } from './continuity';
import { evaluateAllTasks, evaluateTaskState, suggestAgentsForSkill, suggestAgentsForTask, getSkillDomain, suggestChain } from './judge';
import type { Learning } from './continuity';
import { listChains, findChain, matchChain, createChainExecution, advanceChain as advanceChainStep, skipChainStep, abortChain, formatChainProgress, formatChainProgressBar, getCurrentSkill } from './skill-chain';
import type { ChainExecution } from './skill-chain';
import path from 'path';
import os from 'os';
import https from 'https';

// 🐹 Hamster Shell UI modules
import { brand, brandBold, dim, muted, success, error, warning, info, COL, PRI, STATUS, ICONS } from './ui/theme';
import { renderBox, renderTable, renderProgressBar, renderBadge, renderPriority, renderFooter, renderDivider, renderSpeechBubble, renderCommandHeader, renderKeyValue, renderResult, stripAnsi } from './ui/box';
import type { TableColumn } from './ui/box';
import { getHamsterArt, renderHamsterBanner, renderHamsterMessage, getCelebration, getEncouragement, getErrorGuidance } from './ui/hamster';
import { loadProfile, saveProfile, isFirstRun, recordCommand, checkAchievements, formatAchievement, getContextualTrigger, formatProfileSummary, getLevelDisplay } from './ui/hooks';
import { runOnboarding, showReturningWelcome } from './ui/onboarding';

const VERSION = require('../package.json').version;

// ─── Update Check ───────────────────────────────────────────────────────────

let _updateMessage = '';

async function checkForUpdates(): Promise<void> {
  try {
    const cacheDir = path.join(os.homedir(), '.codymaster');
    const cacheFile = path.join(cacheDir, '.update-check');

    // Check cache (24h TTL)
    try {
      if (fs.existsSync(cacheFile)) {
        const stat = fs.statSync(cacheFile);
        const age = Date.now() - stat.mtimeMs;
        if (age < 24 * 60 * 60 * 1000) {
          const cached = fs.readFileSync(cacheFile, 'utf-8').trim();
          if (cached && cached !== VERSION) {
            _updateMessage = cached;
          }
          return;
        }
      }
    } catch { /* ignore cache errors */ }

    // Fetch latest version from npm (2s timeout)
    const latestVersion = await new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('timeout')), 2000);
      https.get('https://registry.npmjs.org/codymaster/latest', { headers: { 'Accept': 'application/json' } }, (res) => {
        let data = '';
        res.on('data', (chunk: Buffer) => { data += chunk; });
        res.on('end', () => {
          clearTimeout(timer);
          try {
            const json = JSON.parse(data);
            resolve(json.version || VERSION);
          } catch { resolve(VERSION); }
        });
      }).on('error', () => { clearTimeout(timer); reject(new Error('fetch failed')); });
    });

    // Cache result
    try {
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
      fs.writeFileSync(cacheFile, latestVersion);
    } catch { /* ignore */ }

    if (latestVersion !== VERSION) {
      _updateMessage = latestVersion;
    }
  } catch { /* silently skip — offline or timeout */ }
}

function printUpdateNotice() {
  if (_updateMessage) {
    console.log(chalk.yellow(`  ⚠️  Update available: ${VERSION} → ${_updateMessage}`) + chalk.gray('  Run: ') + chalk.cyan('npm i -g codymaster'));
  }
}

// ─── Branding ───────────────────────────────────────────────────────────────

function showBanner() {
  const cPath = process.cwd().replace(os.homedir(), '~');
  const profile = loadProfile();
  console.log(renderHamsterBanner(profile.userName || undefined, VERSION, cPath));
  printUpdateNotice();
}

// ─── Utility ────────────────────────────────────────────────────────────────

// Color maps now imported from ./ui/theme (COL, PRI, STATUS)
const COL_COLORS = COL;
const PRIORITY_COLORS = PRI;
const STATUS_COLORS = STATUS;

function padRight(str: string, len: number): string {
  return str.length >= len ? str.substring(0, len) : str + ' '.repeat(len - str.length);
}

function openUrl(url: string) {
  const { execFile } = require('child_process');
  const [cmd, ...args] =
    process.platform === 'darwin' ? ['open', url] :
      process.platform === 'win32' ? ['cmd', '/c', 'start', url] :
        ['xdg-open', url];
  execFile(cmd, args, () => { });
}

// ─── Post-install Onboarding ─────────────────────────────────────────────────

async function postInstallOnboarding(platform: string) {
  // Run the self-onboarding wizard
  const profile = loadProfile();
  if (!profile.onboardingComplete) {
    // Set platform from install if not already set
    if (platform && !profile.platform) {
      profile.platform = platform;
      saveProfile(profile);
    }
    await runOnboarding(VERSION);
  } else {
    // Already onboarded — show returning welcome
    const p = await import('@clack/prompts');
    console.log('');
    console.log(getHamsterArt('celebrating'));
    console.log('');
    console.log(`    ${success('🎉')} ${brandBold(`Welcome back, ${profile.userName || 'friend'}!`)}`);
    console.log('');

    const action = await p.select({
      message: 'What would you like to do?',
      options: [
        { label: `${ICONS.dashboard}  Launch Dashboard`, value: 'dashboard', hint: `localhost:${DEFAULT_PORT}` },
        { label: `${ICONS.skill}  Browse all 34 skills`, value: 'skills' },
        { label: `${ICONS.deploy}  Start with your AI`, value: 'invoke', hint: profile.platform || 'any agent' },
        { label: `${success('✓')}  Done`, value: 'done' },
      ],
    });

    if (p.isCancel(action)) return;

    switch (action) {
      case 'dashboard':
        if (!isDashboardRunning()) {
          launchDashboard(DEFAULT_PORT, false);
          await new Promise(r => setTimeout(r, 800));
        }
        console.log(info(`\n  🌐 Opening http://localhost:${DEFAULT_PORT} ...\n`));
        openUrl(`http://localhost:${DEFAULT_PORT}`);
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
        console.log(`  ${brand('→')} Type ${brandBold(invoke)} in your AI agent\n`);
        break;
      default:
        console.log(dim('\n  Run cm any time! 🐹\n'));
    }
  }
}

// ─── Interactive Quick Menu (no-args entry point) ─────────────────────────────

async function showInteractiveMenu() {
  const profile = loadProfile();

  // 🎳 First Run → Start onboarding wizard
  if (!profile.onboardingComplete) {
    await runOnboarding(VERSION);
    return;
  }

  // 🪝 Hook: Record command + check achievements
  recordCommand(profile, 'menu');
  const newAchievements = checkAchievements(profile);
  saveProfile(profile);

  // Show banner with hamster
  showBanner();

  // 🪝 Hook: Contextual trigger
  const data = loadData();
  const taskCounts = {
    tasksInProgress: data.tasks.filter(t => t.column === 'in-progress').length,
    tasksInReview: data.tasks.filter(t => t.column === 'review').length,
    tasksDone: data.tasks.filter(t => t.column === 'done').length,
    totalTasks: data.tasks.length,
  };
  const trigger = getContextualTrigger(profile, taskCounts);
  console.log(`  ${brand(ICONS.hamster)} ${dim(trigger)}`);

  // Dashboard status
  const dashStatus = isDashboardRunning()
    ? success(`${ICONS.dot} RUNNING`) + dim(` http://localhost:${DEFAULT_PORT}`)
    : muted(`${ICONS.dotEmpty} stopped`);
  console.log(`  ${dim('Dashboard:')} ${dashStatus}`);
  console.log('');

  // Show new achievements
  for (const id of newAchievements) {
    console.log(formatAchievement(id));
  }
  if (newAchievements.length > 0) console.log('');

  // Level indicator
  console.log(`  ${dim('Level:')} ${getLevelDisplay(profile.level)} ${dim('•')} ${dim('Streak:')} ${profile.streak > 0 ? brand(`${ICONS.fire} ${profile.streak}d`) : muted('—')}`);
  console.log('');

  // Quick menu with @clack/prompts
  const p = await import('@clack/prompts');
  const action = await p.select({
    message: 'Quick menu',
    options: [
      { label: `${ICONS.dashboard}  Dashboard`, value: 'dashboard', hint: isDashboardRunning() ? 'Open' : 'Start & open' },
      { label: `${ICONS.task}  My Tasks`, value: 'tasks', hint: `${taskCounts.totalTasks} total` },
      { label: `📈 Status`, value: 'status', hint: 'Health snapshot' },
      { label: `${ICONS.skill}  Browse Skills`, value: 'skills', hint: '34 skills' },
      { label: `➕ Add a Task`, value: 'addtask', hint: 'Quick add' },
      { label: `⚡ Install Skills`, value: 'install', hint: 'Update all' },
      { label: `${ICONS.hamster}  My Profile`, value: 'profile', hint: `${profile.level}` },
      { label: `❓ Help`, value: 'help' },
    ],
  });

  if (p.isCancel(action)) {
    console.log(dim('\n  See you soon! 🐹\n'));
    return;
  }

  console.log('');
  switch (action) {
    case 'dashboard':
      if (!isDashboardRunning()) {
        launchDashboard(DEFAULT_PORT, false);
        await new Promise(r => setTimeout(r, 800));
      }
      console.log(info(`  🌐 Opening http://localhost:${DEFAULT_PORT} ...`));
      openUrl(`http://localhost:${DEFAULT_PORT}`);
      console.log(dim('  Dashboard is running. Ctrl+C to stop.\n'));
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
      const title = await p.text({
        message: 'Task title:',
        placeholder: 'What are you working on?',
        validate: (val: string | undefined) => {
          if (!val || val.trim().length === 0) return 'Give your task a title!';
          return undefined;
        },
      });
      if (!p.isCancel(title) && title) {
        require('child_process').spawnSync(process.execPath, [process.argv[1], 'task', 'add', title as string], { stdio: 'inherit' });
      }
      break;
    }
    case 'install':
      console.log(`  ${brand('→')} Run: ${brandBold('npx codymaster add --all')}\n`);
      break;
    case 'profile':
      console.log(formatProfileSummary(profile));
      break;
    case 'help':
    default: {
      const helpItems = [
        `${brand('cm')}                   ${dim('Quick menu')}`,
        `${brand('cm task add')} ${dim('"..."')}    ${dim('Add a task')}`,
        `${brand('cm task list')}          ${dim('View tasks')}`,
        `${brand('cm status')}             ${dim('Project health')}`,
        `${brand('cm dashboard')}          ${dim('Mission Control')}`,
        `${brand('cm list')}               ${dim('Browse 34 skills')}`,
        `${brand('cm deploy')} ${dim('<env>')}       ${dim('Record deploy')}`,
        `${brand('cm profile')}            ${dim('Your stats')}`,
      ];
      console.log(renderBox(helpItems, { title: 'Commands', width: 52 }));
      console.log('');
    }
  }
}

// ─── Program ────────────────────────────────────────────────────────────────

const program = new Command();

program
  .name('cm')
  .description('Cody — 34 Skills. Ship 10x faster.')
  .version(VERSION, '-v, --version', 'Show version')
  .action(async () => {
    // Interactive quick menu (Amp-style)
    await showInteractiveMenu();
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
        if (isDashboardRunning()) { console.log(renderResult('warning', 'Dashboard already running.', [`${dim('URL:')} ${brand(`http://localhost:${port}`)}`])); return; }
        launchDashboard(port); break;
      case 'stop': stopDashboard(); break;
      case 'status': dashboardStatus(port); break;
      case 'open': console.log(renderResult('info', `Opening http://localhost:${port} ...`)); openUrl(`http://localhost:${port}`); break;
      case 'url': console.log(`http://localhost:${port}`); break;
      default: console.log(renderResult('error', `Unknown: ${cmd}`, [dim('Available: start, stop, status, open, url')]));
    }
  });

function isDashboardRunning(): boolean {
  try { if (!fs.existsSync(PID_FILE)) return false; const pid = parseInt(fs.readFileSync(PID_FILE, 'utf-8').trim()); process.kill(pid, 0); return true; }
  catch { try { fs.unlinkSync(PID_FILE); } catch { } return false; }
}

function stopDashboard() {
  try {
    if (!fs.existsSync(PID_FILE)) { console.log(renderResult('warning', 'No dashboard running.')); return; }
    const pid = parseInt(fs.readFileSync(PID_FILE, 'utf-8').trim());
    process.kill(pid, 'SIGTERM'); try { fs.unlinkSync(PID_FILE); } catch { }
    console.log(renderResult('success', `Dashboard stopped (PID ${pid}).`));
  } catch (err: any) { console.log(renderResult('error', `Failed to stop: ${err.message}`)); try { fs.unlinkSync(PID_FILE); } catch { } }
}

function dashboardStatus(port: number) {
  if (isDashboardRunning()) {
    const pid = fs.readFileSync(PID_FILE, 'utf-8').trim();
    console.log(renderResult('success', 'Dashboard RUNNING', [`${dim('PID:')} ${brand(pid)}`, `${dim('URL:')} ${brand(`http://localhost:${port}`)}`]));
  } else { console.log(renderResult('warning', 'Dashboard NOT running', [dim('Start with: cm dashboard start')])); }
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
      default: console.log(renderResult('error', `Unknown: ${cmd}`, [dim('Available: add, list, move, done, rm, dispatch, stuck')]));
    }
  });

function taskAdd(title: string, opts: any) {
  if (!title) { console.log(renderResult('error', 'Title required. Usage: cm task add "My task"')); return; }
  const data = loadData();
  let projectId: string | undefined;
  if (opts.project) {
    const project = findProjectByNameOrId(data, opts.project);
    if (!project) { console.log(renderResult('error', `Project not found: ${opts.project}`)); return; }
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
  console.log(renderResult('success', `Task created: ${title}`, [
    `${dim('ID:')} ${brand(shortId(task.id))} ${dim('|')} ${dim('Project:')} ${brand(project?.name || 'Default')} ${dim('|')} ${dim(column)} ${dim('|')} ${dim(opts.priority || 'medium')}`,
  ]));
}

function taskList(opts: any) {
  const data = loadData();
  let tasks = data.tasks;
  if (opts.project && !opts.all) {
    const project = findProjectByNameOrId(data, opts.project);
    if (!project) { console.log(renderResult('error', `Project not found: ${opts.project}`)); return; }
    tasks = tasks.filter(t => t.projectId === project.id);
    console.log(renderCommandHeader(`Tasks — ${project.name}`, '📋'));
  } else { console.log(renderCommandHeader('All Tasks', '📋')); }
  if (tasks.length === 0) { console.log(`  ${dim('No tasks found.')}\n`); return; }
  console.log(dim('  ' + padRight('ID', 10) + padRight('Title', 36) + padRight('Column', 14) + padRight('Priority', 10) + padRight('Agent', 14) + 'Project'));
  console.log(dim('  ' + '─'.repeat(100)));
  const co = ['backlog', 'in-progress', 'review', 'done'];
  tasks.sort((a, b) => co.indexOf(a.column) - co.indexOf(b.column) || a.order - b.order);
  for (const task of tasks) {
    const cc = COL_COLORS[task.column] || chalk.white;
    const pc = PRIORITY_COLORS[task.priority] || chalk.white;
    const project = data.projects.find(p => p.id === task.projectId);
    console.log('  ' + dim(padRight(shortId(task.id), 10)) + padRight(task.title.substring(0, 34), 36) + cc(padRight(task.column, 14)) + pc(padRight(task.priority, 10)) + dim(padRight(task.agent || '—', 14)) + dim(project?.name || '—'));
  }
  console.log(dim(`\n  Total: ${tasks.length} tasks\n`));
}

function taskMove(idPrefix: string, targetColumn: string) {
  if (!idPrefix || !targetColumn) { console.log(renderResult('error', 'Usage: cm task move <id> <column>')); return; }
  const vc = ['backlog', 'in-progress', 'review', 'done'];
  if (!vc.includes(targetColumn)) { console.log(renderResult('error', `Invalid column: ${targetColumn}`, [dim(`Valid: ${vc.join(', ')}`)])); return; }
  const data = loadData();
  const task = findTaskByIdPrefix(data, idPrefix);
  if (!task) { console.log(renderResult('error', `Task not found: ${idPrefix}`)); return; }
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
    console.log(renderResult('error', `Invalid transition: ${oldCol} → ${targetColumn}`, [dim(`Allowed: ${allowed.join(', ')}`)]));
    return;
  }
  if (oldCol === targetColumn) {
    console.log(`  ${dim(`Task already in ${targetColumn}.`)}`);
    return;
  }

  task.column = targetColumn as Task['column'];
  task.updatedAt = new Date().toISOString();
  task.stuckSince = undefined;
  logActivity(data, targetColumn === 'done' ? 'task_done' : 'task_transitioned', `Task "${task.title}" moved: ${oldCol} → ${targetColumn} (CLI)`, task.projectId, task.agent, { from: oldCol, to: targetColumn });
  saveData(data);
  console.log(renderResult('success', `Moved "${task.title}"`, [
    `${dim(oldCol)} ${brand('→')} ${(COL_COLORS[targetColumn] || chalk.white)(targetColumn)}`,
  ]));
}

function taskStuck(opts: any) {
  const data = loadData();
  const thresholdMin = 30;
  const now = Date.now();
  let tasks = data.tasks.filter(t => t.column === 'in-progress');
  if (opts.project) {
    const project = findProjectByNameOrId(data, opts.project);
    if (!project) { console.log(renderResult('error', `Project not found: ${opts.project}`)); return; }
    tasks = tasks.filter(t => t.projectId === project.id);
  }
  const stuck = tasks.filter(t => {
    const elapsed = now - new Date(t.updatedAt).getTime();
    return elapsed > thresholdMin * 60 * 1000;
  }).sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());

  if (stuck.length === 0) {
    console.log(renderResult('success', `No stuck tasks! All in-progress tasks updated within ${thresholdMin}m.`));
    return;
  }

  console.log(renderCommandHeader(`${stuck.length} Stuck Tasks (>${thresholdMin}m in progress)`, '⚠️'));
  console.log(dim('  ' + padRight('ID', 10) + padRight('Title', 36) + padRight('Stuck For', 12) + padRight('Agent', 14) + 'Priority'));
  console.log(dim('  ' + '─'.repeat(86)));
  for (const task of stuck) {
    const elapsed = now - new Date(task.updatedAt).getTime();
    const minutes = Math.round(elapsed / 60000);
    const timeStr = minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    const project = data.projects.find(p => p.id === task.projectId);
    const pc = PRIORITY_COLORS[task.priority] || chalk.white;
    console.log('  ' + dim(padRight(shortId(task.id), 10)) + padRight(task.title.substring(0, 34), 36) + warning(padRight(timeStr, 12)) + dim(padRight(task.agent || '—', 14)) + pc(task.priority));
  }
  console.log();
  console.log(dim('  Tip: Move tasks with: cm task move <id> review|done|backlog'));
  console.log();
}

function taskDone(idPrefix: string) {
  if (!idPrefix) { console.log(renderResult('error', 'Usage: cm task done <id>')); return; }
  taskMove(idPrefix, 'done');
}

function taskRemove(idPrefix: string) {
  if (!idPrefix) { console.log(renderResult('error', 'Usage: cm task rm <id>')); return; }
  const data = loadData();
  const idx = data.tasks.findIndex(t => t.id === idPrefix || t.id.startsWith(idPrefix));
  if (idx === -1) { console.log(renderResult('error', `Task not found: ${idPrefix}`)); return; }
  const [removed] = data.tasks.splice(idx, 1);
  logActivity(data, 'task_deleted', `Task "${removed.title}" deleted via CLI`, removed.projectId, removed.agent);
  saveData(data);
  console.log(renderResult('success', `Deleted: "${removed.title}" (${shortId(removed.id)})`));
}

function taskDispatch(idPrefix: string, opts: any) {
  if (!idPrefix) { console.log(renderResult('error', 'Usage: cm task dispatch <id> [--force]')); return; }
  const data = loadData();
  const task = findTaskByIdPrefix(data, idPrefix);
  if (!task) { console.log(renderResult('error', `Task not found: ${idPrefix}`)); return; }
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
    const details = [
      `${dim('Task:')} ${brand(task.title)}`,
      `${dim('Agent:')} ${brand(task.agent)}`,
    ];
    if (task.skill) details.push(`${dim('Skill:')} ${brand(task.skill)}`);
    details.push(`${dim('File:')} ${brand(result.filePath)}`);
    console.log(renderResult('success', `Task dispatched to ${task.agent}!`, details));
  } else {
    task.dispatchStatus = 'failed';
    task.dispatchError = result.error;
    task.updatedAt = new Date().toISOString();
    saveData(data);
    console.log(renderResult('error', `Dispatch failed: ${result.error}`));
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
      default: console.log(renderResult('error', `Unknown: ${cmd}`, [dim('Available: add, list, rm')]));
    }
  });

function projectAdd(name: string, opts: any) {
  if (!name) { console.log(renderResult('error', 'Usage: cm project add "my-project"')); return; }
  const data = loadData();
  const project: Project = { id: crypto.randomUUID(), name: name.trim(), path: opts.path || process.cwd(), agents: [], createdAt: new Date().toISOString() };
  data.projects.push(project);
  logActivity(data, 'project_created', `Project "${project.name}" created via CLI`, project.id);
  saveData(data);
  console.log(renderResult('success', `Project created: ${name}`, [
    `${dim('ID:')} ${brand(shortId(project.id))} ${dim('|')} ${dim('Path:')} ${brand(project.path)}`,
  ]));
}

function projectList() {
  const data = loadData();
  if (data.projects.length === 0) { console.log(`\n  ${dim('No projects.')}\n`); return; }
  console.log(renderCommandHeader('Projects', '📦'));
  console.log(dim('  ' + padRight('ID', 10) + padRight('Name', 24) + padRight('Tasks', 8) + padRight('Agents', 20) + 'Path'));
  console.log(dim('  ' + '─'.repeat(90)));
  for (const project of data.projects) {
    const pt = data.tasks.filter(t => t.projectId === project.id);
    const agents = [...new Set(pt.map(t => t.agent).filter(Boolean))];
    const done = pt.filter(t => t.column === 'done').length;
    console.log('  ' + dim(padRight(shortId(project.id), 10)) + brand(padRight(project.name, 24)) + dim(padRight(`${done}/${pt.length}`, 8)) + dim(padRight(agents.join(', ') || '—', 20)) + dim(project.path || '—'));
  }
  console.log();
}

function projectRemove(query: string) {
  if (!query) { console.log(renderResult('error', 'Usage: cm project rm <name-or-id>')); return; }
  const data = loadData();
  const project = findProjectByNameOrId(data, query);
  if (!project) { console.log(renderResult('error', `Project not found: ${query}`)); return; }
  const tc = data.tasks.filter(t => t.projectId === project.id).length;
  data.projects = data.projects.filter(p => p.id !== project.id);
  data.tasks = data.tasks.filter(t => t.projectId !== project.id);
  logActivity(data, 'project_deleted', `Project "${project.name}" deleted via CLI`, project.id);
  saveData(data);
  console.log(renderResult('success', `Deleted project "${project.name}" and ${tc} tasks.`));
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
      default: console.log(renderResult('error', `Unknown: ${cmd}`, [dim('Available: staging, production, list')]));
    }
  });

function deployRecord(env: 'staging' | 'production', opts: any) {
  const data = loadData();
  let projectId: string | undefined;
  if (opts.project) {
    const p = findProjectByNameOrId(data, opts.project);
    if (!p) { console.log(renderResult('error', `Project not found: ${opts.project}`)); return; }
    projectId = p.id;
  } else if (data.projects.length > 0) { projectId = data.projects[0].id; }
  else { console.log(renderResult('error', 'No projects. Create one first: cm project add "my-project"')); return; }

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

  const envColor = env === 'production' ? success : warning;
  const project = data.projects.find(p => p.id === projectId);
  const details = [
    `${dim('ID:')} ${brand(shortId(dep.id))}`,
    `${dim('Env:')} ${envColor(env)}`,
    `${dim('Project:')} ${brand(project?.name || '—')}`,
    `${dim('Message:')} ${dep.message}`,
  ];
  if (dep.commit) details.push(`${dim('Commit:')} ${brand(dep.commit)}`);
  details.push(`${dim('Branch:')} ${brand(dep.branch)}`);
  console.log(renderResult('success', 'Deployment recorded!', details));
}

function deployList(opts: any) {
  const data = loadData();
  let deps = data.deployments;
  if (opts.project) {
    const p = findProjectByNameOrId(data, opts.project);
    if (!p) { console.log(renderResult('error', `Project not found: ${opts.project}`)); return; }
    deps = deps.filter(d => d.projectId === p.id);
  }

  if (deps.length === 0) { console.log(`\n  ${dim('No deployments yet.')}\n`); return; }

  console.log(renderCommandHeader('Deployment History', '🚀'));
  console.log(dim('  ' + padRight('ID', 10) + padRight('Env', 12) + padRight('Status', 14) + padRight('Message', 32) + padRight('Branch', 12) + 'Time'));
  console.log(dim('  ' + '─'.repeat(100)));

  for (const dep of deps.slice(0, 20)) {
    const sc = STATUS_COLORS[dep.status] || chalk.white;
    const ec = dep.env === 'production' ? success : warning;
    const timeAgo = formatTimeAgoCli(dep.startedAt);
    const rollbackFlag = dep.rollbackOf ? ' ⏪' : '';
    console.log('  ' + dim(padRight(shortId(dep.id), 10)) + ec(padRight(dep.env, 12)) + sc(padRight(dep.status.replace('_', ' ') + rollbackFlag, 14)) + padRight(dep.message.substring(0, 30), 32) + dim(padRight(dep.branch || '—', 12)) + dim(timeAgo));
  }
  console.log(dim(`\n  Total: ${deps.length} deployments\n`));
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
    if (!dep) { console.log(renderResult('error', `Deployment not found: ${deployId}`)); return; }
    if (dep.status === 'rolled_back') { console.log(renderResult('warning', 'Already rolled back.')); return; }

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

    console.log(renderResult('success', 'Rollback complete!', [
      `${dim('Original:')} ${brand(shortId(dep.id))} ${dim(`(${dep.env})`)}`,
      `${dim('Rollback ID:')} ${brand(shortId(rollback.id))}`,
      `${dim('Status:')} ${dep.message} → rolled back`,
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
    const data = loadData();
    let acts = data.activities;
    if (opts.project) {
      const p = findProjectByNameOrId(data, opts.project);
      if (!p) { console.log(renderResult('error', `Project not found: ${opts.project}`)); return; }
      acts = acts.filter(a => a.projectId === p.id);
    }
    const limit = parseInt(opts.limit) || 20;
    acts = acts.slice(0, limit);

    if (acts.length === 0) { console.log(`\n  ${dim('No activity yet.')}\n`); return; }

    const ACT_ICONS: Record<string, string> = {
      'task_created': '✨', 'task_moved': '↔️', 'task_done': '✅', 'task_deleted': '🗑️', 'task_updated': '✏️',
      'project_created': '📦', 'project_deleted': '🗑️',
      'deploy_staging': '🟡', 'deploy_production': '🚀', 'deploy_failed': '❌', 'rollback': '⏪',
      'git_push': '📤', 'changelog_added': '📝',
    };

    console.log(renderCommandHeader(`Activity History (latest ${acts.length})`, '📜'));
    for (const a of acts) {
      const icon = ACT_ICONS[a.type] || '📌';
      const proj = data.projects.find(p => p.id === a.projectId);
      const projTag = proj ? dim(` [${proj.name}]`) : '';
      const agentTag = a.agent ? dim(` @${a.agent}`) : '';
      const time = formatTimeAgoCli(a.createdAt);
      console.log(`  ${icon} ${a.message}${projTag}${agentTag} ${dim(`← ${time}`)}`);
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
      default: console.log(renderResult('error', `Unknown: ${cmd}`, [dim('Available: add, list')]));
    }
  });

function changelogAdd(args: string[], opts: any) {
  if (args.length < 2) { console.log(renderResult('error', 'Usage: cm changelog add <version> "<title>" [changes...]')); return; }
  const data = loadData();
  let projectId = '';
  if (opts.project) {
    const p = findProjectByNameOrId(data, opts.project);
    if (!p) { console.log(renderResult('error', `Project not found: ${opts.project}`)); return; }
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

  const details = [`${dim('Version:')} ${brand(version)}`, `${dim('Title:')} ${title}`];
  if (changes.length > 0) { changes.forEach(c => details.push(`${dim('•')} ${c}`)); }
  console.log(renderResult('success', 'Changelog entry added!', details));
}

function changelogList(opts: any) {
  const data = loadData();
  let entries = data.changelog;
  if (opts.project) {
    const p = findProjectByNameOrId(data, opts.project);
    if (!p) { console.log(renderResult('error', `Project not found: ${opts.project}`)); return; }
    entries = entries.filter(c => c.projectId === p.id);
  }

  if (entries.length === 0) { console.log(`\n  ${dim('No changelog entries.')}\n`); return; }

  console.log(renderCommandHeader('Changelog', '📝'));
  for (const entry of entries) {
    const proj = data.projects.find(p => p.id === entry.projectId);
    console.log(brand(`  ${entry.version}`) + ` — ${entry.title}` + dim(` (${formatTimeAgoCli(entry.createdAt)})${proj ? ' [' + proj.name + ']' : ''}`));
    if (entry.changes.length > 0) { entry.changes.forEach(c => console.log(dim(`    • ${c}`))); }
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
    console.log(renderCommandHeader('Status Overview', '📊'));

    // Projects
    console.log(brand(`  Projects: ${data.projects.length}`));
    for (const p of data.projects) {
      const pt = data.tasks.filter(t => t.projectId === p.id);
      const done = pt.filter(t => t.column === 'done').length;
      const pct = pt.length > 0 ? Math.round((done / pt.length) * 100) : 0;
      console.log(dim(`    📦 ${padRight(p.name, 20)} ${progressBar(pct)} ${done}/${pt.length} (${pct}%)`));
    }

    // Tasks
    const total = data.tasks.length;
    const byCol: Record<string, number> = { backlog: 0, 'in-progress': 0, review: 0, done: 0 };
    data.tasks.forEach(t => { byCol[t.column] = (byCol[t.column] || 0) + 1; });
    console.log(); console.log(brand(`  Tasks: ${total}`));
    console.log(dim(`    ⚪ Backlog:     ${byCol.backlog}`));
    console.log(info(`    🟢 In Progress: ${byCol['in-progress']}`));
    console.log(warning(`    🟡 Review:      ${byCol.review}`));
    console.log(success(`    🟢 Done:        ${byCol.done}`));

    // Deploys
    if (data.deployments.length > 0) {
      console.log(); console.log(brand(`  Deployments: ${data.deployments.length}`));
      const latest = data.deployments[0];
      const sc = STATUS_COLORS[latest.status] || chalk.white;
      console.log(dim(`    Latest: ${latest.env} — ${sc(latest.status)} — ${latest.message} (${formatTimeAgoCli(latest.startedAt)})`));
    }

    // Agents
    const agentCounts: Record<string, number> = {};
    data.tasks.forEach(t => { if (t.agent) agentCounts[t.agent] = (agentCounts[t.agent] || 0) + 1; });
    const agentNames = Object.keys(agentCounts);
    if (agentNames.length > 0) {
      console.log(); console.log(brand(`  Active Agents: ${agentNames.length}`));
      for (const agent of agentNames.sort()) { console.log(dim(`    🤖 ${padRight(agent, 16)} ${agentCounts[agent]} tasks`)); }
    }

    // Dashboard
    console.log();
    if (isDashboardRunning()) { console.log(success(`  🚀 Dashboard: RUNNING at http://codymaster.localhost:${DEFAULT_PORT}`)); }
    else { console.log(dim(`  ⚫ Dashboard: not running (start with: cm dashboard)`)); }
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
    console.log(brand(`  Installing skill: ${skill}...`));
    if (!opts.platform) {
      const p = await import('@clack/prompts');
      const platform = await p.select({
        message: 'Which platform?',
        options: [
          { label: '🟢 Google Antigravity', value: 'gemini' },
          { label: '🟣 Claude Code', value: 'claude' },
          { label: '🔵 Cursor', value: 'cursor' },
          { label: '🟠 Windsurf', value: 'windsurf' },
          { label: '🟤 Cline / RooCode', value: 'cline' },
        ],
      });
      if (p.isCancel(platform)) return;
      opts.platform = platform;
    }
    console.log(renderResult('success', `Skill '${skill}' installed for ${opts.platform}!`));
  });

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

const PLATFORM_TARGETS: Record<string, { dir: string; invoke: string; note: string }> = {
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

function autoDetectPlatform(): string {
  const { execFileSync } = require('child_process');
  try { execFileSync('claude', ['--version'], { stdio: 'pipe' }); return 'claude'; } catch { }
  try { execFileSync('gemini', ['--version'], { stdio: 'pipe' }); return 'gemini'; } catch { }
  if (fs.existsSync(path.join(os.homedir(), '.cursor'))) return 'cursor';
  if (fs.existsSync(path.join(os.homedir(), '.windsurf'))) return 'windsurf';
  return 'manual';
}

function downloadFile(url: string, dest: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      const file = fs.createWriteStream(dest);
      https.get(url, (res) => {
        if (res.statusCode !== 200) { file.close(); try { fs.unlinkSync(dest); } catch { } resolve(false); return; }
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(true); });
      }).on('error', () => { file.close(); resolve(false); });
    } catch { resolve(false); }
  });
}

async function doAddSkills(skills: string[], platform: string) {
  console.log();
  const { execFileSync } = require('child_process');

  if (platform === 'claude') {
    console.log(brand('🟣 Claude Code — Installing via plugin system'));
    console.log(dim('   (Claude installs all 34 skills as one bundle)\n'));

    // Step 1: Register marketplace
    console.log(dim('   $ claude plugin marketplace add tody-agent/codymaster'));
    try {
      const r1 = require('child_process').spawnSync(
        'claude', ['plugin', 'marketplace', 'add', 'tody-agent/codymaster'],
        { encoding: 'utf8' }
      );
      if (r1.stdout) process.stdout.write(r1.stdout);
      if (r1.stderr) process.stderr.write(r1.stderr);
      const combined = String(r1.stdout || '') + String(r1.stderr || '');
      if (r1.status !== 0 && !combined.includes('already installed') && !combined.includes('already exists')) {
        console.log(renderResult('warning', 'Marketplace warning — continuing anyway'));
      } else if (combined.includes('already installed') || combined.includes('already exists')) {
        console.log(dim('   ℹ️  Marketplace already registered'));
      }
    } catch {
      console.log(renderResult('warning', 'Could not reach marketplace — continuing'));
    }

    // Step 2: Install / update the plugin
    console.log(dim('   $ claude plugin install codymaster@codymaster'));
    try {
      execFileSync('claude', ['plugin', 'install', 'codymaster@codymaster'], { stdio: 'inherit' });
      console.log(renderResult('success', 'All 34 skills installed!'));
      await postInstallOnboarding('claude');
    } catch {
      console.log(renderResult('warning', 'Plugin install failed. Run manually:'));
      console.log(brand('  claude plugin install codymaster@codymaster'));
      console.log(dim('\n  Or one-liner:'));
      console.log(brand('  bash <(curl -fsSL https://raw.githubusercontent.com/tody-agent/codymaster/main/install.sh) --claude'));
    }
    return;
  }

  // Removed the fictional gemini extensions install block.
  // Gemini now falls through to the standard file-cloning logic below.

  const target = PLATFORM_TARGETS[platform];
  if (!target) {
    console.log(renderResult('error', `Unknown platform: ${platform}`, [dim('Supported: claude, gemini, cursor, windsurf, cline, opencode, kiro, copilot')]));
    return;
  }

  if (platform === 'copilot') {
    const instrFile = path.join('.github', 'copilot-instructions.md');
    fs.mkdirSync('.github', { recursive: true });
    const header = '\n\n## Cody Master Skills\nThe following AI skills are available — reference them by name:\n';
    const lines = skills.map(s => `- **${s}**: see https://github.com/tody-agent/codymaster/blob/main/skills/${s}/SKILL.md`).join('\n');
    const existing = fs.existsSync(instrFile) ? fs.readFileSync(instrFile, 'utf-8') : '';
    if (!existing.includes('Cody Master Skills')) {
      fs.appendFileSync(instrFile, header + lines + '\n');
    }
    console.log(renderResult('success', `${skills.length} skills referenced in ${instrFile}`, [dim('GitHub Copilot will use these as context automatically.')]));
    return;
  }

  const icons: Record<string, string> = { cursor: '🔵', windsurf: '🟠', cline: '⚫', opencode: '📦', kiro: '🔶' };
  const icon = icons[platform] || '📦';
  const label = skills.length === ALL_SKILLS.length ? 'all 34 skills' : skills.join(', ');
  console.log(`${icon} ${brand(`${platform} — Installing ${label}`)}`);
  console.log(dim(`   Target: ./${target.dir}/\n`));

  let ok = 0, fail = 0;
  for (const skill of skills) {
    const url = `${RAW_BASE}/skills/${skill}/SKILL.md`;
    let dest = path.join(target.dir, skill, 'SKILL.md');
    
    // Formatting logic to adapt to specific IDE required formats
    if (platform === 'cursor') {
      dest = path.join(target.dir, `${skill}.mdc`);
    } else if (platform === 'continue') {
      dest = path.join(target.dir, `${skill}.md`);
    }

    const ok_result = await downloadFile(url, dest);
    
    // Prepend Cursor MDC glob formatting
    if (ok_result && platform === 'cursor') {
      try {
        const content = fs.readFileSync(dest, 'utf-8');
        if (!content.startsWith('---')) {
          const yamlFrontmatter = `---\ndescription: ${skill}\nglobs: *\n---\n`;
          fs.writeFileSync(dest, yamlFrontmatter + content);
        } else if (!content.includes('globs:')) {
          const newContent = content.replace(/^---/, '---\nglobs: *');
          fs.writeFileSync(dest, newContent);
        }
      } catch (err) {}
    }

    if (ok_result) { process.stdout.write(success(`  ✅ ${skill}\n`)); ok++; }
    else { process.stdout.write(error(`  ❌ ${skill}\n`)); fail++; }
  }

  console.log();
  if (ok > 0) {
    console.log(renderResult('success', `${ok} skill${ok > 1 ? 's' : ''} installed → ./${target.dir}/`));
    const invoke = target.invoke.replace('<skill>', skills[0]);
    console.log(brand(`  📖 Usage: ${invoke}  Your prompt here`));
    if (target.note) console.log(dim(`   Note: ${target.note}`));
    await postInstallOnboarding(platform);
  }
  if (fail > 0) {
    console.log(renderResult('warning', `${fail} failed — check connection or clone manually:`, [dim('git clone https://github.com/tody-agent/codymaster.git')]));
  }
}

program
  .command('add')
  .description('Add skills to your AI agent  (npx codymaster add --skill cm-debugging)')
  .option('--skill <name>', 'Specific skill to add (e.g. cm-debugging)')
  .option('--all', 'Add all 34 skills')
  .option('--platform <platform>', 'Target: claude|gemini|cursor|windsurf|cline|opencode|kiro|copilot')
  .option('--list', 'Show available skills and exit')
  .action(async (opts) => {
    showBanner();
    if (opts.list) { skillList(); return; }

    // Resolve skills array
    let skills: string[] | null = null;
    if (opts.all) {
      skills = ALL_SKILLS;
    } else if (opts.skill) {
      if (!ALL_SKILLS.includes(opts.skill)) {
        console.log(renderResult('error', `Unknown skill: ${opts.skill}`, [dim('Run: npx codymaster add --list')]));
        return;
        return;
      }
      skills = [opts.skill];
    }

    // Detect or prompt platform
    let platform: string = opts.platform || autoDetectPlatform();

    if (platform === 'manual') {
      const p = await import('@clack/prompts');
      const platform_choice = await p.select({
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
      if (p.isCancel(platform_choice)) return;
      platform = platform_choice as string;
    }

    // If no skills chosen yet, prompt
    if (!skills) {
      if (platform === 'claude' || platform === 'gemini') {
        skills = ALL_SKILLS;
      } else {
        const p = await import('@clack/prompts');
        const mode = await p.select({
          message: 'What to install?',
          options: [
            { label: 'All 34 skills (full kit)', value: 'all' },
            { label: 'Search & pick one skill', value: 'pick' },
          ],
        });
        if (p.isCancel(mode)) return;
        if (mode === 'all') {
          skills = ALL_SKILLS;
        } else {
          const pick = await p.select({
            message: 'Select a skill:',
            options: ALL_SKILLS.map(s => ({ label: s, value: s })),
          });
          if (p.isCancel(pick)) return;
          skills = [pick as string];
        }
      }
    }

    await doAddSkills(skills!, platform);
  });

// ─── List Command (quick alias for `cody skill list`) ─────────────────────────

program
  .command('list')
  .alias('ls')
  .description('List all 34 available skills')
  .option('-d, --domain <domain>', 'Filter by domain')
  .action((opts) => {
    skillList(opts.domain);
  });

// ─── Profile Command ──────────────────────────────────────────────────────────

program
  .command('profile')
  .description('View your CodyMaster profile, stats, and achievements')
  .action(() => {
    const profile = loadProfile();
    if (!profile.onboardingComplete) {
      console.log(dim('\n  Run cm first to complete setup! 🐹\n'));
      return;
    }
    recordCommand(profile, 'profile');
    const newAchievements = checkAchievements(profile);
    saveProfile(profile);
    console.log(formatProfileSummary(profile));
    for (const id of newAchievements) {
      console.log(formatAchievement(id));
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
    console.log(chalk.gray('   Run: cm continuity init'));
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
    console.log(chalk.yellow('⚠️  No .cm/ directory found. Run: cm continuity init'));
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
    console.log(chalk.yellow('⚠️  No .cm/ directory found. Run: cm continuity init'));
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
      case 'status': case undefined:
        brainStatus(projectPath);
        break;
      case 'learnings': case 'learn': case 'l':
        brainLearnings(projectPath, opts);
        break;
      case 'decisions': case 'dec': case 'd':
        brainDecisions(projectPath, opts);
        break;
      case 'delete': case 'del': case 'rm':
        console.log(chalk.gray('Usage: cm brain delete <type> <id>'));
        console.log(chalk.gray('  type: learning | decision'));
        console.log(chalk.gray('  id:   first 8 chars of the ID'));
        break;
      case 'stats':
        brainStats(projectPath);
        break;
      case 'export':
        brainExport(projectPath, opts);
        break;
      default:
        // Try as delete: cm brain learning <id> or cm brain decision <id>
        if (cmd === 'learning' || cmd === 'decision') {
          console.log(chalk.gray(`Did you mean: cm brain ${cmd}s ?`));
        } else {
          console.log(chalk.red(`Unknown: ${cmd}`));
          console.log(chalk.gray('Available: status, learnings, decisions, delete, stats, export'));
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

function brainStatus(projectPath: string) {
  const status = getContinuityStatus(projectPath);
  if (!status.initialized) {
    console.log(chalk.yellow('\n⚫ Working memory not initialized.'));
    console.log(chalk.gray('   Run: cm continuity init'));
    return;
  }

  showBanner();
  console.log(chalk.cyan('\n🧠 Brain — Memory Status\n'));

  // Stats row
  console.log(chalk.white('  ┌──────────────┬──────────────┬──────────────┬──────────────┐'));
  console.log(
    chalk.white('  │') + chalk.red(` ❤ Learn: ${padRight(String(status.learningCount), 4)}`) +
    chalk.white(' │') + chalk.blue(` 📋 Decide: ${padRight(String(status.decisionCount), 3)}`) +
    chalk.white(' │') + phaseColor(status.phase)(` ● ${padRight(status.phase, 9)}`) +
    chalk.white(' │') + chalk.gray(` #${padRight(String(status.iteration), 10)}`) + chalk.white('│')
  );
  console.log(chalk.white('  └──────────────┴──────────────┴──────────────┴──────────────┘'));

  console.log();
  console.log(`  ${chalk.white('Project:')}     ${status.project}`);
  if (status.activeGoal) console.log(`  ${chalk.white('Goal:')}        ${status.activeGoal}`);
  if (status.currentTask) console.log(`  ${chalk.white('Task:')}        ${status.currentTask}`);
  console.log(`  ${chalk.white('Completed:')}   ${status.completedCount} items`);
  console.log(`  ${chalk.white('Blockers:')}    ${status.blockerCount > 0 ? chalk.yellow(`🚧 ${status.blockerCount}`) : chalk.green('✅ None')}`);
  if (status.lastUpdated) console.log(`  ${chalk.white('Updated:')}     ${formatTimeAgoCli(status.lastUpdated)}`);
  console.log();

  console.log(chalk.gray('  Commands:'));
  console.log(chalk.gray('    cm brain learnings    — View mistakes & lessons'));
  console.log(chalk.gray('    cm brain decisions    — View architecture decisions'));
  console.log(chalk.gray('    cm brain stats        — Memory statistics'));
  console.log(chalk.gray('    cm brain export       — Export memory data'));
  console.log();
}

function brainLearnings(projectPath: string, opts: { search?: string; last?: string }) {
  if (!hasCmDir(projectPath)) {
    console.log(chalk.yellow('⚠️  No .cm/ directory found. Run: cm continuity init'));
    return;
  }
  let learnings = getLearnings(projectPath);

  // Search filter
  if (opts.search) {
    const q = opts.search.toLowerCase();
    learnings = learnings.filter(l =>
      (l.whatFailed || '').toLowerCase().includes(q) ||
      (l.whyFailed || '').toLowerCase().includes(q) ||
      (l.howToPrevent || '').toLowerCase().includes(q)
    );
  }

  // Last N
  const limit = opts.last ? parseInt(opts.last) : 15;
  const display = learnings.slice(-limit);

  if (display.length === 0) {
    console.log(chalk.gray(`\n  No learnings ${opts.search ? 'matching "' + opts.search + '"' : 'captured yet'}. 🎉\n`));
    return;
  }

  console.log(chalk.cyan(`\n📚 Learnings (${display.length}${learnings.length > limit ? '/' + learnings.length : ''})\n`));
  for (const l of display) {
    const shortId = l.id ? l.id.substring(0, 8) : '???';
    console.log(chalk.red(`  ❌ ${l.whatFailed}`) + chalk.gray(` [${shortId}]`));
    if (l.whyFailed) console.log(chalk.gray(`     Why: ${l.whyFailed}`));
    if (l.howToPrevent) console.log(chalk.green(`     Fix: ${l.howToPrevent}`));
    console.log(chalk.gray(`     ${formatTimeAgoCli(l.timestamp)} | ${l.agent || 'unknown'}${l.module ? ' | 📦 ' + l.module : ''}\n`));
  }
}

function brainDecisions(projectPath: string, opts: { last?: string }) {
  if (!hasCmDir(projectPath)) {
    console.log(chalk.yellow('⚠️  No .cm/ directory found. Run: cm continuity init'));
    return;
  }
  const decisions = getDecisions(projectPath);
  const limit = opts.last ? parseInt(opts.last) : 15;
  const display = decisions.slice(-limit);

  if (display.length === 0) {
    console.log(chalk.gray('\n  No decisions recorded yet.\n'));
    return;
  }

  console.log(chalk.cyan(`\n📋 Key Decisions (${display.length}${decisions.length > limit ? '/' + decisions.length : ''})\n`));
  for (const d of display) {
    const shortId = d.id ? d.id.substring(0, 8) : '???';
    console.log(chalk.white(`  📌 ${d.decision}`) + chalk.gray(` [${shortId}]`));
    if (d.rationale) console.log(chalk.gray(`     Rationale: ${d.rationale}`));
    console.log(chalk.gray(`     ${formatTimeAgoCli(d.timestamp)} | ${d.agent || 'unknown'}\n`));
  }
}

function brainDelete(projectPath: string, type: string, id: string) {
  if (!hasCmDir(projectPath)) {
    console.log(chalk.yellow('⚠️  No .cm/ directory found.'));
    return;
  }

  if (type === 'learning' || type === 'l') {
    const learnings = getLearnings(projectPath);
    const target = learnings.find(l => l.id && l.id.startsWith(id));
    if (!target) {
      console.log(chalk.red(`❌ Learning not found with ID prefix: ${id}`));
      return;
    }
    const success = deleteLearning(projectPath, target.id);
    if (success) {
      console.log(chalk.green(`✅ Deleted learning: ${target.whatFailed}`));
    } else {
      console.log(chalk.red('❌ Failed to delete'));
    }
  } else if (type === 'decision' || type === 'd') {
    const decisions = getDecisions(projectPath);
    const target = decisions.find(d => d.id && d.id.startsWith(id));
    if (!target) {
      console.log(chalk.red(`❌ Decision not found with ID prefix: ${id}`));
      return;
    }
    const success = deleteDecision(projectPath, target.id);
    if (success) {
      console.log(chalk.green(`✅ Deleted decision: ${target.decision}`));
    } else {
      console.log(chalk.red('❌ Failed to delete'));
    }
  } else {
    console.log(chalk.red(`❌ Unknown type: ${type}`));
    console.log(chalk.gray('   Use: cm brain-delete learning <id> | cm brain-delete decision <id>'));
  }
}

function brainStats(projectPath: string) {
  if (!hasCmDir(projectPath)) {
    console.log(chalk.yellow('⚠️  No .cm/ directory found. Run: cm continuity init'));
    return;
  }
  const status = getContinuityStatus(projectPath);
  const learnings = getLearnings(projectPath);
  const decisions = getDecisions(projectPath);

  console.log(chalk.cyan('\n📊 Brain Statistics\n'));
  console.log(`  ${chalk.white('Learnings:')}    ${learnings.length}`);
  console.log(`  ${chalk.white('Decisions:')}    ${decisions.length}`);
  console.log(`  ${chalk.white('Completed:')}    ${status.completedCount} items`);
  console.log(`  ${chalk.white('Blockers:')}     ${status.blockerCount}`);
  console.log(`  ${chalk.white('Iteration:')}    #${status.iteration}`);

  // Agent breakdown
  const agentMap: Record<string, number> = {};
  learnings.forEach(l => { if (l.agent) agentMap[l.agent] = (agentMap[l.agent] || 0) + 1; });
  decisions.forEach(d => { if (d.agent) agentMap[d.agent] = (agentMap[d.agent] || 0) + 1; });
  const agents = Object.entries(agentMap).sort((a, b) => b[1] - a[1]);
  if (agents.length > 0) {
    console.log();
    console.log(chalk.white('  Agents:'));
    for (const [agent, count] of agents) {
      console.log(chalk.gray(`    🤖 ${padRight(agent, 20)} ${count} entries`));
    }
  }

  // Module breakdown
  const moduleMap: Record<string, number> = {};
  learnings.forEach(l => { if (l.module) moduleMap[l.module] = (moduleMap[l.module] || 0) + 1; });
  const modules = Object.entries(moduleMap).sort((a, b) => b[1] - a[1]);
  if (modules.length > 0) {
    console.log();
    console.log(chalk.white('  Modules (most error-prone):'));
    for (const [mod, count] of modules.slice(0, 5)) {
      console.log(chalk.gray(`    📦 ${padRight(mod, 20)} ${count} learnings`));
    }
  }

  // Time range
  const allTimestamps = [...learnings.map(l => l.timestamp), ...decisions.map(d => d.timestamp)].filter(Boolean).sort();
  if (allTimestamps.length > 0) {
    console.log();
    console.log(chalk.gray(`  First entry: ${formatTimeAgoCli(allTimestamps[0])}`));
    console.log(chalk.gray(`  Latest:      ${formatTimeAgoCli(allTimestamps[allTimestamps.length - 1])}`));
  }
  console.log();
}

function brainExport(projectPath: string, opts: { format?: string }) {
  if (!hasCmDir(projectPath)) {
    console.log(chalk.yellow('⚠️  No .cm/ directory found.'));
    return;
  }
  const learnings = getLearnings(projectPath);
  const decisions = getDecisions(projectPath);
  const status = getContinuityStatus(projectPath);
  const format = opts.format || 'json';

  if (format === 'json') {
    const data = { status, learnings, decisions, exportedAt: new Date().toISOString() };
    const outFile = `brain-export-${new Date().toISOString().slice(0, 10)}.json`;
    fs.writeFileSync(outFile, JSON.stringify(data, null, 2));
    console.log(chalk.green(`✅ Exported to ${outFile}`));
    console.log(chalk.gray(`   ${learnings.length} learnings, ${decisions.length} decisions`));
  } else if (format === 'md') {
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
    fs.writeFileSync(outFile, md);
    console.log(chalk.green(`✅ Exported to ${outFile}`));
    console.log(chalk.gray(`   ${learnings.length} learnings, ${decisions.length} decisions`));
  } else {
    console.log(chalk.red(`❌ Unknown format: ${format}`));
    console.log(chalk.gray('   Use: --format json | --format md'));
  }
}

// ─── Skill Command ──────────────────────────────────────────────────────────

const SKILL_CATALOG: Record<string, { icon: string; skills: { name: string; desc: string }[] }> = {
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
      { name: 'cm-how-it-work', desc: 'Interactive explainer for all 34 skills' },
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
      case 'list': case 'ls': case undefined:
        skillList();
        break;
      case 'info':
        if (!name) { console.log(chalk.red('❌ Usage: cm skill info <skill-name>')); return; }
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

function skillList(filterDomain?: string) {
  const entries = filterDomain
    ? Object.entries(SKILL_CATALOG).filter(([d]) => d.toLowerCase().startsWith(filterDomain.toLowerCase()))
    : Object.entries(SKILL_CATALOG);

  if (entries.length === 0) {
    console.log(chalk.red(`❌ Domain not found: ${filterDomain}`));
    console.log(chalk.gray('   Domains: engineering, operations, product, growth, orchestration, workflow'));
    return;
  }

  console.log(chalk.cyan('\n🧩 Cody Master — 34 Skills\n'));
  let total = 0;
  for (const [domain, data] of entries) {
    console.log(chalk.white(`  ${data.icon} ${domain.charAt(0).toUpperCase() + domain.slice(1)}`));
    for (const skill of data.skills) {
      console.log(`    ${chalk.cyan(padRight(skill.name, 26))} ${chalk.gray(skill.desc)}`);
      total++;
    }
    console.log();
  }
  console.log(chalk.gray(`  ${total} skills across ${entries.length} domains`));
  console.log(chalk.gray(`  Install: npx codymaster add --all`));
  console.log(chalk.gray(`  Add one: npx codymaster add --skill <name>\n`));
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
  console.log(chalk.gray('   Use "cm skill list" to see all available skills.'));
}

function skillDomains() {
  console.log(chalk.cyan('\n🎯 Skill Domains\n'));
  let total = 0;
  for (const [domain, data] of Object.entries(SKILL_CATALOG)) {
    console.log(`  ${data.icon} ${chalk.white(padRight(domain.charAt(0).toUpperCase() + domain.slice(1), 16))} ${chalk.gray(`${data.skills.length} skills`)}`);
    total += data.skills.length;
  }
  console.log(chalk.gray(`\n  Total: ${total} skills across ${Object.keys(SKILL_CATALOG).length} domains`));
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

    if (!isDashboardRunning()) {
      launchDashboard(DEFAULT_PORT);
      console.log(chalk.green(`   🚀 Dashboard auto-started! You can track progress at http://codymaster.localhost:${DEFAULT_PORT}`));
    }

    console.log(chalk.cyan('💡 Next steps:'));
    console.log(chalk.gray('   cm task add "My first task"'));
    console.log(chalk.gray('   cm open'));
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
      setTimeout(() => openUrl(`http://codymaster.localhost:${port}`), 1500);
    } else {
      console.log(chalk.blue(`🌐 Opening http://codymaster.localhost:${port} ...`));
      openUrl(`http://codymaster.localhost:${port}`);
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
    console.log(`  ${chalk.white('CLI Names:')}  cm | cm | codymaster`);
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
      console.log(chalk.green(`  🚀 Dashboard: RUNNING at http://codymaster.localhost:${DEFAULT_PORT}`));
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
      console.log(chalk.gray('  💡 Tip: cm agents <skill-name> to see best agents for a skill'));
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
      case 'list': case 'ls': chainList(); break;
      case 'info': chainInfo(args[0]); break;
      case 'start': chainStart(args[0], args.slice(1).join(' '), opts); break;
      case 'status': case 'st': chainStatus(args[0]); break;
      case 'advance': case 'next': chainAdvance(args[0], args.slice(1).join(' ')); break;
      case 'skip': chainSkip(args[0], args.slice(1).join(' ')); break;
      case 'abort': chainAbort(args[0], args.slice(1).join(' ')); break;
      case 'auto': chainAuto(args.join(' '), opts); break;
      case 'history': case 'hist': chainHistory(); break;
      default:
        console.log(chalk.red(`Unknown: ${cmd}`));
        console.log(chalk.gray('Available: list, info, start, status, advance, skip, abort, auto, history'));
    }
  });

function chainList() {
  const chains = listChains();
  console.log(chalk.cyan('\n🔗 Available Skill Chains\n'));
  for (const chain of chains) {
    console.log(`  ${chain.icon} ${chalk.white(padRight(chain.name, 24))} ${chalk.gray(chain.description)}`);
    console.log(chalk.gray(`     ID: ${chain.id} | Steps: ${chain.steps.length} | Triggers: ${chain.triggers.slice(0, 4).join(', ')}...`));
    console.log();
  }
  console.log(chalk.gray(`  Total: ${chains.length} chains\n`));
  console.log(chalk.cyan('💡 Quick start:'));
  console.log(chalk.gray('   cm chain auto "Build user authentication"    # Auto-detect chain'));
  console.log(chalk.gray('   cm chain start feature-development "My task"  # Start specific chain'));
  console.log();
}

function chainInfo(chainId: string) {
  if (!chainId) { console.log(chalk.red('❌ Usage: cm chain info <chain-id>')); return; }
  const chain = findChain(chainId);
  if (!chain) { console.log(chalk.red(`❌ Chain not found: ${chainId}`)); console.log(chalk.gray('   Use "cm chain list" to see available chains.')); return; }

  console.log(chalk.cyan(`\n${chain.icon} Chain: ${chain.name}\n`));
  console.log(`  ${chalk.white('ID:')}          ${chain.id}`);
  console.log(`  ${chalk.white('Description:')} ${chain.description}`);
  console.log(`  ${chalk.white('Steps:')}       ${chain.steps.length}`);
  console.log(`  ${chalk.white('Triggers:')}    ${chain.triggers.join(', ')}`);
  console.log();
  console.log(chalk.white('  Pipeline:'));
  for (let i = 0; i < chain.steps.length; i++) {
    const step = chain.steps[i];
    const condBadge = step.condition === 'always' ? chalk.green('ALWAYS') : step.condition === 'if-complex' ? chalk.yellow('IF-COMPLEX') : chalk.blue('IF-READY');
    const optBadge = step.optional ? chalk.gray(' (optional)') : '';
    const connector = i < chain.steps.length - 1 ? '  │' : '   ';
    console.log(`  ${chalk.cyan(`${i + 1}.`)} ${padRight(step.skill, 24)} ${condBadge}${optBadge}`);
    console.log(chalk.gray(`  ${connector}  ${step.description}`));
    if (i < chain.steps.length - 1) console.log(chalk.gray('  │'));
  }
  console.log();
}

function chainStart(chainId: string, taskTitle: string, opts: any) {
  if (!chainId) { console.log(chalk.red('❌ Usage: cm chain start <chain-id> "Task title"')); return; }
  if (!taskTitle) { console.log(chalk.red('❌ Task title required. Usage: cm chain start <chain-id> "My task"')); return; }

  const chain = findChain(chainId);
  if (!chain) { console.log(chalk.red(`❌ Chain not found: ${chainId}`)); return; }

  const data = loadData();
  let projectId: string;
  if (opts.project) {
    const project = findProjectByNameOrId(data, opts.project);
    if (!project) { console.log(chalk.red(`❌ Project not found: ${opts.project}`)); return; }
    projectId = project.id;
  } else if (data.projects.length > 0) {
    projectId = data.projects[0].id;
  } else {
    console.log(chalk.red('❌ No projects. Create one first: cm init')); return;
  }

  const agent = opts.agent || 'antigravity';
  const execution = createChainExecution(chain, projectId, taskTitle, agent);
  data.chainExecutions.push(execution);

  // Create a task linked to this chain
  const now = new Date().toISOString();
  const task: Task = {
    id: crypto.randomUUID(), projectId, title: taskTitle, description: `Chain: ${chain.name}`,
    column: 'in-progress', order: 0, priority: 'medium', agent, skill: execution.steps[0]?.skill || '',
    createdAt: now, updatedAt: now, chainId: chain.id, chainExecutionId: execution.id,
  };
  data.tasks.push(task);

  logActivity(data, 'chain_started', `Chain "${chain.name}" started: "${taskTitle}"`, projectId, agent, {
    chainId: chain.id, executionId: execution.id, steps: chain.steps.length,
  });
  saveData(data);

  const project = data.projects.find(p => p.id === projectId);
  console.log(chalk.green(`\n🔗 Chain started!`));
  console.log(chalk.gray(`   Chain:     ${chain.icon} ${chain.name}`));
  console.log(chalk.gray(`   Task:      ${taskTitle}`));
  console.log(chalk.gray(`   Project:   ${project?.name || '—'}`));
  console.log(chalk.gray(`   Agent:     ${agent}`));
  console.log(chalk.gray(`   Steps:     ${chain.steps.length}`));
  console.log(chalk.gray(`   Exec ID:   ${shortId(execution.id)}`));
  console.log();
  console.log(chalk.cyan(`  ▶ Current step: ${execution.steps[0]?.skill} — ${execution.steps[0]?.description}`));
  console.log();
  console.log(chalk.gray(`  Next: cm chain advance ${shortId(execution.id)} "output summary"`));
  console.log();
}

function chainStatus(execIdPrefix?: string) {
  const data = loadData();

  if (execIdPrefix) {
    // Show specific execution
    const exec = data.chainExecutions.find(e => e.id === execIdPrefix || e.id.startsWith(execIdPrefix));
    if (!exec) { console.log(chalk.red(`❌ Chain execution not found: ${execIdPrefix}`)); return; }
    console.log();
    console.log(formatChainProgress(exec));
    console.log();
    return;
  }

  // Show all active executions
  const active = data.chainExecutions.filter(e => e.status === 'running' || e.status === 'paused');
  if (active.length === 0) {
    console.log(chalk.gray('\n  No active chain executions.'));
    console.log(chalk.gray('  Start one with: cm chain auto "task description"\n'));
    return;
  }

  console.log(chalk.cyan(`\n🔗 Active Chains (${active.length})\n`));
  for (const exec of active) {
    const project = data.projects.find(p => p.id === exec.projectId);
    const currentSkill = getCurrentSkill(exec);
    const progressBar = formatChainProgressBar(exec);
    console.log(`  ${chalk.white(exec.chainName)} — "${exec.taskTitle}"`);
    console.log(chalk.gray(`   ${progressBar} | Step ${exec.currentStepIndex + 1}/${exec.steps.length}: ${currentSkill || 'done'}`));
    console.log(chalk.gray(`   ID: ${shortId(exec.id)} | Agent: ${exec.agent} | Project: ${project?.name || '—'}`));
    console.log();
  }
}

function chainAdvance(execIdPrefix: string, output?: string) {
  if (!execIdPrefix) { console.log(chalk.red('❌ Usage: cm chain advance <exec-id> ["output summary"]')); return; }
  const data = loadData();
  const exec = data.chainExecutions.find(e => e.id === execIdPrefix || e.id.startsWith(execIdPrefix));
  if (!exec) { console.log(chalk.red(`❌ Chain execution not found: ${execIdPrefix}`)); return; }
  if (exec.status !== 'running') { console.log(chalk.yellow(`⚠️  Chain is ${exec.status}, cannot advance.`)); return; }

  const completedStep = exec.steps[exec.currentStepIndex];
  const result = advanceChainStep(exec, output);

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
    logActivity(data, 'chain_completed', `Chain "${exec.chainName}" completed: "${exec.taskTitle}"`, exec.projectId, exec.agent, {
      executionId: exec.id, totalSteps: exec.steps.length,
    });
    saveData(data);
    console.log(chalk.green(`\n✅ Chain completed! All ${exec.steps.length} steps done.`));
    console.log(chalk.gray(`   Chain: ${exec.chainName}`));
    console.log(chalk.gray(`   Task:  ${exec.taskTitle}`));
    console.log();
  } else {
    logActivity(data, 'chain_step_completed', `Chain step completed: ${completedStep?.skill} → next: ${result.nextSkill}`, exec.projectId, exec.agent, {
      executionId: exec.id, completedSkill: completedStep?.skill, nextSkill: result.nextSkill,
    });
    saveData(data);
    const nextStep = exec.steps[exec.currentStepIndex];
    console.log(chalk.green(`\n✅ Step completed: ${completedStep?.skill}`));
    console.log(chalk.cyan(`  ▶ Next step: ${result.nextSkill} — ${nextStep?.description}`));
    console.log(chalk.gray(`   Progress: ${formatChainProgressBar(exec)}`));
    console.log();
  }
}

function chainSkip(execIdPrefix: string, reason?: string) {
  if (!execIdPrefix) { console.log(chalk.red('❌ Usage: cm chain skip <exec-id> ["reason"]')); return; }
  const data = loadData();
  const exec = data.chainExecutions.find(e => e.id === execIdPrefix || e.id.startsWith(execIdPrefix));
  if (!exec) { console.log(chalk.red(`❌ Chain execution not found: ${execIdPrefix}`)); return; }
  if (exec.status !== 'running') { console.log(chalk.yellow(`⚠️  Chain is ${exec.status}, cannot skip.`)); return; }

  const skippedStep = exec.steps[exec.currentStepIndex];
  const result = skipChainStep(exec, reason);
  saveData(data);

  console.log(chalk.yellow(`  ⏭️  Skipped: ${skippedStep?.skill}`));
  if (result.completed) {
    console.log(chalk.green(`  ✅ Chain completed!`));
  } else {
    console.log(chalk.cyan(`  ▶ Next: ${result.nextSkill}`));
  }
  console.log();
}

function chainAbort(execIdPrefix: string, reason?: string) {
  if (!execIdPrefix) { console.log(chalk.red('❌ Usage: cm chain abort <exec-id> ["reason"]')); return; }
  const data = loadData();
  const exec = data.chainExecutions.find(e => e.id === execIdPrefix || e.id.startsWith(execIdPrefix));
  if (!exec) { console.log(chalk.red(`❌ Chain execution not found: ${execIdPrefix}`)); return; }
  if (exec.status !== 'running' && exec.status !== 'paused') { console.log(chalk.yellow(`⚠️  Chain already ${exec.status}.`)); return; }

  abortChain(exec, reason);
  logActivity(data, 'chain_aborted', `Chain "${exec.chainName}" aborted: ${reason || 'no reason'}`, exec.projectId, exec.agent, {
    executionId: exec.id,
  });
  saveData(data);

  console.log(chalk.red(`\n🛑 Chain aborted: ${exec.chainName}`));
  if (reason) console.log(chalk.gray(`   Reason: ${reason}`));
  console.log();
}

function chainAuto(taskTitle: string, opts: any) {
  if (!taskTitle) {
    console.log(chalk.red('❌ Usage: cm chain auto "task description"'));
    console.log(chalk.gray('   Example: cm chain auto "Build user authentication"'));
    return;
  }

  const chain = matchChain(taskTitle);
  if (!chain) {
    console.log(chalk.yellow(`\n⚠️  No matching chain found for: "${taskTitle}"`));
    console.log(chalk.gray('   Available chains:'));
    for (const c of listChains()) {
      console.log(chalk.gray(`     ${c.icon} ${c.id}: ${c.triggers.slice(0, 3).join(', ')}...`));
    }
    console.log(chalk.gray('\n   Use "cm chain start <chain-id> <title>" to start manually.'));
    return;
  }

  console.log(chalk.cyan(`\n🤖 Auto-detected chain: ${chain.icon} ${chain.name}`));
  console.log(chalk.gray(`   Matched from: "${taskTitle}"`));
  console.log();

  // Delegate to chainStart
  chainStart(chain.id, taskTitle, opts);
}

function chainHistory() {
  const data = loadData();
  const execs = data.chainExecutions;

  if (execs.length === 0) {
    console.log(chalk.gray('\n  No chain executions yet.\n'));
    return;
  }

  const STATUS_ICONS: Record<string, string> = {
    pending: '⚪', running: '🔵', paused: '⏸️', completed: '✅', failed: '❌', aborted: '🛑',
  };

  console.log(chalk.cyan(`\n🔗 Chain History (${execs.length})\n`));
  console.log(chalk.gray('  ' + padRight('Status', 8) + padRight('Chain', 24) + padRight('Task', 30) + padRight('Progress', 14) + 'Time'));
  console.log(chalk.gray('  ' + '─'.repeat(86)));

  for (const exec of execs.slice(0, 20)) {
    const icon = STATUS_ICONS[exec.status] || '❓';
    const completed = exec.steps.filter(s => s.status === 'completed' || s.status === 'skipped').length;
    const progress = `${completed}/${exec.steps.length} steps`;
    const time = formatTimeAgoCli(exec.startedAt);
    console.log('  ' + padRight(icon, 8) + padRight(exec.chainName.substring(0, 22), 24) + padRight(exec.taskTitle.substring(0, 28), 30) + chalk.gray(padRight(progress, 14)) + chalk.gray(time));
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
    launchDashboard(DEFAULT_PORT, true);
  }
}

// Kick off update check (non-blocking)
checkForUpdates().catch(() => {});

program.parse(process.argv);
