# Dự Án 1: SaaS Landing Page ★☆☆

> **Mục tiêu:** Xây dựng landing page chuyên nghiệp, responsive, SEO tối ưu, deploy tự động — trong 2-4 giờ vibe coding.

---

## Tổng Quan

```
┌────────────────────────────────────────────────┐
│          SaaS Landing Page                      │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │  Hero Section                             │   │
│  │  Headline + Sub + CTA + Hero Image       │   │
│  ├──────────────────────────────────────────┤   │
│  │  Social Proof (logos / testimonials)      │   │
│  ├──────────────────────────────────────────┤   │
│  │  Features (3-4 cards với icons)          │   │
│  ├──────────────────────────────────────────┤   │
│  │  How It Works (3 bước)                   │   │
│  ├──────────────────────────────────────────┤   │
│  │  Pricing (2-3 tiers)                     │   │
│  ├──────────────────────────────────────────┤   │
│  │  FAQ (accordion)                          │   │
│  ├──────────────────────────────────────────┤   │
│  │  CTA Final + Contact Form                │   │
│  ├──────────────────────────────────────────┤   │
│  │  Footer (links + legal)                   │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  Stack: HTML + Tailwind CDN + Vanilla JS        │
│  Deploy: GitHub → Netlify (auto)                │
└────────────────────────────────────────────────┘
```

### Tại sao dự án này?
- **Nhu cầu cực cao:** Mọi startup/freelancer/agency đều cần
- **Portfolio piece:** Dùng show khách hàng ngay
- **Giá thị trường:** $200 - $2,000 / landing page
- **Học nền tảng:** Hiểu quy trình vibe coding end-to-end

---

## Bước 0: Chuẩn Bị Môi Trường

### Yêu cầu
- GitHub account (free)
- Netlify account (free tier)
- Node.js >= 18
- CodyMaster đã cài đặt

### Tạo repository

⚡ LỆNH:
```bash
mkdir saas-landing && cd saas-landing
git init
```

---

## Bước 1: Xác Minh Identity

> **Skill:** `cm-identity-guard`
> **Tại sao:** Đảm bảo bạn đang push đúng GitHub account, không lẫn project.

📌 PROMPT:
```
Sử dụng cm-identity-guard để xác minh GitHub account hiện tại.
Đảm bảo remote origin trỏ đúng repo saas-landing.
```

✅ CHECKPOINT:
- [ ] File `.project-identity.json` đã được tạo
- [ ] GitHub username đúng
- [ ] Remote origin đúng repo

---

## Bước 2: Khởi Tạo Project

> **Skill:** `cm-project-bootstrap`
> **Tại sao:** Setup cấu trúc chuẩn từ ngày đầu — tránh technical debt.

📌 PROMPT:
```
Sử dụng cm-project-bootstrap để khởi tạo project landing page tĩnh.
Stack: HTML5 + Tailwind CSS (CDN) + Vanilla JavaScript.
Mục tiêu: SaaS landing page cho một ứng dụng quản lý thời gian.
Deploy target: Netlify.
Cần: cấu trúc thư mục sạch, .gitignore, meta tags SEO, favicon placeholder.
```

### Cấu trúc mong đợi
```
saas-landing/
├── index.html
├── css/
│   └── custom.css
├── js/
│   └── main.js
├── assets/
│   └── images/
├── .gitignore
├── .project-identity.json
├── netlify.toml
└── README.md
```

✅ CHECKPOINT:
- [ ] `index.html` mở được trong browser
- [ ] Tailwind CSS load thành công (CDN)
- [ ] Cấu trúc thư mục gọn gàng

---

## Bước 3: Thiết Lập Design System

> **Skill:** `cm-design-system`
> **Tại sao:** Đảm bảo nhất quán visual — AI không "thiết kế khác mỗi lần".

📌 PROMPT:
```
Sử dụng cm-design-system để tạo design tokens cho SaaS landing page.
Phong cách: Modern, clean, professional.
Brand color: Blue (#2563EB) làm primary.
Cần: color palette (primary, secondary, neutral, success, error),
typography scale, spacing system, border radius tokens.
Xuất ra file DESIGN.md và CSS variables trong custom.css.
```

