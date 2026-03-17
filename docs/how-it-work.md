# How CodyMaster Works

> Complete workflow guide with diagrams, use cases, and exception handling.

---

## Core Architecture

```mermaid
graph TB
    subgraph "CodyMaster Framework"
        CLI["🖥️ CLI (cm)"]
        Dashboard["📊 Dashboard"]
        Skills["🧩 25+ Skills"]
        Memory["🧠 Working Memory"]
        Judge["🤖 Judge Agent"]
    end

    subgraph "AI Providers"
        AG["Google Antigravity"]
        CC["Claude Code"]
        CU["Cursor"]
        WS["Windsurf"]
        CL["Cline/RooCode"]
    end

    subgraph "Project"
        Code["💻 Codebase"]
        Tests["🧪 Tests"]
        Deploy["🚀 Production"]
    end

    CLI --> Skills
    Dashboard --> Skills
    Skills --> Memory
    Judge --> Skills
    Memory --> Code
    AG --> Skills
    CC --> Skills
    CU --> Skills
    WS --> Skills
    CL --> Skills
    Code --> Tests --> Deploy
```

---

## The RARV Execution Cycle

The heart of CodyMaster is the enhanced **RARV cycle** — a self-correcting autonomous execution loop:

```mermaid
graph TD
    O["0. ORIENT<br/>Read CONTINUITY.md<br/>Load past learnings"]
    R["1. REASON<br/>Pick highest-priority task<br/>Update working memory"]
    P["2. PRE-ACT ATTENTION<br/>🛡️ Goal alignment check<br/>3 questions"]
    A["3. ACT<br/>Execute with assigned skill<br/>Git checkpoint"]
    RE["4. REFLECT<br/>Update cm-tasks.json<br/>Update CONTINUITY.md"]
    V["5. VERIFY<br/>Run quality gate<br/>6-gate check"]
    D["✅ DONE<br/>Next task"]
    F["❌ FAIL<br/>Self-correction loop"]
    B["🚫 BLOCKED<br/>3+ failures → escalate"]

    O --> R --> P
    P -->|"Goal aligned"| A
    P -->|"Drift detected ⚠️"| R
    A --> RE --> V
    V -->|"Pass"| D --> O
    V -->|"Fail (attempt < 3)"| F --> O
    V -->|"Fail (attempt ≥ 3)"| B

    style O fill:#3b82f6,color:#fff
    style P fill:#f59e0b,color:#fff
    style D fill:#22c55e,color:#fff
    style F fill:#ef4444,color:#fff
    style B fill:#6b7280,color:#fff
```

### PRE-ACT ATTENTION — The Drift Preventer

Before every action, the agent asks itself 3 critical questions:

| # | Question | If NO |
|---|----------|-------|
| Q1 | Does my planned action serve the Active Goal? | Return to REASON |
| Q2 | Am I solving the original problem, not a tangent? | Return to REASON |
| Q3 | Have I seen this error pattern before in learnings? | Apply known prevention |

> **This single check prevents the #1 AI failure mode: goal drift.** Without it, AI agents frequently solve tangential problems instead of the actual task.

---

## The 6-Gate Quality System

```mermaid
graph LR
    G1["G1: Static Analysis<br/>0 warnings, 0 errors"]
    G2["G2: Test Coverage<br/>All pass, ≥80%"]
    G3["G3: Blind Review<br/>Context-isolated"]
    G4["G4: Anti-Sycophancy<br/>Devil's Advocate"]
    G5["G5: Security Scan<br/>No secrets, OWASP"]
    G6["G6: i18n Integrity<br/>Keys synchronized"]
    SHIP["🚀 SHIP"]

    G1 --> G2 --> G3 --> G4 --> G5 --> G6 --> SHIP

    style G3 fill:#8b5cf6,color:#fff
    style G4 fill:#ec4899,color:#fff
    style G5 fill:#ef4444,color:#fff
    style SHIP fill:#22c55e,color:#fff
```

**G3 (Blind Review):** Reviewer only sees the diff — no task description, no implementation context. Forces genuine code review.

**G4 (Anti-Sycophancy):** If G3 says "everything is fine," a Devil's Advocate pass actively hunts for hidden issues.

---

## The Judge Agent Protocol

