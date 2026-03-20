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
[Critical information for current work — API keys paths,
architecture decisions, patterns being followed]

## Files Currently Being Modified
- [file path]: [what we're changing]
```

## Memory Hierarchy

The memory systems complement each other:

```
1. CONTINUITY.md     = Working memory (current session state)
2. learnings.json    = Extracted error patterns (persists across sessions)
3. decisions.json    = Architecture decisions (persists across projects)
4. cm-tasks.json     = Task queue + RARV logs (Mode D integration)
```

**CONTINUITY.md is the PRIMARY source of truth for "what am I doing right now?"**

## Integration

| Skill | How it integrates |
|-------|-------------------|
| `cm-execution` | RARV Mode D reads CONTINUITY.md in REASON phase |
| `cm-planning` | Sets Active Goal and Next Actions |
| `cm-debugging` | Records errors in Mistakes & Learnings |
| `cm-quality-gate` | VERIFY phase updates CONTINUITY.md |
| `cm-code-review` | Records review feedback as learnings |

## Rules

```
✅ DO:
- Read CONTINUITY.md at session start (ALWAYS)
- Update CONTINUITY.md at session end (ALWAYS)
- Record EVERY error in Mistakes & Learnings
- Keep "Just Completed" to last 5 items
- Be specific: "Fixed auth bug in login.ts:42" not "Fixed stuff"

❌ DON'T:
- Skip reading CONTINUITY.md ("I remember what I was doing")
- Write vague learnings: "It didn't work" → WHY didn't it work?
- Ignore past learnings when they're relevant
- Let CONTINUITY.md grow beyond ~500 words (rotate old entries)
- Delete Mistakes & Learnings (archive to learnings.json instead)
```

## The Bottom Line

**Your memory is your superpower. Without it, you repeat every mistake forever.**
