---
title: "cm-content-factory"
description: "AI Content Factory v2.0 — Self-learning content engine with real-time dashboard, multi-agent support, token management, and Content Mastery framework (StoryBran"
keywords: ["cm-content-factory", "cody master", "ai skill"]
robots: "index, follow"
---

> **📋 Full Skill Source** — This is the complete, unedited SKILL.md file. Nothing is hidden or summarized.

[← Back to Skills Library](./index.md)

# CM Content Factory v2.0 — AI Content Machine Platform

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

All scripts: `python3 scripts/&lt;script&gt; --config content-factory.config.json`

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

---

## Content Mastery Framework — Bậc Thầy Viết Content Chuyển Đổi Cao

> Hệ thống viết content thống nhất. Tổng hợp từ 8+ framework: StoryBrand (SB7), SUCCESs, Cialdini (7 Principles), STEPPS, Hook Model, JTBD, CRO, Grand Slam Offers.

**Core Principle:** Content xuất sắc không phải nghệ thuật — nó là khoa học có hệ thống. Mỗi câu chữ dẫn dắt người đọc: "không biết" → "quan tâm" → "muốn" → "hành động".

### Phase 0: Persona & JTBD

**User Persona Canvas** (hoàn thành TRƯỚC khi viết):

| Dimension | Câu hỏi |
|-----------|---------|
| Demographics | Tuổi, giới, nghề, thu nhập |
| Pain Points | 3-5 vấn đề cấp bách nhất |
| Goals & Dreams | Dream Outcome — ngôn ngữ của họ |
| Fears & Objections | Lo ngại gì khi mua? |
| Decision Triggers | Điều gì khiến MUA NGAY? |
| Language | Voice of Customer — từ ngữ mô tả vấn đề |

**Buyer Persona:** Economic (ROI) | User (UX) | Technical (specs) | Coach (case studies)

**Job Statement (JTBD):** `Khi [hoàn cảnh], tôi muốn [kết quả], để [kết quả cuối]`
- 3 chiều: Functional + Emotional + Social
- 4 lực: Push + Pull > Habit + Anxiety

### Phase 1: Hook — 12 Công Thức

| # | Hook Type | Công thức |
|---|-----------|-----------|
| 1 | Contrarian | "[Điều mọi người tin] thực ra sai..." |
| 2 | Curiosity Gap | "Cách [người/đối thủ] [kết quả] mà không [bất ngờ]" |
| 3 | Data Shock | "[Số liệu sốc] — đây là điều bạn cần biết" |
| 4 | Before/After | "Trước: [pain]. Sau: [dream]. Trong [thời gian]" |
| 5 | Question | "[Câu hỏi chạm nỗi đau sâu nhất]?" |
| 6 | Story Open | "Vào lúc [thời điểm], [nhân vật] phát hiện..." |
| 7 | Authority | "[Credential] + [insight bất ngờ]" |
| 8 | FOMO | "[X người] đã [kết quả]. Bạn có đang bỏ lỡ?" |
| 9 | Pain Agitation | "Nếu bạn đang [nỗi đau cụ thể], hãy đọc tiếp..." |
| 10 | Promise | "Bạn sẽ [kết quả] trong [thời gian], ngay cả khi [rào cản]" |
| 11 | Villain | "[Kẻ thù] đang [hành động xấu] — đây là cách chống lại" |
| 12 | Insider Secret | "Điều [chuyên gia] không muốn bạn biết..." |

**Rule:** 1 hook = 1 message. Test 3-5 hook cho mỗi content quan trọng.

### Phase 2: SB7 Narrative

```
1. Hero (Khách hàng) → có MỘT khao khát
2. Problem → Villain + External + Internal + Philosophical
3. Guide (Bạn) → Empathy + Authority
4. Plan → 3 bước đơn giản
5. CTA → Direct + Transitional
6. Failure → hậu quả nếu không hành động
7. Success → bức tranh thành công
```

**Nguyên tắc vàng:** Khách hàng = HERO. Bạn = GUIDE. Không bao giờ biến brand thành nhân vật chính.

