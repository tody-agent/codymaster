---
description: 📊 Xem thống kê + Cognitive Load của skill
---

# Skill Stats — Phân tích thống kê

## Cách dùng

Hỏi user: "Anh muốn xem thống kê skill nào? Cho em đường dẫn."

## Chạy stats

// turbo

1. Thống kê bình thường:

```bash
python "$env:USERPROFILE\.gemini\antigravity\skills\skill-generator\scripts\skill_stats.py" <đường_dẫn_skill>
```

1. Output JSON:

```bash
python "$env:USERPROFILE\.gemini\antigravity\skills\skill-generator\scripts\skill_stats.py" <đường_dẫn_skill> --json
```

## Sau khi chạy

- Hiển thị kết quả cho user
- Nếu Cognitive Load > 75 → cảnh báo skill quá phức tạp
- Nếu thiếu examples hoặc constraints → gợi ý thêm
