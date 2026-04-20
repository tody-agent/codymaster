# Vibe Coding Masterclass — Học Qua Thực Hành Với CodyMaster

> **Từ zero → production trong 3 dự án thực tế.** Mỗi dự án tăng dần độ khó, sử dụng đúng skill CodyMaster + stack hiện đại mà thị trường đang cần nhất.

---

## Tổng Quan Lộ Trình

```
┌─────────────────────────────────────────────────────────────────────┐
│                    VIBE CODING MASTERCLASS                          │
│                                                                     │
│   DỰ ÁN 1              DỰ ÁN 2                DỰ ÁN 3             │
│   ★☆☆ Dễ              ★★☆ Trung bình          ★★★ Nâng cao        │
│                                                                     │
│   SaaS Landing         Invoice Generator       Booking Platform     │
│   Page                 PWA                      Full-stack SaaS      │
│                                                                     │
│   HTML/CSS/JS          React + Tailwind        Next.js + Supabase   │
│   Netlify              Cloudflare Pages         Cloudflare + Supabase│
│   ~2-4 giờ             ~6-10 giờ               ~16-24 giờ           │
│                                                                     │
│   Skills: 6            Skills: 12               Skills: 20+         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Stack & Công Cụ Xuyên Suốt

| Công cụ | Vai trò | Dự án sử dụng |
|---------|---------|----------------|
| **GitHub** | Quản lý mã nguồn, CI/CD | 1, 2, 3 |
| **Netlify** | Deploy tĩnh, form handling | 1 |
| **Cloudflare Pages** | Deploy CDN toàn cầu, Workers | 2, 3 |
| **Supabase** | Database, Auth, Storage, Realtime | 3 |
| **CodyMaster** | AI coding assistant với 60+ skills | 1, 2, 3 |

---

## Bản Đồ Skills Theo Dự Án

```
                    CodyMaster Skills Map
                    =====================

DỰ ÁN 1 (Landing Page)
├── cm-project-bootstrap .... Khởi tạo project sạch
├── cm-identity-guard ....... Xác minh tài khoản trước deploy
├── cm-design-system ........ Thiết lập design tokens
├── cm-content-factory ...... Viết copy chuyển đổi cao
├── cm-safe-deploy .......... Deploy 8 cổng an toàn
└── cm-test-gate ............ Test cơ bản

DỰ ÁN 2 (Mini Tool PWA)              KẾ THỪA TỪ DỰ ÁN 1
├── cm-planning ............. Lên kế hoạch chi tiết      ┌──────────────┐
├── cm-ux-master ............ 48 UX Laws                 │ + Tất cả     │
├── cm-tdd .................. Test-Driven Development     │   skills     │
├── cm-clean-code ........... Code sạch                  │   Project 1  │
├── cm-safe-i18n ............ Đa ngôn ngữ               │              │
├── cm-cro-methodology ...... Tối ưu chuyển đổi         └──────────────┘
├── cm-growth-hacking ....... Bottom-sheet & popup
├── cm-ads-tracker .......... Tracking chuyển đổi
├── cm-debugging ............ Debug có hệ thống
└── cm-code-review .......... Review code

