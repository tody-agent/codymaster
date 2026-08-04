---
title: Orchestration Skills
description: CodyMaster skills for skill chains, execution modes, project bootstrap, safe deploy, and meta-skill navigation.
keywords: orchestration skills, skill chain, execution, bootstrap
robots: index, follow
---

# Orchestration Skills

| Skill | Open |
|-------|------|
| cm-autopilot | `skills/cm-autopilot/SKILL.md` |
| cm-codeintell | `skills/cm-codeintell/SKILL.md` |
| cm-ecosystem-roadmap | `skills/cm-ecosystem-roadmap/SKILL.md` |
| cm-execution | `skills/cm-execution/SKILL.md` |
| cm-project-bootstrap | `skills/cm-project-bootstrap/SKILL.md` |
| cm-reactor | `skills/cm-reactor/SKILL.md` |
| cm-safe-deploy | `skills/cm-safe-deploy/SKILL.md` |
| cm-skill-chain | `skills/cm-skill-chain/SKILL.md` |
| cm-skill-evolution | `skills/cm-skill-evolution/SKILL.md` |
| cm-skill-index | `skills/cm-skill-index/SKILL.md` |
| cm-start | `skills/cm-start/SKILL.md` |

## Self-healing loop

The advisory loop is the recommended entry point before you use self-healing skills:

```bash
cm advisory report --project .
cm advisory metrics --project .
cm advisory handoff --project . --for cm-skill-health
```

Then continue with:

- `cm advisory handoff --for cm-skill-health` to build the diagnosis payload
- `cm-skill-evolution` to act in `FIX`, `DERIVED`, or `CAPTURED` mode

Use `cm-skill-index` for skill discovery and selection.

## Execution routing and review gates

- Use Mode E for two or more independent tasks after file/dependency analysis and conflict pre-flight. Each parallel task owns a scoped quality contract.
- Use Mode B for ordered or dependent tasks when the harness supports isolated resumable sessions. Every task receives a fresh implementer, then independent spec and quality reviewers, with coordinator verification last.
- Use Mode F or Mode A when the harness cannot preserve Mode B session independence; disclose the reduced independence instead of labeling the fallback Mode B.
- Reuse scoped execution authorization after plan approval. Do not add per-step or per-batch confirmation prompts unless scope or authorization changes.

The [workflow integration benchmark](../benchmarks/workflow-integration.md) guards these routes alongside planning completeness, confirmation count, and sensitive-action approvals.

## See also

- [How it works](../getting-started/how-it-works.md)  
- [Advisory Loop](../workflows/advisory-loop.md)
- [Data flow](../architecture/data-flow.md)  
- [All skills](./index.md)  
