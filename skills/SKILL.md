---
name: content-factory
description: "AI Content Factory v2.0 — Self-learning content engine with real-time dashboard, multi-agent support, and token management. Interactive onboarding → auto-research → generate → audit → deploy. Config-driven, niche-agnostic, self-improving."
skills:
  - seo-content-writer
  - competitor-analysis
  - frontend-design
---

# Content Factory v2.0 — AI Content Machine Platform

Config-driven, **self-improving** content factory with **real-time dashboard**, **multi-agent independence**, and **token management**. Gets smarter with use through memory + reward system.

## Architecture

```
┌─────────────────────────────────────────────┐
│         🌐 DASHBOARD (localhost:5050)        │
│  Pipeline │ Tasks │ Tokens │ Logs │ Landing  │
└───────────┬─────────────────────────────────┘
            │ SSE / Polling
┌───────────┴─────────────────────────────────┐
│            🏭 PIPELINE ENGINE               │
│  ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │  State   │ │  Token   │ │   Agent    │  │
│  │ Manager  │ │ Manager  │ │ Dispatcher │  │
│  └──────────┘ └──────────┘ └────────────┘  │
│                    │                         │
│  EXTRACT → PLAN → WRITE → AUDIT → SEO → PUB│
│                    │         │              │
│              📊 SCOREBOARD (reward/penalty)  │
│                    │                         │
│              🧠 MEMORY (3-layer learning)   │
└─────────────────────────────────────────────┘
```

**Config file**: `content-factory.config.json` at project root. Schema: `config.schema.json`.

---

## 🚀 Quick Start

```bash
# New project (interactive wizard)
python3 scripts/wizard.py

# Full pipeline WITH dashboard
python3 scripts/pipeline.py --dashboard

# Pipeline with budget limit
python3 scripts/pipeline.py --dashboard --budget 5.0

# Dashboard only (standalone)
python3 scripts/dashboard_server.py
```

### Phase 0: Discovery (MANDATORY)

AI MUST ask 5 question groups in order:

| # | Group | Key Questions |
|---|-------|---------------|
| Q1 | Niche Info | Lĩnh vực, brand, địa chỉ, phone, USP |
| Q2 | Reference & Avoid | Website tham khảo, phong cách tránh, tone |
| Q3 | Data Sources | Files có sẵn, URLs extract, hình ảnh |
| Q4 | Content Goals | Số bài, keywords, ngôn ngữ, khu vực |
| Q5 | Deploy | Cloudflare account, domain, milestone |

### Phase 0.5: Confirm

Display summary table → **WAIT for user OK** → then proceed.

---

## Operating Modes (12)

| Mode | Script | Purpose |
|------|--------|---------
| 📦 EXTRACT | `extract.py` | Source docs → JSON knowledge-base |
| 📋 PLAN | `plan.py` | Knowledge → topic queue |
| ✍️ WRITE | `write.py` | AI content generation (batch/single) |
| 🔍 AUDIT | `audit.py` | Quality check + auto-fix |
| 🔎 SEO | `seo.py` | Metadata optimization |
| 🚀 PUBLISH | `publish.py` | Build + deploy |
| 🧠 LEARN | `scoreboard.py` + `memory.py` | Extract patterns from feedback |
| 🔬 RESEARCH | `research.py` | Auto-research new topics |
| 💰 REVIEW | `monetize.py` | Monetization scoring |
| 🏭 PIPELINE | `pipeline.py` | Full automated A→Z |
| 📊 DASHBOARD | `dashboard_server.py` | Real-time web dashboard |
| 🎯 LANDING | `landing_generator.py` | Persona-based landing pages |

All scripts: `python3 scripts/<script> --config content-factory.config.json`

---

## Dashboard (NEW in v2.0)

Real-time web dashboard at `http://localhost:5050`:
- **Pipeline Progress**: Visual 6-phase timeline with progress bars
- **Task Queue**: Active/queued/completed/failed task cards
- **Token Tracker**: Cost by provider, budget progress bar
- **Event Log**: Filterable real-time log viewer
- **Error Panel**: Highlighted error details

```bash
# Auto-start with pipeline
python3 scripts/pipeline.py --dashboard --dashboard-port 5050

# Standalone
python3 scripts/dashboard_server.py --port 5050
```

---

## Multi-Agent Support (NEW in v2.0)

Multiple agents can work independently on the same pipeline via file-based task queue.

```python
from agent_dispatcher import AgentDispatcher
d = AgentDispatcher()

# Enqueue tasks
d.enqueue("write-article-1", "write", {"topic": "SEO Tips"}, priority=3)
d.enqueue_batch([{"id": "w-2", "type": "write"}, {"id": "w-3", "type": "write"}])

# Agent claims next task
task = d.claim_next("gemini-agent-1")
d.heartbeat("gemini-agent-1", task["id"])  # Keep alive

# Complete or fail
d.complete(task["id"], "gemini-agent-1", {"result": "ok"})
d.fail(task["id"], "gemini-agent-1", "API timeout")  # Auto-retry up to 3x
```

Features: priority ordering, stale lock detection (10min), auto-retry (3x), heartbeat.

