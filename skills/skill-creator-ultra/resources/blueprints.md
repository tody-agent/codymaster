# 📚 Skill Blueprints — Kho Template Skill "Ăn Liền"

Kho này chứa các **blueprint** (bản thiết kế sẵn) cho những use case phổ biến nhất.
User chỉ cần chọn blueprint → customize theo nhu cầu → deploy ngay.

> **Cách dùng:** Khi phỏng vấn user ở Phase 1, nếu phát hiện use case khớp với
> blueprint nào → đề xuất: "Em thấy việc này giống blueprint [X]. Dùng nó làm
> nền rồi customize cho phù hợp nhé?"

---

## 🗂️ Danh mục Blueprint

| # | Blueprint | Use case | Complexity |
|---|---|---|---|
| 1 | Code Review Assistant | Review code trước merge/PR | 🟡 |
| 2 | Report Generator | Sinh báo cáo định kỳ | 🟡 |
| 3 | Deploy Pipeline | CI/CD tự động | 🔴 |
| 4 | Documentation Writer | Sinh/cập nhật tài liệu | 🟡 |
| 5 | Data Transformer | Chuyển đổi format dữ liệu | 🟠 |
| 6 | Email Responder | Tự động trả lời email theo mẫu | 🟡 |
| 7 | Onboarding Guide | Hướng dẫn thành viên mới | 🟢 |
| 8 | SEO Auditor | Kiểm tra & tối ưu SEO | 🟠 |
| 9 | Meeting Summarizer | Tóm tắt nội dung họp | 🟢 |
| 10 | Invoice Generator | Tạo hóa đơn cho khách | 🟠 |

---

## Blueprint 1: 🔍 Code Review Assistant

```yaml
name: code-review-assistant
category: DevOps
complexity: 🟡 Trung bình
patterns: [Context-Aware, Composable]
```

### SKILL.md Template

```markdown
---
name: code-review-assistant
description: |
  Review code tự động trước khi merge. Kiểm tra coding standards, 
  phát hiện bugs tiềm ẩn, đề xuất cải thiện. Kích hoạt khi user 
  nói "review code", "check PR", "xem code giúp".
---

# Goal
Phát hiện bugs, code smells, và vi phạm conventions trước khi merge.

# Instructions
1. Xác định scope review:
   - User chỉ định file cụ thể? → Review file đó
   - User nói "review PR"? → Xem git diff với branch chính
2. Kiểm tra theo 4 lớp:
   a. **Correctness (Đúng):** Logic có bug không? Edge cases?
   b. **Security (An toàn):** SQL injection? XSS? Hardcoded secrets?
   c. **Performance (Hiệu suất):** N+1 queries? Memory leaks? 
   d. **Style (Phong cách):** Naming conventions? Code duplication?
3. Với mỗi issue tìm thấy:
   - Đánh mức: 🔴 Critical / 🟡 Warning / 🟢 Suggestion
   - Chỉ rõ dòng code
   - Gợi ý cách fix
4. Tổng kết: X issues (Y critical, Z warnings)

# Constraints
- KHÔNG ĐƯỢC chỉ nói "code looks good" mà không kiểm tra kỹ
- LUÔN LUÔN kiểm tra security trước tiên
- LUÔN LUÔN cung cấp gợi ý fix, không chỉ nêu vấn đề
```

### Customize gợi ý

- [ ] Thêm conventions riêng của team
- [ ] Thêm checklist review cụ thể cho framework (React/Vue/Angular)
- [ ] Thêm auto-fix script nếu cần

---

## Blueprint 2: 📊 Report Generator

```yaml
name: report-generator
category: Business
complexity: 🟡 Trung bình
patterns: [Multi-Resource, Context-Aware]
```

### SKILL.md Template

