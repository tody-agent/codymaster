---
title: "Cấu hình"
description: "Tất cả configuration options cho Content Factory — niche, brand, content, sources, output, pipeline, SEO, audit, memory, scoring."
keywords: ["cấu hình", "configuration", "config", "content factory"]
sidebar:
  order: 3
---

# Cấu hình

Toàn bộ Content Factory điều khiển qua một file: `content-factory.config.json`.

## Config Sections

| Section | Mô tả | Bắt buộc |
|---------|-------|---------|
| `niche` | Lĩnh vực và keywords | ✅ |
| `brand` | Thương hiệu và tone | ✅ |
| `content` | Loại bài viết, word count | ✅ |
| `sources` | Input paths và formats | ✅ |
| `output` | Output path và format | ✅ |
| `pipeline` | Pipeline configuration | ❌ |
| `seo` | SEO settings | ❌ |
| `audit` | Audit rules | ❌ |
| `memory` | Memory system config | ❌ |
| `research` | Research settings | ❌ |
| `scoring` | Scoreboard config | ❌ |
| `extensions` | Hooks và plugins | ❌ |

## Full Config Reference

```json
{
  "niche": {
    "name": "string — Tên lĩnh vực",
    "keywords": ["primary", "secondary", "terms"],
    "language": "vi | en | both",
    "competitors": ["url1", "url2"]
  },
  "brand": {
    "name": "string — Tên thương hiệu",
    "tone": "professional | casual | expert | friendly",
    "target_audience": "string — Mô tả đối tượng",
    "voice_guidelines": "string — Hướng dẫn giọng viết"
  },
  "content": {
    "article_types": ["blog", "guide", "faq", "listicle", "case-study"],
    "word_count": { "min": 800, "max": 2500 },
    "batch_size": 5,
    "schedule": "daily | weekly | manual"
  },
  "memory": {
    "enabled": true,
    "semantic_path": "memory/semantic/",
    "episodic_path": "memory/episodic/",
    "working_path": "memory/working/",
    "max_episodic_entries": 100
  },
  "scoring": {
    "enabled": true,
    "rewards": {
      "user_praise": 10,
      "audit_pass": 3,
      "engagement": 5
    },
    "penalties": {
      "user_edit": -5,
      "user_delete": -10,
      "audit_fail": -3
    }
  }
}
```

## Environment Variables

| Variable | Mô tả | Default |
|----------|-------|---------|
| `CF_CONFIG_PATH` | Đường dẫn config file | `./content-factory.config.json` |
| `CF_MEMORY_ENABLED` | Bật/tắt memory system | `true` |
| `CF_DRY_RUN` | Chạy không ghi output | `false` |

## Liên quan

- [Giới thiệu](./intro) — Content Factory là gì
- [Content Pipeline SOP](../sop/content-pipeline) — Hướng dẫn sử dụng
