---
description: Build features with TDD discipline — test first, implement, verify through quality gates
argument-hint: "<feature to build or plan to execute>"
---

# /build — TDD Build Workflow

Execute implementation with TDD discipline: write tests → implement → verify through 6-gate quality system.

## Invocation

```
/build Execute the approved authentication plan
/build Add the payment integration feature
```

## Workflow

### Step 1: Setup

Check for an existing plan. If none exists, suggest `/plan` first.
Apply **cm-execution** skill to choose execution mode:
- Batch execution with checkpoints
- Subagent-per-task dispatch
- Parallel for independent problems

### Step 2: Implement with TDD

For each task, apply **cm-tdd** skill:
1. **RED** — Write a failing test
2. **GREEN** — Write minimal code to pass
3. **REFACTOR** — Clean up while tests stay green
4. Commit after each green cycle

### Step 3: Quality Gate

Apply **cm-quality-gate** skill:
- Static analysis
- Blind review (re-read without context)
- Anti-sycophancy check
- Security scan
- Test coverage verification
- Ship decision

### Step 4: Suggest Next

- "Ready for review? → `/review`"
- "Ready to deploy? → `/deploy`"
