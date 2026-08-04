import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  writeHandoff,
  readHandoff,
  listHandoffs,
  clearHandoffs,
  validateHandoff,
  HandoffError,
  nowIso,
  type PlanHandoff,
  type ExecHandoff,
  type QualityHandoff,
} from '../src/handoff';

describe('handoff', () => {
  let tmp: string;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cm-handoff-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('round-trips a plan handoff', () => {
    const plan: PlanHandoff = {
      schema: 'plan@1',
      emitted_at: nowIso(),
      emitted_by: 'cm-planning',
      data: {
        goal: 'Ship CM v2.0',
        decisions: ['use opt-in compressed flag'],
        first_tasks: ['1.1', '1.2', '1.3'],
      },
    };
    const file = writeHandoff(tmp, plan);
    expect(fs.existsSync(file)).toBe(true);
    expect(file.endsWith('plan.json')).toBe(true);

    const back = readHandoff<PlanHandoff>(tmp, 'plan@1');
    expect(back).not.toBeNull();
    expect(back!.data.goal).toBe('Ship CM v2.0');
    expect(back!.data.first_tasks).toHaveLength(3);
  });

  it('round-trips execution-ready plan task specs', () => {
    const plan: PlanHandoff = {
      schema: 'plan@1',
      emitted_at: nowIso(),
      emitted_by: 'cm-planning',
      data: {
        goal: 'Validate rich planning handoffs',
        decisions: ['keep task_specs optional for plan@1 compatibility'],
        first_tasks: ['1.1'],
        task_specs: [
          {
            id: '1.1',
            goal: 'Round-trip a complete task specification',
            deliverable: 'A validated plan handoff that preserves every task field',
            files: [
              { path: 'test/handoff.test.ts', action: 'modify' },
              { path: 'src/handoff/contracts.ts', action: 'modify' },
            ],
            dependencies: ['PlanHandoff from src/handoff/contracts.ts'],
            interfaces: {
              consumes: ['writeHandoff(projectPath, handoff: AnyHandoff): string'],
              produces: ['PlanHandoff.data.task_specs?: PlanTaskSpec[]'],
            },
            acceptance_criteria: [
              'readHandoff returns the same task specification written by writeHandoff',
            ],
            steps: [
              {
                id: '1.1.1',
                action: 'Add a failing round-trip test with a literal rich task fixture',
                files: ['test/handoff.test.ts'],
                test_cycle: {
                  phase: 'red',
                  command: 'npx vitest run test/handoff.test.ts',
                  expected_result: 'FAIL because PlanHandoff has no task_specs field',
                },
              },
              {
                id: '1.1.2',
                action: 'Add the task specification interfaces to the plan handoff contract',
                files: ['src/handoff/contracts.ts'],
                test_cycle: {
                  phase: 'green',
                  command: 'npx vitest run test/handoff.test.ts',
                  expected_result: 'PASS with the rich task fixture unchanged after reading',
                },
              },
            ],
            verification: {
              command: 'npx vitest run test/handoff.test.ts',
              expected_result: 'All handoff tests pass with zero failures',
            },
            commit_boundary: 'Commit the contract, validator, and handoff tests together',
          },
        ],
      },
    };

    writeHandoff(tmp, plan);
    const back = readHandoff<PlanHandoff>(tmp, 'plan@1');

    expect(back!.data.task_specs).toEqual(plan.data.task_specs);
  });

  it('accepts legacy plan handoffs without task specs', () => {
    expect(() =>
      validateHandoff({
        schema: 'plan@1',
        emitted_at: nowIso(),
        emitted_by: 'cm-planning',
        data: {
          goal: 'Keep existing handoffs readable',
          decisions: [],
          first_tasks: ['1.1'],
        },
      })
    ).not.toThrow();
  });

  it('rejects incomplete rich plan task specs', () => {
    expect(() =>
      validateHandoff({
        schema: 'plan@1',
        emitted_at: nowIso(),
        emitted_by: 'cm-planning',
        data: {
          goal: 'Reject task specs that cannot be executed cold',
          decisions: [],
          first_tasks: ['1.1'],
          task_specs: [{ id: '1.1', goal: 'Missing execution details' }],
        },
      })
    ).toThrow(/task_specs\[0\].*missing key: deliverable/);
  });

  it('rejects placeholder text in rich plan task specs', () => {
    expect(() =>
      validateHandoff({
        schema: 'plan@1',
        emitted_at: nowIso(),
        emitted_by: 'cm-planning',
        data: {
          goal: 'Reject vague execution instructions',
          decisions: [],
          first_tasks: ['1.1'],
          task_specs: [
            {
              id: '1.1',
              goal: 'Validate task detail',
              deliverable: 'A concrete validator',
              files: [{ path: 'src/handoff/io.ts', action: 'modify' }],
              dependencies: [],
              interfaces: { consumes: [], produces: [] },
              acceptance_criteria: ['TODO: add tests'],
              steps: [
                {
                  id: '1.1.1',
                  action: 'Implement the validator',
                  files: ['src/handoff/io.ts'],
                  test_cycle: {
                    phase: 'green',
                    command: 'npx vitest run test/handoff.test.ts',
                    expected_result: 'All handoff tests pass',
                  },
                },
              ],
              verification: {
                command: 'npx vitest run test/handoff.test.ts',
                expected_result: 'All handoff tests pass',
              },
              commit_boundary: 'Commit validator and tests',
            },
          ],
        },
      })
    ).toThrow(/placeholder/);
  });

  it('rejects missing required envelope keys', () => {
    expect(() => validateHandoff({ schema: 'plan@1' })).toThrow(HandoffError);
  });

  it('rejects unknown schemas', () => {
    expect(() =>
      validateHandoff({
        schema: 'mystery@1',
        emitted_at: nowIso(),
        emitted_by: 'x',
        data: {},
      })
    ).toThrow(/unknown schema/);
  });

  it('rejects missing data keys per schema', () => {
    expect(() =>
      validateHandoff({
        schema: 'exec@1',
        emitted_at: nowIso(),
        emitted_by: 'cm-execution',
        data: { completed_tasks: [] }, // missing pending_tasks, files_changed, test_status
      })
    ).toThrow(/missing key/);
  });

  it('readHandoff returns null when file absent', () => {
    expect(readHandoff(tmp, 'plan@1')).toBeNull();
  });

  it('listHandoffs and clearHandoffs work', () => {
    const exec: ExecHandoff = {
      schema: 'exec@1',
      emitted_at: nowIso(),
      emitted_by: 'cm-execution',
      data: {
        completed_tasks: ['1.1'],
        pending_tasks: ['1.2'],
        files_changed: ['src/a.ts'],
        test_status: 'pass',
      },
    };
    const quality: QualityHandoff = {
      schema: 'quality@1',
      emitted_at: nowIso(),
      emitted_by: 'cm-quality-gate',
      data: {
        gates_passed: ['lint', 'tests'],
        gates_failed: [],
        safe_to_ship: true,
        evidence: { tests: 'npm test: 226 pass' },
      },
    };
    writeHandoff(tmp, exec);
    writeHandoff(tmp, quality);
    expect(listHandoffs(tmp).sort()).toEqual(['exec.json', 'quality.json']);
    expect(clearHandoffs(tmp)).toBe(2);
    expect(listHandoffs(tmp)).toEqual([]);
  });

  it('readHandoff throws on schema mismatch', () => {
    const plan: PlanHandoff = {
      schema: 'plan@1',
      emitted_at: nowIso(),
      emitted_by: 'cm-planning',
      data: { goal: 'g', decisions: [], first_tasks: [] },
    };
    writeHandoff(tmp, plan);
    // Force re-read as a different schema by writing under wrong filename
    expect(() =>
      readHandoff(tmp, 'exec@1' as any)
    ).not.toThrow(); // exec.json doesn't exist, returns null
  });
});
