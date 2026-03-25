# 🎤 Bộ câu hỏi phỏng vấn — Interview Question Bank

Dùng tài liệu này như ngân hàng câu hỏi trong Phase 1 (Deep Interview).
Chọn câu hỏi phù hợp với ngữ cảnh, KHÔNG hỏi tất cả.

---

## 1. Câu hỏi MỞ ĐẦU (Bắt buộc — 1 câu)

| # | Câu hỏi | Mục đích |
| --- | --- | --- |
| 1a | "Mô tả cho em công việc mà anh/chị muốn AI tự động hóa đi. Nói tự nhiên thôi." | Hiểu tổng quan |
| 1b | "Anh/chị đang tốn thời gian nhất vào việc gì? Muốn AI gánh việc gì?" | Xác định pain point |
| 1c | "Nếu có 1 trợ lý thông minh, anh/chị muốn nó làm gì đầu tiên?" | Xác định ưu tiên |

**🔬 Follow-up sau câu mở đầu:**

- Nếu user nói VẮN TẮT (<20 từ) → Hỏi: "Anh có thể kể chi tiết hơn không? VD: bước nào thiết yếu nhất?"
- Nếu user nói DÀI (>100 từ) → Tóm tắt: "Vậy ý anh là... [tóm 3 gạch đầu dòng]. Đúng chưa?"
- Nếu user nói MƠ HỒ → Dùng kỹ thuật Concrete Example: "Lần gần nhất anh làm việc này là khi nào? Kể em nghe cụ thể."

---

## 2. Câu hỏi TRIGGER — Khi nào bắt đầu? (Chọn 1-2 câu)

| # | Câu hỏi | Khi nào dùng |
| --- | --- | --- |
| 2a | "Thường khi nào anh/chị cần làm việc này?" | Tác vụ định kỳ |
| 2b | "Có sự kiện gì kích hoạt không? VD: nhận email, merge code...?" | Tác vụ event-driven |
| 2c | "Việc này lặp lại bao lâu 1 lần?" | Xác định tần suất |
| 2d | "Ai thường yêu cầu anh/chị làm việc này?" | Xác định nguồn trigger |

**🔬 Expert Probing — Khai thác trigger ẩn:**

- "Nếu anh QUÊN không làm việc này, hậu quả là gì?" → Xác định priority/urgency
- "Có khi nào anh làm TRƯỚC deadline không? Hay luôn đợi đến phút cuối?" → Xác định timing pattern
- "Lần cuối anh bực mình vì phải làm việc này là khi nào?" → Xác định frustration point = automation opportunity

---

## 3. Câu hỏi QUY TRÌNH — Làm gì & Thứ tự? (Chọn 2-4 câu)

| # | Câu hỏi | Khi nào dùng |
| --- | --- | --- |
| 3a | "Bước đầu tiên anh/chị làm gì?" | Bắt đầu trích xuất steps |
| 3b | "Rồi sau đó? Tiếp theo?" | Tiếp tục trích xuất |
| 3c | "Giữa bước A và bước C, có bước nào ở giữa không?" | Khi user nhảy bước |
| 3d | "Bước này cụ thể hơn được không? Cần nhập gì, xuất ra gì?" | Khi user mô tả mơ hồ |
| 3e | "Có bước nào phụ thuộc vào kết quả bước trước không?" | Phát hiện dependencies |
| 3f | "Có bước nào có thể làm song song không?" | Tối ưu pipeline |
| 3g | "Bước nào mất nhiều thời gian nhất?" | Xác định bottleneck |

**🔬 Expert Probing — Phát hiện bước ẩn mà user quên kể:**

- "Trước khi bắt đầu bước 1, anh có CHUẨN BỊ gì không?" → Setup steps
- "Sau bước cuối, anh có KIỂM TRA lại không?" → Verification steps
- "Có bao giờ anh làm bước này KHÁC ĐI không? VD: khi dữ liệu nhiều hơn?" → Branching logic
- "Nếu bước 2 FAIL, anh làm gì?" → Error handling

---

## 4. Câu hỏi INPUT/OUTPUT — Đầu vào & Đầu ra? (Chọn 2-3 câu)

