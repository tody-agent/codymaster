#!/usr/bin/env node
/**
 * dashboard-watcher — Passive File Watcher Bridge
 *
 * Watches project directories for standard AI task files and auto-syncs to dashboard.
 * Zero config for AI tools — just write .ai-tasks.json, the watcher picks it up.
 *
 * Supported file formats:
 *   .ai-tasks.json    Universal format (any tool)
 *   .ai-tasks.yaml    YAML variant
 *   TODO.md           Markdown checkbox lists  [ ] / [x]
 *   AGENTS.md         Claude ecosystem task sections
 *
 * Usage:
 *   node scripts/dashboard-watcher.js                    # watch cwd
 *   node scripts/dashboard-watcher.js --dir /path/to    # watch a dir
 *   node scripts/dashboard-watcher.js --dirs a,b,c      # watch multiple dirs
 *   node scripts/dashboard-watcher.js --daemon           # detach (nohup)
 *   node scripts/dashboard-watcher.js --poll 5000        # poll interval ms (default 3000)
 *
 * Launchd / systemd:
 *   See SKILL.md for auto-start config on macOS (launchd) and Linux (systemd).
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const http = require('http');

const PORT = Number(process.env.CM_DASHBOARD_PORT || 6969);

// ── Arg parsing ───────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
function getArg(name) {
  const i = argv.indexOf(`--${name}`);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : null;
}
function hasFlag(name) { return argv.includes(`--${name}`); }

const POLL_INTERVAL = Number(getArg('poll') || 3000);
const WATCH_DIRS = (getArg('dirs') || getArg('dir') || process.cwd())
  .split(',')
  .map(d => path.resolve(d.trim()));

const WATCH_FILES = [
  '.ai-tasks.json',
  '.ai-tasks.yaml',
  '.ai-tasks.yml',
  'TODO.md',
  'AGENTS.md',
];

// ── HTTP helper ───────────────────────────────────────────────────────────────

function postJson(payload) {
  return new Promise((resolve) => {
    const body = JSON.stringify(payload);
    const req  = http.request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/tasks/auto-sync',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => { res.resume(); resolve(res.statusCode); }
    );
    req.on('error', () => resolve(null));
    req.write(body);
    req.end();
  });
}

async function dashboardAlive() {
  return new Promise((resolve) => {
    const req = http.request({ hostname: 'localhost', port: PORT, path: '/api/projects', method: 'GET' },
      (res) => { res.resume(); resolve(res.statusCode === 200); });
    req.on('error', () => resolve(false));
    req.end();
  });
}

// ── Status normalisation ──────────────────────────────────────────────────────

const STATUS_MAP = {
  pending: 'backlog', todo: 'backlog', backlog: 'backlog', '[ ]': 'backlog', '': 'backlog',
  in_progress: 'in-progress', 'in-progress': 'in-progress', active: 'in-progress', wip: 'in-progress',
  review: 'review', testing: 'review',
  completed: 'done', done: 'done', '[x]': 'done', closed: 'done', cancelled: 'done',
};

function normaliseStatus(s) {
  return STATUS_MAP[(s || 'pending').toLowerCase()] || 'backlog';
}

// ── Parsers ───────────────────────────────────────────────────────────────────

function parseAiTasksJson(filePath) {
  try {
    const raw  = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);
    return {
      session:  data.session  || `watch:${path.basename(filePath)}`,
      project:  data.project  || path.basename(path.dirname(filePath)),
      agent:    data.agent    || 'watcher',
      tasks:    (data.tasks || data.todos || []).map(t => ({
        title:    t.title || t.content || t.description || String(t.id || '?'),
        status:   normaliseStatus(t.status),
        priority: t.priority || 'medium',
      })),
    };
  } catch { return null; }
}

function parseTodoMd(filePath) {
  try {
    const lines   = fs.readFileSync(filePath, 'utf8').split('\n');
    const project = path.basename(path.dirname(filePath));
    const tasks   = [];
    let   inTasks = false;

    for (const line of lines) {
      // Support ## Tasks / ## TODO / ## To Do sections
      if (/^#+\s*(tasks?|todo|to[- ]do)/i.test(line)) { inTasks = true; continue; }
      if (/^#+/.test(line) && inTasks) { inTasks = false; }

      // Markdown checkboxes anywhere in file (not just in sections)
      const cbMatch = line.match(/^\s*[-*]\s+\[([ xX])\]\s+(.+)$/);
      if (cbMatch) {
        tasks.push({
          title:  cbMatch[2].trim(),
          status: cbMatch[1].trim() === '' ? 'backlog' : 'done',
          priority: 'medium',
        });
      }
    }
    return tasks.length ? { session: `todo-md:${project}`, project, agent: 'watcher', tasks } : null;
  } catch { return null; }
}

function parseAgentsMd(filePath) {
  try {
    const lines   = fs.readFileSync(filePath, 'utf8').split('\n');
    const project = path.basename(path.dirname(filePath));
    const tasks   = [];
    let   capture = false;

    for (const line of lines) {
      // Capture sections named Tasks / Current Tasks / Active Tasks / TODO
      if (/^#+\s*(current\s+)?tasks?|todo|active\s+tasks?/i.test(line)) { capture = true; continue; }
      if (/^#+/.test(line) && capture) { capture = false; }

      if (capture) {
        const cbMatch = line.match(/^\s*[-*]\s+\[([ xX])\]\s+(.+)$/);
        if (cbMatch) {
          tasks.push({
            title:  cbMatch[2].trim(),
            status: cbMatch[1].trim() === '' ? 'backlog' : 'done',
            priority: 'medium',
          });
        }
        // Bare list items without checkboxes → backlog
        const bareMatch = line.match(/^\s*[-*]\s+(?!\[)(.+)$/);
        if (bareMatch) {
          tasks.push({ title: bareMatch[1].trim(), status: 'backlog', priority: 'medium' });
        }
      }
    }
    return tasks.length ? { session: `agents-md:${project}`, project, agent: 'watcher', tasks } : null;
  } catch { return null; }
}

// ── File → parser dispatch ────────────────────────────────────────────────────

function parseFile(filePath) {
  const base = path.basename(filePath).toLowerCase();
  if (base === '.ai-tasks.json') return parseAiTasksJson(filePath);
  if (base === '.ai-tasks.yaml' || base === '.ai-tasks.yml') {
    // Simple YAML scalar support (no external deps)
    // Falls back to JSON-like parsing — for full YAML use js-yaml
    return parseAiTasksJson(filePath);
  }
  if (base === 'todo.md')   return parseTodoMd(filePath);
  if (base === 'agents.md') return parseAgentsMd(filePath);
  return null;
}

// ── Sync a parsed file payload ────────────────────────────────────────────────

async function syncPayload(payload) {
  if (!payload || !payload.tasks.length) return 0;
  const results = await Promise.all(
    payload.tasks.map(t => postJson({
      conversationId: `${payload.session}:${encodeURIComponent(t.title)}`,
      title:    t.title,
      status:   t.status,
      priority: t.priority,
      agent:    payload.agent,
      projectName: payload.project,
    }))
  );
  return results.filter(s => s && s < 400).length;
}

// ── Watch state (mtimes) ──────────────────────────────────────────────────────

const mtimes = new Map();

async function checkDir(dir) {
  for (const filename of WATCH_FILES) {
    const filePath = path.join(dir, filename);
    if (!fs.existsSync(filePath)) continue;

    const { mtimeMs } = fs.statSync(filePath);
    const prev = mtimes.get(filePath);
    if (prev === mtimeMs) continue;   // unchanged
    mtimes.set(filePath, mtimeMs);

    const payload = parseFile(filePath);
    if (!payload) continue;

    const ok = await syncPayload(payload);
    if (ok > 0) {
      stamp(`Synced ${ok}/${payload.tasks.length} tasks from ${filename} [${payload.project}]`);
    }
  }
}

// ── Pretty timestamp ──────────────────────────────────────────────────────────

function stamp(msg) {
  const t = new Date().toLocaleTimeString('en-US', { hour12: false });
  console.log(`[${t}] ${msg}`);
}

// ── Main loop ─────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n📡  cm-dashboard watcher`);
  console.log(`   Watching: ${WATCH_DIRS.join(', ')}`);
  console.log(`   Files:    ${WATCH_FILES.join(', ')}`);
  console.log(`   Poll:     every ${POLL_INTERVAL / 1000}s`);
  console.log(`   Port:     ${PORT}`);
  console.log(`   Press Ctrl+C to stop\n`);

  // Wait for dashboard to be ready
  let attempts = 0;
  while (!await dashboardAlive()) {
    if (attempts++ === 0) stamp('Waiting for dashboard to start…');
    if (attempts > 20) { console.error('Dashboard not reachable after 60s. Exiting.'); process.exit(1); }
    await new Promise(r => setTimeout(r, 3000));
  }
  stamp('Dashboard connected ✅');

  // Poll loop
  while (true) {
    for (const dir of WATCH_DIRS) {
      try { await checkDir(dir); } catch (e) { /* keep running */ }
    }
    await new Promise(r => setTimeout(r, POLL_INTERVAL));
  }
}

main().catch(e => {
  console.error('dashboard-watcher error:', e.message);
  process.exit(1);
});
