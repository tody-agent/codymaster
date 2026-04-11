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

### MCP tools (15 total)

| Tool | Purpose | Added |
|------|---------|-------|
| `cm_query` | FTS5 BM25 search across learnings/decisions | v4.5.0 |
| `cm_resolve` | Resolve `cm://` URIs at L0/L1/L2 depth | v4.5.0 |
| `cm_bus_read` | Read context bus state | v4.5.0 |
| `cm_bus_write` | Publish skill output to context bus | v4.5.0 |
| `cm_budget_check` | Token budget preflight by category | v4.5.0 |
| `cm_memory_decay` | TTL-based archival of expired learnings | v4.5.0 |
| `cm_index_refresh` | Regenerate L0 compact indexes | v4.5.0 |
| `cm_plan` | Sprint + pipeline snapshot bridge | v4.8.0 |
| `cm_review` | Review artifact hints | v4.8.0 |
| `cm_qa` | QA workflow hints | v4.8.0 |
| `cm_deploy` | Deploy workflow hints | v4.8.0 |
| `cm_search` | Search learnings/decisions (alias) | v4.8.0 |
| `cm_memory_query` | Memory search (alias) | v4.8.0 |
| `cm_memory_write` | **NEW v5.1** — Persist a learning with auto-detected category, scope, TTL | v5.1.0 |
| `cm_natural` | **NEW v5.1** — NLI router: "remember that…" / "forget…" / "what did we learn…" | v5.1.0 |

### Launch with `cm mcp-serve` (v5.1+)

```bash
# Start MCP server (stdio)
cm mcp-serve --project /path/to/project

# Print Goose or Claude Desktop config snippet
cm mcp-serve --print-config
```

## 5. Related deep dive

- [REST and MCP (expanded notes)](./rest-and-mcp.md)  
- [Servers and MCP runtime](../architecture/servers-and-mcp.md)  
- [Data flow](../architecture/data-flow.md)  
