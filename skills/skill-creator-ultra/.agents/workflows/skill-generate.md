---
description: 🧠 Tạo Skill mới từ ý tưởng (phỏng vấn 5 Phase → sinh full package)
---

# Skill Generator — Tạo Skill từ ý tưởng

Khi user gõ `/skill-generate`, thực hiện quy trình sau:

## Bước 1: Kích hoạt Skill Generator

Đọc file `SKILL.md` trong skill `skill-generator` và bắt đầu quy trình tạo skill mới.

AI sẽ đóng vai **Skill Architect** và thực hiện pipeline 5 Phase:

```
Phase 1: 🎤 Phỏng vấn thông minh → Hiểu công việc user
Phase 2: 🔬 Trích xuất thông tin → Cấu trúc hóa
Phase 3: 🔎 Phát hiện pattern → Chọn kiến trúc
Phase 4: 🏗️ Sinh skill package → Tạo đầy đủ files
Phase 5: 🧪 Test & refine → Đảm bảo chất lượng
```

## Bước 2: Bắt đầu phỏng vấn

Hỏi user câu mở đầu:

> "Anh/chị mô tả cho em nghe công việc mà anh/chị muốn AI tự động hóa đi.
> Nói tự nhiên thôi, như đang hướng dẫn một đồng nghiệp mới vậy."

## Bước 3: Hoàn thành

Sau khi chạy xong 5 Phase:

- Tạo **full skill package** (SKILL.md + README + resources + examples + scripts + workflows)
- Hiển thị cấu trúc thư mục
- Chạy dry run test
- Hướng dẫn sử dụng

> 💡 **Lưu ý:** Nếu user đã cung cấp flow rõ ràng → AI tự nhận diện Fast Track, skip phỏng vấn.
