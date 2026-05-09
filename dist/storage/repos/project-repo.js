"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProjectRepo = createProjectRepo;
// ─── Repo ───────────────────────────────────────────────────────────────────
function createProjectRepo(db) {
    const insert = db.prepare(`
    INSERT INTO projects (id, name, path, agents, created_at)
    VALUES (@id, @name, @path, @agents, @created_at)
  `);
    const getById = db.prepare('SELECT * FROM projects WHERE id = ?');
    const getAll = db.prepare('SELECT * FROM projects ORDER BY created_at DESC');
    const deleteById = db.prepare('DELETE FROM projects WHERE id = ?');
    const update = db.prepare(`
    UPDATE projects SET name = @name, path = @path, agents = @agents
    WHERE id = @id
  `);
    return {
        create(input) {
            var _a;
            const now = new Date().toISOString();
            const row = {
                id: input.id,
                name: input.name,
                path: (_a = input.path) !== null && _a !== void 0 ? _a : null,
                agents: input.agents ? JSON.stringify(input.agents) : null,
                created_at: now,
            };
            insert.run(row);
            return row;
        },
        getById(id) {
            var _a;
            return (_a = getById.get(id)) !== null && _a !== void 0 ? _a : null;
        },
        getAll() {
            return getAll.all();
        },
        update(id, fields) {
            var _a, _b;
            const existing = getById.get(id);
            if (!existing)
                return null;
            update.run({
                id,
                name: (_a = fields.name) !== null && _a !== void 0 ? _a : existing.name,
                path: (_b = fields.path) !== null && _b !== void 0 ? _b : existing.path,
                agents: fields.agents ? JSON.stringify(fields.agents) : existing.agents,
            });
            return getById.get(id);
        },
        delete(id) {
            const result = deleteById.run(id);
            return result.changes > 0;
        },
    };
}