| # | Câu hỏi | Khi nào dùng |
| --- | --- | --- |
| 4a | "Khi bắt đầu, anh/chị cần có thông tin gì sẵn?" | Xác định input |
| 4b | "Thông tin đó lấy từ đâu?" | Nguồn input (file? API? user?) |
| 4c | "Kết quả cuối cùng trông như thế nào?" | Xác định output format |
| 4d | "Kết quả giao cho ai? Qua kênh nào?" | Delivery method |
| 4e | "Có file mẫu/template sẵn không? Cho em xem được không?" | Trích xuất template |

**🔬 Expert Probing — Đào sâu format & quality:**

- "Anh có thể CHO EM XEM 1 ví dụ output thực tế không?" → Concrete output anchoring
- "Output NÀO là ĐẸP (10 điểm)? Output NÀO là CHẤP NHẬN ĐƯỢC (7 điểm)?" → Quality spectrum
- "Sếp/khách hàng nhìn vào output, điều ĐẦU TIÊN họ kiểm tra là gì?" → Priority output elements

---

## 5. Câu hỏi QUY TẮC — Rules & Constraints? (Chọn 2-3 câu)

| # | Câu hỏi | Khi nào dùng |
| --- | --- | --- |
| 5a | "Có quy tắc nào BẮT BUỘC phải tuân thủ không?" | Quy tắc chính |
| 5b | "Điều gì TUYỆT ĐỐI KHÔNG ĐƯỢC làm?" | Constraints cấm |
| 5c | "Đã bao giờ ai làm sai bước nào chưa? Sai kiểu gì?" | Học từ lỗi thực tế |
| 5d | "Có chuẩn/tiêu chuẩn nào cần tuân theo không?" | Standards/conventions |
| 5e | "Sản phẩm như thế nào thì coi là 'đạt'? Như thế nào là 'không đạt'?" | Quality criteria |

**🔬 Expert Probing — Tầng constraints:**

- "Nếu AI LÀM SAI 1 điều, điều gì sẽ GÂY HẠI NHẤT?" → Xác định constraint #1 (bảo mật)
- "Nếu AI QUÊN 1 bước, bước nào ĐỠ NGUY HIỂM nhất?" → Xác định constraint ưu tiên thấp
- "Có DATA nào AI TUYỆT ĐỐI KHÔNG ĐƯỢC nhìn thấy?" → Bảo mật dữ liệu

---

## 6. Câu hỏi EDGE CASES — Trường hợp đặc biệt? (Chọn 1-2 câu)

| # | Câu hỏi | Khi nào dùng |
| --- | --- | --- |
| 6a | "Có khi nào quy trình bị 'tắc' giữa chừng không?" | Phát hiện blockers |
| 6b | "Trường hợp xấu nhất có thể xảy ra là gì?" | Worst-case scenario |
| 6c | "Có ngoại lệ nào xử lý khác bình thường không?" | Exception handling |
| 6d | "Nếu thiếu thông tin ở bước X thì làm sao?" | Missing data handling |

**🔬 Expert Probing — Stress testing skill design:**

- "Nếu 10 người dùng skill cùng lúc, có vấn đề gì không?" → Concurrency
- "Nếu input LỚN GẤP 10 LẦN bình thường, skill có handle được không?" → Scale
- "Có trường hợp nào anh phải HỎI THÊM người khác mới xử lý được không?" → Escalation path

---

## 7. Câu hỏi TOOLS — Công cụ? (Chọn 1-2 câu nếu liên quan)

| # | Câu hỏi | Khi nào dùng |
| --- | --- | --- |
| 7a | "Anh/chị dùng phần mềm gì để làm việc này?" | Xác định tools |
| 7b | "Có cần chạy lệnh terminal không?" | Phát hiện script needs |
| 7c | "Có cần kết nối hệ thống/API nào không?" | Phát hiện integration |

**🔬 Expert Probing — Tích hợp script:**

