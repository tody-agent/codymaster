import { describe, expect, it } from 'vitest';
import {
  AgentBackendModeBHarness,
  createAgentBackendModeBHarness,
  orchestrateModeB,
  type ModeBAgentReport,
  type ModeBHarnessAdapter,
  type ModeBTaskEnvelope,
} from '../src/mode-b-orchestrator';
import { generateModeBTaskEnvelope } from '../src/agent-dispatch';
import type { AgentBackend, AgentSession, ExecOptions } from '../src/agent/backend';
import type { Project } from '../src/data';
import type { PlanTaskSpec } from '../src/handoff/contracts';

const project: Project = {
  id: 'project-1',
  name: 'Demo',
  path: '/tmp/demo',
  agents: ['codex'],
  createdAt: '2026-08-04T00:00:00.000Z',
};

function makeTask(): PlanTaskSpec {
  return {
    id: '1.1',
    goal: 'Add a feature',
    deliverable: 'A tested feature',
    files: [
      { path: 'src/feature.ts', action: 'create' },
      { path: 'test/feature.test.ts', action: 'create' },
    ],
    dependencies: [],
    interfaces: { consumes: ['FeatureInput'], produces: ['feature(input): Result'] },
    acceptance_criteria: ['The feature returns the expected result'],
    steps: [{
      id: '1.1.1',
      action: 'Implement the feature with TDD',
      files: ['src/feature.ts', 'test/feature.test.ts'],
      test_cycle: {
        phase: 'red',
        command: 'npx vitest run test/feature.test.ts',
        expected_result: 'The focused test fails before implementation',
      },
    }],
    verification: {
      command: 'npx vitest run test/feature.test.ts',
      expected_result: 'The focused test passes',
    },
    commit_boundary: 'Commit feature and test together',
  };
}

function implementation(agentId = 'implementer-1', modifiedFiles = ['src/feature.ts']): ModeBAgentReport {
  return {
    agentId,
    verdict: 'pass',
    summary: 'Implemented and self-reviewed the feature',
    modifiedFiles,
    findings: [],
    selfReview: ['Reviewed the diff', 'Ran the focused test'],
  };
}

function review(
  agentId: string,
  verdict: 'pass' | 'changes_requested' = 'pass',
  message = 'Looks good',
): ModeBAgentReport {
  return {
    agentId,
    verdict,
    summary: message,
    modifiedFiles: [],
    findings: verdict === 'pass' ? [] : [{ severity: 'error', message }],
    selfReview: [],
  };
}

class FakeHarness implements ModeBHarnessAdapter {
  readonly envelopes: ModeBTaskEnvelope[] = [];
  private readonly reports: unknown[];

  constructor(reports: unknown[]) {
    this.reports = [...reports];
  }

  async dispatch(envelope: ModeBTaskEnvelope): Promise<unknown> {
    this.envelopes.push(envelope);
    return this.reports.shift();
  }
}

function run(
  harness: ModeBHarnessAdapter,
  inspectWorkspace: () => Promise<{ changedFiles: string[]; fingerprint: string }> = async () => ({
    changedFiles: ['src/feature.ts'],
    fingerprint: 'stable-after-implementation',
  }),
  verify = async (task: PlanTaskSpec) => ({
    passed: true,
    command: task.verification.command,
    evidence: '1 test passed',
  }),
  tasks: PlanTaskSpec[] = [makeTask()],
) {
  return orchestrateModeB({
    tasks,
    project,
    coordinationId: 'coord-1',
    globalConstraints: ['Stay within the approved plan'],
    repoInstructions: ['Follow AGENTS.md'],
    harness,
    inspectWorkspace,
    answerQuestion: async () => 'Use the interface already defined in the plan.',
    verify,
  });
}

