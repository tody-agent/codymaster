import type Database from 'better-sqlite3';
import { createTaskRepo, isValidTransition } from '../repos/task-repo';
import type { DbTask, CreateTaskInput, TaskStatus } from '../repos/task-repo';
import { createMessageRepo } from '../repos/message-repo';
import type { CreateMessageInput } from '../repos/message-repo';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TaskCreatedEvent {
  task: DbTask;
}

export interface TaskTransitionedEvent {
  task: DbTask;
  from: TaskStatus;
  to: TaskStatus;
}

export interface TaskUpdatedEvent {
  task: DbTask;
}

export interface TaskDeletedEvent {
  taskId: string;
  projectId: string;
}

// ─── Service ────────────────────────────────────────────────────────────────

export function createTaskService(db: Database.Database) {
  const taskRepo = createTaskRepo(db);
  const messageRepo = createMessageRepo(db);

  // Event stubs — will connect to EventBus in Wave 2D
  const listeners: {
    onCreated?: (e: TaskCreatedEvent) => void;
    onTransitioned?: (e: TaskTransitionedEvent) => void;
    onUpdated?: (e: TaskUpdatedEvent) => void;
    onDeleted?: (e: TaskDeletedEvent) => void;
  } = {};

  return {
    create(input: CreateTaskInput): DbTask {
      if (!input.id?.trim()) throw new Error('Task id is required');
      if (!input.project_id?.trim()) throw new Error('Task project_id is required');
      if (!input.title?.trim()) throw new Error('Task title is required');

      const task = taskRepo.create(input);
      listeners.onCreated?.({ task });
      return task;
    },

    getById(id: string): DbTask | null {
      return taskRepo.getById(id);
    },

    getByProject(projectId: string): DbTask[] {
      return taskRepo.getByProject(projectId);
    },

    getByProjectAndStatus(projectId: string, status: TaskStatus): DbTask[] {
      return taskRepo.getByProjectAndStatus(projectId, status);
    },

    getByStatus(status: TaskStatus): DbTask[] {
      return taskRepo.getByStatus(status);
    },

    getByConversationId(conversationId: string): DbTask | null {
      return taskRepo.getByConversationId(conversationId);
    },

    transitionTo(id: string, newStatus: TaskStatus): DbTask | null {
      const task = taskRepo.getById(id);
      if (!task) return null;

      if (!isValidTransition(task.status, newStatus)) {
        throw new Error(
          `Invalid transition: ${task.status} → ${newStatus} for task ${id}`
        );
      }

      const updated = taskRepo.transitionTo(id, newStatus);
      if (updated) {
        listeners.onTransitioned?.({ task: updated, from: task.status, to: newStatus });
      }
      return updated;
    },

    update(id: string, fields: Partial<Pick<DbTask,
      'title' | 'description' | 'assignee_type' | 'assignee_id' |
      'priority' | 'ord' | 'current_workdir' | 'failure_reason' | 'error_message'
    >>): DbTask | null {
      const updated = taskRepo.update(id, fields);
      if (updated) {
        listeners.onUpdated?.({ task: updated });
      }
      return updated;
    },

    delete(id: string): boolean {
      const task = taskRepo.getById(id);
      if (!task) return false;
      const deleted = taskRepo.delete(id);
      if (deleted) {
        listeners.onDeleted?.({ taskId: id, projectId: task.project_id });
      }
      return deleted;
    },

    // Messages
    addMessage(input: CreateMessageInput) {
      return messageRepo.create(input);
    },

    getMessages(taskId: string, limit = 100, offset = 0) {
      return messageRepo.getByTask(taskId, limit, offset);
    },

    countMessages(taskId: string): number {
      return messageRepo.countByTask(taskId);
    },

    // Event registration stubs (Wave 2D)
    onCreated(handler: (e: TaskCreatedEvent) => void): void {
      listeners.onCreated = handler;
    },
    onTransitioned(handler: (e: TaskTransitionedEvent) => void): void {
      listeners.onTransitioned = handler;
    },
    onUpdated(handler: (e: TaskUpdatedEvent) => void): void {
      listeners.onUpdated = handler;
    },
    onDeleted(handler: (e: TaskDeletedEvent) => void): void {
      listeners.onDeleted = handler;
    },
  };
}

export type TaskService = ReturnType<typeof createTaskService>;
