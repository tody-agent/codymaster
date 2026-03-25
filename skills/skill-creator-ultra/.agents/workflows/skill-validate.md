---
description: ✅ Kiểm tra SKILL.md có hợp lệ không
---

# Skill Validate — Kiểm tra hợp lệ

## Cách dùng

Hỏi user: "Anh muốn validate skill nào? Cho em đường dẫn."

## Chạy validate

// turbo

1. Kiểm tra file hoặc thư mục:

```bash
python "$env:USERPROFILE\.gemini\antigravity\skills\skill-generator\scripts\validate_skill.py" <đường_dẫn_skill>
```

## Sau khi chạy

- Hiển thị kết quả pass/fail
- Nếu có lỗi → gợi ý cách sửa
- Nếu tất cả pass → gợi ý chạy /skill-audit để chấm điểm chi tiết
