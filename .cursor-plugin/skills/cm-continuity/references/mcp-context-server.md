# MCP Context Server

> Use when configuring or consuming the continuity MCP bridge.

## Start
```bash
cm mcp-serve --project /path/to/project
cm mcp-serve --print-config
```

## Key Tool Groups
| Tool | Purpose |
|---|---|
| `cm_query` / `cm_search` | search learnings and decisions |
| `cm_resolve` | resolve `cm://` resources |
| `cm_bus_read` / `cm_bus_write` | interact with live context bus |
| `cm_budget_check` | token pre-flight checks |
| `cm_memory_decay` / `cm_index_refresh` | memory hygiene and index refresh |
| `cm_plan` / `cm_review` / `cm_qa` / `cm_deploy` | workflow bridge helpers |

## Use When
- another client needs continuity-aware context
- you are wiring memory access into tools or agents
- you need memory operations without reading raw files directly

## Rule
Treat MCP as the structured access path; do not duplicate its behavior ad hoc when it already covers the need.
