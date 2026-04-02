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
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAgentCommands = registerAgentCommands;
const continuity_1 = require("../../continuity");
const box_1 = require("../../ui/box");
const theme_1 = require("../../ui/theme");
const cli_utils_1 = require("../../utils/cli-utils");
function registerAgentCommands(program) {
    program
        .command('agent [cmd] [args...]')
        .alias('a')
        .description('Agent management (status|memory|brain|learn)')
        .action((cmd, args) => {
        switch (cmd) {
            case 'status':
            case 'st':
                agentStatus();
                break;
            case 'memory':
            case 'mem':
                agentMemory();
                break;
            case 'brain':
            case 'br':
                agentBrain();
                break;
            case 'learn':
                agentLearn(args.join(' '));
                break;
            default: agentStatus();
        }
    });
    program
        .command('brain')
        .alias('br')
        .description('Show AI brain/working memory')
        .action(() => agentBrain());
}
function agentStatus() {
    const summary = (0, continuity_1.getContinuityStatus)(process.cwd());
    if (!summary.initialized) {
        console.log((0, box_1.renderResult)('warning', 'No active CodyMaster brain initialized in this directory.', [
            (0, theme_1.dim)('Run `cm init` to start.')
        ]));
        return;
    }
    console.log((0, box_1.renderCommandHeader)('Agent Status: Hamster v4.6', '🐹'));
    console.log((0, theme_1.brand)('  🧠 Memory Index:'));
    console.log((0, theme_1.dim)(`    Iterations: ${summary.iteration}`));
    console.log((0, theme_1.dim)(`    Current Goal: ${summary.activeGoal}`));
    console.log((0, theme_1.dim)(`    Current Phase: ${summary.phase}`));
    console.log((0, theme_1.dim)(`    Tasks Completed: ${summary.completedCount}`));
    console.log((0, theme_1.dim)(`    Active Blockers: ${summary.blockerCount}`));
    console.log(`\n  ${(0, theme_1.brand)('📊 Activity Summary:')}`);
    console.log((0, theme_1.dim)(`    Learnings: ${summary.learningCount}`));
    console.log((0, theme_1.dim)(`    Decisions: ${summary.decisionCount}`));
    console.log();
}
function agentMemory() {
    const learnings = (0, continuity_1.getLearnings)(process.cwd()).slice(0, 5);
    if (learnings.length === 0) {
        console.log((0, box_1.renderResult)('info', 'No memories stored yet.'));
        return;
    }
    console.log((0, box_1.renderCommandHeader)('Agent Memory (Latest)', '🧠'));
    learnings.forEach((l) => {
        console.log(`  ${(0, theme_1.success)('●')} ${(0, theme_1.brand)(l.whatFailed)}`);
        console.log((0, theme_1.dim)(`    ${l.howToPrevent} (${(0, cli_utils_1.formatTimeAgoCli)(l.timestamp)})`));
    });
    console.log();
}
function agentBrain() {
    const state = (0, continuity_1.readContinuityState)(process.cwd());
    if (!state) {
        console.log((0, box_1.renderResult)('warning', 'Brain not initialized.'));
        return;
    }
    console.log((0, box_1.renderCommandHeader)(`Agent Brain: ${state.project}`, '🧠'));
    console.log((0, theme_1.brand)(`  Goal: ${state.activeGoal}`));
    console.log((0, theme_1.dim)(`  Phase: ${state.currentPhase} (Iter ${state.currentIteration})`));
    console.log(`\n  ${(0, theme_1.brand)('Next Actions:')}`);
    state.nextActions.slice(0, 5).forEach((act, idx) => {
        console.log(`    ${idx + 1}. ${act}`);
    });
    if (state.activeBlockers.length > 0) {
        console.log(`\n  ${(0, theme_1.warning)('Blockers:')}`);
        state.activeBlockers.forEach((b) => console.log(`    ⚠️ ${b}`));
    }
    console.log();
}
function agentLearn(content) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (!content) {
            console.log((0, box_1.renderResult)('error', 'Please provide a learning to record.'));
            return;
        }
        const state = (0, continuity_1.readContinuityState)(process.cwd());
        const learning = {
            whatFailed: content,
            whyFailed: 'Manual entry',
            howToPrevent: 'Recorded via CLI',
            timestamp: new Date().toISOString(),
            agent: 'CLI User',
            taskId: ((_a = state === null || state === void 0 ? void 0 : state.currentTask) === null || _a === void 0 ? void 0 : _a.id) || 'manual',
            module: 'system'
        };
        (0, continuity_1.addLearning)(process.cwd(), learning);
        console.log((0, box_1.renderResult)('success', 'Learning recorded in brain.'));
    });
}