```mermaid
graph TD
    T["Active Task"]
    T --> C1{"Status = done?"}
    C1 -->|Yes| COMPLETE["🏁 COMPLETE"]
    C1 -->|No| C2{"Stuck > 10min?"}
    C2 -->|Yes| ESCALATE["⚠️ ESCALATE"]
    C2 -->|No| C3{"Failures ≥ 3?"}
    C3 -->|Yes| PIVOT["🔄 PIVOT<br/>Suggest alternative skill"]
    C3 -->|No| C4{"Dispatch failed?"}
    C4 -->|Yes| ESCALATE
    C4 -->|No| CONTINUE["🟢 CONTINUE"]

    style COMPLETE fill:#22c55e,color:#fff
    style ESCALATE fill:#f59e0b,color:#fff
    style PIVOT fill:#3b82f6,color:#fff
    style CONTINUE fill:#22c55e,color:#fff
```

---

## Working Memory System

```mermaid
graph TB
    subgraph ".cm/ Directory"
        CM["CONTINUITY.md<br/>Active goal, task, context"]
        LJ["learnings.json<br/>Error patterns"]
        DJ["decisions.json<br/>Architecture decisions"]
        CF["config.yaml<br/>RARV settings"]
    end

    subgraph "How It Flows"
        S["🟢 Session Start"]
        W["💻 During Work"]
        E["🔴 Session End"]
        ER["❌ On Error"]
    end

    S -->|"Read"| CM
    S -->|"Check"| LJ
    W -->|"Update"| CM
    ER -->|"Capture"| LJ
    ER -->|"Record"| DJ
    E -->|"Save"| CM
```

**Protocol:**
1. **Session Start** → Read CONTINUITY.md + check learnings
2. **During Work** → Update current task, add completed items
3. **On Error** → Capture what failed + why + how to prevent
4. **Session End** → Save state for next session

---

## Progressive Disclosure (Token Savings)

```mermaid
graph TB
    L1["Layer 1: INDEX<br/>~100 tokens/skill<br/>Always loaded"]
    L2["Layer 2: SUMMARY<br/>~300 tokens/skill<br/>On demand"]
    L3["Layer 3: FULL SKILL.md<br/>~4000 tokens/skill<br/>Execution only"]

    L1 -->|"Match found?"| L2
    L2 -->|"Confirmed?"| L3

    style L1 fill:#22c55e,color:#fff
    style L2 fill:#f59e0b,color:#fff
    style L3 fill:#ef4444,color:#fff
```

| Approach | Tokens Used | Efficiency |
|----------|-------------|------------|
| Load all 25 skills | 100,000 | 0% saved |
| Progressive Disclosure | 6,300 | **93.7% saved** |

---

## Common Use Cases

### 1. Build a New Feature (Autonomous)

```bash
# Start autonomous execution
cm continuity init
/cm-start "Build user management with list, CRUD form, and role-based access"
```

```mermaid
graph LR
    Start["/cm-start"] --> Plan["cm-planning<br/>Write plan"]
    Plan --> Tasks["cm-execution<br/>Create tasks"]
    Tasks --> TDD["cm-tdd<br/>Write tests first"]
    TDD --> Code["ACT<br/>Implement"]
    Code --> Gate["cm-quality-gate<br/>6-gate verify"]
    Gate --> Deploy["cm-safe-deploy<br/>Ship to staging"]
```

### 2. Fix a Production Bug (Manual)

```bash
# Step 1: Investigate
@[/cm-debugging]   # Root cause analysis — don't guess, investigate

# Step 2: Fix with TDD
@[/cm-tdd]          # Write test that reproduces bug → fix → verify

# Step 3: Deploy safely
@[/cm-safe-deploy]  # 8-gate pipeline with rollback strategy
```

### 3. Setup New Project

```bash
# Verify identity first, then bootstrap
@[/cm-identity-guard]       # Ensure right GitHub/Cloudflare account
@[/cm-project-bootstrap]    # Full setup: design system, CI, staging, deploy
```

### 4. Mass Translation (i18n)

```bash
# Safe multi-language extraction
@[/cm-safe-i18n]  # Extract hardcoded strings → vi.json + en.json + th.json
```

### 5. CRO & Marketing Setup

```bash
# Full conversion tracking
@[/cm-ads-tracker]    # Meta Pixel + CAPI, TikTok, Google Ads, GTM
@[/cro-methodology]   # Funnel audit + A/B test design
```

