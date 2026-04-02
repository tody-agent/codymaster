import crypto from 'crypto';
import { Command } from 'commander';
import chalk from 'chalk';
import { 
  loadData, saveData, logActivity, findProjectByNameOrId, findTaskByIdPrefix, shortId,
  Project, Task
} from '../../data';
import { dispatchTaskToAgent } from '../../agent-dispatch';
import { COL, PRI, brand, dim } from '../../ui/theme';
import { renderResult, renderCommandHeader } from '../../ui/box';
import { padRight } from '../../utils/cli-utils';

const COL_COLORS = COL;
const PRIORITY_COLORS = PRI;

export function registerTaskCommands(program: Command) {
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
}

function taskAdd(title: string, opts: any) {
  if (!title) { console.log(renderResult('error', 'Title required. Usage: cm task add "My task"')); return; }
  const data = loadData();
  let projectId: string | undefined;
  if (opts.project) {
    const project = findProjectByNameOrId(data, opts.project);
    if (!project) { console.log(renderResult('error', `Project not found: ${opts.project}`)); return; }
    projectId = project.id;
  } else if (data.projects.length > 0) {
    projectId = data.projects[0].id;
  } else {
    const dp: Project = { 
      id: crypto.randomUUID(), 
      name: 'Default Project', 
      path: process.cwd(), 
      agents: [], 
      createdAt: new Date().toISOString() 
    };
    data.projects.push(dp);
    projectId = dp.id;
  }
  const now = new Date().toISOString();
  const column = (opts.column || 'backlog') as Task['column'];
  const ct = data.tasks.filter((t: Task) => t.column === column && t.projectId === projectId);
  const mo = ct.length > 0 ? Math.max(...ct.map((t: Task) => t.order)) : -1;
  const task: Task = { 
    id: crypto.randomUUID(), 
    projectId: projectId!, 
    title: title.trim(), 
    description: '', 
    column, 
    order: mo + 1, 
    priority: (opts.priority || 'medium') as Task['priority'], 
    agent: opts.agent || '', 
    skill: opts.skill || '', 
    createdAt: now, 
    updatedAt: now 
  };
  data.tasks.push(task);
  logActivity(data as any, 'task_created', `Task "${task.title}" created via CLI`, projectId!, opts.agent || '');
  saveData(data);
  const project = data.projects.find((p: Project) => p.id === projectId);
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
    tasks = tasks.filter((t: Task) => t.projectId === project.id);
    console.log(renderCommandHeader(`Tasks — ${project.name}`, '📋'));
  } else {
    console.log(renderCommandHeader('All Tasks', '📋'));
  }
  if (tasks.length === 0) { console.log(`  ${dim('No tasks found.')}\n`); return; }
  console.log(dim('  ' + padRight('ID', 10) + padRight('Title', 36) + padRight('Column', 14) + padRight('Priority', 10) + padRight('Agent', 14) + 'Project'));
  console.log(dim('  ' + '─'.repeat(100)));
  const co: Array<Task['column']> = ['backlog', 'in-progress', 'review', 'done'];
  tasks.sort((a: Task, b: Task) => co.indexOf(a.column) - co.indexOf(b.column) || a.order - b.order);
  for (const task of tasks) {
    const cc = (COL_COLORS as any)[task.column] || chalk.white;
    const pc = (PRIORITY_COLORS as any)[task.priority] || chalk.white;
    const project = data.projects.find((p: Project) => p.id === task.projectId);
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
  saveData(data);
  logActivity(data as any, 'task_moved', `Task "${task.title}" moved ${oldCol} → ${targetColumn}`, task.projectId);
  console.log(renderResult('success', `Task moved: ${shortId(task.id)}`, [`${dim('New column:')} ${brand(targetColumn)}`]));
}

function taskDone(idPrefix: string) {
  taskMove(idPrefix, 'done');
}

function taskRemove(idPrefix: string) {
  if (!idPrefix) { console.log(renderResult('error', 'Usage: cm task rm <id>')); return; }
  const data = loadData();
  const task = findTaskByIdPrefix(data, idPrefix);
  if (!task) { console.log(renderResult('error', `Task not found: ${idPrefix}`)); return; }
  data.tasks = data.tasks.filter((t: Task) => t.id !== task.id);
  logActivity(data as any, 'task_deleted', `Task "${task.title}" deleted`, task.projectId);
  saveData(data);
  console.log(renderResult('success', `Task deleted: ${task.title}`));
}

async function taskDispatch(idPrefix: string, opts: any) {
  if (!idPrefix) { console.log(renderResult('error', 'Usage: cm task dispatch <id>')); return; }
  const data = loadData();
  const task = findTaskByIdPrefix(data, idPrefix);
  if (!task) { console.log(renderResult('error', `Task not found: ${idPrefix}`)); return; }
  const project = data.projects.find((p: Project) => p.id === task.projectId);
  if (!project) { console.log(renderResult('error', `Project not found for task: ${task.id}`)); return; }

  console.log(renderResult('info', `Dispatching task: ${task.title}...`));
  const success = await dispatchTaskToAgent(task, project, opts.force);
  if (success) {
    task.column = 'in-progress';
    task.updatedAt = new Date().toISOString();
    saveData(data);
  }
}

function taskStuck(opts: any) {
  const data = loadData();
  const now = new Date().getTime();
  const STUCK_THRESHOLD = 30 * 60 * 1000; // 30 mins
  const stuckTasks = data.tasks.filter((t: Task) => {
    if (t.column !== 'in-progress') return false;
    const lastUpdate = new Date(t.updatedAt).getTime();
    return (now - lastUpdate) > STUCK_THRESHOLD;
  });
  if (stuckTasks.length === 0) { console.log(renderResult('success', 'No stuck tasks detected.')); return; }
  console.log(renderCommandHeader('Stuck Tasks Detected', '⚠️'));
  for (const t of stuckTasks) {
    const project = data.projects.find((p: Project) => p.id === t.projectId);
    console.log(`  ${dim(shortId(t.id))} ${padRight(t.title, 40)} ${brand(project?.name || '—')} ${dim('Stuck for ' + Math.round((now - new Date(t.updatedAt).getTime()) / 60000) + 'm')}`);
  }
}
