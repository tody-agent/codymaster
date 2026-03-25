# 🔧 Script Integration Guide — Tích Hợp Scripts Vào Skill

> **Biến AI Agent từ "chỉ biết nói" thành "biết LÀM" — chạy lệnh, thao tác hệ thống,
> xử lý dữ liệu phức tạp.**

Tài liệu này hướng dẫn chi tiết cách tích hợp scripts (Python, Bash, Node.js, Go...)
vào SKILL.md để AI Agent thực thi các tác vụ vượt qua giới hạn tạo văn bản thông thường.

---

## Tại sao cần Script?

| Không có Script | Có Script |
| --- | --- |
| AI chỉ sinh text/markdown | AI chạy lệnh, đọc file, gọi API, tính toán |
| Giới hạn ở "tư vấn" | Thực sự **LÀM** việc trên hệ thống |
| Phụ thuộc AI tự tính | Tính toán chính xác 100% (Python > AI math) |
| Không tương tác hệ thống | Đọc/ghi file, kết nối database, deploy |

---

## 1. Cấu trúc thư mục chuẩn

```
skills/<tên-skill>/
├── SKILL.md
└── scripts/
    ├── main.py                ← Script chính
    ├── helper.sh              ← Script phụ (Bash)
    └── data_processor.py      ← Script xử lý dữ liệu
```

**Quy tắc:**

- Scripts PHẢI nằm trong thư mục `scripts/` bên trong skill
- Đường dẫn gọi script PHẢI dùng **relative path** (đường dẫn tương đối)
- Mỗi script NÊN có 1 chức năng rõ ràng (single responsibility)

---

## 2. Chuẩn bị Script — 3 tiêu chuẩn

### 2.1. Script phải nhận tham số qua Command-line Arguments

```python
# scripts/deploy.py
import argparse

parser = argparse.ArgumentParser(description="Deploy ứng dụng lên server.")
parser.add_argument('--env', required=True, 
                    choices=['dev', 'staging', 'prod'],
                    help='Môi trường deploy (dev/staging/prod)')
parser.add_argument('--branch', default='main',
                    help='Branch để deploy (mặc định: main)')
parser.add_argument('--dry-run', action='store_true',
                    help='Chỉ mô phỏng, không deploy thật')
args = parser.parse_args()

print(f"🚀 Deploying branch '{args.branch}' to '{args.env}'...")
if args.dry_run:
    print("⚠️ DRY RUN — Không có gì thực sự được deploy.")
```

```bash
# scripts/check_staging.sh
#!/bin/bash
# Kiểm tra health của staging server

URL=${1:-"https://staging.example.com"}
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL/health")

if [ "$STATUS" -eq 200 ]; then
    echo "✅ Staging is healthy (HTTP $STATUS)"
    exit 0
else
    echo "❌ Staging is DOWN (HTTP $STATUS)"
    exit 1
fi
```

### 2.2. Script phải hỗ trợ cờ `--help`

**BẮT BUỘC** cho mọi Python script dùng `argparse` (tự động có).

Khi AI chạy `python scripts/deploy.py --help`, output sẽ là:

```
usage: deploy.py [-h] --env {dev,staging,prod} [--branch BRANCH] [--dry-run]

Deploy ứng dụng lên server.

options:
  -h, --help            show this help message and exit
  --env {dev,staging,prod}
                        Môi trường deploy (dev/staging/prod)
  --branch BRANCH       Branch để deploy (mặc định: main)
  --dry-run             Chỉ mô phỏng, không deploy thật
```

→ AI đọc output này là BIẾT cách dùng script, không cần đọc source code.

### 2.3. Script phải có quyền thực thi (macOS/Linux)

```bash
# Cấp quyền thực thi cho bash script
chmod +x scripts/check_staging.sh
```

> **Windows:** Không cần `chmod`. Python scripts chạy bằng `python scripts/file.py`.

---

## 3. Gọi Script Trong SKILL.md — 3 Phương pháp

### Phương pháp A: Direct Call (Gọi trực tiếp)

Phù hợp khi script đơn giản, ít tham số.

```markdown
# Instructions
1. Kiểm tra health của staging server:
   - Chạy lệnh: `./scripts/check_staging.sh`
   - Nếu output chứa "✅" → Staging OK, tiếp bước 2
   - Nếu output chứa "❌" → Dừng, báo user staging bị lỗi
```

### Phương pháp B: Argument Mapping (Ánh xạ tham số)

