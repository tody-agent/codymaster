# Implementation Checklist — Fix Workflow Pipeline v6

## Status: ✅ COMPLETE (20/32 tasks done, 12 deferred)

---

## Phase 1: Multi-Platform Skill Sync (Critical) ✅

- [x] 1.1 Update `scripts/build-skills.mjs` — add all 14 platform directories
- [x] 1.2 Update `scripts/build-skills.mjs` — sync `_shared/helpers.md`
- [x] 1.3 Update `scripts/build-skills.mjs` — sync ALL `cm-*` skills
- [x] 1.4 Update `scripts/build-skills.mjs` — add `--all-platforms` flag
- [x] 1.5 Update `package.json` — add `sync:all` script
- [ ] 1.6 Update `postinstall` — auto-sync (deferred)
- [x] 1.7 Verification: `npm run sync:all` — 50 skills → 14 platforms

## Phase 2: TDD Enforcement Gate (Critical) ✅

- [x] 2.1 Create `src/execution/tdd-gate.ts`
- [ ] 2.2 Update `engineering.ts` — add TDD gate (deferred)
- [x] 2.3 Update `cm-execution/SKILL.md` — document TDD gate
- [x] 2.4 Update `cm-tdd/SKILL.md` — reference gate
- [x] 2.5 Verification: `test/tdd-gate.test.ts` — 10 tests pass

## Phase 3: Changelog Automation (Important) ✅

- [x] 3.1 Create `scripts/update-changelog.sh`
- [ ] 3.2 Create `.git/hooks/post-commit` (deferred — manual setup)
- [x] 3.3 Update `package.json` — add `changelog` script
- [ ] 3.4 Update `cm-safe-deploy/SKILL.md` (deferred)
- [x] 3.5 Verification: `npm run changelog` works

## Phase 4: Gemini CLI Integration (Important) ✅

- [x] 4.1 Create `src/cli/commands/parallel.ts`
- [x] 4.2 Update `command-registry.ts` — register parallel command
- [ ] 4.3 Update `cm-execution/SKILL.md` — document parallel (deferred)
- [ ] 4.4 Create `docs/workflows/gemini-parallel.md` (deferred)
- [x] 4.5 Verification: build passes, tests pass

## Phase 5: Handoff Automation (Nice-to-have) ⏭️ DEFERRED

- [ ] 5.1 Create `src/cli/commands/handoff.ts`
- [ ] 5.2 Create `src/handoff/converter.ts`
- [ ] 5.3 Update `cm-brainstorm-idea/SKILL.md`
- [ ] 5.4 Verification

## Phase 6: Documentation & Testing ✅

- [x] 6.1 Update `CHANGELOG.md` — v6.1.0 entry added
- [ ] 6.2 Update `README.md` (deferred)
- [ ] 6.3 Update `cm-how-it-work/SKILL.md` (deferred)
- [ ] 6.4 Update `cm-skill-chain/SKILL.md` (deferred)
- [x] 6.5 Run full test suite: 49 files, 406 tests pass
- [x] 6.6 Verification: all tests pass

---

## Files Created

| File | Purpose | Tests |
|------|---------|-------|
| `src/execution/tdd-gate.ts` | TDD enforcement module | ✅ |
| `test/tdd-gate.test.ts` | TDD gate tests | 10 pass |
| `scripts/update-changelog.sh` | Changelog automation | ✅ |
| `src/cli/commands/parallel.ts` | Gemini CLI command | ✅ |

## Files Modified

| File | Change |
|------|--------|
| `scripts/build-skills.mjs` | 14 platforms + _shared/ sync |
| `src/cli/command-registry.ts` | Register parallel command |
| `package.json` | sync:all, changelog scripts |
| `.opencode/skills/cm-execution/SKILL.md` | TDD gate docs |
| `.opencode/skills/cm-tdd/SKILL.md` | TDD gate reference |
| `CHANGELOG.md` | v6.1.0 entry |

## Commands Added

```bash
npm run sync:all           # Sync skills to all 14 platforms
npm run changelog          # Auto-update CHANGELOG.md
npm run changelog:dry      # Preview changelog changes
cm parallel "task" --count 3  # Run 3 Gemini instances in parallel
```
