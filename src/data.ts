import path from 'path';
import fs from 'fs';
import os from 'os';
import crypto from 'crypto';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  path: string;
  agents: string[];
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  column: 'backlog' | 'in-progress' | 'review' | 'done';
  order: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  agent: string;
  skill: string;
  createdAt: string;
  updatedAt: string;
  dispatchStatus?: 'pending' | 'dispatched' | 'failed';
  dispatchedAt?: string;
  dispatchError?: string;
  stuckSince?: string;
}

export type ActivityType =
  | 'task_created' | 'task_moved' | 'task_done' | 'task_deleted' | 'task_updated' | 'task_dispatched' | 'task_transitioned'
  | 'project_created' | 'project_deleted'
  | 'deploy_staging' | 'deploy_production' | 'deploy_failed' | 'rollback'
  | 'git_push' | 'changelog_added';

export interface ActivityLog {
  id: string;
  projectId: string;
  type: ActivityType;
  message: string;
  agent: string;
  metadata: Record<string, any>;
  createdAt: string;
}

export type DeployStatus = 'pending' | 'running' | 'success' | 'failed' | 'rolled_back';

export interface Deployment {
  id: string;
  projectId: string;
  env: 'staging' | 'production';
  status: DeployStatus;
  commit: string;
  branch: string;
  agent: string;
  message: string;
  startedAt: string;
  finishedAt: string;
  rollbackOf?: string;
}

export interface ChangelogEntry {
  id: string;
  projectId: string;
  version: string;
  title: string;
  changes: string[];
  deploymentId?: string;
  agent: string;
  createdAt: string;
}

export interface KanbanData {
  projects: Project[];
  tasks: Task[];
  activities: ActivityLog[];
  deployments: Deployment[];
  changelog: ChangelogEntry[];
  version: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────

export const DATA_DIR = path.join(os.homedir(), '.codymaster');
export const DATA_FILE = path.join(DATA_DIR, 'kanban.json');
export const PID_FILE = path.join(DATA_DIR, 'dashboard.pid');
export const DEFAULT_PORT = 6969;

// ─── Persistence ────────────────────────────────────────────────────────────

export function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

const EMPTY_DATA: KanbanData = { projects: [], tasks: [], activities: [], deployments: [], changelog: [], version: 3 };

export function loadData(): KanbanData {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(EMPTY_DATA, null, 2));
    return { ...EMPTY_DATA };
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const data = JSON.parse(raw) as KanbanData;

    let needsSave = false;

    // Ensure arrays exist
    if (!data.projects) { data.projects = []; needsSave = true; }
    if (!data.activities) { data.activities = []; needsSave = true; }
    if (!data.deployments) { data.deployments = []; needsSave = true; }
    if (!data.changelog) { data.changelog = []; needsSave = true; }

    // v1/v2 → v3 migration
    if (!data.version || data.version < 3) {
      // Migrate orphan tasks (from v1)
      if (data.tasks && data.tasks.length > 0 && data.projects.length === 0) {
        const defaultProject: Project = {
          id: crypto.randomUUID(), name: 'Default Project',
          path: process.cwd(), agents: [], createdAt: new Date().toISOString(),
        };
        data.projects.push(defaultProject);
        data.tasks.forEach(t => {
          if (!t.projectId) t.projectId = defaultProject.id;
          if (!t.agent) t.agent = '';
          if (!t.skill) t.skill = '';
        });
      }
      data.version = 3;
      needsSave = true;
    }

    if (needsSave) fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    return data;
  } catch {
    return { ...EMPTY_DATA };
  }
}

export function saveData(data: KanbanData): void {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ─── Activity Logger ────────────────────────────────────────────────────────

export function logActivity(
  data: KanbanData,
  type: ActivityType,
  message: string,
  projectId: string = '',
  agent: string = '',
  metadata: Record<string, any> = {}
): void {
  data.activities.unshift({
    id: crypto.randomUUID(),
    projectId,
    type,
    message,
    agent,
    metadata,
    createdAt: new Date().toISOString(),
  });
  // Keep max 500 entries
  if (data.activities.length > 500) {
    data.activities = data.activities.slice(0, 500);
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

export function findProjectByNameOrId(data: KanbanData, query: string): Project | undefined {
  return data.projects.find(p => p.id === query || p.id.startsWith(query) || p.name.toLowerCase() === query.toLowerCase());
}

export function findTaskByIdPrefix(data: KanbanData, prefix: string): Task | undefined {
  return data.tasks.find(t => t.id === prefix || t.id.startsWith(prefix));
}

export function shortId(id: string): string {
  return id.substring(0, 8);
}