Phù hợp khi cần truyền thông tin từ user vào script. **Đây là phương pháp HAY NHẤT.**

```markdown
# Instructions
1. Phân tích yêu cầu của người dùng để xác định:
   - **Môi trường** mục tiêu → Truyền vào cờ `--env`
   - **Branch** (nếu user chỉ định) → Truyền vào cờ `--branch`
2. Thực thi script: `python scripts/deploy.py --env <env> --branch <branch>`

## Bảng ánh xạ tham số:

| User nói | Cờ `--env` | Ví dụ lệnh |
| --- | --- | --- |
| "deploy lên dev" | `dev` | `python scripts/deploy.py --env dev` |
| "đẩy lên production" | `prod` | `python scripts/deploy.py --env prod` |
| "deploy branch feature/login" | + `--branch` | `python scripts/deploy.py --env dev --branch feature/login` |
| "thử deploy nhưng chưa chạy thật" | + `--dry-run` | `python scripts/deploy.py --env dev --dry-run` |
```

**Kỹ thuật Argument Mapping:**

1. Liệt kê rõ từng **từ khóa user** → **cờ script** tương ứng
2. Cho AI thấy **ví dụ lệnh hoàn chỉnh** để nó hiểu pattern
3. AI sẽ tự trích xuất từ câu nói user và ghép vào lệnh chính xác

### Phương pháp C: Black Box (Hộp đen)

Phù hợp khi script phức tạp, nhiều tham số. **AI tự học cách dùng.**

```markdown
# Instructions
1. Tool xử lý dữ liệu (`scripts/data_processor.py`) là một **hộp đen**.
   Bạn **KHÔNG ĐƯỢC** đọc mã nguồn của nó.
2. Chạy lệnh: `python scripts/data_processor.py --help` để tìm hiểu:
   - Các cờ (flags) được hỗ trợ
   - Tham số bắt buộc vs tùy chọn
   - Format input/output
3. Phân tích yêu cầu của user → Trích xuất thông tin cần thiết.
4. Dựa trên output của `--help`, tự cấu trúc lệnh chính xác và thực thi.
```

**Lợi ích Black Box:**

| Lợi ích | Giải thích |
| --- | --- |
| 💾 Tiết kiệm context window | AI không nạp hàng trăm dòng source code |
| 🎯 Giảm lỗi suy luận | AI tập trung "cách dùng" thay vì "cách hoạt động" |
| 🔄 Tự động thích ứng | Cập nhật script (thêm cờ mới) → AI tự phát hiện qua `--help` |
| 🔒 Bảo mật | AI không thấy logic nội bộ, credentials trong code |

### Phương pháp D: Wrapper Script (Signal Relay)

Dùng khi hệ thống gốc **quá phức tạp** — tạo script "lớp vỏ" đơn giản hóa output:

```python
# scripts/check_system.py — Wrapper script
# Đóng gói DevOps toolchain phức tạp → Output đơn giản
import subprocess, sys, json

def check_all():
    checks = {}
    
    # Check 1: Database
    result = subprocess.run(['pg_isready'], capture_output=True)
    checks['database'] = '🟢' if result.returncode == 0 else '🔴'
    
    # Check 2: Redis
    result = subprocess.run(['redis-cli', 'ping'], capture_output=True)
    checks['redis'] = '🟢' if b'PONG' in result.stdout else '🔴'
    
    # Check 3: Disk space
    # ... (logic phức tạp bên trong)
    checks['disk'] = '🟢'  # hoặc '🔴'
    
    return checks

if __name__ == '__main__':
    results = check_all()
    all_green = all(v == '🟢' for v in results.values())
    print(json.dumps({
        'status': 'GREEN' if all_green else 'RED',
        'checks': results
    }, indent=2))
    sys.exit(0 if all_green else 1)
```

Trong SKILL.md:

```markdown
# Instructions
1. Chạy `python scripts/check_system.py` — KHÔNG đọc source code.
2. Đọc output JSON:
   - Nếu `status: "GREEN"` → Mọi thứ OK, tiếp tục
   - Nếu `status: "RED"` → Xem `checks` để biết service nào lỗi → Báo user
```

**Khi nào dùng Wrapper Script:**

- Hệ thống gốc quá phức tạp (DevOps, monitoring, CI/CD pipelines)
- Cần che giấu complexity — AI chỉ cần biết GREEN/RED
- Script gốc không có `--help` hoặc output quá "ồn ào"

---

## 4. Bảo Mật — 7 Lớp Rào Chắn Cho Script

