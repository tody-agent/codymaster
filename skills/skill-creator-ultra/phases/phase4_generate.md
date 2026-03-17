## Phase 4: 🏗️ Skill Scaffolding — Sinh toàn bộ Skill

Mục tiêu: Tạo ra tất cả file cần thiết, sẵn sàng deploy.

### 4.0. Hỏi Nền tảng — QUAN TRỌNG (ảnh hưởng format output)

> "Anh/chị đang dùng AI trên **nền tảng nào**?"
>
> - A) **Antigravity** (Google Gemini) — ⭐ Recommended
> - B) **OpenClaw / ClawBot** (Telegram Bot)
> - C) **Cursor** (VS Code)
> - D) **Claude Code** (Anthropic)
> - E) **Windsurf / Cline / Copilot**
> - F) Không biết / Muốn dùng đa nền tảng

**Bảng format output theo nền tảng:**

| Nền tảng | Đọc multi-file? | Format output | Ghi chú |
| --- | --- | --- | --- |
| **Antigravity** | ✅ Đọc thoải mái | Multi-file package (SKILL.md + resources/ + examples/) | Tạo full structure |
| **OpenClaw** | ❌ Chỉ System Prompt | **Single-file** — ALL-IN-ONE SKILL.md (~tất cả inline) | Không tách resources/ |
| **Cursor** | ⚠️ Hạn chế | Single rule file `.cursor/rules/<name>.mdc` + SKILL.md nhúng | Cần bridge file |
| **Claude Code** | ✅ Đọc được | Multi-file qua `.claude/commands/` | Đổi tên → CLAUDE.md |
| **Windsurf** | ⚠️ Hạn chế | Single rule file `.windsurf/rules/<name>.md` | Giống Cursor |
| **Cline** | ❌ System Prompt | Single-file paste vào Custom Instructions | Giống OpenClaw |
| **Copilot** | ⚠️ Hạn chế | `.github/<name>.md` | Instructions only |
| **Đa nền tảng** | — | Tạo multi-file (Antigravity) + export single-file | Dùng `skill_export.py` |

**Quy tắc xử lý theo nền tảng:**

**Nếu Antigravity / Claude Code:**

1. Tạo full multi-file package (SKILL.md + resources/ + examples/ + scripts/ + workflows/)
2. Resources được tách file riêng, SKILL.md chỉ reference: `📚 Tham khảo resources/<file>.md`

**Nếu OpenClaw / Cline (single-file):**

1. Tạo 1 file SKILL.md duy nhất chứa TẤT CẢ:
   - Goal + Instructions + Examples + Constraints → inline
   - Resources → nhúng trực tiếp vào cuối SKILL.md (dưới section `# Reference Data`)
   - Examples → inline, KHÔNG tách file
2. KHÔNG tạo thư mục resources/, examples/
3. KHÔNG reference file bên ngoài (vì nền tảng không đọc được)
4. Giữ < 4000 tokens nếu có thể (OpenClaw có giới hạn)

**Nếu Cursor / Windsurf:**

1. Tạo multi-file package NHƯNG thêm bridge file:
   - Cursor: `.cursor/rules/<name>.mdc`
   - Windsurf: `.windsurf/rules/<name>.md`
2. Bridge file chỉ cần: description + reference tới SKILL.md

**Nếu "đa nền tảng":**

1. Tạo full multi-file (cho Antigravity)
2. Sau khi xong, tự động chạy: `python scripts/skill_export.py <path> --platform all`
3. Hoặc hỏi user muốn export nền tảng nào cụ thể

---

### 4.1. Hỏi Scope trước khi tạo file

> "Skill này anh/chị muốn dùng cho **tất cả dự án** hay chỉ **dự án hiện tại**?"
>
> - A) Tất cả dự án → Global: `~/.gemini/antigravity/skills/`
> - B) Chỉ dự án này → Workspace: `.agent/skills/`

⚠️ **Lưu ý:** Câu hỏi scope chỉ áp dụng cho Antigravity/Claude Code. Với OpenClaw/Cline → skip (vì paste vào System Prompt, không có khái niệm scope).

### 4.2. Tạo cấu trúc thư mục

Dựa vào Complexity Score ở Phase 3, tạo cấu trúc phù hợp:

**🟢 Đơn giản (1-5 điểm):**

```
skills/<tên-skill>/
└── SKILL.md
```

**🟡 Trung bình (6-12 điểm):**

