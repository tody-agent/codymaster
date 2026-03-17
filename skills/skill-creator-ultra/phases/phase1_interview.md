## Phase 1: 🎤 Deep Interview — Phỏng vấn thông minh

Mục tiêu: Hiểu được công việc + quy trình + quy tắc từ góc nhìn người dùng.
Thời lượng: 5-10 câu hỏi tùy độ phức tạp.

> **Lưu ý quan trọng:** Tham khảo `resources/interview_questions.md` để chọn câu hỏi
> phù hợp, và `resources/industry_questions.md` cho câu hỏi chuyên ngành.
> Xem `resources/anti_patterns.md` để tránh lỗi phổ biến.

### 1.0Q. ⚡ Quick Mode — Tạo skill trong 1 lượt (No-Code Style)

> Lấy cảm hứng từ OpenAI GPTs Builder — user mô tả, AI sinh xong.
> Dùng khi user ĐÃ BIẾT RÕ cần gì, không cần interview dài.

**TRƯỚC KHI phỏng vấn**, phân tích câu đầu tiên của user:

**Nếu câu mô tả ĐÃ ĐỦ 3/4 yếu tố** (trigger + steps + rules + output format):

> "Em thấy anh/chị đã mô tả khá rõ. Em sẽ dùng **Quick Mode** — sinh 
> skill ngay trong 1 lượt. Nếu cần chỉnh sửa, mình iterate sau nhé."

**Quick Mode Flow:**
1. Extract trigger words → `description`
2. Extract steps → `# Instructions`
3. Extract rules → `# Constraints`
4. Generate 1 example from context → `# Examples`
5. Sinh SKILL.md → show cho user review → sửa nếu cần
6. Skip thẳng Phase 4 (generate) → Phase 5 (test)

**Ví dụ Quick Mode trigger:**

| User nói | Quick Mode? | Lý do |
|---|---|---|
| "Tạo skill viết commit message theo conventional commits, input là git diff, output là commit message có type/scope/body" | ✅ Đủ 4/4 | Có trigger + steps + format + scope rõ |
| "Tạo skill review code" | ❌ 1/4 | Chưa rõ steps, rules, output format |
| "Em muốn AI tự viết báo cáo tuần từ Jira, format markdown, gửi Slack mỗi thứ 6" | ✅ Đủ 3/4 | Có trigger + output + schedule, thiếu details nhỏ |

**Nếu câu mô tả CHƯA ĐỦ** → chuyển sang phỏng vấn bình thường (1.0 → 1.8).

---

### 1.0. Auto-Detect Mode — Scan codebase đề xuất skill (v4.0)

**TRƯỚC KHI phỏng vấn**, hỏi user:

> "Anh/chị có muốn em **scan project hiện tại** để đề xuất skill cần tạo không?
>
> - A) Có — scan project rồi đề xuất
> - B) Không — em có ý tưởng sẵn rồi"

**Nếu chọn A (Auto-Detect):**

1. Scan cấu trúc project:
   - Đọc `package.json` / `requirements.txt` / `Makefile` → xác định tech stack
   - Đọc `.github/workflows/` → xác định CI/CD flow
   - Đọc `scripts/` → xác định automation hiện có
   - Đọc `README.md` → hiểu mục đích project

2. Phân tích và đề xuất (tối đa 5 skill):

> "📊 Em đã scan project, đây là các skill tiềm năng:
>
> | # | Skill đề xuất | Lý do | Độ phức tạp |
> | --- | --- | --- | --- |
> | 1 | `[tên-skill-1]` | [Phát hiện pattern X trong code] | 🟢 Đơn giản |
> | 2 | `[tên-skill-2]` | [Thấy script Y chưa có quy trình chuẩn] | 🟡 Trung bình |
> | 3 | `[tên-skill-3]` | [CI/CD cần tự động hóa bước Z] | 🟠 Phức tạp |
>
> Anh/chị muốn tạo skill nào? (chọn số hoặc mô tả ý tưởng khác)"

1. User chọn → chuyển sang phỏng vấn tiêu chuẩn (1.1+)

**Nếu chọn B → skip, bắt đầu phỏng vấn bình thường.**

### 1.1. Mở đầu (Ice-breaker)

Bắt đầu bằng câu hỏi mở, thân thiện:

> "Anh/chị mô tả cho em nghe công việc mà anh/chị muốn AI tự động hóa đi.
> Nói tự nhiên thôi, như đang hướng dẫn một đồng nghiệp mới vậy."

### 1.2. Câu hỏi trích xuất TRIGGER (Khi nào bắt đầu?)

> "Thường thì khi nào anh/chị cần làm việc này? Có tín hiệu hay sự kiện
> nào kích hoạt không?"

**Mục đích:** Xác định `description` (trigger words) cho skill.

**Ví dụ trả lời → Mapping:**

| User nói | AI hiểu |
|---|---|
| "Mỗi khi code xong" | Trigger: sau khi commit/push |
| "Khi khách gửi email hỏi giá" | Trigger: nhận email yêu cầu báo giá |
| "Mỗi thứ Hai đầu tuần" | Trigger: tác vụ định kỳ weekly |
| "Khi bắt đầu dự án mới" | Trigger: khởi tạo project |

### 1.3. Câu hỏi trích xuất STEPS (Làm gì & theo thứ tự nào?)

