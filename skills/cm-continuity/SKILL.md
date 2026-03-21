---
name: cm-continuity
description: "Working memory protocol — maintains context across sessions via CONTINUITY.md. Inspired by Loki Mode. Read at turn start, update at turn end. Captures mistakes and learnings to prevent repeating errors."
---

# Continuity — Working Memory Protocol

> **Context persistence across sessions. Mistakes captured. Learnings applied.**
> Inspired by Loki Mode's CONTINUITY.md protocol (Autonomi).

## When to Use

**ALWAYS** — This is a background protocol, not an explicit invocation.

- **Start of every session:** Read `.cm/CONTINUITY.md` to orient yourself
- **End of every session:** Update `.cm/CONTINUITY.md` with progress
- **On error:** Record in Mistakes & Learnings section
- **On key decision:** Record in Key Decisions section

## Setup

> **Prerequisite:** The `cm` CLI is the CodyMaster command-line tool. If not installed, you can
> manage `.cm/CONTINUITY.md` directly with your editor or the AI agent without the CLI commands.

```bash
# Initialize working memory for current project
cm continuity init

# Check current state
cm continuity status

# View captured learnings
cm continuity learnings
```

## The Protocol

### AT THE START OF EVERY SESSION:

```
1. Read .cm/CONTINUITY.md to understand current state
2. Read "Mistakes & Learnings" to avoid past errors
3. Check "Next Actions" to determine what to do
4. Reference Active Goal throughout your work
```

### DURING WORK:

```
PRE-ACT ATTENTION CHECK (before every significant action):
  - Re-read Active Goal
  - Ask: "Does my planned action serve this goal?"
  - Ask: "Am I solving the original problem, not a tangent?"
  - If DRIFT detected → log it → return to goal
```

### AT THE END OF EVERY SESSION:

```
1. Update "Just Completed" with accomplishments
2. Update "Next Actions" with remaining work
3. Record any new "Mistakes & Learnings"
4. Record any "Key Decisions" made
5. Update "Files Modified" list
6. Set currentPhase and timestamp
```

### ON ERROR (Self-Correction Loop):

```
ON_ERROR:
  1. Capture error details (stack trace, context)
  2. Analyze root cause (not just symptoms)
  3. Write learning to CONTINUITY.md "Mistakes & Learnings"
  4. Update approach based on learning
  5. Retry with corrected approach
  6. Max 3 retries per error pattern before ESCALATE
```

## CONTINUITY.md Template

```markdown
# CodyMaster Working Memory
Last Updated: [ISO timestamp]
Current Phase: [planning|executing|testing|deploying|reviewing]
Current Iteration: [number]
Project: [project name]

## Active Goal
[What we're currently trying to accomplish — 1-2 sentences max]

## Current Task
- ID: [task-id from dashboard]
- Title: [task title]
- Status: [in-progress|blocked|reviewing]
- Skill: [cm-skill being used]
- Started: [timestamp]

## Just Completed
- [Most recent accomplishment with file:line references]
- [Previous accomplishment]
- [etc — last 5 items]

## Next Actions (Priority Order)
1. [Immediate next step]
2. [Following step]
3. [etc]

## Active Blockers
- [Any current blockers or waiting items]

## Key Decisions This Session
- [Decision]: [Rationale] — [timestamp]

## Mistakes & Learnings

### Pattern: Error → Learning → Prevention
- **What Failed:** [Specific error that occurred]
- **Why It Failed:** [Root cause analysis]
- **How to Prevent:** [Concrete action to avoid this in future]
- **Timestamp:** [When learned]
- **Agent:** [Which agent]
- **Task:** [Which task ID]

## Working Context
[Critical information for current work — architecture decisions, patterns being followed.
⚠️ NEVER store API keys, secrets, or credentials here — use .env or a secrets manager instead]

## Files Currently Being Modified
- [file path]: [what we're changing]
```

## 4-Tier Memory System (Brain-Inspired)

