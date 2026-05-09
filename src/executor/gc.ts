import fs from 'fs';
import path from 'path';
import os from 'os';

const WORKSPACES_ROOT = path.join(os.homedir(), '.cm', 'workspaces');
const DEFAULT_GC_TTL_MS = 24 * 60 * 60 * 1000;      // 24h
const DEFAULT_GC_ORPHAN_TTL_MS = 72 * 60 * 60 * 1000; // 72h
const GC_INTERVAL_MS = 60 * 60 * 1000;                 // 1h

export function startGcLoop(): NodeJS.Timeout {
  return setInterval(() => {
    gcPass();
  }, GC_INTERVAL_MS);
}

export function gcPass(): { removed: number; errors: number } {
  let removed = 0;
  let errors = 0;

  if (!fs.existsSync(WORKSPACES_ROOT)) {
    return { removed, errors };
  }

  const now = Date.now();

  try {
    const projects = fs.readdirSync(WORKSPACES_ROOT);
    for (const project of projects) {
      const projectDir = path.join(WORKSPACES_ROOT, project);
      if (!fs.statSync(projectDir).isDirectory()) continue;

      try {
        const tasks = fs.readdirSync(projectDir);
        for (const task of tasks) {
          const taskDir = path.join(projectDir, task);
          if (!fs.statSync(taskDir).isDirectory()) continue;

          const gcMetaPath = path.join(taskDir, '.gc_meta.json');

          try {
            if (fs.existsSync(gcMetaPath)) {
              const meta = JSON.parse(fs.readFileSync(gcMetaPath, 'utf-8'));
              if (meta.completedAt) {
                const completedTime = new Date(meta.completedAt).getTime();
                if (now - completedTime > DEFAULT_GC_TTL_MS) {
                  fs.rmSync(taskDir, { recursive: true, force: true });
                  removed++;
                }
              }
            } else {
              const stat = fs.statSync(taskDir);
              const age = now - stat.mtimeMs;
              if (age > DEFAULT_GC_ORPHAN_TTL_MS) {
                fs.rmSync(taskDir, { recursive: true, force: true });
                removed++;
              }
            }
          } catch {
            errors++;
          }
        }
      } catch {
        errors++;
      }
    }
  } catch {
    errors++;
  }

  return { removed, errors };
}