DỰ ÁN 3 (Full-stack SaaS)            KẾ THỪA TỪ DỰ ÁN 1 + 2
├── cm-brainstorm-idea ...... Phân tích chiến lược       ┌──────────────┐
├── cm-execution ............ Thực thi song song         │ + Tất cả     │
├── cm-security-gate ........ Audit bảo mật              │   skills     │
├── cm-secret-shield ........ Bảo vệ secret              │   Project    │
├── cm-booking-calendar ..... Engine đặt lịch            │   1 + 2      │
├── cm-quality-gate ......... 4 cổng xác minh            │              │
├── cm-continuity ........... Working memory              └──────────────┘
├── cm-sprint-bus ........... Sprint pipeline
├── cm-codeintell ........... Code intelligence
├── cm-safe-deploy .......... Deploy pipeline
└── cm-post-deploy-canary ... Smoke test sau deploy
```

---

## Dự Án 1: SaaS Landing Page ★☆☆

> **Nhu cầu thị trường:** Mỗi startup, freelancer, agency đều cần landing page chuyển đổi cao. Giá thị trường: $200-$2,000/trang.

**[Xem hướng dẫn chi tiết →](./project-1-landing-page.md)**

### Mục tiêu học
- Quy trình vibe coding từ A-Z
- Setup project chuẩn từ ngày đầu
- Deploy an toàn lên production

### Stack
```
HTML5 + CSS3 (hoặc Tailwind CDN) + Vanilla JS
GitHub → Netlify (auto deploy)
```

### Skills sử dụng
| Bước | Skill | Mục đích |
|------|-------|----------|
| 1 | `cm-identity-guard` | Xác minh GitHub account |
| 2 | `cm-project-bootstrap` | Khởi tạo cấu trúc project |
| 3 | `cm-design-system` | Tạo design tokens (màu, font, spacing) |
| 4 | `cm-content-factory` | Viết copy & CTA chuyển đổi cao |
| 5 | `cm-test-gate` | Setup test cơ bản |
| 6 | `cm-safe-deploy` | Deploy qua 8 cổng an toàn |

### Kết quả đầu ra
- Landing page responsive, load < 1s
- SEO score > 90 (Lighthouse)
- Auto deploy khi push lên GitHub
- Contact form hoạt động (Netlify Forms)

---

## Dự Án 2: Invoice Generator PWA ★★☆

> **Nhu cầu thị trường:** Freelancer và SME cần tool tạo hóa đơn nhanh, không cần đăng ký. 50M+ searches/tháng cho "free invoice generator". Giá SaaS tương tự: $10-$30/tháng.

**[Xem hướng dẫn chi tiết →](./project-2-mini-tool-app.md)**

### Mục tiêu học
- Component-based architecture
- TDD workflow thực tế
- PWA + offline support
- i18n đa ngôn ngữ
- CRO & Growth tracking

### Stack
```
React 18 + Tailwind CSS + Vite
LocalStorage (no backend)
Cloudflare Pages (deploy)
GitHub Actions (CI/CD)
```

### Skills sử dụng
| Bước | Skill | Mục đích |
|------|-------|----------|
| 1-2 | `cm-identity-guard` + `cm-project-bootstrap` | Setup project |
| 3 | `cm-planning` | Lên kế hoạch features |
| 4 | `cm-ux-master` | Áp dụng UX Laws cho form design |
| 5 | `cm-design-system` | Thiết lập component system |
| 6 | `cm-tdd` | Viết test trước khi code |
| 7 | `cm-safe-i18n` | Hỗ trợ EN/VI |
| 8 | `cm-clean-code` | Refactor code sạch |
| 9 | `cm-cro-methodology` | Tối ưu conversion |
| 10 | `cm-growth-hacking` | CTA popup & lead capture |
| 11 | `cm-ads-tracker` | Setup tracking pixels |
| 12 | `cm-safe-deploy` | Deploy lên Cloudflare Pages |

### Kết quả đầu ra
- PWA installable trên mobile
- Tạo invoice PDF, hỗ trợ logo upload
- Hoạt động offline
- 2 ngôn ngữ (EN/VI)
- Tracking conversion đầy đủ

---

## Dự Án 3: Booking Platform SaaS ★★★

> **Nhu cầu thị trường:** Salon, spa, phòng khám, studio cần hệ thống đặt lịch online. Thị trường $500B+ toàn cầu. Giá SaaS: $30-$200/tháng/business.

**[Xem hướng dẫn chi tiết →](./project-3-fullstack-saas.md)**

### Mục tiêu học
- Full-stack architecture thực tế
- Database design & Row Level Security
- Authentication & Authorization
- Real-time updates
- CI/CD pipeline chuyên nghiệp
- Monitoring & canary deploy

### Stack
```
Next.js 14 (App Router) + Tailwind CSS + shadcn/ui
Supabase (PostgreSQL + Auth + Realtime + Storage)
Cloudflare (DNS + CDN + Workers)
GitHub Actions (CI/CD)
```

### Skills sử dụng
| Phase | Skills | Mục đích |
|-------|--------|----------|
| **Khởi tạo** | `cm-identity-guard` `cm-project-bootstrap` | Setup project + verify accounts |
| **Phân tích** | `cm-brainstorm-idea` `cm-codeintell` | Phân tích yêu cầu + kiến trúc |
| **Lên kế hoạch** | `cm-planning` `cm-sprint-bus` | Sprint backlog + task breakdown |
| **Design** | `cm-design-system` `cm-ux-master` `cm-ui-preview` | UI/UX chuyên nghiệp |
| **Code** | `cm-tdd` `cm-execution` `cm-clean-code` | TDD + parallel execution |
| **i18n** | `cm-safe-i18n` | 3 ngôn ngữ (EN/VI/JA) |
| **Bảo mật** | `cm-security-gate` `cm-secret-shield` | Audit + secret protection |
| **Quality** | `cm-quality-gate` `cm-code-review` `cm-debugging` | 4-gate verification |
| **Deploy** | `cm-safe-deploy` `cm-post-deploy-canary` | 8-gate + smoke test |
| **Growth** | `cm-ads-tracker` `cm-cro-methodology` `cm-booking-calendar` | CRO + booking engine |
| **Memory** | `cm-continuity` | Working memory xuyên session |

### Kết quả đầu ra
- Dashboard quản lý cho business owner
- Trang booking public cho khách hàng
- Auth (email + Google OAuth)
- Calendar view + timezone support
- Email notifications (Supabase Edge Functions)
- Realtime cập nhật trạng thái
- Row Level Security hoàn chỉnh
- CI/CD pipeline tự động

---

## Cách Đọc Tài Liệu Này

```
📖 Gợi ý cho người mới:

