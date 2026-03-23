#!/usr/bin/env node
/**
 * cm-dash — Universal Dashboard CLI Bridge
 *
 * Works with ANY AI coding tool via shell. No MCP required.
 * Compatible: Codex CLI, Aider, OpenCode, shell scripts, git hooks, cron.
 *
 * Install (once):
 *   chmod +x scripts/cm-dash.js
 *   ln -sf "$(pwd)/scripts/cm-dash.js" /usr/local/bin/cm-dash
 *   # or: npm link  (adds 'cm' bin which already includes dashboard)
 *
 * Commands:
 *   cm-dash sync   --session ID --title "Task" --status in-progress \
 *                  [--project NAME] [--priority high] [--agent aider]
 *   cm-dash file   <path-to-.ai-tasks.json>
 *   cm-dash pipe                              # read .ai-tasks.json from stdin
 *   cm-dash board  [--project NAME]           # ASCII kanban in terminal
 *   cm-dash get    [--project NAME]           # JSON board state (for scripts)
 *   cm-dash move   <taskId> <status>          # transition a single task
 *   cm-dash start                             # ensure dashboard is running
 *   cm-dash status                            # exit 0 if running, 1 if not
 *
 * Shell integration examples → see SKILL.md (Codex, Aider, git hook, cron)
 */

'use strict';

const http   = require('http');
const fs     = require('fs');
const path   = require('path');
const os     = require('os');
const { execFileSync } = require('child_process');

const PORT = Number(process.env.CM_DASHBOARD_PORT || 6969);
const BASE = `http://localhost:${PORT}`;

// ── HTTP helpers ──────────────────────────────────────────────────────────────

function request(method, urlPath, body) {
  return new Promise((resolve) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost',
      port: PORT,
      path: urlPath,
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (bodyStr) opts.headers['Content-Length'] = Buffer.byteLength(bodyStr);

    const req = http.request(opts, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(Buffer.concat(chunks).toString()) }); }
        catch { resolve({ status: res.statusCode, body: null }); }
      });
    });
    req.on('error', (e) => resolve({ status: null, error: e.message }));
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function ping() {
  const r = await request('GET', '/api/projects');
  return r.status === 200;
}

// ── Status normalisation ──────────────────────────────────────────────────────

const STATUS_MAP = {
  pending:      'backlog',
  todo:         'backlog',
  backlog:      'backlog',
  new:          'backlog',
  open:         'backlog',
  in_progress:  'in-progress',
  'in-progress':'in-progress',
  active:       'in-progress',
  started:      'in-progress',
  doing:        'in-progress',
  wip:          'in-progress',
  review:       'review',
  testing:      'review',
  completed:    'done',
  done:         'done',
  closed:       'done',
  fixed:        'done',
  cancelled:    'done',
};

function normaliseStatus(s) {
  return STATUS_MAP[(s || 'pending').toLowerCase()] || 'backlog';
}

// ── Sync a single task ────────────────────────────────────────────────────────

async function syncTask({ session, title, status, project, priority, agent, skill }) {
  const payload = {
    conversationId: `${session || 'cm-dash'}:${encodeURIComponent(title)}`,
    title,
    status:   normaliseStatus(status),
    agent:    agent    || process.env.CM_AGENT   || 'cm-dash',
    skill:    skill    || '',
    priority: ['low', 'medium', 'high', 'urgent'].includes(priority) ? priority : 'medium',
    projectName: project || process.env.CM_PROJECT || path.basename(process.cwd()),
  };
  return request('POST', '/api/tasks/auto-sync', payload);
}

// ── Parse CLI args (no external deps) ────────────────────────────────────────

function parseArgs(argv) {
  const args = {};
  const pos  = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      args[key] = (argv[i + 1] && !argv[i + 1].startsWith('--')) ? argv[++i] : true;
    } else {
      pos.push(argv[i]);
    }
  }
  return { args, pos };
}

// ── ASCII board renderer ──────────────────────────────────────────────────────

