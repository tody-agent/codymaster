import { Command } from 'commander';
import crypto from 'crypto';
import { 
  getContinuityStatus, 
  getLearnings, 
  getDecisions,
  addLearning,
  readContinuityState,
  Learning
} from '../../continuity';
import { renderResult, renderCommandHeader } from '../../ui/box';
import { brand, dim, success, warning, info } from '../../ui/theme';
import { padRight, formatTimeAgoCli } from '../../utils/cli-utils';

export function registerAgentCommands(program: Command) {
  program
    .command('agent [cmd] [args...]')
    .alias('a')
    .description('Agent management (status|memory|brain|learn)')
    .action((cmd, args) => {
      switch (cmd) {
        case 'status': case 'st': agentStatus(); break;
        case 'memory': case 'mem': agentMemory(); break;
        case 'brain': case 'br': agentBrain(); break;
        case 'learn': agentLearn(args.join(' ')); break;
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
  const summary = getContinuityStatus(process.cwd());
  
  if (!summary.initialized) {
    console.log(renderResult('warning', 'No active CodyMaster brain initialized in this directory.', [
      dim('Run `cm init` to start.')
    ]));
    return;
  }

  console.log(renderCommandHeader('Agent Status: Hamster v4.6', '🐹'));
  console.log(brand('  🧠 Memory Index:'));
  console.log(dim(`    Iterations: ${summary.iteration}`));
  console.log(dim(`    Current Goal: ${summary.activeGoal}`));
  console.log(dim(`    Current Phase: ${summary.phase}`));
  console.log(dim(`    Tasks Completed: ${summary.completedCount}`));
  console.log(dim(`    Active Blockers: ${summary.blockerCount}`));

  console.log(`\n  ${brand('📊 Activity Summary:')}`);
  console.log(dim(`    Learnings: ${summary.learningCount}`));
  console.log(dim(`    Decisions: ${summary.decisionCount}`));
  console.log();
}

function agentMemory() {
  const learnings = getLearnings(process.cwd()).slice(0, 5);
  if (learnings.length === 0) {
    console.log(renderResult('info', 'No memories stored yet.'));
    return;
  }

  console.log(renderCommandHeader('Agent Memory (Latest)', '🧠'));
  learnings.forEach((l: Learning) => {
    console.log(`  ${success('●')} ${brand(l.whatFailed)}`);
    console.log(dim(`    ${l.howToPrevent} (${formatTimeAgoCli(l.timestamp)})`));
  });
  console.log();
}

function agentBrain() {
  const state = readContinuityState(process.cwd());
  if (!state) {
    console.log(renderResult('warning', 'Brain not initialized.'));
    return;
  }

  console.log(renderCommandHeader(`Agent Brain: ${state.project}`, '🧠'));
  console.log(brand(`  Goal: ${state.activeGoal}`));
  console.log(dim(`  Phase: ${state.currentPhase} (Iter ${state.currentIteration})`));
  
  console.log(`\n  ${brand('Next Actions:')}`);
  state.nextActions.slice(0, 5).forEach((act: string, idx: number) => {
    console.log(`    ${idx + 1}. ${act}`);
  });

  if (state.activeBlockers.length > 0) {
    console.log(`\n  ${warning('Blockers:')}`);
    state.activeBlockers.forEach((b: string) => console.log(`    ⚠️ ${b}`));
  }
  console.log();
}

async function agentLearn(content: string) {
  if (!content) {
    console.log(renderResult('error', 'Please provide a learning to record.'));
    return;
  }
  
  const state = readContinuityState(process.cwd());
  const learning: Omit<Learning, 'id'> = {
    whatFailed: content,
    whyFailed: 'Manual entry',
    howToPrevent: 'Recorded via CLI',
    timestamp: new Date().toISOString(),
    agent: 'CLI User',
    taskId: state?.currentTask?.id || 'manual',
    module: 'system'
  };
  
  addLearning(process.cwd(), learning);
  console.log(renderResult('success', 'Learning recorded in brain.'));
}
