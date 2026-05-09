import type Database from 'better-sqlite3';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DbProject {
  id: string;
  name: string;
  path: string | null;
  agents: string | null;   // JSON array
  created_at: string;
}

export interface CreateProjectInput {
  id: string;
  name: string;
  path?: string;
  agents?: string[];
}

// ─── Repo ───────────────────────────────────────────────────────────────────

export function createProjectRepo(db: Database.Database) {
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
    create(input: CreateProjectInput): DbProject {
      const now = new Date().toISOString();
      const row: DbProject = {
        id: input.id,
        name: input.name,
        path: input.path ?? null,
        agents: input.agents ? JSON.stringify(input.agents) : null,
        created_at: now,
      };
      insert.run(row);
      return row;
    },

    getById(id: string): DbProject | null {
      return (getById.get(id) as DbProject) ?? null;
    },

    getAll(): DbProject[] {
      return getAll.all() as DbProject[];
    },

    update(id: string, fields: { name?: string; path?: string; agents?: string[] }): DbProject | null {
      const existing = getById.get(id) as DbProject | undefined;
      if (!existing) return null;
      update.run({
        id,
        name: fields.name ?? existing.name,
        path: fields.path ?? existing.path,
        agents: fields.agents ? JSON.stringify(fields.agents) : existing.agents,
      });
      return getById.get(id) as DbProject;
    },

    delete(id: string): boolean {
      const result = deleteById.run(id);
      return result.changes > 0;
    },
  };
}

export type ProjectRepo = ReturnType<typeof createProjectRepo>;