```
skills/<tên-skill>/
├── SKILL.md
└── examples/
    ├── example_1.md
    └── example_2.md
```

**🟠 Phức tạp (13-20 điểm):**

```
skills/<tên-skill>/
├── SKILL.md
├── resources/
│   ├── template.md
│   └── reference.md
└── examples/
    ├── example_1.md
    └── example_2.md
```

**🔴 Rất phức tạp (21+ điểm):**

```
skills/<tên-skill>/
├── SKILL.md
├── scripts/
│   └── main.py
├── resources/
│   ├── templates/
│   ├── strategies/
│   └── dangerous_patterns.md
└── examples/
    ├── example_1.md
    ├── example_2.md
    └── example_3.md
```

### 4.3. Sinh nội dung SKILL.md — Hướng dẫn chi tiết từng section

Sử dụng template từ `resources/skill_template.md`. Tham khảo `resources/prompt_engineering.md`
để viết Instructions chất lượng cao.

📚 **Best Practices viết skill:** Đọc `resources/skill_writing_guide.md` trước khi bắt đầu.
Key points: Progressive Disclosure (giữ SKILL.md < 500 dòng), 10 Writing Patterns,
Master Checklist 20+ items, và Versioning Guide.

**📸 Ví dụ kết quả Phase 4 thực tế:**

Sau khi chạy Phase 1-3 cho yêu cầu "tạo skill format commit message", Phase 4 sinh ra:

```
skills/commit-formatter/           ← 🟢 Đơn giản (Score: 4)
└── SKILL.md                       ← 85 dòng

Nội dung SKILL.md:
┌─────────────────────────────────────────────────────────┐
│ name: commit-formatter                                  │
│ description: Format commit message theo Conventional    │
│   Commits. Dùng khi user nói "format commit",           │
│   "viết commit message", "conventional commit".         │
│─────────────────────────────────────────────────────────│
│ # Goal                                                  │
│ Sinh commit message chuẩn Conventional Commits trong    │
│ 5 giây, consistent 100% across team.                    │
│─────────────────────────────────────────────────────────│
│ # Instructions                                          │
│ 1. Đọc git diff hoặc mô tả user                        │
│ 2. Xác định type: feat|fix|docs|style|refactor|test     │
│ 3. Xác định scope từ files changed                      │
│ 4. Viết subject ≤50 chars, body nếu cần                 │
│─────────────────────────────────────────────────────────│
│ # Examples (2 ví dụ: happy + edge case)                 │
│─────────────────────────────────────────────────────────│
│ # Constraints                                           │
│ - 🚫 Subject > 50 chars                                 │
│ - 🚫 Type không thuộc danh sách chuẩn                   │
│ - ✅ Luôn lowercase                                      │
└─────────────────────────────────────────────────────────┘
```

📚 **Xem thêm ví dụ đầy đủ:** `examples/example_git_commit.md` (simple), 
`examples/example_api_docs.md` (medium), `examples/example_db_migration.md` (complex)

#### 4.3.1. YAML Frontmatter — Phần QUAN TRỌNG NHẤT

Đây là phần AI đọc ĐẦU TIÊN để quyết định có dùng skill hay không.

```yaml
---
name: <tên-skill>           # kebab-case, ≤30 ký tự, chỉ a-z và dấu gạch ngang
description: |               # DẤU | cho phép viết nhiều dòng
  <Dòng 1: Hành động chính + đối tượng + phương pháp>
  <Dòng 2: Chi tiết bổ sung hoặc phạm vi áp dụng>
  <Dòng 3: Kích hoạt khi user nói "...", "...", "...">
---
```

**Checklist description tốt:**

- [ ] Trả lời: "Skill này LÀM GÌ?" (hành động chính)
- [ ] Trả lời: "Cho AI?" (đối tượng/context)
- [ ] Trả lời: "Khi nào dùng?" (trigger phrases — ít nhất 3 câu)
- [ ] ≥30 ký tự, nên 50-150 ký tự
- [ ] Không dùng thuật ngữ mà chỉ dev hiểu

#### 4.3.2. # Goal — Đúng 1 câu duy nhất

**Công thức:** `[Động từ] + [kết quả cụ thể] + [để đạt được lợi ích gì]`

| ❌ Goal xấu | ✅ Goal tốt |
|---|---|
| "Giúp viết báo cáo" | "Sinh báo cáo tuần chuyên nghiệp trong 2 phút thay vì 30 phút" |
| "Xử lý dữ liệu" | "Chuyển đổi file CSV thành JSON/SQL không mất dòng nào" |
| "Review code" | "Phát hiện bugs, security holes, và code smells trước khi merge" |

