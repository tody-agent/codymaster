---
description: Professional code review — pre-review checklist, severity classification, and PR feedback handling
argument-hint: "[file or branch to review]"
---

# /review — Code Review Lifecycle

Complete code review workflow: self-review checklist → external review → handle feedback → iterate.

## Invocation

```
/review
/review src/auth/login.ts
```

## Workflow

### Step 1: Self-Review

Apply **cm-code-review** skill:
- Review against the original plan
- Check for common issues (naming, error handling, edge cases)
- Verify test coverage for changes
- Check for security vulnerabilities

### Step 2: Quality Check

Apply **cm-quality-gate** skill:
- 6-gate verification
- Report issues by severity: Critical → High → Medium → Low
- Critical issues block progress

### Step 3: Create Review Summary

```
## Code Review Summary

**Files changed**: [count]
**Lines added/removed**: +X / -Y

### Issues Found
- 🔴 Critical: [count]
- 🟠 High: [count]
- 🟡 Medium: [count]
- 🔵 Low: [count]

### Verdict
[APPROVE / REQUEST_CHANGES / NEEDS_DISCUSSION]
```

### Step 4: Suggest Next

- "All clear? → `/deploy staging`"
- "Need fixes? → Apply fixes, then `/review` again"
