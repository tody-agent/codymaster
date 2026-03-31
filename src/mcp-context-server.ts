#!/usr/bin/env node
/**
 * CodyMaster MCP Context Server
 *
 * Exposes 7 tools over JSON-RPC 2.0 / stdio (Content-Length framing):
 *   cm_query         — FTS5 search across learnings + decisions
 *   cm_resolve       — resolve a cm:// URI at L0/L1/L2
 *   cm_bus_read      — read context bus state
 *   cm_bus_write     — publish skill output to context bus
 *   cm_budget_check  — check token budget for a category
 *   cm_memory_decay  — TTL cleanup for learnings
 *   cm_index_refresh — regenerate L0 indexes
 *
 * Usage (stdio MCP):
 *   node dist/mcp-context-server.js --project /path/to/project
 *
 * Claude Desktop config:
 *   {
 *     "mcpServers": {
 *       "cm-context": {
 *         "command": "node",
 *         "args": ["/path/to/dist/mcp-context-server.js", "--project", "/path/to/project"]
 *       }
 *     }
 *   }
 */

import path from 'path';
import { openDb, getDbPath, queryLearnings, queryDecisions, closeDb } from './context-db';
import { resolve as resolveUri } from './uri-resolver';
import { readBus, updateBusStep } from './context-bus';
import { loadBudget, checkBudget, estimateTokens } from './token-budget';
import { refreshAllIndexes } from './l0-indexer';

// ─── Config ──────────────────────────────────────────────────────────────────

const SERVER_NAME = 'cm-context';
const SERVER_VERSION = '1.0.0';

function getProjectPath(): string {
  const args = process.argv.slice(2);
  const idx = args.indexOf('--project');
  if (idx !== -1 && args[idx + 1]) return path.resolve(args[idx + 1]);
  return process.env.CM_PROJECT_PATH ? path.resolve(process.env.CM_PROJECT_PATH) : process.cwd();
}

const PROJECT_PATH = getProjectPath();

// ─── Tool Implementations ─────────────────────────────────────────────────────

interface QueryArgs {
  query: string;
  scope?: 'learnings' | 'decisions' | 'all';
  filter_scope?: string;
  limit?: number;
}

function cmQuery(args: QueryArgs) {
  const { query = '', scope = 'all', filter_scope, limit = 10 } = args;
  const dbPath = getDbPath(PROJECT_PATH);
  openDb(dbPath);

  const results: Record<string, unknown>[] = [];

  if (scope === 'all' || scope === 'learnings') {
    const learnings = queryLearnings(dbPath, query, filter_scope, limit);
    for (const l of learnings) {
      results.push({ type: 'learning', ...l });
    }
  }

  if (scope === 'all' || scope === 'decisions') {
    const decisions = queryDecisions(dbPath, query, limit);
    for (const d of decisions) {
      results.push({ type: 'decision', ...d });
    }
  }

  return {
    query,
    scope,
    count: results.length,
    results,
  };
}

interface ResolveArgs {
  uri: string;
  depth?: 'L0' | 'L1' | 'L2';
}

function cmResolve(args: ResolveArgs) {
  const { uri, depth = 'L1' } = args;
  const resolved = resolveUri(uri, PROJECT_PATH, depth);
  return {
    uri: resolved.uri,
    depth: resolved.depth,
    found: resolved.found,
    tokenEstimate: resolved.tokenEstimate,
    content: resolved.content,
  };
}

function cmBusRead() {
  const bus = readBus(PROJECT_PATH);
  if (!bus) {
    return { active: false, message: 'No active context bus. Start a skill chain first.' };
  }
  return { active: true, bus };
}

interface BusWriteArgs {
  skill: string;
  summary?: string;
  affected_files?: string[];
  output_path?: string;
  metadata?: Record<string, unknown>;
}

function cmBusWrite(args: BusWriteArgs) {
  const { skill, summary, affected_files, output_path, metadata } = args;
  if (!skill) throw new Error('skill is required');

  updateBusStep(PROJECT_PATH, skill, {
    summary: summary ?? '',
    output_path: output_path ?? '',
    affected_files: affected_files ?? [],
    metadata: metadata ?? {},
  });

  const bus = readBus(PROJECT_PATH);
  return {
    ok: true,
    skill,
    current_step: bus?.current_step,
    pipeline: bus?.pipeline,
  };
}

interface BudgetCheckArgs {
  category: string;
  text?: string;
  token_count?: number;
}

