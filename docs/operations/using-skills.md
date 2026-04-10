---

title: Using Skills

## description: How to invoke CodyMaster skills in Claude, Cursor, or other agents — discovery, triggers, and handoffs.

keywords: codymaster skills, SKILL.md, agent instructions
robots: index, follow

# Using Skills

## What a skill is

Each skill is a folder under `skills/<skill-id>/` containing `**SKILL.md**` — instructions the agent follows (workflows, checklists, output formats). Skills are validated by:

```bash
npm run validate:skills
npm run check:skills
```

(`package.json` → `scripts/validate-skills.mjs`, `scripts/build-skills.mjs`)

## How to use them in practice

1. **Name the skill** in your prompt — e.g. “Follow `cm-tdd` before writing implementation code.”
2. **Load the file** if your client supports file attachments — open `skills/cm-planning/SKILL.md`.
3. **Chain work** — when a skill says “hand off to X”, switch to that skill explicitly.
4. **Persist outputs** — write summaries to `.cm/` or memory as the skill describes so MCP tools can find them later.

## Discovery

- Browse the categorized lists in the [Skills library](../skills/index.md).
- Use your editor search across `skills/**/SKILL.md` for keywords.

## CLI vs skills


| Mechanism       | What it does                                             |
| --------------- | -------------------------------------------------------- |
| `cm …` commands | Runs TypeScript in this repo                             |
| Skills          | Tells the agent *how* to use tools and *what* to produce |


## See also

- [Working memory](./working-memory.md)  
- [Codebase analysis](./codebase-analysis.md)  
- [TRIZ-Parallel engine](../architecture/triz-parallel-engine.md)

