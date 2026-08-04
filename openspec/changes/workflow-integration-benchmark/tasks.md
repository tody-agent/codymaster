# Implementation Checklist

### Task 1: Add the deterministic workflow benchmark

**Goal:** Measure the required workflow invariants from reproducible baseline and current fixtures.
**Deliverable:** A typed evaluator, six scenario fixtures, CLI registration, and focused tests that can pass review independently.
**Files:**
- Create: `src/codybench/fixtures/workflow-integration.ts`
- Create: `src/codybench/suites/workflow-integration.ts`
- Create: `test/workflow-integration-benchmark.test.ts`
- Modify: `src/cli/commands/bench.ts`
- Modify: `codybench/config.json`
**Dependencies:** `PlanTaskSpec` from `src/handoff/contracts.ts`; `EvalSuite`, `EvalResult`, and `EvalContext` from `src/codybench/types.ts`.
**Interfaces:** Produces `evaluateWorkflowFixtures(version: WorkflowVersion): WorkflowBenchmarkResult` and `workflowIntegrationSuite: EvalSuite`; consumes typed workflow fixture observations.
**Acceptance criteria:** Six required scenarios are present; current results have zero violations; ordinary multi-step confirmation count is at most one; baseline results show confirmation, planning, lifecycle, routing, or safety regressions; token/latency metrics are named as proxies.

- [x] **Step 1 — Write the failing benchmark tests** in `test/workflow-integration-benchmark.test.ts` importing the missing evaluator and asserting all six scenario invariants.
- [x] **Step 2 — Prove RED.** Run `npx vitest run test/workflow-integration-benchmark.test.ts`. Expected: FAIL because `src/codybench/suites/workflow-integration.ts` does not exist.
- [x] **Step 3 — Add typed fixtures and the minimum evaluator** in `src/codybench/fixtures/workflow-integration.ts` and `src/codybench/suites/workflow-integration.ts`.
- [x] **Step 4 — Wire the suite into the CLI** in `src/cli/commands/bench.ts` and `codybench/config.json`.
- [x] **Step 5 — Prove GREEN.** Run `npx vitest run test/workflow-integration-benchmark.test.ts`. Expected: PASS with all workflow benchmark tests and zero failures.
- [x] **Step 6 — Commit boundary.** Commit fixtures, evaluator, CLI registration, config, and focused tests together with the integration documentation.

### Task 2: Correct routing drift and guard generated distributions

**Goal:** Make the canonical and distributed workflow guidance match the required two-independent-task Mode E route.
**Deliverable:** Corrected canonical guidance, synchronized platform copies, and benchmark documentation that can pass review independently.
**Files:**
- Modify: `skills/cm-execution/SKILL.md`
- Modify: `skills/cm-execution/references/mode-e-triz-parallel.md`
- Modify: `docs/workflows/engineering-pipeline.md`
- Modify: `docs/skills/orchestration.md`
- Create: `docs/benchmarks/workflow-integration.md`
- Modify: generated `cm-execution` copies under supported platform directories through `npm run sync:all`
**Dependencies:** Task 1 benchmark invariants and `scripts/build-skills.mjs` platform synchronization contract.
**Interfaces:** Consumes Mode E routing guidance; produces identical canonical/platform skill content and deterministic benchmark interpretation.
**Acceptance criteria:** Two independent non-overlapping tasks route to Mode E after conflict pre-flight; dependent tasks route to serial Mode B; the Mode E threshold matches across all 14 generated distributions; docs distinguish deterministic metrics from token/latency proxies.

- [x] **Step 1 — Extend the failing test** to assert canonical and Codex-distributed guidance says `2+` independent tasks.
- [x] **Step 2 — Prove RED.** Run `npx vitest run test/workflow-integration-benchmark.test.ts`. Expected: FAIL because canonical Mode E guidance still says `3+`.
- [x] **Step 3 — Correct canonical routing and write benchmark docs** in the exact files listed above.
- [x] **Step 4 — Synchronize the changed routing guidance.** Run the standard `npm run sync:all`, retain only the two changed `cm-execution` artifacts per platform, and avoid importing unrelated pre-existing skill drift. Expected: all 14 supported platform copies carry the canonical two-task threshold.
- [x] **Step 5 — Verify targeted distribution and benchmark gates.** Run `npx vitest run test/workflow-integration-benchmark.test.ts`. Expected: every platform threshold guard and benchmark test passes with zero failures.
- [x] **Step 6 — Verify the full repository.** Run `npm run test:gate:kit`. Expected: build and every validator/test suite exit 0 with zero failures.
- [x] **Step 7 — Commit boundary.** Include canonical skill, generated copies, docs, and fresh gate evidence in the integration commit/PR.
