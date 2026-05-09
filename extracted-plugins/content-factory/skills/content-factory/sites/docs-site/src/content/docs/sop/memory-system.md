---
title: "Memory System"
description: "Hướng dẫn sử dụng Memory System — cấu hình 3 lớp trí nhớ, Learn mode, và scoreboard."
keywords: ["memory system", "self-learning", "SOP"]
sidebar:
  order: 3
---

# Memory System — SOP

> **Quick Reference**
> - **3 layers**: Semantic (patterns), Episodic (experiences), Working (context)
> - **Auto-learn**: Từ user edits, deletes, praise
> - **Scoreboard**: Reward/penalty tracking

## Memory Architecture

| Layer | Path | Mục đích | Lifecycle |
|-------|------|---------|-----------|
| Semantic | `memory/semantic/` | Writing patterns, SEO rules, mistakes | Long-term (persistent) |
| Episodic | `memory/episodic/` | Per-session experiences | Medium-term (max 100) |
| Working | `memory/working/` | Current session context | Short-term (session only) |

## Setup

### Initialize Memory

```bash
python3 scripts/memory.py --config content-factory.config.json --init
```

### Trigger Learn Mode

```bash
# After user feedback
python3 scripts/scoreboard.py --config content-factory.config.json --detect-changes
python3 scripts/memory.py --config content-factory.config.json --learn
```

### View Scoreboard

```bash
python3 scripts/scoreboard.py --config content-factory.config.json --summary
```

## How Learning Works

1. **Detect**: Git diff detects user edits/deletes
2. **Score**: Apply reward/penalty points
3. **Extract**: Identify patterns from episodic memories
4. **Update**: Save patterns to semantic memory
5. **Apply**: Next Write mode uses updated context