describe('orchestrateModeB', () => {
  it('runs implementer, spec review, quality review, then fresh verification', async () => {
    const harness = new FakeHarness([
      implementation(),
      review('spec-reviewer-1'),
      review('quality-reviewer-1'),
    ]);

    const result = await run(harness);

    expect(result.status).toBe('completed');
    expect(harness.envelopes.map(envelope => envelope.assignment.role)).toEqual([
      'implementer',
      'spec-reviewer',
      'quality-reviewer',
    ]);
    expect(result.tasks[0].trace).toEqual([
      'implementation-passed',
      'spec-review-passed',
      'quality-review-passed',
      'verification-passed',
      'completed',
    ]);
    expect(result.tasks[0].verification?.evidence).toBe('1 test passed');
  });

  it('returns spec findings to the same implementer before re-review', async () => {
    const harness = new FakeHarness([
      implementation(),
      review('spec-reviewer-1', 'changes_requested', 'Missing acceptance criterion'),
      implementation(),
      review('spec-reviewer-2'),
      review('quality-reviewer-1'),
    ]);

    const result = await run(harness);

    expect(result.status).toBe('completed');
    expect(harness.envelopes.map(envelope => envelope.assignment.role)).toEqual([
      'implementer',
      'spec-reviewer',
      'implementer',
      'spec-reviewer',
      'quality-reviewer',
    ]);
    expect(harness.envelopes[2].coordination.targetAgentId).toBe('implementer-1');
    expect(harness.envelopes[2].assignment.priorReviewFeedback[0].message)
      .toBe('Missing acceptance criterion');
    expect(result.tasks[0].reviewCycles).toBe(1);
  });

  it('reruns spec review before quality review after a quality fix', async () => {
    const harness = new FakeHarness([
      implementation(),
      review('spec-reviewer-1'),
      review('quality-reviewer-1', 'changes_requested', 'Simplify the implementation'),
      implementation(),
      review('spec-reviewer-2'),
      review('quality-reviewer-2'),
    ]);

    const result = await run(harness);

    expect(result.status).toBe('completed');
    expect(harness.envelopes.map(envelope => envelope.assignment.role)).toEqual([
      'implementer',
      'spec-reviewer',
      'quality-reviewer',
      'implementer',
      'spec-reviewer',
      'quality-reviewer',
    ]);
    expect(result.tasks[0].reviewCycles).toBe(1);
  });

  it('blocks after two failed re-review cycles', async () => {
    const harness = new FakeHarness([
      implementation(),
      review('spec-reviewer-1', 'changes_requested', 'Spec issue 1'),
      implementation(),
      review('spec-reviewer-2', 'changes_requested', 'Spec issue 2'),
      implementation(),
      review('spec-reviewer-3', 'changes_requested', 'Spec issue 3'),
    ]);

    const result = await run(harness);

    expect(result.status).toBe('blocked');
    expect(result.tasks[0].reviewCycles).toBe(2);
    expect(result.tasks[0].blocker).toEqual({
      code: 'retry-exhausted',
      message: 'Task 1.1 still failed spec review after 2 re-review cycles; treat this as a planning defect.',
    });
    expect(harness.envelopes).toHaveLength(6);
  });

  it('blocks a malformed subagent report', async () => {
    const result = await run(new FakeHarness([{ verdict: 'pass' }]));

    expect(result.status).toBe('blocked');
    expect(result.tasks[0].blocker?.code).toBe('malformed-report');
  });

  it('blocks files outside the task contract before review', async () => {
    const harness = new FakeHarness([
      implementation('implementer-1', ['src/feature.ts']),
    ]);

    const result = await run(harness, async () => ({
      changedFiles: ['src/feature.ts', '../secrets.txt'],
      fingerprint: 'unauthorized',
    }));

    expect(result.status).toBe('blocked');
    expect(result.tasks[0].blocker).toEqual({
      code: 'unauthorized-file-touch',
      message: 'Coordinator inspection found unauthorized file from agent implementer-1: ../secrets.txt',
    });
    expect(harness.envelopes).toHaveLength(1);
  });

  it('blocks an actual reviewer workspace mutation even when its report claims no files', async () => {
    const harness = new FakeHarness([
      implementation(),
      review('spec-reviewer-1'),
    ]);
    const states = [
      { changedFiles: ['src/feature.ts'], fingerprint: 'after-implementation' },
      { changedFiles: ['src/feature.ts'], fingerprint: 'after-reviewer-edit' },
    ];

    const result = await run(harness, async () => states.shift()!);

    expect(result.status).toBe('blocked');
    expect(result.tasks[0].blocker).toEqual({
      code: 'unauthorized-file-touch',
      message: 'Spec reviewer spec-reviewer-1 modified the workspace.',
    });
  });

  it('turns a thrown coordinator verification into a structured blocker', async () => {
    const harness = new FakeHarness([
      implementation(),
      review('spec-reviewer-1'),
      review('quality-reviewer-1'),
    ]);

    const result = await run(harness, undefined, async () => {
      throw new Error('verification process failed to start');
    });

    expect(result.status).toBe('blocked');
    expect(result.tasks[0].blocker).toEqual({
      code: 'verification-failed',
      message: 'verification process failed to start',
    });
  });

  it('starts each serial task with a fresh implementer context', async () => {
    const secondTask = { ...makeTask(), id: '1.2' };
    const harness = new FakeHarness([
      implementation('implementer-1'),
      review('spec-reviewer-1'),
      review('quality-reviewer-1'),
      implementation('implementer-2'),
      review('spec-reviewer-2'),
      review('quality-reviewer-2'),
    ]);

    const result = await run(harness, undefined, undefined, [makeTask(), secondTask]);
    const implementerEnvelopes = harness.envelopes.filter(
      envelope => envelope.assignment.role === 'implementer',
    );

    expect(result.status).toBe('completed');
    expect(result.tasks.map(task => task.implementerId)).toEqual(['implementer-1', 'implementer-2']);
    expect(implementerEnvelopes).toHaveLength(2);
    expect(implementerEnvelopes.every(envelope => envelope.execution.freshContext)).toBe(true);
    expect(implementerEnvelopes.every(envelope => !envelope.coordination.targetAgentId)).toBe(true);
  });

  it('blocks a reused implementer session across tasks', async () => {
    const harness = new FakeHarness([
      implementation('implementer-1'),
      review('spec-reviewer-1'),
      review('quality-reviewer-1'),
      implementation('implementer-1'),
    ]);

    const result = await run(harness, undefined, undefined, [makeTask(), { ...makeTask(), id: '1.2' }]);

    expect(result.status).toBe('blocked');
    expect(result.tasks[1].blocker).toEqual({
      code: 'fresh-context-violation',
      message: 'Task 1.2 reused implementer session implementer-1 from an earlier task.',
    });
  });
});

