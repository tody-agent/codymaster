# Mode A — Batch Execution

> Use when: linear plan with checkpoints, no parallelism needed.

## Process
1. **Load plan** from `openspec/changes/[initiative-name]/tasks.md` and `design.md`, then review critically and raise concerns.
2. **Execute batch** (default: 3 tasks):
   - Mark `in_progress`
   - Follow the task steps
   - Verify the result
   - Mark `complete`
3. **Report** what was done and include verification output.
4. **Apply feedback** and continue with the next batch.
5. **Complete** with `cm-code-review`.
6. **Archive** manually: move the OpenSpec folder to `openspec/changes/archive/[date]-[name]/`.

## Rules
- Follow plan steps exactly.
- Do not skip verification.
- Between batches: report and wait.
- Stop when blocked. Do not guess.

## Common Mistakes
| Mistake | Fix |
|---|---|
| Executing 8 tasks in one batch | Stick to 3 and get feedback |
| Skipping verification to save time | Verification is the work |
| Guessing when blocked | Stop and ask the user |
