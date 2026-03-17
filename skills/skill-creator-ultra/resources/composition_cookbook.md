# 🔗 Skill Composition Cookbook — Kết Hợp Nhiều Skill Thành Workflow

> "1 skill = 1 việc. Nhiều skill = 1 workflow mạnh mẽ."

Tài liệu này hướng dẫn cách kết hợp nhiều skill nhỏ thành workflow phức tạp,
thay vì tạo 1 skill khổng lồ ôm đồm mọi thứ.

---

## Tại sao cần Composition?

| Cách tiếp cận | Ưu | Nhược |
|---|---|---|
| **1 skill lớn** | Đơn giản quản lý | Khó maintain, dễ bug, ôm đồm |
| **Nhiều skill nhỏ** | Dễ test, dễ tái sử dụng, dễ maintain | Cần orchestration |

**Kết luận:** Nhiều skill nhỏ + orchestration = CHIẾN THẮNG.

---

## Pattern A: Sequential Chain (Chuỗi Tuần Tự)

```
Skill A → Skill B → Skill C → Output
```

### Khi nào dùng

Mỗi skill xử lý 1 phần, kết quả skill trước là input skill sau.

### Cách viết trong SKILL.md

```markdown
# Instructions (Skill: full-quality-check)
1. Kích hoạt skill `code-linter`:
   - Input: Toàn bộ codebase hiện tại
   - Nếu PASS → Tiếp bước 2
   - Nếu FAIL → Dừng, báo lỗi lint
2. Kích hoạt skill `test-runner`:
   - Input: Kết quả từ bước 1
   - Nếu PASS → Tiếp bước 3
   - Nếu FAIL → Dừng, báo lỗi test
3. Kích hoạt skill `security-scanner`:
   - Input: Kết quả từ bước 2
   - Nếu PASS → Báo "All clear! ✅"
   - Nếu FAIL → Liệt kê vulnerabilities
```

### Ví dụ thực tế: Content Publishing Pipeline

```
[draft-writer]  →  [grammar-checker]  →  [seo-optimizer]  →  [publisher]
  Viết bài         Sửa ngữ pháp        Tối ưu SEO          Xuất bản
```

---

## Pattern B: Parallel Fan-Out (Phân Nhánh Song Song)

```
         ┌→ Skill B1 → ┐
Skill A →├→ Skill B2 → ├→ Skill C (merge)
         └→ Skill B3 → ┘
```

### Khi nào dùng

Một input cần được xử lý bởi nhiều skill độc lập, rồi tổng hợp kết quả.

### Cách viết trong SKILL.md

```markdown
# Instructions (Skill: comprehensive-code-review)
1. Nhận code cần review.
2. Chạy ĐỒNG THỜI 3 skill:
   a. Skill `security-reviewer` → Tìm vulnerabilities
   b. Skill `performance-reviewer` → Tìm performance issues
   c. Skill `style-reviewer` → Tìm style violations
3. Tổng hợp kết quả:
   - Merge tất cả issues từ 3 skill
   - Sắp xếp theo priority: Security > Performance > Style
   - Loại bỏ duplicate
4. Trình bày báo cáo tổng hợp.
```

### Ví dụ thực tế: Multi-channel Report

```
                    ┌→ [jira-report]  → ┐
[data-collector] → ├→ [git-report]   → ├→ [report-merger]
                    └→ [slack-report] → ┘
```

---

## Pattern C: Conditional Router (Điều Hướng Có Điều Kiện)

```
         ┌→ Condition A → Skill X
Input → Router
         ├→ Condition B → Skill Y
         └→ Default → Skill Z
```

### Khi nào dùng

Input khác nhau cần xử lý bằng skill khác nhau.

### Cách viết trong SKILL.md

```markdown
# Instructions (Skill: smart-responder)
1. Phân tích input từ user.
2. Điều hướng:
   - **Nếu** user hỏi về giá → Kích hoạt skill `price-quoter`
   - **Nếu** user khiếu nại → Kích hoạt skill `complaint-handler`
   - **Nếu** user muốn hợp tác → Kích hoạt skill `partnership-replier`
   - **Mặc định** → Kích hoạt skill `general-responder`
3. Nhận kết quả từ skill con.
4. Review + giao cho user.
```

### Ví dụ thực tế: Smart Deploy

```
              ┌→ "Vercel" → [vercel-deployer]
[env-check] →├→ "AWS"    → [aws-deployer]
              ├→ "Docker" → [docker-deployer]
              └→ Khác     → Hỏi user
```

---

## Pattern D: Loop Iterator (Lặp Lại)

```
List of items → For each: Skill A → Collect results
```

### Khi nào dùng

Cần áp dụng cùng 1 skill cho nhiều items.

### Cách viết trong SKILL.md

