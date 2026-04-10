"use strict";
/**
 * Proactive skill hints from git status + sprint state (`cm suggest`).
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gitPorcelain = gitPorcelain;
exports.suggestFromContext = suggestFromContext;
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const sprint_pipeline_1 = require("./sprint-pipeline");
function dedupe(s) {
    const seen = new Set();
    const out = [];
    for (const x of s) {
        const k = x.skill.toLowerCase();
        if (seen.has(k))
            continue;
        seen.add(k);
        out.push(x);
    }
    return out;
}
function gitPorcelain(projectPath) {
    try {
        return (0, child_process_1.execFileSync)('git', ['status', '--porcelain'], {
            cwd: projectPath,
            encoding: 'utf8',
            maxBuffer: 2000000,
        });
    }
    catch (_a) {
        return '';
    }
}
function suggestFromContext(projectPath) {
    const root = path_1.default.resolve(projectPath);
    const out = [];
    const porcelain = gitPorcelain(root);
    const lines = porcelain.split('\n').filter(Boolean);
    const paths = lines.map((l) => l.slice(3).trim()).filter(Boolean);
    const joined = paths.join('\n');
    if (/\.test\.(ts|tsx|js|jsx)\b/m.test(joined)) {
        out.push({ skill: 'cm-tdd', reason: 'Modified or untracked test files in git status.' });
    }
    if (/\.(md|mdx)\b/m.test(joined)) {
        out.push({ skill: 'cm-dockit', reason: 'Markdown/docs paths changed.' });
    }
    if (/(package\.json|package-lock\.json|pnpm-lock|yarn\.lock)/m.test(joined)) {
        out.push({ skill: 'cm-test-gate', reason: 'Dependency lockfiles changed; run the test gate.' });
    }
    if (/(\.github\/workflows\/|Dockerfile|fly\.toml|wrangler)/m.test(joined)) {
        out.push({ skill: 'cm-safe-deploy', reason: 'CI or deploy config changed.' });
    }
    if (lines.length > 8) {
        out.push({ skill: 'cm-git-worktrees', reason: 'Many working-tree changes; consider an isolated worktree.' });
    }
    const sprint = (0, sprint_pipeline_1.readSprintState)(root);
    if (sprint && sprint.current_index >= 0 && sprint.current_index < sprint.pipeline.length) {
        const step = sprint.pipeline[sprint.current_index];
        const skill = (0, sprint_pipeline_1.skillMappingForStep)(step);
        out.push({
            skill,
            reason: `Active sprint step: **${step}** (index ${sprint.current_index + 1}/${sprint.pipeline.length}).`,
        });
    }
    if (fs_1.default.existsSync(path_1.default.join(root, '.cm', 'config.yaml'))) {
        out.push({
            skill: 'cm-engineering-meta',
            reason: '`.cm/config.yaml` present; engineering commands honor shared config.',
        });
    }
    return dedupe(out);
}
