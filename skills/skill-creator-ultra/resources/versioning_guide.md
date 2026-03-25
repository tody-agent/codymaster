# 🔄 Versioning Guide — Hướng Dẫn Nâng Cấp Skill Theo Thời Gian

---

## Tại sao cần Versioning?

Skill không phải "tạo xong là xong". Theo thời gian:

- 🔧 Tool/API thay đổi → Skill lỗi thời
- 📈 Quy trình cải tiến → Cần cập nhật
- 🐛 Phát hiện bugs → Cần fix
- 💡 Có ý tưởng mới → Cần mở rộng

---

## Quy tắc Versioning

### Semantic Versioning cho Skill: `vX.Y.Z`

| Thay đổi | Version | Ví dụ |
|---|---|---|
| **MAJOR (X)** — Breaking change, thay đổi lớn | v1.0 → v**2**.0 | Viết lại Instructions, đổi pattern |
| **MINOR (Y)** — Thêm tính năng, không phá cũ | v1.0 → v1.**1** | Thêm ví dụ, thêm constraint |
| **PATCH (Z)** — Sửa lỗi nhỏ | v1.0.0 → v1.0.**1** | Fix typo, chỉnh wording |

---

## Cách ghi Version trong SKILL.md

### Thêm vào cuối YAML frontmatter

```markdown
---
name: my-skill
description: ...
version: 2.1.0
last_updated: 2026-06-15
---
```

### Thêm Changelog section

```markdown
# Changelog

## v2.1.0 (2026-06-15)
### Added
- Thêm ví dụ edge case cho input Unicode
- Thêm constraint: Không xóa file gốc

### Changed
- Cải thiện Step 3: Thêm validation sau transform

## v2.0.0 (2026-04-01) — BREAKING
### Changed
- Viết lại Instructions theo chuỗi pipeline
- Đổi từ Pattern Basic → Pattern Pipeline

### Removed
- Bỏ Step cũ "Xử lý thủ công"

## v1.0.0 (2026-03-03)
- Initial release
```

---

## Quy trình nâng cấp Skill

### Step 1: Đánh giá (khi nào cần upgrade?)

Checklist review hàng quý:

- [ ] Skill có hoạt động đúng không? (Test với input mới)
- [ ] Tool/API skill dùng có thay đổi không?
- [ ] User phản hồi gì? Có pain point nào?
- [ ] Có anti-pattern nào trong skill hiện tại không? (Xem `anti_patterns.md`)
- [ ] Complexity có tăng không? Cần tách skill?

### Step 2: Lên kế hoạch

```markdown
## Upgrade Plan: [tên-skill] v1.0 → v2.0

### Mục tiêu:
- [Gì cần thay đổi]

### Thay đổi cụ thể:
- [ ] Instructions bước X: Thêm validation
- [ ] Examples: Thêm 1 edge case mới
- [ ] Constraints: Thêm quy tắc bảo mật

### Backward Compatibility:
- Có phá gì không? [CÓ/KHÔNG]
- Nếu CÓ → MAJOR version bump (v2.0)
```

### Step 3: Thực hiện

1. Sửa SKILL.md
2. Cập nhật version trong frontmatter
3. Thêm entry vào Changelog
4. Chạy validate_skill.py
5. Test với input mẫu

### Step 4: Deploy

1. Copy file mới vào đúng vị trí (global/workspace)
2. Mở chat mới để AI reload skill
3. Test lại 1 lần

---

## Template Changelog Entry

```markdown
## vX.Y.Z (YYYY-MM-DD)

### Added
- [Tính năng mới / Ví dụ mới / Constraint mới]

### Changed
- [Thay đổi behavior / Cải thiện instruction]

### Fixed
- [Bug fix / Typo fix]

### Removed
- [Chức năng bị bỏ]

### Deprecated
- [Chức năng sẽ bỏ trong tương lai]

### Security
- [Cải thiện bảo mật]
```

---

## Branching Strategy (Cho team dùng Git)

```
main branch:     Skill production (đang dùng)
develop branch:  Skill đang phát triển
feature/xxx:     Tính năng mới cho skill
```

### Workflow

```mermaid
gitgraph
    commit id:"v1.0.0 release"
    branch develop
    commit id:"Thêm ví dụ mới"
    commit id:"Fix constraint"
    checkout main
    merge develop id:"v1.1.0 release"
    branch feature/safety
    commit id:"Thêm Safety Check"
    checkout develop
    merge feature/safety
    checkout main  
    merge develop id:"v2.0.0 release"
```

---

## Quy tắc Deprecation

Khi cần bỏ tính năng:

1. **Ghi chú Deprecated** trong MINOR version (v1.2)

```markdown
# Instructions
## Step 3: [DEPRECATED — Sẽ bỏ ở v2.0]
Dùng Step 3b thay thế.

## Step 3b: (Mới)
...
```

1. **Xóa thực sự** trong MAJOR version (v2.0)

2. **Ghi vào Changelog:**

```markdown
### Deprecated (v1.2.0)
- Step 3 "Xử lý thủ công" — Dùng Step 3b "Xử lý tự động" thay thế

### Removed (v2.0.0)
- Step 3 "Xử lý thủ công" — Đã bỏ hoàn toàn
```
