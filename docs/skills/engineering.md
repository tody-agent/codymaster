---
title: Engineering Skills
description: CodyMaster skills for implementation, testing, code review, browser QA, sprint bus, and engineering workflows.
keywords: engineering skills, tdd, code review, browse, sprint bus
robots: index, follow
---

# Engineering Skills

Use these when the primary risk is **correctness**, **regressions**, or **shipping code**.

| Skill | Open |
|-------|------|
| cm-browse | `skills/cm-browse/SKILL.md` |
| cm-clean-code | `skills/cm-clean-code/SKILL.md` |
| cm-code-review | `skills/cm-code-review/SKILL.md` |
| cm-debugging | `skills/cm-debugging/SKILL.md` |
| cm-guardian-runtime | `skills/cm-guardian-runtime/SKILL.md` |
| cm-mcp-engineering | `skills/cm-mcp-engineering/SKILL.md` |
| cm-retro-cli | `skills/cm-retro-cli/SKILL.md` |
| cm-sprint-bus | `skills/cm-sprint-bus/SKILL.md` |
| cm-tdd | `skills/cm-tdd/SKILL.md` |

Related workflows are covered by `cm-design-system`, `cm-execution`, `cm-quality-gate`, and `cm-mcp-engineering`.

## Pair with CLI

Engineering commands are registered via `registerEngineeringCommands` in `src/cli/command-registry.ts` — use `node dist/index.js --help` after build to see the live surface.

## See also

- [Engineering pipeline](../workflows/engineering-pipeline.md)  
- [All skills](./index.md)  
