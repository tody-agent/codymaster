---
name: cm-skill-share
description: "Package, review, export, and import CodyMaster skill folders safely across machines or teams."
---

# cm-skill-share

Use this skill when moving a CodyMaster skill between repos, machines, or teammates.

## What to share

Always treat a skill as a folder, not just `SKILL.md`.

Check for:
- `SKILL.md`
- templates
- scripts
- references
- assets
- profile/index entries that must move with it

## Export checklist

1. Validate the source skill.
   - `npm run validate:skills`
2. Inspect companion files inside the skill folder.
3. Note external dependencies the target repo must already have.
4. Copy the entire folder.
5. Update destination discovery surfaces if the skill becomes user-facing.

## Import checklist

1. Place the folder under `skills/cm-.../`
2. Run:
   - `npm run validate:skills`
   - `npm run check:skills`
3. Add it to:
   - `skills/profiles/full.txt`
   - docs skill index pages
   - README only if the skill is part of the public catalog
4. Verify referenced commands and files exist in the target repo.

## Red flags

- Do not import only the markdown file if the skill depends on scripts or templates.
- Do not advertise the skill publicly before it is indexed and validated.
- Do not overwrite an existing skill without comparing behavior and references first.

## Output

```md
## Skill Share
- Skill: cm-...
- Direction: export | import
- Companion files checked: yes | no
- Discovery surfaces updated: yes | no
- Validation: pass | fail
```