---

## Exception Handling

### ❌ What if tests fail continuously?

```mermaid
graph TD
    FAIL["Test fails"] --> C1{"Attempt < 3?"}
    C1 -->|Yes| LEARN["Capture learning<br/>in CONTINUITY.md"]
    LEARN --> ROOT["cm-debugging<br/>Root cause investigation"]
    ROOT --> FIX["Fix with cm-tdd"]
    FIX --> RETRY["Retry RARV cycle"]
    C1 -->|No| BLOCK["Mark BLOCKED<br/>Judge: ESCALATE ⚠️"]
    BLOCK --> HUMAN["Notify user"]

    style BLOCK fill:#ef4444,color:#fff
    style LEARN fill:#3b82f6,color:#fff
```

**Rule:** Max 3 retries per task. After 3 failures → BLOCKED + ESCALATE to user.

### ❌ What if the agent drifts from the goal?

The **PRE-ACT ATTENTION** check catches this:
1. Agent re-reads Active Goal from CONTINUITY.md
2. If planned action doesn't serve the goal → drift logged → return to REASON
3. This happens **before every action**, not just at the start

### ❌ What if working memory is lost?

```bash
# CONTINUITY.md gets corrupted or deleted
cm continuity reset    # Reset CONTINUITY.md, learnings.json preserved
cm continuity init     # Re-create from scratch if needed
```

Learnings survive resets. Architecture decisions survive resets. Only the active session state is cleared.

### ❌ What if deploy fails?

```mermaid
graph LR
    FAIL["Deploy fails"] --> ROLL["cm-safe-deploy<br/>Auto-rollback"]
    ROLL --> LOG["Log to dashboard<br/>status: failed"]
    LOG --> LEARN["Capture learning"]
    LEARN --> FIX["Fix → re-run quality gates"]
    FIX --> DEPLOY["Re-deploy"]
```

The dashboard tracks all deployments with rollback history. Use `POST /api/deployments/:id/rollback` to rollback via API.

### ❌ What if the wrong agent is assigned?

The **Judge Agent** detects stuck tasks and the **Dynamic Agent Selection** API suggests the best agent:

```bash
curl http://localhost:6969/api/agents/suggest?skill=cm-tdd
# → { "domain": "engineering", "agents": ["claude-code", "cursor", "antigravity"] }
```

### ❌ What if quality gate is too strict?

Gates 1-2 (static analysis + tests) are **mandatory**. Gates 3-6 can be adjusted:
- G3 (Blind Review): Skip only if changes are < 10 lines
- G4 (Anti-Sycophancy): Auto-triggered, cannot skip
- G5 (Security): Skip only for internal tools
- G6 (i18n): Auto-skipped if project has no i18n

---

## API Reference

| Method | Endpoint | Purpose |
|--------|---------|---------|
| GET | `/api/projects` | List projects |
| GET | `/api/tasks` | List tasks |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id/move` | Move task (kanban) |
| POST | `/api/tasks/:id/dispatch` | Dispatch to AI agent |
| GET | `/api/judge` | Evaluate all tasks |
| GET | `/api/judge/:taskId` | Evaluate single task |
| GET | `/api/agents/suggest?skill=X` | Suggest best agents |
| GET | `/api/continuity` | All projects' memory |
| POST | `/api/continuity/:id` | Update memory state |
| GET | `/api/learnings/:id` | Learnings list |
| POST | `/api/learnings/:id` | Add learning |
| GET | `/api/decisions/:id` | Decisions list |
| GET | `/api/activities` | Activity history |
| GET | `/api/deployments` | Deploy history |
| POST | `/api/deployments` | Record deployment |
| GET | `/api/changelog` | Version changelog |

---

## Golden Rules

1. 🔒 **Identity First** — `cm-identity-guard` before push/deploy
2. 📐 **Design Before Code** — `cm-planning` always first
3. 🧪 **Test Before Code** — RED → GREEN → REFACTOR
4. 🛡️ **PRE-ACT ATTENTION** — check goal alignment every action
5. 📊 **Evidence Over Claims** — only trust terminal output
6. 🚀 **Deploy via Gates** — all 6 gates must pass
7. 🧠 **Read Memory First** — CONTINUITY.md at session start
8. 📚 **Capture Learnings** — every failure becomes wisdom