> **Nguyên tắc Defense in Depth:** Không dựa vào 1 rào chắn duy nhất.
> Xếp chồng nhiều lớp → 1 lớp bị vượt, lớp tiếp theo vẫn chặn.

### 4.1. Chế độ Auto-Execute (Tầng 1 — Platform Level)

Thiết lập trong **Settings → Terminal Command Auto Execution**:

| Chế độ | Mô tả | Khi nào dùng |
| --- | --- | --- |
| **Off** | AI KHÔNG BAO GIỜ tự chạy lệnh — luôn hỏi bạn | 🥇 An toàn nhất, khuyến khích cho production |
| **Auto** | AI tự đánh giá rủi ro — dừng hỏi nếu nghi ngờ | Cân bằng tốc độ vs an toàn |
| **Turbo** | AI tự chạy MỌI lệnh không hỏi | ⚠️ CHỈ cho sandbox cách ly hoàn toàn |

### 4.2. Allow List (Tầng 2 — Positive Security)

Mô hình "Mọi thứ CẤM trừ khi ĐƯỢC PHÉP" — **an toàn nhất khi dùng với chế độ Off**.

**Cách thiết lập:**

1. Mở Settings → Terminal → Allow List Terminal Commands
2. Thêm các lệnh an toàn (chỉ đọc, không thay đổi hệ thống):

```text
# Lệnh an toàn — được tự động chạy
ls -al
python --version
python scripts/*.py --help
cat *.md
git status
git log -n 10
git diff --stat

# Mọi lệnh khác → AI PHẢI xin phép → Bạn phê duyệt thủ công
```

1. **Restart Antigravity** sau khi thay đổi (Allow List cần restart để có hiệu lực)

### 4.3. Deny List (Tầng 3 — Negative Security)

Mô hình "Mọi thứ ĐƯỢC PHÉP trừ khi BỊ CẤM" — chốt chặn cho chế độ Auto/Turbo.

```text
# Lệnh nguy hiểm — TUYỆT ĐỐI CẤM tự động chạy
rm -rf
sudo
curl | bash
wget | sh
DROP TABLE
DELETE FROM
TRUNCATE
shutdown
reboot
chmod 777
```

### 4.4. Secure Mode + Directory Permissions (Tầng 4 — File System Level)

Cấp quyền chính xác **ở cấp thư mục** — AI chỉ truy cập được phạm vi cho phép:

| Quyền | Thiết lập | Ví dụ |
| --- | --- | --- |
| **Đọc** | Cho phép đọc file trong thư mục dự án | `~/projects/my-app/` |
| **Ghi** | Chỉ cho phép ghi vào thư mục output | `~/projects/my-app/output/` |
| **Cấm** | Cấm truy cập thư mục hệ thống | `/etc/`, `/usr/`, `C:\Windows\` |

**Best Practice: Review-driven Development**

- Bật Secure Mode → AI PHẢI tạo **kế hoạch** trước
- AI trình bày: "Em sẽ làm 3 bước: [1]... [2]... [3]..."
- Bạn review → Phê duyệt → AI mới được thực thi
- Mỗi lệnh đều được log → Bạn biết chính xác AI đã làm gì

### 4.5. Browser Security (Tầng 5 — Network Level)

Nếu skill có script truy cập web → Rủi ro **Prompt Injection** (trang web độc hại tiêm lệnh vào AI):

**Phòng ngừa:**

| Biện pháp | Cách thiết lập | Rủi ro ngăn chặn |
| --- | --- | --- |
| **JavaScript Policy** | Settings → Browser → JS: "Request review" hoặc "Disabled" | Malicious JS khai thác AI |
| **Browser URL Allowlist** | Thêm domains tin cậy vào `~/.gemini/antigravity/browserAllowlist.txt` | AI truy cập trang lạ |
| **Không chạy `curl \| bash`** | Deny List (mục 4.3) | Remote code execution |

```text
# Ví dụ browserAllowlist.txt
github.com
stackoverflow.com
docs.python.org
your-internal-wiki.company.com
```

→ AI chỉ được duyệt web trên các domain đã liệt kê. Mọi domain khác bị chặn.

### 4.6. Viết Safety Check trong SKILL.md (Tầng 6 — Skill Level)

```markdown
# Instructions

## Bước 0: 🛡️ Safety Check (BẮT BUỘC trước mọi thao tác)
1. Kiểm tra môi trường:
   - **Nếu** production → BẮT BUỘC confirm từ user trước khi chạy script
   - **Nếu** script chứa lệnh `rm`, `delete`, `drop` → Cảnh báo + confirm
