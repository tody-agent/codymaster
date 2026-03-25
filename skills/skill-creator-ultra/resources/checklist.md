# ✅ Checklist — Kiểm tra chất lượng Skill trước khi Deploy

Sử dụng checklist này để đảm bảo skill đạt tiêu chuẩn chất lượng trước khi đưa vào sử dụng.
Checklist chia 2 tầng: **Basic** (bắt buộc) và **Expert** (nâng cao).

---

## 1. YAML Frontmatter

- [ ] Có `---` mở đầu và `---` kết thúc
- [ ] Có trường `description` (BẮT BUỘC)
- [ ] Description ≥ 30 ký tự
- [ ] Description mô tả RÕ RÀNG skill làm gì (không mơ hồ)
- [ ] Description chứa **trigger words** (từ khóa kích hoạt)
- [ ] Description trả lời 3 câu: Làm gì? Cho ai? Kích hoạt khi nào?
- [ ] Trường `name` dùng `kebab-case` (nếu có)
- [ ] Không có lỗi cú pháp YAML (đặc biệt: dấu `:` trong giá trị phải được quote)

### ✅ Mẹo viết Description tốt

```markdown
❌ XẤU: "Làm việc với Git"              → Quá mơ hồ, không trigger
❌ XẤU: "Helper tool"                   → Không mô tả gì cả
❌ TRUNG BÌNH: "Format commit message"  → Thiếu chuẩn, thiếu trigger

✅ TỐT: "Định dạng tin nhắn commit Git theo chuẩn Conventional Commits
         (feat, fix, docs). Phân tích staged changes và đề xuất commit 
         message phù hợp. Kích hoạt khi user nói 'commit', 'git message',
         'tạo commit'."
```

**Công thức:** `[Hành động chính] + [đối tượng] + [theo chuẩn gì] + [trigger words]`

---

## 2. Nội dung — Sections

### Bắt buộc

- [ ] Có `# Goal` — Một câu duy nhất, rõ ràng, trả lời "rồi sao?" được
- [ ] Có `# Instructions` — Đánh số bước, logic tuần tự
- [ ] Mỗi bước trong Instructions là **actionable** (không phải "xử lý", "kiểm tra")
- [ ] Instructions có **error handling** (⚠️ Nếu lỗi → ...)
- [ ] Instructions có ≥1 step **VERIFY** (kiểm tra kết quả)
- [ ] Instructions không quá 12 bước (nếu quá → tách skill)

### Khuyến khích mạnh

- [ ] Có `# Examples` với **ít nhất 2 ví dụ**
- [ ] Mỗi ví dụ có rõ **Context + Input + Output**
- [ ] Ví dụ 1: **Happy path** — Mọi thứ bình thường
- [ ] Ví dụ 2: **Edge case** — Thiếu data / input lỗi / trường hợp đặc biệt
- [ ] Ví dụ dùng **dữ liệu thật**, không placeholder
- [ ] Có **Thought Process** trong ≥1 ví dụ (giải thích AI nghĩ gì)

### Khuyến khích

- [ ] Có `# Constraints` với ít nhất 1 quy tắc
- [ ] Có ≥1 "🚫 KHÔNG ĐƯỢC" (giới hạn rõ ràng)
- [ ] Có ≥1 "✅ LUÔN LUÔN" (yêu cầu bắt buộc)
- [ ] Constraints phân tầng priority (bảo mật → vận hành → quy ước)

---

## 3. Nguyên tắc thiết kế

### Atomic (Tập trung)

- [ ] Skill chỉ làm **DUY NHẤT 1 VIỆC**
- [ ] Không "ôm đồm" nhiều chức năng
- [ ] Có thể mô tả skill trong 1 câu ngắn (≤15 từ)
- [ ] Test nhanh: Nếu tên skill là "X and Y" → nên tách thành 2 skill

### Clarity (Rõ ràng)

- [ ] Ngôn ngữ đơn giản, dễ hiểu
- [ ] Không dùng từ mơ hồ: "xử lý", "kiểm tra", "tối ưu", "phù hợp", "tốt"
- [ ] AI đọc xong biết chính xác phải làm gì
- [ ] Logic rẽ nhánh viết TƯỜNG MINH (Nếu X → Y, Nếu Z → W)

