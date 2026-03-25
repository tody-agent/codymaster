---
title: "Danh mục AI Agents"
description: "Catalogue chi tiết 12 AI Agents chuyên biệt trong Frappe Dev Master — chức năng, trigger conditions, và workflow."
keywords: "frappe agents, ai agent, doctype architect, backend, frontend, debugger, fixer, performance"
robots: "index, follow"
---

# Danh mục AI Agents

> **12 AI Agents** phân chia thành 2 nhóm: **Build** (phát triển) và **Operate** (vận hành). Mỗi agent có chuyên môn riêng, được SKILL.md điều phối tự động dựa trên ngữ cảnh yêu cầu.

---

## Nhóm 1: Build Agents (Phát triển)

### 1.1 DocType Architect
- **File:** `agents/doctype-architect.md`
- **Trigger:** "thiết kế DocType", "schema", "workflow states", "naming rule"
- **Chức năng:** Thiết kế cấu trúc database (JSON schema), quan hệ DocType, workflow states, naming conventions
- **Output:** DocType JSON files, Custom Field definitions, Property Setters

### 1.2 Frappe Backend
- **File:** `agents/frappe-backend.md`
- **Trigger:** "viết API", "controller", "background job", "engine"
- **Chức năng:** Lập trình Python server-side — Controllers, Engines (Layer 2), API endpoints
- **Quy tắc:** Luôn tách business logic ra `engines/`, dùng idempotent upsert

### 1.3 Frappe Frontend
- **File:** `agents/frappe-frontend.md`
- **Trigger:** "client script", "form script", "dialog", "list view"
- **Chức năng:** JavaScript Frappe Forms, Dialogs, List View configurations
- **Quy tắc:** Dùng `window.myapp` namespace, kiểm tra element tồn tại trước khi thao tác

### 1.4 Custom Frontend
- **File:** `agents/frappe-custom-frontend.md`
- **Trigger:** "trang custom", "standalone page", "custom frontend"
- **Chức năng:** Standalone frontend pages ngoài Desk UI chuẩn của Frappe

### 1.5 ERPNext Customizer
- **File:** `agents/erpnext-customizer.md`
- **Trigger:** "mở rộng ERPNext", "custom field", "property setter"
- **Chức năng:** Mở rộng an toàn các module core ERPNext qua Custom Fields/Property Setters
- **Quy tắc:** KHÔNG BAO GIỜ sửa file core — luôn dùng hooks.py

---

## Nhóm 2: Lifecycle Agents (Vận hành)

### 2.1 Frappe Installer
- **File:** `agents/frappe-installer.md`
- **Trigger:** "cài đặt frappe", "install bench", "setup site", "production setup"
- **Chức năng:** Cài đặt môi trường (Python, Node, MariaDB, Redis), bench init, site creation, production deployment (Nginx, Supervisor, SSL)
- **Workflow:** Detect Environment → Install Prerequisites → Init Bench → Create Site → Install Apps
- **Bảng lỗi thường gặp:** 8 common errors with quick fixes

### 2.2 Frappe Planner
- **File:** `agents/frappe-planner.md`
- **Trigger:** "lên kế hoạch", "feature planning", "technical design"
- **Chức năng:** Lập kế hoạch feature mới, thiết kế kỹ thuật, ADR

### 2.3 Frappe Debugger
- **File:** `agents/frappe-debugger.md`
- **Trigger:** "phân tích lỗi", "debug", "check error", "log investigation"
- **Chức năng:** Phân tích lỗi (chỉ read-only), log investigation, không sửa code
- **Phân biệt:** Debugger chỉ **phân tích**, Fixer mới **sửa**

### 2.4 Frappe Fixer ⭐
- **File:** `agents/frappe-fixer.md`
- **Trigger:** "sửa lỗi", "fix bug", "fix error", "solve frappe error"
- **Chức năng:** Sửa lỗi theo vòng lặp bắt buộc 6 bước
- **Fix Loop (MANDATORY):**
  1. **REPRODUCE** — Xác nhận lỗi tồn tại
  2. **DIAGNOSE** — Tìm nguyên nhân gốc (không chỉ triệu chứng)
  3. **HYPOTHESIZE** — Đề xuất fix tối thiểu
  4. **FIX** — Áp dụng thay đổi (theo 7-Layer)
  5. **VERIFY** — Kiểm tra fix hoạt động, không regression
  6. **DOCUMENT** — Ghi chép lại lỗi và cách sửa

### 2.5 Frappe Performance ⭐
- **File:** `agents/frappe-performance.md`
- **Trigger:** "chậm", "slow query", "optimize", "performance", "caching"
- **Chức năng:** Query optimization, profiling (cProfile, tracemalloc), caching strategy, N+1 detection
- **Workflow:** Identify Bottleneck → Profile Code → Find Root Cause → Optimize
- **Common Patterns:** N+1 queries, missing indexes, over-fetching, no caching

### 2.6 Frappe Remote Ops
- **File:** `agents/frappe-remote-ops.md`
- **Trigger:** "remote API", "REST API", "frappe cloud", "curl frappe"
- **Chức năng:** CRUD qua REST API, report execution, Web Form management, DocType discovery
- **Security:** KHÔNG tiết lộ API keys, LUÔN xác nhận trước thao tác xóa

### 2.7 GitHub Workflow
- **File:** `agents/github-workflow.md`
- **Trigger:** "git", "github", "ci/cd", "pull request"
- **Chức năng:** Git operations, CI/CD configuration, GitHub Actions

---

## Ma trận Phối hợp Agent

Khi một agent cần hỗ trợ từ agent khác:

| Tình huống | Agent gốc | Chuyển tới |
|---|---|---|
| Fix cần thay đổi schema | Fixer | → DocType Architect |
| Fix cần API mới | Fixer | → Backend |
| Fix trên remote site | Fixer | → Remote Ops |
| Cần phân tích sâu hơn | Fixer | → Debugger |
| Performance cần index mới | Performance | → DocType Architect |
| Build xong cần test | Backend/Frontend | → Commands/test |

---
[← Kiến trúc](architecture.md) · [Danh mục Commands →](commands-catalog.md)
