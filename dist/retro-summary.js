"use strict";
/**
 * Aggregate `.cm/operational-learnings.jsonl` for `cm retro summary`.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadRetroEntries = loadRetroEntries;
exports.filterSince = filterSince;
exports.countByTool = countByTool;
exports.formatRetroMarkdown = formatRetroMarkdown;
exports.formatRetroJson = formatRetroJson;
const fs_1 = __importDefault(require("fs"));
function loadRetroEntries(filePath) {
    if (!fs_1.default.existsSync(filePath))
        return [];
    const out = [];
    for (const line of fs_1.default.readFileSync(filePath, 'utf8').split('\n')) {
        const t = line.trim();
        if (!t)
            continue;
        try {
            const o = JSON.parse(t);
            if (typeof o.ts === 'string' && typeof o.note === 'string') {
                out.push({
                    ts: o.ts,
                    tool: typeof o.tool === 'string' ? o.tool : 'unknown',
                    note: o.note,
                });
            }
        }
        catch (_a) {
            /* skip malformed line */
        }
    }
    return out;
}
function filterSince(entries, sinceIso) {
    const t0 = new Date(sinceIso).getTime();
    if (Number.isNaN(t0))
        return entries;
    return entries.filter((e) => new Date(e.ts).getTime() >= t0);
}
function countByTool(entries) {
    const m = {};
    for (const e of entries) {
        m[e.tool] = (m[e.tool] || 0) + 1;
    }
    return m;
}
function formatRetroMarkdown(entries, byTool) {
    const lines = ['# Retro summary', '', `**Total entries:** ${entries.length}`, ''];
    lines.push('## By tool');
    for (const [tool, n] of Object.entries(byTool).sort((a, b) => b[1] - a[1])) {
        lines.push(`- **${tool}:** ${n}`);
    }
    lines.push('', '## Entries (chronological)');
    for (const e of entries.sort((a, b) => a.ts.localeCompare(b.ts))) {
        lines.push(`- \`${e.ts}\` [${e.tool}] ${e.note}`);
    }
    return lines.join('\n');
}
function formatRetroJson(entries, byTool) {
    return JSON.stringify({
        total: entries.length,
        by_tool: byTool,
        entries: entries.sort((a, b) => a.ts.localeCompare(b.ts)),
    }, null, 2);
}
