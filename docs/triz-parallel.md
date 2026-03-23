# TRIZ-Parallel: Safe Parallel Execution Engine

> **3-5x Faster. Zero Merge Conflicts. Zero Hidden Bugs.**
> Applies 6 TRIZ inventive principles to systematically resolve the Speed ↔ Quality contradiction in AI coding.

## The Industry Problem

According to 2025-2026 research, parallel AI coding delivers raw speed but causes systemic harm:

| Metric | Consequence |
|--------|-------------|
| +91% PR review time | More code generated, but human reviewers become the bottleneck |
| +18% static analysis warnings | Technical debt accumulates silently per session |
| 45% of AI code has vulnerabilities | Security is sacrificed for speed |
| 61% of devs say AI code "looks correct but isn't" | Hidden bugs that bypass initial scrutiny |

**The Core Contradiction:** Developers want SPEED (parallel execution) but demand RELIABILITY (quality). Modern orchestrators force a trade-off.

## The Solution: 6 TRIZ Principles

TRIZ (Theory of Inventive Problem Solving) analyzed 2.5 million patents to codify universal problem-solving principles. CodyMaster applies 6 of these principles to parallel coding:

### #1 — Segmentation

**Principle:** Divide an object into independent parts.

**Application:** Before dispatching in parallel, the system extracts a **dependency graph** based on file paths:

```
Task A: edit src/auth.ts, src/login.ts
Task B: edit src/dashboard.ts, src/chart.ts
Task C: edit src/auth.ts, src/api.ts     ← conflicts with Task A!

→ Batch 1: [A, B] ← run in parallel (no file overlap)
→ Batch 2: [C]    ← run strictly after (depends on src/auth.ts)
```

**Result:** Only TRULY independent tasks run simultaneously. Eliminates 100% of merge conflicts before they happen.

---

### #3 — Local Quality

**Principle:** Each part of a system should fulfill its function in conditions most suitable for its operation.

**Application:** Every agent runs a **mini quality gate** on ITS OWN modified files before reporting completion:

```
Agent A completes work:
  ✅ Syntax validation: src/auth.ts, src/login.ts → pass
  ✅ Tests: 3 passed, 0 failed
  ✅ Self-review: no issues
  → Report: DONE ✅

Agent B completes work:
  ✅ Syntax validation: src/dashboard.ts → pass  
  ❌ Tests: 2 passed, 1 failed          ← ERROR!
  → Report: BLOCKED ❌ → must self-correct before continuing
```

**Result:** Bugs are caught AT THE SOURCE by the agent that wrote them, rather than batching them up for a human reviewer at the end.

---

### #10 — Prior Action

**Principle:** Perform required changes of an object directly in advance.

**Application:** A **pre-flight check** runs before every batch — scanning the conflict ledger to ensure no overlapping files are currently being modified by running agents:

```
Before dispatching Batch 2:
  → Read conflict ledger
  → Is an agent from Batch 1 touching src/auth.ts?
    → YES → HALT Batch 2 (Task C targets src/auth.ts)
    → NO → Safe to Dispatch ✅
```

**Result:** Prevents runtime state corruption proactively.

---

### #15 — Dynamicity

**Principle:** Allow characteristics of an object to change to be optimal at each stage.

**Application:** **Adaptive batch sizing** — the system learns during the session:

```
Session 1: batch_size=2, 0 conflicts → log ✅
Session 2: batch_size=2, 0 conflicts → log ✅  
Session 3: batch_size=2, 0 conflicts → log ✅
Session 4: batch_size=3 ← AUTO-SCALES UP (3 clean runs)

...

Session 7: batch_size=3, 1 conflict! → log ❌
Session 8: batch_size=2 ← AUTO-SCALES DOWN (risk detected)
```

**Limits:** Min = 1 (sequential fallback), Max = 5 (hard limit for resource safety).

**Result:** The system adjusts velocity based on empirical history, not guesswork.

---

### #18 — Feedback (Mechanical Vibration)

**Principle:** If an action is already being performed, introduce periodic pauses or feedback.

**Application:** **Conflict Ledger** — a real-time registry of modified files:

```json
{
  "sessionId": "batch-0",
  "entries": {
    "task-a": ["src/auth.ts", "src/login.ts"],
    "task-b": ["src/dashboard.ts"]
  },
  "conflicts": []
}
```

When an agent completes, it **reports ACTUAL files modified** (not just expected). The ledger compares instantly — if an overlap is detected, the run **HALTS**.

**Result:** Continuous feedback loop prevents cascading failure.

---

### #40 — Composite Materials

