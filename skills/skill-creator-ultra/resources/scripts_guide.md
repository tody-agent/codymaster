# 🔧 Hướng Dẫn Sử Dụng Scripts

> Hướng dẫn chi tiết cách dùng 8 công cụ Python trong Skill Creator Ultra.
> Tất cả scripts đều chạy độc lập, **không cần cài thêm thư viện** — chỉ cần Python 3.8+.

---

## 📋 Tổng quan

| # | Script | Chức năng | Khi nào dùng |
| --- | --- | --- | --- |
| 1 | `validate_skill.py` | Kiểm tra SKILL.md hợp lệ | Sau khi viết/sửa skill |
| 2 | `simulate_skill.py` | Mô phỏng chạy thử | Test skill trước deploy |
| 3 | `skill_audit.py` | Audit 7 nguyên tắc → chấm S-tier | Muốn biết skill đạt mấy điểm |
| 4 | `skill_stats.py` | Thống kê + Cognitive Load | Xem skill có quá phức tạp không |
| 5 | `skill_export.py` | Export ra 6 nền tảng | Dùng skill trên Cursor, Claude... |
| 6 | `skill_compare.py` | So sánh 2 phiên bản | Khi nâng cấp skill |
| 7 | `skill_scaffold.py` | Tạo skeleton skill mới | Bắt đầu viết skill từ đầu |

---

## ⚙️ Chuẩn bị

```bash
# Kiểm tra Python đã cài chưa
python --version
# Output: Python 3.8+ là OK

# Di chuyển vào thư mục scripts
cd path/to/skill-generator/scripts/
```

---

## 1. validate_skill.py — Kiểm tra hợp lệ

**Mục đích:** Kiểm tra SKILL.md có đúng cấu trúc, đủ sections, đúng frontmatter.

```bash
# Kiểm tra 1 file SKILL.md
python validate_skill.py /path/to/SKILL.md

# Kiểm tra cả thư mục skill
python validate_skill.py /path/to/my-skill/
```

**Output mẫu:**

```
✅ Frontmatter: Có name, description
✅ Section Goal: Có
✅ Section Instructions: Có
✅ Section Examples: Có (3 ví dụ)
⚠️ Section Constraints: Chỉ có 2 rules (khuyến khích ≥5)

📊 Kết quả: 18/20 checks PASS — Grade: A
```

**Khi nào dùng:**

- Sau khi viết xong SKILL.md
- Sau khi AI tạo skill cho bạn
- Trước khi deploy skill vào production

---

## 2. simulate_skill.py — Mô phỏng chạy thử

**Mục đích:** Đi qua từng bước trong Instructions, phát hiện bước mơ hồ.

```bash
python simulate_skill.py /path/to/my-skill/
```

**Output mẫu:**

```
🔄 Đang mô phỏng skill `price-quoter`...

📌 Step 1: Đọc email khách hàng → ✅ Rõ ràng
📌 Step 2: Tra bảng giá → ✅ Rõ ràng
📌 Step 3: Xử lý chiết khấu → ⚠️ "Xử lý" mơ hồ → Gợi ý: "tính chiết khấu theo bảng"
📌 Step 4: Soạn email → ✅ Rõ ràng

📊 3/4 steps rõ ràng — 1 cần sửa lại
```

**Khi nào dùng:**

- Sau validate — muốn biết AI có hiểu đúng Instructions không
- Phát hiện từ mơ hồ trước khi deploy

---

## 3. skill_audit.py — Audit 7 nguyên tắc ⭐

**Mục đích:** Chấm điểm skill theo 7 Nguyên Tắc Hoàn Hảo (thang 100 điểm).

```bash
# Audit bình thường
python skill_audit.py /path/to/my-skill/

# Output dạng JSON (cho CI/CD)
python skill_audit.py /path/to/my-skill/ --json

# Chấm khắt khe (cần ≥85% mới PASS, thay vì ≥70%)
python skill_audit.py /path/to/my-skill/ --strict
```

