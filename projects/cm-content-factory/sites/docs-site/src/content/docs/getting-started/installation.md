---
title: "Cài đặt"
description: "Hướng dẫn cài đặt Content Factory — setup nhanh trong 5 phút với config file và scripts."
keywords: ["cài đặt", "installation", "content factory", "setup"]
sidebar:
  order: 2
---

# Cài đặt

Setup Content Factory trong 5 phút.

## Yêu cầu

| Component | Version |
|-----------|---------|
| Python | 3.10+ |
| Git | 2.x+ |
| AI Provider | API key (OpenAI, Anthropic, hoặc local) |

## Quick Start

### 1. Clone skill vào project

```bash
# Copy skill vào .agents/skills/
cp -r content-factory .agents/skills/content-factory
```

### 2. Tạo config file

Tạo `content-factory.config.json` tại root project:

```json
{
  "niche": {
    "name": "Your Niche",
    "keywords": ["keyword1", "keyword2"],
    "language": "vi"
  },
  "brand": {
    "name": "Your Brand",
    "tone": "professional",
    "target_audience": "description"
  },
  "content": {
    "article_types": ["blog", "guide", "faq"],
    "word_count": { "min": 800, "max": 2500 }
  },
  "sources": {
    "paths": ["./docs/", "./knowledge/"],
    "types": ["md", "txt", "pdf"]
  },
  "output": {
    "path": "./content/",
    "format": "markdown"
  }
}
```

### 3. Chạy Pipeline đầu tiên

```bash
# Extract knowledge
python3 .agents/skills/content-factory/scripts/extract.py \
  --config content-factory.config.json

# Plan topics
python3 .agents/skills/content-factory/scripts/plan.py \
  --config content-factory.config.json

# Write content
python3 .agents/skills/content-factory/scripts/write.py \
  --config content-factory.config.json --batch 1
```

## Bước tiếp theo

- [Cấu hình chi tiết](./configuration) — Tất cả options trong config file
- [Content Pipeline SOP](../sop/content-pipeline) — Hướng dẫn end-to-end
