---
title: Working Memory
description: Continuity files, learnings, decisions, SQLite context database, and MCP access patterns for CodyMaster project memory.
keywords: working memory, continuity, learnings, decisions, context db
robots: index, follow
---

# Working Memory

## On-disk layout (typical)

Inside your repository:

```
.cm/
  CONTINUITY.md          # session spine (src/continuity.ts)
  config.yaml            # project config (e.g. storage backend)
  context-bus.json       # skill chain handoff bus
  token-budget.json      # category budgets
  context.db             # SQLite + FTS (default backend)
  memory/
    learnings.json       # legacy / migration path
    decisions.json
  sprint/                # engineering pipeline artifacts
```

Exact files depend on which commands you have run and migration state.

## What to store where


| Content                 | Store           | Why                      |
| ----------------------- | --------------- | ------------------------ |
| Current goal + blockers | `CONTINUITY.md` | Fast human scan          |
| “Do not repeat” lessons | learnings       | Searchable, TTL-capable  |
| Architectural choices   | decisions       | Searchable, citeable     |
| Step output for chains  | context bus     | Machine-readable handoff |
| Execution outcomes      | `execution_analyses` | Advisory evidence    |
| Skill quality signals   | `skill_metrics` | Routing + recovery input |


## Agent access (MCP)

The MCP server (`src/mcp-context-server.ts`) exposes:

- `cm_query` — search learnings/decisions  
- `cm_resolve` — load `cm://` resources at L0/L1/L2  
- `cm_bus_read` / `cm_bus_write` — context bus  
- `cm_memory_decay` — TTL archival

## Backends

- **sqlite** (default) — `SqliteBackend` in `src/storage-backend.ts`
- **legacy configs** — if an old project still says `storage.backend: viking`, CodyMaster warns and falls back to SQLite

## Advisory data

The advisory loop also stores its evidence in `.cm/context.db`:

- `execution_analyses` — recent task outcomes plus analyzer recommendations
- `skill_metrics` — aggregated per-skill counters and the inputs used by `qualityWeight()`

Use these commands instead of querying the DB manually in most cases:

```bash
cm advisory report --project .
cm advisory metrics --project .
cm advisory handoff --project . --for cm-skill-health
```

## See also

- [CodyMaster Brain](../architecture/codymaster-brain.md)  
- [Storage and memory](../architecture/data-and-memory.md)  
- [Advisory Loop](../workflows/advisory-loop.md)
- [API reference](../api/api-reference.md)