**7 nguyên tắc được chấm:**

| # | Nguyên tắc | Điểm tối đa | Kiểm tra gì |
| --- | --- | --- | --- |
| 1 | Atomic Logic | 15 | Tên không có AND, description tập trung |
| 2 | Semantic Trigger | 15 | Description đủ dài, có trigger phrases |
| 3 | 4 Core Sections | 15 | Goal + Instructions + Examples + Constraints |
| 4 | Show Don't Tell | 15 | ≥2 ví dụ có Input/Output |
| 5 | Semantic Precision | 15 | Không dùng từ mơ hồ |
| 6 | Error Recovery | 15 | Có xử lý lỗi, branching |
| 7 | Black Box Scripts | 10 | Scripts có --help, --dry-run |

**Thang xếp hạng:**

| Điểm | Tier | Ý nghĩa |
| --- | --- | --- |
| 95-100 | 🏆 S-tier | Hoàn hảo |
| 85-94 | ⭐ A-tier | Xuất sắc |
| 70-84 | ✅ B-tier | Tốt |
| 55-69 | ⚠️ C-tier | Cần cải thiện |
| 40-54 | ❌ D-tier | Yếu |
| < 40 | 💀 F-tier | Fail |

**Khi nào dùng:**

- Muốn biết skill đạt bao nhiêu điểm
- Tìm điểm yếu cần cải thiện
- Đảm bảo chất lượng trước khi chia sẻ

---

## 4. skill_stats.py — Thống kê chi tiết

**Mục đích:** Phân tích kích thước, cấu trúc, Cognitive Load Score.

```bash
# Thống kê bình thường
python skill_stats.py /path/to/my-skill/

# Output JSON
python skill_stats.py /path/to/my-skill/ --json
```

**Output mẫu:**

```
📊 SKILL STATS — Phân tích thống kê
  Skill: price-quoter

📏 Kích thước:
   Dòng:   250
   Từ:     1,800
   Ký tự:  12,500

🏗️ Cấu trúc:
   Sections (H1):    4
   Steps:            8
   Examples:         3
   Constraints:      ✅ 5 (DO) + 🚫 4 (DON'T)

🧠 Cognitive Load:
   Score: 52/100 — 🟡 Trung bình

📋 Phân bổ nội dung:
   Goal                      ██░░░░░░░░░░░░░░░░░░ 8% (20 dòng)
   Instructions              ████████████░░░░░░░░ 45% (112 dòng)
   Examples                  ██████████░░░░░░░░░░ 35% (87 dòng)
   Constraints               ████░░░░░░░░░░░░░░░░ 12% (31 dòng)
```

**Khi nào dùng:**

- Xem skill có quá dài/ngắn không
- Kiểm tra Cognitive Load (AI có bị overload không)
- So sánh cấu trúc với skill tốt

---

## 5. skill_export.py — Export đa nền tảng

**Mục đích:** Chuyển SKILL.md sang format của nền tảng khác.

```bash
# Export sang 1 nền tảng
python skill_export.py /path/to/my-skill/ --platform cursor
python skill_export.py /path/to/my-skill/ --platform claude
python skill_export.py /path/to/my-skill/ --platform windsurf
python skill_export.py /path/to/my-skill/ --platform cline
python skill_export.py /path/to/my-skill/ --platform copilot
python skill_export.py /path/to/my-skill/ --platform openclaw

# Export tất cả nền tảng cùng lúc
python skill_export.py /path/to/my-skill/ --platform all

# Chỉ định thư mục output
python skill_export.py /path/to/my-skill/ --platform all --output ./exports/
```

**Output mẫu:**

```
📦 SKILL EXPORT — Chuyển đổi đa nền tảng
  Skill: price-quoter

  ✅ Cursor Rule
     📄 exports/cursor/price-quoter.mdc
  ✅ Claude Code Command
     📄 exports/claude/price-quoter.md
  ✅ Windsurf Rule
     📄 exports/windsurf/price-quoter.md
  ✅ OpenClaw System Prompt
     📄 exports/openclaw/price-quoter.txt

  📊 Đã export 4/4 nền tảng
```

