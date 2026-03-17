# 🎯 Description Optimization — Tối Ưu Trigger Accuracy

## Tại sao Description quan trọng?

Description trong YAML frontmatter là thứ DUY NHẤT AI agent đọc
để quyết định có dùng skill hay không (trước khi đọc body).

→ Description tốt = skill được kích hoạt đúng lúc
→ Description kém = skill bị bỏ qua hoặc trigger sai

## Nguyên tắc viết Description (học từ Anthropic)

### 1. "Pushy" hơn một chút

AI có xu hướng "under-trigger" — không dùng skill dù nên dùng.
Giải pháp: viết description hơi aggressive.

❌ "Tạo báo cáo tuần từ dữ liệu Jira."

✅ "Tạo báo cáo tuần từ dữ liệu Jira và Git. Dùng skill này khi
   user nhắc đến báo cáo, report, weekly update, gửi cho sếp,
   tóm tắt công việc, kể cả khi không nói rõ 'báo cáo tuần'."

### 2. Bao gồm cả trigger phrases VÀ anti-triggers

Nói rõ skill này dùng cho gì VÀ không dùng cho gì:

✅ "Phân tích và tối ưu SQL query chậm. Dùng khi user nói 'query chậm',
   'optimize SQL', 'slow query', 'database performance'. KHÔNG dùng cho
   việc viết SQL mới từ đầu — đó là việc khác."

### 3. Cover cả formal và casual

```
# Trước (chỉ formal)
description: Tạo báo cáo công việc hàng tuần.

# Sau (cả formal + casual)
description: |
  Tạo báo cáo công việc hàng tuần. Dùng khi user nói "weekly report",
  "báo cáo tuần", "gửi update cho sếp", "tóm tắt tuần này", hoặc
  "sếp nhắn gửi report".
```

## Trigger Eval — 3 Bước kiểm tra

### Bước 1: Nghĩ 5 câu NÊN trigger

Đa dạng: formal/casual, dài/ngắn, trực tiếp/gián tiếp.

```
1. "Viết báo cáo tuần cho sếp"          (formal, trực tiếp)
2. "weekly report từ Jira đi"            (mix EN-VI, casual)
3. "tóm tắt công việc tuần này gửi team" (dài, context nhiều)
4. "gửi update cho sếp đi"               (ngắn, gián tiếp)
5. "em xong 5 tasks, viết report đi"     (casual, backstory)
```

### Bước 2: Nghĩ 5 câu KHÔNG NÊN trigger

Chọn **near-miss** — chia sẻ keyword nhưng intent khác:

```
1. "Viết email cho khách hàng"  (→ email skill)
2. "Phân tích data bán hàng"   (→ data analysis)
3. "Tạo slide thuyết trình"    (→ slide skill)
4. "Review PR #123"            (→ code review)
5. "Debug lỗi server"          (→ debug skill)
```

### Bước 3: Verify description

Đặt câu hỏi:
- Câu NÊN trigger → description có cover? → Nếu không → thêm trigger phrase
- Câu KHÔNG NÊN → description có thể trigger sai? → Nếu có → thêm anti-trigger

## Checklist Description Tối Ưu

- [ ] Trả lời: "Skill LÀM GÌ?" (hành động chính)
- [ ] Trả lời: "Cho AI?" (đối tượng/context)
- [ ] Trả lời: "Khi nào dùng?" (≥ 3 trigger phrases)
- [ ] Trả lời: "Khi nào KHÔNG dùng?" (anti-triggers)
- [ ] ≥ 50 ký tự
- [ ] ≤ 200 ký tự
- [ ] Có cả casual phrases lẫn formal

## Cách áp dụng trong Pipeline

**Phase 4 (Generate):** Sau khi sinh SKILL.md → chạy Trigger Eval nhanh.
**Phase 8 (Optimize):** Chạy Trigger Eval đầy đủ → sửa → verify lại.
