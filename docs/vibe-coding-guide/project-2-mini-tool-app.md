# Dự Án 2: Invoice Generator PWA ★★☆

> **Mục tiêu:** Xây dựng web app tạo hóa đơn chuyên nghiệp, responsive, hoạt động offline, đa ngôn ngữ — sử dụng TDD workflow và CRO tracking.

---

## Tổng Quan

```
┌─────────────────────────────────────────────────────────────┐
│                   Invoice Generator PWA                      │
│                                                              │
│  ┌─────────────────┐  ┌──────────────────────────────────┐  │
│  │  Sidebar         │  │  Main Content                    │  │
│  │                  │  │                                   │  │
│  │  📄 New Invoice  │  │  ┌─────────────────────────────┐ │  │
│  │  📋 History      │  │  │  Invoice Form               │ │  │
│  │  ⚙️ Settings     │  │  │                             │ │  │
│  │  🌐 Language     │  │  │  From: ___________          │ │  │
│  │                  │  │  │  To:   ___________          │ │  │
│  │                  │  │  │                             │ │  │
│  │  ┌────────────┐ │  │  │  Items:                     │ │  │
│  │  │ Recent     │ │  │  │  ┌────┬──────┬────┬──────┐ │ │  │
│  │  │ INV-001    │ │  │  │  │ #  │ Desc │ Qty│ Price│ │ │  │
│  │  │ INV-002    │ │  │  │  ├────┼──────┼────┼──────┤ │ │  │
│  │  │ INV-003    │ │  │  │  │ 1  │ ...  │ 2  │ $100 │ │ │  │
│  │  └────────────┘ │  │  │  └────┴──────┴────┴──────┘ │ │  │
│  └─────────────────┘  │  │                             │ │  │
│                        │  │  [Preview] [Download PDF]  │ │  │
│                        │  └─────────────────────────────┘ │  │
│                        └──────────────────────────────────┘  │
│                                                              │
│  Stack: React 18 + Tailwind + Vite                          │
│  Data:  LocalStorage (no backend)                            │
│  Deploy: Cloudflare Pages                                    │
└─────────────────────────────────────────────────────────────┘
```

### Tại sao dự án này?
- **50M+ searches/tháng** cho "free invoice generator"
- **Không cần backend** — chạy hoàn toàn client-side
- **PWA installable** — dùng như app native
- **Monetizable:** Freemium model, affiliate, ads
- **Học TDD thực tế** — logic tính toán phức tạp cần test

---

## Kiến Thức Mới So Với Dự Án 1

| Dự Án 1 đã học | Dự Án 2 sẽ học thêm |
|-----------------|---------------------|
| HTML/CSS tĩnh | React components + state |
| Copy cơ bản | UX Laws cho form design |
| Test thủ công | TDD (Red-Green-Refactor) |
| Deploy đơn giản | CI/CD pipeline |
| 1 ngôn ngữ | i18n (EN/VI) |
| — | PWA + offline |
| — | CRO + conversion tracking |
| — | Code review workflow |

---

## Phase 1: Setup (30 phút)

### Bước 1.1 — Identity Guard

> **Skill:** `cm-identity-guard`

📌 PROMPT:
```
Sử dụng cm-identity-guard để xác minh GitHub account.
Project: invoice-generator-pwa
Deploy target: Cloudflare Pages
```

### Bước 1.2 — Bootstrap Project

> **Skill:** `cm-project-bootstrap`

📌 PROMPT:
```
Sử dụng cm-project-bootstrap để khởi tạo React project.
Stack: React 18 + Vite + Tailwind CSS.
Features: PWA manifest, service worker, eslint, prettier.
Deploy target: Cloudflare Pages.
Testing: Vitest + Testing Library.
Cấu trúc: feature-based (không phải flat).
```

