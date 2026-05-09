# Design: Self-Healing Skill Recovery

## Context & Technical Approach

The repo already contains building blocks that can support a basic self-healing story:

- `cm suggest` and `src/cm-suggest.ts` for contextual skill hints
- `cm retro` and `.cm/operational-learnings.jsonl` for run-time learnings
- `src/context-db.ts` and MCP search tools for memory-backed lookup
- `cm-skill-chain`, `cm-skill-index`, and docs indexes for skill discovery

Instead of inventing a new subsystem with speculative runtime automation, we recover the missing public surface by shipping four real skills that explicitly orchestrate these existing capabilities. This keeps the restore aligned with current code, avoids fake claims, and gives users something actionable immediately.

## Proposed Changes

### `skills/cm-skill-health/`
- New skill pack describing how to monitor skill reliability using current signals:
  - git drift
  - `cm suggest`
  - `cm retro`
  - `.cm/operational-learnings.jsonl`
  - skill validation/test gate
- Include a small reference checklist for health review sessions.

### `skills/cm-skill-evolution/`
- New skill pack describing the FIX / DERIVED / CAPTURED evolution loop using current repo tools.
- Point CAPTURED mode at `cm retro` and continuity/context memory instead of a non-existent DAG engine.

### `skills/cm-skill-search/`
- New skill pack for finding the right skill using existing indexes:
  - `docs/skills/index.md`
  - `cm-skill-index`
  - `cm suggest`
  - keyword scans of `skills/`
- Include a query workflow and tie-breaking guidance.

### `skills/cm-skill-share/`
- New skill pack for packaging and transporting skills using existing filesystem/package layout.
- Focus on safe export/import/review of skill folders and required companion assets.

### Docs and discovery
- Update `docs/skills/index.md` total and include the recovered skills.
- Update relevant category pages to list the recovered skills where appropriate.
- Update README skill tables/counts where they explicitly mention the self-healing family.

## Verification

1. `npm run validate:skills`
2. `npm run check:skills`
3. `npm run test:gate:kit`
4. Manually confirm the new skills appear in `docs/skills/index.md` and are counted by the repo utilities.
