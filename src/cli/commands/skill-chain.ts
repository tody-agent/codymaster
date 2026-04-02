import { Command } from 'commander';
import { 
  loadData, saveData, findTaskByIdPrefix,
  Task, shortId 
} from '../../data';
import { 
  matchChain, listChains, findChain, 
  createChainExecution, advanceChain, skipChainStep, 
  abortChain, formatChainProgress, formatChainProgressBar 
} from '../../skill-chain';
import { renderResult, renderCommandHeader } from '../../ui/box';
import { brand, dim, success, warning, info } from '../../ui/theme';
import { padRight, formatTimeAgoCli } from '../../utils/cli-utils';
import { dispatchTaskToAgent } from '../../agent-dispatch';
import crypto from 'crypto';

export function registerSkillChainCommands(program: Command) {
  program
    .command('chain <cmd> [args...]')
    .alias('ch')
    .description('Skill Chain management (list|info|run|status|advance|skip|abort|history)')
    .option('-p, --project <name>', 'Project name or ID')
    .option('--agent <agent>', 'Agent name')
    .action((cmd, args, opts) => {
      switch (cmd) {
        case 'list': case 'ls': chainList(); break;
        case 'info': chainInfo(args[0]); break;
        case 'run': case 'start': chainStart(args[0], args.slice(1).join(' '), opts); break;
        case 'status': case 'st': chainStatus(args[0]); break;
        case 'advance': case 'next': chainAdvance(args[0], args.slice(1).join(' ')); break;
        case 'skip': chainSkip(args[0], args.slice(1).join(' ')); break;
        case 'abort': case 'stop': chainAbortCmd(args[0], args.slice(1).join(' ')); break;
        case 'history': chainHistory(); break;
        default: console.log(renderResult('error', `Unknown chain command: ${cmd}`, [dim('Available: list, info, run, status, advance, skip, abort, history')]));
      }
    });
}

function chainList() {
  const chains = listChains();
  console.log(renderCommandHeader('Available Skill Chains', '🔗'));
  for (const c of chains) {
    console.log(`  ${brand(padRight(c.id, 20))} ${dim(c.name)} ${dim(`(${c.steps.length} steps)`)}`);
  }
  console.log();
}

function chainInfo(chainId: string) {
  if (!chainId) { console.log(renderResult('error', 'Chain ID required.')); return; }
  const c = findChain(chainId);
  if (!c) { console.log(renderResult('error', `Chain not found: ${chainId}`)); return; }

  console.log(renderCommandHeader(`Chain Info: ${c.name}`, '🔗'));
  console.log(dim(`  ID: ${c.id}`));
  console.log(dim(`  Description: ${c.description || '—'}`));
  console.log(`\n  ${brand('Steps:')}`);
  c.steps.forEach((s, idx) => {
    console.log(`    ${idx + 1}. ${padRight(s.skill, 20)} ${dim(s.description || '—')}`);
  });
  console.log();
}

