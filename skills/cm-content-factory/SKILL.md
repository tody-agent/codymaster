---
name: cm-content-factory
description: "AI Content Factory v2.0 — Self-learning content engine with real-time dashboard, multi-agent support, token management, and Content Mastery framework (StoryBrand, Cialdini, SUCCESs, STEPPS, Hook Model, JTBD, CRO, Grand Slam Offers). Interactive onboarding → auto-research → generate → audit → deploy. Config-driven, niche-agnostic, self-improving."
---

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
| Q1 | Niche Info | Industry, brand, address, phone, USP |
| Q2 | Reference & Avoid | Reference websites, styles to avoid, tone |
| Q3 | Data Sources | Existing files, URLs to extract, images |
| Q4 | Content Goals | Number of articles, keywords, language, region |
| Q5 | Deploy | Cloudflare account, domain, milestone |

### Phase 0.5: Confirm

Display summary table → **WAIT for user OK** → then proceed.

---

## Operating Modes (12)

| Mode | Script | Purpose |
|------|--------|---------|
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
    "headline": "Save 50% on Marketing Costs",
    "subheadline": "AI creates professional content, 10x faster",
    "pain_points": ["High marketing costs", "Lack of content staff"],
    "benefits": [{"title": "Cost Savings", "description": "Reduce costs by 50%"}],
    "social_proof": [{"number": "2,347", "label": "Businesses trust us"}],
    "steps": [{"title": "Configure", "description": "Enter your business information"}],
    "cta_text": "Try It Free"
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

1. **ALWAYS ask before doing** — Phase 0 Discovery is mandatory
2. **ALWAYS confirm** — Display summary, wait for user OK
3. **ALWAYS notify milestones** — At 50%, deploy milestone, completion
4. **NEVER deploy without audit** — Always audit before deploy
5. **NEVER skip questions** — If user doesn't provide info, use default + confirm
6. **ALWAYS use dashboard** — When running pipeline, add `--dashboard`

---

## Content Mastery Framework — High-Conversion Content Writing

> Unified content writing system. Synthesized from 8+ frameworks: StoryBrand (SB7), SUCCESs, Cialdini (7 Principles), STEPPS, Hook Model, JTBD, CRO, Grand Slam Offers.

**Core Principle:** Excellent content is not art — it is systematic science. Every word guides the reader: "unaware" → "interested" → "desire" → "action".

### Phase 0: Persona & JTBD

**User Persona Canvas** (complete BEFORE writing):

| Dimension | Questions |
|-----------|---------|
| Demographics | Age, gender, occupation, income |
| Pain Points | 3-5 most urgent problems |
| Goals & Dreams | Dream Outcome — in their own language |
| Fears & Objections | What concerns do they have when buying? |
| Decision Triggers | What makes them BUY NOW? |
| Language | Voice of Customer — words they use to describe problems |

**Buyer Persona:** Economic (ROI) | User (UX) | Technical (specs) | Coach (case studies)

**Job Statement (JTBD):** `When [situation], I want [outcome], so that [end result]`
- 3 dimensions: Functional + Emotional + Social
- 4 forces: Push + Pull > Habit + Anxiety

### Phase 1: Hook — 12 Formulas

| # | Hook Type | Formula |
|---|-----------|----------|
| 1 | Contrarian | "[What everyone believes] is actually wrong..." |
| 2 | Curiosity Gap | "How [person/competitor] [achieved result] without [surprise]" |
| 3 | Data Shock | "[Shocking statistic] — here's what you need to know" |
| 4 | Before/After | "Before: [pain]. After: [dream]. In [timeframe]" |
| 5 | Question | "[Question that hits deepest pain point]?" |
| 6 | Story Open | "At [moment], [character] discovered..." |
| 7 | Authority | "[Credential] + [surprising insight]" |
| 8 | FOMO | "[X people] have [achieved result]. Are you missing out?" |
| 9 | Pain Agitation | "If you're experiencing [specific pain], keep reading..." |
| 10 | Promise | "You'll [result] in [timeframe], even if [obstacle]" |
| 11 | Villain | "[Enemy] is [doing harm] — here's how to fight back" |
| 12 | Insider Secret | "What [experts] don't want you to know..." |