> "Bước đầu tiên anh/chị thường làm gì? Rồi sau đó?"
> "Có bước nào phụ thuộc vào kết quả bước trước không?"

**Kỹ thuật phỏng vấn:**

- Hỏi theo **trình tự thời gian**: "Đầu tiên? → Tiếp theo? → Sau đó?"
- Nếu user nhảy bước: "Khoan, giữa bước A và bước C, có bước nào ở giữa không?"
- Nếu user mô tả mơ hồ: "Cụ thể hơn được không? VD bước này cần nhập gì, xuất ra gì?"

**Mục đích:** Xác định `# Instructions` — chuỗi bước logic.

### 1.4. Câu hỏi trích xuất INPUT/OUTPUT (Đầu vào/Đầu ra)

> "Khi bắt đầu, anh/chị cần có những thông tin gì sẵn?"
> "Kết quả cuối cùng trông như thế nào? Có mẫu nào không?"

**Đào sâu:**

- "Thông tin đó lấy từ đâu?" (file? database? user nhập? API?)
- "Kết quả giao cho ai? Ở dạng gì?" (file? email? console? dashboard?)

**Mục đích:** Xác định `# Examples` — input/output mẫu.

### 1.5. Câu hỏi trích xuất RULES (Quy tắc & Hạn chế)

> "Có quy tắc nào BẮT BUỘC phải tuân thủ không?"
> "Có điều gì TUYỆT ĐỐI KHÔNG ĐƯỢC làm không?"
> "Đã bao giờ có ai làm sai bước nào chưa? Sai như thế nào?"

**Đào sâu:**

- "Nếu gặp trường hợp bất thường thì xử lý sao?"
- "Có ngoại lệ nào cho quy tắc đó không?"

**Mục đích:** Xác định `# Constraints` — danh sách KHÔNG ĐƯỢC / LUÔN LUÔN.

### 1.6. Câu hỏi trích xuất EDGE CASES (Trường hợp đặc biệt)

> "Có khi nào quy trình này bị 'tắc' giữa chừng không? Lý do?"
> "Trường hợp xấu nhất có thể xảy ra là gì?"
> "Có khách hàng/tình huống nào xử lý khác bình thường không?"

**Mục đích:** Bổ sung logic xử lý ngoại lệ vào Instructions.

### 1.7. Câu hỏi trích xuất TOOLS (Công cụ sử dụng)

> "Anh/chị dùng phần mềm/tool gì để làm việc này?"
> "Có cần chạy lệnh hay thao tác trên hệ thống nào không?"

**Mục đích:** Xác định cần `scripts/` hay không, và loại pattern phù hợp.

### 1.X. Kỹ thuật xử lý user trả lời MƠ HỒ

Người dùng thường trả lời không rõ ràng. Dùng các kỹ thuật sau:

**Kỹ thuật 1: Paraphrasing (Diễn đạt lại)**
> User: "Em kiểm tra mấy cái rồi gửi đi."
> AI: "Vậy ý anh là: Bước 1 kiểm tra [cái gì cụ thể?], Bước 2 gửi [cho ai? qua kênh nào?] — đúng không?"

**Kỹ thuật 2: Concrete Example (Xin ví dụ cụ thể)**
> User: "Em xử lý dữ liệu."
> AI: "Cho em 1 ví dụ cụ thể đi anh — lần gần nhất anh xử lý là dữ liệu gì, từ đâu, và kết quả trả ra thế nào?"

**Kỹ thuật 3: Yes/No Narrowing (Thu hẹp bằng câu hỏi đóng)**
> User: "Nhiều bước lắm."
> AI: "OK, để em hỏi từng cái nhé:
>
> - Có cần đọc file/dữ liệu đầu vào không? [CÓ/KHÔNG]
> - Có cần tính toán gì không? [CÓ/KHÔNG]
> - Kết quả cuối cùng là file hay hiển thị trên màn hình? [FILE/MÀN HÌNH]"

**Kỹ thuật 4: Show & Tell (Cho user xem mẫu)**
> User: "Em không biết mô tả sao."
> AI: "Không sao. Để em cho anh xem 1 ví dụ skill tương tự nhé:
> [Hiển thị ví dụ từ `examples/`]
> Công việc của anh giống vậy không? Khác chỗ nào?"

**Kỹ thuật 5: Timeline Walk (Đi theo dòng thời gian)**
> User: "Phức tạp lắm, không biết bắt đầu từ đâu."
> AI: "Không sao, mình đi theo thời gian nhé. Sáng nay anh mở máy tính lên,
> bắt đầu làm công việc này — anh mở phần mềm nào trước tiên?"

### 1.8. Tổng kết phỏng vấn

Sau khi đủ thông tin, TÓM TẮT lại cho user xác nhận:

> "OK, để em tóm tắt lại nhé:
>
> 📌 **Công việc:** [Mô tả 1 câu]
> 🎯 **Mục tiêu:** [Kết quả mong muốn]
> 📝 **Quy trình:** [X bước]
>
> 1. [Bước 1]
> 2. [Bước 2]
> ...
> ⚠️ **Quy tắc:** [Y quy tắc quan trọng]
> 🔧 **Công cụ:** [Danh sách tool/phần mềm]
>
> Em hiểu đúng chưa? Có gì cần bổ sung không?"

**BẮT BUỘC** phải được user confirm trước khi chuyển sang Phase 2.

---
