#!/usr/bin/env node
/**
 * cm-dashboard MCP Bridge — Phase 2 (Claude Desktop)
 *
 * Standalone MCP server over stdio (no extra dependencies).
 * Exposes 3 tools that sync tasks to the cm-dashboard.
 *
 * Install:
 *   cp scripts/mcp-bridge.js ~/.claude/scripts/mcp-bridge.js
 *
 * Claude Desktop config (~/Library/Application Support/Claude/claude_desktop_config.json):
 *   {
 *     "mcpServers": {
 *       "cm-dashboard": {
 *         "command": "node",
 *         "args": ["/Users/<you>/.claude/scripts/mcp-bridge.js"]
 *       }
 *     }
 *   }
 *
 * Tools provided:
 *   cm_sync_todos  — sync TodoWrite list to dashboard
 *   cm_get_tasks   — read current board state
 *   cm_update_task — move a single task between columns
 */

'use strict';

const http = require('http');

const DASHBOARD_PORT = process.env.CM_DASHBOARD_PORT || 6969;
const SERVER_NAME = 'cm-dashboard';
const SERVER_VERSION = '1.0.0';

// ── Status mapping ────────────────────────────────────────────────────────────

const STATUS_TO_COLUMN = {
  pending: 'backlog',
  in_progress: 'in-progress',
  completed: 'done',
  backlog: 'backlog',
  'in-progress': 'in-progress',
  done: 'done',
};

// ── Dashboard HTTP helpers ────────────────────────────────────────────────────

function dashboardRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost',
      port: DASHBOARD_PORT,
      path,
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (bodyStr) options.headers['Content-Length'] = Buffer.byteLength(bodyStr);

    const req = http.request(options, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString()));
        } catch {
          resolve(null);
        }
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

// ── Tool implementations ──────────────────────────────────────────────────────

async function cmSyncTodos({ todos, projectName, sessionId }) {
  if (!Array.isArray(todos) || todos.length === 0) {
    return { synced: 0, message: 'No todos to sync.' };
  }

  const sid = sessionId || `mcp-${Date.now()}`;
  const project = projectName || 'Claude Desktop';

  const results = await Promise.allSettled(
    todos.map((todo) =>
      dashboardRequest('POST', '/api/tasks/auto-sync', {
        conversationId: `${sid}:${todo.id}`,
        title: todo.content,
        status: STATUS_TO_COLUMN[todo.status] || 'backlog',
        agent: 'claude-code',
        priority: todo.priority || 'medium',
        projectName: project,
      })
    )
  );

  const synced = results.filter((r) => r.status === 'fulfilled').length;
  return { synced, total: todos.length, projectName: project };
}

async function cmGetTasks({ projectName }) {
  const projects = await dashboardRequest('GET', '/api/projects', null);
  if (!Array.isArray(projects)) throw new Error('Dashboard not running on port ' + DASHBOARD_PORT);

  let project = projectName
    ? projects.find((p) => p.name.toLowerCase().includes(projectName.toLowerCase()))
    : projects[0];

  if (!project) return { columns: { backlog: [], 'in-progress': [], review: [], done: [] }, projectName: null };

  const tasks = await dashboardRequest('GET', `/api/tasks?projectId=${project.id}`, null);
  const columns = { backlog: [], 'in-progress': [], review: [], done: [] };
  for (const t of tasks || []) {
    if (columns[t.column]) columns[t.column].push({ id: t.id, title: t.title, priority: t.priority, agent: t.agent });
  }
  return { projectName: project.name, columns };
}

async function cmUpdateTask({ conversationId, status, title, projectName }) {
  if (!conversationId && !title) throw new Error('conversationId or title is required');
  const result = await dashboardRequest('POST', '/api/tasks/auto-sync', {
    conversationId: conversationId || `mcp-${Date.now()}:manual`,
    title: title || conversationId,
    status: STATUS_TO_COLUMN[status] || 'in-progress',
    agent: 'claude-code',
    projectName: projectName || 'Claude Desktop',
  });
  return result;
}

