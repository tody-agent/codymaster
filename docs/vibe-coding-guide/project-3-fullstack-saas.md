# Dự Án 3: Booking Platform SaaS ★★★

> **Mục tiêu:** Xây dựng hệ thống đặt lịch full-stack cho salon/spa/phòng khám — auth, realtime, multi-tenant, CI/CD chuyên nghiệp.

---

## Tổng Quan Kiến Trúc

```
┌──────────────────────────────────────────────────────────────────┐
│                    Booking Platform SaaS                          │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  PUBLIC BOOKING PAGE (cho khách hàng)                       │ │
│  │  ┌──────────┐ ┌──────────────┐ ┌─────────────────────────┐ │ │
│  │  │ Business │ │ Service List │ │ Calendar + Time Slots   │ │ │
│  │  │ Profile  │ │              │ │ ┌───┬───┬───┬───┬───┐   │ │ │
│  │  │          │ │ ✂ Haircut   │ │ │Mon│Tue│Wed│Thu│Fri│   │ │ │
│  │  │  [Logo]  │ │ 💅 Nails    │ │ │ 9 │   │ 9 │   │ 9 │   │ │ │
│  │  │          │ │ 💆 Massage  │ │ │10 │10 │10 │10 │10 │   │ │ │
│  │  │  ⭐⭐⭐⭐  │ │              │ │ │11 │11 │   │11 │11 │   │ │ │
│  │  └──────────┘ └──────────────┘ │ └───┴───┴───┴───┴───┘   │ │ │
│  │                                 │  [Book Now]              │ │ │
│  │                                 └─────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  DASHBOARD (cho business owner)                             │ │
│  │  ┌────────────────────────────────────────────────────────┐ │ │
│  │  │  Today: 12 bookings │ Revenue: $840 │ No-show: 1     │ │ │
│  │  ├────────────────────────────────────────────────────────┤ │ │
│  │  │  Calendar View │ List View │ Analytics                 │ │ │
│  │  │  ┌─────────────────────────────────┐                   │ │ │
│  │  │  │ 09:00  Alice → Haircut  ✅      │                   │ │ │
│  │  │  │ 10:00  Bob → Massage    🔄      │                   │ │ │
│  │  │  │ 11:00  Carol → Nails    ⏳      │                   │ │ │
│  │  │  │ 14:00  (available)              │                   │ │ │
│  │  │  └─────────────────────────────────┘                   │ │ │
│  │  └────────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  Stack: Next.js 14 + Supabase + Cloudflare                      │
└──────────────────────────────────────────────────────────────────┘
```

### Tại sao dự án này?
- **Thị trường $500B+ toàn cầu** — appointment scheduling
- **Revenue model rõ ràng:** $30-$200/tháng/business
- **Giảm 30-60% no-show** bằng calendar reminders
- **Multi-tenant SaaS** — 1 codebase phục vụ nhiều business
- **Học full-stack thực tế** — auth, database, realtime, security

---

## Kiến Thức Mới So Với Dự Án 2

| Dự Án 2 đã học | Dự Án 3 sẽ học thêm |
|-----------------|---------------------|
| Client-side state | Server state + Realtime |
| LocalStorage | PostgreSQL + Row Level Security |
| No auth | Supabase Auth (Email + OAuth) |
| Single-page app | Multi-page App Router |
| Simple CI/CD | Full pipeline + canary deploy |
| Manual testing | E2E + Security audit |
| — | Sprint planning workflow |
| — | Working memory (continuity) |
| — | Parallel execution |
| — | Multi-tenant architecture |

---

## Tech Stack Chi Tiết

```
Frontend:
├── Next.js 14 (App Router + Server Components)
├── Tailwind CSS + shadcn/ui
├── TanStack Query (server state)
├── date-fns (date handling)
└── react-big-calendar (calendar view)

Backend:
├── Supabase
│   ├── PostgreSQL (database)
│   ├── Auth (email + Google OAuth)
│   ├── Realtime (live booking updates)
│   ├── Storage (logos, images)
│   └── Edge Functions (email notifications)
├── Cloudflare
│   ├── DNS + CDN
│   ├── Pages (hosting)
│   └── Workers (cron jobs)
└── GitHub Actions (CI/CD)

Testing:
├── Vitest (unit + integration)
├── Playwright (E2E)
└── Snyk (security scanning)
```