```
Tier 1: SENSORY MEMORY (seconds — within current tool call)
  → Internal variables, intermediate results
  → NEVER written to file — discarded when action completes
  → Example: "File X has 200 lines" — no need to remember next session

Tier 2: WORKING MEMORY (current session → 7 days)
  → CONTINUITY.md — the active scratchpad
  → Auto-rotates: entries > 7 days promote to Tier 3 or decay
  → Max 500 words (~400 tokens)
  
Tier 3: LONG-TERM MEMORY (30+ days, only if reinforced)
  → .cm/learnings.json — error patterns with TTL + scope
  → .cm/decisions.json — architecture decisions with supersedence
  → Entries MUST be reinforced (same pattern ≥ 2x) to survive
  → Decay: auto-archive if not relevant after TTL expires

Tier 4: EXTERNAL SEMANTIC MEMORY (optional — for large projects)
  → tobi/qmd — BM25 + Vector + LLM re-ranking, 100% local
  → Indexes entire docs/, src/, meeting notes folders
  → AI queries via MCP: qmd query "keyword" → relevant snippets
  → See cm-deep-search skill for setup & detection thresholds
  → ONLY suggested when project >50 docs or >200 source files
```

**CONTINUITY.md = "what am I doing NOW?"**
**learnings.json = "what mistakes should I avoid?"**  
**decisions.json = "what architecture rules apply?"**
**qmd (optional) = "find what was written across hundreds of docs"**

---

## Memory Audit Protocol (Auto — Every Session Start)

When reading CONTINUITY.md at session start, SIMULTANEOUSLY run audit:

### Step 1: Decay Check

Scan `.cm/learnings.json`:

```
For each learning where status == "active":
  daysSinceRelevant = today - lastRelevant
  
  IF daysSinceRelevant > ttl:
    → Set status = "archived"
    → Log: "Archived learning L{id}: {error} (TTL expired)"
  
  IF reinforceCount ≥ 2 AND ttl < 60:
    → Extend ttl = 60 (pattern emerging)

  IF reinforceCount ≥ 3 AND ttl < 90:
    → Extend ttl = 90 (proven pattern)

  IF reinforceCount ≥ 5 AND ttl < 180:
    → Extend ttl = 180 (fundamental knowledge)
```

### Step 2: Conflict Detection

Scan `.cm/decisions.json`:

```
For each pair of decisions with same scope:
  IF decisions contradict each other:
    → Older decision: set supersededBy = newer.id, status = "superseded"
    → Log: "Superseded D{old.id} by D{new.id}"
  
  IF ambiguous (can't auto-resolve):
    → Flag in CONTINUITY.md Active Blockers
    → Ask user to clarify
```

### Step 2b: Integrity Scan

Scan learnings for red flags that may CAUSE bugs:

```
For each active learning in scope:
  IF lastRelevant > 30 days ago AND reinforceCount == 0:
    → Flag as LOW_CONFIDENCE (read but verify before applying)
  
  IF prevention pattern conflicts with current codebase patterns:
    → Flag as SUSPECT (do NOT apply blindly — verify first)
  
  IF multiple learnings for same scope have conflicting preventions:
    → Flag as CONFLICT (resolve immediately: keep newer, invalidate older)

On flags found:
  LOW_CONFIDENCE → Read but treat as suggestion, not rule
  SUSPECT → Compare with actual code before following
  CONFLICT → Invalidate older, keep newer, log resolution
```

### Step 3: Scope-Filtered Reading

When executing a task for module X:

```
ONLY load learnings where:
  scope == "global" OR scope == "module:X" OR scope starts with "file:src/X/"

SKIP learnings for other modules entirely.

Token savings: Read 5 relevant learnings (250 tokens) 
instead of 50 total learnings (2,500 tokens)
```

### Step 4: Reinforcement (Anti-Duplicate)

When recording a new error/learning:

```
IF similar learning already exists in learnings.json:
  → DO NOT create duplicate
  → UPDATE existing: reinforceCount++, lastRelevant = today, reset TTL
  → Log: "Reinforced L{id} (count: {reinforceCount})"

IF no similar learning exists:
  → CREATE new entry with scope, ttl=30, reinforceCount=0
```

---

## `.cm/learnings.json` Format (v2 — with Smart Fields)

```json
[
  {
    "id": "L001",
    "date": "2026-03-21",
    "error": "i18n keys missing in th.json",
    "cause": "Batch extraction skipped Thai locale",
    "prevention": "Always run i18n-sync test after each batch",
    "scope": "module:i18n",
    "ttl": 30,
    "reinforceCount": 0,
    "lastRelevant": "2026-03-21",
    "status": "active"
  }
]
```

