---
name: cm-execution
description: "Use when executing implementation plans — choose mode: batch execution with checkpoints, subagent-per-task, or parallel dispatch for independent problems."
---

# Execution — Execute Plans at Scale

> **Three modes, one skill.** Choose based on task structure.

## Mode Selection

```
Have a plan with independent tasks?
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

---

## Mode A: Batch Execution

### Process
1. **Load plan** → review critically → raise concerns
2. **Execute batch** (default: 3 tasks)
   - Mark in_progress → follow steps → verify → mark complete
3. **Report** → show what was done + verification output
4. **Continue** → apply feedback → next batch
5. **Complete** → use `cm-code-review` to finish

### Rules
- Follow plan steps exactly
- Don't skip verifications
- Between batches: report and wait
- Stop when blocked, don't guess

---

## Mode B: Subagent-Driven Development

### Process
1. **Read plan** → extract ALL tasks with full text
2. **Per task:**
   - Dispatch implementer subagent with full task text
   - Answer subagent questions if any
   - Subagent implements, tests, commits, self-reviews
   - Dispatch spec reviewer → confirm matches spec
   - Dispatch code quality reviewer → confirm quality
   - If issues → implementer fixes → re-review → repeat
3. **After all tasks** → final code review → `cm-code-review`

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

### Red Flags
- Never start on main/master without consent
- Never skip reviews (spec OR quality)
- Never dispatch parallel implementers (conflicts)
- Never accept "close enough" on spec compliance

---

## Mode C: Parallel Dispatch

### When
- 3+ test files failing with different root causes
- Multiple subsystems broken independently
- Each problem doesn't need context from others

### Process
1. **Group failures** by independent domain
2. **Create focused agent prompt** per domain:
   - Specific scope (one file/subsystem)
   - Clear goal
   - Constraints (don't change other code)
   - Expected output format
3. **Dispatch in parallel**
4. **Review + integrate** → verify no conflicts → run full suite

### Common Mistakes
- ❌ Too broad: "Fix all the tests"
- ✅ Specific: "Fix agent-tool-abort.test.ts"
- ❌ No context: "Fix the race condition"
- ✅ Context: Paste error messages + test names

---

## Mode D: Autonomous RARV

> **Self-driving execution.** Tasks flow through Reason → Act → Reflect → Verify automatically.

### When
- User runs `/cm-start` with a goal
- `cm-tasks.json` exists with backlog items
- You want continuous autonomous execution

### Process (RARV Cycle)

```
LOOP until backlog empty or user interrupts:
  1. REASON  → Read cm-tasks.json → pick highest-priority backlog task
                Update task status to "in_progress"
                Log: { phase: "REASON", message: "Selected: <title>" }

  2. ACT     → Execute using the task's assigned CM skill
                (cm-tdd, cm-debugging, cm-safe-deploy, etc.)
                Log: { phase: "ACT", message: "<what was done>" }

  3. REFLECT → Update cm-tasks.json with results
                Log: { phase: "REFLECT", message: "<outcome summary>" }

  4. VERIFY  → Run tests/checks (cm-quality-gate)
                If PASS → status = "done", completed_at = now()
                If FAIL → rarv_cycles++, log error, retry from REASON
                If rarv_cycles >= 3 → status = "blocked"
                Log: { phase: "VERIFY", message: "✅ passed" or "❌ <error>" }

  5. NEXT    → Recalculate stats, pick next task
```

### cm-tasks.json Update Protocol

After EVERY phase, you MUST:
1. Read current `cm-tasks.json`
2. Find the active task by `id`
3. Update `status`, `logs[]`, timestamps
4. Recalculate `stats` object:
   ```
   stats.total = tasks.length
   stats.done = tasks.filter(t => t.status === 'done').length
   stats.in_progress = tasks.filter(t => t.status === 'in_progress').length
   stats.blocked = tasks.filter(t => t.status === 'blocked').length
   stats.backlog = tasks.filter(t => t.status === 'backlog').length
   stats.rarv_cycles_total = tasks.reduce((sum, t) => sum + (t.rarv_cycles || 0), 0)
   ```
5. Set `updated` to current ISO timestamp
6. Write back to `cm-tasks.json`

### Rules
- **Max 3 retries** per task before marking "blocked"
- **Always log** — the dashboard reads logs in real-time
- **Don't batch-skip** — execute one task at a time through full RARV
- **Respect interrupts** — if user sends a message, pause and respond

---

## Integration

| Skill | When |
|-------|------|
| `cm-git-worktrees` | REQUIRED: isolated workspace before starting |
| `cm-planning` | Creates the plan this skill executes |
| `cm-code-review` | Complete development after all tasks |
| `cm-tdd` | Subagents follow TDD for each task |
| `cm-quality-gate` | VERIFY phase uses this for validation |
| `cm-ui-preview` | RECOMMENDED: Preview UI on Google Stitch before implementing frontend tasks |

### Workflows
| Command | Purpose |
|---------|---------|
| `/cm-start` | Create tasks + launch RARV + open dashboard |
| `/cm-status` | Quick terminal progress summary |
| `/cm-dashboard` | Open browser dashboard |

## The Bottom Line

**Choose your mode. Execute systematically. Review at every checkpoint.**
