# ❌ Anti-Patterns Guide — Những Lỗi Phổ Biến Khi Tạo Skill

> "Học từ sai lầm nhanh hơn học từ thành công."

Tài liệu này liệt kê **15 anti-patterns** (lỗi phổ biến) khi tạo skill,
kèm **ví dụ sai → ví dụ đúng** cho từng lỗi.

---

## Anti-Pattern 1: 🐙 The Octopus (Skill Bạch Tuộc)

**Lỗi:** Skill ôm đồm quá nhiều chức năng.

```markdown
❌ SAI:
---
name: super-dev-tool
description: Review code, deploy, viết test, format commit, tạo PR, quản lý branch
---
# Một skill làm 6 việc → AI không biết khi nào dùng

✅ ĐÚNG:
# Tách thành 6 skill riêng:
code-reviewer, app-deployer, test-writer, 
commit-formatter, pr-creator, branch-manager
```

**Quy tắc:** 1 skill = 1 việc. Nếu mô tả skill cần dùng "và" nhiều lần → tách.

---

## Anti-Pattern 2: 👻 The Ghost Description (Mô Tả Ma)

**Lỗi:** Description quá mơ hồ, AI không bao giờ kích hoạt.

```markdown
❌ SAI:
description: Giúp làm việc với code

❌ SAI:
description: Tool hữu ích

❌ SAI:
description: Helper

✅ ĐÚNG:
description: |
  Review code tự động trước khi merge PR. Kiểm tra coding standards, 
  phát hiện bugs tiềm ẩn, SQL injection, XSS. Kích hoạt khi user 
  nói "review code", "check PR", "xem code giúp".
```

**Quy tắc:** Description phải trả lời: Làm gì? Cho ai? Khi nào kích hoạt?

---

## Anti-Pattern 3: 💨 The Air Instructions (Hướng Dẫn Gió)

**Lỗi:** Instructions quá chung chung, không actionable.

```markdown
❌ SAI:
# Instructions
1. Phân tích yêu cầu
2. Xử lý
3. Trả kết quả

✅ ĐÚNG:
# Instructions
1. Đọc file hoặc nội dung user cung cấp.
2. Kiểm tra encoding (UTF-8 hay CP1258?).
3. Parse theo format nguồn (CSV: tách bằng `,`, TSV: tách bằng tab).
4. Validate: Đếm số cột mỗi dòng khớp với header không?
5. Transform: Mapping từng cột theo bảng trong `resources/mapping.md`.
6. Output: Ghi ra JSON với format `[{key: value}, ...]`.
7. Validate output: Đếm records input = output?
```

**Quy tắc:** Mỗi bước phải có HÀNH ĐỘNG CỤ THỂ mà AI có thể thực hiện.

---

## Anti-Pattern 4: 🎭 The No-Example Skill (Skill Không Ví Dụ)

**Lỗi:** Không có examples → AI hallucinate output format.

```markdown
❌ SAI:
# Examples
(Không có)

❌ SƠ SÀI:
# Examples
## Ví dụ 1
Input: data
Output: result

✅ ĐÚNG:
# Examples
## Ví dụ 1: Convert CSV thành JSON
**Input:**
name,email,phone
Nguyễn Văn A,a@gmail.com,0901234567
Trần Thị B,b@gmail.com,0907654321

**Output:**
[
  {"name": "Nguyễn Văn A", "email": "a@gmail.com", "phone": "0901234567"},
  {"name": "Trần Thị B", "email": "b@gmail.com", "phone": "0907654321"}
]
```

**Quy tắc:** Ít nhất 2 ví dụ, mỗi ví dụ có dữ liệu THẬT, output CHÍNH XÁC.

---

## Anti-Pattern 5: 🔓 The Open Gate (Cổng Mở)

**Lỗi:** Không có constraints → AI có thể làm bất cứ gì.

```markdown
❌ SAI:
# Constraints
(Không có)

✅ ĐÚNG:
# Constraints
- KHÔNG ĐƯỢC xóa file gốc khi convert
- KHÔNG ĐƯỢC output file lớn hơn 10MB mà không cảnh báo
- LUÔN LUÔN validate output trước khi giao
- LUÔN LUÔN backup input trước khi transform
```

**Quy tắc:** Nghĩ xem "Điều tệ nhất có thể xảy ra?" → Cấm nó.

