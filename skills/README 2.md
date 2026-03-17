<![CDATA[<div align="center">

# 🏭 Content Factory v2.0

**AI Content Machine Platform — Self-learning content engine with real-time dashboard**

[![Python 3.11+](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://python.org)
[![Tests](https://img.shields.io/badge/Tests-74%20passing-10b981)](tests/)
[![License](https://img.shields.io/badge/License-MIT-06b6d4)](LICENSE)

[English](#features) · [Tiếng Việt](#tính-năng) · [中文](#特性) · [日本語](#機能)

</div>

---

## Features

Config-driven, **self-improving** content factory with real-time dashboard, multi-agent independence, and token management.

| Feature | Description |
|---------|-------------|
| 🌐 **Live Dashboard** | Real-time pipeline tracking at `localhost:5050` |
| 🤖 **Multi-Agent** | Gemini CLI, Claude, Cursor, OpenCode work independently |
| 💰 **Token Management** | Cost tracking, rate limiting, circuit breaker, budget control |
| 🎯 **Landing Pages** | Persona-based pages with SB7 framework, multi-language |
| 🧠 **Self-Learning** | 3-layer memory system + reward/penalty scoring |
| 📊 **12 Operating Modes** | Extract → Plan → Write → Audit → SEO → Publish + more |

### Architecture

```
┌──────────────────────────────────────────┐
│       🌐  DASHBOARD (localhost:5050)     │
│  Pipeline │ Tasks │ Tokens │ Logs        │
└──────────┬───────────────────────────────┘
           │ SSE / Polling
┌──────────┴───────────────────────────────┐
│           🏭  PIPELINE ENGINE            │
│  State Manager │ Token Manager │ Queue   │
│  EXTRACT → PLAN → WRITE → AUDIT → SEO → │
│  📊 Scoreboard ← 🧠 Memory (3-layer)   │
└──────────────────────────────────────────┘
```

---

## Quick Start

```bash
# 1. Create new project
cf init

# 2. Run full pipeline with dashboard
cf run --dashboard

# 3. Check progress
cf status
```

### All Commands

```bash
cf run                          # Full pipeline
cf run --dashboard              # + live dashboard
cf run --budget 5.0             # + cost limit
cf run --phase write --batch 20 # Single phase
cf run --dry-run                # Preview only

cf dashboard                    # Dashboard standalone
cf status                       # Pipeline progress
cf tokens                       # Token usage & cost
cf queue                        # Task queue
cf landing                      # Generate landing pages
cf landing --list               # List personas
cf landing --lang en,vi,zh      # Multi-language pages
cf init                         # New project wizard
cf reset                        # Reset state
cf test                         # Run test suite
cf help                         # All commands
```

---

## Dashboard

Premium dark-mode dashboard with real-time updates via SSE.

| Section | Details |
|---------|---------|
| Pipeline Progress | 6-phase timeline with animated progress bars |
| Task Queue | Filterable by status (All/Running/Done/Failed) |
| Token Tracker | Per-provider cost, budget bar, request count |
| Event Log | Level-filtered log viewer (Info/Warn/Error) |
| Error Panel | Highlighted error details with source |

```bash
cf dashboard              # Open at localhost:5050
cf dashboard --port 8080  # Custom port
```

---

## Multi-Agent Support

Multiple AI agents can work on the same pipeline independently via file-based task queue.

```python
from agent_dispatcher import AgentDispatcher
d = AgentDispatcher()

d.enqueue("write-article-1", "write", {"topic": "SEO Tips"}, priority=3)
task = d.claim_next("gemini-1")     # Agent claims task
d.heartbeat("gemini-1", task["id"]) # Keep alive
d.complete(task["id"], "gemini-1")  # Mark done
```

Features: priority ordering, stale lock detection (10min), auto-retry (3x), heartbeat.

---

## Token Management

```python
from token_manager import TokenManager
tm = TokenManager(budget_usd=5.0)

tm.record_usage("gemini", input_tokens=1000, output_tokens=500)
tm.check_budget()              # True/False
tm.wait_if_rate_limited("gemini")
tm.is_circuit_open("gemini")   # Auto-stop after 5 failures
```

Supported providers: Gemini, Gemini Pro, Claude Sonnet/Haiku, GPT-4o/Mini.

---

## Landing Pages (Multi-language)

Generate persona-based landing pages in multiple languages.

```bash
# All personas, all configured languages
cf landing

# Specific language(s)
cf landing --lang en,vi,zh,ja

# List available personas
cf landing --list
```

Add personas + languages to your config:

```json
{
  "brand": { "name": "My Brand", "language": "vi" },
  "landing": {
    "languages": ["vi", "en", "zh", "ja"]
  },
  "personas": [{
    "name": "Economic Buyer",
    "i18n": {
      "vi": {
        "headline": "Tiết Kiệm 50% Chi Phí Marketing",
        "subheadline": "AI tạo nội dung chuyên nghiệp"
      },
      "en": {
        "headline": "Save 50% on Marketing Costs",
        "subheadline": "AI creates professional content"
      },
      "zh": {
        "headline": "节省50%营销成本",
        "subheadline": "AI创造专业内容"
      },
      "ja": {
        "headline": "マーケティングコストを50%節約",
        "subheadline": "AIがプロのコンテンツを作成"
      }
    }
  }]
}
```

---

## Self-Learning System

### Memory (3 layers)

| Layer | Purpose |
|-------|---------|
| Semantic | Long-term patterns, style rules, SEO insights |
| Episodic | Per-session experiences + outcomes |
| Working | Current session context |

### Scoring

| Event | Points |
|-------|--------|
| User praise | +10 |
| Engagement | +5 |
| First-pass audit | +3 |
| User edits | -5 |
| User deletes | -10 |
| Audit fail | -3 |

---

## Scripts Reference

| Script | Purpose |
|--------|---------|
| `pipeline.py` | Master orchestrator (6 phases) |
| `state_manager.py` | Central state (JSON + JSONL events) |
| `token_manager.py` | Cost tracking, rate limits, circuit breaker |
| `dashboard_server.py` | HTTP server + SSE |
| `agent_dispatcher.py` | Multi-agent task queue |
| `landing_generator.py` | Persona → Landing pages (i18n) |
| `extract.py` | Source extraction |
| `plan.py` | Topic planning |
| `write.py` | AI content writer |
| `audit.py` | Quality audit + fixer |
| `seo.py` | SEO optimization |
| `publish.py` | Build + deploy |
| `memory.py` | 3-layer memory engine |
| `scoreboard.py` | Reward/penalty system |
| `research.py` | Auto-research |
| `wizard.py` | Project setup wizard |

---

## Compatible Agents

Works with any agent that can read files and run Python:

| Agent | Status |
|-------|--------|
| Gemini CLI | ✅ Full support |
| Claude Code | ✅ Full support |
| Cursor | ✅ Full support |
| OpenCode | ✅ Full support |
| Kimi CLI | ✅ Full support |
| Cline | ✅ Full support |
| Codex | ✅ Full support |

---

## Tính Năng

Hệ thống Content Factory tự động tạo nội dung với dashboard theo dõi thời gian thực.

```bash
cf init          # Tạo dự án mới
cf run --dashboard --budget 5.0   # Chạy với dashboard + giới hạn $5
cf status        # Xem tiến trình
cf tokens        # Chi phí token
cf landing       # Tạo landing pages
```

---

## 特性

AI内容工厂，支持实时仪表板、多代理协作和令牌管理。

```bash
cf init          # 创建新项目
cf run --dashboard   # 运行带仪表板的流水线
cf landing --lang zh # 生成中文登录页
```

---

## 機能

AIコンテンツファクトリー、リアルタイムダッシュボード、マルチエージェント対応。

```bash
cf init          # 新規プロジェクト作成
cf run --dashboard   # ダッシュボード付きで実行
cf landing --lang ja # 日本語ランディングページ生成
```

---

<div align="center">
<sub>Built with ❤️ by TodyAI — Config-driven, self-improving AI content at scale</sub>
</div>
]]>
