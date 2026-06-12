import { describe, it, expect } from 'vitest';
import { generateTaskEnvelope } from '../src/agent-dispatch';
import type { Project, Task } from '../src/data';

function makeProject(): Project {
  return {
    id: 'project-1',
    name: 'Demo Project',
    path: '/tmp/demo-project',
    agents: ['codex'],
    createdAt: '2026-05-13T00:00:00.000Z',
  };
}

function makeTask(): Task {
  return {
    id: 'task-1',
    projectId: 'project-1',
    title: 'Fix Codex dispatch',
    description: 'Make the generated command work with current Codex CLI.',
    column: 'backlog',
    order: 0,
    priority: 'high',
    agent: 'codex',
    skill: 'cm-code-review',
    createdAt: '2026-05-13T00:00:00.000Z',
    updatedAt: '2026-05-13T00:00:00.000Z',
  };
}

describe('generateTaskEnvelope', () => {
  it('returns compact structured JSON for agents', () => {
    const envelope = generateTaskEnvelope(makeTask(), makeProject(), 6969) as {
      schema: string;
      execution: { workspace: string; skill: string | null; doneCriteria: string[] };
      progressReporting: { done: { path: string; body: { column: string } } };
    };

    expect(envelope.schema).toBe('codymaster-task@2');
    expect(envelope.execution.workspace).toBe('/tmp/demo-project');
    expect(envelope.execution.skill).toBe('cm-code-review');
    expect(envelope.execution.doneCriteria.length).toBeGreaterThan(1);
    expect(envelope.progressReporting.done.path).toBe('/api/tasks/task-1/move');
    expect(envelope.progressReporting.done.body.column).toBe('done');
  });
});