### Phase 3: 7 Vũ Khí Cialdini

| Nguyên tắc | Áp dụng | Copy Pattern |
|-----------|---------|-------------|
| Reciprocity | Free guide/trial/tool | "Đây là quà tặng..." |
| Commitment | Quiz, micro-actions | "Bạn đã hoàn thành bước 1!" |
| Social Proof | Testimonials, logos | "2,347 doanh nghiệp tin tưởng..." |
| Authority | Credentials, data | "Nghiên cứu từ Harvard..." |
| Liking | Brand voice thân thiện | "Chúng tôi cũng từng khổ sở..." |
| Scarcity/FOMO | Limited spots, deadline | "Chỉ còn 5 suất cuối cùng..." |
| Unity | Shared identity | "Dành cho những ai đang xây dựng..." |

**FOMO 5 tầng:** Time Scarcity → Quantity Scarcity → Exclusive Access → Social FOMO → Opportunity Cost

> **Ranh giới đạo đức:** FOMO phải DỰA TRÊN SỰ THẬT. Countdown giả = phá hủy brand vĩnh viễn.

### Phase 4: SUCCESs + STEPPS

**SUCCESs (Made to Stick)** — ≥4/6: Simple, Unexpected, Concrete, Credible, Emotional, Stories

**STEPPS (Viral Check):** Social Currency, Triggers, Emotion (high-arousal), Public, Practical Value, Stories

### Phase 5: Offer & CTA

**Grand Slam Offer:** `Perceived Value = (Dream Outcome × Likelihood) / (Time Delay × Effort)`

| CTA Type | Khi dùng | Ví dụ |
|----------|---------|-------|
| Direct | Chuyển đổi chính | "Đăng Ký Ngay — Miễn Phí" |
| Transitional | Chưa sẵn sàng mua | "Tải Checklist Miễn Phí" |
| Urgency | Scarcity thật | "Chỉ Còn 3 Suất — Trước 23:59" |

**O/CO (Objection/Counter-Objection):** Trust → Testimonials. Price → ROI calc. Fit → Case study. Timing → Deadline. Effort → "Done-for-you".

### Phase 6: SEO Checklist

- Title Tag ≤ 60 chars + primary keyword
- Meta Description ≤ 155 chars + CTA
- H1 × 1 + keyword. H2-H3 hierarchy + secondary keywords
- First 100 words chứa primary keyword
- ≥ 3 internal links + 2-5 external authoritative links
- Schema Markup: FAQ, How-to, Article phù hợp

### Phase 7: Cross-Audit 7 Chiều (mỗi chiều /10)

1. **Hook Power** — 3 giây đầu có giữ chân?
2. **Persona Fit** — Đúng VoC + pain + dream?
3. **Persuasion Depth** — ≥3 Cialdini + O/CO?
4. **Narrative Flow** — SB7 chuẩn?
5. **Stickiness** — ≥4/6 SUCCESs?
6. **SEO Compliance** — Title/Meta/H1/links?
7. **CTA Clarity** — 1 Direct CTA + repeat?

**63-70:** Exceptional | **49-62:** Strong | **35-48:** Average | **<35:** Fail — viết lại

### Content Type Matrix

| Type | Hook Focus | Persuasion | CTA |
|------|-----------|-----------|-----|
| Landing Page | Contrarian/Data Shock | Social Proof + Scarcity | Direct |
| Blog Post | Curiosity Gap/Question | Authority + Value | Transitional |
| Email | Pain Agitation/Story | Reciprocity + Commitment | Direct |
| Social Media | Insider Secret/FOMO | Social Currency + Emotion | Mixed |
| Ad Copy | Villain/Question | Scarcity + Emotion | Direct |

### Ethical Boundaries

1. Không scarcity giả (timer giả, "hết hàng" giả)
2. Không fabricate testimonials
3. Không exploit vulnerable groups
4. Không promise kết quả không thể deliver
5. Không hide costs
6. Không fear-mongering

**Test cuối:** "Bạn có sẵn lòng áp dụng kỹ thuật này cho gia đình mình không?"
