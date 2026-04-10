"use strict";
/**
 * Extra MCP tool handlers: plan/review/qa/deploy/search — bridge to sprint + memory.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cmPlanTool = cmPlanTool;
exports.cmReviewTool = cmReviewTool;
exports.cmQaTool = cmQaTool;
exports.cmDeployTool = cmDeployTool;
exports.cmSearchTool = cmSearchTool;
exports.cmMemoryQueryTool = cmMemoryQueryTool;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const context_bus_1 = require("./context-bus");
const sprint_pipeline_1 = require("./sprint-pipeline");
const context_db_1 = require("./context-db");
function cmPlanTool(projectPath) {
    const sprint = (0, sprint_pipeline_1.readSprintState)(projectPath);
    const bus = (0, context_bus_1.readBus)(projectPath);
    const preview = (0, sprint_pipeline_1.sprintArtifactPreviewFromDisk)(projectPath);
    return {
        sprint_active: !!sprint,
        sprint: sprint !== null && sprint !== void 0 ? sprint : null,
        context_bus: bus,
        default_pipeline: sprint_pipeline_1.SPRINT_STEPS,
        next_skill_hint: sprint
            ? sprint.current_index >= sprint.pipeline.length
                ? '(sprint complete — run cm-retro)'
                : (0, sprint_pipeline_1.skillMappingForStep)(sprint.pipeline[sprint.current_index])
            : 'cm-planning',
        artifact_paths: preview.artifacts,
    };
}
function cmReviewTool(projectPath) {
    const artDir = path_1.default.join(projectPath, '.cm', 'sprint', 'artifacts', 'review.md');
    let review = '';
    if (fs_1.default.existsSync(artDir))
        review = fs_1.default.readFileSync(artDir, 'utf8');
    return {
        review_artifact: artDir,
        has_content: review.length > 0,
        preview: review.slice(0, 4000),
        hint: 'Use cm-code-review skill for full checklist; paste diff + requirements.',
    };
}
function cmQaTool(projectPath) {
    return {
        browse_daemon: 'Run: cm browse start --token <secret> then POST /session/start',
        visual: 'cm qa-visual --url http://localhost:3000',
        gates: ['cm-quality-gate', 'cm-test-gate'],
    };
}
function cmDeployTool(projectPath) {
    return {
        hint: 'Use cm-safe-deploy skill; after ship run cm canary --url <prod>',
        project: projectPath,
    };
}
function cmSearchTool(projectPath, args) {
    const { query, scope = 'all', limit = 10 } = args;
    const dbPath = (0, context_db_1.getDbPath)(projectPath);
    (0, context_db_1.openDb)(dbPath);
    const results = [];
    if (scope === 'all' || scope === 'learnings') {
        for (const l of (0, context_db_1.queryLearnings)(dbPath, query, undefined, limit)) {
            results.push(Object.assign({ type: 'learning' }, l));
        }
    }
    if (scope === 'all' || scope === 'decisions') {
        for (const d of (0, context_db_1.queryDecisions)(dbPath, query, limit)) {
            results.push(Object.assign({ type: 'decision' }, d));
        }
    }
    return { query, scope, count: results.length, results };
}
function cmMemoryQueryTool(projectPath, args) {
    return cmSearchTool(projectPath, Object.assign(Object.assign({}, args), { scope: 'all' }));
}
