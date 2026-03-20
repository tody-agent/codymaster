---
title: "Content Pipeline"
description: "Hướng dẫn step-by-step chạy Content Factory pipeline — từ extract đến publish."
keywords: ["content pipeline", "SOP", "tutorial"]
sidebar:
  order: 2
---

# Content Pipeline — SOP

> **Quick Reference**
> - **Ai**: Content Manager
> - **Thời gian**: ~30 phút setup, sau đó tự động
> - **Điều kiện**: Config file + source documents

## Prerequisites

- [ ] Python 3.10+ installed
- [ ] `content-factory.config.json` created
- [ ] Source documents in configured path

## Step-by-Step

### Step 1: Extract Knowledge

```bash
python3 scripts/extract.py --config content-factory.config.json
```

Output: `knowledge-base/` with structured JSON per category.

### Step 2: Plan Topics

```bash
python3 scripts/plan.py --config content-factory.config.json
```

Output: `topics-queue/batch-{DATE}.json` with prioritized topics.

### Step 3: Write Content

```bash
python3 scripts/write.py --config content-factory.config.json --batch 1
```

Content generated với memory context, auto-scored.

### Step 4: Audit

```bash
python3 scripts/audit.py --config content-factory.config.json
# Auto-fix
python3 scripts/audit.py --config content-factory.config.json --fix
```

### Step 5: SEO Optimize

```bash
python3 scripts/seo.py --config content-factory.config.json extract
python3 scripts/seo.py --config content-factory.config.json apply
```

### Step 6: Publish

```bash
python3 scripts/publish.py --config content-factory.config.json
```

### Full Auto (Pipeline Mode)

```bash
python3 scripts/pipeline.py
```

Chạy toàn bộ từ Extract đến Publish tự động.

## Expected Results

- ✅ Knowledge base created
- ✅ Topic queue generated
- ✅ Content articles written
- ✅ Audit passed
- ✅ SEO optimized
- ✅ Published live

## Troubleshooting

<details>
<summary>Pipeline fails at Write step</summary>

**Check**: Memory system initialized? Config valid?

```bash
python3 scripts/memory.py --config content-factory.config.json --init
```

</details>

<details>
<summary>Audit fails repeatedly</summary>

**Check**: Run Learn mode to update patterns, then retry.

```bash
python3 scripts/memory.py --config content-factory.config.json --learn
```

</details>
