# 🔍 Advanced Patterns — Các mô hình nâng cao cho Skill phức tạp

Tài liệu này hướng dẫn cách tạo các skill **phức tạp hơn** skill cơ bản. Mỗi pattern bao gồm: **Khi nào dùng**, **Cấu trúc**, và **Ví dụ thực tế**.

---

## Pattern 1: Skill có Scripts (Executable Skills)

> 📖 **Hướng dẫn chi tiết:** Xem `resources/script_integration.md` cho tài liệu toàn diện.

### Khi nào dùng?

Khi skill cần **thao tác hệ thống**: chạy lệnh terminal, đọc/ghi file, tương tác với API,
tính toán chính xác (tài chính, thống kê), hoặc kết nối database/service bên ngoài.

| Không có Script | Có Script |
| --- | --- |
| AI chỉ sinh text/markdown | AI chạy lệnh, đọc file, gọi API |
| AI tự tính → hay sai | Tính toán chính xác 100% |
| Phụ thuộc context window | Xử lý file lớn, dữ liệu nhiều |

### Cấu trúc

```
skills/my-skill/
├── SKILL.md
└── scripts/
    ├── main.py            ← Script chính (BẮT BUỘC có --help)
    ├── helpers.py          ← Hàm tiện ích
    └── requirements.txt    ← Dependencies (nếu cần)
```

### 3 Phương pháp Gọi Script

#### Phương pháp A: Direct Call (Gọi trực tiếp)

Script đơn giản, ít tham số:

```markdown
# Instructions
1. Kiểm tra health staging:
   - Chạy: `./scripts/check_staging.sh`
   - Nếu output chứa "✅" → OK, tiếp bước 2
   - Nếu output chứa "❌" → Dừng, báo user
```

#### Phương pháp B: Argument Mapping (Ánh xạ tham số) ⭐ KHUYẾN KHÍCH

AI trích xuất thông tin từ câu nói user → truyền vào cờ script:

```markdown
# Instructions
1. Phân tích yêu cầu user để xác định:
   - **Môi trường** mục tiêu → Truyền cờ `--env`
   - **Branch** (nếu chỉ định) → Truyền cờ `--branch`
2. Thực thi: `python scripts/deploy.py --env <env> --branch <branch>`

## Bảng ánh xạ tham số:
| User nói | Cờ `--env` | Lệnh đầy đủ |
| --- | --- | --- |
| "deploy lên dev" | `dev` | `python scripts/deploy.py --env dev` |
| "đẩy lên production" | `prod` | `python scripts/deploy.py --env prod` |
| "thử nhưng chưa chạy thật" | + `--dry-run` | `...deploy.py --env dev --dry-run` |
```

#### Phương pháp C: Black Box (Hộp đen)

Script phức tạp, nhiều tham số — AI tự học cách dùng:

```markdown
# Instructions
1. Tool `scripts/data_processor.py` là **hộp đen**.
   KHÔNG ĐƯỢC đọc mã nguồn.
2. Chạy `python scripts/data_processor.py --help` để tìm hiểu interface.
3. Trích xuất thông tin từ user → Tự cấu trúc lệnh → Thực thi.
```

**Lợi ích Black Box:**

- 💾 Tiết kiệm context window (không nạp source code)
- 🎯 Giảm lỗi suy luận (tập trung "cách dùng" vs "cách hoạt động")
- 🔄 Tự thích ứng (thêm cờ mới → AI tự phát hiện qua `--help`)

### Ví dụ thực tế: Skill phân tích codebase

