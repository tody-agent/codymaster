import { execFileSync } from 'child_process';

export function detectVersion(command: string): string {
  try {
    return execFileSync(command, ['--version'], { encoding: 'utf8', timeout: 5000 }).trim();
  } catch {
    return 'unknown';
  }
}

export function checkMinVersion(version: string, minVersion: string): boolean {
  const parse = (v: string) => v.split('.').map(Number);
  const a = parse(version);
  const b = parse(minVersion);
  for (let i = 0; i < 3; i++) {
    if ((a[i] || 0) > (b[i] || 0)) return true;
    if ((a[i] || 0) < (b[i] || 0)) return false;
  }
  return true;
}
