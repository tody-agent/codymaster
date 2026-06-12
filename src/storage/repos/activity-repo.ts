import type Database from 'better-sqlite3';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DbActivity {
  id: string;
  type: string;
  message: string;
  project_id: string | null;
  task_id: string | null;
  actor_type: string | null;
  actor_id: string | null;
  meta: string | null;     // JSON
  created_at: string;
}

export interface CreateActivityInput {
  id: string;
  type: string;
  message: string;
  project_id?: string;
  task_id?: string;
  actor_type?: string;
  actor_id?: string;
  meta?: Record<string, unknown>;
}

// ─── Repo ───────────────────────────────────────────────────────────────────

export function createActivityRepo(db: Database.Database) {
  const insert = db.prepare(`
    INSERT INTO activities (id, type, message, project_id, task_id, actor_type, actor_id, meta, created_at)
    VALUES (@id, @type, @message, @project_id, @task_id, @actor_type, @actor_id, @meta, @created_at)
  `);

  const getById = db.prepare('SELECT * FROM activities WHERE id = ?');

  const getByProject = db.prepare(
    'SELECT * FROM activities WHERE project_id = ? ORDER BY created_at DESC LIMIT ?'
  );

  const getByTask = db.prepare(
    'SELECT * FROM activities WHERE task_id = ? ORDER BY created_at DESC LIMIT ?'
  );

  const getRecent = db.prepare(
    'SELECT * FROM activities ORDER BY created_at DESC LIMIT ?'
  );

  return {
    create(input: CreateActivityInput): DbActivity {
      const now = new Date().toISOString();
      const row: DbActivity = {
        id: input.id,
        type: input.type,
        message: input.message,
        project_id: input.project_id ?? null,
        task_id: input.task_id ?? null,
        actor_type: input.actor_type ?? null,
        actor_id: input.actor_id ?? null,
        meta: input.meta ? JSON.stringify(input.meta) : null,
        created_at: now,
      };
      insert.run(row);
      return row;
    },

    getById(id: string): DbActivity | null {
      return (getById.get(id) as DbActivity) ?? null;
    },

    getByProject(projectId: string, limit = 50): DbActivity[] {
      return getByProject.all(projectId, limit) as DbActivity[];
    },

    getByTask(taskId: string, limit = 50): DbActivity[] {
      return getByTask.all(taskId, limit) as DbActivity[];
    },

    getRecent(limit = 50): DbActivity[] {
      return getRecent.all(limit) as DbActivity[];
    },
  };
}

export type ActivityRepo = ReturnType<typeof createActivityRepo>;
