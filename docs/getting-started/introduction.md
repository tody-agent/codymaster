---

## title: Introduction
description: What CodyMaster is, who it is for, and how it fits next to your editor and AI tools.
keywords: codymaster introduction, ai agent toolkit, cli overview
robots: index, follow

# Introduction

> [!TIP]
> **One sentence:** CodyMaster is the **operating system around your repo** for AI-assisted engineering — memory, gates, dashboard, and skills — not a replacement for your IDE or model.

## What CodyMaster is

- A **Node.js CLI** (`cm` / `codymaster`) that registers command groups for projects, tasks, dashboard, engineering helpers, and distro checks (`src/cli/command-registry.ts`).
- A **project memory layer** under `.cm/` (continuity file, optional SQLite `context.db`, context bus, token budget).
- A **Mission Control dashboard** (Express) for kanban-style visibility over data in `~/.codymaster/kanban.json` (`src/dashboard.ts`, `src/data.ts`).
- An **MCP context server** exposing search, URI resolve, bus read/write, budget checks, advisory JSON surfaces, and engineering-bridge tools (`src/mcp-context-server.ts`).
- A **skills library** — Markdown instruction packs in `skills/*/SKILL.md` that agents (Claude, Cursor, etc.) can follow.

## What CodyMaster is not

- Not a hosted SaaS product in this repo — it runs **on your machine** with a local-first default stack.
- Not a single “magic model” — it orchestrates **your** tools, files, and habits.

## Who it is for

- Teams and individuals who use **AI coding agents** daily and need **structure**: memory, checklists, gates, and repeatable workflows.
- Maintainers who want **one place** for continuity, learnings, and handoff between humans and agents.

## Next steps

- [How it works](./how-it-works.md)  
- [Installation](./installation.md)  
- [System architecture](../architecture/system-architecture.md)