### Cấu trúc mong đợi
```
invoice-generator/
├── public/
│   ├── manifest.json
│   ├── sw.js
│   └── icons/
├── src/
│   ├── features/
│   │   ├── invoice/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── utils/
│   │   │   └── __tests__/
│   │   ├── history/
│   │   └── settings/
│   ├── shared/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── i18n/
│   │   └── utils/
│   ├── App.tsx
│   └── main.tsx
├── .github/
│   └── workflows/
│       └── ci.yml
├── tailwind.config.js
├── vite.config.ts
├── vitest.config.ts
└── package.json
```

✅ CHECKPOINT:
- [ ] `npm run dev` chạy thành công
- [ ] `npm run test` pass (0 tests)
- [ ] PWA manifest hiện trong DevTools > Application
- [ ] Tailwind classes hoạt động

---

## Phase 2: Planning & Design (1 giờ)

### Bước 2.1 — Lên Kế Hoạch

> **Skill:** `cm-planning`

📌 PROMPT:
```
Sử dụng cm-planning để lên kế hoạch cho Invoice Generator PWA.

User stories:
1. Tạo invoice mới với thông tin người gửi, người nhận, line items
2. Tự động tính subtotal, tax, total
3. Preview invoice trước khi download
4. Download PDF
5. Lưu invoice history (LocalStorage)
6. Upload logo công ty
7. Chọn currency (USD, VND, EUR)
8. Đa ngôn ngữ (EN/VI)
9. Dark/Light mode
10. Hoạt động offline

Ưu tiên: MVP trước (stories 1-5), rồi enhancement (6-10).
Tạo tasks.md với breakdown chi tiết.
```

### Bước 2.2 — UX Design

> **Skill:** `cm-ux-master`

📌 PROMPT:
```
Sử dụng cm-ux-master để phân tích UX cho Invoice Generator form.
Áp dụng UX Laws:
- Hick's Law: Giảm số lựa chọn trên mỗi bước
- Miller's Law: Chunk thông tin thành groups
- Fitts' Law: CTA buttons đủ lớn, dễ click
- Jakob's Law: Tuân theo convention của invoice tools phổ biến

Cần output:
1. Wireframe mô tả (text-based)
2. Form flow tối ưu
3. Error handling UX
4. Mobile-first layout decisions
```

### Bước 2.3 — Design System

> **Skill:** `cm-design-system`

📌 PROMPT:
```
Sử dụng cm-design-system để tạo component system cho React app.
Base: Tailwind CSS utility classes.
Components cần thiết:
- Button (primary, secondary, ghost, danger)
- Input (text, number, textarea)
- Card
- Table
- Modal
- Toast notification
- Dropdown/Select
- Toggle (dark mode)
Xuất DESIGN.md + Tailwind config extensions.
```

✅ CHECKPOINT:
- [ ] OpenSpec tasks.md có breakdown rõ ràng
- [ ] Wireframe flow logic hợp lý
- [ ] DESIGN.md có đủ component specs
- [ ] Tailwind config đã extend

---

## Phase 3: TDD Implementation (3-4 giờ)

> **Nguyên tắc:** Viết test TRƯỚC → Chạy test (RED) → Viết code vừa đủ (GREEN) → Refactor

### Bước 3.1 — Invoice Calculator (TDD)

> **Skill:** `cm-tdd`

📌 PROMPT:
```
Sử dụng cm-tdd để implement invoice calculator.
Strict Red-Green-Refactor — không viết production code trước test.

Test cases cần cover:
1. Tính subtotal từ line items (qty × price)
2. Tính tax (configurable %)
3. Tính discount (fixed amount hoặc %)
4. Tính grand total = subtotal - discount + tax
5. Handle edge cases: empty items, 0 qty, negative values
6. Currency formatting (USD, VND, EUR)
7. Rounding (2 decimal places)

File: src/features/invoice/utils/calculator.ts
Test: src/features/invoice/__tests__/calculator.test.ts
```

⚡ LỆNH (sau mỗi cycle):
```bash
npm run test -- --watch
```

### Bước 3.2 — Invoice Form Components (TDD)

