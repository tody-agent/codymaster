---
title: Showcase
description: What CodyMaster helps you ship faster — memory, MCP, dashboard, engineering kit, and skills library highlights.
keywords: codymaster showcase, features, value proposition
robots: index, follow
---

# Showcase

## What feels different with CodyMaster


| Capability             | What you get                                                                        |
| ---------------------- | ----------------------------------------------------------------------------------- |
| **Mission Control**    | Local dashboard for projects/tasks/deployments (`cm dashboard`, `src/dashboard.ts`) |
| **Durable memory**     | `.cm/` + SQLite FTS with optional semantic/search layers built around the supported local stack |
| **Agent-native tools** | MCP server with search, resolve, bus, budget tools (`src/mcp-context-server.ts`)    |
| **Engineering kit**    | Browse, guardian, sprint, QA helpers (`src/cli/commands/engineering.ts`)            |
| **60 bundled skills**  | Opinionated workflows in `skills/*/SKILL.md` ([index](../skills/index.md))          |


## “Aha” moments

1. **You open a PR** and the agent already “remembers” the last failure mode because learnings were recorded.
2. **You run chains** and downstream steps read the bus instead of re-parsing chat.
3. **You gate releases** with the same script CI uses (`npm run test:gate:kit`).

## Where to go next

- [Introduction](../getting-started/introduction.md)  
- [System architecture](../architecture/system-architecture.md)  
- [Use cases](./use-cases.md)
