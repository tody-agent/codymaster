---
title: CodyMaster Documentation
description: Full guide to CodyMaster — CLI, memory, MCP, skills, operations, and shipping with confidence.
keywords: codymaster, ai coding, skills, cli, mcp, documentation
robots: index, follow
---

# CodyMaster Documentation

**CodyMaster** is a TypeScript CLI and skill kit for AI-assisted software work: local project memory, optional vector backend, Mission Control dashboard, browse/QA helpers, and an MCP context server so agents can query learnings and pipeline state safely.

## Why this exists (value in one minute)

| You want… | CodyMaster gives you… |
|-----------|------------------------|
| Repeatable agent workflows | Named **skills** in `skills/` + chains (`cm chain`) |
| Context that survives sessions | `.cm/` working memory + SQLite FTS (or OpenViking) |
| Safer automation | Guardian checks, security gates, deploy dry-runs |
| Visibility | **Dashboard** at `http://localhost:6969` (default) |
| Tool integration | **MCP server** (`src/mcp-context-server.ts`) for Claude / compatible hosts |

## Start here

1. [Introduction](./getting-started/introduction.md) — what CodyMaster is and is not  
2. [How it works](./getting-started/how-it-works.md) — mental model + main components  
3. [Installation](./getting-started/installation.md) — build, test, verify CLI  
4. [Vibe coding guide](./getting-started/vibe-coding-guide.md) — practical daily loop  

## Deep dives

- [System architecture](./architecture/system-architecture.md)  
- [CodyMaster Brain](./architecture/codymaster-brain.md) — memory, bus, budgets  
- [Browse daemon](./browse-daemon.md) — Playwright QA daemon (quick start)  
- [Guardian hooks](./workflows/guardian-hooks.md) — safe shell commands + IDE hooks  
- [Skills library](./skills/index.md) — every bundled skill, categorized  
- [API reference](./api/api-reference.md) — REST surfaces + MCP tools  
- [Architecture decision records](./adr/001-playwright-browse-daemon.md) (ADR 001–003)  

## Source of truth in code

When docs and marketing disagree, trust these files:

- `src/index.ts` — CLI entry  
- `src/cli/command-registry.ts` — registered commands  
- `src/data.ts` — global `~/.codymaster/kanban.json`  
- `src/mcp-context-server.ts` — MCP tool surface  
- `src/storage-backend.ts` — `sqlite` vs `viking` backends  
