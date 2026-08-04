import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import type { BenchConfig } from '../../codybench/types';
import { createDefaultBenchConfig } from '../../codybench/config';
import { tddRegressionSuite }   from '../../codybench/suites/tdd-regression';
import { tokenEfficiencySuite } from '../../codybench/suites/token-efficiency';
import { memoryRetentionSuite } from '../../codybench/suites/memory-retention';
import { workflowIntegrationSuite } from '../../codybench/suites/workflow-integration';
import { runSuite }             from '../../codybench/runners/claude-code';
import { aggregateResults, formatLeaderboard } from '../../codybench/judges/automated';

const SUITES = [
  tddRegressionSuite,
  tokenEfficiencySuite,
  memoryRetentionSuite,
  workflowIntegrationSuite,
];

function loadConfig(outputRoot: string): BenchConfig {
  const configPath = path.join(outputRoot, 'codybench', 'config.json');
  if (!fs.existsSync(configPath)) return createDefaultBenchConfig();
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8')) as BenchConfig;
  } catch {
    throw new Error(`Invalid CodyBench config: ${configPath}`);
  }
}

export function registerBenchCommands(program: Command): void {
  program
    .command('bench')
    .description('Run CodyBench evaluation suites')
    .option('--suite <id>', 'Run specific suite (default: all enabled)')
    .option('--runs <n>', 'Override repeat count per suite', parseInt)
    .option('--output <path>', 'Output JSON file path')
    .action(async (opts: { suite?: string; runs?: number; output?: string }) => {
      const outputRoot = process.cwd();
      const artifactRoot = path.resolve(__dirname, '../../..');
      let config: BenchConfig;
      try {
        config = loadConfig(outputRoot);
      } catch (error) {
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
        return;
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
        const results = await runSuite(suite, config, artifactRoot);
        allResults.push(...results);
        console.log(chalk.green(' done'));
      }

      const aggregates = aggregateResults(allResults);
      console.log('\n' + formatLeaderboard(aggregates) + '\n');

      const outputPath = opts.output
        ? path.resolve(outputRoot, opts.output)
        : path.join(outputRoot, config.output_dir, `results-${Date.now()}.json`);
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, JSON.stringify({ config, results: allResults, aggregates }, null, 2));
      console.log(chalk.dim(`Results saved to: ${outputPath}`));
    });
}
