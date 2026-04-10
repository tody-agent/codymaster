---
title: Codebase Analysis
description: Documentation generation, semantic search suggestions, and skills for understanding large repositories with CodyMaster.
keywords: codebase analysis, cm-dockit, cm-deep-search, documentation
robots: index, follow
---

# Codebase Analysis

## Skills-first approach

CodyMaster ships skills aimed at **knowledge extraction** and **navigation**:


| Skill            | Use when                                                     |
| ---------------- | ------------------------------------------------------------ |
| `cm-dockit`      | You want structured docs (architecture, SOPs, API) from code |
| `cm-deep-search` | Repo/docs are large; you need local semantic search (qmd)    |
| `cm-how-it-work` | Onboarding narrative for the whole kit                       |


Open the skill file under `skills/<name>/SKILL.md` and follow its steps.

## CLI and tests as ground truth

For *this* repository, the fastest “analysis” is:

```bash
npm run test:gate:kit
```

This forces the tree to compile and tests to agree with behavior (`package.json`).

## MCP-assisted analysis

Point an MCP client at `dist/mcp-context-server.js` with `--project /path/to/repo` (see header comment in `src/mcp-context-server.ts`) and use `cm_query` / `cm_resolve` to pull project memory while exploring code.

## See also

- [Skills — Operations](../skills/operations.md)  
- [System architecture](../architecture/system-architecture.md)  
- [API reference](../api/api-reference.md)

