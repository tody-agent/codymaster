# Knowledge Source Templates

Templates for structuring content before ingesting into NotebookLM.

## Skill Source Template

```markdown
# Skill: {name}

**Description:** {description}
**Triggers:** {trigger words}
**Category:** {planning/execution/verification/utility}

## When to Use
{when_to_use}

## Key Instructions
{core steps}

## Integration
{related skills}
```

## Lesson Learned Template

```markdown
## Lesson: {title}
**Date:** {YYYY-MM-DD}
**Context:** {project or situation}
**Problem:** {what went wrong or what was discovered}
**Solution:** {how it was resolved}
**Takeaway:** {the key learning for future reference}
**Related Skills:** {cm-skill-1, cm-skill-2}
**Severity:** {critical / important / nice-to-know}
```

## Project Knowledge Template

```markdown
# Project: {name}

**Stack:** {technologies}
**Architecture:** {pattern}
**Status:** {active / maintenance / archived}

## Key Decisions
- {decision 1}: {rationale}
- {decision 2}: {rationale}

## Known Issues
- {issue 1}: {status}

## Contacts
- {role}: {person}
```

## Decision Record Template

```markdown
## Decision: {title}
**Date:** {YYYY-MM-DD}
**Status:** {proposed / accepted / deprecated}
**Context:** {why this decision was needed}
**Options Considered:**
1. {option A} — {pros/cons}
2. {option B} — {pros/cons}
**Decision:** {chosen option}
**Consequences:** {implications}
```

## Bug Post-Mortem Template

```markdown
## Post-Mortem: {incident title}
**Date:** {YYYY-MM-DD}
**Severity:** {P0 / P1 / P2 / P3}
**Duration:** {time to resolve}
**Root Cause:** {what actually caused it}
**Detection:** {how was it discovered}
**Resolution:** {what fixed it}
**Prevention:** {what will prevent recurrence}
**Lessons:**
- {lesson 1}
- {lesson 2}
```

## Bundle Template (for grouping related skills)

When notebook approaches 50-source limit, bundle related content:

```markdown
# Bundle: {category name}
## Skills in this bundle: {count}

---

### Skill: {name-1}
{full SKILL.md content}

---

### Skill: {name-2}
{full SKILL.md content}

---
```
