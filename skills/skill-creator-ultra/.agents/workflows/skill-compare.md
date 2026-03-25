---
description: 🔄 So sánh 2 phiên bản skill
---

# Skill Compare — So sánh phiên bản

## Cách dùng

Hỏi user 2 đường dẫn:

1. "Đường dẫn tới skill phiên bản CŨ?"
2. "Đường dẫn tới skill phiên bản MỚI?"

## Chạy compare

// turbo

1. So sánh 2 thư mục:

```bash
python "$env:USERPROFILE\.gemini\antigravity\skills\skill-generator\scripts\skill_compare.py" <đường_dẫn_cũ> <đường_dẫn_mới>
```

1. Output JSON:

```bash
python "$env:USERPROFILE\.gemini\antigravity\skills\skill-generator\scripts\skill_compare.py" <đường_dẫn_cũ> <đường_dẫn_mới> --json
```

## Sau khi chạy

- Hiển thị bảng so sánh metrics
- Cho biết phiên bản mới tốt hơn hay tệ hơn
- Gợi ý cải thiện nếu cần
