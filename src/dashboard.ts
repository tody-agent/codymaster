import express from 'express';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { loadData, saveData, logActivity, DATA_FILE, PID_FILE, DEFAULT_PORT } from './data';
import type { Project, Task, Deployment, ChangelogEntry } from './data';
import { dispatchTaskToAgent, validateDispatch } from './agent-dispatch';
import { ensureCmDir, readContinuityState, writeContinuityMd, getContinuityStatus, addLearning, getLearnings, addDecision, getDecisions, hasCmDir } from './continuity';
import type { ContinuityState, Learning, Decision } from './continuity';
import { evaluateAllTasks, evaluateTaskState, suggestAgentsForTask, suggestAgentsForSkill, getSkillDomain } from './judge';

// ─── Dashboard Server ───────────────────────────────────────────────────────

export function launchDashboard(port: number = DEFAULT_PORT) {
  const app = express();
  app.use(express.json());

  const publicDir = path.join(__dirname, '..', 'public', 'dashboard');
  app.use(express.static(publicDir));

  // ─── Project API ────────────────────────────────────────────────────────

  app.get('/api/projects', (_req, res) => {
    const data = loadData();
    const enriched = data.projects.map(p => {
      const pt = data.tasks.filter(t => t.projectId === p.id);
      return { ...p, taskCount: pt.length, doneCount: pt.filter(t => t.column === 'done').length, activeAgents: [...new Set(pt.map(t => t.agent).filter(Boolean))] };
    });
    res.json(enriched);
  });

  app.post('/api/projects', (req, res) => {
    const data = loadData();
    const { name, path: pp, agents } = req.body;
    if (!name || typeof name !== 'string') { res.status(400).json({ error: 'Project name is required' }); return; }
    const project: Project = { id: crypto.randomUUID(), name: name.trim(), path: (pp || '').trim(), agents: Array.isArray(agents) ? agents : [], createdAt: new Date().toISOString() };
    data.projects.push(project);
    logActivity(data, 'project_created', `Project "${project.name}" created`, project.id);
    saveData(data);
    res.status(201).json(project);
  });

  app.put('/api/projects/:id', (req, res) => {
    const data = loadData();
    const idx = data.projects.findIndex(p => p.id === req.params.id);
    if (idx === -1) { res.status(404).json({ error: 'Project not found' }); return; }
    const { name, path: pp, agents } = req.body;
    if (name) data.projects[idx].name = String(name).trim();
    if (pp !== undefined) data.projects[idx].path = String(pp).trim();
    if (Array.isArray(agents)) data.projects[idx].agents = agents;
    saveData(data);
    res.json(data.projects[idx]);
  });

  app.delete('/api/projects/:id', (req, res) => {
    const data = loadData();
    const idx = data.projects.findIndex(p => p.id === req.params.id);
    if (idx === -1) { res.status(404).json({ error: 'Project not found' }); return; }
    const name = data.projects[idx].name;
    data.projects.splice(idx, 1);
    data.tasks = data.tasks.filter(t => t.projectId !== req.params.id);
    logActivity(data, 'project_deleted', `Project "${name}" deleted`, req.params.id);
    saveData(data);
    res.status(204).send();
  });

  // ─── Task API ───────────────────────────────────────────────────────────

  app.get('/api/tasks', (req, res) => {
    const data = loadData();
    let tasks = data.tasks;
    if (req.query.projectId) tasks = tasks.filter(t => t.projectId === req.query.projectId);
    res.json(tasks);
  });

  app.post('/api/tasks', (req, res) => {
    const data = loadData();
    const { title, description, column, priority, projectId, agent, skill } = req.body;
    if (!title || typeof title !== 'string') { res.status(400).json({ error: 'Title is required' }); return; }

    let rpid = projectId;
    if (!rpid && data.projects.length > 0) rpid = data.projects[0].id;
    else if (!rpid) {
      const dp: Project = { id: crypto.randomUUID(), name: 'Default Project', path: process.cwd(), agents: agent ? [agent] : [], createdAt: new Date().toISOString() };
      data.projects.push(dp);
      rpid = dp.id;
    }

    const vc = ['backlog', 'in-progress', 'review', 'done'];
    const tc = vc.includes(column) ? column : 'backlog';
    const vp = ['low', 'medium', 'high', 'urgent'];
    const tp = vp.includes(priority) ? priority : 'medium';
    const ct = data.tasks.filter(t => t.column === tc && t.projectId === rpid);
    const mo = ct.length > 0 ? Math.max(...ct.map(t => t.order)) : -1;
    const now = new Date().toISOString();

    const task: Task = { id: crypto.randomUUID(), projectId: rpid, title: title.trim(), description: (description || '').trim(), column: tc, order: mo + 1, priority: tp, agent: (agent || '').trim(), skill: (skill || '').trim(), createdAt: now, updatedAt: now };
    data.tasks.push(task);

    if (agent) {
      const project = data.projects.find(p => p.id === rpid);
      if (project && !project.agents.includes(agent)) project.agents.push(agent);
    }

    logActivity(data, 'task_created', `Task "${task.title}" created`, rpid, agent || '', { taskId: task.id, column: tc });
    saveData(data);
    res.status(201).json(task);
  });

  app.post('/api/tasks/sync', (req, res) => {
    const data = loadData();
    const { projectId, projectName, projectPath, agent, skill, tasks: incoming } = req.body;
    if (!Array.isArray(incoming) || incoming.length === 0) { res.status(400).json({ error: 'tasks array required' }); return; }

    let project = projectId ? data.projects.find(p => p.id === projectId) : data.projects.find(p => p.name === projectName || p.path === projectPath);
    if (!project) {
      project = { id: crypto.randomUUID(), name: projectName || 'Untitled', path: projectPath || '', agents: agent ? [agent] : [], createdAt: new Date().toISOString() };
      data.projects.push(project);
    }
    if (agent && !project.agents.includes(agent)) project.agents.push(agent);

    const now = new Date().toISOString();
    const created: Task[] = [];
    for (const inc of incoming) {
      const col = inc.column || 'backlog';
      const ct = data.tasks.filter(t => t.column === col && t.projectId === project!.id);
      const mo = ct.length > 0 ? Math.max(...ct.map(t => t.order)) : -1;
      const task: Task = { id: crypto.randomUUID(), projectId: project!.id, title: String(inc.title || '').trim(), description: String(inc.description || '').trim(), column: col, order: mo + 1, priority: inc.priority || 'medium', agent: agent || '', skill: skill || '', createdAt: now, updatedAt: now };
      data.tasks.push(task);
      created.push(task);
    }

    logActivity(data, 'task_created', `Synced ${created.length} tasks`, project.id, agent || '', { count: created.length });
    saveData(data);
    res.status(201).json({ project, tasks: created });
  });

  app.put('/api/tasks/:id', (req, res) => {
    const data = loadData();
    const idx = data.tasks.findIndex(t => t.id === req.params.id);
    if (idx === -1) { res.status(404).json({ error: 'Task not found' }); return; }
    const { title, description, priority, agent, skill } = req.body;
    if (title !== undefined) data.tasks[idx].title = String(title).trim();
    if (description !== undefined) data.tasks[idx].description = String(description).trim();
    if (agent !== undefined) data.tasks[idx].agent = String(agent).trim();
    if (skill !== undefined) data.tasks[idx].skill = String(skill).trim();
    const vp = ['low', 'medium', 'high', 'urgent'];
    if (priority && vp.includes(priority)) data.tasks[idx].priority = priority;
    data.tasks[idx].updatedAt = new Date().toISOString();
    logActivity(data, 'task_updated', `Task "${data.tasks[idx].title}" updated`, data.tasks[idx].projectId, agent || '');
    saveData(data);
    res.json(data.tasks[idx]);
  });

  app.put('/api/tasks/:id/move', (req, res) => {
    const data = loadData();
    const idx = data.tasks.findIndex(t => t.id === req.params.id);
    if (idx === -1) { res.status(404).json({ error: 'Task not found' }); return; }
    const { column, order } = req.body;
    const vc = ['backlog', 'in-progress', 'review', 'done'];
    if (!column || !vc.includes(column)) { res.status(400).json({ error: 'Valid column required' }); return; }

    const task = data.tasks[idx];
    const oldCol = task.column;
    const newO = typeof order === 'number' ? order : 0;
    task.column = column; task.order = newO; task.updatedAt = new Date().toISOString();

    const tt = data.tasks.filter(t => t.column === column && t.id !== task.id && t.projectId === task.projectId).sort((a, b) => a.order - b.order);
    tt.splice(newO, 0, task);
    tt.forEach((t, i) => { t.order = i; });

    if (oldCol !== column) {
      data.tasks.filter(t => t.column === oldCol && t.projectId === task.projectId).sort((a, b) => a.order - b.order).forEach((t, i) => { t.order = i; });
    }

    const actType = column === 'done' ? 'task_done' : 'task_moved';
    logActivity(data, actType, `Task "${task.title}" moved: ${oldCol} → ${column}`, task.projectId, task.agent, { from: oldCol, to: column });
    saveData(data);
    res.json(task);
  });

  app.delete('/api/tasks/:id', (req, res) => {
    const data = loadData();
    const idx = data.tasks.findIndex(t => t.id === req.params.id);
    if (idx === -1) { res.status(404).json({ error: 'Task not found' }); return; }
    const [removed] = data.tasks.splice(idx, 1);
    data.tasks.filter(t => t.column === removed.column && t.projectId === removed.projectId).sort((a, b) => a.order - b.order).forEach((t, i) => { t.order = i; });
    logActivity(data, 'task_deleted', `Task "${removed.title}" deleted`, removed.projectId, removed.agent);
    saveData(data);
    res.status(204).send();
  });

  // ─── Task Dispatch API ──────────────────────────────────────────────────

  app.post('/api/tasks/:id/dispatch', (req, res) => {
    const data = loadData();
    const task = data.tasks.find(t => t.id === req.params.id);
    if (!task) { res.status(404).json({ error: 'Task not found' }); return; }

    const project = data.projects.find(p => p.id === task.projectId);
    const force = req.query.force === 'true';

    // Validate before dispatch
    const validationError = validateDispatch(task, project, force);
    if (validationError) {
      const statusCode = validationError.errorCode === 'ALREADY_DISPATCHED' ? 409
        : validationError.errorCode === 'WRITE_ERROR' ? 500 : 400;
      res.status(statusCode).json({ error: validationError.error, errorCode: validationError.errorCode });
      return;
    }

    // Dispatch
    const result = dispatchTaskToAgent(task, project!, force);

    if (result.success) {
      // Update task dispatch status
      task.dispatchStatus = 'dispatched';
      task.dispatchedAt = new Date().toISOString();
      task.dispatchError = undefined;
      task.updatedAt = task.dispatchedAt;

      logActivity(data, 'task_dispatched', `Task "${task.title}" dispatched to ${task.agent}`, task.projectId, task.agent, {
        taskId: task.id, filePath: result.filePath, skill: task.skill, force,
      });
      saveData(data);

      res.json({ success: true, task, filePath: result.filePath });
    } else {
      // Mark as failed
      task.dispatchStatus = 'failed';
      task.dispatchError = result.error;
      task.updatedAt = new Date().toISOString();
      saveData(data);

      res.status(500).json({ error: result.error, errorCode: result.errorCode });
    }
  });

  // ─── Activity API ──────────────────────────────────────────────────────

  app.get('/api/activities', (req, res) => {
    const data = loadData();
    let activities = data.activities;
    if (req.query.projectId) activities = activities.filter(a => a.projectId === req.query.projectId);
    const limit = parseInt(String(req.query.limit)) || 50;
    res.json(activities.slice(0, limit));
  });

  // ─── Deployment API ────────────────────────────────────────────────────

  app.get('/api/deployments', (req, res) => {
    const data = loadData();
    let deps = data.deployments;
    if (req.query.projectId) deps = deps.filter(d => d.projectId === req.query.projectId);
    res.json(deps);
  });

  app.post('/api/deployments', (req, res) => {
    const data = loadData();
    const { projectId, env, commit, branch, agent, message } = req.body;
    if (!projectId || !env) { res.status(400).json({ error: 'projectId and env required' }); return; }
    const validEnvs = ['staging', 'production'];
    if (!validEnvs.includes(env)) { res.status(400).json({ error: 'env must be staging or production' }); return; }

    const now = new Date().toISOString();
    const dep: Deployment = {
      id: crypto.randomUUID(), projectId, env, status: 'success',
      commit: commit || '', branch: branch || 'main',
      agent: agent || '', message: message || `Deploy to ${env}`,
      startedAt: now, finishedAt: now,
    };
    data.deployments.unshift(dep);
    logActivity(data, env === 'staging' ? 'deploy_staging' : 'deploy_production', `Deployed to ${env}: ${dep.message}`, projectId, agent || '', { deploymentId: dep.id, commit, branch });
    saveData(data);
    res.status(201).json(dep);
  });

  app.put('/api/deployments/:id/status', (req, res) => {
    const data = loadData();
    const dep = data.deployments.find(d => d.id === req.params.id);
    if (!dep) { res.status(404).json({ error: 'Deployment not found' }); return; }
    const { status } = req.body;
    const vs = ['pending', 'running', 'success', 'failed', 'rolled_back'];
    if (!vs.includes(status)) { res.status(400).json({ error: 'Invalid status' }); return; }
    dep.status = status;
    dep.finishedAt = new Date().toISOString();
    if (status === 'failed') logActivity(data, 'deploy_failed', `Deploy to ${dep.env} failed`, dep.projectId, dep.agent, { deploymentId: dep.id });
    saveData(data);
    res.json(dep);
  });

  app.post('/api/deployments/:id/rollback', (req, res) => {
    const data = loadData();
    const dep = data.deployments.find(d => d.id === req.params.id);
    if (!dep) { res.status(404).json({ error: 'Deployment not found' }); return; }
    dep.status = 'rolled_back';

    const now = new Date().toISOString();
    const rollback: Deployment = {
      id: crypto.randomUUID(), projectId: dep.projectId, env: dep.env, status: 'success',
      commit: '', branch: dep.branch, agent: req.body.agent || '', message: `Rollback of deploy ${dep.id.substring(0, 8)}`,
      startedAt: now, finishedAt: now, rollbackOf: dep.id,
    };
    data.deployments.unshift(rollback);
    logActivity(data, 'rollback', `Rolled back ${dep.env} deploy: ${dep.message}`, dep.projectId, req.body.agent || '', { originalDeployId: dep.id, rollbackId: rollback.id });
    saveData(data);
    res.status(201).json(rollback);
  });

  // ─── Changelog API ─────────────────────────────────────────────────────

  app.get('/api/changelog', (req, res) => {
    const data = loadData();
    let entries = data.changelog;
    if (req.query.projectId) entries = entries.filter(c => c.projectId === req.query.projectId);
    res.json(entries);
  });

  app.post('/api/changelog', (req, res) => {
    const data = loadData();
    const { projectId, version, title, changes, deploymentId, agent } = req.body;
    if (!version || !title) { res.status(400).json({ error: 'version and title required' }); return; }
    const entry: ChangelogEntry = {
      id: crypto.randomUUID(), projectId: projectId || '', version, title,
      changes: Array.isArray(changes) ? changes : [], deploymentId: deploymentId || '',
      agent: agent || '', createdAt: new Date().toISOString(),
    };
    data.changelog.unshift(entry);
    logActivity(data, 'changelog_added', `Changelog v${version}: ${title}`, projectId || '', agent || '', { changelogId: entry.id });
    saveData(data);
    res.status(201).json(entry);
  });

  // ─── Continuity / Working Memory API ───────────────────────────────────

  app.get('/api/continuity', (req, res) => {
    const data = loadData();
    const results: Record<string, any> = {};
    for (const project of data.projects) {
      if (project.path && hasCmDir(project.path)) {
        results[project.id] = getContinuityStatus(project.path);
      }
    }
    res.json(results);
  });

  app.get('/api/continuity/:projectId', (req, res) => {
    const data = loadData();
    const project = data.projects.find(p => p.id === req.params.projectId);
    if (!project || !project.path) { res.status(404).json({ error: 'Project not found or no path' }); return; }
    if (!hasCmDir(project.path)) { res.status(404).json({ error: 'Working memory not initialized. Run: cm continuity init' }); return; }
    const status = getContinuityStatus(project.path);
    const state = readContinuityState(project.path);
    res.json({ status, state });
  });

  app.post('/api/continuity/:projectId', (req, res) => {
    const data = loadData();
    const project = data.projects.find(p => p.id === req.params.projectId);
    if (!project || !project.path) { res.status(404).json({ error: 'Project not found' }); return; }
    if (!hasCmDir(project.path)) ensureCmDir(project.path);
    const state = req.body as ContinuityState;
    writeContinuityMd(project.path, state);
    res.json({ success: true, state });
  });

  app.get('/api/learnings/:projectId', (req, res) => {
    const data = loadData();
    const project = data.projects.find(p => p.id === req.params.projectId);
    if (!project || !project.path) { res.status(404).json({ error: 'Project not found' }); return; }
    const learnings = hasCmDir(project.path) ? getLearnings(project.path) : [];
    res.json(learnings);
  });

  app.post('/api/learnings/:projectId', (req, res) => {
    const data = loadData();
    const project = data.projects.find(p => p.id === req.params.projectId);
    if (!project || !project.path) { res.status(404).json({ error: 'Project not found' }); return; }
    if (!hasCmDir(project.path)) ensureCmDir(project.path);
    const { whatFailed, whyFailed, howToPrevent, agent, taskId } = req.body;
    if (!whatFailed) { res.status(400).json({ error: 'whatFailed is required' }); return; }
    const learning = addLearning(project.path, {
      whatFailed, whyFailed: whyFailed || '', howToPrevent: howToPrevent || '',
      timestamp: new Date().toISOString(), agent: agent || '', taskId: taskId || '',
    });
    res.status(201).json(learning);
  });

  app.get('/api/decisions/:projectId', (req, res) => {
    const data = loadData();
    const project = data.projects.find(p => p.id === req.params.projectId);
    if (!project || !project.path) { res.status(404).json({ error: 'Project not found' }); return; }
    const decisions = hasCmDir(project.path) ? getDecisions(project.path) : [];
    res.json(decisions);
  });

  app.post('/api/decisions/:projectId', (req, res) => {
    const data = loadData();
    const project = data.projects.find(p => p.id === req.params.projectId);
    if (!project || !project.path) { res.status(404).json({ error: 'Project not found' }); return; }
    if (!hasCmDir(project.path)) ensureCmDir(project.path);
    const { decision, rationale, agent } = req.body;
    if (!decision) { res.status(400).json({ error: 'decision is required' }); return; }
    const entry = addDecision(project.path, {
      decision, rationale: rationale || '', timestamp: new Date().toISOString(), agent: agent || '',
    });
    res.status(201).json(entry);
  });

  app.post('/api/continuity/:projectId/init', (req, res) => {
    const data = loadData();
    const project = data.projects.find(p => p.id === req.params.projectId);
    if (!project || !project.path) { res.status(404).json({ error: 'Project not found' }); return; }
    ensureCmDir(project.path);
    const status = getContinuityStatus(project.path);
    res.json({ success: true, status });
  });
  // ─── Judge Agent API ──────────────────────────────────────────────────

  app.get('/api/judge', (req, res) => {
    const data = loadData();
    let tasks = data.tasks;
    if (req.query.projectId) {
      tasks = tasks.filter(t => t.projectId === req.query.projectId);
    }

    // Collect learnings from all projects
    let allLearnings: Learning[] = [];
    for (const project of data.projects) {
      if (project.path && hasCmDir(project.path)) {
        allLearnings = allLearnings.concat(getLearnings(project.path));
      }
    }

    const decisions = evaluateAllTasks(tasks, allLearnings);
    const result: Record<string, any> = {};
    for (const [taskId, decision] of decisions) {
      result[taskId] = decision;
    }
    res.json(result);
  });

  app.get('/api/judge/:taskId', (req, res) => {
    const data = loadData();
    const task = data.tasks.find(t => t.id === req.params.taskId);
    if (!task) { res.status(404).json({ error: 'Task not found' }); return; }

    const project = data.projects.find(p => p.id === task.projectId);
    let learnings: Learning[] = [];
    if (project?.path && hasCmDir(project.path)) {
      learnings = getLearnings(project.path);
    }

    const decision = evaluateTaskState(task, data.tasks, learnings);
    res.json({ task: task.id, ...decision });
  });

  // ─── Agent Suggestion API ─────────────────────────────────────────────

  app.get('/api/agents/suggest', (req, res) => {
    const skill = String(req.query.skill || '');
    if (!skill) {
      res.json({ agents: suggestAgentsForSkill('cm-execution'), domain: 'orchestration' });
      return;
    }
    const domain = getSkillDomain(skill);
    const agents = suggestAgentsForSkill(skill);
    res.json({ skill, domain, agents });
  });

  app.get('/api/agents/suggest/:taskId', (req, res) => {
    const data = loadData();
    const task = data.tasks.find(t => t.id === req.params.taskId);
    if (!task) { res.status(404).json({ error: 'Task not found' }); return; }
    const suggestions = suggestAgentsForTask(task);
    res.json({ taskId: task.id, skill: task.skill, suggestions });
  });

  // ─── Fallback ──────────────────────────────────────────────────────────

  app.get('/{*path}', (_req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });

  // ─── Start Server ─────────────────────────────────────────────────────

  const server = app.listen(port, () => {
    try { fs.writeFileSync(PID_FILE, String(process.pid)); } catch {}
    console.log(chalk.cyan(`\n🚀 CodyMaster Dashboard v3 at http://localhost:${port}`));
    console.log(chalk.gray(`   Data: ${DATA_FILE}`));
    console.log(chalk.gray(`   Press Ctrl+C to stop.\n`));
  });

  const cleanup = () => { try { fs.unlinkSync(PID_FILE); } catch {} };
  process.on('SIGINT', () => { cleanup(); process.exit(0); });
  process.on('SIGTERM', () => { cleanup(); process.exit(0); });

  return server;
}
