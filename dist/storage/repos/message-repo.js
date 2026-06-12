"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMessageRepo = createMessageRepo;
// ─── Repo ───────────────────────────────────────────────────────────────────
function createMessageRepo(db) {
    const insert = db.prepare(`
    INSERT INTO task_messages (task_id, type, payload, created_at)
    VALUES (@task_id, @type, @payload, @created_at)
  `);
    const getByTask = db.prepare('SELECT * FROM task_messages WHERE task_id = ? ORDER BY id ASC LIMIT ? OFFSET ?');
    const getById = db.prepare('SELECT * FROM task_messages WHERE id = ?');
    const countByTask = db.prepare('SELECT COUNT(*) as count FROM task_messages WHERE task_id = ?');
    return {
        create(input) {
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
            return getById.get(result.lastInsertRowid);
        },
        getByTask(taskId, limit = 100, offset = 0) {
            return getByTask.all(taskId, limit, offset);
        },
        getById(id) {
            var _a;
            return (_a = getById.get(id)) !== null && _a !== void 0 ? _a : null;
        },
        countByTask(taskId) {
            const row = countByTask.get(taskId);
            return row.count;
        },
    };
}
