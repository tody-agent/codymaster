---
name: cm-execution
description: "Use when executing implementation plans — choose mode: batch execution with checkpoints, subagent-per-task, or parallel dispatch for independent problems."
---

# Execution — Execute Plans at Scale

> **Role: Lead Developer** — You execute implementation plans systematically with quality gates at every checkpoint.

> **Three modes, one skill.** Choose based on task structure.

## Step 0: Load Working Memory (MANDATORY)

Per `_shared/helpers.md#Load-Working-Memory`

After EACH completed task: Per `_shared/helpers.md#Update-Continuity`

### Pre-flight: Skill Coverage Audit

Before choosing execution mode, scan plan tasks for technology keywords:

```
1. Extract technologies/frameworks/tools from ALL task descriptions
2. Cross-reference with cm-skill-index Layer 1 triggers
3. Check installed external skills: npx skills list
4. If gap found → trigger Discovery Loop (cm-skill-mastery Part C)
   → npx skills find "{keyword}" → review → ask user → install
5. Log any installations to .cm-skills-log.json
6. Code Intelligence Context (cm-codeintell):
   → IF codegraph available: codegraph_context(task) for each task
   → IF modifying shared code: codegraph_impact(symbol, depth=2)
   → IF impact > 10 files: WARN "High impact change"
   → Inject context into agent prompts → agents skip grep/glob
7. Only proceed to Mode Selection after all gaps resolved
```

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
                If rarv_cycles >= 2 → attempt Skill Discovery Fallback:
                  → npx skills find "{task keywords}"
                  → If skill found + user approves → install, reset rarv_cycles = 0, retry
                  → If NOT found → rarv_cycles >= 3 → status = "blocked"
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

## Security Rules (Learned: March 2026)

> **Code that touches files, subprocesses, or the DOM MUST follow these rules. No exceptions.**

### Frontend — DOM Safety

| Pattern | Risk | Fix |
|---------|------|-----|
| `innerHTML = \`...\${data}...\`` | DOM XSS | `innerHTML = \`...\${esc(data)}...\`` |
| `innerHTML = variable` | DOM XSS | `textContent = variable` |
| `eval(input)` / `new Function(input)` | Code injection | Avoid entirely |
| `document.write(data)` | DOM XSS | Use DOM API |
| `el.setAttribute('on*', data)` | Event injection | `el.addEventListener()` |

**Always:** Escape before innerHTML, prefer `textContent`, validate URLs via allowlist.

### Backend — Python

| Pattern | Risk | Fix |
|---------|------|-----|
| `Path(user_input) / "file"` | Path Traversal | `safe_resolve(base, user_input)` |
| `subprocess.run(f"cmd {arg}", shell=True)` | Command Injection | `subprocess.run(["cmd", arg])` |
| `open(config["path"])` | Path Traversal | `safe_open(base, config["path"])` |
| `json.load()` → paths unvalidated | Path Traversal | Validate ALL paths from config via `safe_resolve()` |

**Always:** Import `safe_path`, validate EVERY path from CLI/config/API against a base directory.

### Backend — Express/Node

| Pattern | Risk | Fix |
|---------|------|-----|
| Missing `app.disable('x-powered-by')` | Info leak | Add after `express()` |
| No body size limit | DoS | `express.json({ limit: '1mb' })` |
| `path.resolve(userInput)` without validation | Path Traversal | Check null bytes + `relative_to(baseDir)` |
| `Object.assign(config, userInput)` | Prototype Pollution | Filter `__proto__`, `constructor` keys |



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
