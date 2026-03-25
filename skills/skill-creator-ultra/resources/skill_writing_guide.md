# ✍️ Skill Writing Guide — Từ Kiến Trúc Sư AI Hàng Đầu

> Tổng hợp insights từ Anthropic's Skill System, OpenAI's GPTs Architecture,
> Google DeepMind's Agent Design, và kinh nghiệm xây dựng hàng trăm production skills.
>
> "Skill tốt không phải skill viết hay — mà là skill hoạt động đúng 100 lần liên tiếp."

---

## Nền tảng: 3 Lớp Nhận Thức của AI Agent

AI Agent không đọc skill như người đọc sách. Nó đọc theo **3 lớp**, mỗi lớp
có ngưỡng quyết định riêng. Nếu bạn không tối ưu đúng lớp — skill của bạn
sẽ thất bại trước khi nó kịp chạy.

```
┌─────────────────────────────────────────────────┐
│ LỚP 1: METADATA (~100 tokens)                  │
│ AI đọc: name + description                     │
│ Quyết định: "Có DÙNG skill này không?"          │
│ Nếu fail ở đây → Skill KHÔNG BAO GIỜ được gọi  │
├─────────────────────────────────────────────────┤
│ LỚP 2: BODY (~2000 tokens)                     │
│ AI đọc: Goal + Instructions + Examples          │
│ Quyết định: "LÀM như thế nào?"                  │
│ Nếu fail ở đây → Output sai format, thiếu logic │
├─────────────────────────────────────────────────┤
│ LỚP 3: RESOURCES (unlimited)                   │
│ AI đọc: files trong resources/, examples/       │
│ Quyết định: "Chi tiết CỤ THỂ là gì?"           │
│ Chỉ đọc khi cần — KHÔNG đọc mặc định           │
└─────────────────────────────────────────────────┘
```

**Hệ quả thiết kế:**
- Lớp 1 phải **aggressive** — overfit trigger tốt hơn under-trigger
- Lớp 2 phải **self-contained** — AI chạy được MÀ KHÔNG đọc Lớp 3
- Lớp 3 là **reference** — chỉ cần khi edge case hoặc chi tiết domain

→ **Quy tắc 500**: SKILL.md < 500 dòng. Vượt → tách ra resources/.
→ **Quy tắc 80/20**: 80% use cases phải chạy đúng chỉ với Lớp 2.

---

## 10 Kỹ Thuật Viết — Đặt Tên Theo Nguyên Lý

### 🎯 Pattern 1: The Sniper — Imperative Precision

**Nguyên lý:** Mỗi câu instruction phải là MỘT lệnh rõ ràng mà AI execute
không cần suy nghĩ. Giống sniper — 1 viên, 1 mục tiêu.

```markdown
❌ SAI — The Shotgun (bắn tản mát):
# Instructions
1. Khi user cung cấp file, file nên được phân tích kỹ lưỡng 
   trước khi tiến hành các bước xử lý tiếp theo
2. Sau khi phân tích xong, cần đảm bảo kết quả phù hợp

✅ ĐÚNG — The Sniper (bắn chính xác):
# Instructions
1. Đọc file user cung cấp → Xác định: encoding, separator, số dòng
2. Parse header (dòng 1) → Tạo danh sách tên cột
3. Với MỖI dòng dữ liệu: map giá trị → cột tương ứng
4. Validate: đếm cột mỗi dòng = đếm header? 
   - Nếu khác → log warning + skip dòng đó
```

**Tại sao hoạt động:** AI models là instruction followers, không phải mind readers.
Câu "phân tích kỹ lưỡng" có thể hiểu 50 cách khác nhau. "Xác định encoding,
separator, số dòng" chỉ có 1 cách hiểu.

**Test:** Đưa 1 instruction cho 3 người khác nhau. Nếu cả 3 hiểu GIỐNG nhau → đủ tốt.

---

### 🧬 Pattern 2: The DNA — Explain The Why

