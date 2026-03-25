---
title: "Frappe Dev Master — Tài liệu Toàn diện"
description: "Trang chủ hệ thống tài liệu kỹ thuật, hướng dẫn sử dụng, và danh mục AI Agent của Frappe Dev Master — bộ công cụ AI phát triển Frappe/ERPNext toàn vòng đời."
keywords: "frappe, erpnext, ai skill, vibe coding, documentation, cli, devtool"
robots: "index, follow"
---

# Frappe Dev Master — Tổng quan

> **Bộ công cụ AI toàn diện cho phát triển Frappe/ERPNext** — từ cài đặt, thiết kế, lập trình, tới gỡ lỗi, tối ưu hiệu năng và vận hành từ xa. Hỗ trợ Vibe Coding qua CLI (`frappe-devtool`) và AI Skill (`frappe-dev-master`).

## Thành phần Hệ thống

| Thành phần | Mô tả | Files |
|---|---|---|
| **SKILL.md** | Bộ não trung tâm — điều phối tất cả agents và skills | 1 file |
| **Agents** | AI Agents chuyên biệt cho từng giai đoạn lifecycle | 12 agents |
| **Commands** | CLI commands cho tương tác nhanh | 15 commands |
| **Resources** | Tài liệu tham khảo kiến trúc và patterns | 8 files |
| **Sub-Skills** | Cú pháp chi tiết cho từng lĩnh vực kỹ thuật | 7 skills |

## Vòng đời Phát triển (Development Lifecycle)

```
INSTALL → PLAN → BUILD → TEST → DEBUG → FIX → OPTIMIZE → DEPLOY → OPERATE
```

1. **INSTALL** — Cài đặt bench, site, apps → [frappe-installer](../agents/frappe-installer.md)
2. **PLAN** — Thiết kế kiến trúc, DocType → [frappe-planner](../agents/frappe-planner.md)
3. **BUILD** — Lập trình Backend/Frontend → [frappe-backend](../agents/frappe-backend.md), [frappe-frontend](../agents/frappe-frontend.md)
4. **TEST** — Kiểm thử tự động → [commands/frappe-test](../commands/frappe-test.md)
5. **DEBUG** — Phân tích lỗi → [frappe-debugger](../agents/frappe-debugger.md)
6. **FIX** — Sửa lỗi có cấu trúc → [frappe-fixer](../agents/frappe-fixer.md)
7. **OPTIMIZE** — Tối ưu hiệu năng → [frappe-performance](../agents/frappe-performance.md)
8. **DEPLOY** — Triển khai production → [commands/frappe-bench](../commands/frappe-bench.md)
9. **OPERATE** — Vận hành từ xa qua REST API → [frappe-remote-ops](../agents/frappe-remote-ops.md)

## Nội dung Tài liệu

| # | Tài liệu | Mô tả |
|---|---|---|
| 1 | [Kiến trúc Hệ thống](architecture.md) | 7-Layer Architecture, Data Flow, ADR |
| 2 | [Danh mục AI Agents](agents-catalog.md) | 12 agents chuyên biệt với chức năng & workflow |
| 3 | [Danh mục CLI Commands](commands-catalog.md) | 15 commands cho tương tác nhanh |
| 4 | [Tài liệu Tham khảo](resources-catalog.md) | Resources và Sub-Skills kỹ thuật |
| 5 | [Hướng dẫn Sử dụng (SOP)](sop/user-guide.md) | Step-by-step cho từng tác vụ |
| 6 | [Hướng dẫn Vibe Coding](sop/vibe-coding-guide.md) | Tích hợp AI Agent (Cursor, OpenClaw, OpenFang) |
| 7 | [Sitemap cho AI/LLM](sitemap.md) | Dành cho NotebookLM và Semantic Search |

---
*Tài liệu tự động tạo bởi `cm-dockit` Workflow — 2026-03-25*
