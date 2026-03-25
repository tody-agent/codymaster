---
title: "Tài liệu Tham khảo — Resources & Sub-Skills"
description: "Catalogue Resources (8 files) và Sub-Skills (7 skills) của Frappe Dev Master — cú pháp chi tiết và patterns."
keywords: "frappe resources, 7-layer, bench commands, rest api, doctype patterns, server scripts"
robots: "index, follow"
---

# Tài liệu Tham khảo

> Resources là "sách giáo khoa" — quy tắc chung và patterns. Sub-Skills là "cheat sheet" — cú pháp chi tiết cho từng lĩnh vực kỹ thuật.

---

## 1. Resources (8 files)

| Resource | File | Nội dung |
|----------|------|----------|
| **7-Layer Architecture** | `resources/7-layer-architecture.md` | Code examples chi tiết cho mỗi lớp kiến trúc |
| **Bench Commands** | `resources/bench_commands.md` | Tham chiếu nhanh bench CLI (migrate, build, clear-cache, backup) |
| **Common Pitfalls** | `resources/common_pitfalls.md` | Lỗi thường gặp và cách phòng tránh |
| **Scaffold Checklist** | `resources/scaffold_checklist.md` | Checklist tạo app Frappe mới từ đầu |
| **Upgrade Patterns** | `resources/upgrade_patterns.md` | Patterns nâng cấp Frappe version an toàn |
| **REST API Patterns** | `resources/rest-api-patterns.md` | Curl patterns cho REST API operations |
| **DocType Registry** | `resources/doctype-registry.md` | DocType discovery và exploration workflows |
| **Installation Guide** | `resources/installation-guide.md` | Hướng dẫn cài đặt đầy đủ mọi platform |
| **Web Form Patterns** | `resources/web-form-patterns.md` | Web Form client scripting patterns |

### Resources Được Sử Dụng Bởi

| Resource | Agents dùng |
|----------|-------------|
| 7-layer-architecture | Tất cả Build agents |
| bench_commands | Installer, Backend, Fixer |
| rest-api-patterns | Remote Ops |
| common_pitfalls | Fixer, Debugger |
| installation-guide | Installer |

---

## 2. Sub-Skills (7 skills)

Mỗi Sub-Skill là một SKILL.md nhỏ chứa cú pháp chi tiết cho lĩnh vực kỹ thuật cụ thể.

| Skill | Thư mục | Nội dung |
|-------|---------|----------|
| **DocType Patterns** | `skills/doctype-patterns/` | Best practices cho custom fields, naming rules, child tables |
| **Server Scripts** | `skills/server-scripts/` | Server-side Python patterns, hooks, scheduled jobs |
| **Client Scripts** | `skills/client-scripts/` | JavaScript form/list configurations, event handlers |
| **Frappe API** | `skills/frappe-api/` | Frappe ORM và Python API — `frappe.get_doc`, `frappe.db.get_list` |
| **Bench Commands** | `skills/bench-commands/` | Bench CLI reference chi tiết |
| **Remote Operations** | `skills/remote-operations/` | REST API patterns cho remote sites |
| **Web Forms** | `skills/web-forms/` | Web Form development patterns, client scripting |

### Workflow Tham Chiếu

```
Agent nhận task → Đọc SKILL.md → Chọn Sub-Skill cú pháp → Consult Resource → Viết code
```

Ví dụ: Agent "Frappe Backend" nhận yêu cầu viết API mới:
1. Đọc `skills/frappe-api/SKILL.md` cho cú pháp ORM
2. Tham khảo `resources/7-layer-architecture.md` cho layer placement
3. Kiểm tra `resources/common_pitfalls.md` cho anti-patterns

---
[← Danh mục Commands](commands-catalog.md) · [Hướng dẫn SOP →](sop/user-guide.md)