### Output mong đợi

File `DESIGN.md`:
```markdown
# Design System — SaaS Landing

## Colors
- Primary: #2563EB (Blue 600)
- Primary Hover: #1D4ED8 (Blue 700)
- Secondary: #7C3AED (Violet 600)
- Neutral: #F8FAFC → #0F172A (Slate scale)
- Success: #16A34A
- Error: #DC2626

## Typography
- Heading: Inter, system-ui
- Body: Inter, system-ui
- Scale: 14 / 16 / 18 / 20 / 24 / 30 / 36 / 48 / 60

## Spacing
- Base: 4px
- Scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96
```

File `css/custom.css`:
```css
:root {
  --color-primary: #2563EB;
  --color-primary-hover: #1D4ED8;
  --color-secondary: #7C3AED;
  /* ... */
}
```

✅ CHECKPOINT:
- [ ] CSS variables hoạt động trong browser
- [ ] DESIGN.md có đầy đủ tokens
- [ ] Mọi màu đều có contrast ratio >= 4.5:1

---

## Bước 4: Viết Copy Chuyển Đổi Cao

> **Skill:** `cm-content-factory`
> **Tại sao:** Copy quyết định tỷ lệ chuyển đổi. AI viết copy theo framework StoryBrand + JTBD.

📌 PROMPT:
```
Sử dụng cm-content-factory ở chế độ WRITE để tạo copy cho SaaS landing page.
Sản phẩm: TimeFlow — ứng dụng quản lý thời gian cho freelancer.
Target: Freelancer và remote worker, 25-40 tuổi.
Pain point: Không biết thời gian đi đâu, khó tính billing chính xác.
Framework: StoryBrand (Customer = Hero, Product = Guide).

Cần copy cho:
1. Hero headline + subheadline + CTA
2. 3 pain points
3. 4 features với icon suggestions
4. "How it works" 3 bước
5. 3 pricing tiers (Free / Pro / Team)
6. 5 FAQ items
7. Final CTA section
8. Social proof (3 fake testimonials)
```

💡 MẸO: Copy framework StoryBrand:
```
Hero (Khách hàng) → Gặp vấn đề → Gặp Guide (Sản phẩm)
→ Guide cho Plan → Call to Action → Tránh thất bại → Đạt thành công
```

✅ CHECKPOINT:
- [ ] Headline rõ ràng, dưới 10 từ
- [ ] CTA dùng action verb ("Start Free", "Get Started")
- [ ] Mỗi feature giải quyết 1 pain point cụ thể
- [ ] Pricing có clear differentiation

---

## Bước 5: Code Các Section

> **Không cần skill đặc biệt** — Dùng AI agent thông thường với design tokens từ Bước 3 và copy từ Bước 4.

📌 PROMPT (cho từng section):

### 5.1 — Hero Section
```
Tạo Hero section cho landing page TimeFlow.
Sử dụng design tokens từ DESIGN.md.
Copy đã có sẵn trong content.
Layout: 2 cột trên desktop (text trái, illustration phải),
1 cột stacked trên mobile.
CTA button dùng --color-primary.
Thêm subtle gradient background.
Mobile-first, responsive.
```

### 5.2 — Features Section
```
Tạo Features section với 4 cards dạng grid.
Desktop: 2x2 grid. Tablet: 2x2. Mobile: 1 cột.
Mỗi card: icon (emoji hoặc SVG) + title + description.
Hover effect: subtle shadow lift.
```

### 5.3 — Pricing Section
```
Tạo Pricing section với 3 tiers.
Tier giữa (Pro) được highlight là "Most Popular".
Mỗi tier: tên, giá, feature list với checkmarks, CTA button.
Pro tier có border và badge "Most Popular".
```

### 5.4 — FAQ Accordion
```
Tạo FAQ accordion thuần Vanilla JS.
5 câu hỏi, mỗi câu toggle mở/đóng.
Smooth animation, chỉ 1 câu mở tại 1 thời điểm.
Không dùng thư viện bên ngoài.
```

### 5.5 — Contact Form
```
Tạo contact form section.
Fields: Name, Email, Message.
Client-side validation.
Kết nối Netlify Forms (data-netlify="true").
Success/error states.
```

