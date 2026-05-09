import fs from 'fs';
import { Command } from 'commander';
import { launchDashboard } from '../../dashboard';
import { DEFAULT_PORT, PID_FILE } from '../../data';
import { brand, dim } from '../../ui/theme';
import { renderResult } from '../../ui/box';
import { openUrl } from '../../utils/cli-utils';

export function registerDashboardCommands(program: Command) {
  program
    .command('dashboard [cmd]')
    .alias('dash')
    .description('Dashboard server (start|stop|status|open|tail)')
    .option('-p, --port <port>', 'Port number', String(DEFAULT_PORT))
    .action((cmd, opts) => {
      const port = parseInt(opts.port) || DEFAULT_PORT;
      switch (cmd) {
        case 'start': case undefined:
          if (isDashboardRunning()) { 
            console.log(renderResult('warning', 'Dashboard already running.', [`${dim('URL:')} ${brand(`http://localhost:${port}`)}`])); 
            return; 
          }
          launchDashboard(port); break;
        case 'stop': stopDashboard(); break;
        case 'status': dashboardStatus(port); break;
        case 'open': 
          console.log(renderResult('info', `Opening http://localhost:${port} ...`)); 
          openUrl(`http://localhost:${port}`); break;
        case 'url': console.log(`http://localhost:${port}`); break;
        case 'tail': tailDashboard(port); break;
        default: console.log(renderResult('error', `Unknown: ${cmd}`, [dim('Available: start, stop, status, open, url, tail')]));
      }
    });
}

function tailDashboard(port: number) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const chalk = require('chalk');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const WebSocket = require('ws');

  const url = `ws://127.0.0.1:${port}/ws`;
  console.log(dim(`Connecting to ${url} ...`));

  let ws: any;
  try {
    ws = new WebSocket(url);
  } catch (err: any) {
    console.log(renderResult('error', `Cannot connect: ${err.message}`, [dim('Is the dashboard running? cm dashboard start')]));
    process.exit(1);
  }

  ws.on('open', () => {
    console.log(brand('✓ Connected — listening for all events. Ctrl+C to stop.\n'));
    // Subscribe to all projects (no filter)
    ws.send(JSON.stringify({ action: 'unsubscribe' }));
  });

  ws.on('message', (raw: Buffer) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'subscribed' || msg.type === 'unsubscribed') return;

      const ts = new Date().toLocaleTimeString();
      const prefix = chalk.gray(`[${ts}]`);

      if (msg.type && msg.type.startsWith('task.')) {
        const typeColor = msg.type === 'task.created' ? chalk.green
          : msg.type === 'task.deleted' ? chalk.red
          : msg.type === 'task.transitioned' ? chalk.yellow
          : chalk.cyan;
        console.log(`${prefix} ${typeColor(msg.type.padEnd(20))} task=${chalk.white(msg.taskId?.substring(0, 8) || '?')} project=${chalk.gray(msg.projectId?.substring(0, 8) || '?')}`);
        if (msg.data) {
          if (msg.data.from && msg.data.to) {
            console.log(`${chalk.gray('  └─')} ${msg.data.from} → ${msg.data.to}`);
          } else if (msg.data.title) {
            console.log(`${chalk.gray('  └─')} ${msg.data.title}`);
          }
        }
      } else if (msg.type === 'activity.added') {
        const a = msg.activity || {};
        console.log(`${prefix} ${chalk.magenta('activity.added'.padEnd(20))} ${a.type || '?'}: ${chalk.white(a.message || '')}`);
      } else if (msg.type === 'agent.heartbeat') {
        console.log(`${prefix} ${chalk.blue('agent.heartbeat'.padEnd(20))} tasks=${(msg.runningTaskIds || []).length}`);
      } else {
        console.log(`${prefix} ${chalk.gray(JSON.stringify(msg).substring(0, 120))}`);
      }
    } catch {
      // ignore parse errors
    }
  });

  ws.on('error', (err: any) => {
    console.log(renderResult('error', `WebSocket error: ${err.message}`));
  });

  ws.on('close', () => {
    console.log(renderResult('warning', 'Connection closed.'));
    process.exit(0);
  });

  process.on('SIGINT', () => {
    console.log(dim('\nStopped.'));
    ws.close();
    process.exit(0);
  });
}

function isDashboardRunning(): boolean {
  try { 
    if (!fs.existsSync(PID_FILE)) return false; 
    const pid = parseInt(fs.readFileSync(PID_FILE, 'utf-8').trim()); 
    process.kill(pid, 0); 
    return true; 
  }
  catch { 
    try { fs.unlinkSync(PID_FILE); } catch { } 
    return false; 
  }
}

function stopDashboard() {
  try {
    if (!fs.existsSync(PID_FILE)) { 
      console.log(renderResult('warning', 'No dashboard running.')); 
      return; 
    }
    const pid = parseInt(fs.readFileSync(PID_FILE, 'utf-8').trim());
    process.kill(pid, 'SIGTERM'); 
    try { fs.unlinkSync(PID_FILE); } catch { }
    console.log(renderResult('success', `Dashboard stopped (PID ${pid}).`));
  } catch (err: any) { 
    console.log(renderResult('error', `Failed to stop: ${err.message}`)); 
    try { fs.unlinkSync(PID_FILE); } catch { } 
  }
}

function dashboardStatus(port: number) {
  if (isDashboardRunning()) {
    const pid = fs.readFileSync(PID_FILE, 'utf-8').trim();
    console.log(renderResult('success', 'Dashboard RUNNING', [`${dim('PID:')} ${brand(pid)}`, `${dim('URL:')} ${brand(`http://localhost:${port}`)}`]));
  } else { 
    console.log(renderResult('warning', 'Dashboard NOT running', [dim('Start with: cm dashboard start')])); 
  }
}
