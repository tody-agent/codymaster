# Parallel Execution Modes

> Batch, subagent, TRIZ-parallel, and RARV autonomous modes. This guide teaches you how to execute tasks efficiently with CodyMaster's various execution modes.

## Table of Contents

1. [Overview](#overview)
2. [Mode Selection](#mode-selection)
3. [Mode A: Batch Execution](#mode-a-batch-execution)
4. [Mode B: Subagent-Driven](#mode-b-subagent-driven)
5. [Mode C: Parallel Dispatch](#mode-c-parallel-dispatch)
6. [Mode D: Autonomous RARV](#mode-d-autonomous-rarv)
7. [Mode E: TRIZ-Parallel](#mode-e-triz-parallel)
8. [Mode F: Party (Persona Rotation)](#mode-f-party-persona-rotation)
9. [Best Practices](#best-practices)

---

## Overview

### Why Multiple Modes?

Different task structures require different execution strategies:

- **Sequential tasks** → Batch execution
- **Independent tasks** → Parallel dispatch
- **Complex tasks** → Subagent-driven
- **Autonomous work** → RARV loop
- **Speed + quality** → TRIZ-parallel

### Skills Used

| Mode | Skill | Purpose |
|------|-------|---------|
| All | `cm-execution` | Execute plans |
| A-C, E | `cm-tdd` | Test-driven development |
| All | `cm-quality-gate` | Verify quality |

---

## Mode Selection

```
Have a plan with independent tasks?
├── Need SPEED + QUALITY on 3+ tasks?
│   └── YES → Mode E: TRIZ-Parallel ⚡ (recommended)
├── Stay in this session?
│   ├── YES → Mode B: Subagent-Driven
│   └── NO → Mode A: Batch Execution
└── Multiple independent failures/problems?
    └── YES → Mode C: Parallel Dispatch
```

| Mode | When | Strategy |
|------|------|----------|
| **A: Batch** | Plan with checkpoints | Execute 3 tasks → report → feedback → next batch |
| **B: Subagent** | Plan with independent tasks, same session | Fresh subagent per task + 2-stage review |
| **C: Parallel** | 2+ independent problems | One agent per problem domain |
| **D: RARV** | Autonomous execution | Continuous Reason → Act → Reflect → Verify |
| **E: TRIZ-Parallel** ⚡ | 3+ independent tasks, need speed + quality | Dependency-aware parallel dispatch |
| **F: Party** | One non-trivial task, want multi-perspective | Single agent rotates Architect → Engineer → Reviewer |

---

## Mode A: Batch Execution

### When to Use

- Plan with checkpoints
- Need feedback between batches
- Tasks have dependencies

### Process

```bash
# Start batch execution
/cm-execution --mode a

# This will:
# 1. Execute 3 tasks
# 2. Report results
# 3. Wait for feedback
# 4. Execute next 3 tasks
# 5. Repeat until done
```

### Example

```bash
# Batch 1: Tasks 1-3
/cm-execution --mode a

# Output:
# ✅ Task 1: Create auth types
# ✅ Task 2: Implement login API
# ✅ Task 3: Create login form
#
# Batch complete. Ready for next batch.

# Review and provide feedback
/cm-continuity update --feedback "Looks good, proceed with batch 2"

# Batch 2: Tasks 4-6
/cm-execution --mode a
```

### Rules

- Follow plan steps exactly
- Don't skip verifications
- Between batches: report and wait
- Stop when blocked, don't guess

---

## Mode B: Subagent-Driven

### When to Use

- Plan with independent tasks
- Same session
- Want fresh perspective per task

### Process

```bash
# Start subagent execution
/cm-execution --mode b

# This will:
# 1. Read plan
# 2. For each task:
#    - Dispatch implementer subagent
#    - Answer questions if any
#    - Subagent implements, tests, commits
#    - Dispatch spec reviewer
#    - Dispatch code quality reviewer
# 3. After all tasks → final code review
```

### Prompt Template (Implementer)

```markdown
Implement [TASK_NAME]:

[Full task text from plan]

Context: [Where this fits in the project]

Rules:
- Follow TDD (cm-tdd)
- Commit when done
- Self-review before reporting
- Ask questions if unclear

Return: Summary of what you did + test results
```

### Example

```bash
# Dispatch implementer
/cm-execution --mode b --task "Create auth types"

# Subagent implements
# - Creates src/types/auth.ts
# - Writes tests
# - Commits changes
# - Reports completion

# Dispatch reviewer
/cm-code-review --scope "auth types"
```

### Red Flags

- Never start on main/master without consent
- Never skip reviews (spec OR quality)
- Never dispatch parallel implementers (conflicts)
- Never accept "close enough" on spec compliance

---

## Mode C: Parallel Dispatch

### When to Use

- 3+ test files failing with different root causes
- Multiple subsystems broken independently
- Each problem doesn't need context from others

### Process

```bash
# Start parallel dispatch
/cm-execution --mode c

# This will:
# 1. Group failures by independent domain
# 2. Create focused agent prompt per domain
# 3. Dispatch in parallel
# 4. Review + integrate
```

### Example

```bash
# Multiple failures
npm run test:run
# ✗ test/api/login.test.ts
# ✗ test/api/signup.test.ts
# ✗ test/components/Button.test.ts

# Parallel dispatch
/cm-execution --mode c

# Output:
# 🔀 Dispatching 3 parallel agents:
# Agent 1: Fix login.test.ts
# Agent 2: Fix signup.test.ts
# Agent 3: Fix Button.test.ts
#
# Waiting for all agents...
# ✅ Agent 1: Fixed login.test.ts
# ✅ Agent 2: Fixed signup.test.ts
# ✅ Agent 3: Fixed Button.test.ts
#
# Integrating changes...
# Running full test suite...
# ✅ All tests passing
```

### Common Mistakes

- ❌ Too broad: "Fix all the tests"
- ✅ Specific: "Fix agent-tool-abort.test.ts"
- ❌ No context: "Fix the race condition"
- ✅ Context: Paste error messages + test names

---

## Mode D: Autonomous RARV

### When to Use

- User runs `/cm-start` with a goal
- `cm-tasks.json` exists with backlog items
- You want continuous autonomous execution

### Process (RARV Cycle)

```
LOOP until backlog empty or user interrupts:
  1. REASON  → Read cm-tasks.json → pick highest-priority task
  2. ACT     → Execute using the task's assigned CM skill
  3. REFLECT → Update cm-tasks.json with results
  4. VERIFY  → Run tests/checks (cm-quality-gate)
  5. NEXT    → Recalculate stats, pick next task
```

### Example

```bash
# Start autonomous execution
/cm-start "Add user authentication"

# Output:
# 🚀 Starting autonomous execution...
# 
# REASON: Selected "Create auth types" (priority: high)
# ACT: Implementing auth types...
# REFLECT: Task completed, updating cm-tasks.json
# VERIFY: Running tests... ✅ PASSED
# 
# REASON: Selected "Implement login API" (priority: high)
# ACT: Implementing login API...
# REFLECT: Task completed, updating cm-tasks.json
# VERIFY: Running tests... ✅ PASSED
# 
# ... continues until all tasks done ...
# 
# ✅ All tasks completed!
# 📊 Summary:
# - 5 tasks completed
# - 0 tasks blocked
# - 15 tests passing
# - Quality gate: PASSED
```

### cm-tasks.json Update Protocol

After EVERY phase, you MUST:
1. Read current `cm-tasks.json`
2. Sync state from `openspec/changes/[initiative-name]/tasks.md`
3. Find the active task by `id`
4. Update `status`, `logs[]`, timestamps
5. Recalculate `stats` object
6. Write back to `cm-tasks.json`

### Rules

- **Max 3 retries** per task before marking "blocked"
- **Always log** — the dashboard reads logs in real-time
- **Don't batch-skip** — execute one task at a time through full RARV
- **Respect interrupts** — if user sends a message, pause and respond

---

## Mode E: TRIZ-Parallel ⚡

### When to Use

- 3+ tasks that can potentially run in parallel
- Speed is important but quality cannot be sacrificed
- Tasks are well-defined with clear file scope
- You need to maximize throughput without merge conflicts

### TRIZ Principles Applied

| # | Principle | How Applied |
|---|-----------|-------------|
| **#1** | Segmentation | Tasks split by file-dependency graph → only truly independent tasks run together |
| **#3** | Local Quality | Each agent runs its own mini quality gate before reporting |
| **#10** | Prior Action | Pre-flight check scans for file overlaps BEFORE dispatch |
| **#15** | Dynamicity | Batch size adapts: starts at 2, scales up after clean runs, down after conflicts |
| **#18** | Feedback | Real-time conflict detection via shared ledger of modified files |
| **#40** | Composite | Each agent = implementer + tester + reviewer (3 roles in 1) |

### Process

```bash
# Start TRIZ-parallel execution
/cm-execution --mode e

# This will:
# 1. ANALYZE: Extract file dependencies
# 2. GRAPH: Build dependency graph
# 3. ADAPT: Compute optimal batch size
# 4. PRE-FLIGHT: Check conflict ledger
# 5. DISPATCH: Send batch to agents
# 6. MONITOR: Detect conflicts in real-time
# 7. VERIFY: Each agent runs mini quality gate
# 8. RECORD: Update parallel history
```

### Example

```bash
# TRIZ-parallel execution
/cm-execution --mode e

# Output:
# ⚡ TRIZ-Parallel Mode
# 
# ANALYZE: Found 6 independent tasks
# GRAPH: 2 batches (3 + 3)
# ADAPT: Optimal batch size: 3 (based on history)
# PRE-FLIGHT: No conflicts detected
# 
# DISPATCHING BATCH 1:
# Agent 1: Create auth types (files: src/types/auth.ts)
# Agent 2: Create login form (files: src/components/auth/LoginForm.tsx)
# Agent 3: Create logout API (files: src/api/auth/logout.ts)
# 
# MONITORING: No conflicts detected
# VERIFY: All agents passed mini quality gate
# 
# DISPATCHING BATCH 2:
# Agent 4: Add protected routes (files: src/middleware/auth.ts)
# Agent 5: Update auth config (files: src/config/auth.ts)
# Agent 6: Add auth tests (files: test/auth/*.ts)
# 
# VERIFY: All agents passed mini quality gate
# 
# ✅ TRIZ-Parallel complete!
# 📊 Summary:
# - 6 tasks completed
# - 2 batches executed
# - 0 conflicts
# - Time: 45% faster than sequential
```

### Rules

- **Never dispatch conflicting tasks** — pre-flight must pass
- **Each agent must self-validate** — no "trust me it works"
- **Adaptive sizing is mandatory** — don't hardcode batch sizes
- **File scope is enforced** — agents must not modify files outside their scope
- **Conflict = halt** — stop further dispatch until conflict is resolved

---

## Mode F: Party (Persona Rotation)

### When to Use

- Task is non-trivial but small enough for one session
- You want multi-perspective scrutiny without paying for N subagents
- Quality matters more than raw speed

### Process

```bash
# Start party mode
/cm-execution --mode f

# This will:
# 1. ARCHITECT → Propose design/approach
# 2. ENGINEER → Implement against the design
# 3. REVIEWER → Critique implementation
# 4. (optional) SECURITY → Security review
# 5. SYNTHESIZE → Write final summary
```

### Example

```bash
# Party mode for a single task
/cm-execution --mode f --task "Add rate limiting to login endpoint"

# Output:
# 🎭 Party Mode
# 
# ROUND 1: ARCHITECT
# "I recommend using express-rate-limit with:
# - Window: 15 minutes
# - Max: 100 requests per window
# - Standard headers enabled
# - Custom error message"
# 
# ROUND 2: ENGINEER
# "Implemented rate limiting in src/api/auth/login.ts:
# - Added express-rate-limit
# - Configured per above
# - Added tests"
# 
# ROUND 3: REVIEWER
# "Verdict: PASS
# - Implementation matches design
# - Tests cover happy path and edge cases
# - Error message is user-friendly"
# 
# FINAL SYNTHESIS:
# "Rate limiting added to login endpoint with 15-minute window and 100 requests max. Implementation follows best practices with proper error handling and test coverage."
```

### Stop Conditions

- Reviewer verdict `pass` → done, write `final`
- Reviewer verdict `revise` → loop back to ENGINEER (max 2 revisions)
- Reviewer verdict `block` or 3rd revision → escalate to user, do not ship

### Rules

- **Never skip the reviewer round** — that defeats the point of party mode
- **Never edit a previous round** — append-only, like a journal
- **One agent the whole way** — do NOT dispatch subagents inside party mode
- **Persona files are the source of truth** — load them as system context

---

## Best Practices

### 1. Choose the Right Mode

```bash
# Quick check
if [ tasks -eq 1 ]; then
  mode="f"  # Party
elif [ tasks -le 3 ]; then
  mode="a"  # Batch
elif [ independent -eq true ]; then
  mode="e"  # TRIZ-Parallel
else
  mode="b"  # Subagent
fi
```

### 2. Start Small

```bash
# Start with batch mode
/cm-execution --mode a

# If too slow, try TRIZ-parallel
/cm-execution --mode e
```

### 3. Monitor Progress

```bash
# Check dashboard
/cm-dashboard

# Check status
/cm-status
```

### 4. Handle Failures

```bash
# If a task fails
/cm-continuity update --feedback "Task X failed: [reason]"

# Retry or skip
/cm-execution --mode a --retry "Task X"
```

### 5. Clean Up

```bash
# After completion
/cm-chain-archive

# Update memory
cm_natural("remember that TRIZ-parallel works well for independent tasks")
```

---

## Example: Complete Parallel Execution

### Scenario: Fix 5 failing tests

#### Step 1: Analyze

```bash
npm run test:run
# ✗ test/api/login.test.ts
# ✗ test/api/signup.test.ts
# ✗ test/components/Button.test.ts
# ✗ test/hooks/useAuth.test.ts
# ✗ test/utils/formatDate.test.ts
```

#### Step 2: Choose Mode

```bash
# 5 independent failures → TRIZ-parallel
/cm-execution --mode e
```

#### Step 3: Execute

```bash
# Output:
# ⚡ TRIZ-Parallel Mode
# 
# ANALYZE: 5 independent test failures
# GRAPH: 1 batch (all independent)
# ADAPT: Optimal batch size: 3 (first batch)
# 
# DISPATCHING BATCH 1:
# Agent 1: Fix login.test.ts
# Agent 2: Fix signup.test.ts
# Agent 3: Fix Button.test.ts
# 
# MONITORING: No conflicts
# VERIFY: All agents passed
# 
# DISPATCHING BATCH 2:
# Agent 4: Fix useAuth.test.ts
# Agent 5: Fix formatDate.test.ts
# 
# VERIFY: All agents passed
# 
# ✅ All tests fixed!
```

#### Step 4: Verify

```bash
npm run test:run
# ✅ All 5 tests passing

npm run test:gate
# ✅ All gates passed
```

#### Step 5: Commit

```bash
git add -p
git commit -m "fix: resolve 5 failing tests"
```

---

## Next Steps

- [Team Collaboration](./13-team-collaboration.md) — Coordinate parallel work
- [Vibe Coding Daily Loop](./03-vibe-coding-loop.md) — Daily rhythm
- [New Feature Development](./04-feature-development.md) — Feature workflow
