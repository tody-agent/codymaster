import type Database from 'better-sqlite3';
import { createProjectRepo } from '../repos/project-repo';
import type { DbProject, CreateProjectInput } from '../repos/project-repo';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ProjectCreatedEvent {
  project: DbProject;
}

export interface ProjectDeletedEvent {
  projectId: string;
}

// ─── Service ────────────────────────────────────────────────────────────────

export function createProjectService(db: Database.Database) {
  const repo = createProjectRepo(db);

  // Event stubs — will connect to EventBus in Wave 2D
  const listeners: {
    onCreated?: (e: ProjectCreatedEvent) => void;
    onDeleted?: (e: ProjectDeletedEvent) => void;
  } = {};

  return {
    create(input: CreateProjectInput): DbProject {
      if (!input.id?.trim()) throw new Error('Project id is required');
      if (!input.name?.trim()) throw new Error('Project name is required');

      const existing = repo.getById(input.id);
      if (existing) throw new Error(`Project ${input.id} already exists`);

      const project = repo.create(input);
      listeners.onCreated?.({ project });
      return project;
    },

    getById(id: string): DbProject | null {
      return repo.getById(id);
    },

    getAll(): DbProject[] {
      return repo.getAll();
    },

    update(id: string, fields: { name?: string; path?: string; agents?: string[] }): DbProject | null {
      return repo.update(id, fields);
    },

    delete(id: string): boolean {
      const deleted = repo.delete(id);
      if (deleted) {
        listeners.onDeleted?.({ projectId: id });
      }
      return deleted;
    },

    // Event registration stubs (Wave 2D)
    onCreated(handler: (e: ProjectCreatedEvent) => void): void {
      listeners.onCreated = handler;
    },
    onDeleted(handler: (e: ProjectDeletedEvent) => void): void {
      listeners.onDeleted = handler;
    },
  };
}

export type ProjectService = ReturnType<typeof createProjectService>;
