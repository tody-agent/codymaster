import crypto from 'crypto';
import { Command } from 'commander';
import chalk from 'chalk';
import { 
  loadData, saveData, logActivity, findProjectByNameOrId, shortId,
  Project, Deployment, ChangelogEntry, Task
} from '../../data';
import { brand, dim, success, warning, STATUS as STATUS_COLORS } from '../../ui/theme';
import { renderResult, renderCommandHeader } from '../../ui/box';
import { formatTimeAgoCli, padRight } from '../../utils/cli-utils';

export function registerProjectCommands(program: Command) {
  // ─── Project Command ───────────────────────────────────────────────────────
  program
    .command('project <cmd> [args...]')
    .alias('p')
    .description('Project management (add|list|rm)')
    .action((cmd, args, opts) => {
      switch (cmd) {
        case 'add': projectAdd(args[0], opts); break;
        case 'list': case 'ls': projectList(); break;
        case 'rm': case 'delete': projectRemove(args[0]); break;
        default: console.log(renderResult('error', `Unknown: ${cmd}`, [dim('Available: add, list, rm')]));
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
        case 'staging': case 'stg': deployRecord('staging', opts); break;
        case 'production': case 'prod': deployRecord('production', opts); break;
        case 'list': case 'ls': deployList(opts); break;
        default: console.log(renderResult('error', `Unknown: ${cmd}`, [dim('Available: staging, production, list')]));
      }
    });

  // ─── Rollback Command ───────────────────────────────────────────────────────
  program
    .command('rollback <deployId>')
    .alias('rb')
    .description('Rollback a deployment')
    .option('--agent <agent>', 'Agent name')
    .action((deployId: string, opts: any) => {
      const data = loadData();
      const dep = data.deployments.find((d: Deployment) => d.id === deployId || d.id.startsWith(deployId));
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
      logActivity(data as any, 'rollback', `Rolled back ${dep.env} deploy: ${dep.message}`, dep.projectId, opts.agent || '', { originalDeployId: dep.id, rollbackId: rollback.id });
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
        acts = acts.filter((a: any) => a.projectId === p.id);
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
        const proj = data.projects.find((p: Project) => p.id === a.projectId);
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
}

function projectAdd(name: string, opts: any) {
  if (!name) { console.log(renderResult('error', 'Name required. Usage: cm project add "My Project"')); return; }
  const data = loadData();
  const project: Project = {
    id: crypto.randomUUID(), name, path: process.cwd(), agents: [],
    createdAt: new Date().toISOString(),
  };
  data.projects.push(project);
  logActivity(data as any, 'project_created', `Project "${name}" created via CLI`, project.id);
  saveData(data);
  console.log(renderResult('success', `Project created: ${name}`, [`${dim('ID:')} ${brand(shortId(project.id))}`]));
}

function projectList() {
  const data = loadData();
  if (data.projects.length === 0) { console.log(`\n  ${dim('No projects found.')}\n`); return; }
  console.log(renderCommandHeader('Projects', '📦'));
  for (const p of data.projects) {
    const tasks = data.tasks.filter((t: Task) => t.projectId === p.id);
    const done = tasks.filter((t: Task) => t.column === 'done').length;
    console.log(`  ${brand(shortId(p.id))} ${padRight(p.name, 30)} ${dim(`${done}/${tasks.length} tasks`)}`);
  }
  console.log();
}

function projectRemove(query: string) {
  if (!query) { console.log(renderResult('error', 'Query required. Usage: cm project rm <name|id>')); return; }
  const data = loadData();
  const p = findProjectByNameOrId(data, query);
  if (!p) { console.log(renderResult('error', `Project not found: ${query}`)); return; }
  data.projects = data.projects.filter((proj: Project) => proj.id !== p.id);
  data.tasks = data.tasks.filter((t: Task) => t.projectId !== p.id);
  logActivity(data as any, 'project_deleted', `Project "${p.name}" deleted`, p.id);
  saveData(data);
  console.log(renderResult('success', `Project deleted: ${p.name}`));
}

function deployRecord(env: 'staging' | 'production', opts: any) {
  const data = loadData();
  let projectId: string | undefined;
  if (opts.project) {
    const p = findProjectByNameOrId(data, opts.project);
    if (!p) { console.log(renderResult('error', `Project not found: ${opts.project}`)); return; }
    projectId = p.id;
  } else if (data.projects.length > 0) { projectId = data.projects[0].id; }

  const now = new Date().toISOString();
  const dep: Deployment = {
    id: crypto.randomUUID(), projectId: projectId || '', env, status: 'success',
    commit: opts.commit || '', branch: opts.branch || 'main',
    message: opts.message || 'Manual deployment',
    agent: opts.agent || '', startedAt: now, finishedAt: now,
  };
  data.deployments.unshift(dep);
  logActivity(data as any, env === 'staging' ? 'deploy_staging' : 'deploy_production', `Deployed to ${env}: ${dep.message}`, projectId!, opts.agent || '', { deploymentId: dep.id });
  saveData(data);

  const envColor = env === 'production' ? success : warning;
  const project = data.projects.find((p: Project) => p.id === projectId);
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
    deps = deps.filter((d: Deployment) => d.projectId === p.id);
  }

  if (deps.length === 0) { console.log(`\n  ${dim('No deployments yet.')}\n`); return; }

  console.log(renderCommandHeader('Deployment History', '🚀'));
  console.log(dim('  ' + padRight('ID', 10) + padRight('Env', 12) + padRight('Status', 14) + padRight('Message', 32) + padRight('Branch', 12) + 'Time'));
  console.log(dim('  ' + '─'.repeat(100)));

  for (const dep of deps.slice(0, 20)) {
    const sc = (STATUS_COLORS as any)[dep.status] || chalk.white;
    const ec = dep.env === 'production' ? success : warning;
    const timeAgo = formatTimeAgoCli(dep.startedAt);
    const rollbackFlag = dep.rollbackOf ? ' ⏪' : '';
    console.log('  ' + dim(padRight(shortId(dep.id), 10)) + ec(padRight(dep.env, 12)) + sc(padRight(dep.status.replace('_', ' ') + rollbackFlag, 14)) + padRight(dep.message.substring(0, 30), 32) + dim(padRight(dep.branch || '—', 12)) + dim(timeAgo));
  }
  console.log(dim(`\n  Total: ${deps.length} deployments\n`));
}

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
  logActivity(data as any, 'changelog_added', `Changelog ${version}: ${title}`, projectId, opts.agent || '');
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
    entries = entries.filter((c: ChangelogEntry) => c.projectId === p.id);
  }

  if (entries.length === 0) { console.log(`\n  ${dim('No changelog entries.')}\n`); return; }

  console.log(renderCommandHeader('Changelog', '📝'));
  for (const entry of entries) {
    const proj = data.projects.find((p: Project) => p.id === entry.projectId);
    console.log(brand(`  ${entry.version}`) + ` — ${entry.title}` + dim(` (${formatTimeAgoCli(entry.createdAt)})${proj ? ' [' + proj.name + ']' : ''}`));
    if (entry.changes.length > 0) { entry.changes.forEach((c: string) => console.log(dim(`    • ${c}`))); }
  }
  console.log();
}
