---
description: 📦 Export skill ra các nền tảng (Cursor, Claude, Windsurf, OpenClaw...)
---

# Skill Export — Chuyển đổi đa nền tảng

## Cách dùng

Hỏi user 2 thông tin:

1. "Đường dẫn tới skill muốn export?"
2. "Export sang nền tảng nào?" (cursor / claude / windsurf / cline / copilot / openclaw / all)

## Chạy export

// turbo

1. Export sang 1 nền tảng:

```bash
python "$env:USERPROFILE\.gemini\antigravity\skills\skill-generator\scripts\skill_export.py" <đường_dẫn_skill> --platform <nền_tảng>
```

1. Export tất cả:

```bash
python "$env:USERPROFILE\.gemini\antigravity\skills\skill-generator\scripts\skill_export.py" <đường_dẫn_skill> --platform all
```

1. Chỉ định thư mục output:

```bash
python "$env:USERPROFILE\.gemini\antigravity\skills\skill-generator\scripts\skill_export.py" <đường_dẫn_skill> --platform all --output <thư_mục>
```

## Nền tảng hỗ trợ

| Nền tảng | Flag | File output |
| --- | --- | --- |
| Cursor | `cursor` | `.mdc` |
| Claude Code | `claude` | `.md` |
| Windsurf | `windsurf` | `.md` |
| Cline | `cline` | `.md` |
| GitHub Copilot | `copilot` | `.md` |
| OpenClaw | `openclaw` | `.txt` |
| Tất cả | `all` | Mỗi nền tảng 1 file |

## Sau khi chạy

- Hiển thị danh sách files đã export
- Hướng dẫn user copy file vào đúng vị trí cho từng nền tảng
