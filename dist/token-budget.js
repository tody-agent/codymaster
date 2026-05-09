"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultBudget = getDefaultBudget;
exports.loadBudget = loadBudget;
exports.checkBudget = checkBudget;
exports.estimateTokens = estimateTokens;
exports.generateBudgetReport = generateBudgetReport;
exports.getDefaultTierBudgets = getDefaultTierBudgets;
exports.checkTierBudget = checkTierBudget;
exports.generateTierReport = generateTierReport;
exports.formatSavingsReport = formatSavingsReport;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// ─── Constants ──────────────────────────────────────────────────────────────
const CM_DIR = '.cm';
const BUDGET_FILE = 'token-budget.json';
// ─── Default Budget ─────────────────────────────────────────────────────────
function getDefaultBudget() {
    return {
        model_context_window: 200000,
        allocations: {
            system_prompt: 5000, // 2.5%
            skill_index_L0: 2500, // 1.25%
            skill_active_full: 5000, // 2.5%
            memory_working: 500, // 0.25%
            memory_learnings: 650, // 0.325%
            codebase_skeleton: 1500, // 0.75%
            context_retrieval: 10000, // 5%
            conversation_history: 30000, // 15%
            generation_budget: 144850, // 72.425%
        },
        enforcement: 'soft',
    };
}
// ─── Load Budget ────────────────────────────────────────────────────────────
function loadBudget(projectPath) {
    const budgetPath = path_1.default.join(projectPath, CM_DIR, BUDGET_FILE);
    if (!fs_1.default.existsSync(budgetPath)) {
        return getDefaultBudget();
    }
    try {
        const raw = fs_1.default.readFileSync(budgetPath, 'utf-8');
        return JSON.parse(raw);
    }
    catch (_a) {
        return getDefaultBudget();
    }
}
// ─── Check Budget ────────────────────────────────────────────────────────────
function checkBudget(budget, category, tokenCount) {
    const allocs = budget.allocations;
    const allocated = allocs[category];
    if (allocated === undefined) {
        return {
            allowed: false,
            remaining: 0,
            suggestion: `Unknown category "${category}". Valid: ${Object.keys(allocs).join(', ')}`,
        };
    }
    const remaining = allocated - tokenCount;
    const overBudget = remaining < 0;
    if (!overBudget) {
        return { allowed: true, remaining };
    }
    const suggestion = buildSuggestion(category, tokenCount, allocated);
    if (budget.enforcement === 'hard') {
        return { allowed: false, remaining, suggestion };
    }
    // Soft mode: allow but warn
    return { allowed: true, remaining, suggestion };
}
function buildSuggestion(category, used, allocated) {
    const over = used - allocated;
    if (category === 'memory_learnings') {
        return `memory_learnings over by ~${over} tokens. Switch to L0 index (cm://memory/learnings/L0) to reduce to ~100 tokens.`;
    }
    if (category === 'codebase_skeleton') {
        return `codebase_skeleton over by ~${over} tokens. Use cm://resources/skeleton/L0 for module-level index (~500 tokens).`;
    }
    if (category === 'memory_working') {
        return `memory_working over by ~${over} tokens. Read CONTINUITY abstract only (first 3 lines).`;
    }
    return `${category} over budget by ~${over} tokens. Consider using L0 index instead of full content.`;
}
// ─── Estimate Tokens ─────────────────────────────────────────────────────────
function estimateTokens(text) {
    if (!text)
        return 0;
    return Math.ceil(text.length / 4);
}
// ─── Budget Report ────────────────────────────────────────────────────────────
function generateBudgetReport(budget) {
    const total = budget.model_context_window;
    const lines = [
        `Token Budget Report (${total.toLocaleString()} context window, enforcement: ${budget.enforcement})`,
        '─'.repeat(70),
        `${'Category'.padEnd(25)} ${'Allocated'.padStart(10)} ${'% of CTX'.padStart(10)}`,
        '─'.repeat(70),
    ];
    const allocs = budget.allocations;
    for (const [cat, allocated] of Object.entries(allocs)) {
        const pct = ((allocated / total) * 100).toFixed(2);
        lines.push(`${cat.padEnd(25)} ${allocated.toLocaleString().padStart(10)} ${(pct + '%').padStart(10)}`);
    }
    const sum = Object.values(allocs).reduce((a, b) => a + b, 0);
    lines.push('─'.repeat(70));
    lines.push(`${'TOTAL'.padEnd(25)} ${sum.toLocaleString().padStart(10)} ${(((sum / total) * 100).toFixed(2) + '%').padStart(10)}`);
    return lines.join('\n');
}
// ─── Per-Tier Budgets (Smart Brain Router integration) ───────────────────────
/**
 * Default per-tier token budgets for the 5-Tier Brain architecture.
 * Used by SmartBrainRouter to enforce tier-level spending limits.
 */
