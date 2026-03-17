---
description: 🔍 Audit skill theo 7 nguyên tắc hoàn hảo
---

# Skill Audit — Chấm điểm Skill

## Cách dùng

Hỏi user: "Anh muốn audit skill nào? Cho em đường dẫn tới thư mục skill hoặc file SKILL.md"

## Chạy audit

// turbo

1. Chạy lệnh audit:

```bash
python "$env:USERPROFILE\.gemini\antigravity\skills\skill-generator\scripts\skill_audit.py" <đường_dẫn_skill>
```

1. Nếu user muốn output JSON:

```bash
python "$env:USERPROFILE\.gemini\antigravity\skills\skill-generator\scripts\skill_audit.py" <đường_dẫn_skill> --json
```

1. Nếu user muốn chấm khắt khe:

```bash
python "$env:USERPROFILE\.gemini\antigravity\skills\skill-generator\scripts\skill_audit.py" <đường_dẫn_skill> --strict
```

## Sau khi chạy

- Hiển thị kết quả cho user
- Nếu điểm thấp (<70%) → gợi ý sửa các nguyên tắc bị điểm thấp
- Nếu điểm cao (≥85%) → khen và gợi ý export ra các nền tảng khác