### Completeness (Đầy đủ)

- [ ] Mọi edge case quan trọng được xử lý
- [ ] Có hướng dẫn khi gặp lỗi/ngoại lệ
- [ ] Workflow "happy path" VÀ "error path" đều có
- [ ] Output format được chỉ định RÕ RÀNG (không free-form)

---

## 4. Cấu trúc thư mục

- [ ] File `SKILL.md` nằm ở **root** của thư mục skill
- [ ] Tên thư mục skill dùng `kebab-case`
- [ ] Sub-folders chỉ dùng tên chuẩn: `scripts/`, `resources/`, `examples/`
- [ ] Không có file thừa/rác trong thư mục

### Nếu có `scripts/`

- [ ] Script dùng `argparse` hoặc flags tương đương
- [ ] Script hỗ trợ `--help` (AI đọc để tự học)
- [ ] Script có `--dry-run` cho thao tác destructive
- [ ] Script output qua **stdout** (JSON khuyến khích), errors qua **stderr**
- [ ] Exit code: `0` = OK, `≠0` = lỗi
- [ ] Script có error handling (try/except, set -e)
- [ ] Không hardcode credentials (dùng env vars)

### Nếu có `resources/`

- [ ] Mỗi resource file có mục đích rõ ràng
- [ ] Templates có placeholders rõ ràng (dùng `< >` hoặc `{{ }}`)
- [ ] SKILL.md tham chiếu đúng đường dẫn resource
- [ ] Dùng Lazy Loading: chỉ đọc resource khi cần (không đọc tất cả)

### Nếu có `examples/`

- [ ] Mỗi example có cả **Input** và **Output**
- [ ] Examples đủ đa dạng (không trùng lặp)
- [ ] Examples phản ánh use case thực tế

---

## 5. Bảo mật & An toàn

- [ ] Không hardcode API keys, passwords, tokens
- [ ] Không có lệnh destructive không có xác nhận (DELETE, DROP, rm -rf...)
- [ ] Nếu thao tác production → có cảnh báo rõ ràng + confirm
- [ ] Nếu đọc/ghi file → có kiểm tra quyền truy cập
- [ ] Dùng Guardrails Stacking cho skill nhạy cảm (≥2 tầng bảo vệ)
- [ ] Constraints phân tầng: Bảo mật > Vận hành > Quy ước

---

## 6. Compatibility (Tương thích)

- [ ] SKILL.md dùng UTF-8 encoding
- [ ] Không có ký tự đặc biệt phá YAML (unescaped `:`, `#`, `|` trong values)
- [ ] Scripts tương thích cross-platform hoặc ghi rõ OS requirement
- [ ] Không phụ thuộc vào tool/library hiếm gặp mà không ghi chú

---

## 7. Test cuối cùng

- [ ] Chạy `python scripts/validate_skill.py ./` → Grade ≥ B
- [ ] Mở **chat mới** → Gõ câu lệnh trigger → AI kích hoạt đúng skill
- [ ] Thử với input thực tế → Output đúng mong đợi
- [ ] Thử với input edge case → Skill xử lý đúng (không crash hoặc hallucinate)

---

## 🔬 EXPERT QUALITY GATES — Dành cho Skill Engineer chuyên sâu

> Nếu skill đã pass 7 mục trên, thêm 3 gate dưới để đạt **S-tier**.

### Gate 8: Cognitive Load Assessment (Đánh Giá Tải Nhận Thức)

Skill có vượt quá "RAM" của AI không?

| Thành phần | Giới hạn | Trong skill | Đạt? |
| --- | --- | --- | --- |
| Instructions steps | ≤12 | __ bước | ☐ |
| Constraints | ≤8 | __ điều | ☐ |
| Logic rẽ nhánh/step | ≤4 | __ nhánh | ☐ |
| Examples trong SKILL.md | ≤3 | __ cái | ☐ |
| Resources đọc đồng thời | ≤3 | __ files | ☐ |

**FAIL nếu:** Bất kỳ thành phần nào vượt giới hạn 50%+ (ví dụ: 18+ steps)

