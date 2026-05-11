#!/usr/bin/env node
/**
 * CodyMaster MCP Context Server
 *
 * Exposes 18 tools over JSON-RPC 2.0 / stdio (Content-Length framing):
 *   cm_query         — FTS5 search across learnings + decisions
 *   cm_resolve       — resolve a cm:// URI at L0/L1/L2
 *   cm_bus_read      — read context bus state
 *   cm_bus_write     — publish skill output to context bus
 *   cm_budget_check  — check token budget for a category
 *   cm_memory_decay  — TTL cleanup for learnings
 *   cm_index_refresh — regenerate L0 indexes
 *   cm_advisory_report / cm_advisory_metrics / cm_advisory_handoff — advisory loop JSON surfaces
 *   cm_plan / cm_review / cm_qa / cm_deploy / cm_search / cm_memory_query — engineering kit bridge
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
import { openDb, getDbPath, queryLearnings, queryDecisions, closeDb, insertLearning } from './context-db';
import { resolve as resolveUri } from './uri-resolver';
import { readBus, updateBusStep } from './context-bus';
import { loadBudget, checkBudget, estimateTokens } from './token-budget';
import { refreshAllIndexes } from './l0-indexer';
import {
  cmPlanTool,
  cmReviewTool,
  cmQaTool,
  cmDeployTool,
  cmSearchTool,
  cmMemoryQueryTool,
} from './mcp-skills-tools';
import { getBackend } from './storage-backend';
import { buildAdvisoryMetricsData, buildAdvisoryReportData } from './advisory-report';
import { buildAdvisoryHandoff, type AdvisoryConsumer } from './advisory-handoff';

// ─── Config ──────────────────────────────────────────────────────────────────

const SERVER_NAME = 'cm-context';
const SERVER_VERSION = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, '..', 'package.json'), 'utf-8')).version;

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

// ─── NLI Memory Tools ────────────────────────────────────────────────────────

interface MemoryWriteArgs {
  content: string;
  scope?: string;
  category?: string;
  ttl_days?: number;
  importance?: 'low' | 'medium' | 'high';
}

function autoDetectCategory(content: string): string {
  const c = content.toLowerCase();
  if (/\b(decided|architecture|we chose|design decision|chose to)\b/.test(c)) return 'arch_decision';
  if (/\b(bug|fixed|caused by|root cause|crash)\b/.test(c)) return 'bug_fix';
  if (/\b(prefer|always use|never use|avoid|convention|standard)\b/.test(c)) return 'user_pref';
  if (/\b(function|pattern|approach|method|implementation)\b/.test(c)) return 'code_pattern';
  return 'context';
}

function cmMemoryWrite(args: MemoryWriteArgs) {
  const { content, scope = 'project', category, ttl_days, importance = 'medium' } = args;
  if (!content?.trim()) throw new Error('content is required');

  const detectedCategory = category || autoDetectCategory(content);
  const defaultTtl: Record<string, number> = { session: 30, project: 90, global: 365 };
  const ttl = ttl_days ?? defaultTtl[scope] ?? 90;

  const now = new Date().toISOString();
  const id = `nli-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const dbPath = getDbPath(PROJECT_PATH);
  insertLearning(dbPath, {
    id,
    what_failed: content,
    why_failed: detectedCategory,
    how_to_prevent: `importance:${importance}`,
    scope,
    ttl,
    reinforce_count: 0,
    status: 'active',
    created_at: now,
    updated_at: now,
    agent: 'cm_natural',
  });

  return { ok: true, id, content, category: detectedCategory, scope, ttl_days: ttl, importance };
}

const NLI_PATTERNS: Array<{
  pattern: RegExp;
  action: 'write' | 'decay' | 'query';
  scope?: string;
  importance?: 'low' | 'medium' | 'high';
}> = [
  { pattern: /\b(remember|save|note)\s+that\s+/i,       action: 'write', scope: 'project' },
  { pattern: /\b(remember|save)\s+this[:\s]/i,           action: 'write', scope: 'project' },
  { pattern: /\bimportant[:\s]+/i,                       action: 'write', scope: 'project', importance: 'high' },
  { pattern: /\b(forget|remove|ignore)\s+(about\s+)?/i,  action: 'decay' },
  { pattern: /\bwhat\s+did\s+we\s+(learn|know)\b/i,      action: 'query' },
  { pattern: /\bwhat\s+do\s+we\s+know\b/i,               action: 'query' },
  { pattern: /\blessons?\s+learned\b/i,                  action: 'query' },
  { pattern: /\b(search|find|look\s+up)\b/i,             action: 'query' },
];

function cmNatural(args: { text: string }) {
  const { text } = args;
  if (!text?.trim()) throw new Error('text is required');

  for (const rule of NLI_PATTERNS) {
    const match = text.match(rule.pattern);
    if (!match) continue;
    const extracted = text.slice((match.index ?? 0) + match[0].length).trim();

    if (rule.action === 'write') {
      const result = cmMemoryWrite({
        content: extracted || text,
        scope: rule.scope ?? 'project',
        importance: rule.importance ?? 'medium',
      });
      return { ...result, matched_pattern: rule.pattern.source, routed_to: 'cm_memory_write' };
    }
    if (rule.action === 'decay') {
      const result = cmMemoryDecay({ dry_run: false });
      return { ...result, matched_pattern: rule.pattern.source, routed_to: 'cm_memory_decay' };
    }
    // query / search
    const result = cmQuery({ query: extracted || text, scope: 'all', limit: 10 });
    return { ...result, matched_pattern: rule.pattern.source, routed_to: 'cm_query' };
  }

  // No pattern matched — default to search
  const result = cmQuery({ query: text, scope: 'all', limit: 10 });
  return { ...result, matched_pattern: null, routed_to: 'cm_query (default)' };
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

interface AdvisoryArgs {
  limit?: number;
}

export function cmAdvisoryReport(args: AdvisoryArgs) {
  const backend = getBackend(PROJECT_PATH);
  backend.initialize();
  try {
    const limit = Math.max(1, args.limit ?? 10);
    const analyses = buildAdvisoryReportData(backend, { limit });
    return {
      count: analyses.length,
      analyses,
      generated_at: new Date().toISOString(),
    };
  } finally {
    backend.close();
  }
}

export function cmAdvisoryMetrics(args: AdvisoryArgs) {
  const backend = getBackend(PROJECT_PATH);
  backend.initialize();
  try {
    const limit = Math.max(1, args.limit ?? 10);
    const metrics = buildAdvisoryMetricsData(backend, { limit });
    return {
      count: metrics.length,
      metrics,
      generated_at: new Date().toISOString(),
    };
  } finally {
    backend.close();
  }
}

interface AdvisoryHandoffArgs {
  consumer: AdvisoryConsumer;
  analysis_id?: string;
  skill?: string;
  limit?: number;
}

export function cmAdvisoryHandoff(args: AdvisoryHandoffArgs) {
  const backend = getBackend(PROJECT_PATH);
  backend.initialize();
  try {
    return buildAdvisoryHandoff(backend, {
      consumer: args.consumer,
      analysisId: args.analysis_id,
      skill: args.skill,
      searchLimit: args.limit,
    });
  } finally {
    backend.close();
  }
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
  {
    name: 'cm_advisory_report',
    description: 'Return recent advisory analyses as structured JSON for agent consumption.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Max analyses to return (default: 10)' },
      },
    },
  },
  {
    name: 'cm_advisory_metrics',
    description: 'Return aggregated skill metrics and quality weights as structured JSON.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Max skills to return (default: 10)' },
      },
    },
  },
  {
    name: 'cm_advisory_handoff',
    description: 'Build a structured advisory handoff for cm-skill-health or cm-skill-evolution.',
    inputSchema: {
      type: 'object',
      properties: {
        consumer: {
          type: 'string',
          enum: ['cm-skill-health', 'cm-skill-evolution'],
          description: 'Which self-healing skill should consume the handoff',
        },
        analysis_id: {
          type: 'string',
          description: 'Optional analysis id prefix (defaults to latest advisory analysis)',
        },
        skill: {
          type: 'string',
          description: 'Optional skill override when the target skill should be forced',
        },
        limit: {
          type: 'number',
          description: 'How many recent analyses to search while resolving analysis_id (default: 50)',
        },
      },
      required: ['consumer'],
    },
  },
  {
    name: 'cm_plan',
    description: 'Sprint + context bus snapshot: pipeline state, next skill hint, artifact paths.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'cm_review',
    description: 'Read sprint review artifact preview if present; points to cm-code-review workflow.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'cm_qa',
    description: 'QA hints: browse daemon, visual QA CLI, quality gates.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'cm_deploy',
    description: 'Deploy workflow hints (cm-safe-deploy, canary).',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'cm_search',
    description: 'Search learnings + decisions (same backing store as cm_query).',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        scope: { type: 'string', enum: ['learnings', 'decisions', 'all'] },
        limit: { type: 'number' },
      },
      required: ['query'],
    },
  },
  {
    name: 'cm_memory_query',
    description: 'Alias-style memory search across learnings and decisions.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        limit: { type: 'number' },
      },
      required: ['query'],
    },
  },
  {
    name: 'cm_memory_write',
    description: 'Write a new memory/learning to persistent storage. Use to save knowledge, decisions, preferences, or patterns for future sessions.',
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'What to remember (the memory content)' },
        scope: {
          type: 'string',
          enum: ['session', 'project', 'global'],
          description: 'Memory scope: session=30d, project=90d, global=365d (default: project)',
        },
        category: {
          type: 'string',
          enum: ['code_pattern', 'arch_decision', 'bug_fix', 'user_pref', 'context'],
          description: 'Category (auto-detected from content if omitted)',
        },
        ttl_days: { type: 'number', description: 'Override TTL in days' },
        importance: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'Importance level (default: medium)',
        },
      },
      required: ['content'],
    },
  },
  {
    name: 'cm_natural',
    description: 'Natural language memory interface. Understands "remember that...", "forget about...", "what did we learn about...", "find...". Routes to appropriate memory operation automatically.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Freeform natural language instruction or question' },
      },
      required: ['text'],
    },
  },
];

// ─── MCP stdio protocol (JSON-RPC 2.0, auto-detect framing) ─────────────────
// Supports both NDJSON (MCP spec) and Content-Length framing (LSP-style).
// Auto-detects based on the first message received from the client.

let useContentLengthFraming = false;

function sendMessage(msg: unknown): void {
  const json = JSON.stringify(msg);
  if (useContentLengthFraming) {
    const header = `Content-Length: ${Buffer.byteLength(json)}\r\n\r\n`;
    process.stdout.write(header + json);
  } else {
    process.stdout.write(json + '\n');
  }
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
      protocolVersion: (params as Record<string, unknown>)?.protocolVersion ?? '2024-11-05',
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
      else if (name === 'cm_advisory_report') result = cmAdvisoryReport(a as AdvisoryArgs);
      else if (name === 'cm_advisory_metrics') result = cmAdvisoryMetrics(a as AdvisoryArgs);
      else if (name === 'cm_advisory_handoff') result = cmAdvisoryHandoff(a as unknown as AdvisoryHandoffArgs);
      else if (name === 'cm_plan') result = cmPlanTool(PROJECT_PATH);
      else if (name === 'cm_review') result = cmReviewTool(PROJECT_PATH);
      else if (name === 'cm_qa') result = cmQaTool(PROJECT_PATH);
      else if (name === 'cm_deploy') result = cmDeployTool(PROJECT_PATH);
      else if (name === 'cm_search')
        result = cmSearchTool(PROJECT_PATH, a as { query: string; scope?: 'learnings' | 'decisions' | 'all'; limit?: number });
      else if (name === 'cm_memory_query')
        result = cmMemoryQueryTool(PROJECT_PATH, a as { query: string; limit?: number });
      else if (name === 'cm_memory_write') result = cmMemoryWrite(a as unknown as MemoryWriteArgs);
      else if (name === 'cm_natural')       result = cmNatural(a as { text: string });
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

// ─── Stdin reader (supports both NDJSON and Content-Length framing) ─────────

let stdinBuffer = '';

process.stdin.setEncoding('utf8');
process.stdin.on('data', async (chunk: string) => {
  stdinBuffer += chunk;

  while (stdinBuffer.length > 0) {
    // Check for Content-Length framing (LSP-style)
    const clMatch = stdinBuffer.match(/^Content-Length:\s*(\d+)\r\n\r\n/i);
    if (clMatch) {
      useContentLengthFraming = true;
      const contentLength = parseInt(clMatch[1], 10);
      const headerEnd = clMatch[0].length;
      if (stdinBuffer.length < headerEnd + contentLength) break; // wait for more data
      const body = stdinBuffer.slice(headerEnd, headerEnd + contentLength);
      stdinBuffer = stdinBuffer.slice(headerEnd + contentLength);
      try {
        const msg = JSON.parse(body);
        await handleRequest(msg);
      } catch {
        // ignore malformed messages
      }
      continue;
    }

    // NDJSON: newline-delimited JSON
    const nl = stdinBuffer.indexOf('\n');
    if (nl === -1) break;
    const line = stdinBuffer.slice(0, nl).trim();
    stdinBuffer = stdinBuffer.slice(nl + 1);
    if (!line) continue;
    try {
      const msg = JSON.parse(line);
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