```python
# scripts/analyze_codebase.py
import argparse, os, sys, json

def count_files_by_extension(directory):
    stats = {}
    for root, dirs, files in os.walk(directory):
        dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', 'dist']]
        for f in files:
            ext = os.path.splitext(f)[1] or '(no ext)'
            stats[ext] = stats.get(ext, 0) + 1
    return stats

def analyze(directory):
    result = {
        'total_files': 0,
        'total_lines': 0,
        'files_by_type': count_files_by_extension(directory),
        'largest_files': [],
    }
    code_ext = {'.py', '.js', '.ts', '.tsx', '.jsx', '.vue', '.css', '.html'}
    file_sizes = []
    for root, dirs, files in os.walk(directory):
        dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', 'dist']]
        for f in files:
            filepath = os.path.join(root, f)
            ext = os.path.splitext(f)[1]
            result['total_files'] += 1
            if ext in code_ext:
                try:
                    lines = sum(1 for line in open(filepath, encoding='utf-8', errors='ignore')
                                if line.strip() and not line.strip().startswith(('#','//')))
                except: lines = 0
                result['total_lines'] += lines
                file_sizes.append((filepath, lines))
    file_sizes.sort(key=lambda x: x[1], reverse=True)
    result['largest_files'] = [
        {'path': os.path.relpath(p, directory), 'lines': l} 
        for p, l in file_sizes[:10]
    ]
    return result

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Phân tích codebase")
    parser.add_argument('--dir', default='.', help='Thư mục cần phân tích')
    parser.add_argument('--format', choices=['json', 'text'], default='json')
    args = parser.parse_args()
    result = analyze(args.dir)
    print(json.dumps(result, indent=2, ensure_ascii=False))
```

### Quy tắc cho Script Skills

- ✅ Script PHẢI dùng `argparse` (Python) hoặc flags tương đương
- ✅ Script PHẢI hỗ trợ `--help` (AI đọc để tự học cách dùng)
- ✅ Script PHẢI có `--dry-run` cho thao tác destructive
- ✅ Output qua **stdout** (JSON khuyến khích), errors qua **stderr**
- ✅ Exit code: `0` = OK, `≠0` = lỗi
- ❌ KHÔNG để script truy cập mạng mà không thông báo user
- ❌ KHÔNG để script xóa/sửa file mà không xin phép
- ❌ KHÔNG hardcode credentials (dùng env vars)

---

## Pattern 2: Skill có Multi-Resource (Template-Heavy Skills)

### Khi nào dùng?

Khi skill cần **nhiều file mẫu** (templates) để sinh ra các loại output khác nhau.

### Cấu trúc

```
skills/report-generator/
├── SKILL.md
└── resources/
    ├── templates/
    │   ├── weekly_report.md      ← Mẫu báo cáo tuần
    │   ├── monthly_report.md     ← Mẫu báo cáo tháng
    │   ├── sprint_review.md      ← Mẫu sprint review
    │   └── incident_report.md    ← Mẫu báo cáo sự cố
    ├── styles/
    │   └── report_format.md      ← Quy tắc format chung
    └── glossary.md               ← Bộ thuật ngữ chuẩn
```

### Cách tham chiếu trong SKILL.md

```markdown
# Instructions
1. Hỏi user cần loại báo cáo nào (tuần/tháng/sprint/incident).
2. Đọc template tương ứng từ `resources/templates/<loại>.md`.
3. Đọc quy tắc format từ `resources/styles/report_format.md`.
4. Thu thập dữ liệu từ user.
5. Sinh báo cáo theo template, tuân thủ format chuẩn.
6. Sử dụng thuật ngữ từ `resources/glossary.md` để đảm bảo nhất quán.
```

### Ví dụ template — Báo cáo tuần

```markdown
# 📊 Báo cáo tuần — [Tên dự án]

**Tuần:** [Số tuần] | **Từ:** [DD/MM] **→** [DD/MM/YYYY]
**Người viết:** [Tên]

---

## 1. Tổng quan

| Chỉ số | Tuần trước | Tuần này | Xu hướng |
|---|---|---|---|
| Tasks hoàn thành | _ | _ | ↑↓→ |
| Bugs phát hiện | _ | _ | ↑↓→ |
| Bugs đã fix | _ | _ | ↑↓→ |

## 2. Công việc đã hoàn thành
- [ ] Task 1: _mô tả_
- [ ] Task 2: _mô tả_

## 3. Vấn đề gặp phải
- **Vấn đề 1:** _mô tả_ → **Giải pháp:** _mô tả_

## 4. Kế hoạch tuần tới
- [ ] Task dự kiến 1
- [ ] Task dự kiến 2

## 5. Rủi ro
| Rủi ro | Mức độ | Biện pháp |
|---|---|---|
| _mô tả_ | 🔴🟡🟢 | _biện pháp_ |
```