📌 PROMPT:
```
Tiếp tục cm-tdd cho Invoice Form components.

Test cases:
1. LineItemRow: render fields, update values, delete row
2. LineItemTable: add row, remove row, reorder
3. InvoiceForm: fill all fields, calculate realtime
4. CompanyInfo: input sender/receiver info
5. FormValidation: required fields, email format, phone

Mỗi component: test trước → code sau → refactor.
```

### Bước 3.3 — PDF Generation (TDD)

📌 PROMPT:
```
Tiếp tục cm-tdd cho PDF generation.
Library: jsPDF hoặc @react-pdf/renderer.

Test cases:
1. Generate PDF từ invoice data
2. PDF chứa đúng company info
3. PDF chứa đúng line items + totals
4. PDF có logo (nếu uploaded)
5. PDF filename format: INV-{number}-{date}.pdf
```

### Bước 3.4 — LocalStorage Persistence (TDD)

📌 PROMPT:
```
Tiếp tục cm-tdd cho storage layer.

Test cases:
1. Save invoice to LocalStorage
2. Load invoice list
3. Load single invoice by ID
4. Delete invoice
5. Auto-save draft mỗi 30 giây
6. Handle storage full error
7. Export all invoices as JSON
8. Import invoices from JSON
```

✅ CHECKPOINT sau mỗi TDD cycle:
- [ ] Test coverage > 80% cho utils
- [ ] Test coverage > 70% cho components
- [ ] `npm run test` all green
- [ ] No console warnings/errors

---

## Phase 4: i18n (45 phút)

> **Skill:** `cm-safe-i18n`

📌 PROMPT:
```
Sử dụng cm-safe-i18n để thêm đa ngôn ngữ cho Invoice Generator.
Ngôn ngữ: English (default) + Tiếng Việt.

Batch rules:
- Max 30 strings/batch
- 8 audit gates sau mỗi batch

Cần translate:
1. UI labels (buttons, headers, placeholders)
2. Validation messages
3. PDF template text
4. Toast notifications
5. Settings labels

Library: react-i18next hoặc lightweight custom hook.
File structure: src/shared/i18n/{en,vi}.json
```

✅ CHECKPOINT:
- [ ] Toggle EN/VI hoạt động real-time
- [ ] Không có hardcoded text trong components
- [ ] PDF generate đúng ngôn ngữ đang chọn
- [ ] Validation messages đúng ngôn ngữ

---

## Phase 5: Code Quality (30 phút)

### Bước 5.1 — Clean Code

> **Skill:** `cm-clean-code`

📌 PROMPT:
```
Sử dụng cm-clean-code để audit toàn bộ codebase.
Kiểm tra 7 điểm:
1. Dead code
2. Duplicate code
3. Naming conventions
4. Code smells
5. Function length (max 20 lines)
6. Component complexity
7. Import organization
```

### Bước 5.2 — Code Review

> **Skill:** `cm-code-review`

📌 PROMPT:
```
Sử dụng cm-code-review để tự review code trước khi deploy.
Focus: security, performance, accessibility.
Đặc biệt kiểm tra:
- XSS trong user input (company name, item descriptions)
- LocalStorage data validation
- PDF generation memory leaks
- Image upload size limits
```

✅ CHECKPOINT:
- [ ] 0 dead code
- [ ] 0 duplicate logic
- [ ] Naming nhất quán
- [ ] No security issues

---

## Phase 6: CRO & Growth (45 phút)

### Bước 6.1 — Conversion Optimization

> **Skill:** `cm-cro-methodology`

📌 PROMPT:
```
Sử dụng cm-cro-methodology để tối ưu conversion cho Invoice Generator.
Mục tiêu conversion: Download PDF (primary), Install PWA (secondary).

Phân tích:
1. User flow từ landing → create invoice → download
2. Điểm drop-off tiềm năng
3. Persuasion elements cần thêm
4. Friction points cần loại bỏ

Output: Danh sách ICE-scored improvements.
```

### Bước 6.2 — Growth Hacking

> **Skill:** `cm-growth-hacking`

