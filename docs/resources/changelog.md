---
title: Changelog
description: CodyMaster release history and where to read the authoritative CHANGELOG in the repository.
keywords: codymaster changelog, releases, version history
robots: index, follow
---

# Changelog

## Authoritative source

The **full, line-by-line changelog** lives at the repository root:

- File: `CHANGELOG.md` (in the `codymaster` repo checkout)
- Remote: [github.com/tody-agent/codymaster](https://github.com/tody-agent/codymaster)

This docs page stays short so it does not drift from the source file.

## Recent highlights (5.1.0)

From `CHANGELOG.md` (April 2026):

- **Intelligent Skill Selection** — `selectTopSkills()` dynamically picks top-3 relevant chain steps per task (SkillsBench: +18.6pp with 2-3 focused skills).
- **`cm mcp-serve` command** — launch MCP server or print Goose/Claude Desktop config in one command.
- **CodyBench** — A/B benchmark framework (`cm bench`) with 3 eval suites: tdd-regression, token-efficiency, memory-retention.
- **`cm_memory_write` MCP tool** — persist learnings with auto-detected category, scope, and TTL.
- **`cm_natural` MCP tool** — NLI router: "remember that…" / "forget…" / "what did we learn about…"
- **Goose integration docs** — `docs/integrations/goose.md` with 3-step setup guide.
- MCP tools count: 13 → **15 tools**.
- CLI commands count: 18 → **20 commands**.

## How we version

- Package version: `package.json` → `"version"` (currently `5.1.0`).
- Docs should mention behavior **as implemented in that version**; when in doubt, read the code paths linked from [System architecture](../architecture/system-architecture.md).

## See also

- [Testing and release gates](../quality/testing-and-release.md)  
- [Deployment](../operations/deployment.md)