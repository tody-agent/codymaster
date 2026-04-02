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

# View captured learnings / decisions
cm continuity learnings
cm continuity decisions

# ── Smart Spine v5 commands ──────────────────────────────
# Regenerate L0 compact indexes (learnings-index.md, skeleton-index.md)
cm continuity index

# Show token budget allocation + usage per category
cm continuity budget

# Pretty-print current context bus state (active skill chain)
cm continuity bus

# Print Claude Desktop MCP config snippet for cm-context server
cm continuity mcp

# Migrate learnings.json + decisions.json → SQLite (one-time)
cm continuity migrate

# Export SQLite back to JSON (backup)
cm continuity export

# ── OpenViking backend (optional) ────────────────────────
# 1. Install OpenViking server (Python 3.10+)
pip install openviking --upgrade

# 2. Configure ~/.openviking/ov.conf with embedding provider, then start:
openviking start          # Runs on localhost:1933 by default

# 3. Switch CodyMaster to use OpenViking in .cm/config.yaml:
#    storage:
#      backend: viking
#      viking:
#        host: localhost
#        port: 1933
#        workspace: codymaster
#        timeout: 60000
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

## Memory Architecture (v5 — Smart Spine)

```
Tier 1: SENSORY MEMORY (seconds — within current tool call)
  → Internal variables, intermediate results
  → NEVER written to file — discarded when action completes

Tier 2: WORKING MEMORY (current session → 7 days)
  → CONTINUITY.md — the active scratchpad (max 500 words / ~400 tokens)
  → Auto-rotates: entries > 7 days promote to Tier 3 or decay
  → Context bus (.cm/context-bus.json) — live skill chain state
    · initBus() on chain start, updateBusStep() on each advance
    · cm://pipeline/current resolves to bus JSON
    · Read via: cm continuity bus | cm_bus_read MCP tool

Tier 3: LONG-TERM MEMORY (30+ days, only if reinforced)
  → Default:  .cm/context.db (SQLite + FTS5)
      · learnings table + learnings_fts (BM25 keyword search)
      · decisions table + decisions_fts
      · skill_outputs per session/chain
      · indexes table (cached L0/L1 content + staleness hash)
  → Optional: OpenViking backend (storage.backend: viking in .cm/config.yaml)
      · True vector semantic search — finds "async timeout" even when you query "network delay"
      · L0/L1/L2 auto-generated by engine — no manual cm continuity index needed
      · Session compression + long-term memory extraction built-in
      · Graph relations between memories (link/unlink)
      · Setup: pip install openviking && openviking start
  → Fallback: .cm/memory/learnings.json + decisions.json (kept for compat)
  → L0 indexes: .cm/learnings-index.md (~100 tok), .cm/skeleton-index.md (~500 tok)
      · Auto-regenerated on addLearning() + on demand via cm continuity index
      · File watcher auto-refreshes learnings L0 on JSON change (300ms debounce)
      · With Viking: engine generates L0/L1 automatically — no file watcher needed
  → Token budget: .cm/token-budget.json — 200k window, per-category soft limits
      · Enforced at load time: checkBudget() → allowed/remaining/suggestion
      · View: cm continuity budget

Tier 4: EXTERNAL SEMANTIC MEMORY (optional — large projects)
  → tobi/qmd — BM25 + Vector + LLM re-ranking, 100% local
  → See cm-deep-search skill — ONLY when >50 docs or >200 source files

Tier 5: STRUCTURAL CODE MEMORY (optional — code-heavy projects)
  → CodeGraph — tree-sitter AST → SQLite graph → MCP server
  → See cm-codeintell skill — ONLY when >50 source files
```

**CONTINUITY.md      = "what am I doing NOW?"**
**context bus        = "what did upstream skills produce in this chain?"**
**L0 indexes         = "cheapest possible memory load (~600 tokens)"**
**context.db         = "keyword search across all learnings + decisions"**
**OpenViking (opt.)  = "semantic vector search + auto L0/L1 + session compression"**
**qmd (optional)     = "find what was written across hundreds of docs"**

### MCP Context Server (Claude Desktop integration)

Seven tools exposed over stdio to Claude Desktop and MCP-compatible clients:

| Tool | Purpose |
|---|---|
| `cm_query` | FTS5 keyword search — learnings, decisions, or both |
| `cm_resolve` | Load any `cm://` URI at L0/L1/L2 depth |
| `cm_bus_read` | Read live context bus state |
| `cm_bus_write` | Publish skill output to the bus |
| `cm_budget_check` | Pre-flight token check by category |
| `cm_memory_decay` | Archive expired learnings (supports dry_run) |
| `cm_index_refresh` | Regenerate L0 indexes on demand |

```bash
# Get install snippet for Claude Desktop config
cm continuity mcp
```

### cm:// URI Scheme

Reference any memory resource by URI — resolver handles depth + caching:

```
cm://memory/working              → CONTINUITY.md
cm://memory/learnings            → learnings-index.md (L0) or SQLite (L1/L2)
cm://memory/learnings/{id}       → specific learning by ID
cm://memory/decisions            → decisions index
cm://skills/{name}               → SKILL.md at depth
cm://skills/{name}/L0            → front matter + description only (~50 tokens)
cm://resources/skeleton          → skeleton-index.md (L0) or full
cm://pipeline/current            → live context bus state
```

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
- Check context bus FIRST at session start (free, ~50 tokens)
- Load L0 indexes BEFORE full files (learnings-index + skeleton-index)
- Use cm_query for keyword search — don't scan JSON manually
- Read CONTINUITY.md after L0 indexes (not before)
- Run Memory Audit at session start (decay + conflicts + scope filter)
- Update CONTINUITY.md at session end (ALWAYS)
- Tag EVERY learning/decision with scope (global/module/file)
- Reinforce existing learnings instead of creating duplicates
- Keep CONTINUITY.md under 500 words (rotate to Tier 3)
- Be specific: "Fixed auth bug in login.ts:42" not "Fixed stuff"
- Run cm continuity index after bulk learning additions

❌ DON'T:
- Load full learnings.json or skeleton.md as first action (use L0 first)
- Skip context bus check when inside a skill chain
- Skip Memory Audit ("I'll read everything, it's fine")
- Write learnings without scope ("it applies everywhere" = almost never true)
- Create duplicate learnings (reinforce existing ones instead)
- Let learnings.json grow unbounded (TTL + decay + cm_memory_decay handles this)
- Read ALL learnings regardless of current module (use scope filter / cm_query)
- Ignore superseded decisions (they cause conflicting code)
- Inject skeleton.md (20KB) when skeleton-index.md (~2KB) is sufficient
```

## The Bottom Line

**Your memory is your superpower. Without it, you repeat every mistake forever.**