📌 PROMPT:
```
Sử dụng cm-growth-hacking để thêm growth elements.
Cần:
1. "Install App" bottom sheet (PWA prompt)
2. "Upgrade to Pro" popup sau 5 invoices
3. Social share button sau download PDF
4. Email capture form cho tips & updates
Tất cả zero-dependency, responsive.
```

### Bước 6.3 — Tracking Setup

> **Skill:** `cm-ads-tracker`

📌 PROMPT:
```
Sử dụng cm-ads-tracker để setup conversion tracking.
Events cần track:
1. page_view
2. invoice_created
3. pdf_downloaded
4. pwa_installed
5. language_changed
6. pro_popup_shown / pro_popup_clicked

Setup: Google Analytics 4 (GA4) via gtag.js
GTM dataLayer events cho future expansion.
```

✅ CHECKPOINT:
- [ ] Growth elements hiển thị đúng timing
- [ ] GA4 nhận events trong Realtime report
- [ ] dataLayer events fire đúng

---

## Phase 7: Deploy (30 phút)

### Bước 7.1 — CI/CD Setup

File `.github/workflows/ci.yml`:
```yaml
name: CI/CD
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run test -- --coverage
      - run: npm run build
      - name: Deploy to Cloudflare Pages
        if: github.ref == 'refs/heads/main'
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          accountId: ${{ secrets.CF_ACCOUNT_ID }}
          projectName: invoice-generator
          directory: dist
```

### Bước 7.2 — Safe Deploy

> **Skill:** `cm-safe-deploy`

📌 PROMPT:
```
Sử dụng cm-safe-deploy để deploy lên Cloudflare Pages.
8 cổng đầy đủ:
1. Secret Hygiene — scan secrets trong code
2. Security Scan — dependency audit
3. Syntax Check — TypeScript compile
4. Test Gate — npm run test
5. i18n Check — verify en.json + vi.json sync
6. Build — npm run build
7. Dist Verify — check dist/ output
8. Deploy + Smoke — deploy CF Pages + verify live URL
```

✅ CHECKPOINT CUỐI CÙNG:
- [ ] CI/CD pipeline green
- [ ] Live URL trên `*.pages.dev`
- [ ] PWA installable (test trên mobile)
- [ ] Offline mode hoạt động
- [ ] PDF download hoạt động
- [ ] i18n EN/VI hoạt động
- [ ] Tracking events fire

---

## Kết Quả Đạt Được

```
✅ Đã học thêm so với Dự Án 1:
├── React component architecture
├── TDD workflow thực tế (cm-tdd)
├── UX Laws áp dụng cho form design (cm-ux-master)
├── i18n đa ngôn ngữ (cm-safe-i18n)
├── Code quality audit (cm-clean-code + cm-code-review)
├── CRO methodology (cm-cro-methodology)
├── Growth hacking elements (cm-growth-hacking)
├── Conversion tracking (cm-ads-tracker)
├── CI/CD pipeline (GitHub Actions)
├── PWA + Service Worker
├── PDF generation
└── Client-side data persistence

✅ Portfolio piece:
├── Full-featured web app
├── Installable PWA
├── Dual language support
├── Professional UI/UX
├── 80%+ test coverage
└── Live production URL
```

---

## Nâng Cấp (Tùy Chọn)

| Nâng cấp | Skill hỗ trợ | Thời gian |
|-----------|--------------|-----------|
| Template gallery (5+ designs) | `cm-design-system` | 2 giờ |
| Recurring invoices | `cm-tdd` | 2 giờ |
| Client management | `cm-planning` | 3 giờ |
| Email invoice (mailto:) | — | 1 giờ |
| QR code trên invoice | — | 1 giờ |
| Multi-currency realtime rates | — | 2 giờ |

---

## Tiếp Theo

Khi đã master TDD + frontend architecture, sẵn sàng cho full-stack:
**[Dự Án 3: Booking Platform SaaS →](./project-3-fullstack-saas.md)**