function renderBoard(board) {
  const cols   = ['backlog', 'in-progress', 'review', 'done'];
  const labels = {
    backlog:      '🔴 Backlog',
    'in-progress':'🟡 In Progress',
    review:       '🔵 Review',
    done:         '🟢 Done',
  };
  const W   = 28;
  const pad = (s, w) => s.slice(0, w - 1).padEnd(w);
  const div = '─'.repeat(W);

  console.log(`\n📊  ${board.projectName || 'All projects'}  —  cm-dashboard`);
  console.log(`┌${div}┬${div}┬${div}┬${div}┐`);
  console.log(`│${cols.map(c => pad(labels[c], W)).join('│')}│`);
  console.log(`├${div}┼${div}┼${div}┼${div}┤`);

  const colTasks = cols.map(c => board.columns[c] || []);
  const maxRows  = Math.max(...colTasks.map(t => t.length), 1);

  for (let r = 0; r < maxRows; r++) {
    const cells = colTasks.map(col => {
      const t = col[r];
      return t ? pad(`• ${t.title}`, W) : ' '.repeat(W);
    });
    console.log(`│${cells.join('│')}│`);
  }
  console.log(`└${div}┴${div}┴${div}┴${div}┘`);

  const total = colTasks.reduce((s, c) => s + c.length, 0);
  const done  = (board.columns.done || []).length;
  console.log(`   ${done}/${total} tasks done\n`);
}

// ── .ai-tasks.json sync ───────────────────────────────────────────────────────
//
//  Standard format (any tool can write this):
//  {
//    "session":  "optional-session-id",
//    "project":  "optional-project-name",
//    "agent":    "aider",
//    "tasks": [
//      { "id": "1", "title": "Fix auth bug", "status": "in_progress", "priority": "high" },
//      { "id": "2", "title": "Write tests",  "status": "pending" }
//    ]
//  }