### Quy tắc cho Multi-Resource Skills

- ✅ Đặt templates vào **sub-folder** riêng (`templates/`, `styles/`)
- ✅ Mỗi template phải **tự đủ** (có thể dùng độc lập)
- ✅ Thêm `glossary.md` nếu có thuật ngữ chuyên ngành
- ❌ KHÔNG để template quá 200 dòng — tách thành nhiều file
- ❌ KHÔNG hardcode dữ liệu thật vào template

---

## Pattern 3: Skill có Context-Aware Logic (Adaptive Skills)

### Khi nào dùng?

Khi skill cần **hành xử khác nhau** tùy vào ngữ cảnh (loại dự án, ngôn ngữ lập trình, framework...).

### Cấu trúc

```
skills/test-generator/
├── SKILL.md
└── resources/
    ├── strategies/
    │   ├── react_testing.md      ← Strategy cho React
    │   ├── nextjs_testing.md     ← Strategy cho Next.js
    │   ├── python_testing.md     ← Strategy cho Python
    │   └── generic_testing.md    ← Strategy chung
    └── patterns/
        ├── unit_test.md          ← Pattern unit test
        ├── integration_test.md   ← Pattern integration test
        └── e2e_test.md           ← Pattern end-to-end test
```

### Cách viết logic adaptive trong SKILL.md

```markdown
# Instructions

## Bước 1: Nhận diện ngữ cảnh
1. Kiểm tra `package.json` hoặc `requirements.txt` để xác định tech stack.
2. Dựa vào tech stack, chọn strategy phù hợp:
   - **React** → Đọc `resources/strategies/react_testing.md`
   - **Next.js** → Đọc `resources/strategies/nextjs_testing.md`
   - **Python** → Đọc `resources/strategies/python_testing.md`
   - **Khác** → Đọc `resources/strategies/generic_testing.md`

## Bước 2: Xác định loại test
1. Hỏi user hoặc tự xác định loại test cần tạo:
   - **Unit test** → Đọc `resources/patterns/unit_test.md`
   - **Integration test** → Đọc `resources/patterns/integration_test.md`
   - **End-to-end test** → Đọc `resources/patterns/e2e_test.md`

## Bước 3: Sinh test code
1. Kết hợp strategy + pattern để sinh test phù hợp.
2. Đảm bảo test tuân thủ conventions của dự án hiện tại.
```

### Quy tắc cho Adaptive Skills

- ✅ **Decision tree rõ ràng** — Điều kiện nào → Hành vi nào
- ✅ Mỗi strategy/pattern là **file riêng** (dễ mở rộng)
- ✅ Luôn có **fallback** strategy (generic) cho trường hợp không nhận diện được
- ❌ KHÔNG để logic rẽ nhánh quá 3 cấp (quá phức tạp → tách thành nhiều skill)

---

## Pattern 4: Skill có Validation & Guardrails (Safety-First Skills)

### Khi nào dùng?

Khi skill thao tác với **dữ liệu nhạy cảm** hoặc **hệ thống production** (database, deployment, API keys...).

### Cấu trúc

```
skills/db-query-assistant/
├── SKILL.md
└── resources/
    ├── allowed_operations.md     ← Danh sách thao tác được phép
    ├── dangerous_patterns.md     ← Các pattern nguy hiểm cần chặn
    └── review_checklist.md       ← Checklist review trước khi chạy
```

### Cách viết guardrails trong SKILL.md

