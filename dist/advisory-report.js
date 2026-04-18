"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAdvisoryReportData = buildAdvisoryReportData;
exports.buildAdvisoryMetricsData = buildAdvisoryMetricsData;
exports.formatAdvisoryReport = formatAdvisoryReport;
exports.formatAdvisoryMetrics = formatAdvisoryMetrics;
const execution_analyzer_1 = require("./execution-analyzer");
function fmtConfidence(value) {
    if (typeof value !== 'number')
        return '-';
    return value.toFixed(2);
}
function summarizeTargetSkills(analysis) {
    const targets = analysis.skill_judgments
        .filter((judgment) => judgment.selected || judgment.applied)
        .map((judgment) => judgment.skill);
    return targets.length > 0 ? targets.join(', ') : '-';
}
function formatAnalysisLine(analysis) {
    var _a;
    const action = (_a = analysis.recommended_action) !== null && _a !== void 0 ? _a : 'NONE';
    return [
        `- ${analysis.task_title}`,
        `status=${analysis.status}`,
        `action=${action}`,
        `confidence=${fmtConfidence(analysis.confidence)}`,
        `skills=${summarizeTargetSkills(analysis)}`,
    ].join(' | ');
}
function formatMetricLine(metric) {
    var _a;
    return [
        `- ${metric.skill}`,
        `quality=${metric.quality_weight.toFixed(2)}`,
        `selected=${metric.selections}`,
        `applied=${metric.applications}`,
        `completed=${metric.task_completions}`,
        `fallbacks=${metric.fallbacks}`,
        `action=${(_a = metric.last_recommended_action) !== null && _a !== void 0 ? _a : '-'}`,
    ].join(' | ');
}
function buildAdvisoryReportData(backend, options = {}) {
    var _a;
    const limit = (_a = options.limit) !== null && _a !== void 0 ? _a : 10;
    return backend.getExecutionAnalyses(limit).map((analysis) => ({
        id: analysis.id,
        task_title: analysis.task_title,
        status: analysis.status,
        summary: analysis.summary,
        source_task_type: analysis.source_task_type,
        recommended_action: analysis.recommended_action,
        confidence: analysis.confidence,
        created_at: analysis.created_at,
        active_skills: analysis.skill_judgments
            .filter((judgment) => judgment.selected || judgment.applied)
            .map((judgment) => judgment.skill),
    }));
}
function buildAdvisoryMetricsData(backend, options = {}) {
    var _a;
    const limit = (_a = options.limit) !== null && _a !== void 0 ? _a : 10;
    return backend.listSkillMetrics(limit).map((metric) => ({
        skill: metric.skill,
        quality_weight: (0, execution_analyzer_1.qualityWeight)(metric),
        selections: metric.selections,
        applications: metric.applications,
        task_completions: metric.task_completions,
        fallbacks: metric.fallbacks,
        total_token_estimate: metric.total_token_estimate,
        last_task_type: metric.last_task_type,
        last_recommended_action: metric.last_recommended_action,
        last_used_at: metric.last_used_at,
        updated_at: metric.updated_at,
    }));
}
function formatAdvisoryReport(backend, options = {}) {
    const analyses = buildAdvisoryReportData(backend, options);
    if (analyses.length === 0) {
        return [
            'Advisory Report',
            '',
            'No execution analyses recorded yet.',
        ].join('\n');
    }
    return [
        'Advisory Report',
        '',
        ...analyses.map((analysis) => formatAnalysisLine(Object.assign(Object.assign({}, analysis), { skill_judgments: analysis.active_skills.map((skill) => ({ skill, selected: true })) }))),
    ].join('\n');
}
function formatAdvisoryMetrics(backend, options = {}) {
    const metrics = buildAdvisoryMetricsData(backend, options);
    if (metrics.length === 0) {
        return [
            'Skill Metrics',
            '',
            'No skill metrics recorded yet.',
        ].join('\n');
    }
    return [
        'Skill Metrics',
        '',
        ...metrics.map(formatMetricLine),
    ].join('\n');
}