2. Kiểm tra script tồn tại:
   - Chạy: `ls scripts/` → Script có trong danh sách không?
   - Nếu KHÔNG → Báo user: "Script không tồn tại"
3. Nếu lần đầu chạy script → Chạy `--dry-run` (nếu hỗ trợ) trước
4. Nếu script cần truy cập web → Kiểm tra URL có trong Browser Allowlist không
```

### 4.7. Constraints trong SKILL.md (Tầng 7 — Hard Rules)

```markdown
# Constraints

## Bảo mật (ưu tiên #1 — TUYỆT ĐỐI):
- 🚫 TUYỆT ĐỐI KHÔNG chạy script trên production mà không confirm
- 🚫 TUYỆT ĐỐI KHÔNG đọc mã nguồn script (dùng `--help`)
- 🚫 TUYỆT ĐỐI KHÔNG truy cập URL ngoài Allowlist

## Vận hành (ưu tiên #2):
- ✅ LUÔN LUÔN kiểm tra exit code sau khi chạy script
- ✅ LUÔN LUÔN chạy `--dry-run` trước nếu hỗ trợ
- ✅ LUÔN LUÔN báo user kết quả (thành công LẪN thất bại)
```

### 📊 Tổng quan 7 Lớp Bảo Mật

```text
┌─────────────────────────────────────────┐
│  Tầng 7: Constraints (SKILL.md)         │ ← Quy tắc cứng trong skill
│  Tầng 6: Safety Check (SKILL.md)        │ ← Logic kiểm tra trước khi chạy
│  Tầng 5: Browser Security               │ ← URL Allowlist + JS Policy
│  Tầng 4: Secure Mode + Dir Permissions  │ ← Quyền file system
│  Tầng 3: Deny List                      │ ← Lệnh bị cấm
│  Tầng 2: Allow List                     │ ← Lệnh được phép
│  Tầng 1: Auto-Execute Mode              │ ← Off/Auto/Turbo
└─────────────────────────────────────────┘
```

---

## 5. Template SKILL.md Với Script

```markdown
---
name: <tên-skill>
description: |
  <Mô tả skill>. Sử dụng script `scripts/<tên>.py` để <hành động>.
  Kích hoạt khi user nói "...", "...", "...".
---

# Goal
<Mục tiêu>

# Instructions

## Bước 0: 🛡️ Safety Check (nếu cần)
1. Xác định môi trường (dev/staging/prod)
2. Nếu production → Confirm từ user

## Bước 1: Thu thập tham số
1. Phân tích yêu cầu user
2. Trích xuất: <tham số 1>, <tham số 2>

## Bước 2: Thực thi Script
1. Chạy: `python scripts/<tên>.py --param1 <giá trị> --param2 <giá trị>`
2. Đọc output từ stdout

## Bước 3: Xử lý kết quả
1. Nếu exit code = 0 → Thành công → Hiển thị output cho user
2. Nếu exit code ≠ 0 → Lỗi → Phân tích stderr → Báo user

## Bảng ánh xạ tham số

| User nói | Cờ script | Giá trị |
| --- | --- | --- |
| "<phrase A>" | `--param1` | `<value A>` |
| "<phrase B>" | `--param2` | `<value B>` |

# Examples

## Ví dụ 1: Chạy thành công
**Input:** "<user request>"
**Lệnh được sinh:** `python scripts/<tên>.py --param1 X --param2 Y`
**Output:**
<Kết quả thành công>

## Ví dụ 2: Lỗi xảy ra
**Input:** "<user request có vấn đề>"
**Output:**
⚠️ Script báo lỗi: <mô tả lỗi>
💡 Gợi ý: <cách fix>

# Constraints
- 🚫 KHÔNG ĐƯỢC đọc mã nguồn script (dùng `--help`)
- 🚫 KHÔNG ĐƯỢC chạy script trên production mà không confirm
- ✅ LUÔN LUÔN kiểm tra exit code sau khi chạy script
- ✅ LUÔN LUÔN chạy `--dry-run` trước nếu có hỗ trợ
```

---

## 6. Viết Script Chuẩn Cho Skill

### Checklist script tốt

- [ ] Dùng `argparse` (Python) hoặc flags tương đương
- [ ] Có `--help` mô tả rõ ràng từng cờ
- [ ] Có `--dry-run` cho thao tác destructive
- [ ] Output qua stdout (khuyến khích JSON cho dữ liệu có cấu trúc)
- [ ] Error output qua stderr
- [ ] Exit code: `0` = thành công, `≠0` = lỗi
- [ ] Không hardcode credentials (dùng env vars hoặc config file)
- [ ] Có error handling (try/except, ||, set -e)
- [ ] Đọc input từ file hoặc stdin (không interactive prompts)
- [ ] Cross-platform compatible (hoặc ghi rõ OS requirement)

### Template Python Script

```python
#!/usr/bin/env python3
"""
<tên_script>.py — <mô tả ngắn>

Sử dụng:
    python scripts/<tên_script>.py --help
    python scripts/<tên_script>.py --param1 value1 --param2 value2
"""