1. ĐỌC README này trước để nắm tổng quan
2. BẮT ĐẦU từ Dự Án 1 — đừng nhảy bước
3. MỖI DỰ ÁN có file hướng dẫn riêng với từng bước chi tiết
4. THỰC HÀNH theo đúng thứ tự — skills được sắp xếp có chủ đích
5. KẾT QUẢ mỗi dự án là portfolio piece thực tế có thể show cho khách hàng
```

### Quy ước ký hiệu

| Ký hiệu | Nghĩa |
|----------|--------|
| `📌 PROMPT` | Copy-paste vào AI agent |
| `⚡ LỆNH` | Chạy trong terminal |
| `✅ CHECKPOINT` | Xác minh trước khi tiếp tục |
| `⚠️ LƯU Ý` | Dễ mắc lỗi, đọc kỹ |
| `💡 MẸO` | Tips nâng cao, không bắt buộc |

---

## Bảng So Sánh 3 Dự Án

| Tiêu chí | Dự Án 1 | Dự Án 2 | Dự Án 3 |
|-----------|---------|---------|---------|
| **Độ khó** | ★☆☆ | ★★☆ | ★★★ |
| **Thời gian** | 2-4h | 6-10h | 16-24h |
| **Frontend** | HTML/CSS/JS | React + Tailwind | Next.js + shadcn |
| **Backend** | Không | Không | Supabase |
| **Database** | Không | LocalStorage | PostgreSQL |
| **Auth** | Không | Không | Supabase Auth |
| **Deploy** | Netlify | Cloudflare Pages | Cloudflare + Supabase |
| **CI/CD** | Git push auto | GitHub Actions | GitHub Actions |
| **i18n** | Không | 2 ngôn ngữ | 3 ngôn ngữ |
| **Testing** | Cơ bản | TDD đầy đủ | TDD + E2E + Security |
| **Monitoring** | Không | Analytics | Canary + Realtime |
| **Giá trị thị trường** | $200-$2K | Freemium SaaS | $30-$200/tháng |
| **Skills CM** | 6 | 12 | 20+ |

---

## 9 Quy Tắc Vàng (Áp dụng cho cả 3 dự án)

1. **Identity First** — Luôn chạy `cm-identity-guard` trước khi push/deploy
2. **Design Before Code** — Có plan được duyệt trước khi viết code
3. **i18n Day 0** — Nghĩ về đa ngôn ngữ từ bước brainstorm
4. **Test Before Code** — RED → GREEN → REFACTOR, không ngoại lệ
5. **Evidence Over Claims** — Chỉ tin output terminal/test, không tin AI "nói xong rồi"
6. **Deploy via Gates** — 8 cổng phải pass tuần tự, 1 cổng fail = DỪNG
7. **Safe Secrets** — Không bao giờ commit secret, pre-commit hooks bảo vệ mọi push
8. **Parallel Power** — Dùng parallel execution cho i18n hoặc multi-bug fixes
9. **Working Memory** — Đọc CONTINUITY.md đầu session, cập nhật cuối session

---

## Tiếp Theo

| Dự án | Link |
|--------|------|
| **Dự Án 1:** SaaS Landing Page | [project-1-landing-page.md](./project-1-landing-page.md) |
| **Dự Án 2:** Invoice Generator PWA | [project-2-mini-tool-app.md](./project-2-mini-tool-app.md) |
| **Dự Án 3:** Booking Platform SaaS | [project-3-fullstack-saas.md](./project-3-fullstack-saas.md) |

---

*Được tạo bởi CodyMaster — Your AI Agent is smart. CodyMaster makes it wise.*
