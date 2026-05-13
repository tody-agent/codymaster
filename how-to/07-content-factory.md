# Content Factory Pipeline

> Self-learning SEO content engine: research → write → audit → publish. This guide teaches you how to use cm-content-factory to create high-converting content at scale.

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Phase 0: Discovery](#phase-0-discovery)
4. [Phase 1: Research](#phase-1-research)
5. [Phase 2: Plan](#phase-2-plan)
6. [Phase 3: Write](#phase-3-write)
7. [Phase 4: Audit](#phase-4-audit)
8. [Phase 5: SEO](#phase-5-seo)
9. [Phase 6: Publish](#phase-6-publish)
10. [Self-Learning System](#self-learning-system)
11. [Content Mastery Framework](#content-mastery-framework)

---

## Overview

### What is Content Factory?

A self-learning content pipeline that:

- **Researches** topics automatically
- **Writes** high-quality content using AI
- **Audits** content for quality and SEO
- **Publishes** to your website
- **Learns** from feedback to improve

### Architecture

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

### When to Use

- **Blog posts** and articles
- **Landing pages**
- **Product descriptions**
- **Marketing copy**
- **Documentation**
- **Social media content**

---

## Quick Start

### Step 1: Install Dependencies

```bash
# Content factory requires Python
python3 --version  # Should be 3.10+

# Install dependencies
pip3 install -r requirements.txt
```

### Step 2: Run the Wizard

```bash
# Interactive setup
python3 scripts/wizard.py

# The wizard will ask:
# 1. Niche info (industry, brand, USP)
# 2. Reference websites
# 3. Data sources
# 4. Content goals (number, keywords, language)
# 5. Deployment settings
```

### Step 3: Start the Pipeline

```bash
# Full pipeline with dashboard
python3 scripts/pipeline.py --dashboard

# Or with budget limit
python3 scripts/pipeline.py --dashboard --budget 5.0
```

### Step 4: Monitor Progress

Open `http://localhost:5050` in your browser to see:
- Pipeline progress
- Task queue
- Token usage
- Event log
- Errors

---

## Phase 0: Discovery

**Goal:** Understand your business, audience, and content goals.

### The 5 Question Groups

| # | Group | Key Questions |
|---|-------|---------------|
| Q1 | **Niche Info** | Industry, brand, address, phone, USP |
| Q2 | **Reference & Avoid** | Reference websites, styles to avoid, tone |
| Q3 | **Data Sources** | Existing files, URLs to extract, images |
| Q4 | **Content Goals** | Number of articles, keywords, language, region |
| Q5 | **Deploy** | Cloudflare account, domain, milestone |

### Example Discovery Session

```bash
$ python3 scripts/wizard.py

? What is your industry? E-commerce
? What is your brand name? ShopMaster
? What is your unique selling proposition? AI-powered product recommendations
? Reference website 1: https://shopify.com/blog
? Reference website 2: https://woocommerce.com/documentation
? Style to avoid: Corporate, boring
? Tone of voice: Friendly, helpful, expert
? Existing content files: ./existing-blog/
? Target number of articles: 50
? Target keywords: "AI e-commerce", "product recommendations", "shop automation"
? Primary language: English
? Target region: Global
? Cloudflare account: [configured]
? Custom domain: blog.shopmaster.com
? Milestone: Deploy at 25 articles, then at 50 articles
```

### Configuration File

After discovery, you'll have `content-factory.config.json`:

```json
{
  "project": {
    "name": "ShopMaster Blog",
    "type": "astro",
    "base_url": "https://blog.shopmaster.com"
  },
  "niche": {
    "industry": "E-commerce",
    "brand": "ShopMaster",
    "usp": "AI-powered product recommendations",
    "tone": "Friendly, helpful, expert"
  },
  "content": {
    "target_count": 50,
    "keywords": ["AI e-commerce", "product recommendations", "shop automation"],
    "language": "en",
    "region": "global"
  },
  "deploy": {
    "platform": "cloudflare",
    "domain": "blog.shopmaster.com"
  }
}
```

---

## Phase 1: Research

**Goal:** Gather information about topics and competitors.

### Run Research

```bash
# Extract from existing sources
python3 scripts/extract.py --config content-factory.config.json

# This will:
# 1. Crawl reference websites
# 2. Extract content structure
# 3. Analyze competitor topics
# 4. Build knowledge base
```

### Research Output

```
knowledge-base/
├── topics.json          # Extracted topics
├── keywords.json        # Keyword analysis
├── competitors.json     # Competitor analysis
└── sources.json         # Source citations
```

### Manual Research

```bash
# Add your own research
cat > knowledge-base/manual-research.json << 'EOF'
{
  "topics": [
    {
      "title": "How AI is Changing E-commerce",
      "keywords": ["AI e-commerce", "machine learning retail"],
      "sources": ["https://example.com/ai-ecommerce"],
      "notes": "Growing trend, high search volume"
    }
  ]
}
EOF
```

---

## Phase 2: Plan

**Goal:** Create a content plan with topics, keywords, and schedules.

### Run Planning

```bash
# Generate topic queue
python3 scripts/plan.py --config content-factory.config.json

# This will:
# 1. Analyze knowledge base
# 2. Generate topic ideas
# 3. Prioritize by search volume
# 4. Create content calendar
```

### Planning Output

```
content-plan/
├── topics.json          # Prioritized topics
├── calendar.json        # Publishing schedule
├── keywords.json        # Keyword mapping
└── clusters.json        # Topic clusters
```

### Topic Clusters

```json
{
  "clusters": [
    {
      "pillar": "AI in E-commerce",
      "topics": [
        "How AI Product Recommendations Work",
        "Benefits of AI for Online Stores",
        "Implementing AI in Your Shop"
      ]
    },
    {
      "pillar": "Product Recommendations",
      "topics": [
        "Types of Recommendation Engines",
        "Best Practices for Recommendations",
        "Measuring Recommendation Performance"
      ]
    }
  ]
}
```

---

## Phase 3: Write

**Goal:** Generate high-quality content using AI.

### Run Writing

```bash
# Write all topics
python3 scripts/write.py --config content-factory.config.json

# Write specific topic
python3 scripts/write.py --config content-factory.config.json --topic "ai-ecommerce-guide"

# With dashboard
python3 scripts/pipeline.py --dashboard --phase write
```

### Writing Process

For each topic:

1. **Research** — Gather information from sources
2. **Outline** — Create article structure
3. **Write** — Generate content with AI
4. **Optimize** — Apply Content Mastery framework
5. **Review** — Self-review for quality

### Content Mastery Framework

The writing process uses 8+ frameworks:

- **StoryBrand (SB7)** — Customer as hero, you as guide
- **Cialdini** — 7 principles of persuasion
- **JTBD** — Jobs to be done
- **SUCCESs** — Made to stick
- **STEPPS** — Viral content

### Example Article Structure

```markdown
# How AI Product Recommendations Boost Sales by 35%

**Hook:** "What if your store could predict exactly what each customer wants to buy?"

## The Problem
Most online stores show the same products to everyone...

## The Solution
AI-powered recommendations analyze customer behavior...

## How It Works
1. Collects browsing data
2. Identifies patterns
3. Matches similar customers
4. Suggests relevant products

## Benefits
- 35% increase in average order value
- 20% increase in conversion rate
- 15% increase in customer retention

## Getting Started
[Step-by-step guide]

## Conclusion
AI recommendations are no longer optional...
```

---

## Phase 4: Audit

**Goal:** Ensure content quality and SEO compliance.

### Run Audit

```bash
# Audit all content
python3 scripts/audit.py --config content-factory.config.json

# Audit specific file
python3 scripts/audit.py --config content-factory.config.json --file "ai-ecommerce-guide.md"
```

### Audit Checks

```markdown
## Audit Checklist

### Content Quality
- [ ] Hook is compelling (first 3 seconds)
- [ ] Persona fit (correct pain points)
- [ ] Persuasion depth (3+ Cialdini principles)
- [ ] Narrative flow (SB7 compliant)
- [ ] Stickiness (4/6 SUCCESs)

### SEO Compliance
- [ ] Title tag ≤ 60 chars + primary keyword
- [ ] Meta description ≤ 155 chars + CTA
- [ ] H1 × 1 + keyword
- [ ] H2-H3 hierarchy + secondary keywords
- [ ] First 100 words contain primary keyword
- [ ] ≥ 3 internal links
- [ ] 2-5 external authoritative links

### Technical
- [ ] No spelling errors
- [ ] No grammar errors
- [ ] Proper formatting
- [ ] Images optimized
- [ ] Mobile responsive
```

### Audit Score

Each article is scored on 7 dimensions (each /10):

1. **Hook Power** — Does the first 3 seconds retain attention?
2. **Persona Fit** — Correct VoC + pain + dream?
3. **Persuasion Depth** — ≥3 Cialdini + O/CO?
4. **Narrative Flow** — SB7 compliant?
5. **Stickiness** — ≥4/6 SUCCESs?
6. **SEO Compliance** — Title/Meta/H1/links?
7. **CTA Clarity** — 1 Direct CTA + repeat?

**Scoring:**
- 63-70: Exceptional
- 49-62: Strong
- 35-48: Average
- <35: Fail — rewrite

---

## Phase 5: SEO

**Goal:** Optimize content for search engines.

### Run SEO

```bash
# SEO optimization
python3 scripts/seo.py --config content-factory.config.json

# This will:
# 1. Optimize title tags
# 2. Write meta descriptions
# 3. Add internal links
# 4. Optimize images
# 5. Add schema markup
```

### SEO Checklist

```markdown
## SEO Optimization

### Title Tag
- [ ] ≤ 60 characters
- [ ] Primary keyword included
- [ ] Compelling (encourages clicks)
- [ ] Unique (not duplicate)

### Meta Description
- [ ] ≤ 155 characters
- [ ] Includes CTA
- [ ] Summarizes article
- [ ] Includes keyword

### Headings
- [ ] H1 × 1
- [ ] H1 includes keyword
- [ ] H2-H3 hierarchy
- [ ] Keywords in subheadings

### Content
- [ ] Primary keyword in first 100 words
- [ ] Secondary keywords throughout
- [ ] Natural keyword density (1-2%)
- [ ] Related terms included

### Links
- [ ] ≥ 3 internal links
- [ ] 2-5 external authoritative links
- [ ] Anchor text descriptive
- [ ] No broken links

### Images
- [ ] Alt text with keywords
- [ ] File names descriptive
- [ ] Compressed for web
- [ ] Proper dimensions

### Schema Markup
- [ ] Article schema
- [ ] FAQ schema (if applicable)
- [ ] How-to schema (if applicable)
```

---

## Phase 6: Publish

**Goal:** Deploy content to your website.

### Run Publishing

```bash
# Publish all content
python3 scripts/publish.py --config content-factory.config.json

# Publish specific article
python3 scripts/publish.py --config content-factory.config.json --file "ai-ecommerce-guide.md"

# With build
python3 scripts/pipeline.py --dashboard --phase publish
```

### Publishing Process

1. **Build** — Generate static site (Astro)
2. **Optimize** — Compress images, minify CSS/JS
3. **Deploy** — Push to Cloudflare Pages
4. **Verify** — Check deployment
5. **Notify** — Send notification

### Deployment Verification

```bash
# Check deployment
cm deploy status

# Open in browser
cm deploy open

# Test the article
# - Loads correctly
# - Images display
# - Links work
# - Mobile responsive
```

---

## Self-Learning System

### Memory (3 Layers)

| Layer | Path | Purpose |
|-------|------|---------|
| **Semantic** | `memory/semantic/` | Long-term patterns, style, SEO rules |
| **Episodic** | `memory/episodic/` | Per-session experiences + outcomes |
| **Working** | `memory/working/` | Current session context |

### Scoreboard

| Event | Points |
|-------|--------|
| User praise | +10 |
| Engagement (share/bookmark) | +5 |
| Article passes audit first try | +3 |
| User edits article | -5 |
| User deletes article | -10 |
| Audit fail | -3 |

### Learning Loop

```
Content → Feedback → Score → Memory → Improved Content
```

### Using Memory

```bash
# View learnings
cat memory/semantic/seo-rules.json

# The system automatically:
# 1. Learns from feedback
# 2. Updates patterns
# 3. Applies learnings to future content
```

---

## Content Mastery Framework

### Phase 0: Persona & JTBD

**User Persona Canvas:**

| Dimension | Questions |
|-----------|---------|
| Demographics | Age, gender, occupation, income |
| Pain Points | 3-5 most urgent problems |
| Goals & Dreams | Dream Outcome — in their own language |
| Fears & Objections | What concerns do they have when buying? |
| Decision Triggers | What makes them BUY NOW? |
| Language | Voice of Customer — words they use to describe problems |

**Job Statement (JTBD):**

```
When [situation], I want [outcome], so that [end result]
```

### Phase 1: Hook — 12 Formulas

| # | Hook Type | Formula |
|---|-----------|---------|
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

### Phase 4: Offer & CTA

**Grand Slam Offer:**

```
Perceived Value = (Dream Outcome × Likelihood) / (Time Delay × Effort)
```

| CTA Type | When to Use | Example |
|----------|------------|--------|
| Direct | Primary conversion | "Sign Up Now — Free" |
| Transitional | Not ready to buy | "Download Free Checklist" |
| Urgency | Real scarcity | "Only 3 Spots Left — Before 23:59" |

---

## Next Steps

- [Internationalization (i18n)](./08-internationalization.md) — Multi-language content
- [UI Preview & Design](./15-ui-preview-design.md) — Visual content creation
- [Knowledge Management](./16-knowledge-management.md) — Content knowledge base
