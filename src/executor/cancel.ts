import { execFileSync } from 'child_process';
import os from 'os';

export async function cancelTask(taskId: string, pgid: number): Promise<void> {
  if (os.platform() === 'win32') {
    execFileSync('taskkill', ['/PID', String(pgid), '/T', '/F'], { timeout: 10000 });
  } else {
    process.kill(-pgid, 'SIGTERM');
    await new Promise(resolve => setTimeout(resolve, 5000));
    try {
      process.kill(-pgid, 'SIGKILL');
    } catch {
      // already dead
    }
  }
}
