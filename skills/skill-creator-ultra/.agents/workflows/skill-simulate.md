---
description: 🧪 Mô phỏng chạy thử skill
---

# Skill Simulate — Mô phỏng dry-run

## Cách dùng

Hỏi user: "Anh muốn simulate skill nào? Cho em đường dẫn."

## Chạy simulate

// turbo

1. Mô phỏng skill:

```bash
python "$env:USERPROFILE\.gemini\antigravity\skills\skill-generator\scripts\simulate_skill.py" <đường_dẫn_skill>
```

## Sau khi chạy

- Hiển thị từng bước đã mô phỏng
- Cảnh báo các bước mơ hồ cần sửa
- Gợi ý thay thế từ mơ hồ bằng từ chính xác