function cmBudgetCheck(args: BudgetCheckArgs) {
  const { category, text, token_count } = args;
  if (!category) throw new Error('category is required');

  const budget = loadBudget(PROJECT_PATH);
  const tokens = token_count ?? (text ? estimateTokens(text) : 0);
  const check = checkBudget(budget, category, tokens);

  return {
    category,
    tokens_requested: tokens,
    allowed: check.allowed,
    remaining: check.remaining,
    suggestion: check.suggestion,
  };
}

interface DecayArgs {
  dry_run?: boolean;
}

function cmMemoryDecay(args: DecayArgs) {
  const { dry_run = false } = args;
  const dbPath = getDbPath(PROJECT_PATH);
  const db = openDb(dbPath);

  const now = new Date();

  // Find learnings past TTL
  const candidates = db.prepare(`
    SELECT id, what_failed, created_at, ttl
    FROM learnings
    WHERE status = 'active'
      AND ttl IS NOT NULL
      AND ttl > 0
  `).all() as Array<{ id: string; what_failed: string; created_at: string; ttl: number }>;

  const expired: string[] = [];
  for (const row of candidates) {
    const created = new Date(row.created_at);
    const daysSince = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince >= row.ttl) {
      expired.push(row.id);
    }
  }

  if (!dry_run && expired.length > 0) {
    const placeholders = expired.map(() => '?').join(',');
    db.prepare(`UPDATE learnings SET status = 'archived' WHERE id IN (${placeholders})`).run(...expired);
  }

  return {
    dry_run,
    expired_count: expired.length,
    expired_ids: expired,
    message: dry_run
      ? `${expired.length} learnings would be archived (dry run)`
      : `${expired.length} learnings archived`,
  };
}

interface IndexRefreshArgs {
  target?: 'learnings' | 'skeleton' | 'all';
}

function cmIndexRefresh(args: IndexRefreshArgs) {
  const { target = 'all' } = args;

  if (target === 'all') {
    const result = refreshAllIndexes(PROJECT_PATH);
    return {
      target,
      learnings: { generated: true, tokens: estimateTokens(result.learnings) },
      skeleton: { generated: true, tokens: estimateTokens(result.skeleton) },
    };
  }

  if (target === 'learnings') {
    const { generateLearningsIndex } = require('./l0-indexer');
    const content = generateLearningsIndex(PROJECT_PATH);
    return { target, learnings: { generated: true, tokens: estimateTokens(content) } };
  }

  if (target === 'skeleton') {
    const { generateSkeletonIndex } = require('./l0-indexer');
    const content = generateSkeletonIndex(PROJECT_PATH);
    return { target, skeleton: { generated: true, tokens: estimateTokens(content) } };
  }

  throw new Error(`Unknown target: ${target}. Valid: learnings, skeleton, all`);
}

// ─── Tool Registry ─────────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'cm_query',
    description: 'FTS5 semantic search across CodyMaster learnings and decisions stored in SQLite.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query (FTS5 syntax supported)' },
        scope: {
          type: 'string',
          enum: ['learnings', 'decisions', 'all'],
          description: 'Which collection to search (default: all)',
        },
        filter_scope: {
          type: 'string',
          description: 'Optional scope filter for learnings (e.g. "module", "global")',
        },
        limit: { type: 'number', description: 'Max results per collection (default: 10)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'cm_resolve',
    description: 'Resolve a cm:// URI to content at the specified depth (L0=compact, L1=overview, L2=full).',
    inputSchema: {
      type: 'object',
      properties: {
        uri: {
          type: 'string',
          description: 'cm:// URI (e.g. cm://memory/learnings, cm://skills/cm-tdd, cm://pipeline/current)',
        },
        depth: {
          type: 'string',
          enum: ['L0', 'L1', 'L2'],
          description: 'Loading depth (default: L1)',
        },
      },
      required: ['uri'],
    },
  },
  {
    name: 'cm_bus_read',
    description: 'Read the current context bus state — pipeline name, current step, and shared skill outputs.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'cm_bus_write',
    description: 'Publish a skill completion event to the context bus so subsequent skills can read it.',
    inputSchema: {
      type: 'object',
      properties: {
        skill: { type: 'string', description: 'Skill name (e.g. cm-brainstorm-idea)' },
        summary: { type: 'string', description: 'Human-readable outcome summary' },
        affected_files: {
          type: 'array',
          items: { type: 'string' },
          description: 'Files created/modified by this skill',
        },
        output_path: { type: 'string', description: 'Primary output file path' },
        metadata: { type: 'object', description: 'Arbitrary key-value metadata' },
      },
      required: ['skill'],
    },
  },
  {
    name: 'cm_budget_check',
    description: 'Check whether loading content for a given category is within token budget.',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Budget category (e.g. skill_index_L0, memory_learnings, context_retrieval)',
        },
        text: { type: 'string', description: 'Text to estimate tokens for (optional)' },
        token_count: { type: 'number', description: 'Pre-computed token count (overrides text)' },
      },
      required: ['category'],
    },
  },
  {
    name: 'cm_memory_decay',
    description: 'Archive learnings whose TTL has expired. Run periodically to keep the memory lean.',
    inputSchema: {
      type: 'object',
      properties: {
        dry_run: {
          type: 'boolean',
          description: 'If true, reports what would be archived without changing data (default: false)',
        },
      },
    },
  },
  {
    name: 'cm_index_refresh',
    description: 'Regenerate L0 compact indexes for learnings and/or skeleton to keep context fresh.',
    inputSchema: {
      type: 'object',
      properties: {
        target: {
          type: 'string',
          enum: ['learnings', 'skeleton', 'all'],
          description: 'Which index to refresh (default: all)',
        },
      },
    },
  },
];