---

## Sprint Plan (4 Sprints)

```
Sprint 1: Foundation (4h)         Sprint 2: Core Features (6h)
├── Setup + Auth                   ├── Booking flow
├── Database schema                ├── Calendar view
├── RLS policies                   ├── Service management
└── Basic layouts                  └── Notifications

Sprint 3: Polish (4h)             Sprint 4: Ship (4h)
├── i18n (EN/VI/JA)               ├── Security audit
├── CRO optimization              ├── Performance tuning
├── Analytics + tracking           ├── CI/CD pipeline
└── Dark mode                      └── Deploy + canary
```

---

## Sprint 1: Foundation (4 giờ)

### Bước 1.1 — Identity & Bootstrap

> **Skills:** `cm-identity-guard` + `cm-project-bootstrap`

📌 PROMPT:
```
Sử dụng cm-identity-guard để xác minh:
- GitHub account
- Cloudflare account
- Supabase project

Sau đó cm-project-bootstrap để khởi tạo:
Stack: Next.js 14 (App Router) + Tailwind + shadcn/ui
Testing: Vitest + Playwright
Deploy: Cloudflare Pages
Database: Supabase
Cần: .env.example, AGENTS.md, CI workflow
```

### Bước 1.2 — Strategic Analysis

> **Skill:** `cm-brainstorm-idea`

📌 PROMPT:
```
Sử dụng cm-brainstorm-idea để phân tích Booking Platform SaaS.
Phương pháp: TRIZ 9 Windows + Double Diamond.

Input:
- Target: Salon, spa, phòng khám nhỏ (1-10 staff)
- Pain: Quản lý lịch bằng sổ/Excel, nhiều no-show, khó theo dõi revenue
- Competitors: Calendly, Acuity, Booksy

Output cần:
1. 2-3 options đánh giá multi-dimensional
2. MVP scope recommendation
3. Differentiators
```

### Bước 1.3 — Sprint Planning

> **Skills:** `cm-planning` + `cm-sprint-bus`

📌 PROMPT:
```
Sử dụng cm-planning Phase A (brainstorm) rồi Phase B (write plan).

Sau đó cm-sprint-bus để setup sprint pipeline:
Sprint 1 tasks:
- T1.1: Supabase project setup + schema
- T1.2: Auth (email + Google)
- T1.3: RLS policies
- T1.4: Layout components (sidebar, header, page shell)
- T1.5: Dashboard skeleton
- T1.6: Public booking page skeleton

Lưu artifacts vào .cm/sprint/
```

### Bước 1.4 — Database Schema

> **Skill:** `cm-tdd` (test schema migrations)

📌 PROMPT:
```
Sử dụng cm-tdd để thiết kế và test database schema.

Tables cần:
1. businesses (id, name, slug, owner_id, settings JSONB)
2. services (id, business_id, name, duration_min, price, currency)
3. staff (id, business_id, user_id, name, role)
4. availability (id, staff_id, day_of_week, start_time, end_time)
5. bookings (id, business_id, service_id, staff_id, customer_email,
   customer_name, start_at, end_at, status, notes)
6. customers (id, business_id, email, name, phone, total_bookings)

Indexes: bookings(business_id, start_at), bookings(status)
Enums: booking_status (pending, confirmed, completed, cancelled, no_show)
```

