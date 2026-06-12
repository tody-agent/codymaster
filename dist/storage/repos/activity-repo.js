"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createActivityRepo = createActivityRepo;
// ─── Repo ───────────────────────────────────────────────────────────────────
function createActivityRepo(db) {
    const insert = db.prepare(`
    INSERT INTO activities (id, type, message, project_id, task_id, actor_type, actor_id, meta, created_at)
    VALUES (@id, @type, @message, @project_id, @task_id, @actor_type, @actor_id, @meta, @created_at)
  `);
    const getById = db.prepare('SELECT * FROM activities WHERE id = ?');
    const getByProject = db.prepare('SELECT * FROM activities WHERE project_id = ? ORDER BY created_at DESC LIMIT ?');
    const getByTask = db.prepare('SELECT * FROM activities WHERE task_id = ? ORDER BY created_at DESC LIMIT ?');
    const getRecent = db.prepare('SELECT * FROM activities ORDER BY created_at DESC LIMIT ?');
    return {
        create(input) {
            var _a, _b, _c, _d;
            const now = new Date().toISOString();
            const row = {
                id: input.id,
                type: input.type,
                message: input.message,
                project_id: (_a = input.project_id) !== null && _a !== void 0 ? _a : null,
                task_id: (_b = input.task_id) !== null && _b !== void 0 ? _b : null,
                actor_type: (_c = input.actor_type) !== null && _c !== void 0 ? _c : null,
                actor_id: (_d = input.actor_id) !== null && _d !== void 0 ? _d : null,
                meta: input.meta ? JSON.stringify(input.meta) : null,
                created_at: now,
            };
            insert.run(row);
            return row;
        },
        getById(id) {
            var _a;
            return (_a = getById.get(id)) !== null && _a !== void 0 ? _a : null;
        },
        getByProject(projectId, limit = 50) {
            return getByProject.all(projectId, limit);
        },
        getByTask(taskId, limit = 50) {
            return getByTask.all(taskId, limit);
        },
        getRecent(limit = 50) {
            return getRecent.all(limit);
        },
    };
}
