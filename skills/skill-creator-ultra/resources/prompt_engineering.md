# 🧠 Prompt Engineering cho Skill — Kỹ Thuật Viết Instructions Chuẩn Xác

> "AI chỉ thông minh bằng hướng dẫn bạn viết cho nó."

Tài liệu này dạy các kỹ thuật viết Instructions trong SKILL.md sao cho AI
thực hiện CHÍNH XÁC nhất, ít hallucination nhất.

---

## Nguyên tắc #1: Specificity Ladder (Thang Cụ Thể)

Càng cụ thể → AI càng chính xác. Luôn leo thang từ mơ hồ → cụ thể.

```
Level 1 (Mơ hồ):    "Xử lý dữ liệu"
Level 2 (Khá hơn):  "Đọc file CSV và chuyển thành JSON"
Level 3 (Tốt):      "Đọc file CSV (encoding UTF-8, separator comma), 
                      parse header dòng 1, chuyển mỗi dòng thành JSON object"
Level 4 (Xuất sắc):  "Đọc file CSV:
                      - Encoding: UTF-8 (fallback: CP1258 cho tiếng Việt)
                      - Separator: comma (auto-detect tab nếu comma không match)
                      - Header: Dòng 1 là tên cột
                      - Mỗi dòng → 1 JSON object: {col1: val1, col2: val2}
                      - Giá trị rỗng → null (không phải empty string)
                      - Số → parse thành number, không để string"
```

**Quy tắc:** Luôn viết ở Level 3-4. Nếu bạn đọc instruction mà có thể hiểu
theo 2 cách khác nhau → chưa đủ cụ thể.

---

## Nguyên tắc #2: Chain-of-Thought (Chuỗi Suy Nghĩ)

Hướng dẫn AI suy nghĩ TỪNG BƯỚC, không nhảy đến kết luận.

```markdown
❌ SAI:
# Instructions
1. Phân tích code và tìm bugs

✅ ĐÚNG:
# Instructions
1. Đọc toàn bộ code được cung cấp.
2. Với MỖI function:
   a. Xác định input types → Có kiểm tra null/undefined không?
   b. Xác định output → Có trường hợp return undefined không?
   c. Tìm vòng lặp → Có điều kiện dừng không? Có thể infinite loop?
   d. Tìm array access → Có kiểm tra index bounds không?
3. Với MỖI API call:
   a. Có try-catch không?
   b. Có timeout không?
   c. Error message có lộ thông tin nhạy cảm không?
4. Tổng hợp issues tìm được, sắp xếp theo mức nghiêm trọng.
```

**Vì sao:** Khi AI đi TỪNG BƯỚC, nó ít bỏ sót hơn so với "phân tích tổng quan".

---

## Nguyên tắc #3: Few-Shot Examples (Học Qua Ví Dụ)

Số lượng ví dụ ảnh hưởng trực tiếp đến chất lượng output.

| Số ví dụ | Hiệu quả | Ghi chú |
|---|---|---|
| 0 | 🔴 40% | AI đoán format, thường sai |
| 1 | 🟡 65% | Khá hơn nhưng dễ overfit |
| 2 | 🟢 85% | Đủ để AI hiểu pattern |
| 3 | 🟢 92% | Tối ưu cho hầu hết trường hợp |
| 5+ | 🟢 95% | Diminishing returns, tốn context |

### Cách chọn ví dụ tốt

```markdown
✅ Ví dụ tốt:
- Ví dụ 1: Happy path (mọi thứ bình thường)
- Ví dụ 2: Edge case (dữ liệu bất thường)
- Ví dụ 3: Error case (lỗi xảy ra)

❌ Ví dụ xấu:
- 3 ví dụ giống nhau (chỉ thay data)
- Ví dụ quá đơn giản (không phản ánh thực tế)
- Ví dụ không có output rõ ràng
```

### Template ví dụ power

```markdown
## Ví dụ X: [Tên tình huống cụ thể]

**Context:** [Bối cảnh ngắn — TẠI SAO user cần làm việc này]
**Input:**
[Dữ liệu đầu vào — CHÍNH XÁC, không placeholder]

**Thought process:** [Giải thích AI nên suy nghĩ gì — OPTIONAL nhưng POWERFUL]
- Nhận thấy X → Nên làm Y
- Kiểm tra Z → Phát hiện W

**Output:**
[Kết quả CHÍNH XÁC]
```

---

## Nguyên tắc #4: Negative Constraints (Ràng Buộc Phủ Định)