SQL Migration:
```sql
-- supabase/migrations/001_initial_schema.sql

-- Enum types
CREATE TYPE booking_status AS ENUM
  ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');

CREATE TYPE staff_role AS ENUM ('owner', 'admin', 'staff');

-- Businesses
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES auth.users(id) NOT NULL,
  settings JSONB DEFAULT '{}',
  timezone TEXT DEFAULT 'Asia/Ho_Chi_Minh',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner sees own business"
  ON businesses FOR ALL
  USING (auth.uid() = owner_id);

-- Services
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration_min INT NOT NULL DEFAULT 30,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business owner manages services"
  ON services FOR ALL
  USING (business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  ));
CREATE POLICY "Public reads active services"
  ON services FOR SELECT
  USING (is_active = true);

-- Bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id),
  staff_id UUID REFERENCES auth.users(id),
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  status booking_status DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business owner sees bookings"
  ON bookings FOR ALL
  USING (business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  ));
CREATE POLICY "Customer sees own bookings"
  ON bookings FOR SELECT
  USING (customer_email = current_setting('request.jwt.claims')::json->>'email');

CREATE INDEX idx_bookings_business_date ON bookings(business_id, start_at);
CREATE INDEX idx_bookings_status ON bookings(status);
```

### Bước 1.5 — Auth Setup

📌 PROMPT:
```
Setup Supabase Auth cho Next.js App Router.
Cần:
1. Email/Password sign up + sign in
2. Google OAuth
3. Middleware bảo vệ /dashboard/* routes
4. Public routes: / , /book/[slug]
5. Auth context provider
6. Login/Register pages với shadcn/ui form

Sử dụng @supabase/ssr cho server-side auth.
```

### Bước 1.6 — Layout Components

📌 PROMPT:
```
Tạo layout components cho dashboard:
1. Sidebar: logo, nav links (Dashboard, Bookings, Services, Settings), collapse on mobile
2. Header: business name, user avatar dropdown, notifications bell
3. PageShell: breadcrumb + title + action buttons + content area

Tạo layout cho public booking page:
1. Business header: logo, name, rating
2. Booking steps: Service → Date/Time → Confirm
3. Footer: powered by link

Tất cả responsive, dark mode ready.
```

✅ CHECKPOINT Sprint 1:
- [ ] `npm run dev` chạy thành công
- [ ] Auth flow hoạt động (register → login → dashboard)
- [ ] Google OAuth hoạt động
- [ ] Database tables đã migrate
- [ ] RLS policies hoạt động (test với 2 users khác nhau)
- [ ] Dashboard layout render đúng
- [ ] Public booking page skeleton hoạt động tại `/book/[slug]`

---

## Sprint 2: Core Features (6 giờ)

### Bước 2.1 — Service Management (TDD)

> **Skills:** `cm-tdd` + `cm-execution`

📌 PROMPT:
```
Sử dụng cm-tdd cho Service Management CRUD.
Sau đó cm-execution mode Parallel để code nhanh.

Features:
1. List services (table với sort, filter)
2. Create service (form: name, duration, price, description)
3. Edit service
4. Toggle active/inactive
5. Drag-to-reorder

Test cases:
- CRUD operations qua Supabase client
- Form validation
- Optimistic updates
- Error handling
```

### Bước 2.2 — Booking Calendar Engine

> **Skill:** `cm-booking-calendar`

📌 PROMPT:
```
Sử dụng cm-booking-calendar để tạo booking engine.
Industry: Beauty & Wellness (salon/spa).

Cần:
1. Availability management (owner set working hours per day)
2. Time slot generation (based on service duration)
3. Conflict detection (no double booking)
4. Calendar view cho dashboard (week/day/month)
5. Slot picker cho public booking page
6. ICS export (Google Calendar / Apple Calendar)
7. Timezone support (Asia/Ho_Chi_Minh default)

Anti no-show features:
- Calendar reminder (ICS) thay SMS
- Confirmation email
- Cancel/reschedule link
```

### Bước 2.3 — Public Booking Flow

