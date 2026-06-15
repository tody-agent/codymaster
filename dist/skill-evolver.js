"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillEvolver = void 0;
exports.formatEvolutionResult = formatEvolutionResult;
exports.formatEvolutionHistory = formatEvolutionHistory;
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const storage_backend_1 = require("./storage-backend");
const skill_integrity_1 = require("./skill-integrity");
// ─── Constants ──────────────────────────────────────────────────────────────
const BACKUP_DIR = '.cm/skill-backups';
const MAX_EVOLUTION_DEPTH = 5; // Anti-loop: max generations
const MIN_FIX_CONFIDENCE = 0.70;
const MIN_DERIVED_CONFIDENCE = 0.75;
const MIN_CAPTURED_CONFIDENCE = 0.80;
// ─── Skill Evolver ──────────────────────────────────────────────────────────
// TRIZ #15 Dynamization — skills transform based on environment feedback
/**
 * SkillEvolver — Executes evolution actions recommended by the ExecutionAnalyzer.
 *
 * Three modes:
 *   FIX     — In-place repair of degraded skills (patch SKILL.md)
 *   DERIVED — Create specialized variant of an existing skill
 *   CAPTURED — Generate a new skill from successful reasoning patterns
 *
 * Safety: Always creates backups before mutations. Anti-loop protection
 * prevents runaway evolution chains.
 */