```markdown
---
name: report-generator
description: |
  Tự động tạo báo cáo từ dữ liệu. Hỗ trợ nhiều loại: báo cáo tuần, 
  tháng, sprint review, incident report. Kích hoạt khi user nói 
  "viết báo cáo", "tạo report", "weekly report", "monthly summary".
---

# Goal
Sinh báo cáo chuyên nghiệp, đúng format, trong thời gian ngắn nhất.

# Instructions
1. Hỏi loại báo cáo:
   - Tuần / Tháng / Sprint / Incident / Custom
2. Thu thập dữ liệu:
   - Tự động: Git log, task management (Jira/Trello/Linear)
   - Thủ công: Hỏi user liệt kê thành tựu/vấn đề
3. Chọn template từ `resources/templates/`
4. Điền dữ liệu vào template
5. Format gọn gàng, dùng bullet points và bảng
6. Xuất kết quả

# Constraints
- KHÔNG ĐƯỢC viết đoạn văn dài — dùng bullet points
- LUÔN LUÔN có section "Vấn đề/Rủi ro"
- LUÔN LUÔN ghi ngày tháng cụ thể
```

### Resources cần tạo

```
resources/
├── templates/
│   ├── weekly_report.md
│   ├── monthly_report.md
│   ├── sprint_review.md
│   └── incident_report.md
└── styles/
    └── formatting_rules.md
```

---

## Blueprint 3: 🚀 Deploy Pipeline

```yaml
name: deploy-pipeline
category: DevOps
complexity: 🔴 Rất phức tạp
patterns: [Pipeline, Safety-First, Script]
```

### SKILL.md Template

```markdown
---
name: deploy-pipeline
description: |
  Pipeline triển khai ứng dụng tự động: lint → test → build → deploy. 
  Mỗi stage có gate check, fail là dừng. Có rollback khi deploy thất bại. 
  Kích hoạt khi user nói "deploy", "phát hành", "đẩy lên production".
---

# Goal
Deploy ứng dụng an toàn, có kiểm tra từng bước, có rollback nếu fail.

# Instructions

## Bước 0: Safety Check
- "Đây là môi trường nào?" (dev/staging/production)
- Nếu production → BẮT BUỘC confirm + kiểm tra backup

## Stage 1: Lint ✅❌
1. Chạy linter → Nếu FAIL → Dừng, báo lỗi

## Stage 2: Test ✅❌
1. Chạy test suite → Nếu FAIL → Dừng, hiển thị failures

## Stage 3: Build ✅❌
1. Build production bundle → Nếu FAIL → Phân tích error

## Stage 4: Deploy ✅❌ (CẦN XÁC NHẬN)
1. ⚠️ Confirm từ user
2. Deploy → Nếu FAIL → Rollback theo guide

## Progress Tracking
[✅] Lint → [✅] Test → [🔄] Build → [⏳] Deploy

# Constraints
- 🚫 TUYỆT ĐỐI KHÔNG deploy nếu test fail
- 🚫 TUYỆT ĐỐI KHÔNG auto-deploy production mà không confirm
- ✅ LUÔN LUÔN có rollback plan
```

---

## Blueprint 4: 📝 Documentation Writer

```yaml
name: docs-writer
category: Engineering
complexity: 🟡 Trung bình
patterns: [Context-Aware, Multi-Resource]
```

### SKILL.md Template

```markdown
---
name: docs-writer
description: |
  Tự động sinh và cập nhật tài liệu kỹ thuật từ mã nguồn. Hỗ trợ 
  API docs, README, Architecture docs, Changelog. Kích hoạt khi user 
  nói "viết docs", "cập nhật tài liệu", "document this".
---

# Goal
Đảm bảo tài liệu luôn đồng bộ với code, không bao giờ lỗi thời.

# Instructions
1. Xác định loại tài liệu: API / README / Architecture / Changelog
2. Scan mã nguồn liên quan
3. Trích xuất thông tin (endpoints, functions, types...)
4. Sinh tài liệu theo template phù hợp
5. So sánh với tài liệu hiện có → highlight thay đổi

# Constraints
- KHÔNG ĐƯỢC tạo docs mà không có ví dụ code
- LUÔN LUÔN sync với code thực tế
```

---

## Blueprint 5: 🔄 Data Transformer

```yaml
name: data-transformer
category: Data Engineering
complexity: 🟠 Phức tạp
patterns: [Script, Context-Aware]
```

### SKILL.md Template

