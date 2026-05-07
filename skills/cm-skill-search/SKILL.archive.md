---
name: cm-skill-search
description: "Find the best CodyMaster skill using the shipped indexes, profiles, docs, and contextual suggestions."
---

# cm-skill-search

Use this skill when you need to find the right CodyMaster skill quickly and avoid loading the wrong `SKILL.md`.

## Search order

1. Fast path
   - `cm suggest --project .`
2. Library index
   - `docs/skills/index.md`
   - `docs/skills/*.md` category pages
3. Progressive disclosure
   - `skills/cm-skill-index/SKILL.md`
4. Raw filesystem search
   - `rg -n "<keyword>" skills docs README.md`
5. Fallback
   - if nothing matches, use `cm-skill-health` to check whether the missing skill is docs drift or a real gap

## Query workflow

1. Normalize the intent into 2-5 keywords.
2. Search category pages before opening full skills.
3. Open only the top 1-3 candidate `SKILL.md` files.
4. Prefer the skill whose triggers, outputs, and lifecycle placement best match the task.
5. If two skills overlap:
   - choose the earlier lifecycle gate first
   - example: `cm-brainstorm-idea` before `cm-planning`

## Tie-breakers

- Need diagnosis before repair: choose `cm-skill-health`
- Need to repair a skill: choose `cm-skill-evolution`
- Need to distribute a skill pack: choose `cm-skill-share`
- Need the general index first: choose `cm-skill-index`

## Output

```md
## Skill Search Result
- Task: ...
- Best match: cm-...
- Runner-up: cm-...
- Why: ...
```
