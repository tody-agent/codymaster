---
name: cm-skill-mastery
description: "Meta-skill for the CodyMaster kit — when to invoke skills, how to create new skills, and skill discovery. Use at conversation start to establish skill discipline."
---

# Skill Mastery — Use + Create + Discover

> **The meta-skill:** How to find, use, and create cm-* skills.

## Part A: Using Skills

### Rule #0: Memory First (cm-continuity)

Before invoking ANY skill, ensure `cm-continuity` is active:

1. Has `.cm/CONTINUITY.md` been read this session? If not → **read it first**
2. Are there relevant learnings for the module you're about to work on? → **Load them**
3. After skill completes → **update CONTINUITY.md**

> Memory is the foundation that makes all other skills smarter. Without it, you repeat every mistake.

### The Rule

**Invoke relevant skills BEFORE any response or action.** Even 1% chance = check the skill.

### Decision Flow

```
User message received
  → CONTINUITY.md loaded? (Rule #0)
    → NO: Read .cm/CONTINUITY.md first
    → YES: Continue
  → Might any skill apply? (even 1%)
    → YES: Read the skill → Follow it
    → NO: Respond directly
```

### Skill Priority

1. **Process skills first** (cm-planning, cm-debugging) — determine HOW to approach
2. **Implementation skills second** (cm-tdd, cm-safe-deploy) — guide execution

### Red Flags

| Thought | Reality |
|---------|---------|
| "This is just a simple question" | Questions are tasks. Check for skills. |
| "I need more context first" | Skill check BEFORE clarifying questions. |
| "The skill is overkill" | Simple things become complex. Use it. |
| "I remember this skill" | Skills evolve. Read current version. |
| "Let me just do this one thing first" | Check BEFORE doing anything. |

### Skill Types

- **Rigid** (cm-tdd, cm-debugging): Follow exactly. Don't adapt away discipline.
- **Flexible** (cm-planning): Adapt principles to context.

---

## Part B: Creating Skills

### When to Create

- Pattern repeated across 3+ projects
- Complex process that needs documentation
- Team convention that should be enforced

### Skill Structure

```markdown
---
name: cm-[skill-name]
description: "One line: when to use this skill"
---

# [Skill Title]

## Overview
What and why. Core principle.

## When to Use
Specific triggers.

## The Process
Step-by-step instructions.

## Red Flags
What NOT to do.

## Integration
How it connects to other cm-* skills.
```

### Rules

```
✅ DO:
- Keep under 400 lines (token optimization)
- Use tables and code blocks for density
- Include Red Flags section
- Reference other cm-* skills by name
- Test skill with real scenarios before deploying

❌ DON'T:
- Write prose when a table works
- Duplicate content from other skills (reference instead)
- Create skills for one-time tasks
- Exceed 600 lines without good reason
```

### Token Optimization

| Technique | Saves |
|-----------|-------|
| Tables over prose | ~40% |
| Code blocks over explanation | ~30% |
| Reference other skills vs duplicate | ~50% |
| Remove obvious examples | ~20% |

---

## Part C: Discovering Skills

### Adaptive Skills Discovery

When you encounter something you don't have a skill for:

```
1. DETECT  → "I need to do X but no matching skill"
2. SEARCH  → npx skills find "{keyword}"
3. REVIEW  → Read the SKILL.md — safe? relevant?
4. ASK     → "Found skill '{name}'. Install?"
5. INSTALL → npx skills add {source} --skill {name} -a antigravity
6. USE     → Apply the skill
7. LOG     → Record in .cm-skills-log.json
```

### Safety Rules

- Always show user what you found before installing
- Prefer known repos (vercel-labs/agent-skills)
- Project-level by default, global only if agreed
- Check `npx skills list` to avoid duplicates
- Never override existing cm-* skills with external ones

---

## The CodyMaster Kit (14 skills)

| # | Skill | Purpose |
|---|-------|---------|
| 1 | `cm-project-bootstrap` | Start new projects |
| 2 | `cm-brainstorm-idea` | Strategic analysis gate for enhancements (9 Windows + Double Diamond) |
| 3 | `cm-planning` | Brainstorm + write plans |
| 4 | `cm-execution` | Execute plans (batch/subagent/parallel) |
| 5 | `cm-tdd` | Test-driven development |
| 6 | `cm-quality-gate` | Test + verify + frontend safety |
| 7 | `cm-code-review` | Request + receive + finish branch |
| 8 | `cm-safe-deploy` | 6-gate deploy pipeline |
| 9 | `cm-safe-i18n` | i18n batching + safety |
| 10 | `cm-debugging` | Systematic root-cause debugging |
| 11 | `cm-terminal` | Terminal command monitoring |
| 12 | `cm-git-worktrees` | Isolated workspaces |
| 13 | `cm-skill-mastery` | This skill (meta) |
| 14 | `cm-identity-guard` | Git/deploy identity safety |

## The Bottom Line

**Skills are discipline, not overhead. Use them. Create them. Never skip them.**