📌 PROMPT:
```
Implement 3-step booking flow cho khách hàng:

Step 1: Chọn service
- Grid cards với service info (name, duration, price)
- Filter by category (nếu có)

Step 2: Chọn ngày + giờ
- Calendar date picker
- Available time slots (generated from availability - existing bookings)
- Timezone display

Step 3: Confirm
- Booking summary
- Customer info form (name, email, phone, notes)
- "Book Now" button
- Success page với:
  - Booking reference number
  - "Add to Calendar" button (ICS download)
  - "Cancel/Reschedule" link

Toàn bộ flow không cần auth (public).
```

### Bước 2.4 — Realtime Updates

📌 PROMPT:
```
Setup Supabase Realtime cho booking updates.
Cần:
1. Dashboard calendar auto-refresh khi có booking mới
2. Booking status badge update realtime
3. Toast notification khi có booking mới
4. Online/offline indicator

Subscribe to: bookings table changes filtered by business_id.
Sử dụng Supabase Realtime Broadcast.
```

### Bước 2.5 — Email Notifications

📌 PROMPT:
```
Tạo Supabase Edge Functions cho email.
Trigger: INSERT on bookings table.

Emails cần:
1. Booking confirmation → customer
2. New booking alert → business owner
3. Reminder (24h trước) → customer (via pg_cron)
4. Cancellation notice → cả 2 bên

Template: HTML responsive email.
Service: Supabase built-in hoặc Resend.
```

✅ CHECKPOINT Sprint 2:
- [ ] Service CRUD hoạt động đầy đủ
- [ ] Calendar view hiển thị bookings
- [ ] Public booking flow 3 bước hoạt động end-to-end
- [ ] ICS download hoạt động
- [ ] Realtime updates hoạt động (mở 2 tab test)
- [ ] Email notifications gửi thành công
- [ ] Test coverage > 75%

---

## Sprint 3: Polish (4 giờ)

### Bước 3.1 — i18n

> **Skill:** `cm-safe-i18n`

📌 PROMPT:
```
Sử dụng cm-safe-i18n cho 3 ngôn ngữ: EN / VI / JA.
Batch rules: max 30 strings/batch, 8 audit gates.

Scope:
1. Dashboard UI labels
2. Public booking page
3. Email templates
4. Error messages
5. Date/time formatting per locale

Library: next-intl (App Router compatible).
URL strategy: /en/dashboard, /vi/dashboard, /ja/dashboard
Default: detect from browser, fallback EN.
```

### Bước 3.2 — UX Polish

> **Skill:** `cm-ux-master`

📌 PROMPT:
```
Sử dụng cm-ux-master để audit UX toàn bộ app.
Chạy 37 Design Tests:
- Squint test (visual hierarchy)
- 5-second test (first impression)
- Thumb zone test (mobile)
- Error prevention
- Loading states
- Empty states
- Edge cases (0 bookings, 100+ bookings)

Output: Danh sách fixes cần implement, ưu tiên theo impact.
```

### Bước 3.3 — CRO & Analytics

> **Skills:** `cm-cro-methodology` + `cm-ads-tracker`

📌 PROMPT:
```
cm-cro-methodology:
- Phân tích conversion funnel: Visit → View services → Select slot → Book
- Identify friction points
- ICE-scored improvements

cm-ads-tracker:
- GA4 events: page_view, service_viewed, slot_selected, booking_completed
- Meta Pixel: CompleteRegistration (sign up), Schedule (booking)
- UTM tracking cho referral links
- Attribution: first-touch cho organic, last-touch cho paid
```

### Bước 3.4 — Design System Final

> **Skill:** `cm-design-system`

📌 PROMPT:
```
Sử dụng cm-design-system để audit design consistency.
Kiểm tra:
- Dark/light mode toggle
- Tất cả shadcn components dùng đúng design tokens
- Color contrast WCAG AA
- Responsive breakpoints nhất quán
- Animation/transition nhất quán
```

✅ CHECKPOINT Sprint 3:
- [ ] 3 ngôn ngữ hoạt động (EN/VI/JA)
- [ ] Dark mode hoạt động
- [ ] UX issues đã fix
- [ ] Analytics tracking active
- [ ] Design nhất quán across pages

---

## Sprint 4: Ship (4 giờ)

