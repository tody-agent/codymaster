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
    .description('Dashboard server (start|stop|status|open)')
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
        default: console.log(renderResult('error', `Unknown: ${cmd}`, [dim('Available: start, stop, status, open, url')]));
      }
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