```markdown
---
name: data-transformer
description: |
  Chuyển đổi dữ liệu giữa các format: CSV↔JSON, Excel→SQL, XML→JSON, 
  YAML→JSON. Hỗ trợ cleaning, validation, và mapping fields. 
  Kích hoạt khi user nói "convert data", "chuyển đổi format", "parse file".
---

# Goal
Chuyển đổi dữ liệu nhanh, chính xác, không mất data.

# Instructions
1. Xác định: Format nguồn → Format đích
2. Đọc file/data nguồn
3. Validate dữ liệu (kiểm tra encoding, missing fields)
4. Transform theo mapping rules
5. Xuất ra format đích
6. Validate kết quả (đếm records, so sánh)

# Constraints
- KHÔNG ĐƯỢC làm mất dữ liệu khi convert
- LUÔN LUÔN validate output vs input (đếm records khớp)
- LUÔN LUÔN handle encoding UTF-8 / CP1258 cho tiếng Việt
```

---

## Blueprint 6: ✉️ Email Responder

```yaml
name: email-responder
category: Business
complexity: 🟡 Trung bình
patterns: [Multi-Resource, Context-Aware]
```

### SKILL.md Template

```markdown
---
name: email-responder
description: |
  Soạn email trả lời chuyên nghiệp theo tình huống. Phân loại email đến 
  (hỏi giá/khiếu nại/hợp tác/support) và sinh reply phù hợp. 
  Kích hoạt khi user nói "trả lời email", "reply email", "soạn email".
---

# Goal
Sinh email reply chuyên nghiệp, đúng tone, trong 30 giây.

# Instructions
1. Phân loại email đến:
   - Hỏi giá / Báo giá
   - Khiếu nại / Complaint
   - Hợp tác / Partnership
   - Hỗ trợ kỹ thuật / Support
   - Cảm ơn / Follow-up
2. Chọn template reply tương ứng
3. Điền thông tin cụ thể (tên, sản phẩm, giá...)
4. Điều chỉnh tone phù hợp:
   - Formal (đối tác, khách VIP)
   - Friendly (khách quen, đồng nghiệp)
   - Apologetic (khiếu nại)

# Constraints
- KHÔNG ĐƯỢC gửi email mà không cho user review trước
- LUÔN LUÔN chào bằng tên người nhận
- LUÔN LUÔN có CTA (Call-to-Action) cuối email
```

---

## Blueprint 7: 👋 Onboarding Guide

```yaml
name: onboarding-guide
category: HR / Team Management
complexity: 🟢 Đơn giản
patterns: [Multi-Resource]
```

### SKILL.md Template

```markdown
---
name: onboarding-guide
description: |
  Tạo hướng dẫn onboarding cho thành viên mới. Sinh checklist setup môi trường, 
  giới thiệu codebase, quy trình team. Kích hoạt khi nói "onboard member mới",
  "hướng dẫn người mới", "setup cho dev mới".
---

# Goal
Rút ngắn thời gian onboarding từ 1 tuần xuống 1 ngày.

# Instructions
1. Scan dự án hiện tại (tech stack, structure, conventions)
2. Sinh checklist setup:
   - Cài đặt tools
   - Clone repo + setup env
   - Chạy dev server lần đầu
3. Sinh giới thiệu tổng quan:
   - Architecture overview
   - Key files và folders
   - Coding conventions
4. Sinh danh sách contacts (hỏi user)

# Constraints
- LUÔN LUÔN chia thành Day 1 / Day 2 / Day 3
- LUÔN LUÔN có checklist checkbox format
```

---

## Blueprint 8: 🔎 SEO Auditor

```yaml
name: seo-auditor
category: Marketing
complexity: 🟠 Phức tạp
patterns: [Script, Safety-First]
```

### SKILL.md Template

