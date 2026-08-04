# Mode A — Batch Execution

> Use when: linear plan, no parallelism needed.

Follow [`_shared/autonomy-policy.md`](../../_shared/autonomy-policy.md). The approved plan is scoped execution authorization for every in-scope batch.

## Process
1. **Load plan** from `openspec/changes/[initiative-name]/tasks.md` and `design.md`, then review critically and raise concerns.
2. **Execute batch** (default: 3 tasks):
   - Mark `in_progress`
   - Follow the task steps
   - Verify the result
   - Mark `complete`
3. **Update** with what was done, verification evidence, and what comes next.
4. **Continue** immediately with the next batch inside the authorized scope; incorporate feedback when the user provides it.
5. **Complete** with `cm-code-review`.
6. **Archive** manually: move the OpenSpec folder to `openspec/changes/archive/[date]-[name]/`.

## Rules
- Follow plan steps exactly.
- Do not skip verification.
- Between batches, send a non-blocking status update and continue.
- Pause only when evidence shows a blocker, a material plan change, or an explicit-approval action under the shared policy.
- Resolve routine in-scope choices using the plan and repository evidence; do not invent missing scope.

## Common Mistakes
| Mistake | Fix |
|---|---|
| Executing 8 tasks in one batch | Keep batches reviewable; report status after each batch |
| Skipping verification to save time | Verification is the work |
| Pausing for routine implementation choices | Use the authorized plan and repository evidence |
| Continuing after a material blocker | Pause once with evidence, recommendation, and default |