⚠️ LƯU Ý: Code từng section, test trên browser, rồi mới qua section tiếp.

✅ CHECKPOINT sau mỗi section:
- [ ] Responsive (kiểm tra ở 375px, 768px, 1440px)
- [ ] Không lỗi console
- [ ] Màu sắc đúng design tokens
- [ ] Interactive elements hoạt động (hover, click, toggle)

---

## Bước 6: Setup Test Cơ Bản

> **Skill:** `cm-test-gate`
> **Tại sao:** Đảm bảo không có broken links, lỗi console, hoặc accessibility issues.

📌 PROMPT:
```
Sử dụng cm-test-gate để setup test cơ bản cho landing page tĩnh.
Cần kiểm tra:
1. Tất cả internal links hoạt động
2. Không lỗi JavaScript console
3. Tất cả images có alt text
4. Form validation hoạt động
5. Responsive ở 3 breakpoints (mobile/tablet/desktop)
6. Lighthouse score > 90 cho Performance, SEO, Accessibility
```

✅ CHECKPOINT:
- [ ] 0 broken links
- [ ] 0 console errors
- [ ] Lighthouse Performance > 90
- [ ] Lighthouse SEO > 90
- [ ] Lighthouse Accessibility > 90

---

## Bước 7: Deploy Lên Netlify

> **Skill:** `cm-safe-deploy`
> **Tại sao:** Deploy qua 8 cổng an toàn — không "deploy and pray".

### 7.1 — Chuẩn bị `netlify.toml`
```toml
[build]
  publish = "."

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Content-Security-Policy = "default-src 'self'; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; script-src 'self' https://cdn.jsdelivr.net"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 7.2 — Kết nối GitHub với Netlify
1. Push code lên GitHub
2. Vào [app.netlify.com](https://app.netlify.com) → Add new site → Import from Git
3. Chọn repo `saas-landing`
4. Build command: (để trống, site tĩnh)
5. Publish directory: `.`

### 7.3 — Deploy qua CodyMaster

📌 PROMPT:
```
Sử dụng cm-safe-deploy để deploy landing page lên Netlify.
Chạy đầy đủ 8 cổng:
1. Secret Hygiene — kiểm tra không có secret trong code
2. Security Scan — basic security headers
3. Syntax Check — HTML/CSS/JS valid
4. Test Gate — chạy tests từ bước 6
5. i18n Check — skip (single language)
6. Build — verify files exist
7. Dist Verify — kiểm tra output
8. Deploy + Smoke — push và verify live URL
```

✅ CHECKPOINT CUỐI CÙNG:
- [ ] Site live trên URL `*.netlify.app`
- [ ] HTTPS hoạt động
- [ ] Tất cả sections render đúng
- [ ] Contact form submit thành công (check Netlify dashboard)
- [ ] Mobile responsive OK
- [ ] Lighthouse all green (> 90)

---

## Kết Quả Đạt Được

```
✅ Đã học:
├── Quy trình vibe coding end-to-end
├── Setup project chuẩn (cm-project-bootstrap)
├── Design system nhất quán (cm-design-system)
├── Viết copy chuyển đổi cao (cm-content-factory)
├── Testing cơ bản (cm-test-gate)
├── Deploy an toàn (cm-safe-deploy)
└── Identity verification (cm-identity-guard)

✅ Portfolio piece:
├── Landing page responsive chuyên nghiệp
├── Live URL có thể share
├── SEO-optimized
└── Production-ready code
```

---

## Nâng Cấp (Tùy Chọn)

Sau khi hoàn thành, có thể thêm:

| Nâng cấp | Skill hỗ trợ | Thời gian |
|-----------|--------------|-----------|
| Custom domain | `cm-identity-guard` | 30 phút |
| Google Analytics | `cm-ads-tracker` | 30 phút |
| Blog section (Markdown) | `cm-content-factory` | 2 giờ |
| Dark mode toggle | `cm-design-system` | 1 giờ |
| Animation (scroll reveal) | — | 1 giờ |

---

## Tiếp Theo

Khi đã tự tin với quy trình, chuyển sang:
**[Dự Án 2: Invoice Generator PWA →](./project-2-mini-tool-app.md)**
