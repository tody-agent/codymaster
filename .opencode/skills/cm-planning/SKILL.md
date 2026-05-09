---
name: cm-planning
description: "You MUST use this before any creative work or multi-step task. Explores intent, requirements, and design before implementation. Then documents the plan before coding."
token_budget: 1500
compressed: true
deprecated: false
---

# Planning — Brainstorm + Write Plans

## TL;DR
- **Use before** any feature, behavior change, or 3+ step task
- **Phase A (Brainstorm)**: clarify intent → 2-3 options → recommend → scope
- **Phase B (Write)**: emit `openspec/changes/<name>/{design.md,tasks.md}`
- **Handoff out**: `.cm/handoff/plan.json` (goal, decisions, first 3 tasks)
- **Next**: `cm-tdd` or `cm-execution`

## When to Use
- Creating features, components, or functionality
- Modifying behavior; multi-step tasks; user-visible change
- Skip only for trivial single-line edits or pure questions

## Full Protocol

### Phase A: Brainstorm

1. **Intent** — Ask clarifying questions. Don't assume scope. Surface hidden requirements.
2. **Options** — List 2-3 approaches with pros/cons. Recommend one with reasoning.
3. **Scope** — Must-have vs nice-to-have; edges to handle vs explicitly skip.
4. **Design** — Data flow, component boundaries, API contracts. UI work → `cm-ui-preview`.

**Red flags (STOP)**: code before brainstorm; assuming intent; skipping scope; "it's simple."

### Phase B: Write Plan (OpenSpec format)

Write to `openspec/changes/<initiative-name>/`:

`design.md`
```markdown
# Design: [Goal]
## Context & Technical Approach
## Proposed Changes
### [Component/File]
## Verification
```

`tasks.md`
```markdown
# Implementation Checklist
- [ ] 1.1 ...
- [ ] 1.2 ...
- [ ] Verification testing
```

**Plan rules**: small testable steps (15-30 min each), order by dependency, verification per step. No vague steps.

### Step FINAL: Emit Handoff + Update Continuity

Write `.cm/handoff/plan.json`:
```json
{
  "schema": "plan@1",
  "goal": "...",
  "decisions": ["..."],
  "first_tasks": ["1.1", "1.2", "1.3"],
  "openspec_path": "openspec/changes/<name>/"
}
```

Update `.cm/CONTINUITY.md`:
- Active Goal → plan goal
- Next Actions → first 3 tasks
- Current Phase → "planning"
- Working Context → key decisions

> Token win: next session reads CONTINUITY (~200 tok) instead of full plan (2000+).

## Integration

| After planning... | Use skill |
|---|---|
| Complex initiative | `cm-brainstorm-idea` (run BEFORE) |
| Need isolated workspace | `cm-git-worktrees` |
| Execute the plan | `cm-execution` |
| Tests first | `cm-tdd` |
| UI/frontend | `cm-ui-preview` |

## Anti-Patterns
- ❌ Coding before plan exists
- ❌ Skipping handoff JSON (downstream skills lose context)
- ❌ Vague tasks ("refactor the code")

## The Bottom Line
**Think before you build. Document before you code. Emit handoff so the next skill picks up cold.**
