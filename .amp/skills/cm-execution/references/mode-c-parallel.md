# Mode C — Parallel Dispatch

> Use when: 3+ test files fail with different root causes, or multiple subsystems break independently.

## Process
1. **Group failures** by independent domain.
2. **Create focused agent prompt** per domain:
   - Specific scope
   - Clear goal
   - Constraints
   - Expected output
3. **Dispatch in parallel**.
4. **Review and integrate** → verify no conflicts → run the full suite.

## Prompt Template (Focused)
```markdown
Fix [FILE / SUBSYSTEM].

Failure:
[paste error message + test name + relevant stack]

Constraints:
- Do not modify files outside [scope]
- Do not refactor unrelated code
- Add a regression test

Return: diff + test output
```

## Common Mistakes
| Too broad | Better |
|---|---|
| Fix all the tests | Fix `agent-tool-abort.test.ts` |
| Fix the race condition | Fix race in `worker.ts:processQueue` and include these 3 error lines |
| No reproduction context | Paste error messages + failing test names |

## When NOT to use Mode C
- Failures share one root cause → fix once, not N times.
- Tasks touch the same file → use Mode B serially or Mode E with a dependency graph.