describe('AgentBackendModeBHarness', () => {
  it('collects a streamed JSON report and resumes only the target session', async () => {
    let receivedPrompt = '';
    let receivedOptions: ExecOptions | undefined;
    const streamedReport = JSON.stringify({
      verdict: 'pass',
      summary: 'Fixed and reviewed',
      modifiedFiles: ['src/feature.ts'],
      findings: [],
      selfReview: ['Reviewed diff'],
    });
    const backend: AgentBackend = {
      name: 'test-backend',
      capabilities: { isolatedSessions: true, resumableSessions: true },
      detectVersion: async () => '1.0.0',
      execute: async (prompt, options): Promise<AgentSession> => {
        receivedPrompt = prompt;
        receivedOptions = options;
        return {
          messages: (async function* () {
            yield { type: 'text' as const, content: streamedReport, sessionId: 'implementer-session' };
          })(),
          result: Promise.resolve({
            status: 'completed',
            output: '',
            durationMs: 1,
          }),
          cancel: async () => {},
        };
      },
    };
    const adapter = new AgentBackendModeBHarness(backend);
    const envelope = generateModeBTaskEnvelope(makeTask(), project, {
      coordinationId: 'coord-1',
      role: 'implementer',
      attempt: 1,
      globalConstraints: [],
      repoInstructions: [],
      upstreamOutputs: [],
      priorReviewFeedback: [],
      targetAgentId: 'implementer-session',
    });

    const report = await adapter.dispatch(envelope) as ModeBAgentReport;

    expect(JSON.parse(receivedPrompt).schema).toBe('codymaster-subagent-task@1');
    expect(receivedOptions?.resumeSessionId).toBe('implementer-session');
    expect(report.agentId).toBe('implementer-session');
    expect(report.summary).toBe('Fixed and reviewed');
  });

  it('rejects a backend without isolated resumable sessions', () => {
    const backend: AgentBackend = {
      name: 'unsupported',
      detectVersion: async () => '1.0.0',
      execute: async () => { throw new Error('not called'); },
    };

    expect(() => new AgentBackendModeBHarness(backend))
      .toThrow('does not support isolated resumable sessions');
  });

  it('creates a Mode B adapter for the supported Codex backend', () => {
    expect(createAgentBackendModeBHarness('codex')).toBeInstanceOf(AgentBackendModeBHarness);
  });

  it('rejects Claude until its backend exposes a single safe session collector', () => {
    expect(() => createAgentBackendModeBHarness('claude-code'))
      .toThrow('does not support isolated resumable sessions');
  });
});
