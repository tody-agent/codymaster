## Phase 8: 🎯 Description Optimization — Tối ưu Trigger Accuracy

> Adapted from Anthropic's description optimization system.
> Description là thứ DUY NHẤT AI agent đọc để quyết định dùng skill hay không.

### Khi nào chạy Phase 8?

- Sau khi skill hoàn chỉnh (Phase 5 hoặc Phase 7 xong)
- Muốn tối ưu: skill trigger đúng lúc, không trigger sai
- Skill sẽ dùng trong production lâu dài

---

### 8.1. Hiểu cách Skill Triggering hoạt động

AI Agent đọc danh sách skills (name + description) → quyết định có dùng không.

**Quan trọng:**
- AI có xu hướng **under-trigger** — không dùng skill dù nên dùng
- Giải pháp: viết description "pushy" hơn
- AI chỉ consult skill cho task phức tạp — query đơn giản ("đọc file X") sẽ
  không trigger skill dù description match

---

### 8.2. Trigger Eval — Kiểm tra description

**Bước 1: Viết 5 câu NÊN trigger**

Đa dạng: formal/casual, dài/ngắn, trực tiếp/gián tiếp.

Viết như user thật — có context, backstory, viết tắt, lowercase:

```
1. "Viết báo cáo tuần cho sếp"
2. "weekly report từ Jira đi"
3. "tóm tắt công việc tuần này gửi team"
4. "ok sếp vừa nhắn gửi update, em xong 5 tasks rồi"
5. "em cần summarize tuần 24/02, có 3 PRs merged"
```

**Bước 2: Viết 5 câu KHÔNG NÊN trigger**

Chọn near-miss — giống nhưng KHÁC intent:

```
1. "Viết email cho khách hàng" (→ email skill, không phải report)
2. "Phân tích data bán hàng Q4" (→ data analysis)
3. "Tạo slide thuyết trình" (→ slide skill)
4. "Review PR #123 cho em" (→ code review)
5. "Deploy app lên production" (→ deploy skill)
```

⚠️ **Tránh**: Câu obviously khác ("write fibonacci") → không test được gì.
Câu tốt nhất là near-miss — chia sẻ keyword nhưng intent khác.

**Bước 3: Verify description**

Đọc lại description → kiểm tra:

| Câu NÊN trigger | Description cover? | Action |
| --- | --- | --- |
| "Viết báo cáo tuần cho sếp" | ✅ Có "báo cáo tuần" | OK |
| "ok sếp vừa nhắn gửi update" | ❌ Thiếu "update" | Thêm vào description |

| Câu KHÔNG NÊN | Description có thể trigger sai? | Action |
| --- | --- | --- |
| "Viết email cho khách hàng" | ⚠️ Có chữ "viết" | Thêm anti-trigger: "KHÔNG dùng cho email" |

---

### 8.3. Viết Description "Pushy"

**Trước optimization:**
```yaml
description: Tạo báo cáo tuần từ dữ liệu Jira.
```

**Sau optimization:**
```yaml
description: |
  Tạo báo cáo công việc hàng tuần từ Jira, Git, hoặc dữ liệu user cung cấp.
  Sinh báo cáo theo mẫu 4 phần: Đã làm, Đang làm, Vướng mắc, Tuần tới.
  Dùng skill này khi user nhắc đến báo cáo tuần, weekly report, gửi update
  cho sếp/team, tóm tắt công việc, kể cả khi họ không nói rõ "báo cáo tuần".
  KHÔNG dùng cho: viết email, tạo slide, phân tích data chuyên sâu.
```

**Checklist description tối ưu:**

- [ ] Trả lời: "Skill LÀM GÌ?" (hành động chính)
- [ ] Trả lời: "Cho AI?" (đối tượng/context)
- [ ] Trả lời: "Khi nào dùng?" (≥ 3 trigger phrases)
- [ ] Trả lời: "Khi nào KHÔNG dùng?" (anti-triggers cho near-miss)
- [ ] ≥ 50 ký tự (quá ngắn = thiếu trigger coverage)
- [ ] ≤ 200 ký tự (quá dài = AI mất focus)
- [ ] Có cả casual phrases ("gửi cho sếp") lẫn formal ("weekly report")

---

### 8.4. Sửa Description & Verify

1. Update YAML frontmatter với description mới
2. Chạy lại Trigger Eval (Bước 1-3)
3. Verify: 5/5 câu NÊN trigger đều covered
4. Verify: 5/5 câu KHÔNG NÊN đều excluded

> "Em đã tối ưu description cho skill `<tên>`. Trước/sau:
>
> **Trước:** [description cũ]
> **Sau:** [description mới]
>
> Coverage: 5/5 trigger phrases, 0/5 false triggers."
