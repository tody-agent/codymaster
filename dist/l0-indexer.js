"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateLearningsIndex = generateLearningsIndex;
exports.generateSkeletonIndex = generateSkeletonIndex;
exports.generateContinuityAbstract = generateContinuityAbstract;
exports.refreshAllIndexes = refreshAllIndexes;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// ─── Constants ──────────────────────────────────────────────────────────────
const CM_DIR = '.cm';
// ─── Learnings Index (L0) ───────────────────────────────────────────────────
function generateLearningsIndex(projectPath) {
    const learningsPath = path_1.default.join(projectPath, CM_DIR, 'memory', 'learnings.json');
    let learnings = [];
    try {
        if (fs_1.default.existsSync(learningsPath)) {
            learnings = JSON.parse(fs_1.default.readFileSync(learningsPath, 'utf-8'));
        }
    }
    catch (_a) {
        learnings = [];
    }
    const active = learnings.filter(l => !l.status || l.status === 'active');
    const lines = [
        `# Learnings Index (${active.length} entries)`,
        `> L0 summary — read full entry by ID when needed`,
        '',
    ];
    for (const l of active) {
        const id = l.id || '?';
        const summary = l.error || l.whatFailed || '(no description)';
        const scope = l.scope ? `[${l.scope}` : '[global';
        const ttl = l.ttl ? `, TTL:${l.ttl}d]` : ']';
        const reinforce = l.reinforceCount && l.reinforceCount > 0 ? ` ×${l.reinforceCount}` : '';
        lines.push(`- ${id}: ${summary} ${scope}${ttl}${reinforce}`);
    }
    const index = lines.join('\n');
    // Write to disk
    const outPath = path_1.default.join(projectPath, CM_DIR, 'learnings-index.md');
    try {
        fs_1.default.writeFileSync(outPath, index, 'utf-8');
    }
    catch ( /* non-fatal */_b) { /* non-fatal */ }
    return index;
}
// ─── Skeleton Index (L0) ────────────────────────────────────────────────────
function generateSkeletonIndex(projectPath) {
    const skeletonPath = path_1.default.join(projectPath, CM_DIR, 'skeleton.md');
    if (!fs_1.default.existsSync(skeletonPath)) {
        const fallback = '# Skeleton Index\n> No skeleton.md found. Run `cm continuity index` to generate.\n';
        const outPath = path_1.default.join(projectPath, CM_DIR, 'skeleton-index.md');
        try {
            fs_1.default.writeFileSync(outPath, fallback, 'utf-8');
        }
        catch ( /* non-fatal */_a) { /* non-fatal */ }
        return fallback;
    }
    const content = fs_1.default.readFileSync(skeletonPath, 'utf-8');
    const lines = content.split('\n');
    const result = ['# Skeleton Index (L0)\n'];
    // Extract Entry Points section
    const entryIdx = lines.findIndex(l => /entry points?/i.test(l));
    if (entryIdx !== -1) {
        result.push('## Entry Points');
        for (let i = entryIdx + 1; i < Math.min(entryIdx + 8, lines.length); i++) {
            if (lines[i].startsWith('#'))
                break;
            if (lines[i].trim())
                result.push(lines[i]);
        }
        result.push('');
    }
    // Extract top-level src/ module names from directory tree
    const modules = [];
    for (const line of lines) {
        // Match lines like "  continuity.ts (469 lines)" or "src/continuity.ts"
        const m = line.match(/(?:^|\s{2,4})(\w[\w-]+)\.ts\b/);
        if (m && !m[1].includes('test') && !m[1].includes('spec')) {
            if (!modules.includes(m[1]))
                modules.push(m[1]);
        }
        if (modules.length >= 12)
            break;
    }
    if (modules.length > 0) {
        result.push('## Core Modules');
        result.push(modules.map(m => `- ${m}`).join('\n'));
        result.push('');
    }
    // Extract Config Files section
    const configIdx = lines.findIndex(l => /config files?/i.test(l));
    if (configIdx !== -1) {
        result.push('## Config');
        for (let i = configIdx + 1; i < Math.min(configIdx + 6, lines.length); i++) {
            if (lines[i].startsWith('#'))
                break;
            if (lines[i].trim())
                result.push(lines[i]);
        }
        result.push('');
    }
    // Extract Tests section
    const testIdx = lines.findIndex(l => /^#+\s*tests?/i.test(l));
    if (testIdx !== -1) {
        result.push('## Tests');
        for (let i = testIdx + 1; i < Math.min(testIdx + 6, lines.length); i++) {
            if (lines[i].startsWith('#'))
                break;
            if (lines[i].trim())
                result.push(lines[i]);
        }
    }
    const index = result.join('\n');
    const outPath = path_1.default.join(projectPath, CM_DIR, 'skeleton-index.md');
    try {
        fs_1.default.writeFileSync(outPath, index, 'utf-8');
    }
    catch ( /* non-fatal */_b) { /* non-fatal */ }
    return index;
}
// ─── Continuity Abstract ────────────────────────────────────────────────────
function generateContinuityAbstract(projectPath) {
    const contPath = path_1.default.join(projectPath, CM_DIR, 'CONTINUITY.md');
    if (!fs_1.default.existsSync(contPath)) {
        return '> No session active.';
    }
    const content = fs_1.default.readFileSync(contPath, 'utf-8');
    // Extract key fields
    const phaseMatch = content.match(/Current Phase:\s*(.+)/);
    const iterMatch = content.match(/Current Iteration:\s*(\d+)/);
    const goalMatch = content.match(/## Active Goal\s*\n([^\n#]+)/);
    const taskMatch = content.match(/- Title:\s*(.+)/);
    const nextMatch = content.match(/## Next Actions.*?\n1\.\s*(.+)/);
    const phase = phaseMatch ? phaseMatch[1].trim() : 'idle';
    const iter = iterMatch ? iterMatch[1] : '0';
    const goal = goalMatch ? goalMatch[1].trim() : 'No active goal';
    const task = taskMatch ? taskMatch[1].trim() : null;
    const next = nextMatch ? nextMatch[1].trim() : null;
    const parts = [
        `**Phase:** ${phase} (iter ${iter}) | **Goal:** ${goal}`,
    ];
    if (task)
        parts.push(`**Task:** ${task}`);
    if (next)
        parts.push(`**Next:** ${next}`);
    return parts.join('\n');
}
// ─── Refresh All ────────────────────────────────────────────────────────────
function refreshAllIndexes(projectPath) {
    return {
        learnings: generateLearningsIndex(projectPath),
        skeleton: generateSkeletonIndex(projectPath),
        continuity: generateContinuityAbstract(projectPath),
    };
}