// ── Tool registry ─────────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'cm_sync_todos',
    description: 'Sync the current todo list to the cm-dashboard Kanban board. Call this after every TodoWrite to keep the dashboard up to date.',
    inputSchema: {
      type: 'object',
      properties: {
        todos: {
          type: 'array',
          description: 'The todos array from TodoWrite',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              content: { type: 'string' },
              status: { type: 'string', enum: ['pending', 'in_progress', 'completed'] },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] },
            },
            required: ['id', 'content', 'status'],
          },
        },
        projectName: { type: 'string', description: 'Project name on the dashboard (defaults to "Claude Desktop")' },
        sessionId: { type: 'string', description: 'Unique session identifier for task deduplication' },
      },
      required: ['todos'],
    },
  },
  {
    name: 'cm_get_tasks',
    description: 'Read the current Kanban board state from cm-dashboard. Returns tasks grouped by column.',
    inputSchema: {
      type: 'object',
      properties: {
        projectName: { type: 'string', description: 'Filter by project name (partial match). Omit for first project.' },
      },
    },
  },
  {
    name: 'cm_update_task',
    description: 'Move a single task to a new status on the cm-dashboard.',
    inputSchema: {
      type: 'object',
      properties: {
        conversationId: { type: 'string', description: 'The conversationId used when the task was created (e.g. "<sessionId>:<todoId>")' },
        title: { type: 'string', description: 'Task title (used if conversationId unknown)' },
        status: { type: 'string', enum: ['pending', 'in_progress', 'completed'], description: 'New status' },
        projectName: { type: 'string' },
      },
      required: ['status'],
    },
  },
];

// ── MCP stdio protocol (JSON-RPC 2.0, Content-Length framing) ─────────────────

function sendMessage(msg) {
  const json = JSON.stringify(msg);
  const header = `Content-Length: ${Buffer.byteLength(json)}\r\n\r\n`;
  process.stdout.write(header + json);
}

function respond(id, result) {
  sendMessage({ jsonrpc: '2.0', id, result });
}

function respondError(id, code, message) {
  sendMessage({ jsonrpc: '2.0', id, error: { code, message } });
}

async function handleRequest(msg) {
  const { id, method, params } = msg;

  if (method === 'initialize') {
    respond(id, {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
    });
    return;
  }

  if (method === 'notifications/initialized') return; // no response needed

  if (method === 'tools/list') {
    respond(id, { tools: TOOLS });
    return;
  }

  if (method === 'tools/call') {
    const { name, arguments: args } = params || {};
    try {
      let result;
      if (name === 'cm_sync_todos') result = await cmSyncTodos(args || {});
      else if (name === 'cm_get_tasks') result = await cmGetTasks(args || {});
      else if (name === 'cm_update_task') result = await cmUpdateTask(args || {});
      else throw new Error(`Unknown tool: ${name}`);

      respond(id, {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      });
    } catch (err) {
      respond(id, {
        content: [{ type: 'text', text: `Error: ${err.message}` }],
        isError: true,
      });
    }
    return;
  }

  if (id !== undefined) {
    respondError(id, -32601, `Method not found: ${method}`);
  }
}

// ── Stdin reader (Content-Length framed) ─────────────────────────────────────

let buffer = Buffer.alloc(0);

process.stdin.on('data', async (chunk) => {
  buffer = Buffer.concat([buffer, chunk]);

  while (true) {
    // Look for header separator
    const sep = buffer.indexOf('\r\n\r\n');
    if (sep === -1) break;

    const header = buffer.slice(0, sep).toString();
    const match = header.match(/Content-Length:\s*(\d+)/i);
    if (!match) { buffer = buffer.slice(sep + 4); break; }

    const contentLength = parseInt(match[1], 10);
    const bodyStart = sep + 4;
    if (buffer.length < bodyStart + contentLength) break; // wait for more data

    const body = buffer.slice(bodyStart, bodyStart + contentLength).toString('utf8');
    buffer = buffer.slice(bodyStart + contentLength);

    try {
      const msg = JSON.parse(body);
      await handleRequest(msg);
    } catch {
      // ignore malformed messages
    }
  }
});

process.stdin.on('end', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));
