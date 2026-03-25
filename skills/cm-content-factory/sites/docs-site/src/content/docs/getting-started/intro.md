---
title: "Giới thiệu"
description: "Content Factory là gì — Self-Learning AI Content Engine. Tìm hiểu tại sao bạn cần nó và cách nó hoạt động."
keywords: ["content factory", "giới thiệu", "ai content", "self-learning"]
sidebar:
  order: 1
---

# Content Factory là gì?

Content Factory là một **self-learning AI content engine** — config-driven, self-improving, hoạt động với mọi lĩnh vực. Càng dùng càng thông minh nhờ hệ thống memory 3 lớp và reward/penalty tracking.

> Hãy nghĩ Content Factory như một **nhà máy nội dung tự động**. Bạn cung cấp source documents và config, nó sẽ tự nghiên cứu, lên kế hoạch, viết bài, kiểm tra chất lượng, tối ưu SEO, và xuất bản — tất cả tự động.

## Content Factory giải quyết vấn đề gì?

- 🔄 **Tự động hóa pipeline nội dung** — Từ research đến publish, không cần can thiệp thủ công
- 🧠 **Tự học và cải thiện** — Học từ feedback, tích lũy kinh nghiệm qua mỗi session
- 📊 **Đo lường chất lượng** — Scoreboard tự động chấm điểm mỗi bài viết
- 🔧 **Config-driven** — Một file config điều khiển toàn bộ pipeline
- 🌐 **Niche-agnostic** — Hoạt động với mọi lĩnh vực: spa, fintech, education, tech...

## 8 Operating Modes

| Mode | Mô tả | Trigger |
|------|-------|---------|
| 📦 **Extract** | Trích xuất kiến thức từ documents | Có source documents mới |
| 📋 **Plan** | Lên kế hoạch topics từ knowledge base | Cần topic queue |
| ✍️ **Write** | Tạo nội dung AI với memory context | Có topics chờ viết |
| 🔍 **Audit** | Kiểm tra chất lượng nội dung | Sau khi viết |
| 🔎 **SEO** | Tối ưu SEO metadata | Trước publish |
| 🚀 **Publish** | Build và deploy content | Sẵn sàng xuất bản |
| 🧠 **Learn** | Học từ feedback và changes | Sau user feedback |
| 🔬 **Research** | Auto-research topics mới | Topic không có trong KB |

## Self-Learning System

Content Factory có 3 lớp trí nhớ:

| Layer | Mục đích | Ví dụ |
|-------|---------|-------|
| **Semantic** | Kiến thức dài hạn | Writing patterns, SEO rules, mistakes to avoid |
| **Episodic** | Kinh nghiệm theo session | Session outcomes, what worked/failed |
| **Working** | Context hiện tại | Current config, active batch |

Và hệ thống **Scoreboard** chấm điểm:

| Event | Points |
|-------|--------|
| User khen | +10 |
| Article passes audit first try | +3 |
| User sửa bài | -5 |
| User xóa bài | -10 |
| Audit fail | -3 |

## Bắt đầu

Bước tiếp theo: [Cài đặt Content Factory](./installation)