Nói "KHÔNG ĐƯỢC" hiệu quả hơn "NÊN" vì AI dễ vi phạm default behaviors.

```markdown
❌ TAM TAM (chỉ nói cái nên):
- Nên viết code sạch
- Nên handle errors
- Nên validate input

✅ MẠNH MẼ (nói rõ cái cấm):
- KHÔNG ĐƯỢC return undefined — luôn trả giá trị có nghĩa hoặc throw Error
- KHÔNG ĐƯỢC catch error rồi im lặng (console.log rồi bỏ qua)
- KHÔNG ĐƯỢC trust user input — validate MỌI field trước khi xử lý
- KHÔNG ĐƯỢC dùng `any` trong TypeScript — định nghĩa type cụ thể
```

**Vì sao:** AI có xu hướng follow positive instructions lỏng lẻo,
nhưng tuân thủ negative constraints chặt chẽ hơn.

---

## Nguyên tắc #5: Output Format Anchoring (Neo Format Output)

Chỉ định CHÍNH XÁC format output bạn muốn.

```markdown
❌ SAI:
Trả về kết quả phân tích.

✅ ĐÚNG:
Trả về kết quả theo FORMAT SAU:

## 📊 Kết quả phân tích

### Summary
- Tổng files: [số]
- Tổng issues: [số] (🔴 [Critical] / 🟡 [Warning] / 🟢 [Info])

### Issues
| # | File | Line | Severity | Description | Fix |
|---|---|---|---|---|---|
| 1 | [filename] | [line] | 🔴/🟡/🟢 | [mô tả] | [gợi ý] |

### Recommendations
1. [Gợi ý cải thiện 1]
2. [Gợi ý cải thiện 2]
```

**Vì sao:** Khi AI biết CHÍNH XÁC output trông như thế nào,
nó generate chính xác hơn 90% so với free-form.

---

## Nguyên tắc #6: Role Priming (Gán Vai)

Gán vai cho AI để nó adopt đúng persona.

```markdown
❌ SAI:
# Instructions
Review code.

✅ ĐÚNG:
# Mindset
Bạn là **Senior Security Engineer** với 10 năm kinh nghiệm. 
Bạn đã từng phát hiện SQL injection ở app 10 triệu users.
Bạn review code với con mắt hoài nghi: "Code này hack được không?"

# Instructions
1. Đội mũ hacker → Tìm cách exploit code
2. Đội mũ architect → Code có scalable không?
3. Đội mũ mentor → Junior dev đọc hiểu được không?
```

**Vì sao:** Role priming giúp AI kích hoạt đúng "knowledge domain",
tương tự như expert consultation.

---

## Nguyên tắc #7: Conditional Logic (Logic Rẽ Nhánh)

Viết rõ ràng điều kiện IF-THEN-ELSE trong Instructions.

```markdown
❌ SAI:
1. Xử lý file tùy theo loại

✅ ĐÚNG:
1. Xác định loại file:
   - **Nếu** `.csv` → Parse bằng comma separator
   - **Nếu** `.tsv` → Parse bằng tab separator
   - **Nếu** `.json` → Parse trực tiếp
   - **Nếu** `.xlsx` → Thông báo: "Em cần script Python để đọc Excel. 
     Có thể chuyển sang CSV được không?"
   - **Nếu** format khác → Hỏi user: "File này format gì vậy anh?"
```

**Vì sao:** AI xử lý logic rẽ nhánh tốt hơn khi nó được viết tường minh
thay vì ngầm hiểu.

---

## Nguyên tắc #8: Verification Steps (Bước Xác Minh)

Thêm bước KIỂM TRA SAU mỗi bước quan trọng.

```markdown
❌ SAI:
1. Convert CSV → JSON
2. Giao kết quả cho user

✅ ĐÚNG:
1. Convert CSV → JSON
2. ✅ VERIFY: Đếm records JSON = Đếm dòng CSV (trừ header)?
   - Nếu KHÁC → Có dòng bị mất, báo user
   - Nếu BẰNG → Tiếp tục
3. ✅ VERIFY: Mọi field có giá trị hợp lệ?
   - Tìm null/undefined không mong muốn
   - Tìm encoding bị lỗi (ký tự "ÃƒÂ " thay vì "à")
4. Giao kết quả cho user
```

**Vì sao:** AI đôi khi "tự tin" rằng output đúng mà không kiểm tra.
Bước verify buộc nó double-check.

---

## Nguyên tắc #9: Graceful Degradation (Xử Lý Lỗi Nhẹ Nhàng)

