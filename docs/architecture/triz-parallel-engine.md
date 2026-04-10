---
title: TRIZ-Parallel Engine
description: How CodyMaster combines TRIZ-style analysis (9 Windows, option matrices) with parallel execution and skill chains.
keywords: triz, parallel agents, skill chain, brainstorm idea, execution
robots: index, follow
---

# TRIZ-Parallel Engine

> [!TIP]
> **Plain language:** “TRIZ-parallel” here means **think in structured options first**, then **execute along parallel tracks** where work is independent — exactly what skills like `cm-brainstorm-idea` and `cm-execution` are designed to reinforce.

## TRIZ layer (strategy)

The skill `**cm-brainstorm-idea`** encodes:

- **9 Windows** — past/present/future × super-system/system/sub-system to qualify the real problem.
- **Option matrix** — 2–3 genuinely different approaches before planning.
- **Handoff** — packaged output for `cm-planning` / `cm-execution`.

This is **methodology in Markdown** for agents; the CLI still persists outcomes via `.cm/` and memory stores when you follow the skill’s recording steps.

## Parallel layer (execution)

Parallelism shows up in three practical ways in CodyMaster:

1. **Independent tasks** — agent guidance to split work with no shared state (see skill `cm-execution` in `skills/cm-execution/SKILL.md`).
2. **Skill chains** — `cm chain` records executions in `kanban.json` (`chainExecutions` in `src/data.ts`).
3. **Background checks** — e.g. non-blocking update check in `src/index.ts`.

## How it fits the codebase


| Concern                       | Where it lives                                   |
| ----------------------------- | ------------------------------------------------ |
| Command registration          | `src/cli/command-registry.ts`                    |
| Chain persistence             | `src/data.ts`, `src/skill-chain.ts` (if present) |
| Context handoff between steps | `src/context-bus.ts`, MCP bus tools              |
| Memory of decisions           | `src/context-db.ts` / `src/storage-backend.ts`   |


## Recommended sequence

1. **Brainstorm** (`cm-brainstorm-idea` skill) → qualified problem + options.
2. **Plan** (`cm-planning` skill) → implementation plan.
3. **Execute** (`cm-execution` skill) → parallelize independent tasks.
4. **Gate** — tests + security/deploy gates ([Testing & release](../quality/testing-and-release.md)).

## See also

- [How it works](../getting-started/how-it-works.md)  
- [Engineering pipeline](../workflows/engineering-pipeline.md)  
- [Using skills](../operations/using-skills.md)