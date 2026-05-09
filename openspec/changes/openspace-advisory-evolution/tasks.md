# Implementation Checklist

- [ ] 1.1 Add read/query helpers for recent execution analyses and skill metrics in `src/context-db.ts` if current helpers are insufficient for operator-facing reports
- [ ] 1.2 Add backend accessors in `src/storage-backend.ts` for analyzer report queries used by CLI/report surfaces
- [ ] 1.3 Add tests covering analyzer report retrieval and metric listing behavior

- [ ] 2.1 Add an operator-facing report surface for advisory evolution
- [ ] 2.2 Show recent execution analyses with task title, status, recommendation, confidence, and target skills
- [ ] 2.3 Show per-skill metrics with enough detail to explain why a skill is considered strong or weak
- [ ] 2.4 Add tests for the new report/CLI surface

- [ ] 3.1 Extend `selectTopSkills()` in `src/skill-chain.ts` to incorporate quality-weighted scoring alongside relevance
- [ ] 3.2 Preserve mandatory-step guarantees and safe fallback behavior for skills with no metrics yet
- [ ] 3.3 Emit explainable logging or summary text for ranking decisions where practical
- [ ] 3.4 Add unit tests for quality-weighted routing behavior

- [x] 4.1 Define a structured advisory handoff format that `cm-skill-health` and `cm-skill-evolution` can consume
- [ ] 4.2 Update the self-healing skills so they explicitly reference analyzer evidence instead of generic manual inspection only
- [ ] 4.3 Verify the new advisory loop stays operator-invoked and does not auto-mutate skills

- [ ] 5.1 Run targeted tests for context DB, storage backend, execution analyzer, and skill-chain
- [ ] 5.2 Run `npm run test:gate:kit`
- [ ] 5.3 Update `.cm/CONTINUITY.md` with the chosen implementation order and any learnings from the first execution pass
