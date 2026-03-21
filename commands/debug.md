---
description: Systematic debugging — 4-phase root cause process with defense-in-depth verification
argument-hint: "<bug description or error message>"
---

# /debug — Systematic Debugging

4-phase systematic debugging: reproduce → isolate → fix → verify with defense-in-depth.

## Invocation

```
/debug TypeError: Cannot read property 'id' of undefined
/debug Login page shows blank after OAuth redirect
```

## Workflow

### Step 1: Reproduce

Apply **cm-debugging** skill:
1. Understand the error context
2. Reproduce the issue reliably
3. Identify the exact conditions

### Step 2: Root Cause Analysis

5-phase investigation:
1. **Observe** — Read error logs, stack traces
2. **Hypothesize** — Form 2-3 possible causes
3. **Test** — Write a test that reproduces the bug
4. **Isolate** — Narrow down to exact root cause
5. **Verify** — Confirm the root cause with evidence

### Step 3: Fix with TDD

1. Write a failing test that exposes the bug
2. Fix the code minimally
3. Confirm the test passes
4. Run full test suite to check for regressions

### Step 4: Defense-in-Depth

- Add error handling for similar cases
- Update documentation if needed
- Record learning in CONTINUITY.md

### Step 5: Suggest Next

- "Fixed? → `/review` to verify the fix"
- "Need broader changes? → `/plan`"
