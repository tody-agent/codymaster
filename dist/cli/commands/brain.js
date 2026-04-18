"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerBrainCommands = registerBrainCommands;
const smart_brain_router_1 = require("../../smart-brain-router");
const skill_execution_cache_1 = require("../../skill-execution-cache");
const token_budget_1 = require("../../token-budget");
// ─── Brain & Token CLI Commands ──────────────────────────────────────────────
function registerBrainCommands(program) {
    const smart = program
        .command('smart')
        .description('Smart Brain Router — inspect brain layer selection for tasks');
    smart
        .command('plan <task>')
        .description('Preview which brain layers would load for a task description')
        .action((task) => {
        const plan = (0, smart_brain_router_1.routeTask)(task);
        const output = (0, smart_brain_router_1.formatBrainPlan)(plan);
        console.log(output);
    });
    smart
        .command('tiers')
        .description('Show per-tier token budget allocations')
        .action(() => {
        const tierBudgets = (0, token_budget_1.getDefaultTierBudgets)();
        console.log((0, token_budget_1.generateTierReport)(tierBudgets));
    });
    const token = program
        .command('token')
        .description('Token usage analysis and savings tracking');
    token
        .command('report')
        .description('Show current token budget allocation')
        .option('-p, --project <path>', 'Project path', process.cwd())
        .action((opts) => {
        const budget = (0, token_budget_1.loadBudget)(opts.project);
        console.log((0, token_budget_1.generateBudgetReport)(budget));
        console.log('');
        const tierBudgets = (0, token_budget_1.getDefaultTierBudgets)();
        console.log((0, token_budget_1.generateTierReport)(tierBudgets));
    });
    token
        .command('savings')
        .description('Show estimated token savings from smart routing and caching')
        .option('-p, --project <path>', 'Project path', process.cwd())
        .action((opts) => {
        const cache = new skill_execution_cache_1.SkillExecutionCache(opts.project);
        try {
            cache.initialize();
            const stats = cache.getStats();
            console.log((0, skill_execution_cache_1.formatCacheStats)(stats));
            console.log('');
            // Compute savings summary
            const savings = {
                brainRoutingSaved: 0, // Tracked per-session (not persistent yet)
                cacheHitsSaved: stats.estimatedTokensSaved,
                progressiveLoadSaved: 0,
                totalSaved: stats.estimatedTokensSaved,
                sessionTasks: stats.totalHits,
            };
            console.log((0, token_budget_1.formatSavingsReport)(savings));
        }
        finally {
            cache.close();
        }
    });
    token
        .command('cache')
        .description('Show skill execution cache entries')
        .option('-p, --project <path>', 'Project path', process.cwd())
        .option('-n, --limit <n>', 'Max entries to show', '20')
        .action((opts) => {
        const cache = new skill_execution_cache_1.SkillExecutionCache(opts.project);
        try {
            cache.initialize();
            const entries = cache.listCachedChains(parseInt(opts.limit));
            if (entries.length === 0) {
                console.log('📦 No cached skill chains yet. Complete some tasks to build the cache.');
                return;
            }
            console.log(`📦 Skill Execution Cache (${entries.length} entries)`);
            console.log('─'.repeat(70));
            for (const entry of entries) {
                const skills = entry.skillChain.join(' → ');
                const eff = (entry.effectiveness * 100).toFixed(0);
                console.log(`  ${entry.taskPattern.slice(0, 45).padEnd(45)} │ ${skills}`);
                console.log(`  ${''.padEnd(45)} │ ${eff}% eff · ${entry.hitCount} hits · ${entry.tokenUsed} tok`);
            }
        }
        finally {
            cache.close();
        }
    });
    token
        .command('cache-clear')
        .description('Clear the skill execution cache')
        .option('-p, --project <path>', 'Project path', process.cwd())
        .action((opts) => {
        const cache = new skill_execution_cache_1.SkillExecutionCache(opts.project);
        try {
            cache.initialize();
            const cleared = cache.clearCache();
            console.log(`🗑️ Cleared ${cleared} cached entries.`);
        }
        finally {
            cache.close();
        }
    });
}
