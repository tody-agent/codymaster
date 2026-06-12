"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeSkillTokenFootprint = analyzeSkillTokenFootprint;
exports.formatSkillTokenReport = formatSkillTokenReport;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const token_budget_1 = require("./token-budget");
function fileStat(filePath) {
    const content = fs_1.default.readFileSync(filePath, 'utf-8');
    return {
        path: filePath,
        bytes: Buffer.byteLength(content, 'utf-8'),
        lines: content === '' ? 0 : content.split('\n').length,
        tokens: (0, token_budget_1.estimateTokens)(content),
    };
}
function addStats(pathLabel, stats) {
    return stats.reduce((acc, stat) => ({
        path: pathLabel,
        bytes: acc.bytes + stat.bytes,
        lines: acc.lines + stat.lines,
        tokens: acc.tokens + stat.tokens,
    }), { path: pathLabel, bytes: 0, lines: 0, tokens: 0 });
}
function delta(from, to) {
    return {
        bytes: from.bytes - to.bytes,
        lines: from.lines - to.lines,
        tokens: from.tokens - to.tokens,
    };
}
function analyzeSkillTokenFootprint(skillName, opts = {}) {
    var _a;
    const projectPath = path_1.default.resolve((_a = opts.projectPath) !== null && _a !== void 0 ? _a : process.cwd());
    const skillPath = path_1.default.join(projectPath, 'skills', skillName);
    const skillMdPath = path_1.default.join(skillPath, 'SKILL.md');
    if (!fs_1.default.existsSync(skillMdPath)) {
        throw new Error(`Skill "${skillName}" not found at ${skillMdPath}`);
    }
    const core = fileStat(skillMdPath);
    const referencesDir = path_1.default.join(skillPath, 'references');
    const references = fs_1.default.existsSync(referencesDir)
        ? fs_1.default.readdirSync(referencesDir, { withFileTypes: true })
            .filter((entry) => entry.isFile())
            .map((entry) => path_1.default.join(referencesDir, entry.name))
            .sort((a, b) => a.localeCompare(b))
            .map(fileStat)
        : [];
    const progressiveMin = Object.assign(Object.assign({}, core), { path: 'progressive_min' });
    const progressiveMax = addStats('progressive_max', [core, ...references]);
    const report = {
        skill: skillName,
        project_path: projectPath,
        skill_path: skillPath,
        core,
        references,
        progressive_min: progressiveMin,
        progressive_max: progressiveMax,
    };
    if (opts.baselinePath) {
        const baselinePath = path_1.default.resolve(projectPath, opts.baselinePath);
        if (!fs_1.default.existsSync(baselinePath)) {
            throw new Error(`Baseline file not found: ${baselinePath}`);
        }
        const baseline = fileStat(baselinePath);
        report.baseline = {
            path: baseline.path,
            bytes: baseline.bytes,
            lines: baseline.lines,
            tokens: baseline.tokens,
            delta_vs_progressive_min: delta(baseline, progressiveMin),
            delta_vs_progressive_max: delta(baseline, progressiveMax),
        };
    }
    return report;
}
function formatSkillTokenReport(report) {
    const lines = [
        `Skill Token Report: ${report.skill}`,
        `Project: ${report.project_path}`,
        `Skill path: ${report.skill_path}`,
        '',
        `core: ${report.core.tokens} tok · ${report.core.lines} lines · ${report.core.bytes} bytes`,
        `progressive_min: ${report.progressive_min.tokens} tok · ${report.progressive_min.lines} lines · ${report.progressive_min.bytes} bytes`,
        `progressive_max: ${report.progressive_max.tokens} tok · ${report.progressive_max.lines} lines · ${report.progressive_max.bytes} bytes`,
        `references: ${report.references.length}`,
    ];
    if (report.references.length > 0) {
        lines.push('');
        lines.push('Reference files:');
        for (const ref of report.references) {
            lines.push(`- ${path_1.default.basename(ref.path)}: ${ref.tokens} tok · ${ref.lines} lines · ${ref.bytes} bytes`);
        }
    }
    if (report.baseline) {
        lines.push('');
        lines.push(`baseline: ${report.baseline.tokens} tok · ${report.baseline.lines} lines · ${report.baseline.bytes} bytes`);
        lines.push(`baseline delta vs progressive_min: ${report.baseline.delta_vs_progressive_min.tokens} tok · ${report.baseline.delta_vs_progressive_min.lines} lines · ${report.baseline.delta_vs_progressive_min.bytes} bytes`);
        lines.push(`baseline delta vs progressive_max: ${report.baseline.delta_vs_progressive_max.tokens} tok · ${report.baseline.delta_vs_progressive_max.lines} lines · ${report.baseline.delta_vs_progressive_max.bytes} bytes`);
    }
    return lines.join('\n');
}