- "Tool đó có CLI/API không? Hay chỉ có giao diện?" → Xác định automation feasibility
- "Anh có tool nào đang chạy bằng tay mà muốn AI tự chạy không?" → Script opportunity
- "Output của tool đó format gì? JSON? CSV? Text?" → Data format for parsing

---

## 🧠 Cognitive Extraction Matrix

Bảng dưới giúp mapping **TÍN HIỆU** từ câu trả lời user → **THÀNH PHẦN** skill cần tạo:

| User nói (tín hiệu) | Skill component cần tạo | Ví dụ |
| --- | --- | --- |
| "Phải làm theo đúng format" | `# Examples` + Output Format Anchoring | Template báo cáo |
| "Có nhiều trường hợp khác nhau" | Conditional Logic (IF-THEN) | Rẽ nhánh theo loại input |
| "Sai 1 chút là xong" | `# Constraints` + Safety Gate (Bước 0) | Guardrails 3 tầng |
| "Cần chạy lệnh / gọi API" | `scripts/` folder + Argument Mapping | deploy.py, check.sh |
| "Phải hỏi thêm sếp" | Escalation step trong Instructions | "Dừng và báo user" |
| "Đôi khi không có đủ thông tin" | Error handling + Graceful Degradation | Default values |
| "Lặp đi lặp lại mỗi tuần" | Trigger words tường minh trong Description | "báo cáo tuần" |
| "Output phải gửi cho khách hàng" | Verification Step + Self-Correction Loop | Review trước khi giao |
| "Cần nhiều bước, mỗi bước khác nhau" | Pipeline pattern (Stage 1→2→3) | Sequential execution |
| "Dùng tool X rồi tool Y" | Composable Skills hoặc Pipeline + Script | Multi-tool workflow |

---

## 📋 Lộ trình phỏng vấn được gợi ý

### Skill đơn giản (5-7 câu, ~3 phút)

```text
1a → 2a → 3a → 3b → 4c → 5a → Tổng kết
```

**Ưu tiên:** Nắm flow chính, output format, 1 constraint quan trọng nhất.

### Skill trung bình (7-9 câu, ~5 phút)

```text
1a → 2a → 2b → 3a → 3b → 3d → 4a → 4c → 5a → 5b → Tổng kết
```

**Ưu tiên:** Flow + error handling + constraints + output format.

### Skill phức tạp (9-12 câu, ~8 phút)

```text
1a → 2a → 2b → 3a → 3b → 3c → 3e → 4a → 4b → 4c → 5a → 5b → 6a → 6b → 7a → Tổng kết
```

**Ưu tiên:** Flow + dependencies + edge cases + tools + full constraints.

### Skill có Script (thêm 2-3 câu vào bất kỳ lộ trình nào)

```text
... → 7a → 7b → 7c → [Probing: CLI/API? Format output?] → Tổng kết
```

---

## ⚠️ Quy tắc phỏng vấn

### Cơ bản

1. **KHÔNG hỏi quá 12 câu** — User sẽ mất kiên nhẫn
2. **KHÔNG hỏi liên tiếp 3 câu cùng nhóm** — Xen kẽ để tự nhiên
3. **LUÔN diễn đạt lại câu trả lời** — "Vậy ý anh là... đúng không?"
4. **DỪNG sớm nếu đủ thông tin** — Không hỏi cho có
5. **GHI CHÚ mental** — Đánh dấu thông tin thuộc nhóm nào (trigger/steps/rules...)

### Chuyên gia

1. **QUAN SÁT hành vi, không chỉ lời nói** — User nói "đơn giản" nhưng kể 15 bước = KHÔNG đơn giản
2. **PROBE SAU MỖI CÂU TRẢ LỜI QUAN TRỌNG** — Đừng vội chuyển sang nhóm khác
3. **ĐẾM SỐ BƯỚC** — Nếu user kể >12 bước → Gợi ý tách thành 2+ skills
4. **PHÁT HIỆN CONTRADICTION** — User nói "không cần format" nhưng sau lại nói "phải theo mẫu" → Hỏi lại
5. **XÁC NHẬN PRIORITY** — Cuối buổi hỏi: "Trong 3 constraints, cái nào QUAN TRỌNG NHẤT?"