### Bước 4.1 — Security Audit

> **Skills:** `cm-security-gate` + `cm-secret-shield`

📌 PROMPT:
```
cm-security-gate:
- Chạy Snyk CLI scan dependencies
- SAST scan cho code vulnerabilities
- Kiểm tra RLS policies (mỗi table phải có)
- Kiểm tra input sanitization
- Kiểm tra CORS configuration
- Kiểm tra rate limiting

cm-secret-shield:
- Scan toàn bộ repo cho leaked secrets
- Verify .env files trong .gitignore
- Setup pre-commit hooks (gitleaks)
- Kiểm tra Supabase keys không expose ở client
```

### Bước 4.2 — Quality Gate

> **Skills:** `cm-quality-gate` + `cm-code-review`

📌 PROMPT:
```
cm-quality-gate — chạy 4 gates:
1. Test infrastructure: npm run test + playwright test
2. Pre-deploy testing: lint + typecheck + test:coverage > 75%
3. Evidence verification: screenshot proof of key flows
4. Frontend integrity: bundle analysis, no broken imports

cm-code-review — full review:
- Architecture review
- Security review
- Performance review (bundle size, lazy loading, image optimization)
- Accessibility review (ARIA, keyboard nav, screen reader)
```

### Bước 4.3 — CI/CD Pipeline

File `.github/workflows/ci.yml`:
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: 20

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck

  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm
      - run: npm ci
      - run: npm run test -- --coverage
      - uses: actions/upload-artifact@v4
        with:
          name: coverage
          path: coverage/

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npx playwright test
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm
      - run: npm ci
      - run: npm audit --audit-level=high
      - uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  deploy:
    needs: [lint-and-typecheck, unit-tests, e2e-tests, security-scan]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm
      - run: npm ci
      - run: npm run build
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          accountId: ${{ secrets.CF_ACCOUNT_ID }}
          projectName: booking-platform
          directory: .next
```

### Bước 4.4 — Safe Deploy

> **Skills:** `cm-safe-deploy` + `cm-post-deploy-canary`

📌 PROMPT:
```
cm-safe-deploy — 8 cổng:
1. Secret Hygiene — scan repo
2. Security Scan — Snyk + npm audit
3. Syntax — TypeScript strict compile
4. Tests — unit + integration + e2e
5. i18n — verify EN/VI/JA sync
6. Build — next build
7. Dist — verify .next output
8. Deploy — Cloudflare Pages

Sau khi deploy, cm-post-deploy-canary:
- HTTP health check: /, /book/demo-salon
- Check console errors
- Verify API responses
- Check realtime connection
```

### Bước 4.5 — Working Memory

> **Skill:** `cm-continuity`

📌 PROMPT:
```
Sử dụng cm-continuity để lưu working memory.
Cần ghi lại:
1. Architecture decisions
2. Database schema overview
3. Known issues / tech debt
4. Deploy configuration
5. Environment variables list
6. Key file locations

Lưu vào CONTINUITY.md để session sau đọc lại ngay.
```

✅ CHECKPOINT CUỐI CÙNG (TOÀN BỘ DỰ ÁN):

**Functional:**
- [ ] Auth: Register, Login, Google OAuth
- [ ] Dashboard: Overview stats, booking list, calendar view
- [ ] Services: CRUD hoàn chỉnh
- [ ] Availability: Setup working hours
- [ ] Public booking: 3-step flow hoạt động
- [ ] Realtime: Live updates cross-tabs
- [ ] Email: Confirmation + reminder + cancellation
- [ ] ICS: Calendar export hoạt động
- [ ] i18n: EN/VI/JA hoạt động

**Non-functional:**
- [ ] Test coverage > 75%
- [ ] E2E tests pass
- [ ] Security scan clean
- [ ] Lighthouse > 80 all categories
- [ ] RLS policies trên mọi table
- [ ] No secrets in codebase
- [ ] CI/CD pipeline green
- [ ] Canary smoke test pass

**Operations:**
- [ ] CONTINUITY.md đầy đủ
- [ ] AGENTS.md có instructions
- [ ] .env.example documented
- [ ] Deploy rollback tested

---

## Kết Quả Đạt Được

```
✅ Full-stack skills mastered:
├── Next.js App Router + Server Components
├── Supabase (PostgreSQL + Auth + Realtime + Storage + Edge Functions)
├── Row Level Security (multi-tenant)
├── Cloudflare deployment
├── Sprint-based development (cm-sprint-bus)
├── Strategic analysis (cm-brainstorm-idea)
├── Parallel execution (cm-execution)
├── Security audit (cm-security-gate + cm-secret-shield)
├── Quality gates (cm-quality-gate)
├── Working memory (cm-continuity)
├── E2E testing (Playwright)
├── CI/CD pipeline (GitHub Actions)
├── Canary deployment (cm-post-deploy-canary)
├── Realtime subscriptions
├── Email automation
├── Calendar integration (ICS)
├── Multi-language (3 locales)
├── CRO + analytics tracking
└── Code intelligence (cm-codeintell)

