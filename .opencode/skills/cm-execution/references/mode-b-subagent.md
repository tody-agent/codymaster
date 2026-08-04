# Mode B — Subagent-Driven Development

> Use when an approved execution-ready plan has ordered or dependent tasks and the harness can create isolated subagent sessions.

## Capability pre-flight

Confirm that the harness can start a fresh session, resume the same implementer for fixes, and start independent reviewer sessions. Codex uses a new `codex exec` session for each initial role and resumes only the implementer session for fixes. Never emulate an independent review by asking the implementer to change persona.

If isolated subagents are unavailable, use Mode F for sequential persona rotation and disclose that review independence is reduced. If the harness cannot preserve even sequential role boundaries, use Mode A with coordinator-owned verification. Do not label either fallback Mode B.

## Input contract

Read `PlanHandoff.data.task_specs` from `.cm/handoff/plan.json`. Process tasks serially. Each initial implementer receives a `codymaster-subagent-task@1` envelope containing only:

- the complete `PlanTaskSpec`;
- global constraints and repository instructions;
- the task's consumed and produced interfaces;
- relevant upstream outputs;
- allowed files, verification requirements, role, and parent coordination ID.

Do not paste the full conversation, unrelated plan tasks, or another agent's summary into fresh context. A fix resumes the same implementer and adds only the current review findings.

## Required lifecycle

For each task, call the package entry point `codymaster/mode-b` (implemented by `src/mode-b-orchestrator.ts`):

1. Start a fresh implementer. It implements, tests, self-reviews, and returns the structured report.
2. The coordinator inspects actual changed files against `PlanTaskSpec.files`.
3. Start an independent spec reviewer. It checks literal acceptance criteria and interfaces before any quality review.
4. Only after spec approval, start an independent quality reviewer.
5. Return findings to the same implementer. After every fix, run spec review before quality review again.
6. Allow at most two fix/re-review cycles. A further rejection is a planning defect/blocker for the coordinator, not permission for an unbounded loop.
7. Run coordinator-owned verification from `task.verification`. Subagent summaries and self-reported tests are evidence to inspect, never completion proof.

The coordinator owns the final decision and processes one task at a time. Mode B never dispatches parallel implementers; use Mode E for independent tasks after its conflict pre-flight.

## Questions and authorization

Answer questions from the approved plan, repository instructions, interfaces, and relevant upstream output without interrupting the user. Resume the asking session with that answer. Ask the user only when the answer changes scope or authorization; follow `_shared/autonomy-policy.md` for destructive or sensitive actions.

## Report requirements

Every subagent returns JSON with `verdict`, `summary`, `modifiedFiles`, `findings`, and `selfReview`. Implementers must include a non-empty self-review. Reviewers must not modify files and must be independent from the implementer. Treat malformed reports, unauthorized actual file changes, backend failures, and failed fresh verification as blockers.

## Red flags

- Starting on `main` or `master` without consent.
- Running quality review before spec approval.
- Sending a finding to a new implementer instead of the original implementer.
- Trusting reported file lists without coordinator inspection.
- Exceeding two re-review cycles.
- Running Mode B tasks in parallel.