Hướng dẫn AI xử lý khi GẶP LỖI, không chỉ khi thành công.

```markdown
❌ SAI (chỉ có happy path):
1. Đọc file
2. Parse data
3. Output kết quả

✅ ĐÚNG (happy path + error paths):
1. Đọc file
   - ⚠️ File không tồn tại → Báo user, hỏi lại đường dẫn
   - ⚠️ File quá lớn (>50MB) → Cảnh báo, hỏi có tiếp tục không
   - ⚠️ Sai encoding → Thử UTF-8 → CP1258 → Latin1 → Báo lỗi
2. Parse data
   - ⚠️ Format không đúng → Cảnh báo cụ thể dòng nào sai
   - ⚠️ Missing fields → Điền null, liệt kê fields bị thiếu
3. Output kết quả
   - ⚠️ Nếu có warnings → Hiển thị summary warnings trước kết quả
```

---

## Nguyên tắc #10: Avoid Ambiguity Traps (Tránh Bẫy Mơ Hồ)

Những từ nguy hiểm AI hay hiểu sai:

| Từ mơ hồ | Vấn đề | Thay bằng |
|---|---|---|
| "xử lý" | Xử lý kiểu gì? | "parse", "validate", "transform", "filter" |
| "kiểm tra" | Kiểm tra gì? | "so sánh X với Y", "đảm bảo X ≥ 0" |
| "tối ưu" | Tối ưu thế nào? | "giảm thời gian load <2s", "giảm bundle <500KB" |
| "sạch" | Clean code = gì? | "không duplicate", "function <30 dòng" |
| "tốt" | Tốt theo tiêu chí nào? | "pass 100% test", "response <200ms" |
| "nhiều" | Bao nhiêu là nhiều? | "≥5 items", ">1000 rows" |
| "phù hợp" | Theo tiêu chí gì? | "khớp regex [pattern]", "thuộc danh sách X" |

---

## 📋 Checklist Prompt Engineering

Trước khi finalize SKILL.md, kiểm tra:

- [ ] Mỗi step có HÀNH ĐỘNG CỤ THỂ (Level 3-4)?
- [ ] Có Chain-of-Thought (AI nghĩ từng bước)?
- [ ] Có ≥2 ví dụ (happy path + edge case)?
- [ ] Có Negative Constraints (KHÔNG ĐƯỢC)?
- [ ] Có Output Format Anchoring (format mẫu)?
- [ ] Có Role Priming (gán vai) nếu cần?
- [ ] Logic rẽ nhánh viết tường minh (IF-THEN)?
- [ ] Có Verification Steps sau bước quan trọng?
- [ ] Có Error Handling cho mỗi bước?
- [ ] Không có từ mơ hồ (bảng trên)?

---

## 🔬 KỸ THUẬT NÂNG CAO — Dành cho Skill Engineer chuyên sâu

> Phần dưới đây chứa 5 kỹ thuật mà chỉ expert mới thường áp dụng.
> Nếu skill đạt Grade A với 10 nguyên tắc trên, hãy thêm những kỹ thuật này
> để nâng lên **S-tier**.

---

### Nguyên tắc #11: Guardrails Stacking (Xếp Chồng Rào Chắn)

Dùng NHIỀU rào chắn ở NHIỀU tầng thay vì 1 constraint đơn lẻ:

```markdown
❌ Rào chắn đơn (dễ bị bypass):
# Constraints
- Không xóa file quan trọng

✅ Rào chắn xếp chồng 3 tầng:
# Instructions
## Bước 0: Safety Gate (Tầng 1 — Phòng ngừa)
1. Scan toàn bộ lệnh sẽ chạy → Liệt kê lệnh destructive
2. Nếu có lệnh destructive → DỪNG, chuyển sang Bước 0.1

## Bước 0.1: Confirmation Gate (Tầng 2 — Xác nhận)
1. Hiển thị cho user: "⚠️ Các lệnh sau sẽ THAY ĐỔI hệ thống: [danh sách]"
2. Yêu cầu user gõ chính xác: "XÁC NHẬN"
3. Nếu user không confirm → DỪNG

# Constraints (Tầng 3 — Cấm cứng)
- 🚫 TUYỆT ĐỐI KHÔNG chạy lệnh `rm -rf`, `DROP`, `TRUNCATE` mà không qua cả 3 tầng
- 🚫 TUYỆT ĐỐI KHÔNG bỏ qua bất kỳ tầng nào dù user yêu cầu
```

