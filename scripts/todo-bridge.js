#!/usr/bin/env node
/**
 * cm-dashboard Todo Bridge — Phase 1 (Claude Code PostToolUse hook)
 *
 * Invoked by Claude Code as a PostToolUse hook on every TodoWrite event.
 * Reads the hook payload from stdin, maps todos to dashboard tasks,
 * and POSTs each to /api/tasks/auto-sync.
 *
 * Install:
 *   cp scripts/todo-bridge.js ~/.claude/scripts/todo-bridge.js
 *
 * Hook config (~/.claude/settings.json):
 *   {
 *     "hooks": {
 *       "PostToolUse": [{
 *         "matcher": "TodoWrite",
 *         "hooks": [{ "type": "command", "command": "node ~/.claude/scripts/todo-bridge.js" }]
 *       }]
 *     }
 *   }
 */

'use strict';

const http = require('http');
const path = require('path');

const DASHBOARD_PORT = process.env.CM_DASHBOARD_PORT || 6969;

// Map TodoWrite status → dashboard column
const STATUS_MAP = {
  pending: 'backlog',
  in_progress: 'in-progress',
  completed: 'done',
};

// Map TodoWrite priority → dashboard priority
const PRIORITY_MAP = {
  high: 'high',
  medium: 'medium',
  low: 'low',
  urgent: 'urgent',
};

function postJson(payload) {
  return new Promise((resolve) => {
    const body = JSON.stringify(payload);
    const req = http.request(
      {
        hostname: 'localhost',
        port: DASHBOARD_PORT,
        path: '/api/tasks/auto-sync',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        res.resume(); // drain
        resolve(res.statusCode);
      }
    );
    req.on('error', () => resolve(null)); // silent — dashboard may not be running
    req.write(body);
    req.end();
  });
}

async function main() {
  // Read stdin
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) process.exit(0);

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    process.exit(0); // not JSON — ignore
  }

  // Only handle TodoWrite
  if (payload.tool_name !== 'TodoWrite') process.exit(0);

  const todos = payload.tool_input?.todos;
  if (!Array.isArray(todos) || todos.length === 0) process.exit(0);

  const sessionId = payload.session_id || 'unknown';
  const cwd = payload.cwd || process.cwd();
  const projectName = path.basename(cwd);

  // Fire all syncs concurrently
  await Promise.all(
    todos.map((todo) => {
      const column = STATUS_MAP[todo.status] || 'backlog';
      return postJson({
        conversationId: `${sessionId}:${todo.id}`,
        title: todo.content,
        status: column,
        agent: 'claude-code',
        priority: PRIORITY_MAP[todo.priority] || 'medium',
        projectName,
      });
    })
  );

  process.exit(0);
}

main().catch(() => process.exit(0)); // always silent
