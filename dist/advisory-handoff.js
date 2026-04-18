"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAdvisoryHandoff = buildAdvisoryHandoff;
exports.formatAdvisoryHandoffMarkdown = formatAdvisoryHandoffMarkdown;
const execution_analyzer_1 = require("./execution-analyzer");
function resolveAnalysis(backend, options) {
    var _a;
    const analyses = backend.getExecutionAnalyses((_a = options.searchLimit) !== null && _a !== void 0 ? _a : 50);
    if (analyses.length === 0) {
        throw new Error('No execution analyses recorded yet.');
    }
    if (!options.analysisId)
        return analyses[0];
    const match = analyses.find((analysis) => analysis.id.startsWith(options.analysisId));
    if (!match) {
        throw new Error(`No advisory analysis found for id prefix: ${options.analysisId}`);
    }
    return match;
}
function resolveSkillName(analysis, explicitSkill) {
    var _a;
    if (explicitSkill)
        return explicitSkill;
    return (_a = analysis.skill_judgments.find((judgment) => judgment.selected || judgment.applied)) === null || _a === void 0 ? void 0 : _a.skill;
}
function buildNextStep(consumer, action, skill) {
    const subject = skill !== null && skill !== void 0 ? skill : 'the affected skill';
    if (consumer === 'cm-skill-health') {
        return `Run cm-skill-health on ${subject} and confirm whether ${action} is still the truthful recovery path.`;
    }
    return `Run cm-skill-evolution in ${action} mode for ${subject} using this advisory evidence as the starting note.`;
}
function buildAdvisoryHandoff(backend, options) {
    var _a, _b;
    const analysis = resolveAnalysis(backend, options);
    const skillName = resolveSkillName(analysis, options.skill);
    const judgment = skillName
        ? analysis.skill_judgments.find((item) => item.skill === skillName)
        : undefined;
    const metric = skillName ? backend.getSkillMetric(skillName) : null;
    const action = (_a = analysis.recommended_action) !== null && _a !== void 0 ? _a : 'NONE';
    return {
        version: 1,
        generated_at: new Date().toISOString(),
        consumer: options.consumer,
        recommendation: {
            action,
            confidence: analysis.confidence,
        },
        source: {
            analysis_id: analysis.id,
            task_title: analysis.task_title,
            task_status: analysis.status,
            source_task_type: analysis.source_task_type,
            created_at: analysis.created_at,
        },
        skill: {
            name: skillName,
            judgment,
            metric: metric ? Object.assign(Object.assign({}, metric), { quality_weight: (0, execution_analyzer_1.qualityWeight)(metric) }) : null,
        },
        evidence: {
            summary: analysis.summary,
            selected_skills: (_b = analysis.selected_skills) !== null && _b !== void 0 ? _b : [],
            target_skills: analysis.skill_judgments
                .filter((item) => item.selected || item.applied)
                .map((item) => item.skill),
        },
        next_step: buildNextStep(options.consumer, action, skillName),
    };
}
function formatAdvisoryHandoffMarkdown(handoff) {
    var _a, _b, _c;
    return [
        '## Advisory Handoff',
        `- Consumer: ${handoff.consumer}`,
        `- Skill: ${(_a = handoff.skill.name) !== null && _a !== void 0 ? _a : '-'}`,
        `- Recovery path: ${handoff.recommendation.action}`,
        `- Confidence: ${(_c = (_b = handoff.recommendation.confidence) === null || _b === void 0 ? void 0 : _b.toFixed(2)) !== null && _c !== void 0 ? _c : '-'}`,
        `- Source analysis: ${handoff.source.analysis_id}`,
        `- Task: ${handoff.source.task_title}`,
        `- Status: ${handoff.source.task_status}`,
        `- Evidence: ${handoff.evidence.summary}`,
        `- Selected skills: ${handoff.evidence.selected_skills.join(', ') || '-'}`,
        `- Target skills: ${handoff.evidence.target_skills.join(', ') || '-'}`,
        `- Quality weight: ${handoff.skill.metric ? handoff.skill.metric.quality_weight.toFixed(2) : '-'}`,
        `- Next step: ${handoff.next_step}`,
    ].join('\n');
}
