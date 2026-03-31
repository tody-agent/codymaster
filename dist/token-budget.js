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
