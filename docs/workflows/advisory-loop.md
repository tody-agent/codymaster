---
title: Advisory Loop
description: How to inspect execution analyses, review skill metrics, and hand off structured recovery notes into cm-skill-health and cm-skill-evolution.
keywords: codymaster advisory, skill metrics, skill health, skill evolution, advisory handoff
robots: index, follow
---

# Advisory Loop

The advisory loop turns CodyMaster's execution telemetry into an operator-facing recovery workflow.

## What it uses

- `execution_analyses` in `.cm/context.db` for recent task outcomes
- `skill_metrics` in `.cm/context.db` for per-skill quality signals
- `cm-skill-health` for diagnosis
- `cm-skill-evolution` for FIX / DERIVED / CAPTURED follow-through

## Commands

### `cm advisory report`

Use this to inspect recent execution analyses in a human-readable format.

Example:

```bash
cm advisory report --project . --limit 10
```

What you get:

- task title
- execution status
- recommended action
- confidence
- active skills involved in the run

### `cm advisory metrics`

Use this to inspect aggregated per-skill metrics and current `qualityWeight()` output.

Example:

```bash
cm advisory metrics --project . --limit 10
```

What you get:

- skill name
- quality score
- selection/application/completion counts
- fallback count
- last recommended action

### `cm advisory handoff`

Use this to build the structured note that self-healing skills consume.

Examples:

```bash
cm advisory handoff --project . --for cm-skill-health
cm advisory handoff --project . --for cm-skill-evolution --format json
cm advisory handoff --project . --for cm-skill-evolution --analysis EA-123abc --skill cm-browse
```

What it includes:

- consumer (`cm-skill-health` or `cm-skill-evolution`)
- recommendation (`FIX`, `DERIVED`, `CAPTURED`, or `NONE`)
- confidence
- source analysis metadata
- target skill judgment
- current metric snapshot and `quality_weight`
- evidence summary
- suggested next step

## Recommended operator flow

1. Run `cm advisory report` to see the latest execution outcomes.
2. Run `cm advisory metrics` to confirm whether the affected skill is weak or healthy over time.
3. Run `cm advisory handoff --for cm-skill-health` to create a diagnosis note.
4. If the issue is real, run `cm advisory handoff --for cm-skill-evolution` and repair the skill in exactly one mode: `FIX`, `DERIVED`, or `CAPTURED`.
5. Re-run validation and the repo test gate after any meaningful repair.

## Notes

- Mandatory chain steps still remain mandatory. Advisory quality feedback only influences optional skill ranking.
- `--format json` is the stable path if another agent or script needs to consume the handoff payload.
- The loop is still operator-invoked. CodyMaster does not auto-mutate skills from advisory output.

## MCP / JSON Surface

Agents that consume CodyMaster through MCP can now read the advisory loop directly without scraping CLI text:

- `cm_advisory_report` — recent advisory analyses as JSON
- `cm_advisory_metrics` — aggregated skill metrics and `quality_weight`
- `cm_advisory_handoff` — structured recovery handoff for `cm-skill-health` or `cm-skill-evolution`

These tools are exposed by [src/mcp-context-server.ts](/Volumes/Data/Skills/codymaster/Cody_Master/src/mcp-context-server.ts) and summarized in [API Reference](../api/api-reference.md).

## See also

- [Engineering Pipeline](./engineering-pipeline.md)
- [Working Memory](../operations/working-memory.md)
- [CLI Command Reference](../cli/command-reference.md)
- [Orchestration Skills](../skills/orchestration.md)
