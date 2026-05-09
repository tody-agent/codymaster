# Content Factory v2.0 — AI Content Machine Platform

> Read `SKILL.md` for complete architecture and all operating modes.

## Quick Commands

All scripts in `scripts/` directory. Run from project root with `content-factory.config.json`.

```bash
# Pipeline with live dashboard
python3 scripts/pipeline.py --dashboard
python3 scripts/pipeline.py --dashboard --budget 5.0

# Pipeline (no dashboard)
python3 scripts/pipeline.py --status
python3 scripts/pipeline.py --batch 10

# Dashboard only
python3 scripts/dashboard_server.py

# Single Article
python3 scripts/write.py --config content-factory.config.json --batch 1 --topic "TOPIC"

# Audit & Fix
python3 scripts/audit.py --config content-factory.config.json --fix

# Token Usage
python3 scripts/token_manager.py status

# State Management
python3 scripts/state_manager.py status
python3 scripts/state_manager.py events

# Multi-Agent Queue
python3 scripts/agent_dispatcher.py status

# Landing Pages
python3 scripts/landing_generator.py --config content-factory.config.json
python3 scripts/landing_generator.py --config content-factory.config.json --list

# Learn & Improve
python3 scripts/scoreboard.py --config content-factory.config.json --detect-changes
python3 scripts/memory.py --config content-factory.config.json --learn

# Research
python3 scripts/research.py --config content-factory.config.json --topic "TOPIC"

# New Project
python3 scripts/wizard.py
```

## Multi-Agent Protocol

```python
from agent_dispatcher import AgentDispatcher
d = AgentDispatcher()
task = d.claim_next("claude-1")      # Claim next task
d.heartbeat("claude-1", task["id"])   # Keep heartbeat
d.complete(task["id"], "claude-1")    # Mark done
```

## Workflows
`/create` `/content-factory` `/write-batch` `/write` `/edit` `/audit-fix` `/seo-optimize` `/publish` `/learn` `/research` `/schedule` `/dashboard` `/landing`