**Rule:** 1 hook = 1 message. Test 3-5 hooks for each important piece of content.

### Phase 2: SB7 Narrative

```
1. Hero (Customer) → has ONE desire
2. Problem → Villain + External + Internal + Philosophical
3. Guide (You) → Empathy + Authority
4. Plan → 3 simple steps
5. CTA → Direct + Transitional
6. Failure → consequences of inaction
7. Success → the picture of success
```

**Golden Rule:** Customer = HERO. You = GUIDE. Never make the brand the main character.

### Phase 3: 7 Cialdini Weapons

| Principle | Application | Copy Pattern |
|-----------|------------|-------------|
| Reciprocity | Free guide/trial/tool | "Here's a gift for you..." |
| Commitment | Quiz, micro-actions | "You've completed step 1!" |
| Social Proof | Testimonials, logos | "2,347 businesses trust us..." |
| Authority | Credentials, data | "Research from Harvard..." |
| Liking | Friendly brand voice | "We've been there too..." |
| Scarcity/FOMO | Limited spots, deadline | "Only 5 spots remaining..." |
| Unity | Shared identity | "For those who are building..." |

**FOMO 5 layers:** Time Scarcity → Quantity Scarcity → Exclusive Access → Social FOMO → Opportunity Cost

> **Ethical boundary:** FOMO must be BASED ON TRUTH. Fake countdowns = permanent brand destruction.

### Phase 4: SUCCESs + STEPPS

**SUCCESs (Made to Stick)** — ≥4/6: Simple, Unexpected, Concrete, Credible, Emotional, Stories

**STEPPS (Viral Check):** Social Currency, Triggers, Emotion (high-arousal), Public, Practical Value, Stories

### Phase 5: Offer & CTA

**Grand Slam Offer:** `Perceived Value = (Dream Outcome × Likelihood) / (Time Delay × Effort)`

| CTA Type | When to Use | Example |
|----------|------------|--------|
| Direct | Primary conversion | "Sign Up Now — Free" |
| Transitional | Not ready to buy | "Download Free Checklist" |
| Urgency | Real scarcity | "Only 3 Spots Left — Before 23:59" |

**O/CO (Objection/Counter-Objection):** Trust → Testimonials. Price → ROI calc. Fit → Case study. Timing → Deadline. Effort → "Done-for-you".

### Phase 6: SEO Checklist

- Title Tag ≤ 60 chars + primary keyword
- Meta Description ≤ 155 chars + CTA
- H1 × 1 + keyword. H2-H3 hierarchy + secondary keywords
- First 100 words contain primary keyword
- ≥ 3 internal links + 2-5 external authoritative links
- Schema Markup: FAQ, How-to, Article as appropriate

### Phase 7: Cross-Audit 7 Dimensions (each /10)

1. **Hook Power** — Does the first 3 seconds retain attention?
2. **Persona Fit** — Correct VoC + pain + dream?
3. **Persuasion Depth** — ≥3 Cialdini + O/CO?
4. **Narrative Flow** — SB7 compliant?
5. **Stickiness** — ≥4/6 SUCCESs?
6. **SEO Compliance** — Title/Meta/H1/links?
7. **CTA Clarity** — 1 Direct CTA + repeat?

**63-70:** Exceptional | **49-62:** Strong | **35-48:** Average | **<35:** Fail — rewrite

### Content Type Matrix

| Type | Hook Focus | Persuasion | CTA |
|------|-----------|-----------|-----|
| Landing Page | Contrarian/Data Shock | Social Proof + Scarcity | Direct |
| Blog Post | Curiosity Gap/Question | Authority + Value | Transitional |
| Email | Pain Agitation/Story | Reciprocity + Commitment | Direct |
| Social Media | Insider Secret/FOMO | Social Currency + Emotion | Mixed |
| Ad Copy | Villain/Question | Scarcity + Emotion | Direct |

### Ethical Boundaries

1. No fake scarcity (fake timers, fake "sold out")
2. No fabricated testimonials
3. No exploiting vulnerable groups
4. No promising undeliverable results
5. No hidden costs
6. No fear-mongering

**Final test:** "Would you be willing to apply this technique to your own family?"

