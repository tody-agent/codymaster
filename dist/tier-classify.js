"use strict";
/**
 * Project Tier Classification.
 *
 * Heuristic-based assignment to one of:
 *   LITE          — solo / prototype       (LOC < 2k, files < 50)
 *   STANDARD      — small project          (LOC < 20k, files < 300)
 *   PROFESSIONAL  — production project     (LOC < 100k, files < 1500)
 *   ENTERPRISE    — large codebase         (above)
 *
 * The tier dictates:
 *   - cm-quality-gate strictness (Vibe mode default)
 *   - Adaptive Depth (TL;DR vs full protocol rendering for skills)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.classifyProject = classifyProject;
exports.renderTierMarkdown = renderTierMarkdown;
exports.writeTierReport = writeTierReport;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const SKIP_DIR = new Set([
    'node_modules', '.git', 'dist', 'build', '.next', '.cache',
    '.venv', 'venv', '__pycache__', 'target', 'vendor', '.cm',
    'coverage', '.turbo', '.pnpm-store',
]);
const CODE_EXT = new Set([
    '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
    '.py', '.rb', '.go', '.rs', '.java', '.kt',
    '.swift', '.c', '.cc', '.cpp', '.h', '.hpp',
]);
function walk(root, acc, depth = 0) {
    if (depth > 12)
        return;
    let entries;
    try {
        entries = fs_1.default.readdirSync(root, { withFileTypes: true });
    }
    catch (_a) {
        return;
    }
    for (const e of entries) {
        if (e.name.startsWith('.') && e.name !== '.cm') {
            // skip hidden dirs except for explicit ones
        }
        if (SKIP_DIR.has(e.name))
            continue;
        const full = path_1.default.join(root, e.name);
        if (e.isDirectory()) {
            walk(full, acc, depth + 1);
        }
        else if (e.isFile()) {
            const ext = path_1.default.extname(e.name).toLowerCase();
            if (!CODE_EXT.has(ext))
                continue;
            acc.files += 1;
            try {
                const content = fs_1.default.readFileSync(full, 'utf8');
                acc.loc += content.split('\n').length;
            }
            catch (_b) {
                // unreadable; ignore
            }
        }
    }
}
function countDeps(root) {
    var _a, _b;
    let n = 0;
    try {
        const pkg = JSON.parse(fs_1.default.readFileSync(path_1.default.join(root, 'package.json'), 'utf8'));
        n += Object.keys((_a = pkg.dependencies) !== null && _a !== void 0 ? _a : {}).length;
        n += Object.keys((_b = pkg.devDependencies) !== null && _b !== void 0 ? _b : {}).length;
    }
    catch ( /* not a node project */_c) { /* not a node project */ }
    try {
        const py = fs_1.default.readFileSync(path_1.default.join(root, 'requirements.txt'), 'utf8');
        n += py.split('\n').filter((l) => l.trim() && !l.startsWith('#')).length;
    }
    catch ( /* no python reqs */_d) { /* no python reqs */ }
    return n;
}
function classifyProject(root) {
    const metrics = { files: 0, loc: 0, deps: 0 };
    walk(root, metrics);
    metrics.deps = countDeps(root);
    let tier;
    if (metrics.files < 50 && metrics.loc < 2000)
        tier = 'LITE';
    else if (metrics.files < 300 && metrics.loc < 20000)
        tier = 'STANDARD';
    else if (metrics.files < 1500 && metrics.loc < 100000)
        tier = 'PROFESSIONAL';
    else
        tier = 'ENTERPRISE';
    const vibeDefault = {
        LITE: 'OFF',
        STANDARD: 'WARNING',
        PROFESSIONAL: 'SOFT',
        ENTERPRISE: 'FULL',
    };
    return {
        tier,
        metrics,
        vibe_mode_default: vibeDefault[tier],
        prefer_tldr: tier === 'LITE' || tier === 'STANDARD',
    };
}
function renderTierMarkdown(r) {
    return [
        `# Project Tier: ${r.tier}`,
        '',
        `Files: ${r.metrics.files}`,
        `LOC:   ${r.metrics.loc}`,
        `Deps:  ${r.metrics.deps}`,
        '',
        `Default Vibecoding mode: ${r.vibe_mode_default}`,
        `Adaptive depth: ${r.prefer_tldr ? 'TL;DR only' : 'Full protocol'}`,
        '',
    ].join('\n');
}
function writeTierReport(root, r) {
    const dir = path_1.default.join(root, '.cm');
    if (!fs_1.default.existsSync(dir))
        fs_1.default.mkdirSync(dir, { recursive: true });
    const file = path_1.default.join(dir, 'project-tier.md');
    fs_1.default.writeFileSync(file, renderTierMarkdown(r), 'utf8');
    return file;
}
