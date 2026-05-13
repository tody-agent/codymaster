import { Command } from 'commander';
import { routeTask, formatBrainPlan, estimateSavings } from '../../smart-brain-router';
import { SkillExecutionCache, formatCacheStats } from '../../skill-execution-cache';
import {
  analyzeSkillTokenFootprint,
  formatSkillTokenReport,
} from '../../skill-token-report';
import {
  loadBudget,
  generateBudgetReport,
  getDefaultTierBudgets,
  generateTierReport,
  formatSavingsReport,
  type TokenSavings,
} from '../../token-budget';

// ─── Brain & Token CLI Commands ──────────────────────────────────────────────

export function registerBrainCommands(program: Command) {
  const smart = program
    .command('smart')
    .description('Smart Brain Router — inspect brain layer selection for tasks');

  smart
    .command('plan <task>')
    .description('Preview which brain layers would load for a task description')
    .action((task: string) => {
      const plan = routeTask(task);
      const output = formatBrainPlan(plan);
      console.log(output);
    });

  smart
    .command('tiers')
    .description('Show per-tier token budget allocations')
    .action(() => {
      const tierBudgets = getDefaultTierBudgets();
      console.log(generateTierReport(tierBudgets));
    });

  const token = program
    .command('token')
    .description('Token usage analysis and savings tracking');

  token
    .command('skill <skillName>')
    .description('Show token footprint for a skill SKILL.md and direct references/')
    .option('-p, --project <path>', 'Project path', process.cwd())
    .option('--json', 'Emit stable JSON output', false)
    .option('--baseline <file>', 'Compare against a legacy monolithic file')
    .action((skillName: string, opts: { project: string; json?: boolean; baseline?: string }) => {
      const report = analyzeSkillTokenFootprint(skillName, {
        projectPath: opts.project,
        baselinePath: opts.baseline,
      });
      if (opts.json) {
        console.log(JSON.stringify(report, null, 2));
        return;
      }
      console.log(formatSkillTokenReport(report));
    });

  token
    .command('report')
    .description('Show current token budget allocation')
    .option('-p, --project <path>', 'Project path', process.cwd())
    .action((opts: { project: string }) => {
      const budget = loadBudget(opts.project);
      console.log(generateBudgetReport(budget));
      console.log('');
      const tierBudgets = getDefaultTierBudgets();
      console.log(generateTierReport(tierBudgets));
    });

  token
    .command('savings')
    .description('Show estimated token savings from smart routing and caching')
    .option('-p, --project <path>', 'Project path', process.cwd())
    .action((opts: { project: string }) => {
      const cache = new SkillExecutionCache(opts.project);
      try {
        cache.initialize();
        const stats = cache.getStats();
        console.log(formatCacheStats(stats));
        console.log('');

        // Compute savings summary
        const savings: TokenSavings = {
          brainRoutingSaved: 0,  // Tracked per-session (not persistent yet)
          cacheHitsSaved: stats.estimatedTokensSaved,
          progressiveLoadSaved: 0,
          totalSaved: stats.estimatedTokensSaved,
          sessionTasks: stats.totalHits,
        };
        console.log(formatSavingsReport(savings));
      } finally {
        cache.close();
      }
    });

  token
    .command('cache')
    .description('Show skill execution cache entries')
    .option('-p, --project <path>', 'Project path', process.cwd())
    .option('-n, --limit <n>', 'Max entries to show', '20')
    .action((opts: { project: string; limit: string }) => {
      const cache = new SkillExecutionCache(opts.project);
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
      } finally {
        cache.close();
      }
    });

  token
    .command('cache-clear')
    .description('Clear the skill execution cache')
    .option('-p, --project <path>', 'Project path', process.cwd())
    .action((opts: { project: string }) => {
      const cache = new SkillExecutionCache(opts.project);
      try {
        cache.initialize();
        const cleared = cache.clearCache();
        console.log(`🗑️ Cleared ${cleared} cached entries.`);
      } finally {
        cache.close();
      }
    });
}
