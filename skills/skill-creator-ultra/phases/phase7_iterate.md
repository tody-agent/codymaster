## Phase 7: 🔄 Iteration Loop — Cải thiện liên tục

> Adapted from Anthropic's improvement methodology.
> "This task is pretty important — take your time and really mull things over."

### Khi nào chạy Phase 7?

- Sau Phase 6 nếu pass rate < 90%
- User có feedback muốn cải thiện skill
- User nói "review skill X, em dùng được Y ngày rồi"

---

### 7.1. Thu thập Feedback

**Từ Phase 6 (quantitative):**
- Xem test cases nào FAIL → phân tích nguyên nhân root cause
- Xem expectations nào luôn PASS ở cả skill và baseline → có thể bỏ (non-discriminating)

**Từ User (qualitative):**
> "Anh/chị dùng skill này được bao lâu rồi? Có vấn đề gì không?"
>
> 1. Skill hoạt động đúng ý bao nhiêu %?
> 2. Có tình huống nào skill xử lý sai không?
> 3. Có quy tắc mới cần thêm không?

---

### 7.2. Phân tích & Cải thiện

**4 nguyên tắc khi cải thiện (từ Anthropic):**

**1. Generalize from feedback.**
Đừng thêm rule chỉ cho 1 case cụ thể. Hiểu TẠI SAO nó sai và sửa logic
tổng quát. Skill sẽ được dùng hàng ngàn lần với input khác nhau. Nếu bạn
thêm quá nhiều edge-case rules, skill sẽ bloat và AI sẽ mất focus.

**2. Keep the prompt lean.**
Đọc lại transcripts — nếu AI đang waste time làm thứ không productive, bỏ
phần instruction đó đi. Mỗi dòng trong skill phải pull its weight.

**3. Explain the why.**
Nếu bạn thấy mình viết ALWAYS hoặc NEVER caps lock, dừng lại. Hãy reframe:
giải thích reasoning để AI hiểu. AI hiện đại có theory of mind tốt — khi
hiểu tại sao, nó xử lý edge cases tốt hơn rote rules.

**4. Look for repeated work.**
Đọc transcripts từ test runs — nếu AI luôn tự viết cùng 1 helper script,
đó là signal mạnh: bundle script đó vào `scripts/`. Tiết kiệm cho mỗi
lần chạy sau.

---

### 7.3. Mapping Feedback → Hành động

| Feedback | Hành động | File sửa |
| --- | --- | --- |
| "Output format sai" | Sửa Examples + Output Format Anchoring | SKILL.md |
| "Thiếu trường hợp X" | Thêm logic rẽ nhánh + ví dụ edge case | SKILL.md + examples/ |
| "Bước Y không cần" | Xóa/gộp step, giữ lean | SKILL.md |
| "Cần thêm quy tắc Z" | Thêm Constraint (explain why) | SKILL.md |
| "AI luôn viết cùng 1 script" | Bundle script vào skills/scripts/ | scripts/ |
| "Instruction mơ hồ" | Cụ thể hóa → Level 3-4 (Specificity Ladder) | SKILL.md |
| "Output đúng nhưng chậm" | Tối ưu: lazy loading, bớt resource reads | SKILL.md |

---

### 7.4. Re-test & So sánh

Sau mỗi vòng sửa:

1. **Chạy lại test cases** từ Phase 6
2. **So sánh pass rate** trước/sau

```text
📊 So sánh:
| Metric     | v1 (trước) | v2 (sau) | Delta  |
|------------|-----------|---------|--------|
| Pass Rate  | 67%       | 89%     | +22% ↑ |
| Avg tokens | 3800      | 3200    | -600 ↓ |
```

3. **Nếu cải thiện** → tiếp tục hoặc dừng
4. **Nếu regression** → revert, thử approach khác

### 7.5. Version Tracking

Mỗi vòng sửa → bump version trong skill's CHANGELOG.md:

```markdown
## v1.1.0 (YYYY-MM-DD)
- Sửa: [Mô tả thay đổi]
- Reason: [User feedback / Eval failure / Performance]
- Pass rate: 67% → 89%
```

### 7.6. Điều kiện dừng

Dừng iterate khi:
- ✅ User nói hài lòng
- ✅ Feedback trống (mọi thứ OK)
- ✅ Pass rate ≥ 90%
- ⚠️ Không tiến bộ sau 2 vòng (diminishing returns)
