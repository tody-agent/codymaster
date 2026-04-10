---
title: REST and MCP API Surface
description: API surfaces exposed by CodyMaster including dashboard HTTP endpoints, browse daemon routes, and MCP stdio tools.
keywords: codymaster api, express routes, mcp tools, json rpc
robots: index, follow
---

# REST and MCP API Surface

> [!TIP]
> **Hub page:** for a single entry point (CLI + HTTP + MCP), start at [API reference](./api-reference.md).

> [!TIP]
> **Quick reference:** HTTP APIs serve dashboard and browse automation, while MCP provides tool-driven context operations.

## Dashboard HTTP API

The dashboard server (`src/dashboard.ts`) exposes project/task/deploy/changelog operations plus continuity and chain data for UI clients.

## Browse Daemon API

The browse daemon (`src/browse-server.ts`) exposes HTTP endpoints for session lifecycle, navigation, DOM interactions, screenshots, console logs, and network capture.

## MCP Tool API (stdio)

The MCP server (`src/mcp-context-server.ts`) supports `initialize`, `tools/list`, and `tools/call` with JSON-RPC framing.

### Tool Families

- Query and resolve: `cm_query`, `cm_resolve`
- Bus and budget: `cm_bus_read`, `cm_bus_write`, `cm_budget_check`
- Memory maintenance: `cm_memory_decay`, `cm_index_refresh`
- Engineering bridge: `cm_plan`, `cm_review`, `cm_qa`, `cm_deploy`, `cm_search`, `cm_memory_query`

## Integration Guidance

Use HTTP routes for web-facing interactions and MCP tools for agent-driven context retrieval or pipeline orchestration.

See also:

- [Servers and MCP Runtime](../architecture/servers-and-mcp.md)
- [Storage and Memory Model](../architecture/data-and-memory.md)
- [Engineering Pipeline](../workflows/engineering-pipeline.md)