**Nguyên lý:** AI follow rules tốt hơn ~30% khi hiểu LÝ DO đằng sau rule
(data từ Anthropic's internal testing). Như DNA — mã nguồn quyết định hành vi.

```markdown
❌ SAI — Blind Commands (lệnh mù):
- TUYỆT ĐỐI KHÔNG viết quá 400 từ
- LUÔN LUÔN ghi ngày tháng
- KHÔNG ĐƯỢC bỏ phần "Vướng mắc"

✅ ĐÚNG — DNA Rules (lệnh có mã nguồn):
- Giữ dưới 400 từ — sếp đọc trên điện thoại lúc di chuyển,
  quá dài sẽ bị skip hoặc đọc lướt mất thông tin quan trọng
- Luôn ghi ngày tháng cụ thể (VD: "24/02-28/02") — để dễ trace
  khi review performance sau 3 tháng, không nhầm tuần nào với tuần nào
- Luôn có phần "Vướng mắc" dù không có gì — vì sếp SẼ HỎI nếu thiếu,
  ghi "Không có" thể hiện bạn đã cân nhắc chứ không phải quên
```

**Ngoại lệ duy nhất — dùng CAPS LOCK khi:**
Hậu quả **KHÔNG thể undo** + ảnh hưởng security/data:
- 🚫 TUYỆT ĐỐI KHÔNG hardcode API keys vào source code
- 🚫 TUYỆT ĐỐI KHÔNG chạy `rm -rf` hoặc `DROP TABLE` mà không confirm

**Insight từ production:** Khi AI hiểu WHY "dưới 400 từ" (sếp đọc trên điện thoại),
nó tự biết cắt phần nào — ưu tiên giữ action items, cắt background. Khi chỉ 
nói "dưới 400 từ" — nó cắt ngẫu nhiên, có thể mất thông tin quan trọng.

---

### 🪞 Pattern 3: The Mirror — Show Don't Tell

**Nguyên lý:** AI là pattern matcher. Cho xem 1 ví dụ hoàn hảo hiệu quả 
hơn 50 dòng quy tắc. Như tấm gương — AI soi vào và phản chiếu.

```markdown
❌ SAI — Dạy lý thuyết:
# Instructions
Viết commit message theo Conventional Commits standard.
Message phải có type, optional scope, và description.
Type gồm feat, fix, docs, style, refactor, test, chore.
Description viết ở imperative mood, không capitalize, không dấu chấm cuối.

✅ ĐÚNG — Cho xem mẫu:
# Examples
## Input:
git diff: Thêm hàm validateEmail() vào utils/validators.ts

## Output:
feat(validators): add email validation function

Supports RFC 5322 format with unicode domain names.
Includes unit tests for edge cases (empty, no @, multiple @).

## Input:  
git diff: Sửa lỗi crash khi user không nhập password

## Output:
fix(auth): handle empty password input gracefully

Previously threw NullPointerException. Now shows inline
error message "Password is required" without page reload.
```

**Data thực nghiệm:**

| Approach | AI Follow Accuracy |
|---|---|
| Rules only (text mô tả) | ~60% |
| Rules + 1 example | ~75% |
| Rules + 2 diverse examples | ~90% |
| Rules + 2 examples + constraints | ~95% |

**Chọn ví dụ thế nào? — Nguyên tắc 3C:**
1. **Contrasting**: 2 ví dụ phải KHÁC NHAU rõ (happy path vs edge case)
2. **Complete**: Input VÀ Output đều đầy đủ, không placeholder
3. **Contextual**: Có backstory — TẠI SAO user cần làm việc này

📚 **Chi tiết:** `resources/prompt_engineering.md` (Nguyên tắc #3)

---

### 🏗️ Pattern 4: The Blueprint — Domain Organization

**Nguyên lý:** Khi skill hỗ trợ nhiều biến thể, tách domain knowledge ra
từng file riêng. AI chỉ đọc file cần thiết → tiết kiệm context, tăng accuracy.

```markdown
❌ SAI — The Monolith (1 file khổng lồ):
SKILL.md (800 dòng):
  → Report template loại A (200 dòng)
  → Report template loại B (200 dòng)  
  → Report template loại C (200 dòng)
  → Logic chọn template (200 dòng)
# AI phải đọc 800 dòng dù chỉ cần 1 template

✅ ĐÚNG — The Blueprint (bản vẽ module):
skills/report-writer/
├── SKILL.md              ← 150 dòng: workflow + selection logic
│   "IF weekly → đọc resources/weekly_template.md"
│   "IF monthly → đọc resources/monthly_template.md"
│   "IF incident → đọc resources/incident_template.md"
└── resources/
    ├── weekly_template.md   ← 100 dòng
    ├── monthly_template.md  ← 150 dòng
    └── incident_template.md ← 80 dòng
# AI chỉ đọc 150 + 100 = 250 dòng cho weekly report
```

**Khi nào tách — Quy tắc 50/3:**
- Variant > 50 dòng → tách file
- \> 3 variants → chắc chắn tách
- Variant có logic riêng biệt → tách luôn dù ngắn

---

### 🛡️ Pattern 5: The Safety Net — Error Recovery

**Nguyên lý:** AI SẼ gặp lỗi. Skill production phải có plan B cho MỌI bước
quan trọng. Không có safety net = Anti-Pattern #14 (Silent Failure).

```markdown
❌ SAI — The Tightrope (đi dây không lưới):
# Instructions
1. Đọc PDF file
2. Trích xuất data từ tables
3. Format output JSON

# Nếu PDF không đọc được? → AI đứng im hoặc hallucinate
# Nếu table format lạ? → AI đoán bừa
# Nếu output sai schema? → User nhận data rác

✅ ĐÚNG — The Safety Net (có lưới hứng):
# Instructions
1. Đọc PDF file
   - Nếu PDF encrypted → Hỏi user: "File có mật khẩu. Anh nhập password?"
   - Nếu PDF corrupted → Báo: "File lỗi, anh gửi lại file khác?"
2. Trích xuất data từ tables
   - Nếu OCR thất bại → Thử: (a) tăng resolution, (b) preprocess contrast
   - Nếu vẫn fail → Hỏi: "Em không đọc được bảng này. Anh paste text thủ công?"
   - Nếu table format lạ → Show user sample + hỏi: "Format này đúng không?"
3. Format output JSON
   - Validate schema trước khi trả
   - Nếu thiếu field bắt buộc → Ghi null + warning: "Thiếu [field], em để null"
   - Đếm records input = output? Nếu khác → Báo: "⚠️ Input 50 dòng → Output 48. 2 dòng lỗi"
```

**Nguyên tắc 3 tầng recovery:**

| Tầng | Khi nào | Hành động |
|---|---|---|
| **Auto-fix** | Lỗi nhỏ, biết cách sửa | Sửa tự động + báo user |
| **Ask user** | Lỗi mơ hồ, nhiều hướng xử lý | Đề xuất options + hỏi |
| **Bail out** | Lỗi nghiêm trọng, không thể tiếp | Dừng + giải thích + gợi ý thủ công |

---

### 🎚️ Pattern 6: The Dial — Confidence Scoring

**Nguyên lý:** AI thường "tự tin sai" (hallucination). Buộc nó tự chấm confidence
trước khi act → user biết khi nào cần can thiệp. Như núm điều chỉnh âm lượng — 
tùy mức tự tin mà hành động khác nhau.

```markdown
❌ SAI — The Overconfident (quá tự tin):
# Instructions
3. Xác định loại bug → Đề xuất fix

# AI luôn đề xuất fix, kể cả khi chỉ 20% chắc chắn
# User blindly apply fix → production crash

✅ ĐÚNG — The Dial (có scale):
# Instructions
3. Xác định loại bug + self-rate confidence:
   
   IF confidence ≥ 85%:
     → Fix tự động + giải thích: "Em chắc 92% đây là null pointer. 
       Em đã thêm null check. Review code phía dưới."
   
   IF confidence 50-84%:
     → Đề xuất + hỏi confirm: "Em nghĩ đây là race condition (67%). 
       Có 2 cách fix: (A) mutex lock, (B) async queue. Anh chọn?"
   
   IF confidence < 50%:
     → Liệt kê khả năng + nhờ user: "Em thấy 3 khả năng:
       1. Memory leak (35%)
       2. Deadlock (30%)  
       3. Logic error (25%)
       Anh check thêm logs giúp em?"
```

**Tại sao chưa ai làm tốt điều này:**
Anthropic và OpenAI đều khuyên "be transparent about uncertainty",
nhưng KHÔNG có tool nào encode confidence thresholds trực tiếp vào skill.
Đây là advantage của skill-creator-ultra.

---

### 🔬 Pattern 7: The Microscope — Semantic Verbs

**Nguyên lý:** AI phân biệt được "Generate" vs "Validate" vs "Transform" 
rất tốt. Nhưng "Xử lý" và "Kiểm tra"? Nó hiểu 10 cách khác nhau.
Như kính hiển vi — zoom vào đúng hành động.

```markdown
❌ SAI — Blurry Verbs (động từ mờ):
1. Xử lý dữ liệu đầu vào
2. Kiểm tra kết quả
3. Tối ưu output
4. Phân tích file

✅ ĐÚNG — Microscope Verbs (động từ sắc nét):
1. PARSE input CSV → extract rows as dictionaries
2. VALIDATE each row against schema → flag invalid fields
3. COMPRESS output JSON → remove whitespace, minify
4. DECOMPOSE PDF → extract text layer + image layer separately
```

**Bảng chuyển đổi — dán cạnh bàn phím:**

| ❌ Mờ | ✅ Chính xác (chọn theo ngữ cảnh) |
|---|---|
| "Xử lý" | **Generate** / Parse / Transform / Normalize / Sanitize |
| "Kiểm tra" | **Validate** / Assert / Compare / Scan / Verify / Lint |
| "Tối ưu" | **Minimize** / Compress / Cache / Deduplicate / Refactor |
| "Phân tích" | **Decompose** / Measure / Profile / Audit / Classify |
| "Cập nhật" | **Overwrite** / Append / Patch / Increment / Sync |
| "Gửi" | **POST** / Emit / Publish / Forward / Broadcast |

📚 **Chi tiết bảng mở rộng:** `resources/prompt_engineering.md` (Nguyên tắc #5)

---

### 🌳 Pattern 8: The Decision Tree — Explicit Branching

**Nguyên lý:** Khi có nhiều nhánh logic, viết IF/ELSE tường minh. 
AI rất giỏi follow decision trees — nhưng rất tệ khi tự xây tree.
Skill architect phải xây tree sẵn.

```markdown
❌ SAI — The Fog (sương mù):
# Instructions
2. Xử lý file phù hợp theo format

# AI tự quyết định "phù hợp" nghĩa là gì → mỗi lần khác nhau

✅ ĐÚNG — The Decision Tree (cây rõ ràng):
# Instructions
2. Xác định format → chọn pipeline:

   ┌── .csv  → run parse_csv(delimiter=auto_detect)
   ├── .json → run validate_json_schema(strict=true)
   ├── .xlsx → run extract_sheets() → hỏi user chọn sheet
   ├── .pdf  → IF has_text_layer → extract_text()
   │           ELSE → OCR_first() THEN extract_text()
   ├── .xml  → run parse_xml(namespace_aware=true)
   └── ELSE  → Hỏi user: "File này format gì? Em hỗ trợ: CSV, JSON, XLSX, PDF, XML"
```

**Nguyên tắc MECE:** Mỗi nhánh phải:
- **M**utually **E**xclusive: Không overlap (file không thể vừa .csv vừa .json)
- **C**ollectively **E**xhaustive: Cover mọi case (có ELSE cho unexpected)

---

### 📐 Pattern 9: The Contract — Output Specification

**Nguyên lý:** Nếu bạn không define output format → AI tự chọn → mỗi lần khác.
Skill production cần output consistent 100%. Như hợp đồng — hai bên đồng ý format.

```markdown
❌ SAI — The Surprise (output bất ngờ):
# Instructions
5. Trả kết quả phân tích cho user

# Lần 1: trả bullet list
# Lần 2: trả paragraphs
# Lần 3: trả table
# User confused, không parse được programmatically

✅ ĐÚNG — The Contract (output hợp đồng):
# Instructions  
5. Output BẮT BUỘC theo format sau — KHÔNG được thay đổi structure:

   ## 📊 Analysis Report
   **File:** [tên file]  |  **Records:** [số dòng]  |  **Date:** [ngày]
   
   ### Findings
   | # | Issue | Severity | Line | Suggestion |
   |---|-------|----------|------|------------|
   | 1 | [mô tả] | 🔴/🟡/🟢 | [số] | [cách fix] |
   
   ### Summary
   - Total issues: [N]
   - Critical (🔴): [n1]  |  Warning (🟡): [n2]  |  Info (🟢): [n3]
   
   ### Next Steps
   - [ ] [action item 1]
   - [ ] [action item 2]
   
   ⚠️ KHÔNG được thêm section khác.
   ⚠️ KHÔNG được bỏ section nào dù không có data (ghi "None" nếu trống).
   ⚠️ Table PHẢI có header row.
```

**Tại sao quan trọng:** Output consistent = user có thể:
1. Regex/parse output tự động
2. Build workflow chain (output skill A → input skill B)
3. Tin tưởng format → đỡ phải review toàn bộ

---

### 📆 Pattern 10: The Changelog — Versioning & Evolution

**Nguyên lý:** Skill là living document. Production skill không có version =
ticking time bomb. API thay đổi, requirements thay đổi, AI model thay đổi.

```markdown
❌ SAI — The Fossil (hóa thạch):
# Skill tạo tháng 1/2026
# Tháng 6/2026: Tool đã update API v3 → skill vẫn gọi API v2 → 404 errors
# Tháng 9/2026: AI model mới hiểu instructions khác → output sai
# Không ai biết lần cuối skill được review là khi nào

✅ ĐÚNG — The Changelog (có lịch sử):
---
name: invoice-processor
description: |
  ...
---
<!-- Version: 2.3.1 -->
<!-- Last reviewed: 2026-03-01 -->
<!-- Changelog:
  v2.3.1 (2026-03-01) - Fix: handle new VNPay API response format
  v2.3.0 (2026-02-15) - Feature: thêm support MoMo payment
  v2.2.0 (2026-01-20) - Feature: export CSV ngoài JSON
  v2.1.0 (2025-12-01) - Fix: encoding CP1258 cho tên tiếng Việt
  v2.0.0 (2025-10-15) - BREAKING: đổi output format sang table
  v1.0.0 (2025-09-01) - Initial release
-->
```

**SemVer cho Skill — Khi nào tăng version gì:**

| Change | Version | Ví dụ |
|---|---|---|
| **BREAKING** — Output format thay đổi | Major (v2→v3) | Đổi JSON → table |
| **Feature** — Thêm khả năng mới | Minor (v2.0→v2.1) | Thêm export CSV |
| **Fix** — Sửa lỗi, adjust wording | Patch (v2.1.0→v2.1.1) | Fix encoding bug |

**Review cycle:** Mỗi 3 tháng → đọc lại skill → chạy Phase 6 eval lại.
Xem Anti-Pattern #15 (The Frozen Skill) để hiểu rủi ro.

---

## Atomic Logic — 1 Skill = 1 Việc Hoàn Hảo

Nguyên tắc số 1 từ mọi AI lab: **Single Responsibility**.
Giống function trong code — 1 function = 1 nhiệm vụ.

**3 dấu hiệu skill cần tách:**
1. Tên có "and" → `"review AND deploy code"` → tách thành 2
2. Description cần > 3 dòng → quá phức tạp
3. User dùng skill cho 2 mục đích khác nhau → 2 skills

```markdown
❌ The Octopus (ôm đồm):
  "code-assistant" → review + deploy + test + format + PR + branch
  SKILL.md: 700 dòng, 15 nhánh IF/ELSE

✅ The Specialist (chuyên sâu):
  "code-reviewer"       → 120 dòng, 1 việc, trigger chính xác
  "app-deployer"        → 150 dòng, 1 việc, safety checks
  "test-writer"         → 100 dòng, 1 việc, framework-aware
  "commit-formatter"    → 80 dòng, 1 việc, conventional commits
  Mỗi skill "sắc" hơn vì tập trung 100% vào 1 nhiệm vụ.
```

---

## Repeated Work Detection — Tối Ưu Execution

Đọc lại transcripts sau test runs. Tìm pattern:

**Checklist phát hiện repeated work:**
- [ ] Có đoạn code > 10 dòng AI viết lại giống nhau giữa 2+ runs?
- [ ] AI luôn Google/search cùng 1 thông tin mỗi lần chạy?
- [ ] Có validation phức tạp mà AI phải tự viết lại mỗi lần?
- [ ] AI mất > 30 giây xây dựng lại context mà lần trước đã có?

→ **Nếu YES:** Bundle vào `scripts/` hoặc `resources/`.
Giảm execution time, tăng consistency, giảm token cost.

---

## Safety Architecture — 3 Tầng Bảo Vệ

Không phải afterthought. Safety là **foundation layer** — xây trước, không phải sau.

| Tầng | Bảo vệ gì | Ví dụ | Check |
|---|---|---|---|
| **L1: Data** | Không leak thông tin nhạy cảm | API keys, passwords, PII | Pattern scan output |
| **L2: Action** | Không destructive commands | `rm -rf`, `DROP TABLE`, `format disk` | Require confirm |
| **L3: Scope** | Không vượt ranh giới skill | Skill format code KHÔNG deploy | Scope boundary check |

**Nguyên tắc Lack of Surprise (từ Anthropic):**
Skill không được chứa hành vi mà user sẽ "bất ngờ" nếu được mô tả.
Nếu bạn cần giấu behavior trong description → behavior đó có vấn đề.

---

## 📋 Master Checklist — Trước Khi Deploy

### Metadata (Lớp 1)
- [ ] `name` kebab-case, ≤ 30 ký tự, mô tả 1-2 từ
- [ ] `description` ≥ 50 ký tự, "pushy" (📚 `resources/description_optimization.md`)
- [ ] Có ≥ 3 trigger phrases + ≥ 1 anti-trigger
- [ ] Cover cả formal + casual language ("viết báo cáo" + "report đi sếp")

### Goal
- [ ] Đúng 1 câu, trả lời "Skill tồn tại để làm gì?"
- [ ] Có metric đo lường ("trong 2 phút", "coverage ≥ 80%")
- [ ] Đọc xong không cần hỏi "rồi sao?"

### Instructions (Lớp 2)
- [ ] Mỗi step = 1 hành động CỤ THỂ (🎯 The Sniper)
- [ ] Dùng semantic verbs — không "xử lý", "kiểm tra" (🔬 The Microscope)
- [ ] Logic rẽ nhánh dùng IF/ELSE tường minh (🌳 The Decision Tree)
- [ ] Giải thích WHY cho rules quan trọng (🧬 The DNA)
- [ ] Có error recovery ≥ 3 tầng (🛡️ The Safety Net)
- [ ] Confidence scoring cho output mơ hồ (🎚️ The Dial)
- [ ] Có ≥ 1 VERIFY step cuối

### Examples
- [ ] ≥ 2 ví dụ theo nguyên tắc 3C: Contrasting, Complete, Contextual (🪞 The Mirror)
- [ ] Dữ liệu THẬT — không placeholder, không lorem ipsum
- [ ] Input VÀ Output đều đầy đủ

### Constraints
- [ ] ≥ 1 "KHÔNG ĐƯỢC" (nghĩ: "điều tệ nhất?" → cấm nó)
- [ ] CAPS LOCK chỉ cho security/safety rules
- [ ] Safety 3 tầng: Data + Action + Scope

### Meta
- [ ] SKILL.md < 500 dòng
- [ ] Có version number + changelog (📆 The Changelog)
- [ ] Output format contract rõ ràng (📐 The Contract)
- [ ] Complex logic → tách resources/ (🏗️ The Blueprint)
- [ ] Cross-ref resources/ khi cần chi tiết

---

## 📊 Bảng Tổng Hợp — 10 Patterns

| # | Pattern | Tên | Giải quyết gì | Phát hiện bằng |
|---|---|---|---|---|
| 1 | 🎯 The Sniper | Imperative Precision | Instructions mơ hồ | Step có thể hiểu 2 cách |
| 2 | 🧬 The DNA | Explain The Why | AI không follow rules | Rules thiếu lý do |
| 3 | 🪞 The Mirror | Show Don't Tell | Output sai format | Thiếu examples |
| 4 | 🏗️ The Blueprint | Domain Organization | SKILL.md quá dài | > 500 dòng, nhiều variants |
| 5 | 🛡️ The Safety Net | Error Recovery | AI crash khi gặp lỗi | Steps thiếu IF error |
| 6 | 🎚️ The Dial | Confidence Scoring | AI tự tin sai | Output mơ hồ, no scale |
| 7 | 🔬 The Microscope | Semantic Verbs | AI hiểu sai hành động | Dùng "xử lý", "kiểm tra" |
| 8 | 🌳 The Decision Tree | Explicit Branching | Output inconsistent | Nhiều nhánh, không IF/ELSE |
| 9 | 📐 The Contract | Output Specification | Mỗi lần output khác | Không define format |
| 10 | 📆 The Changelog | Versioning | Skill outdated | Không có version/date |

---

## 🔬 Case Study: Từ Ý Tưởng → Skill Production

**Bài toán thực tế:** Team 5 dev, mỗi thứ 6 phải gửi báo cáo tuần cho PM.
Mỗi người mất 20-30 phút viết. Muốn AI tự viết từ data Jira.

### Bước 1: User nói

> "Tạo skill viết weekly report từ Jira. Format markdown, gửi Slack."

### Bước 2: Apply 10 Patterns

| Vấn đề phát hiện | Pattern áp dụng | Hành động |
|---|---|---|
| "Viết weekly report" quá mơ hồ | 🎯 Sniper | Tách thành 6 steps cụ thể |
| Tại sao < 400 từ? Tại sao có "Vướng mắc"? | 🧬 DNA | Thêm WHY cho mỗi constraint |
| AI không biết format mong muốn | 🪞 Mirror | Thêm 2 examples (happy + thiếu data) |
| Jira API có thể fail | 🛡️ Safety Net | Thêm fallback: hỏi user nhập tay |
| "Gửi Slack" ngoài scope format | Atomic Logic | Tách thành 2 skills: writer + sender |
| Output mỗi lần khác nhau | 📐 Contract | Define exact format 4 sections |
| AI có thể đoán sai tasks | 🎚️ Dial | Confidence check trước khi submit |

### Bước 3: Skill hoàn chỉnh sau khi apply patterns

```markdown
---
name: weekly-report-writer
description: |
  Sinh báo cáo tuần chuyên nghiệp từ dữ liệu công việc. Dùng khi user
  nói "viết báo cáo tuần", "weekly report", "gửi update cho sếp",
  "tóm tắt công việc tuần này", kể cả "report đi sếp ơi".
  KHÔNG dùng cho: viết email, tạo slide, phân tích data.
---

# Goal
Sinh báo cáo tuần 4 phần trong 2 phút, consistent 100% across team members.

# Instructions
1. Hỏi user: "Tuần này em làm được gì? Đang dở gì? Có vướng gì không?"
   - Nếu user paste Jira link → đọc trực tiếp
   - Nếu user nói tóm tắt → extract từ text
   - Nếu user nói "không biết" → hỏi 3 câu gợi ý:
     "Mở Jira/Git lên, tuần này em commit bao nhiêu? PR nào merge?"
2. Parse → 4 phần BẮT BUỘC (thứ tự không đổi):
   - ✅ Đã hoàn thành (quantify: "5 tasks", "3 PRs")
   - 🔄 Đang thực hiện (progress: "70% xong", "chờ review")
   - ⚠️ Vướng mắc (nếu không có → ghi "Không có" — sếp SẼ HỎI nếu thiếu)
   - 📋 Kế hoạch tuần tới (≤ 3 items, actionable)
3. Format markdown table — giữ dưới 400 từ
   (sếp đọc trên điện thoại lúc di chuyển, quá dài skip)
4. Verify: đếm 4 sections? Dưới 400 từ? Có số liệu cụ thể?
   IF confidence < 70%: "Em chưa chắc phần vướng mắc. Anh confirm giúp?"

# Examples
## Ví dụ 1: Happy path
**Input:** "tuần này push 3 PRs merge hết, đang review VNPay, không vướng gì"
**Output:**
| Mục | Chi tiết |
|-----|---------|
| ✅ Đã hoàn thành | Push 3 PRs → tất cả đã merged |
| 🔄 Đang thực hiện | Review tích hợp VNPay (60%) |
| ⚠️ Vướng mắc | Không có |
| 📋 Tuần tới | Hoàn thành VNPay integration |

## Ví dụ 2: Edge case — user nói ít
**Input:** "tuần này bận quá không nhớ làm gì"
**Output (AI hỏi lại):**
"Không sao anh. Để em gợi ý nhé:
1. Mở Git → tuần này anh commit bao nhiêu lần?
2. Mở Jira → có task nào chuyển Done không?
3. Có meeting hay discussion nào quan trọng không?"

# Constraints
- 🚫 KHÔNG quá 400 từ (WHY: sếp đọc điện thoại)
- 🚫 KHÔNG bỏ section "Vướng mắc" dù trống (WHY: sếp hỏi)
- ✅ LUÔN có số liệu cụ thể (3 PRs, 5 tasks, 70%)
- ✅ LUÔN đủ 4 sections theo đúng thứ tự
- ⚠️ Nếu user chỉ nói 1-2 câu → hỏi lại, KHÔNG tự bịa
```

**Kết quả:** 5 dev dùng → báo cáo consistent, mỗi người tiết kiệm 25 phút/tuần = 
**10+ giờ/tháng cho team.** PM happy vì format luôn giống nhau, dễ scan.

---

📚 **Cross-references:**
- `resources/prompt_engineering.md` — 16 nguyên tắc viết instructions
- `resources/anti_patterns.md` — 15 lỗi phổ biến cần tránh  
- `resources/skill_template.md` — Template chuẩn cho SKILL.md
- `resources/description_optimization.md` — Tối ưu trigger accuracy
