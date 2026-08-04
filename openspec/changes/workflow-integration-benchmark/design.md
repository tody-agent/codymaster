# Design: Deterministic Workflow Integration Benchmark

## Context & Technical Approach

The planning contract, scoped autonomy policy, and Mode B lifecycle are now merged. This integration adds a deterministic benchmark that evaluates recorded workflow observations instead of calling a live model. Deterministic checks cover confirmation counts, rich-plan completeness, safety approvals, routing, and Mode B lifecycle evidence. Prompt-count and lifecycle-event counts are explicitly labeled proxies for token use and latency.

Assumptions:

- Verified: the three prerequisite changes are present on `origin/main` at `e61bdb3`.
- Verified: two independent tasks must select Mode E; dependent tasks must select serial Mode B.
- Verified: benchmark results must be reproducible without credentials or network access.
- Non-goal: infer actual model token consumption or wall-clock latency from static fixtures.

Two approaches were considered:

1. Run live model sessions and judge transcripts. This is realistic but nondeterministic, slow, and dependent on external credentials.
2. Evaluate typed baseline/current workflow fixtures, independently scan the shipped policy/skill/command artifacts, and execute the real Mode B coordinator with a deterministic harness. This is reproducible in CI and gives exact regression failures, so it is the selected approach.

## Proposed Changes

### `src/codybench/fixtures/workflow-integration.ts`

Define typed baseline and current observations for the six required scenarios: micro bug, multi-step feature, ambiguous scope, destructive/production action, two independent tasks, and dependent tasks.

### `src/codybench/suites/workflow-integration.ts`

Export `evaluateWorkflowFixtures(version)` and `workflowIntegrationSuite`. The evaluator returns per-scenario violations plus deterministic metrics for confirmations, plan completeness, safety, routing, and Mode B lifecycle coverage. Negative fixtures prove malformed lifecycle order, duplicate task coverage, and invalid parallel batches fail. Current scoring also consumes independent shipped-artifact checks and an executable Mode B probe.

### `test/workflow-integration-benchmark.test.ts`

Prove the current fixtures satisfy every invariant, the baseline records measurable regressions, the suite emits baseline/current scores, and canonical/distributed Mode E guidance remains synchronized at the two-task threshold.

### CLI, skills, and docs

Register `workflow-integration` in `cm bench`, add it to `codybench/config.json`, correct Mode E from `3+` to `2+` independent tasks, synchronize generated platform skill copies, and document benchmark interpretation and baseline/current results.

## Verification

- `npx vitest run test/workflow-integration-benchmark.test.ts` — all benchmark regression tests pass.
- `npx vitest run test/workflow-integration-benchmark.test.ts` — canonical plus all 14 platform Mode E copies use the two-independent-task threshold; unrelated pre-existing whole-distribution drift is outside this change.
- `npm run test:gate:kit` — build, validators, targeted distribution guards, and all tests pass with zero failures.
