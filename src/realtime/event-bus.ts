import { EventEmitter } from 'events';

export interface TaskEvent {
  type:
    | 'task.created'
    | 'task.updated'
    | 'task.transitioned'
    | 'task.deleted'
    | 'task.message'
    | 'task.completed'
    | 'task.failed'
    | 'task.cancelled';
  taskId: string;
  projectId: string;
  data: Record<string, unknown>;
}

export interface ActivityEvent {
  type: 'activity.added';
  activity: {
    id: string;
    type: string;
    message: string;
    projectId?: string;
    taskId?: string;
    actorType?: string;
    actorId?: string;
    meta?: unknown;
    createdAt: string;
  };
}

export interface AgentEvent {
  type: 'agent.heartbeat';
  runningTaskIds: string[];
}

export type DomainEvent = TaskEvent | ActivityEvent | AgentEvent;

export class EventBus extends EventEmitter {
  emit(event: string, data: DomainEvent): boolean {
    return super.emit(event, data);
  }

  on(event: string, listener: (data: DomainEvent) => void): this {
    return super.on(event, listener);
  }

  off(event: string, listener: (data: DomainEvent) => void): this {
    return super.off(event, listener);
  }

  emitTask(event: TaskEvent): void {
    this.emit('task', event);
    this.emit(event.type, event);
  }

  emitActivity(event: ActivityEvent): void {
    this.emit('activity', event);
    this.emit(event.type, event);
  }

  emitAgent(event: AgentEvent): void {
    this.emit('agent', event);
    this.emit(event.type, event);
  }
}

export const eventBus = new EventBus();