// ─── MCP stdio protocol (JSON-RPC 2.0, Content-Length framing) ───────────────

function sendMessage(msg: unknown): void {
  const json = JSON.stringify(msg);
  const header = `Content-Length: ${Buffer.byteLength(json)}\r\n\r\n`;
  process.stdout.write(header + json);
}

function respond(id: unknown, result: unknown): void {
  sendMessage({ jsonrpc: '2.0', id, result });
}

function respondError(id: unknown, code: number, message: string): void {
  sendMessage({ jsonrpc: '2.0', id, error: { code, message } });
}

async function handleRequest(msg: { id?: unknown; method: string; params?: Record<string, unknown> }): Promise<void> {
  const { id, method, params } = msg;

  if (method === 'initialize') {
    respond(id, {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
    });
    return;
  }

  if (method === 'notifications/initialized') return;

  if (method === 'tools/list') {
    respond(id, { tools: TOOLS });
    return;
  }

  if (method === 'tools/call') {
    const { name, arguments: args } = (params || {}) as { name?: string; arguments?: Record<string, unknown> };
    try {
      let result: unknown;
      const a = args || {};

      if (name === 'cm_query')          result = cmQuery(a as unknown as QueryArgs);
      else if (name === 'cm_resolve')   result = cmResolve(a as unknown as ResolveArgs);
      else if (name === 'cm_bus_read')  result = cmBusRead();
      else if (name === 'cm_bus_write') result = cmBusWrite(a as unknown as BusWriteArgs);
      else if (name === 'cm_budget_check') result = cmBudgetCheck(a as unknown as BudgetCheckArgs);
      else if (name === 'cm_memory_decay') result = cmMemoryDecay(a as unknown as DecayArgs);
      else if (name === 'cm_index_refresh') result = cmIndexRefresh(a as unknown as IndexRefreshArgs);
      else throw new Error(`Unknown tool: ${name}`);

      respond(id, {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      });
    } catch (err) {
      respond(id, {
        content: [{ type: 'text', text: `Error: ${(err as Error).message}` }],
        isError: true,
      });
    }
    return;
  }

  if (id !== undefined) {
    respondError(id, -32601, `Method not found: ${method}`);
  }
}

// ─── Stdin reader (Content-Length framed) ────────────────────────────────────

let buffer = Buffer.alloc(0);

process.stdin.on('data', async (chunk: Buffer) => {
  buffer = Buffer.concat([buffer, chunk]);

  while (true) {
    const sep = buffer.indexOf('\r\n\r\n');
    if (sep === -1) break;

    const header = buffer.slice(0, sep).toString();
    const match = header.match(/Content-Length:\s*(\d+)/i);
    if (!match) { buffer = buffer.slice(sep + 4); break; }

    const contentLength = parseInt(match[1], 10);
    const bodyStart = sep + 4;
    if (buffer.length < bodyStart + contentLength) break;

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

process.stdin.on('end', () => {
  closeDb(getDbPath(PROJECT_PATH));
  process.exit(0);
});
process.on('SIGTERM', () => { closeDb(getDbPath(PROJECT_PATH)); process.exit(0); });
process.on('SIGINT',  () => { closeDb(getDbPath(PROJECT_PATH)); process.exit(0); });
