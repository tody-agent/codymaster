---
title: Engineering Pipeline
description: How CodyMaster orchestrates browse, guardian, sprint, review, QA, and release-oriented engineering workflows.
keywords: codymaster engineering workflow, sprint pipeline, guardian, qa visual
robots: index, follow
---

# Engineering Pipeline

> [!TIP]
> **Quick reference:** Engineering workflows are grouped under `src/cli/commands/engineering.ts` and connect to sprint state, browse daemon, and quality gates.

## Workflow Building Blocks

- **Browse automation** for UI checks and visual captures
- **Guardian checks** for destructive-command and path safety controls
- **Sprint pipeline** with `.cm/sprint` artifacts and event progression
- **Advisory loop** for reviewing execution analyses, skill quality, and self-healing handoffs
- **Second opinion / retro / suggest** helpers for analysis and follow-up

## Sprint Runtime Artifacts

Sprint-related runtime state is managed in `.cm/sprint` and linked by utilities in `src/sprint-pipeline.ts`.

## Recommended Flow

1. Prepare context and sprint state.
2. Run implementation tasks and validations.
3. Run QA (including visual QA where needed).
4. Review and canary before broader rollout.
5. When a run degrades or a skill looks weak, use the advisory loop before changing skill behavior.

## Advisory Workflow

Use the advisory commands when you want telemetry-backed follow-through instead of guesswork:

```bash
cm advisory report --project .
cm advisory metrics --project .
cm advisory handoff --project . --for cm-skill-health
```

Then use the structured note with:

- the legacy `cm-skill-health` advisory consumer id for diagnosis payloads
- `cm-skill-evolution` for `FIX`, `DERIVED`, or `CAPTURED`

## Risk Reduction

- Gate with `npm run test:gate` before major transitions.
- Use guardian checks for sensitive operations.
- Keep sprint artifacts updated for reproducible handoffs.
- Use `cm advisory handoff --format json` when another agent needs the same evidence without re-querying SQLite.

See also:

- [Browse daemon runbook](../browse-daemon.md) — Playwright install, `CM_BROWSE_TOKEN`, `cm qa-visual`
- [Advisory loop](./advisory-loop.md) — `cm advisory report`, `metrics`, and `handoff`
- [Guardian hooks](./guardian-hooks.md) — `cm guardian check` and IDE pre-exec patterns
- [Servers and MCP Runtime](../architecture/servers-and-mcp.md)
- [CLI Command Reference](../cli/command-reference.md)
- [Testing and Release Gates](../quality/testing-and-release.md)
- [ADR 001 — Browse daemon](../adr/001-playwright-browse-daemon.md) · [ADR 002 — Sprint bus](../adr/002-sprint-context-bus-files.md) · [ADR 003 — Skill distro](../adr/003-skill-distro-and-meta.md)
