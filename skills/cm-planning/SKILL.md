---
name: cm-planning
description: "You MUST use this before any creative work or multi-step task. Explores intent, requirements, and design before implementation. Then documents the plan before coding."
---

# Planning — Brainstorm + Write Plans

> **Role: Product Manager** — You explore intent, define scope, and document implementation plans before any code is written.

> **Two phases, one skill:** Explore WHAT to build, then document HOW.

## When to Use

**ALWAYS before:**
- Creating features, components, or functionality
- Modifying behavior
- Multi-step tasks
- Any work that changes user-facing behavior

## Phase A: Brainstorm (Explore Intent)

### The Process

1.  **Understand Intent** — What does the user ACTUALLY want?
    -   Ask clarifying questions
    -   Don't assume scope
    -   Identify hidden requirements

2.  **Explore Options** — What are the approaches?
    -   List 2-3 possible approaches
    -   Pros/cons of each
    -   Recommend one with reasoning

3.  **Define Scope** — What's in and what's out?
    -   Must-haves vs nice-to-haves
    -   Edge cases to handle
    -   Edge cases to explicitly NOT handle

4.  **Skill Coverage Audit** — Do I have the right skills?
    -   List all technologies/frameworks/tools referenced in the scope
    -   Cross-reference with `cm-skill-index` Layer 1 triggers
    -   If gap found → trigger Discovery Loop (`cm-skill-mastery` Part C):
        `npx skills find "{keyword}"` → review → ask user → install
    -   Note any gaps in plan as: "⚠️ No skill coverage — will trigger discovery during execution"

5.  **Design** — How should it work?
    -   Data flow
    -   Component boundaries
    -   API contracts (if applicable)
    -   **If building UI:** Use `cm-ui-preview` to preview on Google Stitch before coding

### Red Flags — STOP

-   Starting code before brainstorming
-   Assuming you know what the user wants
-   Skipping scope definition
-   "It's simple, no need to plan"

## Phase B: Write Implementation Plan

### When to Write a Plan

-   Task has 3+ steps
-   Multiple files involved
-   Changes affect other components
-   User explicitly asks for a plan

### Plan Structure

```markdown
# [Goal]

## Context
What and why.

## Requirements (for L2+ projects)
| ID | Type | Description | Story | Test |
|----|------|-------------|-------|------|
| FR-001 | Functional | [requirement] | S-001 | T-001 |
| NFR-001 | Non-Functional | [requirement] | Arch | Perf-001 |

## Proposed Changes

### [Component/File]
- What changes
- Why this approach

## Verification
How to verify it works.
```

> **Requirement Tracing (L2+ projects):** For medium and large projects, include FR/NFR IDs that trace from requirements → stories → tests. See `_shared/helpers.md#Project-Level-Detection` for level definitions.

### Plan Rules

```
✅ DO:
- Break into small, testable steps
- Order by dependency (foundations first)
- Include verification for each step
- Keep steps bite-sized (15-30 min each)
- Include FR/NFR table for L2+ projects

❌ DON'T:
- Write vague steps ("refactor the code")
- Skip verification steps
- Plan more than needed
- Over-engineer the plan itself
```

### Step FINAL: Update Working Memory

Per `_shared/helpers.md#Update-Continuity`
Per `_shared/helpers.md#Save-Decision` — for any architecture decisions made during planning

---

## Integration

| After planning... | Use skill |
|-------------------|-----------|
| Complex initiative/enhancement? | `cm-brainstorm-idea` (run BEFORE planning) |
| Need isolated workspace | `cm-git-worktrees` |
| Execute the plan (same session) | `cm-execution` |
| Write tests first | `cm-tdd` |
| Building UI/frontend | `cm-ui-preview` |

## The Bottom Line

**Think before you build. Document before you code. No exceptions.**