**Nguyên lý:** Defense in Depth — 1 rào có thể bị vượt, 3 rào gần như không thể.

---

### Nguyên tắc #12: Cognitive Load Budget (Ngân Sách Tải Nhận Thức)

AI có giới hạn "RAM" — quá nhiều quy tắc cùng lúc → AI bỏ sót.

**Quy tắc Vàng:**

| Thành phần | Ngân sách tối đa | Vượt thì sao? |
| --- | --- | --- |
| Instructions steps | 12 bước | Tách thành sub-skill |
| Constraints | 8 điều | Gộp liên quan, bỏ hiển nhiên |
| Logic rẽ nhánh/step | 4 nhánh | Thêm nhánh → tạo lookup table |
| Examples | 3 cái | Thêm → bỏ vào `examples/` folder |
| Resources đọc đồng thời | 3 files | Thêm → AI mất focus |

```markdown
❌ QUÁ TẢI (AI sẽ bỏ sót):
# Constraints
- Không xóa file gốc
- Không ghi đè file đang mở
- Không dùng encoding sai
- Không gửi qua email cá nhân
- Luôn backup trước
- Luôn log mọi thao tác
- Luôn kiểm tra quyền truy cập
- Luôn dùng UTC timezone
- Luôn encrypt dữ liệu nhạy cảm
- Luôn validate input
- Luôn sanitize output
- Luôn kiểm tra disk space

✅ TỐI ƯU (Gộp + Ưu tiên):
# Constraints

## Bảo mật (ưu tiên #1 — AI PHẢI nhớ):
- 🚫 TUYỆT ĐỐI KHÔNG thao tác file/data mà không backup trước
- 🚫 TUYỆT ĐỐI KHÔNG gửi dữ liệu nhạy cảm ra ngoài hệ thống

## Vận hành (ưu tiên #2):
- ✅ LUÔN LUÔN validate input + sanitize output
- ✅ LUÔN LUÔN log thao tác thay đổi dữ liệu

## Quy ước (ưu tiên #3 — nếu quên thì không chết ai):
- ⚠️ Dùng UTC timezone cho mọi timestamp
- ⚠️ Kiểm tra disk space trước khi ghi file lớn
```

**Nguyên lý:** Phân tầng priority → AI nhớ tầng 1 chắc chắn,
tầng 2 gần chắc, tầng 3 nếu còn "bandwidth".

---

### Nguyên tắc #13: Context Window Management (Quản Lý Cửa Sổ Ngữ Cảnh)

AI có giới hạn context window (~128K-1M tokens). Skill tốt = tiết kiệm context.

**Kỹ thuật tiết kiệm context:**

```markdown
✅ KỸ THUẬT 1: Lazy Loading (Đọc khi cần)
# Instructions
1. Xác định loại báo cáo cần tạo
2. CHỈ đọc template tương ứng:
   - Tuần → đọc `resources/templates/weekly.md`
   - Tháng → đọc `resources/templates/monthly.md`
   (KHÔNG đọc cả 2, chỉ đọc 1 cái cần)

✅ KỸ THUẬT 2: Summary First (Tóm tắt trước)
# Instructions
1. Đọc file dữ liệu → Tóm tắt 5 dòng key metrics
2. Hỏi user: "Dữ liệu có X records, Y columns. Anh muốn phân tích gì?"
3. CHỈ SAU KHI biết phạm vi → Đọc chi tiết phần cần thiết

✅ KỸ THUẬT 3: Black Box Scripts
# Instructions
1. KHÔNG đọc source code của script
2. Chạy `--help` để hiểu interface
3. Truyền params → Đọc output
(Tiết kiệm hàng trăm dòng code khỏi context)
```

**Dấu hiệu skill tốn context quá mức:**

- Instructions >15 bước chi tiết
- Đọc >3 resource files trong 1 lần chạy
- Examples dài >50 dòng mỗi cái
- Constraints >10 điều

---

### Nguyên tắc #14: Self-Correction Loop (Vòng Lặp Tự Sửa)

Dạy AI tự phát hiện và sửa lỗi output TRƯỚC KHI trả cho user:

```markdown
❌ Không có self-correction:
# Instructions
1. Phân tích code
2. Liệt kê bugs
3. Trả kết quả cho user

✅ Có Self-Correction Loop:
# Instructions
1. Phân tích code
2. Liệt kê bugs → Tạo Draft Report

## 🔄 SELF-CHECK (lặp 1 lần trước khi output):
3. Đọc lại Draft Report và tự hỏi:
   - "Mỗi bug có dẫn chứng code cụ thể không?" → Nếu không → Bổ sung
   - "Có bug nào là false positive không?" → Nếu có → Xóa
   - "Severity có đúng không?" → Review lại từng cái
   - "Gợi ý fix có khả thi không?" → Nếu không → Viết lại
4. Output Final Report (đã self-correct)
```

