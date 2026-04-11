import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import type { BenchConfig } from '../../codybench/types';
import { tddRegressionSuite }   from '../../codybench/suites/tdd-regression';
import { tokenEfficiencySuite } from '../../codybench/suites/token-efficiency';
import { memoryRetentionSuite } from '../../codybench/suites/memory-retention';
import { runSuite }             from '../../codybench/runners/claude-code';
import { aggregateResults, formatLeaderboard } from '../../codybench/judges/automated';

const SUITES = [tddRegressionSuite, tokenEfficiencySuite, memoryRetentionSuite];

export function registerBenchCommands(program: Command): void {
  program
    .command('bench')
    .description('Run CodyBench evaluation suites (v0.1)')
    .option('--suite <id>', 'Run specific suite (default: all enabled)')
    .option('--runs <n>', 'Override repeat count per suite', parseInt)
    .option('--output <path>', 'Output JSON file path')
    .action(async (opts: { suite?: string; runs?: number; output?: string }) => {
      const projectPath = process.cwd();
      const configPath = path.join(projectPath, 'codybench', 'config.json');

      let config: BenchConfig;
      try {
        config = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as BenchConfig;
      } catch {
        console.error(chalk.red('Error: codybench/config.json not found. Run from project root.'));
        process.exit(1);
      }

      // Override repeat if --runs provided
      if (opts.runs) config.evals = config.evals.map(e => ({ ...e, repeat: opts.runs! }));

      const suitesToRun = opts.suite
        ? SUITES.filter(s => s.id === opts.suite)
        : SUITES.filter(s => config.evals.find(e => e.id === s.id && e.enabled));

      if (suitesToRun.length === 0) {
        console.error(chalk.red(`No suites found${opts.suite ? ` matching "${opts.suite}"` : ''}.`));
        process.exit(1);
      }

      console.log(chalk.bold(`\nCodyBench v${config.version} — running ${suitesToRun.length} suite(s)\n`));

      const allResults = [];
      for (const suite of suitesToRun) {
        process.stdout.write(chalk.dim(`  Running ${suite.name}...`));
        const results = await runSuite(suite, config, projectPath);
        allResults.push(...results);
        console.log(chalk.green(' done'));
      }

      const aggregates = aggregateResults(allResults);
      console.log('\n' + formatLeaderboard(aggregates) + '\n');

      const outputPath = opts.output
        ?? path.join(projectPath, config.output_dir, `results-${Date.now()}.json`);
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, JSON.stringify({ config, results: allResults, aggregates }, null, 2));
      console.log(chalk.dim(`Results saved to: ${outputPath}`));
    });
}
