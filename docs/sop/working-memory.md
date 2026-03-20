---
title: "Working Memory"
description: "How Cody Master maintains context across sessions using CONTINUITY.md, learnings, and decisions."
keywords: ["working memory", "continuity", "context", "cody master"]
robots: "index, follow"
---

# Working Memory

> **Quick Reference**
> - **Protocol**: CONTINUITY.md read at session start, updated at session end
> - **Storage**: `.cm/` directory per project
> - **Inspired by**: Loki Mode (Autonomi)
> - **Data**: Session state + error patterns + architecture decisions

## Why Working Memory?

AI agents have **amnesia** — every new session starts from zero. Without working memory:

- ❌ Same bugs get re-introduced
- ❌ Architecture decisions get forgotten
- ❌ Context switches cause rework
- ❌ Agent doesn't know what it was doing

With Cody Master's working memory:

- ✅ Context persists across sessions
- ✅ Error patterns are captured and prevented
- ✅ Decisions are documented and respected
- ✅ AI picks up exactly where it left off

## Setup

```bash
# Initialize working memory
cm continuity init

# Check status
cm continuity status

# View learnings
cm continuity learnings

# View decisions
cm continuity decisions

# Reset (careful!)
cm continuity reset
```

## Memory Hierarchy

```
.cm/
├── CONTINUITY.md      # Working memory (current session)
├── config.yaml        # RARV cycle settings
└── memory/
    ├── learnings.json  # Error patterns (persists forever)
    └── decisions.json  # Architecture decisions (persists forever)
```

| Level | File | Purpose | Lifespan |
|-------|------|---------|----------|
| 1 | CONTINUITY.md | Current session state | Updated each session |
| 2 | learnings.json | Extracted error patterns | Permanent |
| 3 | decisions.json | Architecture decisions | Permanent |
| 4 | cm-tasks.json | Task queue + RARV logs | Permanent |

## The Protocol

### At Session Start

1. **Read** `.cm/CONTINUITY.md` to understand current state
2. **Review** "Mistakes & Learnings" to avoid past errors
3. **Check** "Next Actions" to determine what to do
4. **Reference** Active Goal throughout your work

### During Work

```
PRE-ACT ATTENTION CHECK (before every significant action):
  - Re-read Active Goal
  - Ask: "Does my planned action serve this goal?"
  - Ask: "Am I solving the original problem, not a tangent?"
  - If DRIFT detected → log it → return to goal
```

### At Session End

1. **Update** "Just Completed" with accomplishments
2. **Update** "Next Actions" with remaining work
3. **Record** any new "Mistakes & Learnings"
4. **Record** any "Key Decisions" made
5. **Update** "Files Modified" list
6. **Set** currentPhase and timestamp

### On Error

```
ON_ERROR:
  1. Capture error details (stack trace, context)
  2. Analyze root cause (not just symptoms)
  3. Write learning to CONTINUITY.md
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

## Next Actions (Priority Order)
1. [Immediate next step]
2. [Following step]
3. [etc]

## Active Blockers
- [Any current blockers]

## Key Decisions This Session
- [Decision]: [Rationale] — [timestamp]

## Mistakes & Learnings
### Pattern: Error → Learning → Prevention
- **What Failed:** [Specific error]
- **Why It Failed:** [Root cause]
- **How to Prevent:** [Concrete prevention action]
```

## Dashboard Integration

Working memory is accessible via the Dashboard API:

```bash
# View all projects' memory
GET /api/continuity

# View specific project
GET /api/continuity/:projectId

# Update memory
POST /api/continuity/:projectId

# Add a learning
POST /api/learnings/:projectId
{
  "whatFailed": "Used wrong API endpoint",
  "whyFailed": "Documentation was outdated",
  "howToPrevent": "Always verify endpoints against OpenAPI spec"
}

# Add a decision
POST /api/decisions/:projectId
{
  "decision": "Use Supabase instead of Firebase",
  "rationale": "Better PostgreSQL support, RLS, real-time"
}
```

## Best Practices

✅ **Do:**
- Read CONTINUITY.md at session start (ALWAYS)
- Update CONTINUITY.md at session end (ALWAYS)
- Record EVERY error in Mistakes & Learnings
- Keep "Just Completed" to last 5 items
- Be specific: "Fixed auth bug in login.ts:42" not "Fixed stuff"

❌ **Don't:**
- Skip reading CONTINUITY.md ("I remember what I was doing")
- Write vague learnings: "It didn't work" → WHY didn't it work?
- Ignore past learnings when they're relevant
- Let CONTINUITY.md grow beyond ~500 words
- Delete Mistakes & Learnings (archive to learnings.json instead)

## Next Steps

- [Installation →](./installation.md) — First-time setup
- [Skills Library →](../skills/) — Browse automation skills
- [cm-continuity skill →](../skills/cm-continuity.md) — Full skill documentation