function getDefaultTierBudgets() {
    return [
        { tier: 1, label: 'Sensory', soft: 0, hard: 0 }, // Always on, zero cost
        { tier: 2, label: 'Working', soft: 500, hard: 1000 }, // CONTINUITY.md
        { tier: 3, label: 'Long-term', soft: 500, hard: 3000 }, // Learnings/decisions
        { tier: 4, label: 'Semantic', soft: 0, hard: 2000 }, // qmd vector search
        { tier: 5, label: 'Structural', soft: 0, hard: 4000 }, // CodeGraph AST
    ];
}
/**
 * Check if a tier's token usage is within budget.
 */
function checkTierBudget(tierBudgets, tier, tokenCount, enforcement = 'soft') {
    const budget = tierBudgets.find(tb => tb.tier === tier);
    if (!budget) {
        return { allowed: false, remaining: 0, suggestion: `Unknown tier ${tier}` };
    }
    const limit = enforcement === 'hard' ? budget.hard : budget.soft;
    if (limit === 0) {
        // Tier is disabled by default (soft=0), but allowed up to hard limit
        if (tokenCount <= budget.hard) {
            return { allowed: true, remaining: budget.hard - tokenCount };
        }
        return {
            allowed: false,
            remaining: budget.hard - tokenCount,
            suggestion: `Tier ${tier} (${budget.label}) exceeds hard limit of ${budget.hard} tokens.`,
        };
    }
    const remaining = limit - tokenCount;
    if (remaining >= 0) {
        return { allowed: true, remaining };
    }
    return {
        allowed: enforcement !== 'hard',
        remaining,
        suggestion: `Tier ${tier} (${budget.label}) over by ~${Math.abs(remaining)} tokens. Consider L0 loading.`,
    };
}
/**
 * Generate a tier-level budget report.
 */
function generateTierReport(tierBudgets) {
    const lines = [
        `Brain Tier Budget Report`,
        '─'.repeat(60),
        `${'Tier'.padEnd(6)} ${'Label'.padEnd(12)} ${'Soft'.padStart(8)} ${'Hard'.padStart(8)} ${'Status'.padStart(10)}`,
        '─'.repeat(60),
    ];
    for (const tb of tierBudgets) {
        const status = tb.soft === 0 ? 'off/demand' : 'active';
        lines.push(`${String(tb.tier).padEnd(6)} ${tb.label.padEnd(12)} ${tb.soft.toLocaleString().padStart(8)} ${tb.hard.toLocaleString().padStart(8)} ${status.padStart(10)}`);
    }
    const totalSoft = tierBudgets.reduce((s, tb) => s + tb.soft, 0);
    const totalHard = tierBudgets.reduce((s, tb) => s + tb.hard, 0);
    lines.push('─'.repeat(60));
    lines.push(`${'TOTAL'.padEnd(18)} ${totalSoft.toLocaleString().padStart(8)} ${totalHard.toLocaleString().padStart(8)}`);
    return lines.join('\n');
}
/**
 * Format token savings report for CLI display.
 */
function formatSavingsReport(savings) {
    const lines = [
        `💰 Token Savings Report`,
        '─'.repeat(50),
        `Brain routing:       ~${savings.brainRoutingSaved.toLocaleString()} tokens saved`,
        `Cache hits:          ~${savings.cacheHitsSaved.toLocaleString()} tokens saved`,
        `Progressive loading: ~${savings.progressiveLoadSaved.toLocaleString()} tokens saved`,
        '─'.repeat(50),
        `Total saved:         ~${savings.totalSaved.toLocaleString()} tokens`,
        `Tasks this session:  ${savings.sessionTasks}`,
    ];
    if (savings.sessionTasks > 0) {
        const avgSaved = Math.round(savings.totalSaved / savings.sessionTasks);
        lines.push(`Avg saved per task:  ~${avgSaved.toLocaleString()} tokens`);
    }
    return lines.join('\n');
}
