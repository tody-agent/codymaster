import fs from 'fs';
import path from 'path';
import os from 'os';

const WORKSPACES_ROOT = path.join(os.homedir(), '.cm', 'workspaces');

export interface WorkdirMeta {
  taskId: string;
  projectId: string;
  completedAt?: string;
}

export function prepareWorkdir(projectShort: string, taskShort: string): string {
  const workdir = path.join(WORKSPACES_ROOT, projectShort, taskShort, 'workdir');
  fs.mkdirSync(workdir, { recursive: true });

  const outputDir = path.join(WORKSPACES_ROOT, projectShort, taskShort, 'output');
  const logsDir = path.join(WORKSPACES_ROOT, projectShort, taskShort, 'logs');
  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(logsDir, { recursive: true });

  return workdir;
}

export function writeGcMeta(projectShort: string, taskShort: string, meta: WorkdirMeta): void {
  const metaPath = path.join(WORKSPACES_ROOT, projectShort, taskShort, '.gc_meta.json');
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
}

export function reuseWorkdir(existingPath: string): string {
  if (!fs.existsSync(existingPath)) {
    throw new Error(`Workdir not found: ${existingPath}`);
  }
  return existingPath;
}
