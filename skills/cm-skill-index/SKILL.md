---
name: cm-skill-index
description: "Progressive Disclosure skill index — efficient skill loading in 3 layers. Layer 1 (index, ~100 tokens) always loaded. Layer 2 (summary, ~300 tokens) loaded on context need. Layer 3 (full SKILL.md) loaded on execution only."
---

# Skill Index — Progressive Disclosure Engine

> **Save 90%+ tokens.** Agents scan the index first, load full skills only when executing.
> Inspired by Loki Mode's 3-Layer Progressive Disclosure memory architecture.

## The Problem

Traditional approach: Load every SKILL.md to decide which skill to use.
- 30+ skills × ~4000 tokens each = **120,000 tokens just for discovery**
- Agent only needs ~500 tokens to make the choice
- **119,500 tokens wasted on reading full skills**

## The Solution: 3-Layer Loading

```
┌────────────────────────────────────────────────┐
│ LAYER 1: INDEX (~100 tokens per skill)          │
│ Always loaded. Quick scan. "What exists?"        │
│ Name + Domain + Triggers + 1-line summary       │
└─────────────────────┬──────────────────────────┘
                      │ (match found?)
                      v
┌────────────────────────────────────────────────┐
│ LAYER 2: SUMMARY (~300 tokens per skill)        │
│ Load when choosing. "Is this the right one?"     │
│ Description + When to use + Integration table   │
└─────────────────────┬──────────────────────────┘
                      │ (confirmed?)
                      v
┌────────────────────────────────────────────────┐
│ LAYER 3: FULL SKILL.md (3000-5000 tokens)       │
│ Load ONLY during execution. "How to use it."     │
│ Complete instructions, examples, red flags       │
└────────────────────────────────────────────────┘
```

## Layer 1: Skill Index

**Always loaded by agents at session start.** Maximum 100 tokens per skill.

### Engineering Swarm 🔧

| Skill | Triggers | Summary |
|-------|----------|---------|
| `cm-tdd` | test, TDD, red-green-refactor | Red-Green-Refactor cycle before any implementation |
| `cm-debugging` | bug, error, fix, debug, broken | Root cause analysis before fixing. 5-phase investigation |
| `cm-quality-gate` | deploy, ship, verify, quality, gate | 6-gate verification: static analysis → blind review → ship |
| `cm-test-gate` | test setup, CI, test infrastructure | Setup 4-layer test gate for any project type |
| `cm-code-review` | review, PR, feedback, branch | Request reviews, handle feedback, complete branches |

### Operations Swarm ⚙️

| Skill | Triggers | Summary |
|-------|----------|---------|
| `cm-safe-deploy` | deploy, staging, production, release | Multi-gate deploy pipeline with rollback strategy |
| `cm-identity-guard` | git push, deploy, Cloudflare, Supabase, account | Verify identity before any push/deploy to prevent wrong-account |
| `cm-git-worktrees` | branch, isolate, worktree, parallel | Isolated git worktrees for feature work |
| `cm-terminal` | command, terminal, run, execute | Safe terminal execution with progress logging |

### Security Swarm 🔒

| Skill | Triggers | Summary |
|-------|----------|---------|
| `cm-secret-shield` | secret, token, leak, security, scan, pre-commit, gitleaks, rotate | Defense-in-depth: pre-commit hooks, repo scanning, token lifecycle |

### Product Swarm 🎨

| Skill | Triggers | Summary |
|-------|----------|---------|
| `cm-brainstorm-idea` | analyze, enhance, improve, initiative, evaluate, review product | Strategic analysis gate: 9 Windows + Double Diamond → 2-3 qualified options |
| `cm-planning` | plan, design, brainstorm, feature | Brainstorm intent → write implementation plan → then code |
| `cm-ux-master` | UI, UX, design, interface, usability | 48 UX Laws + 37 Design Tests + Figma/Stitch integration |
| `cm-ui-preview` | preview, visual, mockup, render UI, wireframe | Live UI concept generation via Google Stitch or Pencil MCP |
| `cm-dockit` | docs, documentation, knowledge base, SOP | Generate complete knowledge base from codebase |
| `cm-project-bootstrap` | new project, init, bootstrap, setup | Full project setup: design system → staging → CI → deploy |
| `cm-jtbd` | customer discovery, JTBD, jobs to be done, product-market fit, why users churn | JTBD canvas: Switch Interview → Outcome Metrics → Opportunity Scoring |

### Growth Swarm 📈

| Skill | Triggers | Summary |
|-------|----------|---------|
| `cm-content-factory` | content, blog, article, marketing | AI content engine: research → generate → audit → deploy |
| `cm-ads-tracker` | pixel, tracking, GTM, Meta, TikTok, Google Ads | Complete conversion tracking setup across platforms |
| `cro-methodology` | conversion, A/B test, landing page, funnel | CRO audit: funnel mapping → persuasion → objection handling |

### Orchestration Swarm 🎯