```markdown
# Instructions

## Bước 0: Safety Check (BẮT BUỘC trước mọi thao tác)
1. Đọc `resources/dangerous_patterns.md` để biết cần chặn gì.
2. Kiểm tra query/lệnh của user có chứa pattern nguy hiểm không:
   - `DROP TABLE`, `DELETE FROM` (không có WHERE)
   - `TRUNCATE`, `ALTER TABLE ... DROP COLUMN`
   - Bất kỳ thao tác nào ảnh hưởng >1000 rows
3. Nếu phát hiện pattern nguy hiểm → **DỪNG LẠI** → Cảnh báo user → Yêu cầu xác nhận.

## Bước 1: Xác nhận môi trường
- "Đây là môi trường **production** hay **development**?"
- Nếu production → Bật chế độ **tối thận trọng** (mọi thao tác phải confirm).

# Constraints
- 🚫 TUYỆT ĐỐI KHÔNG chạy DELETE/DROP trên production mà không có backup
- 🚫 TUYỆT ĐỐI KHÔNG hiển thị credentials/API keys trong output
- ⚠️ Mọi query thay đổi dữ liệu PHẢI chạy trong transaction
- ⚠️ Mọi query PHẢI có LIMIT (tối đa 1000 rows)
```

### Ví dụ `dangerous_patterns.md`

```markdown
# ⚠️ Dangerous SQL Patterns — Phải chặn hoặc cảnh báo

## 🔴 Cấm tuyệt đối (Block)
| Pattern | Lý do |
|---|---|
| `DROP TABLE` | Mất toàn bộ bảng, không khôi phục được |
| `DROP DATABASE` | Mất toàn bộ database |
| `TRUNCATE TABLE` | Xóa toàn bộ dữ liệu, không log |
| `DELETE FROM table` (không WHERE) | Xóa toàn bộ dữ liệu |
| `UPDATE table SET` (không WHERE) | Sửa toàn bộ dữ liệu |

## 🟡 Cần xác nhận (Confirm)  
| Pattern | Lý do |
|---|---|
| `ALTER TABLE ... DROP COLUMN` | Mất dữ liệu cột |
| `DELETE FROM ... WHERE` (>100 rows) | Ảnh hưởng nhiều dữ liệu |
| `GRANT ALL PRIVILEGES` | Rủi ro bảo mật |
| Bất kỳ DDL nào trên production | Thay đổi cấu trúc |

## 🟢 An toàn (Allow)
| Pattern | Ghi chú |
|---|---|
| `SELECT` (có LIMIT) | Chỉ đọc dữ liệu |
| `INSERT INTO` (1 row) | Thêm 1 dòng |
| `CREATE INDEX` | Cải thiện performance |
```

### Quy tắc cho Safety-First Skills

- ✅ **Bước 0 luôn là Safety Check** — Chạy TRƯỚC mọi thứ
- ✅ Phân biệt rõ **Block** / **Confirm** / **Allow**
- ✅ Log mọi thao tác nguy hiểm
- ❌ KHÔNG BAO GIỜ auto-run thao tác destructive
- ❌ KHÔNG BAO GIỜ hiển thị secrets/credentials

---

## Pattern 5: Skill có Pipeline (Multi-Step Workflow Skills)

### Khi nào dùng?

Khi skill cần thực hiện **chuỗi thao tác tuần tự**, mỗi bước phụ thuộc vào kết quả bước trước.

### Cấu trúc

```
skills/deploy-pipeline/
├── SKILL.md
├── scripts/
│   ├── step1_lint.sh             ← Lint code
│   ├── step2_test.sh             ← Chạy test
│   ├── step3_build.sh            ← Build production
│   └── step4_deploy.sh           ← Deploy lên server
└── resources/
    ├── pipeline_config.md        ← Cấu hình pipeline
    └── rollback_guide.md         ← Hướng dẫn rollback
```

### Cách viết pipeline trong SKILL.md

