#!/usr/bin/env node
"use strict";
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
exports.cmAdvisoryReport = cmAdvisoryReport;
exports.cmAdvisoryMetrics = cmAdvisoryMetrics;
exports.cmAdvisoryHandoff = cmAdvisoryHandoff;
const path_1 = __importDefault(require("path"));
const context_db_1 = require("./context-db");
const uri_resolver_1 = require("./uri-resolver");
const context_bus_1 = require("./context-bus");
const token_budget_1 = require("./token-budget");
const l0_indexer_1 = require("./l0-indexer");
const mcp_skills_tools_1 = require("./mcp-skills-tools");
const storage_backend_1 = require("./storage-backend");
const advisory_report_1 = require("./advisory-report");
const advisory_handoff_1 = require("./advisory-handoff");
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
function autoDetectCategory(content) {
    const c = content.toLowerCase();
    if (/\b(decided|architecture|we chose|design decision|chose to)\b/.test(c))
        return 'arch_decision';
    if (/\b(bug|fixed|caused by|root cause|crash)\b/.test(c))
        return 'bug_fix';
    if (/\b(prefer|always use|never use|avoid|convention|standard)\b/.test(c))
        return 'user_pref';
    if (/\b(function|pattern|approach|method|implementation)\b/.test(c))
        return 'code_pattern';
    return 'context';
}
function cmMemoryWrite(args) {
    var _a;
    const { content, scope = 'project', category, ttl_days, importance = 'medium' } = args;
    if (!(content === null || content === void 0 ? void 0 : content.trim()))
        throw new Error('content is required');
    const detectedCategory = category || autoDetectCategory(content);
    const defaultTtl = { session: 30, project: 90, global: 365 };
    const ttl = (_a = ttl_days !== null && ttl_days !== void 0 ? ttl_days : defaultTtl[scope]) !== null && _a !== void 0 ? _a : 90;
    const now = new Date().toISOString();
    const id = `nli-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const dbPath = (0, context_db_1.getDbPath)(PROJECT_PATH);
    (0, context_db_1.insertLearning)(dbPath, {
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
const NLI_PATTERNS = [
    { pattern: /\b(remember|save|note)\s+that\s+/i, action: 'write', scope: 'project' },
    { pattern: /\b(remember|save)\s+this[:\s]/i, action: 'write', scope: 'project' },
    { pattern: /\bimportant[:\s]+/i, action: 'write', scope: 'project', importance: 'high' },
    { pattern: /\b(forget|remove|ignore)\s+(about\s+)?/i, action: 'decay' },
    { pattern: /\bwhat\s+did\s+we\s+(learn|know)\b/i, action: 'query' },
    { pattern: /\bwhat\s+do\s+we\s+know\b/i, action: 'query' },
    { pattern: /\blessons?\s+learned\b/i, action: 'query' },
    { pattern: /\b(search|find|look\s+up)\b/i, action: 'query' },
];
function cmNatural(args) {
    var _a, _b, _c;
    const { text } = args;
    if (!(text === null || text === void 0 ? void 0 : text.trim()))
        throw new Error('text is required');
    for (const rule of NLI_PATTERNS) {
        const match = text.match(rule.pattern);
        if (!match)
            continue;
        const extracted = text.slice(((_a = match.index) !== null && _a !== void 0 ? _a : 0) + match[0].length).trim();
        if (rule.action === 'write') {
            const result = cmMemoryWrite({
                content: extracted || text,
                scope: (_b = rule.scope) !== null && _b !== void 0 ? _b : 'project',
                importance: (_c = rule.importance) !== null && _c !== void 0 ? _c : 'medium',
            });
            return Object.assign(Object.assign({}, result), { matched_pattern: rule.pattern.source, routed_to: 'cm_memory_write' });
        }
        if (rule.action === 'decay') {
            const result = cmMemoryDecay({ dry_run: false });
            return Object.assign(Object.assign({}, result), { matched_pattern: rule.pattern.source, routed_to: 'cm_memory_decay' });
        }
        // query / search
        const result = cmQuery({ query: extracted || text, scope: 'all', limit: 10 });
        return Object.assign(Object.assign({}, result), { matched_pattern: rule.pattern.source, routed_to: 'cm_query' });
    }
    // No pattern matched — default to search
    const result = cmQuery({ query: text, scope: 'all', limit: 10 });
    return Object.assign(Object.assign({}, result), { matched_pattern: null, routed_to: 'cm_query (default)' });
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
function cmAdvisoryReport(args) {
    var _a;
    const backend = (0, storage_backend_1.getBackend)(PROJECT_PATH);
    backend.initialize();
    try {
        const limit = Math.max(1, (_a = args.limit) !== null && _a !== void 0 ? _a : 10);
        const analyses = (0, advisory_report_1.buildAdvisoryReportData)(backend, { limit });
        return {
            count: analyses.length,
            analyses,
            generated_at: new Date().toISOString(),
        };
    }
    finally {
        backend.close();
    }
}
function cmAdvisoryMetrics(args) {
    var _a;
    const backend = (0, storage_backend_1.getBackend)(PROJECT_PATH);
    backend.initialize();
    try {
        const limit = Math.max(1, (_a = args.limit) !== null && _a !== void 0 ? _a : 10);
        const metrics = (0, advisory_report_1.buildAdvisoryMetricsData)(backend, { limit });
        return {
            count: metrics.length,
            metrics,
            generated_at: new Date().toISOString(),
        };
    }
    finally {
        backend.close();
    }
}
function cmAdvisoryHandoff(args) {
    const backend = (0, storage_backend_1.getBackend)(PROJECT_PATH);
    backend.initialize();
    try {
        return (0, advisory_handoff_1.buildAdvisoryHandoff)(backend, {
            consumer: args.consumer,
            analysisId: args.analysis_id,
            skill: args.skill,
            searchLimit: args.limit,
        });
    }
    finally {
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
                else if (name === 'cm_advisory_report')
                    result = cmAdvisoryReport(a);
                else if (name === 'cm_advisory_metrics')
                    result = cmAdvisoryMetrics(a);
                else if (name === 'cm_advisory_handoff')
                    result = cmAdvisoryHandoff(a);
                else if (name === 'cm_plan')
                    result = (0, mcp_skills_tools_1.cmPlanTool)(PROJECT_PATH);
                else if (name === 'cm_review')
                    result = (0, mcp_skills_tools_1.cmReviewTool)(PROJECT_PATH);
                else if (name === 'cm_qa')
                    result = (0, mcp_skills_tools_1.cmQaTool)(PROJECT_PATH);
                else if (name === 'cm_deploy')
                    result = (0, mcp_skills_tools_1.cmDeployTool)(PROJECT_PATH);
                else if (name === 'cm_search')
                    result = (0, mcp_skills_tools_1.cmSearchTool)(PROJECT_PATH, a);
                else if (name === 'cm_memory_query')
                    result = (0, mcp_skills_tools_1.cmMemoryQueryTool)(PROJECT_PATH, a);
                else if (name === 'cm_memory_write')
                    result = cmMemoryWrite(a);
                else if (name === 'cm_natural')
                    result = cmNatural(a);
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
