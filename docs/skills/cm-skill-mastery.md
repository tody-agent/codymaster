---
title: "cm-skill-mastery"
description: "Meta-skill for the Cody Master kit — when to invoke skills, how to create new skills, and skill discovery. Use at conversation start to establish skill discipli"
keywords: ["cm-skill-mastery", "cody master", "ai skill"]
robots: "index, follow"
---

> **📋 Full Skill Source** — This is the complete, unedited SKILL.md file. Nothing is hidden or summarized.

[← Back to Skills Library](./index.md)

# Skill Mastery — Use + Create + Discover

> **The meta-skill:** How to find, use, and create cm-* skills.

## Part A: Using Skills

### The Rule

**Invoke relevant skills BEFORE any response or action.** Even 1% chance = check the skill.

### Decision Flow

```
User message received
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

## On-Demand Skill Creation

Don't need a separate skill creator tool. When you need a new skill:

1. **Follow Part B above** — use the structure template
2. **Reference `cm-example`** — see `skills/cm-example/SKILL.md` for the universal format
3. **Use `_shared/helpers.md`** — reference helpers instead of embedding logic
4. **Test before deploying** — run the skill through 3 real scenarios

> **Note:** The AI agent will suggest creating a skill when it detects a repeating pattern (3+ times). No separate command needed.

## The Cody Master Kit (34 skills)

| Domain | Key Skills |
|--------|------------|
| 🔧 Engineering | `cm-tdd` `cm-debugging` `cm-quality-gate` `cm-test-gate` `cm-code-review` |
| ⚙️ Operations | `cm-safe-deploy` `cm-identity-guard` `cm-secret-shield` `cm-git-worktrees` `cm-terminal` `cm-safe-i18n` |
| 🎨 Product & UX | `cm-planning` `cm-design-system` `cm-ux-master` `cm-ui-preview` `cm-project-bootstrap` `cm-jtbd` `cm-brainstorm-idea` `cm-dockit` `cm-readit` |
| 📈 Growth/CRO | `cm-content-factory` `cm-ads-tracker` `cro-methodology` |
| 🎯 Orchestration | `cm-execution` `cm-continuity` `cm-skill-chain` `cm-skill-mastery` `cm-skill-index` `cm-deep-search` `cm-how-it-work` |
| 🖥️ Workflow | `cm-start` `cm-dashboard` `cm-status` |

## The Bottom Line

**Skills are discipline, not overhead. Use them. Create them on demand. Never skip them.**
