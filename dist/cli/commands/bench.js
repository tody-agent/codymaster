"use strict";
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
exports.registerBenchCommands = registerBenchCommands;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const tdd_regression_1 = require("../../codybench/suites/tdd-regression");
const token_efficiency_1 = require("../../codybench/suites/token-efficiency");
const memory_retention_1 = require("../../codybench/suites/memory-retention");
const workflow_integration_1 = require("../../codybench/suites/workflow-integration");
const claude_code_1 = require("../../codybench/runners/claude-code");
const automated_1 = require("../../codybench/judges/automated");
const SUITES = [
    tdd_regression_1.tddRegressionSuite,
    token_efficiency_1.tokenEfficiencySuite,
    memory_retention_1.memoryRetentionSuite,
    workflow_integration_1.workflowIntegrationSuite,
];
function registerBenchCommands(program) {
    program
        .command('bench')
        .description('Run CodyBench evaluation suites')
        .option('--suite <id>', 'Run specific suite (default: all enabled)')
        .option('--runs <n>', 'Override repeat count per suite', parseInt)
        .option('--output <path>', 'Output JSON file path')
        .action((opts) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        const projectPath = process.cwd();
        const configPath = path_1.default.join(projectPath, 'codybench', 'config.json');
        let config;
        try {
            config = JSON.parse(fs_1.default.readFileSync(configPath, 'utf-8'));
        }
        catch (_b) {
            console.error(chalk_1.default.red('Error: codybench/config.json not found. Run from project root.'));
            process.exit(1);
        }
        // Override repeat if --runs provided
        if (opts.runs)
            config.evals = config.evals.map(e => (Object.assign(Object.assign({}, e), { repeat: opts.runs })));
        const suitesToRun = opts.suite
            ? SUITES.filter(s => s.id === opts.suite)
            : SUITES.filter(s => config.evals.find(e => e.id === s.id && e.enabled));
        if (suitesToRun.length === 0) {
            console.error(chalk_1.default.red(`No suites found${opts.suite ? ` matching "${opts.suite}"` : ''}.`));
            process.exit(1);
        }
        console.log(chalk_1.default.bold(`\nCodyBench v${config.version} — running ${suitesToRun.length} suite(s)\n`));
        const allResults = [];
        for (const suite of suitesToRun) {
            process.stdout.write(chalk_1.default.dim(`  Running ${suite.name}...`));
            const results = yield (0, claude_code_1.runSuite)(suite, config, projectPath);
            allResults.push(...results);
            console.log(chalk_1.default.green(' done'));
        }
        const aggregates = (0, automated_1.aggregateResults)(allResults);
        console.log('\n' + (0, automated_1.formatLeaderboard)(aggregates) + '\n');
        const outputPath = (_a = opts.output) !== null && _a !== void 0 ? _a : path_1.default.join(projectPath, config.output_dir, `results-${Date.now()}.json`);
        fs_1.default.mkdirSync(path_1.default.dirname(outputPath), { recursive: true });
        fs_1.default.writeFileSync(outputPath, JSON.stringify({ config, results: allResults, aggregates }, null, 2));
        console.log(chalk_1.default.dim(`Results saved to: ${outputPath}`));
    }));
}
