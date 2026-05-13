---
name: cm-skill-evolution
description: "Repair or extend CodyMaster skills with a three-mode loop: FIX, DERIVED, and CAPTURED, grounded in current repo tooling."
---

# cm-skill-evolution

Use this skill after `cm-skill-health` identifies a degraded or broken skill, or when `cm advisory handoff --for cm-skill-evolution` produces a structured recovery note.

## Modes

### FIX
Use when the skill should exist already but is inaccurate, broken, or partially missing.

Checklist:
- repair broken references
- restore missing support files
- align docs and profiles
- re-run skill validation and test gate

### DERIVED
Use when the original promise was too ambitious, but the repo has enough primitives to ship a truthful MVP.

Checklist:
- keep the same user problem
- reduce claims to what the code can support today
- reuse existing repo building blocks instead of inventing a new subsystem

### CAPTURED
Use when the main value is operational learning rather than a new code path.

Checklist:
- append the lesson with `cm retro --project . --tool skill --note "..."`
- record durable context in `.cm/CONTINUITY.md`
- update the relevant skill so future sessions do not repeat the same failure

## Evolution Loop

1. Start from the health note.
   - Preferred source: `cm advisory handoff --for cm-skill-evolution`
2. Pick one mode only.
3. Define the smallest truthful recovery.
4. Patch the skill and its discovery surfaces.
5. Verify:
   - `npm run validate:skills`
   - `npm run check:skills`
   - repo test gate if code or docs wiring changed materially
6. Capture the lesson in retro and continuity.

## Decision guide

- The feature existed and drifted: `FIX`
- The changelog promised more than the repo ever shipped: `DERIVED`
- The issue is mainly process and should inform future work: `CAPTURED`

## Output

```md
## Skill Evolution
- Skill: cm-...
- Mode: FIX | DERIVED | CAPTURED
- Change: ...
- Verification: ...
- Learning captured: yes | no
```

Preferred advisory input:

```md
## Advisory Handoff
- Consumer: cm-skill-evolution
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
