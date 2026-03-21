---
description: Read and update working memory — maintain context across sessions via CONTINUITY.md
argument-hint: "[read|update|init|status]"
---

# /continuity — Working Memory

Manage working memory to maintain context across AI coding sessions.

## Invocation

```
/continuity init
/continuity read
/continuity update
/continuity status
```

## Workflow

### /continuity init

Create the `.cm/` working memory directory:
```
.cm/
├── CONTINUITY.md          # Active goal, task, learnings
├── config.yaml            # RARV cycle settings
└── memory/
    ├── learnings.json     # Error patterns (auto-captured)
    └── decisions.json     # Architecture decisions
```

### /continuity read

Apply **cm-continuity** skill:
- Read CONTINUITY.md at session start
- Load past learnings and decisions
- Understand current project state and active goal

### /continuity update

- Update active task status
- Record any new learnings or mistakes
- Save architecture decisions
- Ensure next session has full context

### /continuity status

Show current working memory state:
- Active goal and task
- Recent learnings
- Key decisions
- Session count

## Notes

- Always read CONTINUITY.md at the start of every session
- Always update CONTINUITY.md before ending a session
- Learnings prevent repeating the same mistakes
- Decisions provide architecture context
