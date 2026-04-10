---
title: Data Flow

description: How data moves through CodyMaster — from CLI and dashboard writes to MCP reads and engineering artifacts.
keywords: codymaster data flow, kanban json, context db, mcp read write
robots: index, follow
---

# Data Flow

## Global kanban and activity

```mermaid
sequenceDiagram
  participant U as User / Agent
  participant CM as cm CLI
  participant D as dashboard.ts
  participant F as kanban.json
  U->>CM: project / task / deploy commands
  CM->>F: read / write KanbanData
  U->>D: HTTP API (when server running)
  D->>F: same store (src/data.ts)
```



Text fallback: CLI and dashboard share `~/.codymaster/kanban.json` via `loadData` / `saveData` (`src/data.ts`).

## Project memory and MCP

```mermaid
sequenceDiagram
  participant M as MCP client
  participant S as mcp-context-server.ts
  participant B as StorageBackend
  participant Q as SQLite or Viking
  M->>S: tools/call cm_query
  S->>B: query learnings / decisions
  B->>Q: FTS or HTTP search
  Q-->>B: rows
  B-->>S: results
  S-->>M: JSON payload
```



## Skill chain and bus

When a chain advances, steps can publish summaries and artifact paths to the bus (`src/context-bus.ts`). Downstream automation reads the same file instead of scraping chat.

## Sprint and engineering artifacts

Engineering commands write under `.cm/sprint` (see `src/sprint-pipeline.ts` and [Engineering pipeline](../workflows/engineering-pipeline.md)).

## See also

- [Storage and memory](./data-and-memory.md)  
- [TRIZ-Parallel engine](./triz-parallel-engine.md)  
- [API reference](../api/api-reference.md)

