---
description: 🧩 Tạo skeleton skill mới từ 1 lệnh
---

# Skill Scaffold — Tạo skill mới

## Cách dùng

Hỏi user:

1. "Tên skill mới là gì? (kebab-case, ví dụ: price-quoter)"
2. "Muốn tạo cơ bản hay đầy đủ?" (cơ bản = chỉ SKILL.md / đầy đủ = kèm scripts + resources + examples)

## Chạy scaffold

// turbo

1. Tạo cơ bản:

```bash
python "$env:USERPROFILE\.gemini\antigravity\skills\skill-generator\scripts\skill_scaffold.py" <tên_skill>
```

1. Tạo đầy đủ:

```bash
python "$env:USERPROFILE\.gemini\antigravity\skills\skill-generator\scripts\skill_scaffold.py" <tên_skill> --full
```

1. Tạo kèm scripts:

```bash
python "$env:USERPROFILE\.gemini\antigravity\skills\skill-generator\scripts\skill_scaffold.py" <tên_skill> --with-scripts
```

1. Chế độ tương tác (hỏi từng bước):

```bash
python "$env:USERPROFILE\.gemini\antigravity\skills\skill-generator\scripts\skill_scaffold.py" <tên_skill> --interactive
```

1. Chỉ định thư mục output:

```bash
python "$env:USERPROFILE\.gemini\antigravity\skills\skill-generator\scripts\skill_scaffold.py" <tên_skill> --full --output <thư_mục>
```

## Sau khi chạy

- Hiển thị cấu trúc thư mục đã tạo
- Mở file SKILL.md cho user điền nội dung
- Gợi ý chạy /skill-audit sau khi viết xong
