---
title: 'Sprint A — P0 (documentation, guardian, sprint ergonomics)'
description: Completed checklist for P0 hardening referenced from the engineering implementation plan.
robots: index, follow
---

# Sprint A — P0 outcomes

This document **records** the P0 scope from `implementation_plan.md` (Sprint A). For the living roadmap, see [Roadmap v5](../roadmap-cm-v5.md).

## Browse daemon documentation

- **Done:** Operator runbook [Browse daemon](../browse-daemon.md) (Chromium install, `CM_BROWSE_TOKEN`, port/host, troubleshooting, `cm qa-visual`).
- **Done:** ADR [001 — Playwright browse daemon](../adr/001-playwright-browse-daemon.md).
- **Also:** Skill `skills/cm-browse/SKILL.md`, API notes in [REST and MCP](../api/rest-and-mcp.md).

## Guardian + hooks

- **Done:** Hook-oriented guide [Guardian hooks](../workflows/guardian-hooks.md) (CLI examples, Cursor/Codex pattern, whitelist table).
- **Done:** Example config `.cm/config.example.yaml` → `guardian:` keys.

## Sprint `skip` / `reset`

- **Done:** `skipSprintStep`, `resetSprint` in `src/sprint-pipeline.ts` with CLI wiring and tests (`test/sprint-pipeline.test.ts`).

## Verify

From repo root:

```bash
npm run test:gate:kit
```

See also `implementation_plan.md` → **Verify** for guardian smoke and browse E2E.
