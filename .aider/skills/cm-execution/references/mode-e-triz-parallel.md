# Mode E — TRIZ-Parallel ★

> Use when: 3+ tasks can run in parallel, speed matters, and quality cannot be sacrificed.

## TRIZ Principles Applied

| # | Principle | How |
|---|---|---|
| 1 | Segmentation | Split by file dependency graph — only truly independent tasks run together |
| 3 | Local Quality | Each agent runs its own mini quality gate before reporting |
| 10 | Prior Action | Pre-flight checks file overlaps before dispatch |
| 15 | Dynamicity | Batch size adapts based on clean runs vs conflicts |
| 18 | Feedback | Conflict detection uses a shared ledger of modified files |
| 40 | Composite | Each agent acts as implementer + tester + reviewer |

## Process
```
1. ANALYZE     Extract file dependencies from task descriptions
2. GRAPH       Build dependency graph → group into independent batches
3. ADAPT       Read parallel history → compute optimal batch size
4. PRE-FLIGHT  Check conflict ledger for overlaps with running agents
5. DISPATCH    Send batch with quality contracts
6. MONITOR     Each agent reports modified files → detect conflicts
7. VERIFY      Each agent runs mini quality gate before reporting done
8. RECORD      Update parallel history for future batch sizing
```

## Quality Contract (per agent)
```markdown
You will:
- Modify ONLY these files: [list]
- Run tests for your scope before reporting done
- Report: { files_modified: [...], tests_passed: bool, summary: "..." }
- HALT and report if you need to touch a file outside your scope
```

## Persona
Read `references/persona-dispatch.md`. Typical default is engineer plus self-review responsibility.

## Rules
- Never dispatch conflicting tasks — pre-flight must pass.
- Each agent must self-validate.
- Adaptive sizing is mandatory.
- File scope is enforced.
- Conflict means halt until resolved.

## Common Mistakes
| Mistake | Fix |
|---|---|
| Assuming all tasks are independent | Always run dependency analysis |
| Skipping pre-flight to save time | Pre-flight prevents wasted work |
| Hardcoding batch size 5 | Start at 2 and let the system adapt |
| Continuing after first failure | Fix before the next batch |