| Skill | Triggers | Summary |
|-------|----------|---------|
| `cm-execution` | execute, implement, plan, RARV, batch | Execute plans: batch mode, subagent-driven, parallel, or RARV |
| `cm-continuity` | memory, context, CONTINUITY, learnings | Working memory protocol: read at start, update at end |
| `cm-skill-mastery` | which skill, skill list, discover, help | Meta-skill: when to invoke skills, how to create new ones |
| `cm-safe-i18n` | translate, i18n, language, localize | Safe translation with multi-pass batching and audit gates |
| `cm-skill-chain` | chain, pipeline, workflow, multi-step, full process | Compose skills into automated multi-step pipelines |
| `cm-deep-search` | semantic search, find docs, large codebase, qmd | Optional power-up for semantic search across large projects |
| `cm-readit` | audio, TTS, read aloud, voice, speech, SpeechSynthesis, MP3 player | Web audio engine — TTS reader, pre-recorded MP3 player, Voice CRO triggers |
| `cm-how-it-work` | how does X work, explain, architecture overview | Explain how a system, feature, or codebase works |

### Workflow Commands 🖥️

| Skill | Triggers | Summary |
|-------|----------|---------|
| `cm-start` | /cm-start, start workflow, begin objective, new task | Orchestrate full cm-* workflow from objective to production code |
| `cm-dashboard` | /cm-dashboard, kanban, task board, show tasks, status board | Render Kanban board from cm-tasks.json — visual task overview |
| `cm-status` | /cm-status, quick status, progress, what's next, blocked | Ultra-concise progress summary: done / next / blocked |

### Planned (not yet implemented) 🧪

> Skills below do not have SKILL.md files yet.

| Skill | Triggers | Summary |
|-------|----------|---------|
| `mom-test` *(planned)* | customer interview, validate idea, leading questions | Customer interviews without leading questions |
| `release-it` *(planned)* | production, circuit breaker, timeout, chaos | Build production-ready systems with stability patterns |
| `medical-research` *(planned)* | medical, OB/GYN, clinical, evidence-based | Evidence-based medical writing with citation standards |
| `tailwind-mastery` *(planned)* | Tailwind, utility-first, responsive, v4 | Tailwind CSS utilities, responsive, accessibility |
| `pandasai-analytics` *(planned)* | DataFrame, analytics, forecast, time-series | Natural language DataFrame analysis and visual reports |
| `google-forms-sheet` *(planned)* | Google Form, sheet, App Script | Form-to-sheet integration with auto-retry |
| `skill-creator-ultra` *(planned)* | create skill, new skill, automate workflow | Create new AI skills from ideas or workflows |

## Layer 2: Skill Summary

**Loaded when an agent has matched a skill from Layer 1 and needs more context.**

To access Layer 2, read the first 20 lines of the corresponding SKILL.md (frontmatter + first section).

```
Example: cm-tdd Layer 2
  - Full name: "TDD — Test Before Write"
  - When to Use: ALWAYS before implementing any feature or bugfix
  - Process: Red (write failing test) → Green (minimal code) → Refactor (clean up)
  - Integration: Works with cm-execution (subagent TDD), cm-quality-gate (coverage check)
  - Token cost: ~4200 tokens for full skill
```

## Layer 3: Full SKILL.md

**Loaded ONLY when executing.** Read the complete SKILL.md file.

```bash
# Agent loads full skill only when ready to execute
view_file /path/to/skills/cm-tdd/SKILL.md
```

## Usage Protocol

```
1. AT SESSION START:
   - Load this skill index (Layer 1) — costs ~2500 tokens total
   - Now you know what 33 skills do without reading any of them

2. WHEN MATCHING A TASK:
   - Scan Layer 1 triggers to find matching skill(s)
   - If unsure, read Layer 2 (first 20 lines of SKILL.md)
   - Choose the best skill

3. WHEN EXECUTING:
   - Load Layer 3 (full SKILL.md) for the chosen skill
   - Follow the skill's instructions completely

4. SAVINGS:
   - Without index: 33 × 4000 = 132,000 tokens
   - With index: 2800 + 300 + 4000 = 7,100 tokens
   - Saved: ~124,900 tokens (~94%)
```

## Skill Domain Mapping

For dynamic agent selection (Phase 3), skills map to domains:

```yaml
engineering: [cm-tdd, cm-debugging, cm-quality-gate, cm-test-gate, cm-code-review]
operations: [cm-safe-deploy, cm-identity-guard, cm-git-worktrees, cm-terminal, cm-safe-i18n]
security: [cm-secret-shield]
product: [cm-brainstorm-idea, cm-planning, cm-ux-master, cm-ui-preview, cm-dockit, cm-project-bootstrap, cm-jtbd]
growth: [cm-content-factory, cm-ads-tracker, cro-methodology]
orchestration: [cm-execution, cm-continuity, cm-skill-mastery, cm-skill-chain, cm-deep-search, cm-readit, cm-how-it-work]
commands: [cm-start, cm-dashboard, cm-status]
# planned (no SKILL.md yet): mom-test, release-it, medical-research, tailwind-mastery, pandasai-analytics, google-forms-sheet, skill-creator-ultra
```

## The Bottom Line

**Know everything. Load nothing. Execute precisely. Save 90%+ tokens.**
