"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidTransition = isValidTransition;
exports.createTaskRepo = createTaskRepo;
// ─── Valid transitions ──────────────────────────────────────────────────────
const VALID_TRANSITIONS = {
    backlog: ['queued', 'cancelled'],
    queued: ['claimed', 'cancelled'],
    claimed: ['running', 'cancelled'],
    running: ['review', 'failed', 'timeout', 'cancelled'],
    review: ['done', 'running', 'failed'],
    done: [],
    failed: ['queued', 'cancelled'],
    cancelled: ['backlog'],
    timeout: ['queued', 'cancelled'],
};
function isValidTransition(from, to) {
    var _a, _b;
    return (_b = (_a = VALID_TRANSITIONS[from]) === null || _a === void 0 ? void 0 : _a.includes(to)) !== null && _b !== void 0 ? _b : false;
}
// ─── Repo ───────────────────────────────────────────────────────────────────
function createTaskRepo(db) {
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
    const getByProject = db.prepare('SELECT * FROM tasks WHERE project_id = ? ORDER BY ord ASC, created_at DESC');
    const getByProjectAndStatus = db.prepare('SELECT * FROM tasks WHERE project_id = ? AND status = ? ORDER BY ord ASC, created_at DESC');
    const getByConversationId = db.prepare('SELECT * FROM tasks WHERE conversation_id = ?');
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
    const getByStatus = db.prepare('SELECT * FROM tasks WHERE status = ? ORDER BY updated_at DESC');
    return {
        create(input) {
            var _a, _b, _c, _d, _e, _f, _g;
            const now = new Date().toISOString();
            const row = {
                id: input.id,
                project_id: input.project_id,
                title: input.title,
                description: (_a = input.description) !== null && _a !== void 0 ? _a : null,
                assignee_type: (_b = input.assignee_type) !== null && _b !== void 0 ? _b : null,
                assignee_id: (_c = input.assignee_id) !== null && _c !== void 0 ? _c : null,
                status: (_d = input.status) !== null && _d !== void 0 ? _d : 'backlog',
                priority: (_e = input.priority) !== null && _e !== void 0 ? _e : null,
                ord: (_f = input.ord) !== null && _f !== void 0 ? _f : 0,
                pinned_session_id: null,
                prior_session_id: null,
                prior_workdir: null,
                current_workdir: null,
                failure_reason: null,
                error_message: null,
                conversation_id: (_g = input.conversation_id) !== null && _g !== void 0 ? _g : null,
                created_at: now,
                updated_at: now,
                started_at: null,
                finished_at: null,
            };
            insert.run(row);
            return row;
        },
        getById(id) {
            var _a;
            return (_a = getById.get(id)) !== null && _a !== void 0 ? _a : null;
        },
        getByProject(projectId) {
            return getByProject.all(projectId);
        },
        getByProjectAndStatus(projectId, status) {
            return getByProjectAndStatus.all(projectId, status);
        },
        getByConversationId(conversationId) {
            var _a;
            return (_a = getByConversationId.get(conversationId)) !== null && _a !== void 0 ? _a : null;
        },
        getByStatus(status) {
            return getByStatus.all(status);
        },
        transitionTo(id, newStatus) {
            const task = getById.get(id);
            if (!task)
                return null;
            if (!isValidTransition(task.status, newStatus))
                return null;
            const now = new Date().toISOString();
            updateStatus.run({ id, status: newStatus, updated_at: now });
            return getById.get(id);
        },
        update(id, fields) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            const existing = getById.get(id);
            if (!existing)
                return null;
            updateFields.run({
                id,
                title: (_a = fields.title) !== null && _a !== void 0 ? _a : null,
                description: (_b = fields.description) !== null && _b !== void 0 ? _b : null,
                assignee_type: (_c = fields.assignee_type) !== null && _c !== void 0 ? _c : null,
                assignee_id: (_d = fields.assignee_id) !== null && _d !== void 0 ? _d : null,
                priority: (_e = fields.priority) !== null && _e !== void 0 ? _e : null,
                ord: (_f = fields.ord) !== null && _f !== void 0 ? _f : null,
                current_workdir: (_g = fields.current_workdir) !== null && _g !== void 0 ? _g : null,
                failure_reason: (_h = fields.failure_reason) !== null && _h !== void 0 ? _h : null,
                error_message: (_j = fields.error_message) !== null && _j !== void 0 ? _j : null,
                updated_at: new Date().toISOString(),
            });
            return getById.get(id);
        },
        delete(id) {
            const result = deleteById.run(id);
            return result.changes > 0;
        },
    };
}
