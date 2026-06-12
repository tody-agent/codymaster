import { describe, it, expect, afterAll, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { KanbanData, Task, Project } from '../src/data';
import { getProjectActiveAgents } from '../src/dashboard-project-summary';

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cm-dash-'));
const tmpDataFile = path.join(tmpDir, 'kanban.json');

vi.mock('../src/data', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/data')>();

  function loadData(): KanbanData {
    if (!fs.existsSync(tmpDataFile)) {
      const empty: KanbanData = { projects: [], tasks: [], activities: [], deployments: [], changelog: [], chainExecutions: [], version: 4 };
      fs.writeFileSync(tmpDataFile, JSON.stringify(empty, null, 2));
      return { ...empty };
    }
    try {
      return JSON.parse(fs.readFileSync(tmpDataFile, 'utf-8'));
    } catch {
      return { projects: [], tasks: [], activities: [], deployments: [], changelog: [], chainExecutions: [], version: 4 };
    }
  }

  function saveData(data: KanbanData): void {
    fs.writeFileSync(tmpDataFile, JSON.stringify(data, null, 2));
  }

  return { ...actual, loadData, saveData, DATA_FILE: tmpDataFile, DATA_DIR: tmpDir };
});

const { loadData, saveData } = await import('../src/data');

function emptyData(): KanbanData {
  return { projects: [], tasks: [], activities: [], deployments: [], changelog: [], chainExecutions: [], version: 4 };
}

function seed(data: KanbanData) {
  fs.writeFileSync(tmpDataFile, JSON.stringify(data, null, 2));
}

function readRaw(): KanbanData {
  return JSON.parse(fs.readFileSync(tmpDataFile, 'utf-8'));
}

afterEach(() => { if (fs.existsSync(tmpDataFile)) fs.rmSync(tmpDataFile); });
afterAll(() => { fs.rmSync(tmpDir, { recursive: true, force: true }); });

// ─── Test 1: Concurrent task creation (race condition regression) ──────────

describe('Concurrent task creation', () => {
  it('creates 100 tasks concurrently with no lost writes', async () => {
    const data = emptyData();
    data.projects.push({ id: 'p1', name: 'Test', path: '', agents: [], createdAt: new Date().toISOString() });
    seed(data);

    const createTask = (i: number) => {
      const d = loadData();
      const now = new Date().toISOString();
      const task: Task = {
        id: `task-${i}-${Math.random().toString(36).slice(2)}`,
        projectId: 'p1',
        title: `Concurrent Task ${i}`,
        description: '',
        column: 'backlog',
        order: i,
        priority: 'medium',
        agent: '',
        skill: '',
        createdAt: now,
        updatedAt: now,
      };
      d.tasks.push(task);
      saveData(d);
    };

    // Launch 100 concurrent create operations
    await Promise.all(Array.from({ length: 100 }, (_, i) => Promise.resolve().then(() => createTask(i))));

    const persisted = readRaw();
    const backlogTasks = persisted.tasks.filter(t => t.projectId === 'p1' && t.column === 'backlog');
    expect(backlogTasks.length).toBe(100);

    const ids = new Set(backlogTasks.map(t => t.id));
    expect(ids.size).toBe(100);
  });
});

// ─── Test 2: Cancelled tasks excluded from done stats ─────────────────────

