---
title: CodyMaster Brain
description: Project memory, continuity, context bus, token budgets, cm:// URIs, and how agents retrieve context safely.
keywords: codymaster brain, continuity, context bus, token budget, cm uri
robots: index, follow
---

# CodyMaster Brain

> [!TIP]
> **Metaphor:** the “brain” is not a model — it is **durable project state** plus **retrieval rules** so agents load the right slice of context at the right time.

## Core concepts

### Continuity (`CONTINUITY.md`)

Structured working memory for the active goal, phase, blockers, and recent actions (`src/continuity.ts`). This is the human- and agent-readable spine of a session.

### Learnings and decisions

- Stored in project memory (JSON legacy paths and/or SQLite `context.db` depending on migration state).
- Searchable via FTS when using SQLite (`src/context-db.ts`).
- Exposed to MCP clients through `cm_query` (`src/mcp-context-server.ts`).

### Context bus (`.cm/context-bus.json`)

Publishes step outputs for skill chains so downstream steps do not re-derive state from chat history (`src/context-bus.ts`, MCP `cm_bus_read` / `cm_bus_write`).

### Token budget (`.cm/token-budget.json`)

Category budgets and pre-flight checks (`src/token-budget.ts`, MCP `cm_budget_check`).

### `cm://` URIs

Unified addressing for memory, skills, and pipeline snapshots (`src/uri-resolver.ts`, MCP `cm_resolve`).

## Retrieval depths (L0 / L1 / L2)


| Depth | Typical use                            |
| ----- | -------------------------------------- |
| L0    | Cheapest — compact indexes / abstracts |
| L1    | Default — overview                     |
| L2    | Full content when justified            |


## Optional vector graph backend (OpenViking)

When `storage.backend: viking` is set in `.cm/config.yaml`, `getBackend()` returns `VikingBackend` (`src/storage-backend.ts`) for semantic search and abstracts (see `CHANGELOG.md` and `src/backends/viking-backend.ts`).

## See also

- [Data flow](./data-flow.md)  
- [Working memory](../operations/working-memory.md)  
- [API reference — MCP tools](../api/api-reference.md)