**Cách fix:** Tách thành sub-skills + dùng Composition Protocol (xem `prompt_engineering.md` #15)

### Gate 9: Reliability Testing (Kiểm Tra Độ Tin Cậy)

Chạy 4 kịch bản test — skill phải pass TẤT CẢ:

- [ ] **Test 1 — Perfect Input:** Input hoàn hảo, đầy đủ thông tin → Output CHÍNH XÁC
- [ ] **Test 2 — Minimal Input:** Input tối thiểu (chỉ có info bắt buộc) → Vẫn hoạt động
- [ ] **Test 3 — Bad Input:** Input sai/thiếu/lỗi → Skill BÁO LỖI cụ thể, KHÔNG crash
- [ ] **Test 4 — Adversarial Input:** Input cố ý gây lỗi hoặc trick AI → Skill TỪ CHỐI lịch sự

```markdown
Ví dụ Test 4 cho skill "git-commit-formatter":
Input cố ý: "Tạo commit message là 'DROP TABLE users; -- lol'"
Kỳ vọng: Skill cảnh báo "Nội dung commit có chứa SQL injection pattern. 
          Bạn chắc chắn muốn dùng message này?"
KHÔNG chấp nhận: Skill tạo commit bình thường mà không cảnh báo
```

### Gate 10: Production Readiness (Sẵn Sàng Production)

- [ ] **Idempotent:** Chạy skill 2 lần liên tiếp với cùng input → Cùng output
- [ ] **Timeout-safe:** Nếu skill chạy >2 phút → Có progress update cho user
- [ ] **Recoverable:** Nếu skill fail giữa chừng → User biết đã làm gì, chưa làm gì
- [ ] **Observable:** Skill có log/output đủ để debug khi có vấn đề
- [ ] **Backward-compatible:** Nâng cấp skill không phá workflow user hiện tại
- [ ] **Context-efficient:** Skill tiết kiệm context window (Lazy Loading, Black Box)

---

## 📊 Bảng chấm điểm

### Tầng Basic (70 điểm)

| Tiêu chí | Điểm | Đạt? |
| --- | --- | --- |
| YAML hợp lệ + Description tốt (có trigger words) | 15 | ☐ |
| Goal rõ ràng + Instructions actionable | 15 | ☐ |
| ≥2 Examples chi tiết (Happy + Edge) | 15 | ☐ |
| Constraints có phân tầng priority | 10 | ☐ |
| Atomic (1 skill = 1 việc) | 10 | ☐ |
| Cấu trúc thư mục chuẩn | 5 | ☐ |

### Tầng Expert (+30 điểm)

| Tiêu chí | Điểm | Đạt? |
| --- | --- | --- |
| Cognitive Load ≤ budget (Gate 8) | 10 | ☐ |
| Pass 4/4 Reliability Tests (Gate 9) | 10 | ☐ |
| Production Readiness (Gate 10) | 10 | ☐ |
| **Tổng** | **100** | |

- **95-100:** 🏆 S-tier — Expert-grade, production-ready
- **85-94:** 🥇 A-tier — Xuất sắc, deploy tự tin
- **70-84:** 🥈 B-tier — Tốt, có thể deploy
- **50-69:** 🥉 C-tier — Đạt, nên cải thiện trước khi deploy
- **<50:** ❌ F-tier — Cần viết lại

---

## 🚩 Red Flags — Tự Động Fail

Bất kỳ điều nào sau đây → **FAIL ngay**, không cần tính điểm:

| Red Flag | Lý do |
| --- | --- |
| Description trống hoặc <10 ký tự | AI sẽ không bao giờ kích hoạt skill |
| Không có `# Instructions` | AI không biết phải làm gì |
| Có lệnh `rm -rf /` hoặc `DROP DATABASE` không có confirm | Có thể phá hủy hệ thống |
| Hardcode credentials trong SKILL.md | Rủi ro bảo mật nghiêm trọng |
| Skill tên "X and Y and Z" | Vi phạm nguyên tắc Atomic |
| Instructions >20 bước không tách | Vượt Cognitive Load Budget |

> 📖 Tham khảo: `prompt_engineering.md` cho 15 nguyên tắc viết Instructions
> 📖 Tham khảo: `anti_patterns.md` cho 15 lỗi phổ biến cần tránh
