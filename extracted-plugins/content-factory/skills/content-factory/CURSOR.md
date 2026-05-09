# Content Factory v2.0 — AI Content Machine Platform

> Read `SKILL.md` for complete architecture and all operating modes.

## Quick Commands

```bash
# Pipeline with dashboard
python3 scripts/pipeline.py --dashboard

# Pipeline with budget
python3 scripts/pipeline.py --dashboard --budget 5.0 --batch 20

# Dashboard only
python3 scripts/dashboard_server.py

# Status
python3 scripts/pipeline.py --status
python3 scripts/state_manager.py status
python3 scripts/token_manager.py status
python3 scripts/agent_dispatcher.py status

# Landing Pages
python3 scripts/landing_generator.py --config content-factory.config.json

# New Project
python3 scripts/wizard.py
```

## Multi-Agent Protocol

```python
from agent_dispatcher import AgentDispatcher
d = AgentDispatcher()
task = d.claim_next("cursor-1")
d.complete(task["id"], "cursor-1")
```

## 12 Operating Modes
EXTRACT, PLAN, WRITE, AUDIT, SEO, PUBLISH, LEARN, RESEARCH, REVIEW, PIPELINE, DASHBOARD, LANDING

## Workflows
`/create` `/content-factory` `/write-batch` `/write` `/edit` `/audit-fix` `/seo-optimize` `/publish` `/learn` `/research` `/schedule` `/dashboard` `/landing`
