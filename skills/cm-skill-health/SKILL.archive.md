---
name: cm-skill-health
description: "Operational health review for CodyMaster skills using current repo signals: validate-skills, suggest, retro logs, memory, and test gates."
---

# cm-skill-health

Use this skill when a CodyMaster skill feels stale, misleading, unreliable, or under-documented.

## What it checks

1. Discovery drift
   - Is the skill present in `skills/`, docs indexes, profiles, and README surfaces?
2. Invocation friction
   - Does `cm suggest` point users to the skill when the task matches?
3. Operational evidence
   - Are there recurring failures or learnings in `.cm/operational-learnings.jsonl`?
4. Contract health
   - Does the skill reference commands, files, or paths that still exist?
5. Release safety
   - Does the repo still pass `npm run validate:skills`, `npm run check:skills`, and the test gate?

## Workflow

1. Confirm the symptom.
   - Missing from docs
   - Missing from profiles
   - Broken references inside `SKILL.md`
   - Repeated runtime pain in retro notes
2. Compare the live skill against:
   - `docs/skills/index.md`
   - `skills/profiles/full.txt`
   - `README.md`
   - related changelog promises
3. Scan evidence sources.
   - `cm advisory handoff --for cm-skill-health`
   - `cm suggest --project .`
   - `cm retro summary --project .`
   - `.cm/CONTINUITY.md`
   - `rg` over `skills/`, `docs/`, and `src/`
4. Score the issue.
   - `healthy`: discoverable, accurate, references valid
   - `degraded`: present but misleading or inconsistent
   - `broken`: missing, invalid, or unusable
5. Hand off to:
   - `cm-skill-evolution` to repair or derive the next version

## Output

Produce a short health note:

```md
## Skill Health
- Skill: cm-...
- Status: healthy | degraded | broken
- Symptoms: ...
- Evidence: ...
- Recovery path: FIX | DERIVED | CAPTURED
```

Preferred input contract:

```md
## Advisory Handoff
- Consumer: cm-skill-health
- Skill: cm-...
- Recovery path: FIX | DERIVED | CAPTURED | NONE
- Confidence: 0.xx
- Source analysis: EA-...
- Task: ...
- Status: completed | partial | failed
- Evidence: ...
- Selected skills: ...
- Target skills: ...
- Quality weight: 0.xx
- Next step: ...
```

## Red flags

- Do not claim metric dashboards or automatic scoring unless the repo actually implements them.
- Do not treat README marketing copy as proof that a skill exists.
- Do not evolve the skill before identifying whether the problem is docs drift, packaging drift, or missing implementation.
