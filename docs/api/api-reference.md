---
title: API Reference
description: Consolidated API reference for CodyMaster — CLI surface, dashboard HTTP API, browse daemon routes, and MCP JSON-RPC tools.
keywords: codymaster api, mcp tools, rest api, cli reference
robots: index, follow
---

# API Reference

> [!TIP]
> **Use this page as the hub.** Deep tool schemas and endpoint lists are summarized here; always verify against `node dist/index.js --help` and source files when shipping changes.

## 1. CLI (Commander)

- **Entry:** `src/index.ts` registers the program as `cm`.
- **Registry:** `src/cli/command-registry.ts` calls `registerAllCommands`.
- **Verification:**

```bash
npm run build
node dist/index.js --help
```

- **Detailed command list:** [CLI command reference](../cli/command-reference.md)

## 2. Dashboard HTTP API

- **Implementation:** `src/dashboard.ts` (Express).
- **Starts with:** `cm dashboard start` (`src/cli/commands/dashboard.ts`).
- **Default URL:** `http://localhost:6969` (see `DEFAULT_PORT` in `src/data.ts`).
- **Data backing store:** `~/.codymaster/kanban.json` (`src/data.ts`).

The dashboard exposes REST-style routes for Mission Control operations (projects, tasks, deployments, changelog, continuity helpers). Inspect `src/dashboard.ts` for the authoritative route table when you extend the UI.

## 3. Browse daemon HTTP API

- **Implementation:** `src/browse-server.ts`.
- **Typical endpoints:** `/health`, `/session/start`, `/navigate`, `/click`, `/fill`, `/screenshot`, `/console`, `/network` (see file for exact contracts).
- **Security model:** bearer token for non-health routes (see server source).

## 4. MCP (stdio JSON-RPC)

- **Server:** `src/mcp-context-server.ts`
- **Launch pattern:**

```bash
node dist/mcp-context-server.js --project /absolute/path/to/repo
```

- **Protocol:** JSON-RPC 2.0 with `Content-Length` framing on stdio.
- **Tool catalog:** `tools/list` returns schemas defined in `TOOLS` array in `src/mcp-context-server.ts`.

### MCP tools (names only)

| Tool | Purpose |
|------|---------|
| `cm_query` | FTS search learnings/decisions |
| `cm_resolve` | Resolve `cm://` URIs (L0/L1/L2) |
| `cm_bus_read` | Read context bus |
| `cm_bus_write` | Publish step output to bus |
| `cm_budget_check` | Token budget preflight |
| `cm_memory_decay` | TTL archival for learnings |
| `cm_index_refresh` | Regenerate L0 indexes |
| `cm_plan` | Sprint / pipeline snapshot bridge |
| `cm_review` | Review artifact hints |
| `cm_qa` | QA workflow hints |
| `cm_deploy` | Deploy workflow hints |
| `cm_search` | Search alias |
| `cm_memory_query` | Memory search alias |

## 5. Related deep dive

- [REST and MCP (expanded notes)](./rest-and-mcp.md)  
- [Servers and MCP runtime](../architecture/servers-and-mcp.md)  
- [Data flow](../architecture/data-flow.md)  