```markdown
---
name: seo-auditor
description: |
  Kiểm tra và đánh giá SEO cho website. Phân tích meta tags, heading structure, 
  page speed, mobile-friendly, broken links. Kích hoạt khi nói "kiểm tra SEO", 
  "SEO audit", "tối ưu SEO".
---

# Goal
Phát hiện mọi vấn đề SEO và đưa ra gợi ý cải thiện cụ thể.

# Instructions
1. Nhận URL hoặc scan project files
2. Kiểm tra 6 nhóm:
   a. Meta tags (title, description, OG)
   b. Heading structure (H1-H6)
   c. Images (alt text, size, lazy loading)
   d. Links (internal, external, broken)
   e. Performance (bundle size, render time)
   f. Mobile-friendly (viewport, responsive)
3. Chấm điểm từng nhóm (0-100)
4. Liệt kê issues + priority + gợi ý fix

# Constraints
- LUÔN LUÔN chấm điểm từng nhóm riêng
- LUÔN LUÔN sắp xếp issues theo priority (Critical → Low)
```

---

## Blueprint 9: 📋 Meeting Summarizer

```yaml
name: meeting-summarizer
category: Productivity
complexity: 🟢 Đơn giản
patterns: [Basic]
```

### SKILL.md Template

```markdown
---
name: meeting-summarizer
description: |
  Tóm tắt nội dung cuộc họp thành meeting notes chuyên nghiệp. 
  Trích xuất key decisions, action items, và owners. 
  Kích hoạt khi nói "tóm tắt cuộc họp", "meeting notes", "ghi chú họp".
---

# Goal
Biến nội dung họp dài thành tóm tắt ngắn gọn, actionable.

# Instructions
1. Nhận input (transcript, ghi chú thô, hoặc user tóm tắt miệng)
2. Trích xuất 5 phần:
   - Participants (Ai dự)
   - Key Discussions (Thảo luận chính)
   - Decisions Made (Quyết định)
   - Action Items (Việc cần làm + Owner + Deadline)
   - Next Meeting (Nếu có)
3. Format ngắn gọn, dùng bullet points

# Constraints
- KHÔNG ĐƯỢC viết quá 1 trang
- LUÔN LUÔN có Action Items với Owner và Deadline
- LUÔN LUÔN ghi ngày giờ họp
```

---

## Blueprint 10: 🧾 Invoice Generator

```yaml
name: invoice-generator
category: Business / Finance
complexity: 🟠 Phức tạp
patterns: [Multi-Resource, Script]
```

### SKILL.md Template

```markdown
---
name: invoice-generator
description: |
  Tạo hóa đơn chuyên nghiệp cho khách hàng. Tính tổng, thuế VAT, 
  chiết khấu. Xuất ra Markdown/PDF. Kích hoạt khi nói "tạo hóa đơn", 
  "xuất invoice", "lập phiếu thu".
---

# Goal
Sinh hóa đơn chính xác, đẹp, chuyên nghiệp trong 1 phút.

# Instructions
1. Thu thập thông tin:
   - Thông tin người bán
   - Thông tin người mua
   - Danh sách sản phẩm/dịch vụ (tên, số lượng, đơn giá)
2. Tính toán:
   - Thành tiền = Số lượng × Đơn giá
   - Chiết khấu (nếu có)
   - Thuế VAT (mặc định 8%)
   - Tổng cộng
3. Sinh hóa đơn theo template
4. Đánh số hóa đơn: INV-YYYYMMDD-XXX

# Constraints
- KHÔNG ĐƯỢC tính sai số tiền (double-check phép tính)
- LUÔN LUÔN hiển thị chi tiết thuế VAT riêng
- LUÔN LUÔN đánh số hóa đơn duy nhất
```

---

## 🔧 Cách sử dụng Blueprint

### Quy trình customize

1. **Chọn blueprint** gần nhất với use case
2. **Copy SKILL.md template** làm điểm khởi đầu
3. **Customize** theo nhu cầu cụ thể:
   - Thêm/bớt Instructions
   - Sửa Examples cho phù hợp
   - Thêm Constraints riêng
4. **Test** với validate_skill.py
5. **Deploy**

### Kết hợp Blueprints

Có thể kết hợp nhiều blueprints:

- **Code Review + Deploy Pipeline** → Review trước deploy
- **Report Generator + Meeting Summarizer** → Báo cáo từ meeting notes
- **Email Responder + Invoice Generator** → Gửi invoice qua email
