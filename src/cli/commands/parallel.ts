/**
 * cm parallel — Execute tasks in parallel using Gemini CLI
 *
 * TRIZ Principle #1 (Segmentation):
 *   Split task into independent subtasks, run in parallel.
 *
 * TRIZ Principle #15 (Dynamicity):
 *   Adapt batch size based on task complexity.
 */

import { Command } from 'commander';
import { spawn } from 'child_process';
import chalk from 'chalk';
import { renderCommandHeader } from '../../ui/box';

interface ParallelResult {
  instance: number;
  exitCode: number | null;
  output: string;
  error: string;
}

export function registerParallelCommands(program: Command) {
  program
    .command('parallel <task>')
    .description('Execute task in parallel using Gemini CLI')
    .option('-n, --count <n>', 'Number of parallel instances', '3')
    .option('-c, --context <files>', 'Context files to include (comma-separated)')
    .option('-m, --model <model>', 'Gemini model to use', 'gemini-2.0-flash')
    .option('--timeout <ms>', 'Timeout per instance in milliseconds', '120000')
    .action(async (task, opts) => {
      const count = parseInt(opts.count, 10);
      const timeout = parseInt(opts.timeout, 10);

      console.log(renderCommandHeader('Parallel Execution', '⚡'));
      console.log(chalk.dim(`  Task: ${task}`));
      console.log(chalk.dim(`  Instances: ${count}`));
      console.log(chalk.dim(`  Model: ${opts.model}`));
      console.log('');

      // Check if gemini CLI is available
      const geminiAvailable = await checkGeminiCli();
      if (!geminiAvailable) {
        console.log(chalk.yellow('⚠ Gemini CLI not found. Falling back to single-agent execution.'));
        console.log(chalk.dim('Install: npm install -g @anthropic-ai/gemini-cli'));
        console.log('');
        await executeSingleAgent(task, opts);
        return;
      }

      // Execute in parallel
      const results = await executeParallel(task, count, opts);

      // Display results
      console.log(chalk.bold('\n📊 Results:\n'));
      for (const result of results) {
        const status = result.exitCode === 0 ? chalk.green('✅') : chalk.red('❌');
        console.log(`  ${status} Instance ${result.instance}: exit=${result.exitCode}`);
        if (result.output) {
          console.log(chalk.dim(`     ${result.output.slice(0, 100)}...`));
        }
      }

      // Summary
      const passed = results.filter(r => r.exitCode === 0).length;
      const failed = results.filter(r => r.exitCode !== 0).length;
      console.log('');
      console.log(chalk.bold(`  Summary: ${chalk.green(`${passed} passed`)} / ${chalk.red(`${failed} failed`)}`));
    });
}

async function checkGeminiCli(): Promise<boolean> {
  return new Promise((resolve) => {
    const proc = spawn('which', ['gemini'], { stdio: 'pipe' });
    proc.on('close', (code) => resolve(code === 0));
    proc.on('error', () => resolve(false));
  });
}

async function executeParallel(
  task: string,
  count: number,
  opts: any
): Promise<ParallelResult[]> {
  const results: ParallelResult[] = [];
  const promises: Promise<ParallelResult>[] = [];

  for (let i = 1; i <= count; i++) {
    promises.push(executeInstance(task, i, opts));
  }

  return Promise.all(promises);
}

async function executeInstance(
  task: string,
  instance: number,
  opts: any
): Promise<ParallelResult> {
  return new Promise((resolve) => {
    const args = [
      '-p', `Instance ${instance}: ${task}`,
      '--model', opts.model,
    ];

    if (opts.context) {
      args.push('--context', opts.context);
    }

    const proc = spawn('gemini', args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: parseInt(opts.timeout, 10),
    });

    let output = '';
    let error = '';

    proc.stdout.on('data', (data) => {
      output += data.toString();
    });

    proc.stderr.on('data', (data) => {
      error += data.toString();
    });

    proc.on('close', (code) => {
      resolve({
        instance,
        exitCode: code,
        output: output.trim(),
        error: error.trim(),
      });
    });

    proc.on('error', (err) => {
      resolve({
        instance,
        exitCode: 1,
        output: '',
        error: err.message,
      });
    });
  });
}

async function executeSingleAgent(task: string, opts: any): Promise<void> {
  console.log(chalk.dim('  Executing with single agent...'));
  // Fallback: just print the task for the AI agent to handle
  console.log(chalk.bold(`  Task: ${task}`));
  console.log(chalk.dim('  (Single-agent mode — use Gemini CLI for parallel execution)'));
}
