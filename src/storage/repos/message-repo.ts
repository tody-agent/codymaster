import type Database from 'better-sqlite3';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DbTaskMessage {
  id: number;
  task_id: string;
  type: string;
  payload: string;     // JSON
  created_at: string;
}

export interface CreateMessageInput {
  task_id: string;
  type: string;
  payload: Record<string, unknown> | string;
}

// ─── Repo ───────────────────────────────────────────────────────────────────

export function createMessageRepo(db: Database.Database) {
  const insert = db.prepare(`
    INSERT INTO task_messages (task_id, type, payload, created_at)
    VALUES (@task_id, @type, @payload, @created_at)
  `);

  const getByTask = db.prepare(
    'SELECT * FROM task_messages WHERE task_id = ? ORDER BY id ASC LIMIT ? OFFSET ?'
  );

  const getById = db.prepare('SELECT * FROM task_messages WHERE id = ?');

  const countByTask = db.prepare(
    'SELECT COUNT(*) as count FROM task_messages WHERE task_id = ?'
  );

  return {
    create(input: CreateMessageInput): DbTaskMessage {
      const now = new Date().toISOString();
      const payloadStr = typeof input.payload === 'string'
        ? input.payload
        : JSON.stringify(input.payload);
      const result = insert.run({
        task_id: input.task_id,
        type: input.type,
        payload: payloadStr,
        created_at: now,
      });
      return getById.get(result.lastInsertRowid) as DbTaskMessage;
    },

    getByTask(taskId: string, limit = 100, offset = 0): DbTaskMessage[] {
      return getByTask.all(taskId, limit, offset) as DbTaskMessage[];
    },

    getById(id: number): DbTaskMessage | null {
      return (getById.get(id) as DbTaskMessage) ?? null;
    },

    countByTask(taskId: string): number {
      const row = countByTask.get(taskId) as { count: number };
      return row.count;
    },
  };
}

export type MessageRepo = ReturnType<typeof createMessageRepo>;
