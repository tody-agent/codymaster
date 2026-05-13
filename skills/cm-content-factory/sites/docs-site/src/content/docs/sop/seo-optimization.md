---
title: "SEO Optimization"
description: "Hướng dẫn sử dụng SEO mode — keyword research, meta optimization, competitor analysis."
keywords: ["SEO", "optimization", "content factory", "SOP"]
sidebar:
  order: 4
---

# SEO Optimization — SOP

> **Quick Reference**
> - **Ai**: SEO Specialist
> - **Modes**: SEO + Research
> - **Thời gian**: ~15 phút per batch

## Step-by-Step

### Step 1: Extract SEO Data

```bash
python3 scripts/seo.py --config content-factory.config.json extract
```

Scans all content articles và extracts current SEO metadata.

### Step 2: Apply Optimization

```bash
python3 scripts/seo.py --config content-factory.config.json apply
```

Auto-generates optimized title tags, meta descriptions, and keyword placements.

### Step 3: Competitor Research (Optional)

```bash
python3 scripts/research.py --config content-factory.config.json \
  --topic "target keyword"
```

Analyzes competitor content structure và identifies content gaps.

### Step 4: Review Monetization Score

```bash
python3 scripts/monetize.py --config content-factory.config.json --score-all
```

Scores articles for monetization potential: commercial intent × conversion × demand.

## SEO Checklist

- [ ] Title tags unique và < 60 characters
- [ ] Meta descriptions compelling và < 155 characters
- [ ] H1 unique per page
- [ ] Keywords in first 100 words
- [ ] Internal links to related content
- [ ] Alt text on images