---

## Anti-Pattern 6: 📜 The Novel (Skill Tiểu Thuyết)

**Lỗi:** SKILL.md quá dài (>500 dòng), AI bị quá tải context.

```markdown
❌ SAI:
SKILL.md → 800 dòng, bao gồm mọi edge case có thể nghĩ ra

✅ ĐÚNG:
SKILL.md → 150-300 dòng (core logic)
resources/edge_cases.md → Chi tiết edge cases
resources/templates/ → Templates tách riêng
examples/ → Ví dụ dài tách riêng
```

**Quy tắc:** SKILL.md nên 100-400 dòng. Tách phần dài sang resources/.

---

## Anti-Pattern 7: 🤖 The Jargon Bot (Bot Thuật Ngữ)

**Lỗi:** Dùng thuật ngữ kỹ thuật mà AI hiểu sai hoặc user không hiểu.

```markdown
❌ SAI:
# Instructions
1. Implement idempotent ETL pipeline with exactly-once semantics
2. Apply CAP theorem trade-offs for eventual consistency

✅ ĐÚNG:
# Instructions
1. Đảm bảo chạy lặp lại cho kết quả giống nhau (không duplicate data)
2. Chấp nhận dữ liệu có thể chậm vài giây nhưng sẽ đồng bộ hoàn toàn
```

**Quy tắc:** Viết cho AI HIỂU, không phải để impress. Đơn giản > phức tạp.

---

## Anti-Pattern 8: 🎪 The Circus Trigger (Trigger Luna Park)

**Lỗi:** Description trigger quá rộng → kích hoạt nhầm liên tục.

```markdown
❌ SAI:
description: Giúp viết code

→ AI sẽ kích hoạt MỌI LÚC user nhờ viết code, kể cả khi không liên quan

✅ ĐÚNG:
description: |
  Sinh unit test cho hàm JavaScript/TypeScript. Tạo test cases bao gồm 
  happy path và edge cases, sử dụng Jest framework. Kích hoạt khi user 
  nói "viết test cho hàm", "tạo unit test", "test function này".
```

**Quy tắc:** Trigger càng CỤ THỂ càng tốt. Hẹp hơn > Rộng hơn.

---

## Anti-Pattern 9: 🏗️ The Scaffolding Only (Chỉ Có Khung)

**Lỗi:** Tạo structure hoành tráng nhưng nội dung rỗng.

```markdown
❌ SAI:
skills/my-skill/
├── SKILL.md           ← 20 dòng sơ sài
├── scripts/
│   └── (empty)
├── resources/
│   └── (empty)
└── examples/
    └── (empty)

✅ ĐÚNG:
skills/my-skill/
├── SKILL.md           ← 200 dòng chi tiết
└── examples/
    ├── example_1.md   ← Ví dụ thực tế
    └── example_2.md   ← Ví dụ edge case
# Chỉ tạo folders KHI CÓ NỘI DUNG bên trong
```

**Quy tắc:** Đừng tạo folder rỗng. Structure phải match complexity thực tế.

---

## Anti-Pattern 10: 🔮 The Crystal Ball (Quả Cầu Pha Lê)

**Lỗi:** Skill giả định quá nhiều thứ mà không hỏi user.

```markdown
❌ SAI:
# Instructions
1. Đọc file package.json → Giả sử dùng React
2. Build với webpack → Giả sử dùng webpack

✅ ĐÚNG:
# Instructions
1. Kiểm tra tech stack:
   - Có package.json? → Đọc dependencies
   - Có requirements.txt? → Python project
   - Không rõ? → Hỏi user: "Dự án dùng framework gì?"
2. Dựa vào tech stack → Chọn build tool phù hợp
```

**Quy tắc:** Khi không chắc → HỎI. Đừng giả định.

---

## Anti-Pattern 11: 💣 The YOLO Deployer (Deploy Bừa)

**Lỗi:** Skill thao tác production mà không có safety check.

```markdown
❌ SAI:
# Instructions  
1. Chạy `npm run deploy` → Done!

✅ ĐÚNG:
# Instructions
## Bước 0: Safety Check
- "Đây là production hay development?"
- Nếu production → Đã backup chưa? Đã test staging chưa?
## Bước 1: Deploy
- ⚠️ BẮT BUỘC user confirm
- Chạy deploy
- Verify sau deploy (health check)
- Nếu fail → Rollback theo guide
```

