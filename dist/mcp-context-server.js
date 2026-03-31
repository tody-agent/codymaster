#!/usr/bin/env node
"use strict";
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const context_db_1 = require("./context-db");
const uri_resolver_1 = require("./uri-resolver");
const context_bus_1 = require("./context-bus");
const token_budget_1 = require("./token-budget");
const l0_indexer_1 = require("./l0-indexer");
// ─── Config ──────────────────────────────────────────────────────────────────
const SERVER_NAME = 'cm-context';
const SERVER_VERSION = '1.0.0';
function getProjectPath() {
    const args = process.argv.slice(2);
    const idx = args.indexOf('--project');
    if (idx !== -1 && args[idx + 1])
        return path_1.default.resolve(args[idx + 1]);
    return process.env.CM_PROJECT_PATH ? path_1.default.resolve(process.env.CM_PROJECT_PATH) : process.cwd();
}
const PROJECT_PATH = getProjectPath();
function cmQuery(args) {
    const { query = '', scope = 'all', filter_scope, limit = 10 } = args;
    const dbPath = (0, context_db_1.getDbPath)(PROJECT_PATH);
    (0, context_db_1.openDb)(dbPath);
    const results = [];
    if (scope === 'all' || scope === 'learnings') {
        const learnings = (0, context_db_1.queryLearnings)(dbPath, query, filter_scope, limit);
        for (const l of learnings) {
            results.push(Object.assign({ type: 'learning' }, l));
        }
    }
    if (scope === 'all' || scope === 'decisions') {
        const decisions = (0, context_db_1.queryDecisions)(dbPath, query, limit);
        for (const d of decisions) {
            results.push(Object.assign({ type: 'decision' }, d));
        }
    }
    return {
        query,
        scope,
        count: results.length,
        results,
    };
}
function cmResolve(args) {
    const { uri, depth = 'L1' } = args;
    const resolved = (0, uri_resolver_1.resolve)(uri, PROJECT_PATH, depth);
    return {
        uri: resolved.uri,
        depth: resolved.depth,
        found: resolved.found,
        tokenEstimate: resolved.tokenEstimate,
        content: resolved.content,
    };
}
function cmBusRead() {
    const bus = (0, context_bus_1.readBus)(PROJECT_PATH);
    if (!bus) {
        return { active: false, message: 'No active context bus. Start a skill chain first.' };
    }
    return { active: true, bus };
}
function cmBusWrite(args) {
    const { skill, summary, affected_files, output_path, metadata } = args;
    if (!skill)
        throw new Error('skill is required');
    (0, context_bus_1.updateBusStep)(PROJECT_PATH, skill, {
        summary: summary !== null && summary !== void 0 ? summary : '',
        output_path: output_path !== null && output_path !== void 0 ? output_path : '',
        affected_files: affected_files !== null && affected_files !== void 0 ? affected_files : [],
        metadata: metadata !== null && metadata !== void 0 ? metadata : {},
    });
    const bus = (0, context_bus_1.readBus)(PROJECT_PATH);
    return {
        ok: true,
        skill,
        current_step: bus === null || bus === void 0 ? void 0 : bus.current_step,
        pipeline: bus === null || bus === void 0 ? void 0 : bus.pipeline,
    };
}
function cmBudgetCheck(args) {
    const { category, text, token_count } = args;
    if (!category)
        throw new Error('category is required');
    const budget = (0, token_budget_1.loadBudget)(PROJECT_PATH);
    const tokens = token_count !== null && token_count !== void 0 ? token_count : (text ? (0, token_budget_1.estimateTokens)(text) : 0);
    const check = (0, token_budget_1.checkBudget)(budget, category, tokens);
    return {
        category,
        tokens_requested: tokens,
        allowed: check.allowed,
        remaining: check.remaining,
        suggestion: check.suggestion,
    };
}
function cmMemoryDecay(args) {
    const { dry_run = false } = args;
    const dbPath = (0, context_db_1.getDbPath)(PROJECT_PATH);
    const db = (0, context_db_1.openDb)(dbPath);
    const now = new Date();
    // Find learnings past TTL
    const candidates = db.prepare(`
    SELECT id, what_failed, created_at, ttl
    FROM learnings
    WHERE status = 'active'
      AND ttl IS NOT NULL
      AND ttl > 0
  `).all();
    const expired = [];
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
function cmIndexRefresh(args) {
    const { target = 'all' } = args;
    if (target === 'all') {
        const result = (0, l0_indexer_1.refreshAllIndexes)(PROJECT_PATH);
        return {
            target,
            learnings: { generated: true, tokens: (0, token_budget_1.estimateTokens)(result.learnings) },
            skeleton: { generated: true, tokens: (0, token_budget_1.estimateTokens)(result.skeleton) },
        };
    }
    if (target === 'learnings') {
        const { generateLearningsIndex } = require('./l0-indexer');
        const content = generateLearningsIndex(PROJECT_PATH);
        return { target, learnings: { generated: true, tokens: (0, token_budget_1.estimateTokens)(content) } };
    }
    if (target === 'skeleton') {
        const { generateSkeletonIndex } = require('./l0-indexer');
        const content = generateSkeletonIndex(PROJECT_PATH);
        return { target, skeleton: { generated: true, tokens: (0, token_budget_1.estimateTokens)(content) } };
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
function handleRequest(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id, method, params } = msg;
        if (method === 'initialize') {
            respond(id, {
                protocolVersion: '2024-11-05',
                capabilities: { tools: {} },
                serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
            });
            return;
        }
        if (method === 'notifications/initialized')
            return;
        if (method === 'tools/list') {
            respond(id, { tools: TOOLS });
            return;
        }
        if (method === 'tools/call') {
            const { name, arguments: args } = (params || {});
            try {
                let result;
                const a = args || {};
                if (name === 'cm_query')
                    result = cmQuery(a);
                else if (name === 'cm_resolve')
                    result = cmResolve(a);
                else if (name === 'cm_bus_read')
                    result = cmBusRead();
                else if (name === 'cm_bus_write')
                    result = cmBusWrite(a);
                else if (name === 'cm_budget_check')
                    result = cmBudgetCheck(a);
                else if (name === 'cm_memory_decay')
                    result = cmMemoryDecay(a);
                else if (name === 'cm_index_refresh')
                    result = cmIndexRefresh(a);
                else
                    throw new Error(`Unknown tool: ${name}`);
                respond(id, {
                    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                });
            }
            catch (err) {
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
    });
}
// ─── Stdin reader (Content-Length framed) ────────────────────────────────────
let buffer = Buffer.alloc(0);
process.stdin.on('data', (chunk) => __awaiter(void 0, void 0, void 0, function* () {
    buffer = Buffer.concat([buffer, chunk]);
    while (true) {
        const sep = buffer.indexOf('\r\n\r\n');
        if (sep === -1)
            break;
        const header = buffer.slice(0, sep).toString();
        const match = header.match(/Content-Length:\s*(\d+)/i);
        if (!match) {
            buffer = buffer.slice(sep + 4);
            break;
        }
        const contentLength = parseInt(match[1], 10);
        const bodyStart = sep + 4;
        if (buffer.length < bodyStart + contentLength)
            break;
        const body = buffer.slice(bodyStart, bodyStart + contentLength).toString('utf8');
        buffer = buffer.slice(bodyStart + contentLength);
        try {
            const msg = JSON.parse(body);
            yield handleRequest(msg);
        }
        catch (_a) {
            // ignore malformed messages
        }
    }
}));
process.stdin.on('end', () => {
    (0, context_db_1.closeDb)((0, context_db_1.getDbPath)(PROJECT_PATH));
    process.exit(0);
});
process.on('SIGTERM', () => { (0, context_db_1.closeDb)((0, context_db_1.getDbPath)(PROJECT_PATH)); process.exit(0); });
process.on('SIGINT', () => { (0, context_db_1.closeDb)((0, context_db_1.getDbPath)(PROJECT_PATH)); process.exit(0); });