**Khi nào dùng:**

- Muốn dùng skill trên Cursor, Claude Code, Windsurf...
- Chia sẻ skill cho bạn bè dùng nền tảng khác

---

## 6. skill_compare.py — So sánh 2 phiên bản

**Mục đích:** So sánh 2 phiên bản skill, đánh giá cải thiện hay tệ hơn.

```bash
# So sánh 2 thư mục skill
python skill_compare.py /path/to/old-skill/ /path/to/new-skill/

# So sánh 2 file SKILL.md
python skill_compare.py old-SKILL.md new-SKILL.md

# Output JSON
python skill_compare.py ./v1/ ./v2/ --json
```

**Output mẫu:**

```
🔄 SKILL COMPARE — So sánh 2 phiên bản

  Metric                 OLD      NEW  Thay đổi
  ──────────────────────────────────────────
  📏 Dòng               120      250  +130 (+108%)
  📋 Steps                4        8  +4 (+100%)
  🎯 Examples             1        3  +2 (+200%)
  🛡️ Error handling       0        5  +5 (new!)

  📋 Sections thêm:
     + Constraints (31 dòng)

  🎉 VERDICT: Phiên bản mới TỐT HƠN (5 cải thiện, 0 giảm)
```

**Khi nào dùng:**

- Sau khi nâng cấp skill → xem thay đổi gì
- Đánh giá bản v2 có tốt hơn v1 không

---

## 7. skill_scaffold.py — Tạo skeleton mới

**Mục đích:** 1 lệnh → tạo cả thư mục + files template cho skill mới.

```bash
# Tạo cơ bản (chỉ SKILL.md)
python skill_scaffold.py price-quoter

# Tạo kèm scripts/
python skill_scaffold.py price-quoter --with-scripts

# Tạo đầy đủ (SKILL.md + scripts/ + resources/ + examples/)
python skill_scaffold.py price-quoter --full

# Chế độ tương tác (hỏi từng bước)
python skill_scaffold.py price-quoter --interactive

# Chỉ định thư mục output
python skill_scaffold.py price-quoter --full --output ./skills/
```

**Output mẫu:**

```
🧩 SKILL SCAFFOLD — Tạo skill mới

  ✅ Đã tạo skill: price-quoter
  📁 Vị trí: C:\skills\price-quoter

  📂 Cấu trúc:
  price-quoter/
  ├── SKILL.md                — Bộ não chính
  ├── scripts/helper.py       — Script hỗ trợ (template)
  ├── resources/reference.md  — Tài liệu tham khảo
  └── examples/happy_path.md  — Ví dụ mẫu

  💡 Tiếp theo:
     1. Mở SKILL.md và điền nội dung
     2. Chạy: python skill_audit.py price-quoter/
```

**Khi nào dùng:**

- Muốn tự viết skill bằng tay (không qua AI)
- Cần skeleton chuẩn để bắt đầu

---

## 🔄 Pipeline khuyến nghị

Quy trình chuẩn khi tạo skill mới:

```
1. Tạo skeleton    → skill_scaffold.py my-skill --full
2. Viết nội dung   → Mở SKILL.md, điền vào
3. Validate        → validate_skill.py my-skill/
4. Simulate        → simulate_skill.py my-skill/
5. Audit           → skill_audit.py my-skill/
6. Fix issues      → Sửa theo khuyến nghị audit
7. Re-audit        → skill_audit.py my-skill/ --strict
8. Export          → skill_export.py my-skill/ --platform all
9. Deploy!         → Copy vào .gemini/antigravity/skills/
```

---

> 📦 *Generated by Skill Creator Ultra v1.0 — Được phát triển bởi Thân Công Hải + Anthropic*