✅ Production SaaS:
├── Multi-tenant booking platform
├── Revenue-ready ($30-$200/month)
├── Secure (RLS + security scan)
├── Observable (analytics + monitoring)
├── Documented (CONTINUITY.md)
└── Maintainable (tests + CI/CD)
```

---

## Bản Đồ Kiến Trúc Tổng Thể

```
                         ┌─────────────┐
                         │  Cloudflare  │
                         │  DNS + CDN   │
                         └──────┬───────┘
                                │
              ┌─────────────────┼──────────────────┐
              │                 │                    │
     ┌────────▼───────┐ ┌──────▼──────┐  ┌─────────▼────────┐
     │  Public Pages  │ │  Dashboard  │  │  Edge Functions  │
     │  /book/[slug]  │ │  /dashboard │  │  (Notifications) │
     │  (SSG/ISR)     │ │  (SSR+CSR)  │  │                  │
     └────────┬───────┘ └──────┬──────┘  └─────────┬────────┘
              │                │                    │
              └────────────────┼────────────────────┘
                               │
                      ┌────────▼────────┐
                      │    Supabase     │
                      ├─────────────────┤
                      │ PostgreSQL (DB) │
                      │ Auth (JWT)      │
                      │ Realtime (WS)   │
                      │ Storage (S3)    │
                      │ Edge Functions  │
                      └─────────────────┘
```

---

## Nâng Cấp (Tùy Chọn)

| Nâng cấp | Skills hỗ trợ | Thời gian |
|-----------|--------------|-----------|
| Staff management (multi-staff) | `cm-tdd` + `cm-planning` | 4 giờ |
| Payment integration (Stripe) | `cm-security-gate` | 4 giờ |
| SMS reminders (Twilio) | `cm-execution` | 2 giờ |
| Customer portal (history, reviews) | `cm-ux-master` | 4 giờ |
| Mobile app (React Native) | `cm-project-bootstrap` | 20+ giờ |
| White-label (custom domain per business) | `cm-identity-guard` | 6 giờ |
| Reporting & analytics dashboard | `cm-codeintell` | 6 giờ |
| Waitlist for fully booked slots | `cm-tdd` | 2 giờ |

---

## Tổng Kết Lộ Trình

```
Dự Án 1 ★☆☆ → Dự Án 2 ★★☆ → Dự Án 3 ★★★
Landing Page    Mini Tool PWA    Full-stack SaaS

2-4 giờ         6-10 giờ         16-24 giờ
6 skills        12 skills        20+ skills
HTML/CSS        React            Next.js + Supabase
Netlify         Cloudflare       Cloudflare + Supabase

Tổng: ~28-38 giờ vibe coding = 1 portfolio chuyên nghiệp 3 dự án
```

**Bạn vừa hoàn thành toàn bộ lộ trình Vibe Coding Masterclass.**

---

*Được tạo bởi CodyMaster — Your AI Agent is smart. CodyMaster makes it wise.*