async function syncFile(filePath) {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) {
    console.error(`cm-dash: file not found: ${abs}`);
    process.exit(1);
  }
  const data  = JSON.parse(fs.readFileSync(abs, 'utf8'));
  const tasks = data.tasks || data.todos || [];
  if (!Array.isArray(tasks) || tasks.length === 0) {
    console.log('cm-dash: no tasks in file');
    return 0;
  }

  const session = data.session || `file:${path.basename(abs)}`;
  const project = data.project || path.basename(path.dirname(abs));
  const agent   = data.agent   || 'cm-dash';

  const results = await Promise.all(
    tasks.map(t => syncTask({
      session,
      title:    t.title || t.content || t.description || String(t.id || '?'),
      status:   t.status,
      priority: t.priority,
      project,
      agent,
    }))
  );

  const ok = results.filter(r => r.status && r.status < 400).length;
  console.log(`cm-dash: synced ${ok}/${tasks.length} tasks from ${path.basename(abs)}`);
  return ok;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const argv = process.argv.slice(2);
  const cmd  = argv[0];
  const rest = argv.slice(1);
  const { args, pos } = parseArgs(rest);

  // ── status ──────────────────────────────────────────────────────────────────
  if (cmd === 'status') {
    const alive = await ping();
    console.log(alive
      ? `✅ Dashboard running at ${BASE}`
      : `❌ Dashboard not running on port ${PORT}`);
    process.exit(alive ? 0 : 1);
  }

  // ── start ───────────────────────────────────────────────────────────────────
  if (cmd === 'start') {
    if (await ping()) {
      console.log(`✅ Dashboard already running at ${BASE}`);
      return;
    }
    try {
      // Use execFileSync with explicit args array — no shell injection risk
      execFileSync('cm', ['dashboard'], { stdio: 'inherit' });
    } catch {
      console.error('cm-dash: could not start dashboard. Run `cm dashboard` manually.');
      process.exit(1);
    }
    return;
  }

  // ── commands that need dashboard ─────────────────────────────────────────────
  if (cmd !== 'help' && !await ping()) {
    console.error(`cm-dash: dashboard not running on port ${PORT}. Run \`cm dashboard\` first.`);
    process.exit(1);
  }

  // ── sync ─────────────────────────────────────────────────────────────────────
  if (cmd === 'sync') {
    const title = args.title || args.t;
    if (!title) { console.error('cm-dash sync: --title is required'); process.exit(1); }
    const r = await syncTask({
      session:  args.session  || args.s  || `cli:${Date.now()}`,
      title,
      status:   args.status   || args.st || 'in-progress',
      project:  args.project  || args.p,
      priority: args.priority || args.pr,
      agent:    args.agent    || args.a,
      skill:    args.skill,
    });
    if (r.status && r.status < 400) {
      const col = normaliseStatus(args.status || 'in-progress');
      console.log(`✅ Synced: "${title}" → ${col}`);
    } else {
      console.error(`cm-dash sync failed (${r.status}): ${JSON.stringify(r.body)}`);
      process.exit(1);
    }
    return;
  }

  // ── file ─────────────────────────────────────────────────────────────────────
  if (cmd === 'file') {
    const fp = pos[0] || args.path;
    if (!fp) { console.error('cm-dash file: provide a file path'); process.exit(1); }
    await syncFile(fp);
    return;
  }

  // ── pipe ─────────────────────────────────────────────────────────────────────
  if (cmd === 'pipe') {
    const chunks = [];
    for await (const c of process.stdin) chunks.push(c);
    const raw = Buffer.concat(chunks).toString('utf8').trim();
    if (!raw) { console.log('cm-dash pipe: empty stdin'); return; }
    const tmp = path.join(os.tmpdir(), `cm-dash-pipe-${Date.now()}.json`);
    fs.writeFileSync(tmp, raw);
    await syncFile(tmp);
    try { fs.unlinkSync(tmp); } catch { /* ignore */ }
    return;
  }

  // ── board ─────────────────────────────────────────────────────────────────────
  if (cmd === 'board') {
    const [tr, pr] = await Promise.all([request('GET', '/api/tasks'), request('GET', '/api/projects')]);
    let tasks = tr.body || [];
    let projectName = 'All projects';

    if (args.project || args.p) {
      const pname = (args.project || args.p).toLowerCase();
      const proj  = (pr.body || []).find(p => p.name.toLowerCase() === pname);
      if (proj) { tasks = tasks.filter(t => t.projectId === proj.id); projectName = proj.name; }
    }

    const cols = { backlog: [], 'in-progress': [], review: [], done: [] };
    for (const t of tasks) { if (cols[t.column]) cols[t.column].push(t); }
    renderBoard({ projectName, columns: cols });
    return;
  }

  // ── get ───────────────────────────────────────────────────────────────────────
  if (cmd === 'get') {
    const [tr, pr] = await Promise.all([request('GET', '/api/tasks'), request('GET', '/api/projects')]);
    let tasks = tr.body || [];
    if (args.project || args.p) {
      const pname = (args.project || args.p).toLowerCase();
      const proj  = (pr.body || []).find(p => p.name.toLowerCase() === pname);
      if (proj) tasks = tasks.filter(t => t.projectId === proj.id);
    }
    console.log(JSON.stringify(tasks, null, 2));
    return;
  }

  // ── move ──────────────────────────────────────────────────────────────────────
  if (cmd === 'move') {
    const taskId = pos[0] || args.id;
    const status = pos[1] || args.status;
    if (!taskId || !status) {
      console.error('cm-dash move: requires <taskId> <status>');
      process.exit(1);
    }
    const column = normaliseStatus(status);
    const r = await request('PATCH', `/api/tasks/${taskId}`, { column });
    if (r.status && r.status < 400) {
      console.log(`✅ Task ${taskId} → ${column}`);
    } else {
      console.error(`cm-dash move failed (${r.status})`);
      process.exit(1);
    }
    return;
  }

  // ── help ──────────────────────────────────────────────────────────────────────
  console.log(`
cm-dash — Universal Dashboard CLI Bridge  (cm-dashboard v3.4+)

COMMANDS
  sync   --title "Task" [--session ID] [--status S] [--project P]
         [--priority P] [--agent A] [--skill S]

  file   <path>         Sync all tasks from .ai-tasks.json
  pipe                  Read .ai-tasks.json from stdin
  board  [--project P]  Print ASCII kanban board
  get    [--project P]  Print tasks as JSON
  move   <id> <status>  Move a task to a new column
  start                 Start the dashboard (\`cm dashboard\`)
  status                Check if dashboard is running (exit 0/1)

STATUS VALUES (any of these work)
  pending / todo / backlog / new / open     →  backlog
  in_progress / in-progress / active / wip  →  in-progress
  review / testing                          →  review
  completed / done / closed / cancelled     →  done

ENVIRONMENT
  CM_DASHBOARD_PORT  (default 6969)
  CM_PROJECT         Default project name
  CM_AGENT           Default agent label ("aider", "codex", "cursor"…)

EXAMPLES
  cm-dash sync --title "Fix auth bug" --status in_progress --agent aider
  cm-dash file .ai-tasks.json
  echo '{"tasks":[{"title":"Deploy","status":"done"}]}' | cm-dash pipe
  cm-dash board --project myapp
  cm-dash move abc123 done
  cm-dash status && echo "board ready"
`);
}

main().catch(e => {
  console.error('cm-dash error:', e.message);
  process.exit(1);
});
