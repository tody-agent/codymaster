---
title: 'ADR 002 — Sprint pipeline + context bus files under .cm/sprint'
description: File layout and state model for the sprint pipeline alongside the context bus.
keywords: adr, sprint, context bus, .cm/sprint
robots: index, follow
---

# ADR 002: Sprint context bus files

## Status

Accepted

## Context

CodyMaster already had a **shared context bus** (`context-bus.json`) for multi-skill chains. Feature work needed:

- A **named pipeline** (brainstorm → … → retro) with explicit current step and artifacts on disk.
- **Human escape hatches** (skip a step, reset sprint) without corrupting audit trails.
- **MCP and CLI** reading the same state.

## Decision

Persist sprint state under **`.cm/sprint/`**:

- `state.json` — pipeline definition, `current_index`, `completed[]`, `skipped[]` (v2 schema), timestamps, `artifacts_dir`.
- `events.jsonl` — append-only events (e.g. `skip`, step transitions) for forensics.
- `artifacts/` — per-step markdown or other files produced by the workflow.

Implementation: `src/sprint-pipeline.ts`. CLI: `cm sprint init|dry-run|skip|reset|…` (see `src/cli/commands/engineering.ts`).

Skipping a step writes a stub artifact, advances index, appends a `skip` event — **does not silently delete history**.

## Consequences

- **Positive:** Reproducible handoffs between agents and humans; state is grep-friendly.
- **Positive:** `cm suggest` and skills can infer “where we are” from `state.json`.
- **Negative:** Two concepts (root bus vs sprint folder) — docs must point authors to the right file for their use case.

## Related

- [Engineering pipeline](../workflows/engineering-pipeline.md)
- [Sprint A — P0 plan](../plans/sprint-a-p0.md) (historical checklist)
