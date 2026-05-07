"use strict";
/**
 * Per-project learnings — append-only JSONL log under `.cm/learnings.jsonl`.
 *
 * Each learning is a small structured note that future sessions read at start
 * (via cm-continuity) so the agent doesn't repeat past pitfalls or forget
 * preferences. Inspired by gstack `/learn` but simpler — no sync required.
 *
 * Format (one JSON object per line):
 *   { "ts": "2026-05-07T12:00:00Z",
 *     "type": "pitfall" | "preference" | "pattern" | "fact",
 *     "scope": "deploy" | "ui" | "test" | ...,
 *     "note": "human readable note",
 *     "source": "cm-retro-cli" | "manual" | ... }
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LearningError = void 0;
exports.learningsPath = learningsPath;
exports.addLearning = addLearning;
exports.listLearnings = listLearnings;
exports.pruneLearnings = pruneLearnings;
exports.anonymize = anonymize;
exports.learningKey = learningKey;
exports.mergeLearnings = mergeLearnings;
exports.readLearningsFile = readLearningsFile;
exports.writeLearningsFile = writeLearningsFile;
exports.renderLearningsForContinuity = renderLearningsForContinuity;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const LEARNING_TYPES = new Set(['pitfall', 'preference', 'pattern', 'fact']);
function learningsPath(projectPath) {
    return path_1.default.join(projectPath, '.cm', 'learnings.jsonl');
}
function ensureDir(file) {
    const d = path_1.default.dirname(file);
    if (!fs_1.default.existsSync(d))
        fs_1.default.mkdirSync(d, { recursive: true });
}
class LearningError extends Error {
}
exports.LearningError = LearningError;
function validate(input) {
    if (!LEARNING_TYPES.has(input.type)) {
        throw new LearningError(`invalid learning type: ${input.type}`);
    }
    if (!input.scope || typeof input.scope !== 'string') {
        throw new LearningError('learning.scope is required (string)');
    }
    if (!input.note || typeof input.note !== 'string') {
        throw new LearningError('learning.note is required (string)');
    }
    if (input.note.length > 500) {
        throw new LearningError(`learning.note too long (${input.note.length} > 500)`);
    }
}
function addLearning(projectPath, input) {
    var _a;
    validate(input);
    const learning = Object.assign({ ts: (_a = input.ts) !== null && _a !== void 0 ? _a : new Date().toISOString(), type: input.type, scope: input.scope, note: input.note }, (input.source ? { source: input.source } : {}));
    const file = learningsPath(projectPath);
    ensureDir(file);
    fs_1.default.appendFileSync(file, JSON.stringify(learning) + '\n', 'utf8');
    return learning;
}
function listLearnings(projectPath, query = {}) {
    const file = learningsPath(projectPath);
    if (!fs_1.default.existsSync(file))
        return [];
    const raw = fs_1.default.readFileSync(file, 'utf8');
    const out = [];
    for (const line of raw.split('\n')) {
        if (!line.trim())
            continue;
        let parsed;
        try {
            parsed = JSON.parse(line);
        }
        catch (_a) {
            continue; // skip malformed lines
        }
        if (query.type && parsed.type !== query.type)
            continue;
        if (query.scope && parsed.scope !== query.scope)
            continue;
        if (query.since && parsed.ts < query.since)
            continue;
        out.push(parsed);
    }
    // Newest first.
    out.reverse();
    if (query.limit && out.length > query.limit)
        return out.slice(0, query.limit);
    return out;
}
/**
 * Remove learnings older than `maxAgeDays` (default 180).
 * Returns the number of pruned entries.
 */
function pruneLearnings(projectPath, maxAgeDays = 180) {
    const file = learningsPath(projectPath);
    if (!fs_1.default.existsSync(file))
        return 0;
    const cutoff = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000).toISOString();
    const raw = fs_1.default.readFileSync(file, 'utf8');
    const kept = [];
    let pruned = 0;
    for (const line of raw.split('\n')) {
        if (!line.trim())
            continue;
        try {
            const parsed = JSON.parse(line);
            if (parsed.ts >= cutoff) {
                kept.push(line);
            }
            else {
                pruned++;
            }
        }
        catch (_a) {
            kept.push(line); // keep malformed lines as-is
        }
    }
    fs_1.default.writeFileSync(file, kept.join('\n') + (kept.length ? '\n' : ''), 'utf8');
    return pruned;
}
/**
 * Strip user-identifying / token-looking material from a learning before it
 * leaves the project. Used by `cm learn sync` to push to a shared remote
 * without leaking absolute paths, emails, or long credentials.
 */
function anonymize(l) {
    const stripPath = (s) => s
        .replace(/\/Users\/[^/\s"']+/g, '~')
        .replace(/\/home\/[^/\s"']+/g, '~')
        .replace(/[A-Za-z]:\\Users\\[^\\\s"']+/g, '~');
    const stripEmail = (s) => s.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '<email>');
    const stripToken = (s) => 
    // Long opaque tokens — runs of 24+ url-safe chars without spaces.
    s.replace(/[A-Za-z0-9_\-]{24,}/g, '<token>');
    const clean = (s) => stripToken(stripEmail(stripPath(s)));
    return Object.assign({ ts: l.ts, type: l.type, scope: clean(l.scope), note: clean(l.note) }, (l.source ? { source: clean(l.source) } : {}));
}
/**
 * Stable identity hash for dedup across machines. Excludes `ts` so the same
 * note appearing on two days collapses to one entry.
 */
function learningKey(l) {
    return `${l.type}|${l.scope}|${l.note}`;
}
/**
 * Merge two learning lists, dropping duplicates by `learningKey`. The earliest
 * timestamp wins (we treat the original observation as canonical).
 */
function mergeLearnings(a, b) {
    const map = new Map();
    for (const l of [...a, ...b]) {
        const k = learningKey(l);
        const prev = map.get(k);
        if (!prev || l.ts < prev.ts)
            map.set(k, l);
    }
    return Array.from(map.values()).sort((x, y) => (x.ts < y.ts ? -1 : 1));
}
/**
 * Read the JSONL file at an arbitrary path (used by sync to read the remote
 * mirror copy). Returns [] if the file is missing.
 */
function readLearningsFile(file) {
    if (!fs_1.default.existsSync(file))
        return [];
    const out = [];
    for (const line of fs_1.default.readFileSync(file, 'utf8').split('\n')) {
        if (!line.trim())
            continue;
        try {
            out.push(JSON.parse(line));
        }
        catch (_a) {
            // skip malformed
        }
    }
    return out;
}
function writeLearningsFile(file, list) {
    const dir = path_1.default.dirname(file);
    if (!fs_1.default.existsSync(dir))
        fs_1.default.mkdirSync(dir, { recursive: true });
    const body = list.map(l => JSON.stringify(l)).join('\n');
    fs_1.default.writeFileSync(file, list.length ? body + '\n' : '', 'utf8');
}
/**
 * Render the most recent N learnings as a compact Markdown block, suitable
 * for injection into CONTINUITY.md by cm-continuity at session start.
 */
function renderLearningsForContinuity(projectPath, limit = 10) {
    const recent = listLearnings(projectPath, { limit });
    if (recent.length === 0)
        return '';
    const lines = ['## Recent Learnings (auto-loaded)'];
    for (const l of recent) {
        const date = l.ts.slice(0, 10);
        lines.push(`- [${date}] **${l.type}/${l.scope}**: ${l.note}`);
    }
    return lines.join('\n') + '\n';
}
