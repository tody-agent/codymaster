## Phase 3: 🔎 Pattern Detection — Tự nhận diện kiến trúc

Mục tiêu: Dựa vào thông tin đã trích xuất, tự động chọn kiến trúc phù hợp.

### 3.1. Decision Tree (Cây quyết định)

Chạy qua checklist sau để xác định pattern:

```
Q1: Skill có cần chạy lệnh terminal/script không?
├── CÓ → Thêm Pattern 1 (Script Skills) → Tạo scripts/
└── KHÔNG → Tiếp Q2

Q2: Skill có cần nhiều template/file mẫu không?
├── CÓ → Thêm Pattern 2 (Multi-Resource) → Tạo resources/
└── KHÔNG → Tiếp Q3

Q3: Skill có hành xử khác nhau tùy ngữ cảnh không?
├── CÓ → Thêm Pattern 3 (Context-Aware) → Tạo resources/strategies/
└── KHÔNG → Tiếp Q4

Q4: Skill có thao tác nhạy cảm (xóa data, deploy, production) không?
├── CÓ → Thêm Pattern 4 (Safety-First) → Thêm Bước 0: Safety Check
└── KHÔNG → Tiếp Q5

Q5: Skill có nhiều bước tuần tự, mỗi bước phụ thuộc bước trước?
├── CÓ (≥5 bước liên hoàn) → Thêm Pattern 5 (Pipeline) → Thêm progress tracking
└── KHÔNG → Basic Skill

Q6: Skill có thể tận dụng skill nào đã có không?
├── CÓ → Thêm Pattern 6 (Composable) → Tham chiếu skill có sẵn
└── KHÔNG → Giữ nguyên
```

### 3.2. Complexity Score (Điểm phức tạp)

Tính điểm để quyết định quy mô skill:

| Yếu tố | Điểm |
|---|---|
| Mỗi bước trong quy trình | +1 |
| Mỗi quy tắc/constraint | +1 |
| Cần chạy script/lệnh | +3 |
| Có logic rẽ nhánh (if/else) | +2 mỗi nhánh |
| Thao tác production/nhạy cảm | +5 |
| Cần nhiều template | +2 |

**Kết quả:**

| Tổng điểm | Mức độ | Quy mô |
|---|---|---|
| 1-5 | 🟢 Đơn giản | Chỉ cần SKILL.md |
| 6-12 | 🟡 Trung bình | SKILL.md + examples/ |
| 13-20 | 🟠 Phức tạp | SKILL.md + resources/ + examples/ |
| 21+ | 🔴 Rất phức tạp | Full structure + scripts/ |

---
