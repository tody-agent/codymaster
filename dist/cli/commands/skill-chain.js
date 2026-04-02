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
exports.registerSkillChainCommands = registerSkillChainCommands;
const data_1 = require("../../data");
const skill_chain_1 = require("../../skill-chain");
const box_1 = require("../../ui/box");
const theme_1 = require("../../ui/theme");
const cli_utils_1 = require("../../utils/cli-utils");
const agent_dispatch_1 = require("../../agent-dispatch");
const crypto_1 = __importDefault(require("crypto"));
function registerSkillChainCommands(program) {
    program
        .command('chain <cmd> [args...]')
        .alias('ch')
        .description('Skill Chain management (list|info|auto|run|status|advance|skip|abort|history)')
        .option('-p, --project <name>', 'Project name or ID')
        .option('--agent <agent>', 'Agent name')
        .action((cmd, args, opts) => __awaiter(this, void 0, void 0, function* () {
        switch (cmd) {
            case 'list':
            case 'ls':
                chainList();
                break;
            case 'info':
                chainInfo(args[0]);
                break;
            case 'auto':
                yield chainAuto(args.join(' '), opts);
                break;
            case 'run':
            case 'start':
                yield chainStart(args[0], args.slice(1).join(' '), opts);
                break;
            case 'status':
            case 'st':
                chainStatus(args[0]);
                break;
            case 'advance':
            case 'next':
                yield chainAdvance(args[0], args.slice(1).join(' '));
                break;
            case 'skip':
                yield chainSkip(args[0], args.slice(1).join(' '));
                break;
            case 'abort':
            case 'stop':
                chainAbortCmd(args[0], args.slice(1).join(' '));
                break;
            case 'history':
                chainHistory();
                break;
            default: console.log((0, box_1.renderResult)('error', `Unknown chain command: ${cmd}`, [(0, theme_1.dim)('Available: list, info, auto, run, status, advance, skip, abort, history')]));
        }
    }));
}
function chainList() {
    const chains = (0, skill_chain_1.listChains)();
    console.log((0, box_1.renderCommandHeader)('Available Skill Chains', '🔗'));
    for (const c of chains) {
        console.log(`  ${(0, theme_1.brand)((0, cli_utils_1.padRight)(c.id, 20))} ${(0, theme_1.dim)(c.name)} ${(0, theme_1.dim)(`(${c.steps.length} steps)`)}`);
    }
    console.log();
}
function chainInfo(chainId) {
    if (!chainId) {
        console.log((0, box_1.renderResult)('error', 'Chain ID required.'));
        return;
    }
    const c = (0, skill_chain_1.findChain)(chainId);
    if (!c) {
        console.log((0, box_1.renderResult)('error', `Chain not found: ${chainId}`));
        return;
    }
    console.log((0, box_1.renderCommandHeader)(`Chain Info: ${c.name}`, '🔗'));
    console.log((0, theme_1.dim)(`  ID: ${c.id}`));
    console.log((0, theme_1.dim)(`  Description: ${c.description || '—'}`));
    console.log(`\n  ${(0, theme_1.brand)('Steps:')}`);
    c.steps.forEach((s, idx) => {
        console.log(`    ${idx + 1}. ${(0, cli_utils_1.padRight)(s.skill, 20)} ${(0, theme_1.dim)(s.description || '—')}`);
    });
    console.log();
}
function dispatchCurrentChainStep(exec) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = (0, data_1.loadData)();
        const currentStep = exec.steps[exec.currentStepIndex];
        if (!currentStep)
            return;
        const project = data.projects.find(p => p.id === exec.projectId) || data.projects[0];
        if (project) {
            const task = {
                id: crypto_1.default.randomUUID(), // Mock task for dispatch
                projectId: project.id,
                title: `${exec.taskTitle} (Step ${currentStep.index + 1}: ${currentStep.skill})`,
                description: currentStep.description,
                column: 'backlog',
                order: 0,
                priority: 'medium',
                agent: exec.agent,
                skill: currentStep.skill,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            yield (0, agent_dispatch_1.dispatchTaskToAgent)(task, project);
        }
    });
}
function chainAuto(taskTitle, opts) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!taskTitle) {
            console.log((0, box_1.renderResult)('error', 'Usage: cm chain auto "Task Title"'));
            return;
        }
        const match = (0, skill_chain_1.matchChain)(taskTitle);
        if (!match) {
            console.log((0, box_1.renderResult)('warning', `No specific chain matched for "${taskTitle}". Defaulting to Feature Development.`));
            yield chainStart('feature-development', taskTitle, opts);
        }
        else {
            console.log((0, box_1.renderResult)('success', `Detected chain: ${(0, theme_1.brand)(match.name)}`));
            yield chainStart(match.id, taskTitle, opts);
        }
    });
}
function chainStart(chainId, taskTitle, opts) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!chainId || !taskTitle) {
            console.log((0, box_1.renderResult)('error', 'Usage: cm chain run <chainId> "Task Title"'));
            return;
        }
        const c = (0, skill_chain_1.findChain)(chainId);
        if (!c) {
            console.log((0, box_1.renderResult)('error', `Chain not found: ${chainId}`));
            return;
        }
        console.log((0, box_1.renderResult)('info', `Starting chain: ${c.name}...`));
        const data = (0, data_1.loadData)();
        const agent = opts.agent || 'Hamster';
        const projectId = opts.project || 'default';
        const exec = (0, skill_chain_1.createChainExecution)(c, projectId, taskTitle, agent, process.cwd());
        data.chainExecutions.unshift(exec);
        (0, data_1.saveData)(data);
        // Dispatch first step
        const firstStep = exec.steps[0];
        console.log(`  ${(0, theme_1.success)('▶')} Step 1: ${(0, theme_1.brand)(firstStep.skill)}`);
        yield dispatchCurrentChainStep(exec);
    });
}
function chainStatus(execIdPrefix) {
    const data = (0, data_1.loadData)();
    const execs = data.chainExecutions;
    if (execs.length === 0) {
        console.log(`\n  ${(0, theme_1.dim)('No chain executions found.')}\n`);
        return;
    }
    const exec = execIdPrefix ? execs.find(e => e.id.startsWith(execIdPrefix)) : execs[0];
    if (!exec) {
        console.log((0, box_1.renderResult)('error', `Execution not found: ${execIdPrefix}`));
        return;
    }
    console.log((0, box_1.renderCommandHeader)(`Chain Execution: ${exec.chainName}`, '🔗'));
    console.log((0, theme_1.dim)(`  Task: ${exec.taskTitle}`));
    console.log((0, theme_1.dim)(`  Status: ${exec.status.toUpperCase()}`));
    console.log(`\n  ${(0, theme_1.brand)('Progress:')} ${(0, skill_chain_1.formatChainProgress)(exec)}`);
    console.log(`  ${(0, skill_chain_1.formatChainProgressBar)(exec)}`);
    console.log();
}
function chainAdvance(execIdPrefix, output) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = (0, data_1.loadData)();
        let exec = execIdPrefix ? data.chainExecutions.find(e => e.id.startsWith(execIdPrefix)) : data.chainExecutions.find(e => e.status === 'running');
        if (!exec && execIdPrefix) {
            // Fallback: execIdPrefix might be the output message instead of an ID
            exec = data.chainExecutions.find(e => e.status === 'running');
            if (exec) {
                output = output ? `${execIdPrefix} ${output}` : execIdPrefix;
            }
        }
        if (!exec) {
            console.log((0, box_1.renderResult)('error', 'No running chain execution found.'));
            return;
        }
        const res = (0, skill_chain_1.advanceChain)(exec, output || 'Completed via CLI');
        (0, data_1.saveData)(data);
        if (res.completed) {
            console.log((0, box_1.renderResult)('success', 'Chain exploration COMPLETED!'));
        }
        else if (res.nextSkill) {
            console.log((0, box_1.renderResult)('success', `Step advanced! Next: ${(0, theme_1.brand)(res.nextSkill)}`));
            yield dispatchCurrentChainStep(exec);
        }
    });
}
function chainSkip(execIdPrefix, reason) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = (0, data_1.loadData)();
        let exec = execIdPrefix ? data.chainExecutions.find(e => e.id.startsWith(execIdPrefix)) : data.chainExecutions.find(e => e.status === 'running');
        if (!exec && execIdPrefix) {
            exec = data.chainExecutions.find(e => e.status === 'running');
            if (exec) {
                reason = reason ? `${execIdPrefix} ${reason}` : execIdPrefix;
            }
        }
        if (!exec) {
            console.log((0, box_1.renderResult)('error', 'No running chain execution found.'));
            return;
        }
        const res = (0, skill_chain_1.skipChainStep)(exec, reason || 'Skipped via CLI');
        (0, data_1.saveData)(data);
        if (res.completed) {
            console.log((0, box_1.renderResult)('success', 'Chain completed (steps skipped).'));
        }
        else if (res.nextSkill) {
            console.log((0, box_1.renderResult)('success', `Step skipped! Next: ${(0, theme_1.brand)(res.nextSkill)}`));
            yield dispatchCurrentChainStep(exec);
        }
    });
}
function chainAbortCmd(execIdPrefix, reason) {
    const data = (0, data_1.loadData)();
    let exec = execIdPrefix ? data.chainExecutions.find(e => e.id.startsWith(execIdPrefix)) : data.chainExecutions.find(e => e.status === 'running');
    if (!exec && execIdPrefix) {
        exec = data.chainExecutions.find(e => e.status === 'running');
        if (exec) {
            reason = reason ? `${execIdPrefix} ${reason}` : execIdPrefix;
        }
    }
    if (!exec) {
        console.log((0, box_1.renderResult)('error', 'No running chain execution found.'));
        return;
    }
    (0, skill_chain_1.abortChain)(exec, reason || 'Aborted via CLI');
    (0, data_1.saveData)(data);
    console.log((0, box_1.renderResult)('warning', 'Chain execution ABORTED.'));
}
function chainHistory() {
    const data = (0, data_1.loadData)();
    const execs = data.chainExecutions;
    if (execs.length === 0) {
        console.log(`\n  ${(0, theme_1.dim)('No chain executions yet.')}\n`);
        return;
    }
    const STATUS_ICONS = {
        pending: '⚪', running: '🔵', paused: '⏸️', completed: '✅', failed: '❌', aborted: '🛑',
    };
    console.log((0, box_1.renderCommandHeader)(`Chain History (${execs.length})`, '🔗'));
    console.log((0, theme_1.dim)('  ' + (0, cli_utils_1.padRight)('Status', 8) + (0, cli_utils_1.padRight)('Chain', 24) + (0, cli_utils_1.padRight)('Task', 30) + (0, cli_utils_1.padRight)('Progress', 14) + 'Time'));
    console.log((0, theme_1.dim)('  ' + '─'.repeat(86)));
    for (const exec of execs.slice(0, 20)) {
        const icon = STATUS_ICONS[exec.status] || '❓';
        const completed = exec.steps.filter(s => s.status === 'completed' || s.status === 'skipped').length;
        const progress = `${completed}/${exec.steps.length} steps`;
        const time = (0, cli_utils_1.formatTimeAgoCli)(exec.startedAt);
        console.log('  ' + (0, cli_utils_1.padRight)(icon, 8) + (0, theme_1.brand)((0, cli_utils_1.padRight)(exec.chainName.substring(0, 22), 24)) + (0, cli_utils_1.padRight)(exec.taskTitle.substring(0, 28), 30) + (0, theme_1.dim)((0, cli_utils_1.padRight)(progress, 14)) + (0, theme_1.dim)(time));
    }
    console.log();
}