class SkillEvolver {
    constructor(projectPath, backend) {
        this.projectPath = projectPath;
        this.backend = backend !== null && backend !== void 0 ? backend : (0, storage_backend_1.getBackend)(projectPath);
        this.backend.initialize();
        this.skillsDir = this.findSkillsDir();
        this.backupDir = path_1.default.join(projectPath, BACKUP_DIR);
    }
    // ─── Public API ─────────────────────────────────────────────────────────
    /**
     * Evolve a skill based on an advisory handoff.
     */
    evolveFromAdvisory(handoff) {
        var _a;
        const mode = handoff.recommendation.action;
        const skill = handoff.skill.name;
        const confidence = (_a = handoff.recommendation.confidence) !== null && _a !== void 0 ? _a : 0;
        if (!skill) {
            return { success: false, mode: mode !== null && mode !== void 0 ? mode : 'FIX', skill: '', error: 'No target skill in advisory handoff.' };
        }
        if (!mode || mode === 'NONE') {
            return { success: false, mode: 'FIX', skill, error: 'No evolution action recommended.' };
        }
        return this.evolve(mode, skill, confidence, handoff.source.analysis_id);
    }
    /**
     * Execute a specific evolution mode on a skill.
     */
    evolve(mode, skill, confidence, sourceAnalysisId) {
        // Anti-loop protection
        const record = this.getSkillRecord(skill);
        if (record && record.generation >= MAX_EVOLUTION_DEPTH) {
            return {
                success: false, mode, skill,
                error: `Anti-loop: ${skill} has reached max evolution depth (${MAX_EVOLUTION_DEPTH}). Manual review required.`,
            };
        }
        // Confidence threshold check
        const minConfidence = this.getMinConfidence(mode);
        if (confidence < minConfidence) {
            return {
                success: false, mode, skill,
                error: `Confidence ${(confidence * 100).toFixed(0)}% is below ${mode} threshold of ${(minConfidence * 100).toFixed(0)}%.`,
            };
        }
        switch (mode) {
            case 'FIX':
                return this.executeFix(skill, confidence, sourceAnalysisId);
            case 'DERIVED':
                return this.executeDerived(skill, confidence, sourceAnalysisId);
            case 'CAPTURED':
                return this.executeCaptured(skill, confidence, sourceAnalysisId);
        }
    }
    /**
     * Get evolution history for a skill.
     */
    getHistory(skill, limit = 20) {
        return this.loadHistory(skill, limit);
    }
    /**
     * Get the skill record (lineage tracking).
     */
    getSkillRecord(skill) {
        return this.loadSkillRecord(skill);
    }
    /**
     * List all skill records.
     */
    listSkillRecords(limit = 50) {
        return this.loadAllSkillRecords(limit);
    }
    /**
     * Rollback a skill to its pre-evolution state.
     */
    rollback(skill) {
        const backupPath = this.getLatestBackup(skill);
        if (!backupPath) {
            return { success: false, mode: 'FIX', skill, error: `No backup found for ${skill}.` };
        }
        const skillMdPath = this.getSkillPath(skill);
        if (!skillMdPath) {
            return { success: false, mode: 'FIX', skill, error: `Skill ${skill} not found.` };
        }
        try {
            const backupContent = fs_1.default.readFileSync(backupPath, 'utf-8');
            fs_1.default.writeFileSync(skillMdPath, backupContent, 'utf-8');
            return { success: true, mode: 'FIX', skill, backupPath, patchApplied: 'Rolled back to backup.' };
        }
        catch (err) {
            return { success: false, mode: 'FIX', skill, error: `Rollback failed: ${err}` };
        }
    }
    // ─── Evolution Modes ──────────────────────────────────────────────────────
    /**
     * FIX mode — In-place repair of a degraded skill.
     * Appends learnings from failed executions to the skill's SKILL.md.
     */
    executeFix(skill, confidence, sourceAnalysisId) {
        const skillPath = this.getSkillPath(skill);
        if (!skillPath) {
            return { success: false, mode: 'FIX', skill, error: `Skill ${skill} not found at expected path.` };
        }
        // Read current content
        let content;
        try {
            content = fs_1.default.readFileSync(skillPath, 'utf-8');
        }
        catch (_a) {
            return { success: false, mode: 'FIX', skill, error: `Cannot read ${skillPath}` };
        }
        // Create backup before mutation
        const backupPath = this.createBackup(skill, content);
        // Build the fix patch from execution analysis
        const analyses = this.backend.getExecutionAnalyses(10);
        const relevantAnalysis = sourceAnalysisId
            ? analyses.find(a => a.id === sourceAnalysisId)
            : analyses.find(a => a.recommended_action === 'FIX' && a.skill_judgments.some(j => j.skill === skill));
        if (!relevantAnalysis) {
            return { success: false, mode: 'FIX', skill, backupPath, error: 'No relevant analysis found for fix.' };
        }
        const fixPatch = this.buildFixPatch(skill, relevantAnalysis);
        const beforeHash = this.hashContent(content);
        // Apply the fix (append learnings section) — guarded so a corrupt skill
        // (frontmatter name != folder) is refused rather than silently re-mutated.
        const updatedContent = content + '\n' + fixPatch;
        try {
            (0, skill_integrity_1.safeWriteSkillMd)(skillPath, updatedContent, { expectedName: skill });
        }
        catch (err) {
            if (err instanceof skill_integrity_1.SkillIntegrityError) {
                return { success: false, mode: 'FIX', skill, backupPath, error: err.message };
            }
            throw err;
        }
        const afterHash = this.hashContent(updatedContent);
        // Record evolution
        this.recordEvolution(skill, 'FIX', sourceAnalysisId, beforeHash, afterHash, fixPatch, confidence);
        this.upsertSkillRecord(skill, 'fix');
        return { success: true, mode: 'FIX', skill, backupPath, patchApplied: fixPatch };
    }
    /**
     * DERIVED mode — Create a specialized variant of an existing skill.
     * Copies the skill and adds specialization notes.
     */
    executeDerived(skill, confidence, sourceAnalysisId) {
        var _a;
        const skillPath = this.getSkillPath(skill);
        if (!skillPath) {
            return { success: false, mode: 'DERIVED', skill, error: `Parent skill ${skill} not found.` };
        }
        let content;
        try {
            content = fs_1.default.readFileSync(skillPath, 'utf-8');
        }
        catch (_b) {
            return { success: false, mode: 'DERIVED', skill, error: `Cannot read ${skillPath}` };
        }
        // Generate derived skill name
        const record = this.getSkillRecord(skill);
        const gen = ((_a = record === null || record === void 0 ? void 0 : record.generation) !== null && _a !== void 0 ? _a : 0) + 1;
        const derivedName = `${skill}-v${gen}`;
        const derivedDir = path_1.default.join(this.skillsDir, derivedName);
        if (fs_1.default.existsSync(derivedDir)) {
            return { success: false, mode: 'DERIVED', skill, error: `Derived skill ${derivedName} already exists.` };
        }
        // Get specialization context from analysis
        const analyses = this.backend.getExecutionAnalyses(10);
        const analysis = sourceAnalysisId
            ? analyses.find(a => a.id === sourceAnalysisId)
            : analyses.find(a => a.recommended_action === 'DERIVED');
        const specialization = analysis
            ? `\n\n## Derived Specialization (gen ${gen})\n\n> Auto-derived from ${skill} based on execution analysis.\n> Analysis: ${analysis.summary}\n> Fallback patterns addressed: ${analysis.skill_judgments.filter(j => j.fallback_used).map(j => j.note || j.skill).join(', ') || 'N/A'}\n`
            : `\n\n## Derived Specialization (gen ${gen})\n\n> Auto-derived from ${skill}.\n`;
        // Rewrite frontmatter name to the derived folder name so folder == name
        // (otherwise the derived skill would inherit the parent's name and fail the guard).
        const derivedContent = (0, skill_integrity_1.setFrontmatterName)(content, derivedName) + specialization;
        const beforeHash = this.hashContent(content);
        const afterHash = this.hashContent(derivedContent);
        // Create derived skill directory and file (guarded: name must match folder)
        try {
            (0, skill_integrity_1.safeWriteSkillMd)(path_1.default.join(derivedDir, 'SKILL.md'), derivedContent, { expectedName: derivedName });
        }
        catch (err) {
            if (err instanceof skill_integrity_1.SkillIntegrityError) {
                return { success: false, mode: 'DERIVED', skill, error: err.message };
            }
            throw err;
        }
        // Record evolution
        this.recordEvolution(derivedName, 'DERIVED', sourceAnalysisId, beforeHash, afterHash, `Derived from ${skill} (gen ${gen})`, confidence);
        this.upsertSkillRecord(derivedName, 'derived', skill, gen);
        return { success: true, mode: 'DERIVED', skill: derivedName, patchApplied: `Derived from ${skill}` };
    }
    /**
     * CAPTURED mode — Generate a new skill from successful reasoning patterns.
     * Creates a minimal SKILL.md scaffold capturing the successful approach.
     */
    executeCaptured(skill, confidence, sourceAnalysisId) {
        var _a;
        const analyses = this.backend.getExecutionAnalyses(10);
        const analysis = sourceAnalysisId
            ? analyses.find(a => a.id === sourceAnalysisId)
            : analyses.find(a => a.recommended_action === 'CAPTURED');
        if (!analysis) {
            return { success: false, mode: 'CAPTURED', skill, error: 'No analysis with CAPTURED recommendation found.' };
        }
        const capturedName = `cm-captured-${Date.now()}`;
        const capturedDir = path_1.default.join(this.skillsDir, capturedName);
        const skillContent = [
            '---',
            `name: ${capturedName}`,
            `description: Auto-captured skill from successful task execution`,
            '---',
            '',
            `# ${capturedName}`,
            '',
            `> Auto-captured on ${new Date().toISOString()}`,
            `> Source: ${analysis.task_title}`,
            `> Confidence: ${(confidence * 100).toFixed(0)}%`,
            '',
            '## Context',
            '',
            analysis.summary,
            '',
            '## Approach',
            '',
            `The following skill chain was NOT used but the task completed successfully:`,
            `- Selected skills: ${((_a = analysis.selected_skills) !== null && _a !== void 0 ? _a : []).join(', ') || 'none'}`,
            '',
            '## When to Apply',
            '',
            `Apply this skill when facing tasks similar to: "${analysis.task_title}"`,
            '',
            '## Steps',
            '',
            '1. [TODO: Extract specific steps from the captured pattern]',
            '2. [TODO: Document the reasoning that led to success]',
            '',
        ].join('\n');
        const afterHash = this.hashContent(skillContent);
        try {
            (0, skill_integrity_1.safeWriteSkillMd)(path_1.default.join(capturedDir, 'SKILL.md'), skillContent, { expectedName: capturedName });
        }
        catch (err) {
            if (err instanceof skill_integrity_1.SkillIntegrityError) {
                return { success: false, mode: 'CAPTURED', skill, error: err.message };
            }
            throw err;
        }
        this.recordEvolution(capturedName, 'CAPTURED', sourceAnalysisId, '', afterHash, `Captured from: ${analysis.task_title}`, confidence);
        this.upsertSkillRecord(capturedName, 'captured', undefined, 0);
        return { success: true, mode: 'CAPTURED', skill: capturedName, patchApplied: `Captured from task: ${analysis.task_title}` };
    }
    // ─── Helpers ──────────────────────────────────────────────────────────────
    findSkillsDir() {
        // Check common skill locations
        const candidates = [
            path_1.default.join(this.projectPath, 'skills'),
            path_1.default.join(this.projectPath, '.agent', 'skills'),
        ];
        for (const dir of candidates) {
            if (fs_1.default.existsSync(dir))
                return dir;
        }
        // Default to skills/ (will be created if needed)
        return path_1.default.join(this.projectPath, 'skills');
    }
    getSkillPath(skill) {
        const candidates = [
            path_1.default.join(this.skillsDir, skill, 'SKILL.md'),
            path_1.default.join(this.projectPath, '.agent', 'skills', skill, 'SKILL.md'),
        ];
        for (const p of candidates) {
            if (fs_1.default.existsSync(p))
                return p;
        }
        return null;
    }
    createBackup(skill, content) {
        const backupSkillDir = path_1.default.join(this.backupDir, skill);
        fs_1.default.mkdirSync(backupSkillDir, { recursive: true });
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path_1.default.join(backupSkillDir, `SKILL-${timestamp}.md`);
        fs_1.default.writeFileSync(backupPath, content, 'utf-8');
        return backupPath;
    }
    getLatestBackup(skill) {
        const backupSkillDir = path_1.default.join(this.backupDir, skill);
        if (!fs_1.default.existsSync(backupSkillDir))
            return null;
        const files = fs_1.default.readdirSync(backupSkillDir)
            .filter(f => f.startsWith('SKILL-') && f.endsWith('.md'))
            .sort()
            .reverse();
        return files.length > 0 ? path_1.default.join(backupSkillDir, files[0]) : null;
    }
    buildFixPatch(skill, analysis) {
        const judgment = analysis.skill_judgments.find(j => j.skill === skill);
        const lines = [
            '',
            `## Evolution Fix (${new Date().toISOString().split('T')[0]})`,
            '',
            `> Auto-applied by SkillEvolver based on execution analysis.`,
            `> Analysis: ${analysis.id.slice(0, 8)}`,
            `> Task: ${analysis.task_title}`,
            `> Status: ${analysis.status}`,
        ];
        if (judgment === null || judgment === void 0 ? void 0 : judgment.note) {
            lines.push(`> Note: ${judgment.note}`);
        }
        if (analysis.retro_summary) {
            lines.push('', '### Learnings Applied', '', analysis.retro_summary);
        }
        lines.push('', `### Corrective Action`, '', `- Review and address the failure pattern from: "${analysis.task_title}"`);
        return lines.join('\n');
    }
    hashContent(content) {
        return crypto_1.default.createHash('sha256').update(content).digest('hex').slice(0, 16);
    }
    getMinConfidence(mode) {
        switch (mode) {
            case 'FIX': return MIN_FIX_CONFIDENCE;
            case 'DERIVED': return MIN_DERIVED_CONFIDENCE;
            case 'CAPTURED': return MIN_CAPTURED_CONFIDENCE;
        }
    }
    // ─── Persistence (file-based for simplicity, can migrate to SQLite later) ─
    recordEvolution(skill, mode, sourceAnalysisId, beforeHash, afterHash, patchSummary, confidence) {
        const historyDir = path_1.default.join(this.projectPath, '.cm', 'evolution');
        fs_1.default.mkdirSync(historyDir, { recursive: true });
        const entry = {
            id: crypto_1.default.randomUUID(),
            skill_name: skill,
            mode,
            source_analysis_id: sourceAnalysisId,
            before_hash: beforeHash,
            after_hash: afterHash,
            patch_summary: patchSummary,
            confidence,
            created_at: new Date().toISOString(),
        };
        const historyFile = path_1.default.join(historyDir, 'history.jsonl');
        fs_1.default.appendFileSync(historyFile, JSON.stringify(entry) + '\n');
    }
    loadHistory(skill, limit = 20) {
        const historyFile = path_1.default.join(this.projectPath, '.cm', 'evolution', 'history.jsonl');
        if (!fs_1.default.existsSync(historyFile))
            return [];
        const lines = fs_1.default.readFileSync(historyFile, 'utf-8').trim().split('\n').filter(Boolean);
        let entries = [];
        for (const line of lines) {
            try {
                entries.push(JSON.parse(line));
            }
            catch ( /* skip malformed */_a) { /* skip malformed */ }
        }
        if (skill)
            entries = entries.filter(e => e.skill_name === skill);
        return entries.slice(-limit).reverse();
    }
    upsertSkillRecord(skill, origin, parentSkill, generation) {
        var _a, _b, _c, _d, _e, _f;
        const recordsDir = path_1.default.join(this.projectPath, '.cm', 'evolution');
        fs_1.default.mkdirSync(recordsDir, { recursive: true });
        const recordsFile = path_1.default.join(recordsDir, 'records.json');
        let records = {};
        if (fs_1.default.existsSync(recordsFile)) {
            try {
                records = JSON.parse(fs_1.default.readFileSync(recordsFile, 'utf-8'));
            }
            catch ( /* fresh */_g) { /* fresh */ }
        }
        const existing = records[skill];
        const now = new Date().toISOString();
        records[skill] = {
            id: (_a = existing === null || existing === void 0 ? void 0 : existing.id) !== null && _a !== void 0 ? _a : crypto_1.default.randomUUID(),
            skill_name: skill,
            origin: (_b = existing === null || existing === void 0 ? void 0 : existing.origin) !== null && _b !== void 0 ? _b : origin,
            parent_skill: parentSkill !== null && parentSkill !== void 0 ? parentSkill : existing === null || existing === void 0 ? void 0 : existing.parent_skill,
            generation: generation !== null && generation !== void 0 ? generation : ((_c = existing === null || existing === void 0 ? void 0 : existing.generation) !== null && _c !== void 0 ? _c : 0),
            version: `${((_d = existing === null || existing === void 0 ? void 0 : existing.evolution_count) !== null && _d !== void 0 ? _d : 0) + 1}.0.0`,
            created_at: (_e = existing === null || existing === void 0 ? void 0 : existing.created_at) !== null && _e !== void 0 ? _e : now,
            updated_at: now,
            evolution_count: ((_f = existing === null || existing === void 0 ? void 0 : existing.evolution_count) !== null && _f !== void 0 ? _f : 0) + 1,
            last_evolution_mode: origin.toUpperCase(),
        };
        fs_1.default.writeFileSync(recordsFile, JSON.stringify(records, null, 2));
    }
    loadSkillRecord(skill) {
        var _a;
        const recordsFile = path_1.default.join(this.projectPath, '.cm', 'evolution', 'records.json');
        if (!fs_1.default.existsSync(recordsFile))
            return null;
        try {
            const records = JSON.parse(fs_1.default.readFileSync(recordsFile, 'utf-8'));
            return (_a = records[skill]) !== null && _a !== void 0 ? _a : null;
        }
        catch (_b) {
            return null;
        }
    }
    loadAllSkillRecords(limit) {
        const recordsFile = path_1.default.join(this.projectPath, '.cm', 'evolution', 'records.json');
        if (!fs_1.default.existsSync(recordsFile))
            return [];
        try {
            const records = JSON.parse(fs_1.default.readFileSync(recordsFile, 'utf-8'));
            return Object.values(records).slice(0, limit);
        }
        catch (_a) {
            return [];
        }
    }
}
exports.SkillEvolver = SkillEvolver;
// ─── Display Helpers ─────────────────────────────────────────────────────────
function formatEvolutionResult(result) {
    const icon = result.success ? '✅' : '❌';
    const lines = [
        `${icon} Skill Evolution — ${result.mode}`,
        '─'.repeat(50),
        `Skill:   ${result.skill}`,
        `Result:  ${result.success ? 'Success' : 'Failed'}`,
    ];
    if (result.backupPath)
        lines.push(`Backup:  ${result.backupPath}`);
    if (result.patchApplied)
        lines.push(`Patch:   ${result.patchApplied.split('\n')[0]}...`);
    if (result.error)
        lines.push(`Error:   ${result.error}`);
    return lines.join('\n');
}
function formatEvolutionHistory(history) {
    if (history.length === 0)
        return 'No evolution history recorded.';
    const lines = [
        '🧬 Evolution History',
        '─'.repeat(70),
        `${'Date'.padEnd(12)} ${'Skill'.padEnd(25)} ${'Mode'.padEnd(10)} ${'Conf'.padEnd(6)} Summary`,
        '─'.repeat(70),
    ];
    for (const entry of history) {
        const date = entry.created_at.split('T')[0];
        const conf = (entry.confidence * 100).toFixed(0) + '%';
        const summary = entry.patch_summary.split('\n')[0].slice(0, 30);
        lines.push(`${date.padEnd(12)} ${entry.skill_name.padEnd(25)} ${entry.mode.padEnd(10)} ${conf.padEnd(6)} ${summary}`);
    }
    return lines.join('\n');
}