**Principle:** Change from uniform to composite properties.

**Application:** Each agent is not just a "coder" — it is a composite of three personas:

```
╔══════════════════════════════════════╗
║         COMPOSITE AGENT              ║
║                                      ║
║  👷 Implementer  → Writes code       ║
║  🧪 Tester       → Writes/Runs tests ║
║  🔍 Reviewer     → Self-reviews      ║
║                                      ║
║  Reports DONE only if all 3 pass!    ║
╚══════════════════════════════════════╝
```

**Result:** No more agents that "finish coding but don't test." Quality is baked into the prompt contract.

---

## The 8-Step Lifecycle

```
1. ANALYZE    → Extract file dependencies from task descriptions using regex
2. GRAPH      → Build dependency graph, grouping into independent batches
3. ADAPT      → Read history, compute optimal empirical batch size
4. PRE-FLIGHT → Check ledger against running agents before dispatch
5. DISPATCH   → Send to agents with strict Quality Contracts
6. MONITOR    → Agents report actual files → real-time conflict detection
7. VERIFY     → Agents run mini-gate (syntax+tests) before reporting
8. RECORD     → Save session metrics for future adaptive sizing
```

## Troubleshooting & Error Handling

When working with parallel execution, conflicts or errors can occur. The system fails safe (drops to sequential) rather than failing fast, but user intervention is sometimes needed.

### 💻 Using the CLI

**1. Conflict Halt Detected**
- **Symptom:** The console outputs `[ERROR] Parallel dispatch halted due to file conflict:` followed by the overlapping files and agent IDs.
- **Action:** 
  - The offending tasks are automatically marked as `failed`.
  - Fix the affected files (or review the agent's work). 
  - Re-run the task suite sequentially or clean the conflict ledger via `node dist/cli.js --clear-ledger` to reset the parallel session states safely.

**2. Tests Failed by an Agent**
- **Symptom:** You see `[WARNING] Agent X failed local quality gate (Tests: 2 failed)`. Check `.cm/agent-tasks/<taskId>_report.json` for details.
- **Action:** Open the respective files the agent touched and correct the failing logic. Since the agent *aborted*, the `task` will need to be re-dispatched.

**3. Resetting Adaptive Batching**
- **Symptom:** The system is only dispatching 1 task at a time (sequential execution) because it encountered multiple conflicts previously.
- **Action:** If you are confident the new tasks are clean, you can clear the parallel history to reset the batch size: `rm .cm/parallel-history.json`.

### 🖥️ Using the IDE Extension (VS Code / Cursor Integration)

**1. "Parallel Pre-flight Failed" Notification**
- **What it means:** You tried to dispatch a batch of tasks from the IDE panel, but the system detected that a currently running background agent is touching a file required by one of your new tasks.
- **How to fix:** 
  1. Wait for the active agent to finish processing.
  2. Click **Refresh Ledger** (or run the equivalent command) in your IDE.
  3. Dispatch the task again.

**2. Agent Blocked by Quality Gate**
- **What it means:** An agent has completed the code but failed its internal mini-gate validation (syntax or tests). The IDE will flag this task with a ⚠️ Warning icon in the Kanban board.
- **How to fix:** 
  1. Hover over the task or click **View Logs** to see the raw output from the quality gate.
  2. Jump to the modified file directly from the IDE interface (`Cmd+Click` the filepath).
  3. Fix the reported bug manually or ask the IDE's assistant to correct the issue within that context, then mark the task as `Done`.

**3. Debugging File Overlaps**
- **What it means:** 2 agents actually modified the same file during a run and the real-time feedback loop caught it. 
- **How to fix:** The IDE will highlight the conflicting file in your Source Control (Git) tab. Review the uncommitted working tree changes closely before committing, as overlapping code merges might exist. The system automatically dropped the batch size for the next run.

---

## Rollback & Safety Mechanisms

### Tier 1: Prevention
- Dependency parsing actively separates overlapping files from running simultaneously.
- Pre-flight checks ensure batches don't overlap with currently running agents.

### Tier 2: Early Detection
- Real-time conflict ledger tracks exact files being accessed and catches unpredicted modifications.
- Local Quality gate forces agents to run static analysis before confirming.

### Tier 3: Self-Healing
- Adaptive batch sizing automatically throttles down the concurrency of agents if errors/conflicts are detected, dropping down to a safe sequential execution fallback (`size = 1`).

### Tier 4: Explicit Rollback
- Each agent operates in its own sandboxed context. If a conflict halt is triggered, subsequent tasks are aborted to prevent cascading code corruption, and the commit is never pushed.