**Khi nào cần Self-Correction:**

- Skill có output dài (>20 dòng)
- Skill có tính toán số liệu
- Skill liên quan đến đánh giá/review
- Skill có output ảnh hưởng production

---

### Nguyên tắc #15: Skill Composition Protocol (Giao Thức Kết Hợp Skill)

Khi skill gọi skill khác, cần giao thức rõ ràng:

```markdown
❌ Gọi mơ hồ:
1. Kích hoạt skill `code-linter`
2. Tiếp tục

✅ Giao thức chuẩn:
1. Kích hoạt skill `code-linter`:
   - TRUYỀN VÀO: [đường dẫn file cần lint]
   - ĐỢI: Cho đến khi skill con trả kết quả
   - NHẬN VỀ: [Exit status + danh sách issues]
   - NẾU THÀNH CÔNG (0 issues hoặc chỉ warnings):
     → Lưu kết quả → Chuyển sang bước 2
   - NẾU THẤT BẠI (có errors):
     → DỪNG pipeline → Hiển thị errors cho user
     → HỎI: "Sửa lỗi rồi chạy lại, hay skip lint?"
2. [Bước tiếp theo, chỉ chạy nếu bước 1 thành công]
```

**4 yếu tố bắt buộc khi gọi skill con:**

1. **INPUT:** Truyền gì vào skill con?
2. **WAIT:** Đợi hay chạy song song?
3. **OUTPUT:** Nhận gì về, format gì?
4. **BRANCH:** Thành công làm gì? Thất bại làm gì?

---

## 📊 Ma Trận Nguyên Tắc — Khi Nào Dùng Gì?

| Nguyên tắc | Luôn dùng | Khi cần | Chỉ expert |
| --- | --- | --- | --- |
| #1 Specificity Ladder | ✅ | | |
| #2 Chain-of-Thought | ✅ | | |
| #3 Few-Shot Examples | ✅ | | |
| #4 Negative Constraints | ✅ | | |
| #5 Output Format Anchoring | | ✅ Output phức tạp | |
| #6 Role Priming | | ✅ Cần chuyên môn | |
| #7 Conditional Logic | | ✅ Có rẽ nhánh | |
| #8 Verification Steps | | ✅ Tính toán/data | |
| #9 Graceful Degradation | | ✅ File/System I/O | |
| #10 Avoid Ambiguity | ✅ | | |
| #11 Guardrails Stacking | | | ✅ Production |
| #12 Cognitive Load Budget | | | ✅ Skill phức tạp |
| #13 Context Window Mgmt | | | ✅ Skill lớn |
| #14 Self-Correction Loop | | | ✅ Output quan trọng |
| #15 Composition Protocol | | | ✅ Multi-skill |
| #16 Explain The Why | ✅ | | |

---

### Nguyên tắc #16: Explain The Why (Giải Thích Thay Vì Ra Lệnh)

> Adapted from Anthropic's writing philosophy.

AI hiện đại có theory of mind tốt. Khi bạn giải thích LÝ DO,
AI xử lý edge cases tốt hơn so với chỉ tuân thủ rules cứng.

```markdown
❌ SAI (ra lệnh cứng):
# Constraints
- TUYỆT ĐỐI KHÔNG viết quá 400 từ
- LUÔN LUÔN ghi ngày tháng
- KHÔNG ĐƯỢC bỏ phần "Vướng mắc"

✅ ĐÚNG (giải thích why):
# Constraints
- Giữ dưới 400 từ — sếp đọc trên điện thoại, quá dài sẽ bị skip
- Luôn ghi ngày tháng cụ thể — để dễ trace khi review sau 3 tháng
- Luôn có phần "Vướng mắc" dù không có gì — sếp sẽ hỏi nếu thiếu,
  viết "Không có" tốt hơn bỏ trống
```

**Khi nào VẪN dùng CAPS LOCK?**

Chỉ liên quan đến **bảo mật/safety** — hậu quả không undo:
- 🚫 TUYỆT ĐỐI KHÔNG hardcode API keys (lý do: lộ = mất tiền/data)
- 🚫 TUYỆT ĐỐI KHÔNG chạy lệnh destructive không confirm (lý do: không recover)
