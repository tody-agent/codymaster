"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionAnalyzer = void 0;
exports.qualityWeight = qualityWeight;
const crypto_1 = __importDefault(require("crypto"));
const path_1 = __importDefault(require("path"));
const context_bus_1 = require("./context-bus");
const storage_backend_1 = require("./storage-backend");
const retro_summary_1 = require("./retro-summary");
const skill_execution_cache_1 = require("./skill-execution-cache");
function bucketLatency(latencyMs) {
    if (latencyMs === undefined || latencyMs < 0)
        return undefined;
    if (latencyMs < 1000)
        return 'subsecond';
    if (latencyMs < 5000)
        return 'fast';
    if (latencyMs < 15000)
        return 'medium';
    return 'slow';
}
function buildRetroSummary(projectPath, limit = 3) {
    const retroPath = path_1.default.join(projectPath, '.cm', 'operational-learnings.jsonl');
    const entries = (0, retro_summary_1.loadRetroEntries)(retroPath).slice(-limit);
    if (entries.length === 0)
        return undefined;
    return entries.map((entry) => `- [${entry.tool}] ${entry.note}`).join('\n');
}
function normalizeJudgments(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
    const map = new Map();
    for (const skill of (_a = input.selectedSkills) !== null && _a !== void 0 ? _a : []) {
        map.set(skill, {
            skill,
            selected: true,
            applied: true,
            task_completed: input.taskStatus === 'completed',
            fallback_used: false,
        });
    }
    for (const observation of (_b = input.skillObservations) !== null && _b !== void 0 ? _b : []) {
        const current = (_c = map.get(observation.skill)) !== null && _c !== void 0 ? _c : { skill: observation.skill };
        map.set(observation.skill, {
            skill: observation.skill,
            selected: (_e = (_d = observation.selected) !== null && _d !== void 0 ? _d : current.selected) !== null && _e !== void 0 ? _e : false,
            applied: (_g = (_f = observation.applied) !== null && _f !== void 0 ? _f : current.applied) !== null && _g !== void 0 ? _g : ((_j = (_h = observation.selected) !== null && _h !== void 0 ? _h : current.selected) !== null && _j !== void 0 ? _j : false),
            task_completed: input.taskStatus === 'completed',
            fallback_used: (_l = (_k = observation.fallbackUsed) !== null && _k !== void 0 ? _k : current.fallback_used) !== null && _l !== void 0 ? _l : false,
            token_estimate: (_m = observation.tokenEstimate) !== null && _m !== void 0 ? _m : current.token_estimate,
            note: (_o = observation.note) !== null && _o !== void 0 ? _o : current.note,
            relevance_score: (_p = observation.relevanceScore) !== null && _p !== void 0 ? _p : current.relevance_score,
        });
    }
    return Array.from(map.values());
}
function qualityWeight(metric) {
    if (!metric)
        return 0.5;
    const base = Math.max(metric.selections, 1);
    const applicationRate = metric.applications / base;
    const completionRate = metric.task_completions / base;
    const fallbackPenalty = metric.fallbacks / base;
    const weighted = (applicationRate * 0.35) + (completionRate * 0.5) + ((1 - fallbackPenalty) * 0.15);
    return Math.max(0, Math.min(1, weighted));
}
function buildAdvisory(taskStatus, judgments, backend) {
    const activeSkills = judgments.filter((judgment) => judgment.selected || judgment.applied).map((judgment) => judgment.skill);
    const fallbackSkills = judgments.filter((judgment) => judgment.fallback_used).map((judgment) => judgment.skill);
    if (taskStatus !== 'completed' && activeSkills.length > 0) {
        const weakest = activeSkills
            .map((skill) => ({ skill, weight: qualityWeight(backend.getSkillMetric(skill)) }))
            .sort((a, b) => a.weight - b.weight)[0];
        const targetSkills = weakest ? [weakest.skill] : activeSkills.slice(0, 1);
        return {
            action: 'FIX',
            confidence: weakest ? Math.max(0.68, 0.82 - weakest.weight * 0.2) : 0.72,
            reason: 'Task did not complete successfully while selected skills were active.',
            targetSkills,
        };
    }
    if (taskStatus === 'completed' && activeSkills.length === 0) {
        return {
            action: 'CAPTURED',
            confidence: 0.76,
            reason: 'Task completed without any tracked skill usage, suggesting a reusable pattern worth capturing.',
            targetSkills: [],
        };
    }
    if (taskStatus === 'completed' && fallbackSkills.length > 0) {
        return {
            action: 'DERIVED',
            confidence: 0.74,
            reason: 'Task completed, but fallback handling suggests the current skill may need a specialized derived variant.',
            targetSkills: fallbackSkills,
        };
    }
    return {
        reason: 'No evolution action recommended from the current execution signal.',
        targetSkills: [],
    };
}
class ExecutionAnalyzer {
    constructor(projectPath, backend) {
        this.projectPath = projectPath;
        this.backend = backend !== null && backend !== void 0 ? backend : (0, storage_backend_1.getBackend)(projectPath);
        this.backend.initialize();
        this.cache = new skill_execution_cache_1.SkillExecutionCache(projectPath);
        this.cache.initialize();
    }
    analyzeExecution(input) {
        var _a, _b, _c, _d, _e, _f, _g;
        const judgments = normalizeJudgments(input);
        const bus = (0, context_bus_1.readBus)(this.projectPath);
        const retroSummary = buildRetroSummary(this.projectPath);
        const advisory = buildAdvisory(input.taskStatus, judgments, this.backend);
        const analysis = {
            id: crypto_1.default.randomUUID(),
            task_title: input.taskTitle,
            status: input.taskStatus,
            summary: (_a = input.summary) !== null && _a !== void 0 ? _a : `${input.taskStatus.toUpperCase()}: ${input.taskTitle}`,
            source_task_type: input.sourceTaskType,
            session_id: (_b = input.sessionId) !== null && _b !== void 0 ? _b : bus === null || bus === void 0 ? void 0 : bus.session_id,
            chain_id: input.chainId,
            selected_skills: (_c = input.selectedSkills) !== null && _c !== void 0 ? _c : judgments.filter((judgment) => judgment.selected).map((judgment) => judgment.skill),
            token_estimate: input.tokenEstimate,
            latency_bucket: bucketLatency(input.latencyMs),
            bus_snapshot: bus ? JSON.stringify(bus.shared_context) : undefined,
            retro_summary: retroSummary,
            recommended_action: advisory.action,
            confidence: advisory.confidence,
            skill_judgments: judgments,
            created_at: new Date().toISOString(),
        };
        this.backend.recordExecutionAnalysis(analysis);
        if (input.taskStatus === 'completed' && ((_e = (_d = input.selectedSkills) === null || _d === void 0 ? void 0 : _d.length) !== null && _e !== void 0 ? _e : 0) > 0) {
            const effectiveSkills = (_f = input.selectedSkills) !== null && _f !== void 0 ? _f : [];
            const effectiveness = effectiveSkills.length > 0 ? 0.9 : 0;
            this.cache.cacheExecution(input.taskTitle, effectiveSkills, effectiveness, (_g = input.tokenEstimate) !== null && _g !== void 0 ? _g : 0);
        }
        return analysis;
    }
}
exports.ExecutionAnalyzer = ExecutionAnalyzer;
