# Skill Template — Mẫu chuẩn cho SKILL.md

Sử dụng mẫu dưới đây khi sinh `SKILL.md` cho skill mới.
Thay thế các phần `< >` bằng nội dung thực tế.

---

## Tại sao mỗi section quan trọng?

Trước khi dùng template, hãy hiểu **TẠI SAO** mỗi phần tồn tại:

| Section | Vai trò | Nếu thiếu thì sao? |
| --- | --- | --- |
| `description` | AI đọc ĐẦU TIÊN để quyết định dùng skill hay không | AI sẽ **KHÔNG BAO GIỜ** kích hoạt skill |
| `# Goal` | Giúp AI hiểu MỤC ĐÍCH cuối cùng, tránh đi lạc hướng | AI có thể làm đúng bước nhưng sai mục tiêu |
| `# Instructions` | Hướng dẫn AI đi TỪNG BƯỚC chính xác | AI tự "đoán" cách làm → Dễ sai, mỗi lần khác nhau |
| `# Examples` | Cho AI thấy INPUT/OUTPUT mẫu → Giảm hallucination ~40% | AI bịa format output, không consistent |
| `# Constraints` | Rào chắn an toàn, ngăn AI làm điều KHÔNG ĐƯỢC phép | AI có thể xóa file, gửi sai data, etc. |

---

## Template

```markdown
---
name: <tên-skill-kebab-case>
description: |
  <Dòng 1: Hành động chính + đối tượng + phương pháp/chuẩn>
  <Dòng 2: Chi tiết bổ sung hoặc phạm vi áp dụng>
  <Dòng 3: Kích hoạt khi user nói "...", "...", "...">
---

# Goal

<Một câu duy nhất mô tả mục tiêu cuối cùng.
Công thức: [Động từ] + [kết quả cụ thể] + [để đạt lợi ích gì]
Ví dụ: "Sinh báo cáo tuần chuyên nghiệp trong 2 phút thay vì 30 phút."
Test: Nếu đọc Goal mà hỏi "rồi sao?" → chưa đủ tốt.>

# Instructions

<Liệt kê các bước logic CỤ THỂ, đánh số thứ tự.
Mỗi bước phải ACTIONABLE — AI đọc xong biết phải LÀM GÌ.>

1. <Bước 1 — Hành động cụ thể>
   - <Chi tiết con nếu cần>
   - Nếu <điều kiện A> → <hành động X>
   - Nếu <điều kiện B> → <hành động Y>
2. <Bước 2 — Hành động cụ thể>
3. <Bước 3 — Hành động cụ thể>
   - ⚠️ Nếu lỗi xảy ra → <cách xử lý>
4. ✅ VERIFY: <Kiểm tra kết quả bước 3 đúng chưa>
5. <Bước cuối — Output cho user>

# Examples

## Ví dụ 1: <Tên tình huống — Happy path (mọi thứ OK)>

**Context:** <Bối cảnh ngắn — TẠI SAO user cần làm việc này>

**Input:**
<Dữ liệu đầu vào — CHÍNH XÁC, dùng dữ liệu THẬT, không placeholder>

**Thought Process:** <OPTIONAL nhưng rất hiệu quả>
- Nhận thấy X → Áp dụng quy tắc Y
- Kiểm tra Z → Kết quả W

**Output:**
<Kết quả CHÍNH XÁC mong muốn — đây là cái user sẽ thấy>

---

## Ví dụ 2: <Tên tình huống — Edge case (có vấn đề / thiếu data)>

**Context:** <Bối cảnh>

**Input:**
<Dữ liệu đầu vào — trường hợp BẤT THƯỜNG>

**Output:**
<Kết quả — skill xử lý vấn đề thế nào>

# Constraints

<Chuyển đổi quy tắc người dùng nói → format chuẩn bên dưới.
Luôn bắt đầu bằng emoji + từ khóa mạnh.>

- 🚫 KHÔNG ĐƯỢC: <Quy tắc cấm 1 — cụ thể, rõ ràng, không mơ hồ>
- 🚫 KHÔNG ĐƯỢC: <Quy tắc cấm 2>
- ✅ LUÔN LUÔN: <Quy tắc bắt buộc 1>
- ✅ LUÔN LUÔN: <Quy tắc bắt buộc 2>
- ⚠️ CHÚ Ý: <Cảnh báo/ghi chú quan trọng>
```

---

## Quy tắc sử dụng template

| Phần | Bắt buộc? | Yêu cầu tối thiểu | Ghi chú |
| --- | --- | --- | --- |
| `name` | Tùy chọn | kebab-case, ≤30 ký tự | Nếu bỏ, AI lấy tên thư mục |
| `description` | **BẮT BUỘC** | ≥30 ký tự, có trigger words | Yếu tố #1 quyết định AI dùng skill |
| `# Goal` | **BẮT BUỘC** | 1 câu duy nhất | Trả lời "Skill tồn tại để làm gì?" |
| `# Instructions` | **BẮT BUỘC** | ≥3 bước, đánh số, actionable | Có rẽ nhánh + error handling |
| `# Examples` | Khuyến khích mạnh | ≥2 ví dụ, có Input + Output | Happy path + Edge case |
| `# Constraints` | Khuyến khích | ≥1 "KHÔNG ĐƯỢC" | Nghĩ: "Điều tệ nhất?" → Cấm nó |

---

## Checklist trước khi finalize

- [ ] Description trả lời 3 câu: Làm gì? Cho ai? Khi nào kích hoạt?
- [ ] Goal đọc xong KHÔNG cần hỏi thêm "cụ thể hơn?"
- [ ] Mỗi step trong Instructions có HÀNH ĐỘNG cụ thể (không phải "xử lý", "kiểm tra")
- [ ] Logic rẽ nhánh viết TƯỜNG MINH (Nếu X → Y, Nếu Z → W)
- [ ] Có ≥1 step VERIFY (kiểm tra kết quả)
- [ ] Có ≥1 step error handling (xử lý khi lỗi)
- [ ] Ví dụ 1: Happy path với dữ liệu THẬT
- [ ] Ví dụ 2: Edge case (thiếu data / input lỗi / trường hợp đặc biệt)
- [ ] Có ít nhất 1 "KHÔNG ĐƯỢC" trong Constraints
- [ ] Không có từ mơ hồ (xử lý, kiểm tra, tối ưu, phù hợp, tốt)

> Xem thêm: `resources/prompt_engineering.md` cho 10 nguyên tắc viết chuẩn xác.
> Xem thêm: `resources/anti_patterns.md` cho 15 lỗi phổ biến cần tránh.
