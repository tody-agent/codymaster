# Content Factory v2.0 — AI Content Machine Platform

Compatible with: Gemini CLI, Claude Code, Cursor, OpenCode, Kimi CLI, Cline, Codex, and any MCP-compatible agent.

## How This Skill Works
Self-learning AI content factory with **real-time dashboard**, **multi-agent support**, and **token management**. Generates, audits, and deploys SEO-optimized content at scale. Read `SKILL.md` for complete architecture.

## Quick Start

```bash
# New project (interactive wizard)
python3 scripts/wizard.py

# Full pipeline with dashboard
python3 scripts/pipeline.py --dashboard

# Pipeline with budget limit
python3 scripts/pipeline.py --dashboard --budget 5.0

# Check status
python3 scripts/pipeline.py --status

# Dashboard only
python3 scripts/dashboard_server.py

# Token usage
python3 scripts/token_manager.py status
```

## Multi-Agent Protocol

When working alongside other agents:

```bash
# 1. Check task queue
python3 scripts/agent_dispatcher.py status

# 2. Agent claims a task (replace AGENT_ID with your identifier)
#    Use the AgentDispatcher class in your scripts:
#    from agent_dispatcher import AgentDispatcher
#    d = AgentDispatcher(); task = d.claim_next("gemini-1")

# 3. Complete or fail task
#    d.complete(task_id, "gemini-1", {"result": "ok"})
#    d.fail(task_id, "gemini-1", "reason")
```

## 12 Modes
EXTRACT, PLAN, WRITE, AUDIT, SEO, PUBLISH, LEARN, RESEARCH, REVIEW, PIPELINE, DASHBOARD, LANDING

## Landing Pages
```bash
# Generate landing pages from persona config
python3 scripts/landing_generator.py --config content-factory.config.json

# List personas
python3 scripts/landing_generator.py --config content-factory.config.json --list
```

## Workflows
`/create` `/content-factory` `/extract` `/write-batch` `/write` `/edit` `/audit-fix` `/seo-optimize` `/publish` `/learn` `/research` `/schedule` `/dashboard` `/landing`
