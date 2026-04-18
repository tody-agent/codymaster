"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LearningPromoter = void 0;
exports.formatPromotionCandidates = formatPromotionCandidates;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const storage_backend_1 = require("./storage-backend");
// ─── Constants ──────────────────────────────────────────────────────────────
const MIN_REINFORCEMENT = 3; // Minimum times a learning must be reinforced
const MIN_PROMOTION_SCORE = 0.50; // Minimum score to qualify for promotion
const PROMOTION_LOG = '.cm/evolution/promotions.jsonl';
// ─── Learning Promoter ──────────────────────────────────────────────────────
// TRIZ #22 "Blessing in Disguise" — failures become reusable knowledge
/**
 * LearningPromoter — Promotes mature learnings into reusable skills.
 *
 * When a learning has been reinforced enough times (appearing in multiple
 * execution analyses or being manually confirmed), it graduates from
 * ephemeral memory into a permanent skill entry.
 *
 * Flow:
 *   1. Scan learnings in SQLite for candidates with high reinforcement
 *   2. Score each candidate based on: reinforcement count, recency, category
 *   3. Generate a minimal SKILL.md from the learning content
 *   4. Save to skills/ directory
 */
class LearningPromoter {
    constructor(projectPath, backend) {
        this.projectPath = projectPath;
        this.backend = backend !== null && backend !== void 0 ? backend : (0, storage_backend_1.getBackend)(projectPath);
        this.backend.initialize();
        this.skillsDir = this.findSkillsDir();
    }
    /**
     * Find learnings that qualify for promotion.
     */
    findCandidates(limit = 10) {
        var _a;
        // Query all learnings and count reinforcement (same what_failed pattern)
        const allLearnings = this.backend.queryLearnings('', undefined, 200);
        const patternCounts = new Map();
        for (const learning of allLearnings) {
            const pattern = this.normalizePattern(learning.what_failed);
            const existing = (_a = patternCounts.get(pattern)) !== null && _a !== void 0 ? _a : { count: 0, learnings: [] };
            existing.count++;
            existing.learnings.push(learning);
            patternCounts.set(pattern, existing);
        }
        const candidates = [];
        for (const [_pattern, { count, learnings }] of patternCounts) {
            if (count < MIN_REINFORCEMENT)
                continue;
            // Use the most recent learning as the representative
            const representative = learnings.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
            const score = this.calculateScore(count, representative);
            if (score >= MIN_PROMOTION_SCORE) {
                candidates.push({
                    learning: representative,
                    reinforcementCount: count,
                    score,
                    reason: `Reinforced ${count}x, score ${(score * 100).toFixed(0)}%`,
                });
            }
        }
        return candidates
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }
    /**
     * Promote a specific learning to a skill.
     */
    promote(learningId) {
        const learning = this.backend.getLearningById(learningId);
        if (!learning) {
            return {
                promoted: false,
                skillName: '',
                skillPath: '',
                learningId,
                reason: `Learning ${learningId} not found.`,
            };
        }
        // Generate skill name from the learning content
        const skillName = this.generateSkillName(learning);
        const skillDir = path_1.default.join(this.skillsDir, skillName);
        if (fs_1.default.existsSync(skillDir)) {
            return {
                promoted: false,
                skillName,
                skillPath: skillDir,
                learningId,
                reason: `Skill ${skillName} already exists.`,
            };
        }
        // Generate the SKILL.md content
        const skillContent = this.generateSkillContent(learning, skillName);
        // Create the skill
        fs_1.default.mkdirSync(skillDir, { recursive: true });
        const skillPath = path_1.default.join(skillDir, 'SKILL.md');
        fs_1.default.writeFileSync(skillPath, skillContent, 'utf-8');
        // Log the promotion
        this.logPromotion(learningId, skillName, skillPath);
        return {
            promoted: true,
            skillName,
            skillPath,
            learningId,
            reason: `Learning promoted to skill: ${skillName}`,
        };
    }
    /**
     * Auto-promote: find candidates and promote the top one.
     */
    autoPromote() {
        const candidates = this.findCandidates(1);
        if (candidates.length === 0)
            return null;
        return this.promote(candidates[0].learning.id);
    }
    /**
     * Get promotion history.
     */
    getPromotionHistory(limit = 20) {
        const logPath = path_1.default.join(this.projectPath, PROMOTION_LOG);
        if (!fs_1.default.existsSync(logPath))
            return [];
        const lines = fs_1.default.readFileSync(logPath, 'utf-8').trim().split('\n').filter(Boolean);
        const entries = [];
        for (const line of lines) {
            try {
                entries.push(JSON.parse(line));
            }
            catch ( /* skip */_a) { /* skip */ }
        }
        return entries.slice(-limit).reverse();
    }
    // ─── Private Helpers ────────────────────────────────────────────────────
    findSkillsDir() {
        const candidates = [
            path_1.default.join(this.projectPath, 'skills'),
            path_1.default.join(this.projectPath, '.agent', 'skills'),
        ];
        for (const dir of candidates) {
            if (fs_1.default.existsSync(dir))
                return dir;
        }
        return path_1.default.join(this.projectPath, 'skills');
    }
    normalizePattern(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .split(' ')
            .sort()
            .join(' ');
    }
    calculateScore(reinforcementCount, learning) {
        // Reinforcement factor (0-0.5): more reinforcement = higher score
        const reinforcementFactor = Math.min(0.5, reinforcementCount / 10);
        // Recency factor (0-0.3): newer learnings score higher
        const daysSince = (Date.now() - new Date(learning.created_at).getTime()) / (1000 * 60 * 60 * 24);
        const recencyFactor = Math.max(0, 0.3 - (daysSince / 365) * 0.3);
        // Content quality factor (0-0.2): longer, more detailed = better
        const contentLength = (learning.what_failed.length + learning.how_to_prevent.length);
        const qualityFactor = Math.min(0.2, contentLength / 500 * 0.2);
        return reinforcementFactor + recencyFactor + qualityFactor;
    }
    generateSkillName(learning) {
        const words = learning.what_failed
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 3)
            .slice(0, 3);
        const base = words.length > 0 ? words.join('-') : 'promoted';
        return `cm-learned-${base}`;
    }
    generateSkillContent(learning, skillName) {
        return [
            '---',
            `name: ${skillName}`,
            `description: Auto-promoted from reinforced learning`,
            '---',
            '',
            `# ${skillName}`,
            '',
            `> 🎓 Auto-promoted from learning on ${new Date().toISOString().split('T')[0]}`,
            `> Original module: ${learning.module}`,
            `> Agent: ${learning.agent}`,
            '',
            '## Problem Pattern',
            '',
            learning.what_failed,
            '',
            '## Root Cause',
            '',
            learning.why_failed,
            '',
            '## Prevention / Solution',
            '',
            learning.how_to_prevent,
            '',
            '## When to Apply',
            '',
            `Apply this skill when encountering patterns similar to: "${learning.what_failed.slice(0, 100)}"`,
            '',
            '## Steps',
            '',
            `1. Recognize the problem pattern described above`,
            `2. Apply the prevention strategy: ${learning.how_to_prevent.slice(0, 100)}`,
            `3. Verify the fix resolves the root cause`,
            '',
        ].join('\n');
    }
    logPromotion(learningId, skillName, skillPath) {
        const logPath = path_1.default.join(this.projectPath, PROMOTION_LOG);
        const dir = path_1.default.dirname(logPath);
        if (!fs_1.default.existsSync(dir))
            fs_1.default.mkdirSync(dir, { recursive: true });
        const entry = { learningId, skillName, skillPath, promotedAt: new Date().toISOString() };
        fs_1.default.appendFileSync(logPath, JSON.stringify(entry) + '\n');
    }
}
exports.LearningPromoter = LearningPromoter;
// ─── Display Helpers ─────────────────────────────────────────────────────────
function formatPromotionCandidates(candidates) {
    if (candidates.length === 0)
        return 'No learnings qualify for promotion yet. Need ≥3 reinforcements.';
    const lines = [
        '🎓 Learning → Skill Promotion Candidates',
        '─'.repeat(70),
        `${'Score'.padEnd(8)} ${'Reinf'.padEnd(8)} Pattern`,
        '─'.repeat(70),
    ];
    for (const c of candidates) {
        const score = (c.score * 100).toFixed(0) + '%';
        const pattern = c.learning.what_failed.slice(0, 50);
        lines.push(`${score.padEnd(8)} ${(c.reinforcementCount + 'x').padEnd(8)} ${pattern}`);
    }
    return lines.join('\n');
}