```markdown
# Instructions

## Pipeline: Lint → Test → Build → Deploy

### Stage 1: Lint Check ✅❌
1. Chạy `scripts/step1_lint.sh`.
2. **Nếu PASS** → Chuyển sang Stage 2.
3. **Nếu FAIL** → Dừng lại, báo lỗi, đề xuất fix.

### Stage 2: Run Tests ✅❌
1. Chạy `scripts/step2_test.sh`.
2. **Nếu PASS** → Chuyển sang Stage 3.
3. **Nếu FAIL** → Dừng lại, hiển thị test failures.

### Stage 3: Build Production ✅❌
1. Chạy `scripts/step3_build.sh`.
2. **Nếu PASS** → Hỏi user: "Sẵn sàng deploy không?"
3. **Nếu FAIL** → Phân tích build error, đề xuất fix.

### Stage 4: Deploy (Cần xác nhận) ✅❌
1. ⚠️ **BẮT BUỘC** user confirm trước khi deploy.
2. Chạy `scripts/step4_deploy.sh`.
3. **Nếu PASS** → Báo thành công, cung cấp URL.
4. **Nếu FAIL** → Đọc `resources/rollback_guide.md`, thực hiện rollback.

## Progress Tracking
In ra trạng thái pipeline sau mỗi stage:
```

Pipeline Status:
[✅] Stage 1: Lint      — PASSED (0 errors)
[✅] Stage 2: Test      — PASSED (42/42 tests)
[🔄] Stage 3: Build     — IN PROGRESS...
[⏳] Stage 4: Deploy    — WAITING

```
```

### Quy tắc cho Pipeline Skills

- ✅ Mỗi stage phải có **PASS/FAIL** rõ ràng
- ✅ FAIL ở stage nào → **DỪNG ngay** (không chạy stage tiếp)
- ✅ Stage cuối (destructive) luôn cần **user confirm**
- ✅ Luôn có **rollback plan**
- ❌ KHÔNG skip stage (trừ khi user explicitly yêu cầu)
- ❌ KHÔNG auto-deploy mà không hỏi

---

## Pattern 6: Skill kế thừa (Composable Skills)

### Khi nào dùng?

Khi skill mới có thể **tận dụng** skill đã có, tránh viết lại logic.

### Cách hoạt động

Skill B có thể **gọi** Skill A bằng cách hướng dẫn AI:

```markdown
# Instructions (Skill B: full-deploy)
1. Đầu tiên, kích hoạt skill `code-reviewer` để review code.
2. Nếu review PASS, kích hoạt skill `test-runner` để chạy test.
3. Nếu test PASS, tiếp tục với logic deploy của skill này.
```

### Quy tắc cho Composable Skills

- ✅ Ghi rõ **tên skill** cần kích hoạt
- ✅ Ghi rõ **điều kiện** kích hoạt (khi nào gọi, khi nào skip)
- ✅ Mỗi skill con phải **hoạt động độc lập** được
- ❌ KHÔNG tạo vòng lặp (A gọi B gọi A)
- ❌ KHÔNG gọi quá 3 skill con (quá phức tạp → cần tách lại)

---

## 📊 Bảng tổng hợp: Chọn Pattern nào?

| Tình huống | Pattern phù hợp |
|---|---|
| Cần chạy lệnh/xử lý file | **Pattern 1:** Script Skills |
| Cần nhiều file mẫu/template | **Pattern 2:** Multi-Resource |
| Hành vi thay đổi theo ngữ cảnh | **Pattern 3:** Context-Aware |
| Thao tác nhạy cảm/production | **Pattern 4:** Safety-First |
| Chuỗi bước tuần tự | **Pattern 5:** Pipeline |
| Tận dụng skill có sẵn | **Pattern 6:** Composable |

---

## 💡 Kết hợp nhiều Pattern

Một skill phức tạp có thể **kết hợp** nhiều pattern:

```
skills/advanced-deployer/
├── SKILL.md                      ← Pipeline (P5) + Safety (P4) + Adaptive (P3)
├── scripts/                      ← Script (P1)
│   ├── lint.sh
│   ├── test.sh
│   └── deploy.sh
└── resources/                    ← Multi-Resource (P2)
    ├── strategies/
    │   ├── vercel_deploy.md
    │   ├── aws_deploy.md
    │   └── docker_deploy.md
    ├── dangerous_patterns.md     ← Safety guardrails
    └── rollback_guide.md
```

> ⚠️ **Nguyên tắc vàng:** Dù kết hợp bao nhiêu pattern, skill vẫn phải làm **DUY NHẤT 1 VIỆC** (deploy). Nếu skill bắt đầu "ôm đồm" → tách thành nhiều skill + dùng Pattern 6 (Composable).
