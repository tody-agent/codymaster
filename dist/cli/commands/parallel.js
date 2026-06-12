"use strict";
/**
 * cm parallel — Execute tasks in parallel using Gemini CLI
 *
 * TRIZ Principle #1 (Segmentation):
 *   Split task into independent subtasks, run in parallel.
 *
 * TRIZ Principle #15 (Dynamicity):
 *   Adapt batch size based on task complexity.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerParallelCommands = registerParallelCommands;
const child_process_1 = require("child_process");
const chalk_1 = __importDefault(require("chalk"));
const box_1 = require("../../ui/box");
function registerParallelCommands(program) {
    program
        .command('parallel <task>')
        .description('Execute task in parallel using Gemini CLI')
        .option('-n, --count <n>', 'Number of parallel instances', '3')
        .option('-c, --context <files>', 'Context files to include (comma-separated)')
        .option('-m, --model <model>', 'Gemini model to use', 'gemini-2.0-flash')
        .option('--timeout <ms>', 'Timeout per instance in milliseconds', '120000')
        .action((task, opts) => __awaiter(this, void 0, void 0, function* () {
        const count = parseInt(opts.count, 10);
        const timeout = parseInt(opts.timeout, 10);
        console.log((0, box_1.renderCommandHeader)('Parallel Execution', '⚡'));
        console.log(chalk_1.default.dim(`  Task: ${task}`));
        console.log(chalk_1.default.dim(`  Instances: ${count}`));
        console.log(chalk_1.default.dim(`  Model: ${opts.model}`));
        console.log('');
        // Check if gemini CLI is available
        const geminiAvailable = yield checkGeminiCli();
        if (!geminiAvailable) {
            console.log(chalk_1.default.yellow('⚠ Gemini CLI not found. Falling back to single-agent execution.'));
            console.log(chalk_1.default.dim('Install: npm install -g @anthropic-ai/gemini-cli'));
            console.log('');
            yield executeSingleAgent(task, opts);
            return;
        }
        // Execute in parallel
        const results = yield executeParallel(task, count, opts);
        // Display results
        console.log(chalk_1.default.bold('\n📊 Results:\n'));
        for (const result of results) {
            const status = result.exitCode === 0 ? chalk_1.default.green('✅') : chalk_1.default.red('❌');
            console.log(`  ${status} Instance ${result.instance}: exit=${result.exitCode}`);
            if (result.output) {
                console.log(chalk_1.default.dim(`     ${result.output.slice(0, 100)}...`));
            }
        }
        // Summary
        const passed = results.filter(r => r.exitCode === 0).length;
        const failed = results.filter(r => r.exitCode !== 0).length;
        console.log('');
        console.log(chalk_1.default.bold(`  Summary: ${chalk_1.default.green(`${passed} passed`)} / ${chalk_1.default.red(`${failed} failed`)}`));
    }));
}
function checkGeminiCli() {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => {
            const proc = (0, child_process_1.spawn)('which', ['gemini'], { stdio: 'pipe' });
            proc.on('close', (code) => resolve(code === 0));
            proc.on('error', () => resolve(false));
        });
    });
}
function executeParallel(task, count, opts) {
    return __awaiter(this, void 0, void 0, function* () {
        const results = [];
        const promises = [];
        for (let i = 1; i <= count; i++) {
            promises.push(executeInstance(task, i, opts));
        }
        return Promise.all(promises);
    });
}
function executeInstance(task, instance, opts) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => {
            const args = [
                '-p', `Instance ${instance}: ${task}`,
                '--model', opts.model,
            ];
            if (opts.context) {
                args.push('--context', opts.context);
            }
            const proc = (0, child_process_1.spawn)('gemini', args, {
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
    });
}
function executeSingleAgent(task, opts) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(chalk_1.default.dim('  Executing with single agent...'));
        // Fallback: just print the task for the AI agent to handle
        console.log(chalk_1.default.bold(`  Task: ${task}`));
        console.log(chalk_1.default.dim('  (Single-agent mode — use Gemini CLI for parallel execution)'));
    });
}
