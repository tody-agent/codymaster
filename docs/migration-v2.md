# CodyMaster v6.0 Migration Guide

> **Effective**: v6.0.0 (CM v2.0 architecture upgrade)
> **Removal**: deprecated skills will be deleted in v6.1.0
> **For**: existing CodyMaster users updating from v5.x

## TL;DR

CodyMaster v6 consolidates 60 skills down to **39 focused skills** by merging
overlapping capabilities. Every removed skill leaves a redirect stub that points
to its replacement, so CI/automation that references old names will keep working
through one release cycle.

## What's deprecated

| Old skill | Use instead | Why |
|---|---|---|
| `cm-qa-visual-cli` | `cm-browse` | Both drove the browser daemon |
| `cm-dashboard` | `cm-status` | Both visualized project state |
| `cm-skill-search` | `cm-skill-index` | Skill discovery merged |
| `cm-skill-mastery` | `cm-skill-index` | Meta-skill folded into index |
| `cm-skill-health` | `cm-skill-evolution` | Skill lifecycle merged |
| `cm-skill-share` | `cm-skill-evolution` | Skill lifecycle merged |
| `cm-test-gate` | `cm-quality-gate` | Quality gate now covers tests |
| `cm-post-deploy-canary` | `cm-quality-gate` | Canary now part of quality gate |
| `cm-secret-shield` | `cm-safe-deploy` | Deploy safety merged |
| `cm-security-gate` | `cm-safe-deploy` | Deploy safety merged |
| `cm-design-studio` | `cm-design-system` | Design pipeline merged |
| `cm-ui-preview` | `cm-design-system` | UI preview is part of design system |
| `cm-conductor-worktrees` | `cm-execution` | Parallel execution mode |
| `cm-git-worktrees` | `cm-execution` | Worktree management is part of execution |
| `cm-auto-publisher` | `cm-content-factory` | Content lifecycle merged |
| `cm-readit` | `cm-content-factory` | Audio/read features merged |
| `cm-cro-methodology` | `cm-growth-hacking` | Growth toolkit merged |
| `cm-booking-calendar` | `cm-growth-hacking` | Growth toolkit merged |
| `cm-google-form` | `cm-growth-hacking` | Growth toolkit merged |
| `cm-second-opinion-cli` | `cm-mcp-engineering` | Engineering bridge merged |
| `cm-engineering-meta` | `cm-mcp-engineering` | Engineering bridge merged |

That's **21 deprecations → 21 fewer SKILL.md files in your context budget per session**.

## Architecture changes (v2.0)

### 1. Compressed skill format

New SKILL.md template under `skills/_shared/SKILL_TEMPLATE.md`:

- `## TL;DR` (≤5 lines) — agent loads this first
- `## When to Use` — concrete triggers
- `## Full Protocol` — agent loads only when TL;DR is insufficient
- Frontmatter declares `token_budget: <int>` and `compressed: true`

The `validate-skills.mjs` script enforces v2 rules **only when `compressed: true`**, so existing skills migrate one at a time without breaking CI.

### 2. Sprint flow handoff

Sprint skills now emit typed JSON under `.cm/handoff/`:

```
.cm/handoff/
├── intent.json     ← cm-brainstorm-idea
├── plan.json       ← cm-planning
├── exec.json       ← cm-execution
├── review.json     ← cm-code-review
├── quality.json    ← cm-quality-gate
└── retro.json      ← cm-retro-cli
```

Schemas live in `src/handoff/contracts.ts`. Downstream skills read the predecessor's
handoff to pick up cold instead of re-deriving from the Markdown artifact.

API:

```ts
import { writeHandoff, readHandoff } from 'codymaster/handoff';

writeHandoff(projectPath, {
  schema: 'plan@1',
  emitted_at: new Date().toISOString(),
  emitted_by: 'cm-planning',
  data: { goal, decisions, first_tasks },
});

const plan = readHandoff(projectPath, 'plan@1');
```

Or via the sprint pipeline helper:

```ts
import { completeSprintStepWithHandoff } from 'codymaster/sprint-pipeline';
completeSprintStepWithHandoff(projectPath, 'plan', mdArtifact, planHandoff);
```

### 3. Per-project learnings

Append-only `.cm/learnings.jsonl` per project:

```bash
cm learn add "wrangler.toml must be at repo root for CF Pages" --type pitfall --scope deploy
cm learn list --filter-type pitfall
cm learn prune --days 180
```

`cm-continuity` auto-renders the most recent 10 entries into `CONTINUITY.md` so
future sessions read past pitfalls/preferences/patterns at start. Inspired by
gstack `/learn` but local-first; cross-project sync is opt-in for v6.1+.

## How to update your project

If you reference deprecated skill names in:

- **CI workflows**: bump to the merged-into name
- **Scripts**: same
- **Docs/playbooks**: update the references and link to this guide
- **CLAUDE.md / AGENTS.md**: regenerate with `cm bootstrap` or hand-edit

If a deprecated skill provided a capability that didn't carry over, please open
an issue: https://github.com/tody-agent/codymaster/issues

## Versioning

- **v6.0.0**: this release. Deprecation stubs in place. All old commands still resolve.
- **v6.0.x**: bug fixes; deprecation stubs still present.
- **v6.1.0**: deprecated skill folders deleted. Update your references before this lands.
