---
title: "Skills Library"
description: "Complete catalog of all 33 Cody Master skills organized by domain. Every skill is open source — full documentation visible."
keywords: ["skills", "ai agent", "cody master", "skill library"]
robots: "index, follow"
---

# Skills Library

> **Quick Reference**
> - **Total Skills**: 33 across 6 domains
> - **Format**: Universal — works on any AI coding platform
> - **Open Source**: Full SKILL.md visible for every skill
> - **License**: MIT

Cody Master skills are **the instructions that turn AI agents into disciplined engineers**. Each skill is a `SKILL.md` file with structured protocols any AI agent can follow. Browse them all below — nothing is hidden.

## 🔧 Engineering

Skills that enforce code quality, testing, and review processes.

| Skill | Description | Full Docs |
|-------|-------------|-----------|
| **cm-tdd** | Red-Green-Refactor cycle — no production code without a failing test first. | [View →](./cm-tdd.md) |
| **cm-debugging** | Systematic 5-phase root cause investigation before any fix. | [View →](./cm-debugging.md) |
| **cm-quality-gate** | Evidence-based verification: test gates, blind review, anti-sycophancy, security scan. | [View →](./cm-quality-gate.md) |
| **cm-test-gate** | Setup 4-layer test infrastructure (unit → integration → e2e → security scan) for any stack. | [View →](./cm-test-gate.md) |
| **cm-code-review** | Full PR lifecycle — request reviews, handle feedback, complete branch integration. | [View →](./cm-code-review.md) |

## ⚙️ Operations

Skills that ensure safe deployment, isolation, and secret management.

| Skill | Description | Full Docs |
|-------|-------------|-----------|
| **cm-safe-deploy** | Multi-gate deploy pipeline: secret scan → syntax → test → build → deploy → smoke test. | [View →](./cm-safe-deploy.md) |
| **cm-identity-guard** | Verify project identity before push, Cloudflare, or Supabase operations. Prevents wrong-account deploys. | [View →](./cm-identity-guard.md) |
| **cm-git-worktrees** | Isolated git worktrees for parallel feature work — smart directory selection and safety checks. | [View →](./cm-git-worktrees.md) |
| **cm-terminal** | Safe terminal protocol — progress logging, output reading, error-stop. | [View →](./cm-terminal.md) |
| **cm-secret-shield** | Defense-in-depth: pre-commit hooks (Gitleaks), repo-wide scan, token lifecycle management. | [View →](./cm-secret-shield.md) |
| **cm-safe-i18n** | Mass i18n conversion — multi-pass batching, parallel dispatch, 8 audit gates. Battle-tested. | [View →](./cm-safe-i18n.md) |

## 🎨 Product

Skills for planning, design, documentation, and bootstrapping.

| Skill | Description | Full Docs |
|-------|-------------|-----------|
| **cm-brainstorm-idea** | Strategic analysis gate: 9 Windows (TRIZ) + Double Diamond → 2-3 qualified options for existing products. | [View →](./cm-brainstorm-idea.md) |
| **cm-planning** | Brainstorm intent → write implementation plan → coordinate execution. Required before complex tasks. | [View →](./cm-planning.md) |
| **cm-ux-master** | Ultimate design intelligence: 48 UX Laws, 37 Design Tests, Figma & Stitch integration, BM25 search. | [View →](./cm-ux-master.md) |
| **cm-ui-preview** | AI-powered UI generation via Google Stitch MCP. Stitch Build Loop + Prompt Optimization pipeline. | [View →](./cm-ui-preview.md) |
| **cm-dockit** | Knowledge systematization engine — generates tech docs, SOPs, API references as VitePress or Markdown. | [View →](./cm-dockit.md) |
| **cm-readit** | Web audio engine: TTS reader (SpeechSynthesis), pre-recorded MP3 player, Voice CRO trigger system. | [View →](./cm-readit.md) |
| **cm-project-bootstrap** | Full project setup from Day 0 — design system, CI, staging, i18n, SEO, AGENTS.md, 8-gate pipeline. | [View →](./cm-project-bootstrap.md) |
| **cm-jtbd** | Customer discovery via JTBD theory — Switch Interviews, JTBD Canvas, Opportunity Scoring. | [View →](./cm-jtbd.md) |

## 📈 Growth

Skills for content creation, marketing, and conversion optimization.

| Skill | Description | Full Docs |
|-------|-------------|-----------|
| **cm-content-factory** | Self-learning content engine: StoryBrand, Cialdini, SUCCESs, Hook Model, JTBD, CRO. Research → generate → audit → deploy. | [View →](./cm-content-factory.md) |
| **cm-ads-tracker** | Complete conversion tracking: Facebook/Meta Pixel + CAPI, TikTok Pixel, Google Ads, GTM. | [View →](./cm-ads-tracker.md) |
| **cro-methodology** | CRO audit: funnel mapping → persuasion assets → objection handling → A/B test design. | [View →](./cro-methodology.md) |

## 🎯 Orchestration

Skills that coordinate workflows, manage memory, and enable autonomous execution.

| Skill | Description | Full Docs |
|-------|-------------|-----------|
| **cm-execution** | Execute plans in 4 modes: Manual / Parallel / Subagent / RARV batch. | [View →](./cm-execution.md) |
| **cm-continuity** | Working memory protocol — 4-Tier Memory System, context persistence, learnings across sessions. | [View →](./cm-continuity.md) |
| **cm-skill-chain** | Compose skills into automated pipelines — 5 built-in chains (feature-dev, bug-fix, content-launch…). | [View →](./cm-skill-chain.md) |
| **cm-skill-index** | Progressive disclosure index — 90% token savings on skill discovery. Always loaded at session start. | [View →](./cm-skill-index.md) |
| **cm-skill-mastery** | Meta-skill: when to invoke which skill, how to create new skills, skill discovery guide. | [View →](./cm-skill-mastery.md) |
| **cm-deep-search** | Semantic search via qmd — BM25 + Vector + LLM re-ranking for large codebases (>200 src files). | [View →](./cm-deep-search.md) |
| **cm-how-it-work** | Complete vibe coding guide — 6 phases, 33 skills, 9 golden rules. Read this first if you're new. | [View →](./cm-how-it-work.md) |
| **cm-start** | Start the full CM workflow from objective → plan → TDD implement → verify → done. | — |
| **cm-dashboard** | Render Kanban board from `cm-tasks.json` — visual TO DO / IN PROGRESS / DONE view. | — |
| **cm-status** | Ultra-concise 1-2 sentence progress: what's done, what's next, what's blocked. | — |

## Creating Your Own Skills

Every skill follows the universal format:

```yaml
---
name: cm-your-skill
description: "One line — when to activate this skill"
---

# Skill Name

## When to Use
[Trigger conditions — be specific]

## Procedure
[Step-by-step workflow]

## Output
[What this skill produces]

## Integration
| Skill | Relationship |
|-------|-------------|
| cm-xxx | UPSTREAM / DOWNSTREAM / COMPLEMENT |
```

See [cm-example](./cm-example.md) for the complete template, and [cm-skill-mastery](./cm-skill-mastery.md) for the meta-guide on skill creation and discovery.

## Transparency

Every skill is **fully open**. Click "View →" to read the complete `SKILL.md` — nothing simplified, summarized, or hidden. The best way to trust AI automation is to see exactly what instructions the AI follows.
