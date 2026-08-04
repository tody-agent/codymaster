---
description: Plan and design a feature before writing code — brainstorm intent, requirements, and architecture
argument-hint: "<feature idea or problem statement>"
---

# /plan — Feature Planning

Structured planning workflow: understand intent → explore alternatives → create implementation plan → establish scoped execution authorization.

Follow [the shared autonomy policy](../skills/_shared/autonomy-policy.md). Use its decision table and wording for every confirmation decision.

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

For a meaningful implementation, request one approval at the plan-to-execution boundary:

> Approve this plan to authorize implementation through verification within the stated scope.

That approval grants scoped execution authorization to `/build` and `cm-execution`; they continue without per-step or per-batch re-approval. If the user requested planning only, deliver the plan without treating delivery as authorization. A clear, reversible micro task may skip `/plan` and proceed with zero approval.

### Step 4: Suggest Next

- "Approve this plan → implementation continues through verification within scope"
- "Need UI mockup? → `/ux`"
- "Want to set up git worktree? → Use **cm-git-worktrees**"