**Test:** Nếu đọc Goal mà vẫn hỏi "rồi sao?", "cụ thể hơn?" → chưa đủ tốt.

#### 4.3.3. # Instructions — Chuỗi bước actionable

**Quy tắc viết Instructions chất lượng cao:**

1. **Mỗi bước = 1 hành động CỤ THỂ** (tham khảo Nguyên tắc #1 trong `prompt_engineering.md`)

   ```markdown
   ❌ "Phân tích yêu cầu"
   ❌ "Xử lý dữ liệu"
   ❌ "Kiểm tra kết quả"
   ✅ "Đọc nội dung user cung cấp → Xác định: loại file, encoding, số dòng"
   ```

2. **Semantic Precision — Dùng động từ CHÍNH XÁC:**

   | ❌ Mơ hồ (AI hiểu sai) | ✅ Chính xác (AI hiểu đúng) |
   | --- | --- |
   | "Xử lý" | **Phân tích** (Analyze) / **Chuyển đổi** (Transform) / **Lọc** (Filter) |
   | "Kiểm tra" | **Xác thực** (Validate) / **So sánh** (Compare) / **Đếm** (Count) |
   | "Tối ưu" | **Giảm kích thước xuống <500KB** / **Tăng tốc load <2s** |
   | "Làm" | **Tạo** (Generate) / **Thực thi** (Execute) / **Triển khai** (Deploy) |

3. **Đánh số tuần tự** — AI sẽ đi theo thứ tự

   ```markdown
   1. Bước đầu tiên
   2. Bước tiếp theo
      - Chi tiết con a
      - Chi tiết con b
   3. Bước cuối
   ```

4. **Logic rẽ nhánh viết TƯỜNG MINH** (tham khảo Nguyên tắc #7)

   ```markdown
   3. Kiểm tra format:
      - **Nếu** CSV → Parse bằng comma
      - **Nếu** JSON → Parse trực tiếp
      - **Nếu** không rõ → Hỏi user
   ```

5. **Thêm Verification Steps** (tham khảo Nguyên tắc #8)

   ```markdown
   5. ✅ VERIFY: Đếm records output = input? Nếu khác → có dòng bị mất.
   ```

6. **Thêm Error Recovery + Decision Tree** cho skill phức tạp:

   ```markdown
   2. Đọc file:
      - ⚠️ Nếu file không tồn tại → Báo user, hỏi lại đường dẫn
      - ⚠️ Nếu sai encoding → Thử UTF-8 → CP1258 → Báo lỗi
   
   ## 🌳 Decision Tree (cho bước xử lý kết quả):
   
   7. Đọc exit code / status:
      - IF `exit code = 0` + output có data:
        → Parse kết quả → Hiển thị cho user
      - IF `exit code = 0` + output trống:
        → Cảnh báo: "Script chạy thành công nhưng không có kết quả"
        → Hỏi user: "Input có chính xác không?"
      - IF `exit code ≠ 0`:
        → Đọc stderr → Phân loại lỗi
        → IF lỗi input → Gợi ý sửa + hỏi chạy lại
        → IF lỗi hệ thống → Báo user liên hệ admin
   ```

7. **Tự đánh giá Confidence** (cho skill review/phân tích):

   ```markdown
   8. Đánh giá Confidence Score:
      - 🟢 Cao (≥80%): Output đầy đủ, có dẫn chứng → Giao kết quả
      - 🟡 Trung bình (50-79%): Có phần không chắc → Đánh dấu ⚠️ + giao
      - 🔴 Thấp (<50%): Thiếu quá nhiều thông tin → HỎI LẠI user
   ```

8. **Tối đa 12 bước** — Nếu >12 → chia nhỏ thành sub-steps hoặc tách skill

#### 4.3.4. # Examples — "Show, Don't Tell" (2-3 ví dụ > 50 dòng quy tắc)

> **Nguyên tắc tối thượng:** AI là cỗ máy nhận diện mẫu (pattern-matching engine).
> 2-3 ví dụ hoàn hảo (Input → Output) mang lại hiệu quả cao HƠN NHIỀU so với
> 50 dòng quy tắc bằng text. Ví dụ = "DNA" của skill.

Lấy TRỰC TIẾP từ câu trả lời phỏng vấn (Phase 1). KHÔNG BỊA dữ liệu.

**Format ví dụ power (tham khảo `prompt_engineering.md` Nguyên tắc #3):**

```markdown
## Ví dụ 1: [Tên tình huống — Happy path]

**Context:** [Tại sao user cần làm việc này — 1 câu]

**Input:**
[Dữ liệu THẬT, CHÍNH XÁC, không placeholder. Copy từ câu trả lời user]

**Thought Process:** [OPTIONAL — giải thích AI nên nghĩ gì]
- Nhận thấy X → Áp dụng quy tắc Y
- Kiểm tra Z → Kết quả W

**Output:**
[Kết quả CHÍNH XÁC — đây là cái user sẽ thấy]

---
## Ví dụ 2: [Tên tình huống — Edge case / có vấn đề]
[Tương tự nhưng cho trường hợp bất thường — thiếu data, input lỗi, etc.]
```

**Chọn ví dụ đúng cách (3 góc độ):**

| Ví dụ | Vai trò | AI học được gì |
| --- | --- | --- |
| **Ví dụ 1: Happy Path** | Input đầy đủ, mọi thứ bình thường | Output format chuẩn, flow chính |
| **Ví dụ 2: Edge Case** | Thiếu thông tin, input lỗi, bất thường | Error handling, graceful degradation |
| **Ví dụ 3: Error Case** (nếu phức tạp) | Lỗi xảy ra, cần recovery | Cách phản ứng khi thất bại |

**Hiệu quả theo số lượng ví dụ:**

| Số ví dụ | Độ chính xác AI | Ghi chú |
| --- | --- | --- |
| 0 | 🔴 ~40% | AI đoán format, thường sai |
| 1 | 🟡 ~65% | Khá hơn nhưng dễ overfit |
| 2 | 🟢 ~85% | Đủ để hiểu pattern — KHUYẾN KHÍCH |
| 3 | 🟢 ~92% | Tối ưu cho hầu hết trường hợp |
| 5+ | 🟢 ~95% | Diminishing returns, tốn context |

#### 4.3.5. # Constraints — Rào chắn an toàn

Chuyển đổi từ quy tắc user nói → format skill:

| User nói | Constraint viết |
|---|---|
| "Không được xóa file gốc" | `🚫 KHÔNG ĐƯỢC xóa file input gốc dưới bất kỳ hình thức nào` |
| "Phải luôn backup" | `✅ LUÔN LUÔN tạo backup trước khi thao tác destructive` |
| "Chỉ gửi cho sếp" | `⚠️ Output CHỈ gửi qua kênh [X], KHÔNG chia sẻ nơi khác` |
| "Không quá 1 trang" | `🚫 KHÔNG ĐƯỢC viết quá [N] từ / [M] dòng` |

**Thêm constraints bảo mật tự động nếu skills xử lý:**

- Dữ liệu cá nhân → `KHÔNG ĐƯỢC log/print thông tin nhạy cảm`
- Production → `LUÔN LUÔN yêu cầu xác nhận trước thao tác`
- API keys → `KHÔNG ĐƯỢC hardcode secrets, dùng environment variables`

### 4.4. Sinh Skill Package Hoàn Chỉnh (QUAN TRỌNG)

⚠️ **TUYỆT ĐỐI KHÔNG chỉ tạo 1 file SKILL.md đơn lẻ!**
Mỗi skill phải là 1 **package độc lập**, có cấu trúc thư mục chuẩn:

```
<tên-skill>/
├── SKILL.md                    ← 🧠 Bộ não chính (đã tạo ở Phase 4.3)
├── README.md                   ← 📖 Hướng dẫn cài đặt + sử dụng
├── .gitignore                  ← 🔒 Loại bỏ files không cần thiết
│
├── resources/                  ← 📚 Tài liệu tham khảo
│   ├── reference.md            ← Kiến thức chuyên ngành
│   └── templates.md            ← Templates cho output (nếu cần)
│
├── examples/                   ← 🎯 Ví dụ chi tiết
│   ├── example_happy_path.md   ← Ví dụ luồng chính
│   └── example_edge_case.md    ← Ví dụ trường hợp đặc biệt
│
├── scripts/                    ← 🔧 Scripts hỗ trợ (nếu cần)
│   └── <tên>_helper.py         ← Script Python chuẩn
│
└── .agents/workflows/          ← ⚡ Slash commands
    └── run.md                  ← Workflow chạy skill
```

#### 4.4.1. Tạo README.md cho skill con

Mỗi skill PHẢI có README.md riêng:

```markdown
# <icon> <Tên Skill>

> <Mô tả 1 câu>

## 📋 Skill này làm gì?

<Mô tả chi tiết 2-3 câu>

## ⚙️ Cài đặt

### Antigravity (Global)
\```bash
git clone <repo-url> ~/.gemini/antigravity/skills/<tên-skill>
\```

### Antigravity (Workspace)
\```bash
git clone <repo-url> .agent/skills/<tên-skill>
\```

## 🚀 Cách sử dụng

\```
Bạn: <câu trigger mẫu>
AI: <phản hồi mẫu ngắn>
\```

## 📁 Cấu trúc

\```text
<tên-skill>/
├── SKILL.md        ← Bộ não chính
├── README.md       ← File này
├── resources/      ← Tài liệu tham khảo
├── examples/       ← Ví dụ chi tiết
└── scripts/        ← Scripts hỗ trợ (nếu có)
\```

## 📦 Nguồn gốc

> Generated by [Skill Creator Ultra v1.0](https://github.com/marketingjuliancongdanh79-pixel/skill-generator)
```

#### 4.4.2. Tạo resources/ — Tài liệu tham khảo

Tạo ÍT NHẤT 1 file trong `resources/`:

| Trường hợp | File tạo | Nội dung |
|---|---|---|
| Skill có domain knowledge | `reference.md` | Kiến thức chuyên ngành cần thiết |
| Skill cần output format | `templates.md` | Templates cho output (email, báo cáo...) |
| Skill có bảng giá/dữ liệu | `data.md` | Bảng dữ liệu tham khảo |
| Skill có quy tắc phức tạp | `rules.md` | Quy tắc chi tiết mà SKILL.md quá dài |

**Quy tắc viết resources:**

- Đủ chi tiết để AI hiểu KHÔNG cần hỏi user
- Có structure rõ ràng (headings, tables, bullet points)
- Reference trong SKILL.md: `📚 Tham khảo resources/<filename>.md`

#### 4.4.3. Tạo examples/ — Ví dụ chi tiết tách riêng

Tạo ÍT NHẤT 2 files:

**File 1: `example_happy_path.md`**

```markdown
# Ví dụ: <Tên tình huống chính>

## Tình huống
<Mô tả ngữ cảnh>

## Input
\```
<Dữ liệu input mẫu thực tế>
\```

## Thought Process
- Bước 1: Phân tích → nhận thấy [X]
- Bước 2: Quyết định → chọn [Y] vì [Z]
- Bước 3: Thực thi → tạo output theo format

## Output
\```
<Kết quả output mẫu thực tế>
\```

## Tại sao output như vậy?
<Giải thích logic cho AI hiểu>
```

**File 2: `example_edge_case.md`** — Tương tự nhưng với trường hợp đặc biệt.

#### 4.4.4. Tạo scripts/ (nếu skill cần thao tác hệ thống)

📚 Tham khảo `resources/script_integration.md` cho hướng dẫn chi tiết.

**Template script chuẩn:**

```python
#!/usr/bin/env python3
"""
<tên>_helper.py — <Mô tả ngắn>

Sử dụng:
    python <tên>_helper.py <input> [options]
    python <tên>_helper.py --help
    python <tên>_helper.py --dry-run <input>
"""

import sys
import argparse

def main():
    parser = argparse.ArgumentParser(description="<Mô tả>")
    parser.add_argument('input', help='Input file hoặc data')
    parser.add_argument('--dry-run', action='store_true', help='Chạy thử')
    parser.add_argument('--verbose', '-v', action='store_true', help='Chi tiết')
    args = parser.parse_args()

    if args.dry_run:
        print(f"[DRY RUN] Sẽ xử lý: {args.input}")
        return

    # TODO: Logic chính
    print(f"Đang xử lý: {args.input}")

if __name__ == '__main__':
    main()
```

**Bắt buộc:** Mọi script PHẢI có `--help` và `--dry-run`.

#### 4.4.5. Tạo .agents/workflows/ — Slash commands

Tạo 1 file `run.md` để user dùng `/run` kích hoạt skill:

```markdown
---
description: <icon> <Mô tả skill 1 câu>
---

# <Tên Skill>

// turbo
1. Chạy skill theo hướng dẫn trong SKILL.md
```

#### 4.4.6. Tạo .gitignore

```
# OS files
.DS_Store
Thumbs.db

# Editor files
*.swp
*.swo
*~

# Python
__pycache__/
*.pyc

# Temp
*.tmp
*.bak
```
