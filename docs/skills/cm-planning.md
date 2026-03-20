---
title: "cm-planning"
description: "You MUST use this before any creative work or multi-step task. Explores intent, requirements, and design before implementation. Then documents the plan before c"
keywords: ["cm-planning", "cody master", "ai skill"]
robots: "index, follow"
---

> **📋 Full Skill Source** — This is the complete, unedited SKILL.md file. Nothing is hidden or summarized.

[← Back to Skills Library](./index.md)

# Planning — Brainstorm + Write Plans

> **Two phases, one skill:** Explore WHAT to build, then document HOW.

## When to Use

**ALWAYS before:**
- Creating features, components, or functionality
- Modifying behavior
- Multi-step tasks
- Any work that changes user-facing behavior

## Phase A: Brainstorm (Explore Intent)

### The Process

1. **Understand Intent** — What does the user ACTUALLY want?
   - Ask clarifying questions
   - Don't assume scope
   - Identify hidden requirements

2. **Explore Options** — What are the approaches?
   - List 2-3 possible approaches
   - Pros/cons of each
   - Recommend one with reasoning

3. **Define Scope** — What's in and what's out?
   - Must-haves vs nice-to-haves
   - Edge cases to handle
   - Edge cases to explicitly NOT handle

4. **Design** — How should it work?
   - Data flow
   - Component boundaries
   - API contracts (if applicable)
   - **If building UI:** Use `cm-ui-preview` to preview on Google Stitch before coding

### Red Flags — STOP

- Starting code before brainstorming
- Assuming you know what the user wants
- Skipping scope definition
- "It's simple, no need to plan"

## Phase B: Write Implementation Plan

### When to Write a Plan

- Task has 3+ steps
- Multiple files involved
- Changes affect other components
- User explicitly asks for a plan

### Plan Structure

```markdown
# [Goal]

## Context
What and why.

## Proposed Changes

### [Component/File]
- What changes
- Why this approach

## Verification
How to verify it works.
```

### Plan Rules

```
✅ DO:
- Break into small, testable steps
- Order by dependency (foundations first)
- Include verification for each step
- Keep steps bite-sized (15-30 min each)

❌ DON'T:
- Write vague steps ("refactor the code")
- Skip verification steps
- Plan more than needed
- Over-engineer the plan itself
```

## Integration

| After planning... | Use skill |
|-------------------|-----------|
| Need isolated workspace | `cm-git-worktrees` |
| Execute the plan (same session) | `cm-execution` |
| Write tests first | `cm-tdd` |
| Building UI/frontend | `cm-ui-preview` |

## The Bottom Line

**Think before you build. Document before you code. No exceptions.**
