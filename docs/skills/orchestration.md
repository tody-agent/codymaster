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
| cm-skill-health | `skills/cm-skill-health/SKILL.md` |
| cm-skill-index | `skills/cm-skill-index/SKILL.md` |
| cm-skill-mastery | `skills/cm-skill-mastery/SKILL.md` |
| cm-skill-search | `skills/cm-skill-search/SKILL.md` |
| cm-skill-share | `skills/cm-skill-share/SKILL.md` |
| cm-start | `skills/cm-start/SKILL.md` |

## Self-healing loop

The advisory loop is the recommended entry point before you use self-healing skills:

```bash
cm advisory report --project .
cm advisory metrics --project .
cm advisory handoff --project . --for cm-skill-health
```

Then continue with:

- `cm-skill-health` to confirm whether a skill is healthy, degraded, or broken
- `cm-skill-evolution` to act in `FIX`, `DERIVED`, or `CAPTURED` mode

## See also

- [How it works](../getting-started/how-it-works.md)  
- [Advisory Loop](../workflows/advisory-loop.md)
- [Data flow](../architecture/data-flow.md)  
- [All skills](./index.md)  
