---
title: "Hướng dẫn Sử dụng Tiêu chuẩn (SOP)"
description: "Step-by-step standard operating procedures cho các tác vụ Frappe Dev Master — từ tạo app mới tới sửa lỗi production."
keywords: "frappe sop, user guide, step by step, workflow, troubleshooting"
robots: "index, follow"
---

# Hướng dẫn Sử dụng (SOP)

> Các quy trình chuẩn (Standard Operating Procedures) cho từng loại tác vụ phát triển Frappe. Mỗi SOP bao gồm: điều kiện kích hoạt, agent phụ trách, bước thực hiện, và troubleshooting.

---

## SOP 1: Tạo Frappe App Mới

**Khi nào:** Bắt đầu dự án Frappe mới từ đầu
**Agent:** Installer → Planner → DocType Architect

### Bước thực hiện

1. **Cài đặt môi trường** (nếu chưa có)
   ```bash
   # Check prerequisites
   frappe install check
   # Init bench
   bench init frappe-bench --frappe-branch version-15
   cd frappe-bench
   bench new-site mysite.localhost
   ```

2. **Scaffold app mới**
   ```bash
   bench new-app my_app
   bench --site mysite.localhost install-app my_app
   ```

3. **Thiết kế DocType (dùng AI)**
   - Mô tả yêu cầu tới Agent: "Thiết kế DocType Employee Score với fields: employee, score, month"
   - DocType Architect sẽ tạo JSON schema theo naming conventions

4. **Implement logic** 
   - Backend Agent viết Engine (Layer 2) → Controller (Layer 1) → API (Layer 3)
   - Frontend Agent viết Client Scripts (Layer 7)

5. **Test & Deploy**
   ```bash
   bench --site mysite.localhost run-tests --app my_app
   bench build
   bench --site mysite.localhost migrate
   ```

---

## SOP 2: Sửa Lỗi Production (Bug Fix)

**Khi nào:** Có lỗi cần sửa trên production
**Agent:** Fixer (bắt buộc Fix Loop 6 bước)

### Bước thực hiện

1. **Reproduce** — Xác nhận lỗi
   ```bash
   frappe fix "Error: ValidationError on Sales Invoice submit"
   ```

2. **Diagnose** — Agent tự kiểm tra logs, Error Log DocType
3. **Hypothesize** — Agent đề xuất fix tối thiểu
4. **Fix** — Agent áp dụng thay đổi theo đúng 7-Layer
5. **Verify** — Chạy tests, kiểm tra regression
6. **Document** — Agent tạo fix documentation

<details>
<summary>🔧 Troubleshooting: Fix Loop thất bại ở bước Verify</summary>

- Revert fix: `git checkout -- <file>`
- Quay lại bước 2 — chẩn đoán sai root cause
- Thêm debug logging để thu thập thêm thông tin
- Xem xét edge cases chưa xử lý
</details>

---

## SOP 3: Tối ưu Hiệu năng

**Khi nào:** Trang chậm, query timeout, memory cao
**Agent:** Performance

### Bước thực hiện

1. **Identify bottleneck**
   ```bash
   # Enable slow query log
   # In site_config.json: "log_slow_queries": 1
   grep "slow_query" logs/frappe.log | tail -20
   ```

2. **Profile code** — cProfile, tracemalloc
3. **Find root cause** — N+1? Missing index? Over-fetching?
4. **Optimize** — Batch fetch, add index, implement caching
5. **Verify** — Đo lại response time

---

## SOP 4: Vận hành Remote Site

**Khi nào:** Cần thao tác CRUD/debug trên Frappe Cloud hoặc remote site (không có shell access)
**Agent:** Remote Ops

### Bước thực hiện

1. **Setup credentials** trong `.env`
   ```bash
   FRAPPE_SITE=https://mysite.example.com
   FRAPPE_API_KEY=<key>
   FRAPPE_API_SECRET=<secret>
   ```

2. **Test connection**
   ```bash
   frappe remote discover --site https://mysite.example.com
   ```

3. **Execute operations**
   ```bash
   frappe remote list "Sales Invoice" --filters '{"status":"Paid"}'
   frappe remote get "Sales Invoice" "ACC-SINV-2024-00001"
   ```

---

## SOP 5: Mở rộng ERPNext

**Khi nào:** Cần thêm field/logic vào ERPNext mà không sửa core code
**Agent:** ERPNext Customizer

### Bước thực hiện

1. **Tạo Custom Field** (KHÔNG sửa core JSON)
   ```python
   frappe.get_doc({
       "doctype": "Custom Field",
       "dt": "Sales Invoice",
       "fieldname": "custom_priority",
       "fieldtype": "Select",
       "options": "Low\nMedium\nHigh"
   }).insert()
   ```

2. **Hook vào events** trong `hooks.py`
   ```python
   doc_events = {
       "Sales Invoice": {
           "validate": "my_app.overrides.validate_priority"
       }
   }
   ```

3. **Test** rằng standard ERPNext workflow không bị ảnh hưởng

---

## Quick Reference: Chọn đúng Agent

| Bạn muốn... | Dùng Agent |
|---|---|
| Cài đặt Frappe từ đầu | Installer |
| Thiết kế DocType | DocType Architect |
| Viết Python API/logic | Backend |
| Viết Client Script/UI | Frontend |
| Customize ERPNext | ERPNext Customizer |
| Phân tích lỗi (không sửa) | Debugger |
| Sửa lỗi (có sửa code) | Fixer |
| Tối ưu performance | Performance |
| Thao tác remote site | Remote Ops |
| Git/CI/CD | GitHub Workflow |

---
[← Tài liệu Tham khảo](../resources-catalog.md) · [Vibe Coding Guide →](vibe-coding-guide.md)
