import type Database from 'better-sqlite3';

// ─── Types ──────────────────────────────────────────────────────────────────

export type TaskStatus =
  | 'backlog' | 'queued' | 'claimed' | 'running' | 'review'
  | 'done' | 'failed' | 'cancelled' | 'timeout';

export type AssigneeType = 'member' | 'agent';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface DbTask {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  assignee_type: AssigneeType | null;
  assignee_id: string | null;
  status: TaskStatus;
  priority: Priority | null;
  ord: number;
  pinned_session_id: string | null;
  prior_session_id: string | null;
  prior_workdir: string | null;
  current_workdir: string | null;
  failure_reason: string | null;
  error_message: string | null;
  conversation_id: string | null;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  finished_at: string | null;
}

export interface CreateTaskInput {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  assignee_type?: AssigneeType;
  assignee_id?: string;
  status?: TaskStatus;
  priority?: Priority;
  ord?: number;
  conversation_id?: string;
}

// ─── Valid transitions ──────────────────────────────────────────────────────

const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  backlog:   ['queued', 'cancelled'],
  queued:    ['claimed', 'cancelled'],
  claimed:   ['running', 'cancelled'],
  running:   ['review', 'failed', 'timeout', 'cancelled'],
  review:    ['done', 'running', 'failed'],
  done:      [],
  failed:    ['queued', 'cancelled'],
  cancelled: ['backlog'],
  timeout:   ['queued', 'cancelled'],
};

export function isValidTransition(from: TaskStatus, to: TaskStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

// ─── Repo ───────────────────────────────────────────────────────────────────

export function createTaskRepo(db: Database.Database) {
  const insert = db.prepare(`
    INSERT INTO tasks
      (id, project_id, title, description, assignee_type, assignee_id,
       status, priority, ord, pinned_session_id, prior_session_id,
       prior_workdir, current_workdir, failure_reason, error_message,
       conversation_id, created_at, updated_at, started_at, finished_at)
    VALUES
      (@id, @project_id, @title, @description, @assignee_type, @assignee_id,
       @status, @priority, @ord, @pinned_session_id, @prior_session_id,
       @prior_workdir, @current_workdir, @failure_reason, @error_message,
       @conversation_id, @created_at, @updated_at, @started_at, @finished_at)
  `);

  const getById = db.prepare('SELECT * FROM tasks WHERE id = ?');

  const getByProject = db.prepare(
    'SELECT * FROM tasks WHERE project_id = ? ORDER BY ord ASC, created_at DESC'
  );

  const getByProjectAndStatus = db.prepare(
    'SELECT * FROM tasks WHERE project_id = ? AND status = ? ORDER BY ord ASC, created_at DESC'
  );

  const getByConversationId = db.prepare(
    'SELECT * FROM tasks WHERE conversation_id = ?'
  );

  const updateStatus = db.prepare(`
    UPDATE tasks SET status = @status, updated_at = @updated_at,
      started_at = CASE WHEN @status = 'running' THEN @updated_at ELSE started_at END,
      finished_at = CASE WHEN @status IN ('done','failed','cancelled','timeout') THEN @updated_at ELSE finished_at END
    WHERE id = @id
  `);

  const updateFields = db.prepare(`
    UPDATE tasks SET
      title = COALESCE(@title, title),
      description = COALESCE(@description, description),
      assignee_type = COALESCE(@assignee_type, assignee_type),
      assignee_id = COALESCE(@assignee_id, assignee_id),
      priority = COALESCE(@priority, priority),
      ord = COALESCE(@ord, ord),
      current_workdir = COALESCE(@current_workdir, current_workdir),
      failure_reason = COALESCE(@failure_reason, failure_reason),
      error_message = COALESCE(@error_message, error_message),
      updated_at = @updated_at
    WHERE id = @id
  `);

  const deleteById = db.prepare('DELETE FROM tasks WHERE id = ?');

  const getByStatus = db.prepare(
    'SELECT * FROM tasks WHERE status = ? ORDER BY updated_at DESC'
  );

  return {
    create(input: CreateTaskInput): DbTask {
      const now = new Date().toISOString();
      const row = {
        id: input.id,
        project_id: input.project_id,
        title: input.title,
        description: input.description ?? null,
        assignee_type: input.assignee_type ?? null,
        assignee_id: input.assignee_id ?? null,
        status: input.status ?? 'backlog' as TaskStatus,
        priority: input.priority ?? null,
        ord: input.ord ?? 0,
        pinned_session_id: null,
        prior_session_id: null,
        prior_workdir: null,
        current_workdir: null,
        failure_reason: null,
        error_message: null,
        conversation_id: input.conversation_id ?? null,
        created_at: now,
        updated_at: now,
        started_at: null,
        finished_at: null,
      };
      insert.run(row);
      return row as DbTask;
    },

    getById(id: string): DbTask | null {
      return (getById.get(id) as DbTask) ?? null;
    },

    getByProject(projectId: string): DbTask[] {
      return getByProject.all(projectId) as DbTask[];
    },

    getByProjectAndStatus(projectId: string, status: TaskStatus): DbTask[] {
      return getByProjectAndStatus.all(projectId, status) as DbTask[];
    },

    getByConversationId(conversationId: string): DbTask | null {
      return (getByConversationId.get(conversationId) as DbTask) ?? null;
    },

    getByStatus(status: TaskStatus): DbTask[] {
      return getByStatus.all(status) as DbTask[];
    },

    transitionTo(id: string, newStatus: TaskStatus): DbTask | null {
      const task = getById.get(id) as DbTask | undefined;
      if (!task) return null;
      if (!isValidTransition(task.status, newStatus)) return null;
      const now = new Date().toISOString();
      updateStatus.run({ id, status: newStatus, updated_at: now });
      return getById.get(id) as DbTask;
    },

    update(id: string, fields: Partial<Pick<DbTask,
      'title' | 'description' | 'assignee_type' | 'assignee_id' |
      'priority' | 'ord' | 'current_workdir' | 'failure_reason' | 'error_message'
    >>): DbTask | null {
      const existing = getById.get(id) as DbTask | undefined;
      if (!existing) return null;
      updateFields.run({
        id,
        title: fields.title ?? null,
        description: fields.description ?? null,
        assignee_type: fields.assignee_type ?? null,
        assignee_id: fields.assignee_id ?? null,
        priority: fields.priority ?? null,
        ord: fields.ord ?? null,
        current_workdir: fields.current_workdir ?? null,
        failure_reason: fields.failure_reason ?? null,
        error_message: fields.error_message ?? null,
        updated_at: new Date().toISOString(),
      });
      return getById.get(id) as DbTask;
    },

    delete(id: string): boolean {
      const result = deleteById.run(id);
      return result.changes > 0;
    },
  };
}

export type TaskRepo = ReturnType<typeof createTaskRepo>;