---

## Token Management (NEW in v2.0)

Track token usage, costs, rate limits, and budget across all providers.

```python
from token_manager import TokenManager
tm = TokenManager(budget_usd=5.0)

# Record usage
tm.record_usage("gemini", input_tokens=1000, output_tokens=500, task_id="w-1")

# Check budget
if not tm.check_budget():
    print("Budget exceeded!")

# Rate limiting
tm.wait_if_rate_limited("gemini")

# Circuit breaker (auto-stop after 5 consecutive failures)
if tm.is_circuit_open("gemini"):
    print("Provider down, switching...")
```

```bash
python3 scripts/token_manager.py status
```

---

## Landing Pages (NEW in v2.0)

Generate persona-based landing pages using Content Mastery SB7 framework.

Add `personas` array to config:
```json
{
  "personas": [{
    "name": "Economic Buyer",
    "headline": "Tiết Kiệm 50% Chi Phí Marketing",
    "subheadline": "AI tạo nội dung chuyên nghiệp, nhanh gấp 10x",
    "pain_points": ["Chi phí marketing cao", "Thiếu nhân sự content"],
    "benefits": [{"title": "Tiết kiệm", "description": "Giảm 50% chi phí"}],
    "social_proof": [{"number": "2,347", "label": "Doanh nghiệp tin dùng"}],
    "steps": [{"title": "Cấu hình", "description": "Nhập thông tin doanh nghiệp"}],
    "cta_text": "Dùng Thử Miễn Phí"
  }]
}
```

```bash
python3 scripts/landing_generator.py --config content-factory.config.json
python3 scripts/landing_generator.py --config content-factory.config.json --list
```

---

## Pipeline Execution

```
1. INIT     → wizard.py + scaffold.py → Astro project + config
2. RESEARCH → pipeline:research → 30+ topics
3. EXPAND   → expand-topics.py → 30 → target (100/200/...)
4. WRITE    → pipeline:write → 3 workers, 8s sleep, ~3 articles/min
5. MILESTONE → audit → build → deploy (at 50%/100%)
6. SHIP     → Final audit → deploy → notify user
```

### 🛡️ Golden Rules (Score 95+)
- **Performance**: Font preload, critical CSS inline, preconnect, img width/height, GTM defer
- **Accessibility**: WCAG AA contrast (#555+ on white), semantic HTML, h1-h3 hierarchy
- **Security**: CSP/HSTS/XFO headers via `public/_headers`, cache `immutable` for `/_astro/*`
- **SEO**: `robots.txt` → sitemap, proper meta tags

---

## Self-Learning System

### Memory (3 layers)
| Layer | Path | Purpose |
|-------|------|---------|
| Semantic | `memory/semantic/` | Long-term patterns, style, SEO rules |
| Episodic | `memory/episodic/` | Per-session experiences + outcomes |
| Working | `memory/working/` | Current session context |

### Scoreboard
| Event | Points |
|-------|--------|
| User praise | +10 |
| Engagement (share/bookmark) | +5 |
| Article passes audit first try | +3 |
| User edits article | -5 |
| User deletes article | -10 |
| Audit fail | -3 |

---

## Scripts Reference

### Core Pipeline
| Script | Purpose |
|--------|---------|
| `pipeline.py` | Master orchestrator (6-phase) + dashboard integration |
| `extract.py` | Source extraction |
| `plan.py` | Topic planning |
| `write.py` | AI content writer |
| `audit.py` | Quality audit + fixer |
| `seo.py` | SEO optimization |
| `validate.py` | Content validation |
| `publish.py` | Build + deploy |
| `deploy.py` | Multi-platform deploy |

### Platform Layer (NEW v2.0)
| Script | Purpose |
|--------|---------|
| `state_manager.py` | Central state management (JSON + JSONL events) |
| `token_manager.py` | Token tracking, cost, rate limits, circuit breaker |
| `dashboard_server.py` | HTTP server + SSE for dashboard |
| `agent_dispatcher.py` | Multi-agent task queue with file locking |
| `landing_generator.py` | Persona → Landing page generator |

### Intelligence Layer
| Script | Purpose |
|--------|---------|
| `memory.py` | 3-layer memory engine |
| `scoreboard.py` | Reward/penalty system |
| `research.py` | Auto-research engine |
| `monetize.py` | Monetization scoring |

### Setup
| Script | Purpose |
|--------|---------|
| `wizard.py` | Interactive project setup |
| `scaffold.py` | Website scaffolding (Astro) |

---

## ⚠️ Rules

1. **LUÔN hỏi trước khi làm** — Phase 0 Discovery bắt buộc
2. **LUÔN confirm** — Hiển thị summary, chờ user OK
3. **LUÔN thông báo milestone** — Tại 50%, deploy milestone, hoàn thành
4. **KHÔNG deploy khi chưa audit** — Luôn audit trước deploy
5. **KHÔNG skip câu hỏi** — Nếu user không cung cấp, dùng default + confirm
6. **LUÔN dùng dashboard** — Khi chạy pipeline, thêm `--dashboard`
