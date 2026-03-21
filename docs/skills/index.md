---
title: "Skills Library"
description: "Complete catalog of all 33+ Cody Master skills organized by swarm. Every skill is open source — full documentation visible."
keywords: ["skills", "ai agent", "cody master", "skill library"]
robots: "index, follow"
---

# Skills Library

> **Quick Reference**
> - **Total Skills**: 33+ across 7 swarms
> - **Format**: Universal — works on any AI coding platform
> - **Open Source**: Full SKILL.md content visible for every skill
> - **License**: Open and transparent

Cody Master skills are **the instructions that turn AI agents into disciplined engineers**. Each skill is a markdown file (SKILL.md) with structured protocols that any AI agent can follow. Browse them all below — nothing is hidden.

## 🔧 Engineering Swarm

Skills that enforce code quality, testing, and review processes.

| Skill | Description | Full Docs |
|-------|-------------|-----------|
| **cm-tdd** | Use before writing implementation code. Test-driven development protocol. | [View →](./cm-tdd.md) |
| **cm-debugging** | Systematic root cause investigation for bugs, test failures, or unexpected behavior. | [View →](./cm-debugging.md) |
| **cm-quality-gate** | Enforces test gates, evidence-based verification, and frontend safety checks before deploy. No claims without evidence. | [View →](./cm-quality-gate.md) |
| **cm-test-gate** | Complete guide to setting up reliable test gates — stack detection, 4 core test files, script wiring, CI patterns. | [View →](./cm-test-gate.md) |
| **cm-code-review** | Full review lifecycle — request reviews, handle feedback, complete branch integration. | [View →](./cm-code-review.md) |

## ⚙️ Operations Swarm

Skills that ensure safe deployment, secret management, and workspace isolation.

| Skill | Description | Full Docs |
|-------|-------------|-----------|
| **cm-safe-deploy** | Multi-gate deploy pipeline with test gates, build verification, and rollback strategy. | [View →](./cm-safe-deploy.md) |
| **cm-identity-guard** | Verifies project identity before git push, Cloudflare deploy, or Supabase operations. Prevents wrong-account deploys. | [View →](./cm-identity-guard.md) |
| **cm-git-worktrees** | Creates isolated git worktrees for feature work. Smart directory selection and safety checks. | [View →](./cm-git-worktrees.md) |
| **cm-terminal** | Enforces progress logging, output reading, and error-stop for every terminal command. | [View →](./cm-terminal.md) |

## 🎨 Product Swarm

Skills for planning, design, documentation, and bootstrapping new projects.

| Skill | Description | Full Docs |
|-------|-------------|-----------|
| **cm-planning** | Required before any creative or multi-step task. Explores intent, requirements, and design before implementation. | [View →](./cm-planning.md) |
| **cm-brainstorm-idea** | Multi-dimensional evaluation using Design Thinking + TRIZ + Double Diamond. For existing product enhancements. | [View →](./cm-brainstorm-idea.md) |
| **cm-ux-master** | Ultimate UI/UX design intelligence — 48 UX Laws, 37 Design Tests, Figma & Stitch integration. | [View →](./cm-ux-master.md) |
| **cm-ui-preview** | AI-powered UI generation using Google Stitch MCP. Stitch Build Loop + Prompt Optimization. | [View →](./cm-ui-preview.md) |
| **cm-dockit** | Knowledge systematization engine — generates tech docs, SOP guides, API references as VitePress or Markdown. | [View →](./cm-dockit.md) |
| **cm-readit** | Turn any website into an audio-enabled experience — TTS, MP3 player, Voice CRO. Zero dependencies. | [View →](./cm-readit.md) |
| **cm-project-bootstrap** | New project scaffolding — design system, staging+production, i18n, SEO, AGENTS.md, test infrastructure, 8-gate pipeline. | [View →](./cm-project-bootstrap.md) |

## 📈 Growth Swarm

Skills for content creation, marketing automation, and conversion tracking.

| Skill | Description | Full Docs |
|-------|-------------|-----------|
| **cm-content-factory** | Self-learning content engine with StoryBrand, Cialdini, SUCCESs, Hook Model, JTBD, CRO frameworks. | [View →](./cm-content-factory.md) |
| **cm-ads-tracker** | Complete conversion tracking — Facebook/Meta Pixel + CAPI, TikTok Pixel, Google Ads, GTM container. | [View →](./cm-ads-tracker.md) |
| **cro-methodology** | Scientific CRO audit using the CRE Methodology — funnel mapping, visitor research, objection handling, and A/B testing. | [View →](./cro-methodology.md) |

## 🔒 Security Swarm

Skills for secret management, leak prevention, and security posture.

| Skill | Description | Full Docs |
|-------|-------------|-----------|
| **cm-secret-shield** | Defense-in-depth security — pre-commit secret scanning (Gitleaks), repo-wide pattern detection, token lifecycle management. | [View →](./cm-secret-shield.md) |

## 🧪 Specialized Skills

Domain-specific skills for targeted workflows.

| Skill | Description | Full Docs |
|-------|-------------|-----------|
| **cm-jtbd** | Customer discovery using JTBD theory — Switch Interviews, JTBD Canvas, and Opportunity Scoring for evidence-based product decisions. | [View →](./cm-jtbd.md) |

## 🎯 Orchestration Swarm

Skills that coordinate multi-skill workflows, working memory, and autonomous execution.

| Skill | Description | Full Docs |
|-------|-------------|-----------|
| **cm-execution** | Autonomous execution with 3 modes: batch, subagent-per-task, or parallel dispatch. | [View →](./cm-execution.md) |
| **cm-continuity** | Working memory protocol — 4-Tier Memory System with context persistence, Ebbinghaus decay, and scope-filtered learnings across sessions. | [View →](./cm-continuity.md) |
| **cm-deep-search** | Semantic memory power-up — detects large codebases and suggests qmd for local BM25 + Vector + LLM re-ranking search. | [View →](./cm-deep-search.md) |
| **cm-skill-chain** | Compose skills into automated pipelines with progress tracking and auto-detection. | [View →](./cm-skill-chain.md) |
| **cm-skill-mastery** | Meta-skill — when to invoke skills, how to create new skills, and skill discovery. | [View →](./cm-skill-mastery.md) |
| **cm-safe-i18n** | Mass i18n conversion with multi-pass batching, parallel dispatch, 8 audit gates. Battle-tested. | [View →](./cm-safe-i18n.md) |
| **cm-how-it-work** | Complete guide to Cody Master — from idea to deploy. Read this first if you're new. | [View →](./cm-how-it-work.md) |
| **cm-example** | Template demonstrating the universal skill format compatible with all platforms. | [View →](./cm-example.md) |

## Creating Your Own Skills

Every skill follows the universal format:

```yaml
---
name: my-custom-skill
description: "One line — when to use this skill"
---

# Skill Name

> One-line summary

## When to Use
[Trigger conditions]

## Procedure
[Step-by-step instructions]

## Rules
[Do's and Don'ts]
```

See [cm-example](./cm-example.md) for a complete template, and [cm-skill-mastery](./cm-skill-mastery.md) for the meta-guide on skill creation and discovery.

## Transparency

Every skill in this library is **fully open**. Click "View →" on any skill above to read its complete SKILL.md content — nothing is simplified, summarized, or hidden. We believe the best way to trust AI automation is to see exactly what instructions the AI follows.
