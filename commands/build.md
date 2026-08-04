---
description: Build features with TDD discipline — test first, implement, verify through quality gates
argument-hint: "<feature to build or plan to execute>"
---

# /build — TDD Build Workflow

Execute implementation with TDD discipline: write tests → implement → verify through 6-gate quality system.

Follow [the shared autonomy policy](../skills/_shared/autonomy-policy.md). Reuse scoped execution authorization from an approved plan without re-approval.

## Invocation

```
/build Execute the approved authentication plan
/build Add the payment integration feature
```

## Workflow

### Step 1: Setup

Check for an existing plan and its authorization state:
- Approved plan → execute the authorized scope through verification without step/batch checkpoints.
- Clear, reversible micro task directly requested by the user → proceed with zero approval.
- Meaningful change without an approved plan → create or request a concise `/plan`, then ask for one approval at the plan-to-execution boundary.

Destructive actions, production deployment, secrets, payments, and external communication still require explicit approval for the specific action. Keep all existing security and deploy gates.

Apply **cm-execution** skill to choose execution mode:
- Linear batch execution with non-blocking status updates
- Subagent-per-task dispatch
- Parallel for independent problems

### Step 2: Implement with TDD

For each task, apply **cm-tdd** skill:
1. **RED** — Write a failing test
2. **GREEN** — Write minimal code to pass
3. **REFACTOR** — Clean up while tests stay green
4. Commit after each green cycle

After each cycle or batch, report status and continue inside the authorized scope. Pause only for a material scope change, evidence-backed blocker, or explicit-approval action.

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
