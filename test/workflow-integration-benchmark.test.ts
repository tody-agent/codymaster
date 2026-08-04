import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import {
  combineCurrentWorkflowEvidence,
  evaluateWorkflowFixtures,
  isCompletePlanTask,
  runModeBIntegrationProbe,
  workflowIntegrationSuite,
} from '../src/codybench/suites/workflow-integration';
import {
  evaluateWorkflowContractArtifacts,
} from '../src/codybench/artifacts/workflow-contracts';
import {
  workflowIntegrationFixtures,
  type WorkflowScenarioFixture,
} from '../src/codybench/fixtures/workflow-integration';

const REPO_ROOT = path.resolve(__dirname, '..');

describe('workflow integration benchmark', () => {
  it('covers every required deterministic scenario without current regressions', () => {
    const result = evaluateWorkflowFixtures('current');

    expect(result.scenarios.map(scenario => scenario.id)).toEqual([
      'micro-bug',
      'multi-step-feature',
      'ambiguous-scope',
      'destructive-production',
      'independent-tasks',
      'dependent-tasks',
    ]);
    expect(result.violations).toEqual([]);
    expect(result.metrics.scenario_count).toBe(6);
    expect(result.metrics.confirmation_prompts_total).toBe(3);
    expect(result.metrics.max_normal_flow_confirmations).toBe(1);
    expect(result.metrics.complete_plan_task_pct).toBe(100);
    expect(result.metrics.routing_accuracy_pct).toBe(100);
    expect(result.metrics.mode_b_lifecycle_coverage_pct).toBe(100);
    expect(result.metrics.safety_approval_coverage_pct).toBe(100);
    expect(result.metrics.deterministic_checks_passed_pct).toBe(100);
  });

  it('records an intentionally weaker baseline for before-versus-after comparison', () => {
    const baseline = evaluateWorkflowFixtures('baseline');
    const current = evaluateWorkflowFixtures('current');

    expect(baseline.violations.length).toBeGreaterThan(0);
    expect(baseline.score).toBeLessThan(current.score);
    expect(baseline.metrics.confirmation_prompts_total)
      .toBeGreaterThan(current.metrics.confirmation_prompts_total);
    expect(baseline.metrics.interaction_turn_proxy)
      .toBeGreaterThan(current.metrics.interaction_turn_proxy);
    expect(baseline.metrics.complete_plan_task_pct).toBeLessThan(100);
    expect(baseline.metrics.safety_approval_coverage_pct).toBeLessThan(100);
  });

  it('rejects malformed lifecycle order, duplicate task coverage, and invalid Mode E batches', () => {
    const fixtures = JSON.parse(JSON.stringify(workflowIntegrationFixtures)) as WorkflowScenarioFixture[];
    const independent = fixtures.find(fixture => fixture.id === 'independent-tasks')!;
    independent.current.parallelBatches = [['api', 'api'], ['docs']];
    const dependent = fixtures.find(fixture => fixture.id === 'dependent-tasks')!;
    dependent.current.modeBTasks![0].lifecycle = [
      'implementer-self-review',
      'quality-review',
      'spec-review',
      'coordinator-verification',
    ];
    dependent.current.modeBTasks![1].taskId = 'contract';

    const result = evaluateWorkflowFixtures('current', fixtures);

    expect(result.violations).toEqual(expect.arrayContaining([
      expect.stringContaining('exactly one parallel batch'),
      expect.stringContaining('ordered review lifecycle'),
      expect.stringContaining('exactly once'),
    ]));
  });

  it('accepts a complete task that explicitly has no dependencies', () => {
    const task = JSON.parse(JSON.stringify(
      workflowIntegrationFixtures.find(fixture => fixture.id === 'multi-step-feature')!
        .current.planTasks![0],
    ));
    task.dependencies = [];

    expect(isCompletePlanTask(task)).toBe(true);
  });

  it('grounds current results in shipped planning, autonomy, and routing artifacts', () => {
    const current = evaluateWorkflowContractArtifacts(REPO_ROOT);
    const broken = evaluateWorkflowContractArtifacts(REPO_ROOT, {
      'skills/_shared/autonomy-policy.md': '# Policy without authorization rules',
    });

    expect(current.violations).toEqual([]);
    expect(current.passedChecks).toBe(current.totalChecks);
    expect(broken.violations).toEqual(expect.arrayContaining([
      expect.stringContaining('micro task zero approval'),
      expect.stringContaining('sensitive action approvals'),
    ]));
  });

  it('makes an executable Mode B probe failure lower every combined pass metric', () => {
    const fixtureResult = evaluateWorkflowFixtures('current');
    const artifacts = evaluateWorkflowContractArtifacts(REPO_ROOT);
    const combined = combineCurrentWorkflowEvidence(fixtureResult, artifacts, {
      passed: false,
      tasksCompleted: 1,
      distinctImplementers: 1,
      distinctAgentSessions: 2,
      lifecycleCoveragePct: 50,
      coordinatorVerificationCoveragePct: 50,
      dispatchRoles: [],
      traces: [],
    });

    expect(combined.score).toBeLessThan(100);
    expect(combined.metrics.deterministic_checks_passed_pct).toBeLessThan(100);
    expect(combined.violations).toContain('mode-b-probe: executable lifecycle probe failed');
  });

  it('emits reproducible CodyBench metrics for both fixture versions', async () => {
    const current = await workflowIntegrationSuite.run({
      projectPath: REPO_ROOT,
      withCodyMaster: true,
      runId: 'workflow-current',
    });
    const baseline = await workflowIntegrationSuite.run({
      projectPath: REPO_ROOT,
      withCodyMaster: false,
      runId: 'workflow-baseline',
    });

    expect(current.score).toBe(100);
    expect(current.metrics.deterministic_checks_passed_pct).toBe(100);
    expect(current.metrics.actual_mode_b_lifecycle_coverage_pct).toBe(100);
    expect(current.metrics.actual_mode_b_coordinator_verification_pct).toBe(100);
    expect(current.notes).toContain('deterministic');
    expect(baseline.score).toBeLessThan(current.score);
  });

  it('executes the real Mode B lifecycle serially for two dependent tasks', async () => {
    const probe = await runModeBIntegrationProbe(REPO_ROOT);

    expect(probe.passed).toBe(true);
    expect(probe.tasksCompleted).toBe(2);
    expect(probe.distinctImplementers).toBe(2);
    expect(probe.distinctAgentSessions).toBe(6);
    expect(probe.lifecycleCoveragePct).toBe(100);
    expect(probe.coordinatorVerificationCoveragePct).toBe(100);
    expect(probe.dispatchRoles).toEqual([
      'feature.1:implementer',
      'feature.1:spec-reviewer',
      'feature.1:quality-reviewer',
      'feature.2:implementer',
      'feature.2:spec-reviewer',
      'feature.2:quality-reviewer',
    ]);
  });

  it('rejects plan tasks with out-of-scope steps or broken RED to GREEN cycles', () => {
    const baseTask = workflowIntegrationFixtures.find(
      fixture => fixture.id === 'multi-step-feature',
    )!.current.planTasks![0];
    const outsideScope = JSON.parse(JSON.stringify(baseTask));
    outsideScope.steps[0].files = ['docs/outside-scope.md'];
    const orphanRed = JSON.parse(JSON.stringify(baseTask));
    orphanRed.steps = orphanRed.steps.filter(
      (step: { test_cycle: { phase: string } }) => step.test_cycle.phase !== 'green',
    );
    const greenBeforeRed = JSON.parse(JSON.stringify(baseTask));
    greenBeforeRed.steps.reverse();

    expect(isCompletePlanTask(outsideScope)).toBe(false);
    expect(isCompletePlanTask(orphanRed)).toBe(false);
    expect(isCompletePlanTask(greenBeforeRed)).toBe(false);
  });

  it('keeps the two-independent-task Mode E route synchronized for Codex', () => {
    const canonical = fs.readFileSync(
      path.join(REPO_ROOT, 'skills/cm-execution/SKILL.md'),
      'utf8',
    );
    const modeE = fs.readFileSync(
      path.join(REPO_ROOT, 'skills/cm-execution/references/mode-e-triz-parallel.md'),
      'utf8',
    );
    const codex = fs.readFileSync(
      path.join(REPO_ROOT, '.codex/skills/cm-execution/SKILL.md'),
      'utf8',
    );

    expect(canonical).toMatch(/2\+ independent tasks/i);
    expect(modeE).toMatch(/2\+ independent tasks/i);
    expect(codex).toBe(canonical);
  });

  it('guards the two-task Mode E threshold across every platform distribution', () => {
    const platformRoots = [
      '.aider', '.amazonq', '.amp', '.claude-desktop', '.claude', '.cline', '.codex',
      '.continue', '.copilot', '.cursor-plugin', '.gemini', '.kiro', '.opencode', '.windsurf',
    ];

    for (const platformRoot of platformRoots) {
      const skill = fs.readFileSync(
        path.join(REPO_ROOT, platformRoot, 'skills/cm-execution/SKILL.md'),
        'utf8',
      );
      const modeE = fs.readFileSync(
        path.join(REPO_ROOT, platformRoot, 'skills/cm-execution/references/mode-e-triz-parallel.md'),
        'utf8',
      );
      expect(skill, platformRoot).toMatch(/2\+ independent tasks/i);
      expect(skill, platformRoot).not.toMatch(/SPEED \+ QUALITY on 3\+ tasks/i);
      expect(modeE, platformRoot).toMatch(/2\+ independent tasks/i);
      expect(modeE, platformRoot).not.toMatch(/Use when: 3\+ tasks/i);
    }
  });

  it('guards the shared autonomy policy across every platform distribution', () => {
    const canonical = fs.readFileSync(
      path.join(REPO_ROOT, 'skills/_shared/autonomy-policy.md'),
      'utf8',
    );
    const platformRoots = [
      '.aider', '.amazonq', '.amp', '.claude-desktop', '.claude', '.cline', '.codex',
      '.continue', '.copilot', '.cursor-plugin', '.gemini', '.kiro', '.opencode', '.windsurf',
    ];

    for (const platformRoot of platformRoots) {
      const policy = fs.readFileSync(
        path.join(REPO_ROOT, platformRoot, 'skills/_shared/autonomy-policy.md'),
        'utf8',
      );
      const execution = fs.readFileSync(
        path.join(REPO_ROOT, platformRoot, 'skills/cm-execution/SKILL.md'),
        'utf8',
      );
      expect(policy, platformRoot).toBe(canonical);
      expect(execution, platformRoot).toMatch(/\.\.\/_shared\/autonomy-policy\.md/);
    }
  });
});