async function chainStart(chainId: string, taskTitle: string, opts: any) {
  if (!chainId || !taskTitle) { console.log(renderResult('error', 'Usage: cm chain run <chainId> "Task Title"')); return; }
  const c = findChain(chainId);
  if (!c) { console.log(renderResult('error', `Chain not found: ${chainId}`)); return; }

  console.log(renderResult('info', `Starting chain: ${c.name}...`));
  const data = loadData();
  const agent = opts.agent || 'Hamster';
  const projectId = opts.project || 'default';
  
  const exec = createChainExecution(c, projectId, taskTitle, agent, process.cwd());
  data.chainExecutions.unshift(exec);
  saveData(data);

  // Dispatch first step
  const firstStep = exec.steps[0];
  console.log(`  ${success('▶')} Step 1: ${brand(firstStep.skill)}`);
  const project = data.projects.find(p => p.id === exec.projectId) || data.projects[0];
  if (project) {
    const task: Task = {
      id: crypto.randomUUID() as any, // Mock task for dispatch
      projectId: project.id,
      title: `${exec.taskTitle} (Step 1: ${firstStep.skill})`,
      description: '',
      column: 'backlog',
      order: 0,
      priority: 'medium',
      agent: agent,
      skill: firstStep.skill,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await dispatchTaskToAgent(task, project);
  }
}

function chainStatus(execIdPrefix?: string) {
  const data = loadData();
  const execs = data.chainExecutions;
  if (execs.length === 0) { console.log(`\n  ${dim('No chain executions found.')}\n`); return; }

  const exec = execIdPrefix ? execs.find(e => e.id.startsWith(execIdPrefix)) : execs[0];
  if (!exec) { console.log(renderResult('error', `Execution not found: ${execIdPrefix}`)); return; }

  console.log(renderCommandHeader(`Chain Execution: ${exec.chainName}`, '🔗'));
  console.log(dim(`  Task: ${exec.taskTitle}`));
  console.log(dim(`  Status: ${exec.status.toUpperCase()}`));
  console.log(`\n  ${brand('Progress:')} ${formatChainProgress(exec)}`);
  console.log(`  ${formatChainProgressBar(exec)}`);
  console.log();
}

function chainAdvance(execIdPrefix: string, output?: string) {
  if (!execIdPrefix) { console.log(renderResult('error', 'Execution ID required.')); return; }
  const data = loadData();
  const exec = data.chainExecutions.find(e => e.id.startsWith(execIdPrefix));
  if (!exec) { console.log(renderResult('error', `Execution not found: ${execIdPrefix}`)); return; }

  const res = advanceChain(exec, output || 'Completed via CLI');
  saveData(data);
  if (res.completed) {
    console.log(renderResult('success', 'Chain exploration COMPLETED!'));
  } else if (res.nextSkill) {
    console.log(renderResult('success', `Step advanced! Next: ${brand(res.nextSkill)}`));
  }
}

function chainSkip(execIdPrefix: string, reason?: string) {
  if (!execIdPrefix) { console.log(renderResult('error', 'Execution ID required.')); return; }
  const data = loadData();
  const exec = data.chainExecutions.find(e => e.id.startsWith(execIdPrefix));
  if (!exec) { console.log(renderResult('error', `Execution not found: ${execIdPrefix}`)); return; }

  const res = skipChainStep(exec, reason || 'Skipped via CLI');
  saveData(data);
  if (res.completed) {
    console.log(renderResult('success', 'Chain completed (steps skipped).'));
  } else if (res.nextSkill) {
    console.log(renderResult('success', `Step skipped! Next: ${brand(res.nextSkill)}`));
  }
}

function chainAbortCmd(execIdPrefix: string, reason?: string) {
  if (!execIdPrefix) { console.log(renderResult('error', 'Execution ID required.')); return; }
  const data = loadData();
  const exec = data.chainExecutions.find(e => e.id.startsWith(execIdPrefix));
  if (!exec) { console.log(renderResult('error', `Execution not found: ${execIdPrefix}`)); return; }

  abortChain(exec, reason || 'Aborted via CLI');
  saveData(data);
  console.log(renderResult('warning', 'Chain execution ABORTED.'));
}

function chainHistory() {
  const data = loadData();
  const execs = data.chainExecutions;

  if (execs.length === 0) {
    console.log(`\n  ${dim('No chain executions yet.')}\n`);
    return;
  }

  const STATUS_ICONS: Record<string, string> = {
    pending: '⚪', running: '🔵', paused: '⏸️', completed: '✅', failed: '❌', aborted: '🛑',
  };

  console.log(renderCommandHeader(`Chain History (${execs.length})`, '🔗'));
  console.log(dim('  ' + padRight('Status', 8) + padRight('Chain', 24) + padRight('Task', 30) + padRight('Progress', 14) + 'Time'));
  console.log(dim('  ' + '─'.repeat(86)));

  for (const exec of execs.slice(0, 20)) {
    const icon = STATUS_ICONS[exec.status] || '❓';
    const completed = exec.steps.filter(s => s.status === 'completed' || s.status === 'skipped').length;
    const progress = `${completed}/${exec.steps.length} steps`;
    const time = formatTimeAgoCli(exec.startedAt);
    console.log('  ' + padRight(icon, 8) + brand(padRight(exec.chainName.substring(0, 22), 24)) + padRight(exec.taskTitle.substring(0, 28), 30) + dim(padRight(progress, 14)) + dim(time));
  }
  console.log();
}
