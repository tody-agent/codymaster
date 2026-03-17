## Phase 2: 🔬 Knowledge Extraction — Trích xuất & Cấu trúc hóa

Mục tiêu: Chuyển đổi thông tin thô từ phỏng vấn → cấu trúc skill chuẩn.

### 2.1. Mapping Table (Bảng ánh xạ)

Dùng bảng sau để chuyển đổi:

| Thông tin từ phỏng vấn | Thành phần Skill |
|---|---|
| Mô tả công việc tổng quan | `description` trong YAML frontmatter |
| Tín hiệu kích hoạt | Trigger words trong `description` |
| Mục tiêu cuối cùng | `# Goal` |
| Các bước tuần tự | `# Instructions` |
| Dữ liệu đầu vào/đầu ra | `# Examples` (Input/Output) |
| Quy tắc bắt buộc | `# Constraints` (LUÔN LUÔN) |
| Điều cấm | `# Constraints` (KHÔNG ĐƯỢC) |
| Trường hợp đặc biệt | Logic rẽ nhánh trong Instructions |
| Công cụ/phần mềm | `scripts/` hoặc lệnh trong Instructions |
| File mẫu/template | `resources/` |
| Ví dụ thực tế | `examples/` |

### 2.2. Đặt tên Skill

Quy tắc đặt tên tự động:

1. Lấy **hành động chính** + **đối tượng chính** từ mô tả
2. Chuyển thành `kebab-case`
3. Tối đa 30 ký tự

**Công thức:** `[hành-động]-[đối-tượng]` hoặc `[đối-tượng]-[hành-động]er`

| Mô tả | Tên skill |
|---|---|
| "Viết báo cáo tuần" | `weekly-report-writer` |
| "Kiểm tra code trước khi merge" | `pre-merge-reviewer` |
| "Tạo invoice cho khách" | `invoice-generator` |
| "Deploy ứng dụng lên server" | `app-deployer` |

### 2.3. Viết Description "sát thương cao"

Description phải đạt 3 tiêu chí:

1. **Chính xác** — Mô tả đúng skill làm gì
2. **Có trigger words** — Chứa từ khóa để AI nhận diện
3. **Có context** — Nói rõ khi nào/dùng cho ai

**Template description:**

```
[Hành động chính] [đối tượng] [theo chuẩn/phương pháp gì]. 
[Bổ sung chi tiết]. Kích hoạt khi user [liệt kê trigger phrases].
```

---
