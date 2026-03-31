"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolve = resolve;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const context_db_1 = require("./context-db");
const context_bus_1 = require("./context-bus");
// ─── Main Resolver ───────────────────────────────────────────────────────────
/**
 * Resolve a cm:// URI to content at the requested depth.
 *
 * URI patterns:
 *   cm://memory/working             → CONTINUITY.md abstract (L0) or full (L2)
 *   cm://memory/learnings           → learnings index (L0) or all learnings (L2)
 *   cm://memory/learnings/{id}      → specific learning by ID
 *   cm://memory/decisions           → decisions index (L0) or all (L2)
 *   cm://skills/{name}              → SKILL.md at depth
 *   cm://skills/{name}/L0           → index entry only
 *   cm://resources/skeleton         → skeleton-index.md (L0) or full (L2)
 *   cm://resources/architecture     → architecture.mmd
 *   cm://pipeline/current           → context bus state
 */
function resolve(uri, projectPath, depth = 'L1') {
    if (!uri.startsWith('cm://')) {
        return notFound(uri, depth, `URI must start with cm://`);
    }
    const rest = uri.slice('cm://'.length); // e.g. "memory/learnings/L005"
    const parts = rest.split('/').filter(Boolean);
    if (parts.length === 0) {
        return notFound(uri, depth, 'Empty URI path');
    }
    const [ns, ...tail] = parts;
    switch (ns) {
        case 'memory': return resolveMemory(uri, tail, projectPath, depth);
        case 'skills': return resolveSkill(uri, tail, projectPath, depth);
        case 'resources': return resolveResource(uri, tail, projectPath, depth);
        case 'pipeline': return resolvePipeline(uri, tail, projectPath, depth);
        default:
            return notFound(uri, depth, `Unknown namespace "${ns}". Valid: memory, skills, resources, pipeline`);
    }
}
// ─── memory/* ────────────────────────────────────────────────────────────────
function resolveMemory(uri, tail, projectPath, depth) {
    const [resource, id] = tail;
    switch (resource) {
        case 'working': {
            const contPath = path_1.default.join(projectPath, '.cm', 'CONTINUITY.md');
            if (!fs_1.default.existsSync(contPath))
                return notFound(uri, depth, 'CONTINUITY.md not found');
            const full = fs_1.default.readFileSync(contPath, 'utf-8');
            if (depth === 'L0' || depth === 'L1') {
                // Return first 10 non-empty lines as abstract
                const abstract = full.split('\n').filter(l => l.trim()).slice(0, 10).join('\n');
                return found(uri, depth, abstract);
            }
            return found(uri, depth, full);
        }
        case 'learnings': {
            if (id) {
                // cm://memory/learnings/L005 — specific entry
                const dbPath = (0, context_db_1.getDbPath)(projectPath);
                const learning = (0, context_db_1.getLearningById)(dbPath, id);
                if (!learning)
                    return notFound(uri, depth, `Learning "${id}" not found`);
                return found(uri, depth, formatLearning(learning));
            }
            if (depth === 'L0') {
                // Return cached L0 index
                const indexPath = path_1.default.join(projectPath, '.cm', 'learnings-index.md');
                if (fs_1.default.existsSync(indexPath)) {
                    return found(uri, depth, fs_1.default.readFileSync(indexPath, 'utf-8'));
                }
            }
            // L1/L2: query all from SQLite
            const dbPath = (0, context_db_1.getDbPath)(projectPath);
            const learnings = (0, context_db_1.queryLearnings)(dbPath, '', undefined, 50);
            if (learnings.length === 0) {
                // Fallback to JSON file
                const jsonPath = path_1.default.join(projectPath, '.cm', 'memory', 'learnings.json');
                if (fs_1.default.existsSync(jsonPath)) {
                    return found(uri, depth, fs_1.default.readFileSync(jsonPath, 'utf-8'));
                }
                return found(uri, depth, '[]');
            }
            return found(uri, depth, JSON.stringify(learnings, null, 2));
        }
        case 'decisions': {
            if (depth === 'L0') {
                // Short list of decision IDs + 1-line summary
                const dbPath = (0, context_db_1.getDbPath)(projectPath);
                const decisions = (0, context_db_1.queryDecisions)(dbPath, '', 20);
                const lines = ['# Decisions Index', ''];
                for (const d of decisions) {
                    lines.push(`- ${d.id}: ${d.decision.slice(0, 80)}`);
                }
                return found(uri, depth, lines.join('\n'));
            }
            const dbPath = (0, context_db_1.getDbPath)(projectPath);
            const decisions = (0, context_db_1.queryDecisions)(dbPath, '', 50);
            if (decisions.length === 0) {
                const jsonPath = path_1.default.join(projectPath, '.cm', 'memory', 'decisions.json');
                if (fs_1.default.existsSync(jsonPath)) {
                    return found(uri, depth, fs_1.default.readFileSync(jsonPath, 'utf-8'));
                }
                return found(uri, depth, '[]');
            }
            return found(uri, depth, JSON.stringify(decisions, null, 2));
        }
        default:
            return notFound(uri, depth, `Unknown memory resource "${resource}". Valid: working, learnings, decisions`);
    }
}
// ─── skills/* ────────────────────────────────────────────────────────────────
function resolveSkill(uri, tail, projectPath, depth) {
    const [skillName, depthOverride] = tail;
    if (!skillName)
        return notFound(uri, depth, 'Skill name required: cm://skills/{name}');
    const effectiveDepth = depthOverride || depth;
    // Look in project skills/ dir, then global ~/.claude/skills/
    const candidates = [
        path_1.default.join(projectPath, 'skills', skillName, 'SKILL.md'),
        path_1.default.join(projectPath, '.claude', 'skills', skillName, 'SKILL.md'),
        path_1.default.join(process.env.HOME || '', '.claude', 'skills', skillName, 'SKILL.md'),
    ];
    const skillPath = candidates.find(p => fs_1.default.existsSync(p));
    if (!skillPath)
        return notFound(uri, depth, `Skill "${skillName}" not found`);
    const full = fs_1.default.readFileSync(skillPath, 'utf-8');
    if (effectiveDepth === 'L0') {
        // Front matter + description only (~50 tokens)
        const lines = full.split('\n');
        const summary = lines.slice(0, 10).join('\n');
        return found(uri, effectiveDepth, summary);
    }
    if (effectiveDepth === 'L1') {
        // First 40 lines (~600 tokens)
        return found(uri, effectiveDepth, full.split('\n').slice(0, 40).join('\n'));
    }
    return found(uri, effectiveDepth, full);
}
// ─── resources/* ─────────────────────────────────────────────────────────────
function resolveResource(uri, tail, projectPath, depth) {
    const [resource] = tail;
    switch (resource) {
        case 'skeleton': {
            if (depth === 'L0' || depth === 'L1') {
                const indexPath = path_1.default.join(projectPath, '.cm', 'skeleton-index.md');
                if (fs_1.default.existsSync(indexPath)) {
                    return found(uri, depth, fs_1.default.readFileSync(indexPath, 'utf-8'));
                }
            }
            const fullPath = path_1.default.join(projectPath, '.cm', 'skeleton.md');
            if (!fs_1.default.existsSync(fullPath))
                return notFound(uri, depth, 'skeleton.md not found — run: cm continuity index');
            return found(uri, depth, fs_1.default.readFileSync(fullPath, 'utf-8'));
        }
        case 'architecture': {
            const mmdPath = path_1.default.join(projectPath, '.cm', 'architecture.mmd');
            if (!fs_1.default.existsSync(mmdPath))
                return notFound(uri, depth, 'architecture.mmd not found');
            return found(uri, depth, fs_1.default.readFileSync(mmdPath, 'utf-8'));
        }
        default:
            return notFound(uri, depth, `Unknown resource "${resource}". Valid: skeleton, architecture`);
    }
}
// ─── pipeline/* ──────────────────────────────────────────────────────────────
function resolvePipeline(uri, tail, projectPath, depth) {
    const [sub] = tail;
    if (!sub || sub === 'current') {
        const bus = (0, context_bus_1.readBus)(projectPath);
        if (!bus)
            return notFound(uri, depth, 'No active context bus. Start a chain first.');
        if (depth === 'L0') {
            const summary = `Pipeline: ${bus.pipeline} | Step: ${bus.current_step} | Steps done: ${Object.keys(bus.shared_context).length}`;
            return found(uri, depth, summary);
        }
        return found(uri, depth, JSON.stringify(bus, null, 2));
    }
    return notFound(uri, depth, `Unknown pipeline resource "${sub}"`);
}
// ─── Helpers ──────────────────────────────────────────────────────────────────
function found(uri, depth, content) {
    return { uri, depth, content, tokenEstimate: Math.ceil(content.length / 4), found: true };
}
function notFound(uri, depth, reason) {
    const content = `# Not Found\n\nURI: ${uri}\nReason: ${reason}`;
    return { uri, depth, content, tokenEstimate: Math.ceil(content.length / 4), found: false };
}
function formatLearning(l) {
    var _a, _b;
    if (!l)
        return '';
    return [
        `### ${l.id}: ${l.what_failed}`,
        `- **Why:** ${l.why_failed}`,
        `- **Fix:** ${l.how_to_prevent}`,
        `- **Scope:** ${(_a = l.scope) !== null && _a !== void 0 ? _a : 'global'} | **TTL:** ${(_b = l.ttl) !== null && _b !== void 0 ? _b : 60}d`,
    ].join('\n');
}