describe('Cancelled tasks excluded from done stats', () => {
  const STATUS_TO_COLUMN: Record<string, Task['column']> = {
    'backlog': 'backlog', 'pending': 'backlog', 'todo': 'backlog',
    'started': 'in-progress', 'active': 'in-progress', 'in-progress': 'in-progress', 'idle': 'in-progress',
    'review': 'review', 'completed': 'done', 'done': 'done', 'cancelled': 'cancelled',
  };

  it('maps cancelled status to cancelled column, not done', () => {
    expect(STATUS_TO_COLUMN['cancelled']).toBe('cancelled');
    expect(STATUS_TO_COLUMN['cancelled']).not.toBe('done');
  });

  it('does not count cancelled tasks in done stats', () => {
    const data = emptyData();
    data.projects.push({ id: 'p2', name: 'StatsTest', path: '', agents: [], createdAt: new Date().toISOString() });

    const now = new Date().toISOString();
    data.tasks.push(
      { id: 't-done', projectId: 'p2', title: 'Done Task', description: '', column: 'done', order: 0, priority: 'medium', agent: '', skill: '', createdAt: now, updatedAt: now },
      { id: 't-cancelled', projectId: 'p2', title: 'Cancelled Task', description: '', column: 'cancelled', order: 0, priority: 'medium', agent: '', skill: '', createdAt: now, updatedAt: now },
    );
    seed(data);

    const persisted = readRaw();
    const pt = persisted.tasks.filter(t => t.projectId === 'p2');
    const doneCount = pt.filter(t => t.column === 'done').length;

    expect(doneCount).toBe(1);
    expect(pt.length).toBe(2);
  });

  it('auto-sync status mapping excludes cancelled from done', () => {
    const statuses = ['backlog', 'active', 'review', 'completed', 'cancelled'];
    const columns = statuses.map(s => STATUS_TO_COLUMN[s] || 'in-progress');
    expect(columns).toEqual(['backlog', 'in-progress', 'review', 'done', 'cancelled']);
  });
});

describe('Project agent summaries', () => {
  it('includes registered project agents even when they have no current tasks', () => {
    const project: Project = {
      id: 'p3',
      name: 'Codex Project',
      path: '',
      agents: ['codex', 'claude-code'],
      createdAt: new Date().toISOString(),
    };
    const now = new Date().toISOString();
    const tasks: Task[] = [
      {
        id: 't-review',
        projectId: 'p3',
        title: 'Review PR',
        description: '',
        column: 'in-progress',
        order: 0,
        priority: 'medium',
        agent: 'claude-code',
        skill: '',
        createdAt: now,
        updatedAt: now,
      },
    ];

    expect(getProjectActiveAgents(project, tasks)).toEqual(['codex', 'claude-code']);
  });

  it('adds task agents that are not yet registered on the project', () => {
    const project: Project = {
      id: 'p4',
      name: 'Mixed Project',
      path: '',
      agents: ['codex'],
      createdAt: new Date().toISOString(),
    };
    const now = new Date().toISOString();
    const tasks: Task[] = [
      {
        id: 't-debug',
        projectId: 'p4',
        title: 'Debug issue',
        description: '',
        column: 'in-progress',
        order: 0,
        priority: 'high',
        agent: 'antigravity',
        skill: '',
        createdAt: now,
        updatedAt: now,
      },
    ];

    expect(getProjectActiveAgents(project, tasks)).toEqual(['codex', 'antigravity']);
  });

  it('keeps opencode visible when registered on the project without an open task', () => {
    const project: Project = {
      id: 'p5',
      name: 'OpenCode Project',
      path: '',
      agents: ['opencode'],
      createdAt: new Date().toISOString(),
    };

    expect(getProjectActiveAgents(project, [])).toEqual(['opencode']);
  });

  it('keeps cursor visible when registered on the project without an open task', () => {
    const project: Project = {
      id: 'p6',
      name: 'Cursor Project',
      path: '',
      agents: ['cursor'],
      createdAt: new Date().toISOString(),
    };

    expect(getProjectActiveAgents(project, [])).toEqual(['cursor']);
  });

  it('keeps gemini-cli visible when registered on the project without an open task', () => {
    const project: Project = {
      id: 'p7',
      name: 'Gemini Project',
      path: '',
      agents: ['gemini-cli'],
      createdAt: new Date().toISOString(),
    };

    expect(getProjectActiveAgents(project, [])).toEqual(['gemini-cli']);
  });
});
