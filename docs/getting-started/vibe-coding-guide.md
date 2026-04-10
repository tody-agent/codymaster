---

## title: Vibe Coding Guide
description: A practical loop for shipping with CodyMaster, skills, and agents without losing context or quality.
keywords: vibe coding, ai workflow, codymaster daily loop
robots: index, follow

# Vibe Coding Guide

> [!TIP]
> **Goal:** Move from “chat until it works” to **small, verifiable steps** with memory and gates.

## The loop (repeat)

1. **Orient** — Open the repo; ensure `.cm/` exists for the project. Skim [working memory](../operations/working-memory.md).
2. **Choose a skill** — Match the task (planning, TDD, debug, deploy). See [Skills library](../skills/index.md).
3. **Execute in thin slices** — One behavior change + one test (or one gate) at a time.
4. **Record** — Add learnings/decisions (JSON or SQLite path) so the next session is cheaper.
5. **Gate** — Run `npm run test:gate` or `npm run test:gate:kit` before claiming “done” ([Testing & release](../quality/testing-and-release.md)).

## When to use which CodyMaster surface


| Situation                   | Use                                                    |
| --------------------------- | ------------------------------------------------------ |
| See tasks / activity        | `cm dashboard start` → browser UI                      |
| Long-running agent memory   | `.cm/` + MCP `cm_query` / `cm_resolve`                 |
| Skill handoff between steps | Context bus — `cm_bus_read` / `cm_bus_write`           |
| Browser checks              | Engineering `browse` commands → `src/browse-server.ts` |
| Pre-merge confidence        | `npm run test:gate:kit`                                |


## Anti-patterns

- **Giant prompts** without budget checks — use `cm_budget_check` (MCP) or trim with L0 summaries.
- **Skipping tests** because “it’s docs-only” — docs and scripts still break CI.
- **Secrets in continuity** — use env + secret scanning gates ([Security overview](../operations/security-overview.md)).

## Next steps

- [How it works](./how-it-works.md)  
- [Engineering pipeline](../workflows/engineering-pipeline.md)  
- [Use cases](../resources/use-cases.md)