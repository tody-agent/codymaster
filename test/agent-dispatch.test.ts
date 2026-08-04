import { describe, it, expect } from 'vitest';
import {
  buildAgentTaskCliCommand,
  generateModeBTaskEnvelope,
  generateTaskEnvelope,
} from '../src/agent-dispatch';
import type { Project, Task } from '../src/data';
import type { PlanTaskSpec } from '../src/handoff/contracts';

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

function makeTaskSpec(): PlanTaskSpec {
  return {
    id: '1.1',
    goal: 'Implement Mode B',
    deliverable: 'A reviewed orchestration lifecycle',
    files: [
      { path: 'src/mode-b-orchestrator.ts', action: 'create' },
      { path: 'test/mode-b-orchestrator.test.ts', action: 'create' },
    ],
    dependencies: ['PlanTaskSpec'],
    interfaces: {
      consumes: ['PlanTaskSpec'],
      produces: ['orchestrateModeB(options): Promise<ModeBRunResult>'],
    },
    acceptance_criteria: ['Spec review runs before quality review'],
    steps: [{
      id: '1.1.1',
      action: 'Write the lifecycle test',
      files: ['test/mode-b-orchestrator.test.ts'],
      test_cycle: {
        phase: 'red',
        command: 'npx vitest run test/mode-b-orchestrator.test.ts',
        expected_result: 'FAIL before the orchestrator exists',
      },
    }],
    verification: {
      command: 'npm run test:gate:kit',
      expected_result: 'All checks pass',
    },
    commit_boundary: 'Commit lifecycle and tests together',
  };
}

describe('generateModeBTaskEnvelope', () => {
  it('carries the complete task contract and bounded fresh context', () => {
    const task = makeTaskSpec();
    const envelope = generateModeBTaskEnvelope(task, makeProject(), {
      coordinationId: 'coord-1',
      role: 'implementer',
      attempt: 0,
      globalConstraints: ['Do not broaden scope'],
      repoInstructions: ['Follow AGENTS.md'],
      upstreamOutputs: [{ taskId: '1.0', output: 'Plan contract merged' }],
      priorReviewFeedback: [],
    });

    expect(envelope.schema).toBe('codymaster-subagent-task@1');
    expect(envelope.assignment.task).toEqual(task);
    expect(envelope.assignment.role).toBe('implementer');
    expect(envelope.assignment.allowedFiles).toEqual([
      'src/mode-b-orchestrator.ts',
      'test/mode-b-orchestrator.test.ts',
    ]);
    expect(envelope.context).toEqual({
      globalConstraints: ['Do not broaden scope'],
      interfaces: task.interfaces,
      repoInstructions: ['Follow AGENTS.md'],
      upstreamOutputs: [{ taskId: '1.0', output: 'Plan contract merged' }],
    });
    expect(envelope.verification).toEqual(task.verification);
    expect(envelope.coordination.parentId).toBe('coord-1');
  });

  it('builds a Codex command that reads stdin without command substitution', () => {
    const command = buildAgentTaskCliCommand('codex', '.agent-tasks/task.agent-task.md');

    expect(command).toBe('codex exec - < ".agent-tasks/task.agent-task.md"');
    expect(command).not.toContain('$(');
    expect(command).not.toContain('cat ');
  });

  it('rejects shell metacharacters in an agent task path', () => {
    expect(() => buildAgentTaskCliCommand('codex', 'task"; touch pwned; "'))
      .toThrow('Unsafe agent task path');
  });
});
