---
name: cm-execution
description: "Use when executing implementation plans — choose mode: batch execution with checkpoints, subagent-per-task, or parallel dispatch for independent problems."
---

# Execution — Execute Plans at Scale

> **Three modes, one skill.** Choose based on task structure.

## Step 0: Load Working Memory (MANDATORY)

Before choosing execution mode, ALWAYS:

1. **Read** `.cm/CONTINUITY.md`
2. **Run Memory Audit** — decay check + conflict detection + integrity scan (see `cm-continuity`)
3. **Scope-filter learnings** — if working on module X:
   - Load from `.cm/learnings.json` ONLY where `scope == "global"` or `scope == "module:X"`
   - **NEVER** load `status = "invalidated"` (proven wrong — skip entirely)
   - **CAUTION** with `status = "corrected"` (was wrong, verify before applying)
   - **TRUST** high `reinforceCount` + recent `lastRelevant` (high confidence)
   - **VERIFY** `reinforceCount = 0` + old `lastRelevant` (low confidence — don't blindly follow)
   - SKIP learnings for other modules (reduces noise + saves tokens)
4. **Check** "Next Actions" — pick up where you left off

After EACH completed task, update CONTINUITY.md:
- Move task from "Next Actions" to "Just Completed"
- Record any new decisions in "Key Decisions" with scope tag
- If recording learning, reinforce existing instead of duplicating

> **Token savings:** Scope-filtered reading loads ~250 tokens instead of ~2,500.
> **Error prevention:** Never repeats a mistake already recorded.
> **Quality:** No stale/irrelevant learnings misleading the AI.

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
| **E: TRIZ-Parallel** ⚡ | 3+ independent tasks, need speed + quality | Dependency-aware parallel dispatch with per-agent quality gates |

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

## Mode E: TRIZ-Parallel ⚡

> **Speed AND quality.** 6 TRIZ principles resolve the contradiction.

### When
- 3+ tasks that can potentially run in parallel
- Speed is important but quality cannot be sacrificed
- Tasks are well-defined with clear file scope
- You need to maximize throughput without merge conflicts

### TRIZ Principles Applied

| # | Principle | How Applied |
|---|-----------|-------------|
| **#1** | Segmentation | Tasks split by file-dependency graph → only truly independent tasks run together |
| **#3** | Local Quality | Each agent runs its own mini quality gate (syntax + tests) before reporting |
| **#10** | Prior Action | Pre-flight check scans for file overlaps BEFORE dispatch |
| **#15** | Dynamicity | Batch size adapts: starts at 2, scales up after clean runs, down after conflicts |
| **#18** | Feedback | Real-time conflict detection via shared ledger of modified files |
| **#40** | Composite | Each agent = implementer + tester + reviewer (3 roles in 1) |

### Process

```
1. ANALYZE    → Extract file dependencies from task descriptions
2. GRAPH      → Build dependency graph, group into independent batches
3. ADAPT      → Read parallel history, compute optimal batch size
4. PRE-FLIGHT → Check conflict ledger for overlaps with running agents
5. DISPATCH   → Send batch to agents with quality contracts
6. MONITOR    → Each agent reports modified files → detect conflicts
7. VERIFY     → Each agent runs mini quality gate before reporting done
8. RECORD     → Update parallel history for future batch sizing
```

### Rules
- **Never dispatch conflicting tasks** — pre-flight must pass
- **Each agent must self-validate** — no "trust me it works"
- **Adaptive sizing is mandatory** — don't hardcode batch sizes
- **File scope is enforced** — agents must not modify files outside their scope
- **Conflict = halt** — stop further dispatch until conflict is resolved

### Common Mistakes
- ❌ "All tasks are independent" → Always run dependency analysis first
- ❌ "Skip pre-flight, save time" → Pre-flight prevents wasted agent work
- ❌ "Batch size 5 for everything" → Start at 2, let the system adapt
- ❌ "One task failed, continue anyway" → Fix before next batch

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
