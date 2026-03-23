# CodyMaster Shared Helpers

> **DRY principle for skills.** Reference sections here instead of embedding in every skill.
> Usage: `Per helpers.md#Section-Name` — reduces ~150-200 tokens per skill.

---

## #Load-Working-Memory

Before executing any significant action, ALWAYS:

1. **Read** `.cm/CONTINUITY.md` → understand current state, Active Goal, Next Actions
2. **Run Memory Audit** — decay check + conflict detection + integrity scan (see `cm-continuity`)
3. **Scope-filter learnings** — if working on module X:
   - Load from `.cm/learnings.json` ONLY where `scope == "global"` or `scope == "module:X"`
   - **NEVER** load `status = "invalidated"` (proven wrong — skip entirely)
   - **CAUTION** with `status = "corrected"` (was wrong, verify before applying)
   - **TRUST** high `reinforceCount` + recent `lastRelevant`
   - **VERIFY** `reinforceCount = 0` + old `lastRelevant` (low confidence)
   - SKIP learnings for other modules (reduces noise + saves tokens)
4. **Check** "Next Actions" — pick up where you left off

> **Token savings:** Scope-filtered reading loads ~250 tokens instead of ~2,500.

---

## #Save-Decision

After making any significant architectural or product decision:

1. Write to `.cm/memory/decisions.json`:
   - `id`: Auto-increment (D001, D002, ...)
   - `decision`: What was decided
   - `rationale`: Why this option won over alternatives
   - `scope`: `module:{name}` or `global`
   - `status`: `active`
   - `date`: ISO date
2. Check for conflicts with existing decisions in same scope
   - If conflict → set older decision `supersededBy` = new ID, `status` = `superseded`

---

## #Update-Continuity

At the end of every work session or task completion:

1. Update `.cm/CONTINUITY.md`:
   - Move completed work to "Just Completed"
   - Update "Next Actions" with remaining items
   - Update "Files Currently Being Modified"
   - Set `currentPhase` and timestamp
2. Record any new learnings in `.cm/memory/learnings.json`
   - If similar learning exists → reinforce (`reinforceCount++`) instead of creating duplicate
3. Record any new decisions via `#Save-Decision`

---

## #Identity-Check

Before any `git push`, `deploy`, or database operation:

1. Read `.project-identity.json` for expected accounts
2. Verify current git config matches expected GitHub org
3. Verify Cloudflare account matches expected account ID
4. If mismatch → **STOP** and alert user

> See `cm-identity-guard` for full verification protocol.

---

## #Project-Level-Detection

Assess task complexity to determine the right workflow depth:

```
┌─────────┬───────────────────────┬────────────────────────────────────────┐
│ Level   │ Criteria              │ Workflow                                │
├─────────┼───────────────────────┼────────────────────────────────────────┤
│ L0      │ < 30 min, 1-2 files   │ Code + Test only (skip planning)       │
│ Micro   │ Bug fix, tiny tweak   │ Chain: tdd → quality-gate              │
├─────────┼───────────────────────┼────────────────────────────────────────┤
│ L1      │ 1-3 tasks, 1 area     │ Planning lite → Code → Deploy          │
│ Small   │ Small feature, config │ Chain: planning → tdd → quality-gate   │
├─────────┼───────────────────────┼────────────────────────────────────────┤
│ L2      │ 4-10 tasks, multiple  │ Full flow with analysis                │
│ Medium  │ areas, UI + backend   │ Chain: brainstorm → planning → tdd →   │
│         │                       │ execution → quality-gate → safe-deploy │
├─────────┼───────────────────────┼────────────────────────────────────────┤
│ L3      │ 10+ tasks, cross-     │ Full + PRD + Architecture + Sprint     │
│ Large   │ system, team impact   │ Chain: brainstorm → planning (with     │
│         │                       │ FR/NFR) → sprint → execution → gate →  │
│         │                       │ deploy                                 │
└─────────┴───────────────────────┴────────────────────────────────────────┘
```

**Detection heuristics:**
- Count estimated tasks from objective description
- Check number of files/modules likely affected
- Check if UI + API + DB changes needed (cross-layer = L2+)
- Check if multiple team members involved (L3)

**Output:** State the detected level and recommended chain to the user:
```
📊 Project Level: L1 (Small)
🔗 Recommended chain: planning → tdd → quality-gate
⏱️ Estimated time: 1-2 hours
```

---

## #Outputs-Convention

All skill outputs should be saved in `.cm/outputs/` with this structure:

```
.cm/outputs/
├── brainstorms/    ← cm-brainstorm-idea output
├── plans/          ← cm-planning implementation plans
├── reviews/        ← cm-code-review output
└── deploys/        ← cm-safe-deploy logs and reports
```

**Naming:** `{date}-{slug}.md` (e.g., `2026-03-23-user-auth-plan.md`)