**Quy tắc:** Production = luôn có Safety Check + Confirm + Rollback.

---

## Anti-Pattern 12: 📝 The Copy-Paste Goal

**Lỗi:** Goal copy lại description, không thêm giá trị.

```markdown
❌ SAI:
description: Tạo unit test cho JavaScript
# Goal
Tạo unit test cho JavaScript.

✅ ĐÚNG:
description: Tạo unit test cho hàm JavaScript/TypeScript, dùng Jest
# Goal
Đảm bảo mọi function đều có test coverage ≥80%, bao gồm happy path và edge cases.
```

**Quy tắc:** Goal = WHY (tại sao). Description = WHAT (làm gì).

---

## Anti-Pattern 13: 🌊 The Feature Creep

**Lỗi:** Liên tục thêm tính năng cho skill đến khi nó quá phức tạp.

```markdown
❌ SAI:
# commit-formatter v1: Format commit → v2: + Auto-push → 
# v3: + PR creator → v4: + Code review → v5: Quái vật 500 dòng

✅ ĐÚNG:
# commit-formatter: Chỉ format commit message. Xong.
# auto-pusher: Skill riêng cho push + PR
# code-reviewer: Skill riêng cho review
```

**Quy tắc:** Skill mập quá → tách. Dùng Pattern 6 (Composable) để kết nối.

---

## Anti-Pattern 14: 🔇 The Silent Failure

**Lỗi:** Skill gặp lỗi nhưng không báo, tiếp tục chạy sai.

```markdown
❌ SAI:
# Instructions
1. Đọc file → Nếu không có file → ... (im lặng bỏ qua)

✅ ĐÚNG:
# Instructions
1. Đọc file
   - Nếu file không tồn tại → Báo user: "Không tìm thấy file [X]. 
     Anh/chị kiểm tra lại đường dẫn?"
   - Nếu file rỗng → Báo user: "File [X] trống. Cần có dữ liệu để xử lý."
   - Nếu sai encoding → Thử UTF-8 → CP1258 → Báo lỗi nếu vẫn fail
```

**Quy tắc:** Mọi bước PHẢI có error handling. Fail loud, không fail silent.

---

## Anti-Pattern 15: 🧊 The Frozen Skill

**Lỗi:** Tạo skill xong rồi không bao giờ cập nhật.

```markdown
❌ SAI:
# Skill tạo tháng 1/2026
# Tháng 6/2026: Tool đã update API, skill vẫn dùng API cũ → Fail

✅ ĐÚNG:
# SKILL.md header
# Version: 2.1.0
# Last updated: 2026-06-15
# Changelog:
# - v2.1: Cập nhật deployment API mới
# - v2.0: Thêm rollback support  
# - v1.0: Initial release
```

**Quy tắc:** Review skill mỗi quý. Thêm version + changelog trong SKILL.md.

---

## 📊 Bảng tổng hợp

| # | Anti-Pattern | Mức nguy hiểm | Cách phát hiện |
|---|---|---|---|
| 1 | Octopus | 🔴 | Description có >2 "và" |
| 2 | Ghost Description | 🔴 | Description <30 ký tự |
| 3 | Air Instructions | 🔴 | Steps không có hành động cụ thể |
| 4 | No Examples | 🟡 | Thiếu section Examples |
| 5 | Open Gate | 🟡 | Thiếu Constraints |
| 6 | Novel | 🟡 | SKILL.md >500 dòng |
| 7 | Jargon Bot | 🟡 | Thuật ngữ khó hiểu |
| 8 | Circus Trigger | 🟡 | Description quá rộng |
| 9 | Scaffolding Only | 🟡 | Folders rỗng |
| 10 | Crystal Ball | 🟠 | Giả định không hỏi |
| 11 | YOLO Deployer | 🔴 | Thiếu safety check cho production |
| 12 | Copy-Paste Goal | 🟢 | Goal = Description |
| 13 | Feature Creep | 🟠 | SKILL.md ngày càng phình |
| 14 | Silent Failure | 🔴 | Thiếu error handling |
| 15 | Frozen Skill | 🟠 | Không có version/changelog |