```markdown
# Instructions (Skill: batch-api-documenter)
1. Scan tất cả API routes trong project.
2. Với MỖI endpoint tìm được:
   a. Kích hoạt skill `api-doc-generator` cho endpoint đó
   b. Thu thập kết quả
3. Merge tất cả docs thành 1 file `docs/api/endpoints.md`.
4. Tạo table of contents từ danh sách endpoints.
```

### Ví dụ thực tế: Batch Image Optimizer

```
[image-scanner] → Tìm 50 images → Loop: [image-optimizer] × 50 → Report
```

---

## Pattern E: Fallback Chain (Chuỗi Dự Phòng)

```
Try Skill A → Fail? → Try Skill B → Fail? → Try Skill C → Fail? → Manual
```

### Khi nào dùng

Có nhiều cách giải quyết, thử cách tốt nhất trước → dự phòng.

### Cách viết trong SKILL.md

```markdown
# Instructions (Skill: smart-data-parser)
1. Thử parse bằng skill `json-parser`:
   - Nếu thành công → Xong!
   - Nếu fail → Bước 2
2. Thử parse bằng skill `csv-parser`:
   - Nếu thành công → Xong!
   - Nếu fail → Bước 3
3. Thử parse bằng skill `xml-parser`:
   - Nếu thành công → Xong!
   - Nếu fail → Bước 4
4. Báo user: "Không nhận dạng được format. Anh/chị cho em biết format gì?"
```

---

## 🍳 Recipes (Công Thức Kết Hợp Thực Tế)

### Recipe 1: Full CI/CD Pipeline

```
Pattern: Sequential Chain + Conditional Router

[linter] → [tester] → [builder] → [env-checker] → Deploy Router
                                                    ├→ staging: [staging-deployer]
                                                    └→ production: [prod-deployer] (+ safety)
```

**Skills cần:** `code-linter`, `test-runner`, `app-builder`, `env-checker`, `staging-deployer`, `prod-deployer`

### Recipe 2: Content Creation Factory

```
Pattern: Sequential Chain + Parallel Fan-Out

[topic-generator] → [draft-writer] → Fan-Out:
                                      ├→ [grammar-checker]
                                      ├→ [seo-optimizer]
                                      └→ [image-generator]
                                      → [content-assembler] → [publisher]
```

**Skills cần:** `topic-generator`, `draft-writer`, `grammar-checker`, `seo-optimizer`, `image-generator`, `content-assembler`, `publisher`

### Recipe 3: Smart Customer Support

```
Pattern: Conditional Router + Fallback Chain

[email-classifier] → Router:
├→ "Billing" → [billing-responder]
├→ "Technical" → [tech-support]
│                  → Fallback: [knowledge-base-search] → [human-escalation]
├→ "Feature Request" → [feature-tracker]
└→ "General" → [general-responder]
```

### Recipe 4: Data Pipeline

```
Pattern: Sequential Chain + Loop Iterator

[data-source-connector] → [data-validator] → Loop: [data-transformer] 
→ [data-loader] → [quality-checker] → [report-generator]
```

### Recipe 5: Project Kickoff

```
Pattern: Sequential Chain + Parallel Fan-Out

[requirements-gatherer] → Fan-Out:
├→ [architecture-designer]
├→ [database-designer]
├→ [ui-designer]
└→ [task-planner]
→ [spec-assembler] → [project-bootstrapper]
```

---

## ⚠️ Quy Tắc Composition

### Được phép ✅

- Kết hợp tối đa **5 skill** trong 1 workflow
- Skill con có thể dùng ở nhiều workflow khác nhau (tái sử dụng)
- Skill con chạy độc lập (test riêng từng cái)
- Một skill có thể gọi 1 skill con (1 cấp)

### Không được ❌

- Skill A gọi B gọi A → **Vòng lặp vô hạn**
- Skill gọi sâu quá 2 cấp (A → B → C → D) → **Quá phức tạp**
- Skill con phụ thuộc context của skill cha → **Không độc lập**
- Quá 5 skill song song → **Quá tải context AI**

### Debugging Composition

Khi workflow bị lỗi:

1. **Isolate:** Test từng skill con riêng biệt
2. **Trace:** Kiểm tra output skill A có đúng input skill B không
3. **Simplify:** Bỏ bớt skill, chạy 2 cái trước → thêm dần

---

## 📊 Decision Matrix: Chọn Pattern nào?

| Tình huống | Pattern | Ví dụ |
|---|---|---|
| Bước 1 xong mới làm bước 2 | **A: Sequential** | CI/CD pipeline |
| Nhiều phân tích độc lập cùng input | **B: Parallel** | Code review đa chiều |
| Input khác nhau → xử lý khác nhau | **C: Router** | Email classifier |
| Xử lý nhiều items cùng cách | **D: Loop** | Batch processing |
| Thử nhiều cách, dùng cách đầu tiên thành công | **E: Fallback** | Auto-format |
