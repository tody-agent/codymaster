---
name: cm-mcp-engineering
description: "Use when you need to interact with the MCP engineering bridge tools (cm_plan, cm_review, cm_qa, cm_deploy, cm_search)."
---
# cm-mcp-engineering — MCP tools on context server

The same binary as memory MCP (`dist/mcp-context-server.js`) now exposes **engineering bridge** tools:

| Tool | Purpose |
|------|---------|
| `cm_plan` | Sprint state + artifact paths + next skill hint |
| `cm_review` | Preview `.cm/sprint/artifacts/review.md` |
| `cm_qa` | QA pointers — host browser mode first (see `_shared/browser-strategy.md`); `cm browse` daemon only as CLI fallback |
| `cm_deploy` | Hints for safe deploy + canary |
| `cm_search` | Learnings + decisions search |
| `cm_memory_query` | Same backing store, alias-style |

Existing tools unchanged: `cm_query`, `cm_resolve`, `cm_bus_read`, `cm_bus_write`, `cm_budget_check`, `cm_memory_decay`, `cm_index_refresh`.

## Config

Point `--project` at the repo root (or `CM_PROJECT_PATH`).