| Field | Purpose |
|-------|---------|
| `scope` | `global` / `module:{name}` / `file:{path}` — where this applies |
| `ttl` | Days until auto-archive (default: 30) |
| `reinforceCount` | Times pattern repeated (+1 each hit) |
| `lastRelevant` | Last date this learning was accessed or reinforced |
| `status` | `active` / `archived` / `invalidated` / `corrected` |

**Status meanings:**
- `active` — Trusted, applied when in scope
- `archived` — TTL expired, retrievable on demand
- `invalidated` — **Proven wrong** (caused bug) — NEVER read again
- `corrected` — Was wrong, has been fixed — read with caution

### `.cm/meta-learnings.json` Format (Memory Self-Healing Log)

When memory itself causes a bug, record a meta-learning:

```json
[
  {
    "id": "ML001",
    "type": "memory-caused-bug",
    "affectedLearning": "L003",
    "action": "invalidated",
    "reason": "Prevention pattern conflicts with new codebase architecture",
    "bugDescription": "Deploy failed because learning suggested fetch but project uses axios",
    "date": "2026-03-21"
  }
]
```

> **Meta-learnings are the system learning about its own mistakes.**
> They prevent the same bad-memory pattern from recurring.

## `.cm/decisions.json` Format (v2)

```json
[
  {
    "id": "D001",
    "date": "2026-03-21",
    "decision": "Use React Hook Form over Formik",
    "rationale": "Better performance with uncontrolled components",
    "scope": "module:forms",
    "supersededBy": null,
    "status": "active"
  }
]
```

| Field | Purpose |
|-------|---------|
| `scope` | Where this decision applies |
| `supersededBy` | ID of newer decision that replaces this one (null if current) |
| `status` | `active` / `superseded` |

---

## Decay Timeline (Ebbinghaus-Inspired)

```
First recorded:              TTL = 30 days
Reinforced 1x (count=1):    TTL resets to 30 from today
Reinforced 2x (count=2):    TTL = 60 days (pattern emerging)
Reinforced 3x+ (count≥3):   TTL = 90 days (proven pattern)
Reinforced 5x+ (count≥5):   TTL = 180 days (fundamental knowledge)
Not reinforced after TTL:    status → "archived" (retrievable on demand)
```

> Inspired by **Ebbinghaus Forgetting Curve**: Un-reinforced memories decay.
> Repeatedly reinforced memories become long-term knowledge.

---

## Scope Tagging Rules (For All Skills)

When writing to Mistakes & Learnings or Key Decisions, ALWAYS tag scope:

```
scope: "global"           → Applies to entire project
                            (e.g., "Always run test before deploy")

scope: "module:{name}"    → Applies to specific module only
                            (e.g., "module:auth", "module:i18n")

scope: "file:{path}"      → Applies to one file only
                            (e.g., "file:src/api/routes.ts")

RULE: When in doubt, choose the SMALLEST scope.
       file > module > global
       
WHY: Smaller scope = less noise = AI only reads what's relevant.
```

---

## Rules

```
✅ DO:
- Read CONTINUITY.md at session start (ALWAYS)
- Run Memory Audit at session start (decay + conflicts + scope filter)
- Update CONTINUITY.md at session end (ALWAYS)
- Tag EVERY learning/decision with scope (global/module/file)
- Reinforce existing learnings instead of creating duplicates
- Keep CONTINUITY.md under 500 words (rotate to Tier 3)
- Be specific: "Fixed auth bug in login.ts:42" not "Fixed stuff"

❌ DON'T:
- Skip Memory Audit ("I'll read everything, it's fine")
- Write learnings without scope ("it applies everywhere" = almost never true)
- Create duplicate learnings (reinforce existing ones instead)
- Let learnings.json grow unbounded (TTL + decay handles this)
- Read ALL learnings regardless of current module (use scope filter)
- Ignore superseded decisions (they cause conflicting code)
- Keep stale context that no longer applies to current architecture
```

## The Bottom Line

**Your memory is your superpower. Without it, you repeat every mistake forever.**
