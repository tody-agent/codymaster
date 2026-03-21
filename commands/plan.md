---
description: Plan and design a feature before writing code — brainstorm intent, requirements, and architecture
argument-hint: "<feature idea or problem statement>"
---

# /plan — Feature Planning

Structured planning workflow: understand intent → explore alternatives → create implementation plan → get approval before coding.

## Invocation

```
/plan Add user authentication with OAuth
/plan Redesign the dashboard for mobile-first
```

## Workflow

### Step 1: Brainstorm

Apply the **cm-brainstorm-idea** skill:
- Multi-dimensional evaluation (tech, product, design, business)
- Design Thinking + 9 Windows (TRIZ) + Double Diamond
- Output 2-3 qualified options with recommendations

### Step 2: Create Plan

Apply the **cm-planning** skill:
- Explore intent and requirements
- Design architecture and data models
- Create implementation plan with exact files and changes
- Break into bite-sized tasks (2-5 minutes each)

### Step 3: Review

Present the plan to the user for approval. Wait for sign-off before proceeding.

### Step 4: Suggest Next

- "Plan approved? → `/build`"
- "Need UI mockup? → `/ux`"
- "Want to set up git worktree? → Use **cm-git-worktrees**"
