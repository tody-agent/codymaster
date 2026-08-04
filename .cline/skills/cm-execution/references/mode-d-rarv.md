# Mode D — Autonomous RARV

> Use when: `/cm-start` creates a goal plus a `cm-tasks.json` backlog and you want continuous autonomous execution.

## RARV Cycle

```
LOOP until backlog empty or user interrupts:

  1. REASON   Read cm-tasks.json → pick highest-priority backlog task
              Update status → "in_progress"
              Log: { phase: "REASON", message: "Selected: <title>" }

  2. ACT      Execute using the task's assigned CM skill
              (cm-tdd, cm-debugging, cm-safe-deploy, etc.)
              Log: { phase: "ACT", message: "<what was done>" }

  3. REFLECT  Update cm-tasks.json with results
              Log: { phase: "REFLECT", message: "<outcome>" }

  4. VERIFY   Run cm-quality-gate
              PASS → status = "done", completed_at = now()
              FAIL → rarv_cycles++ → retry from REASON
              rarv_cycles >= 2 → Skill Discovery Fallback:
                npx skills find "{task keywords}"
                Found + user approves → install, reset cycles = 0, retry
                Not found OR cycles >= 3 → status = "blocked"
              Log: { phase: "VERIFY", message: "✓ passed" | "✗ <error>" }

  5. NEXT     Recalculate stats → pick next task
```

## `cm-tasks.json` Update Protocol
After EVERY phase:
1. Read current `cm-tasks.json`.
2. Sync state from `openspec/changes/[initiative-name]/tasks.md`.
3. Find the active task by `id`.
4. Update `status`, append to `logs[]`, and set timestamps.
5. Recalculate `stats`:
   ```js
   stats.total = tasks.length
   stats.done = tasks.filter(t => t.status === 'done').length
   stats.in_progress = tasks.filter(t => t.status === 'in_progress').length
   stats.blocked = tasks.filter(t => t.status === 'blocked').length
   stats.backlog = tasks.filter(t => t.status === 'backlog').length
   stats.rarv_cycles_total = tasks.reduce((sum, t) => sum + (t.rarv_cycles || 0), 0)
   ```
6. Set `updated` to the current ISO timestamp.
7. Write back to `cm-tasks.json`.

## Rules
- Max 3 retries per task before marking `blocked`.
- Always log — the dashboard reads logs in real time.
- Do not batch-skip — execute one task at a time through full RARV.
- Respect interrupts — if the user sends a message, pause and respond.

## Common Mistakes
| Mistake | Fix |
|---|---|
| Skipping VERIFY when it obviously works | VERIFY is non-negotiable |
| Marking blocked after 1 fail | Try skill discovery first |
| Not updating stats after each phase | Dashboard will lie |