import argparse
import sys
import json


def main():
    parser = argparse.ArgumentParser(
        description="<Mô tả script chi tiết>"
    )
    parser.add_argument('--input', required=True,
                        help='Đường dẫn file đầu vào')
    parser.add_argument('--format', choices=['json', 'csv', 'text'],
                        default='json',
                        help='Định dạng output (mặc định: json)')
    parser.add_argument('--dry-run', action='store_true',
                        help='Chỉ mô phỏng, không thay đổi gì')
    parser.add_argument('--verbose', action='store_true',
                        help='Hiển thị thông tin chi tiết')
    
    args = parser.parse_args()
    
    try:
        # === Logic chính ===
        if args.verbose:
            print(f"📌 Input: {args.input}", file=sys.stderr)
            print(f"📌 Format: {args.format}", file=sys.stderr)
        
        if args.dry_run:
            print("⚠️ DRY RUN — Không có gì thực sự thay đổi.")
            sys.exit(0)
        
        # Xử lý...
        result = {"status": "success", "message": "Hoàn thành!"}
        
        # Output
        if args.format == 'json':
            print(json.dumps(result, ensure_ascii=False, indent=2))
        else:
            print(result['message'])
        
        sys.exit(0)
        
    except FileNotFoundError:
        print(f"❌ Không tìm thấy file: {args.input}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"❌ Lỗi: {e}", file=sys.stderr)
        sys.exit(2)


if __name__ == '__main__':
    main()
```

### Template Bash Script

```bash
#!/bin/bash
# <tên_script>.sh — <mô tả ngắn>
#
# Sử dụng:
#   ./scripts/<tên_script>.sh [options]
#
# Options:
#   -e, --env       Môi trường (dev/staging/prod)
#   -d, --dry-run   Chỉ mô phỏng
#   -h, --help      Hiển thị hướng dẫn

set -euo pipefail

# === Defaults ===
ENV="dev"
DRY_RUN=false

# === Parse Arguments ===
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--env)
            ENV="$2"
            shift 2
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [--env dev|staging|prod] [--dry-run]"
            echo ""
            echo "Options:"
            echo "  -e, --env       Môi trường deploy (default: dev)"
            echo "  -d, --dry-run   Chỉ mô phỏng"
            echo "  -h, --help      Hiển thị help"
            exit 0
            ;;
        *)
            echo "❌ Unknown option: $1" >&2
            exit 1
            ;;
    esac
done

# === Main ===
echo "🚀 Environment: $ENV"

if [ "$DRY_RUN" = true ]; then
    echo "⚠️ DRY RUN — Không thay đổi gì."
    exit 0
fi

# Xử lý chính...
echo "✅ Done!"
exit 0
```

---

## 7. Quyết Định: Khi Nào CẦN Script, Khi Nào KHÔNG?

| Tình huống | Cần Script? | Lý do |
| --- | --- | --- |
| Tính toán phức tạp (tài chính, thống kê) | ✅ CẦN | AI hay tính sai số lớn |
| Đọc/ghi file hệ thống | ✅ CẦN | AI không trực tiếp truy cập filesystem |
| Gọi API bên ngoài | ✅ CẦN | Script xử lý auth, retry, error |
| Validate dữ liệu phức tạp (regex, schema) | ✅ CẦN | Script chính xác hơn AI |
| Deploy / CI/CD | ✅ CẦN | Script chạy npm, docker, etc. |
| Sinh text/markdown | ❌ KHÔNG | AI giỏi việc này rồi |
| Tư vấn / phân tích logic | ❌ KHÔNG | Đây là thế mạnh AI |
| Format / restructure text | ❌ KHÔNG | AI xử lý tốt |
| Q&A / hỏi đáp | ❌ KHÔNG | AI sinh ra để làm việc này |
