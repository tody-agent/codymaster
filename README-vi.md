[English](README.md) | [Tiếng Việt](README-vi.md)

# CodyMaster

> *"Tôi không biết viết code. Nhưng trong 6 tháng, tôi đã ship 12 sản phẩm thật bằng AI. CodyMaster là tất cả những gì tôi học được — để bạn không phải lặp lại những sai lầm của tôi."* — **Tody Le**, Head of Product, Người tạo ra CodyMaster

**50+ kỹ năng. Một lần cài. AI coding agent của bạn trở thành cả một đội ngũ.**

**v7.0 — Browse Hybrid Bridge:** Tự động hóa trình duyệt AI-native với a11y snapshots, thu thập lỗi, ghi video.

```
    ( . \ --- / . )
     /   ^   ^   \
    (      u      )
     |  \ ___ /  |
      '--w---w--'
       Gặp Cody 🐹
```

---

## Vấn đề

Bạn cài một AI coding agent. Nó viết code nhanh. Nhưng rồi:

- **Nó thiết kế khác nhau mỗi lần** — thương hiệu của bạn trông như 3 công ty khác nhau
- **Nó sửa một thứ, hỏng năm thứ khác** — bạn làm đi làm lại cùng một việc
- **Nó quên mọi thứ** giữa các phiên — mỗi sáng bạn phải giải thích lại dự án
- **Nó không viết test, không viết tài liệu** — codebase trở thành quả bom hẹn giờ
- **Bạn cài 15 kỹ năng** — không cái nào nói chuyện với cái nào

> *"AI cho tôi 100 cánh tay. Nhưng thiếu kỷ luật, những cánh tay đó chỉ tạo ra hỗn loạn."*

---

## Giải pháp: Cả một đội Senior trong một lần cài

CodyMaster không phải là bộ sưu tập kỹ năng rời rạc. Nó là một **hệ điều hành** cho AI agent — 50+ kỹ năng hoạt động cùng nhau như một đội thật.

**Khi cài CodyMaster, bạn đang thuê:**

| Vai trò | Họ làm gì | Kỹ năng chính |
|---------|-----------|---------------|
| **Senior Developer** | Viết test trước, debug có hệ thống, review code | `cm-tdd` `cm-debugging` `cm-code-review` |
| **UX Designer** | Trích xuất design system, xem trước UI trước khi code | `cm-design-system` `cm-ux-master` `cm-open-design` |
| **Product Manager** | Lập kế hoạch, brainstorm ý tưởng, hiểu người dùng | `cm-planning` `cm-brainstorm-idea` |
| **DevOps Engineer** | Deploy an toàn, quét bí mật, kiểm tra đúng tài khoản | `cm-safe-deploy` `cm-identity-guard` |
| **Tech Writer** | Tự tạo tài liệu, tham chiếu API, cơ sở tri thức từ code | `cm-dockit` `cm-codeintell` |
| **Automation Lead** | Pipeline sprint, quy trình tự động, theo dõi trạng thái | `cm-sprint-bus` `cm-autopilot` |

---

## Bắt đầu nhanh — 30 giây

**Bước 1: Cài đặt**

```bash
npm install -g codymaster && cm
```

Wizard tự phát hiện công cụ AI của bạn (Claude Code, Cursor, Gemini...) và cài kỹ năng cho tất cả.

**Bước 2: Bắt đầu xây dựng**

Mở AI agent và nói điều bạn muốn:

```
Làm landing page cho quán cà phê của tôi
```

**Bước 3: Xem nó hoạt động**

CodyMaster tự động ghép chuỗi kỹ năng phù hợp:
`cm-brainstorm-idea` → `cm-design-system` → `cm-execution` → `cm-safe-deploy`

Xong. Không file cấu hình. Không nghi thức setup. Chỉ cần mô tả điều bạn muốn.

---

## Quy trình thực thi có kỷ luật mặc định

CodyMaster giờ duy trì một contract xuyên suốt từ lập kế hoạch đến kiểm chứng:

- Plan chi tiết nêu chính xác file của từng task và giới hạn mọi step trong phạm vi đó; công việc TDD phải ghi nhận RED trước GREEN.
- Một plan được duyệt tạo quyền thực thi có phạm vi, vì vậy công việc đúng scope tiếp tục mà không hỏi xác nhận lặp lại.
- Mode B dùng ba session riêng biệt cho mỗi task: implementer mới, spec reviewer, rồi quality reviewer.
- Autonomy policy dùng chung được kiểm tra và đồng bộ trên cả 14 bản phân phối platform.
- `cm bench --suite workflow-integration --runs 1` chạy từ bất kỳ thư mục project nào, kể cả package npm đã cài, và ghi kết quả tại project đó.

---

## Xem nó hoạt động

Đây là cuộc trò chuyện thật — một người không biết code xây dựng trang đặt lịch:

```
Bạn:    Tôi muốn xây trang đặt lịch cho tiệm spa.
        Tôi có website cũ ở myspa.com nhưng xấu lắm.

AI:     [cm-brainstorm-idea] Để tôi phân tích website hiện tại trước...
        Tôi thấy 3 vấn đề: không đặt lịch trên điện thoại, giá không rõ,
        tải chậm. Có 2 hướng:
        A) Thiết kế lại từ đầu (khuyến nghị — thương hiệu cần làm mới)
        B) Sửa website hiện tại
        
Bạn:    Chọn A.

AI:     [cm-design-system] Tôi đang trích xuất màu thương hiệu từ
        myspa.com... Tìm thấy: vàng + navy. Đang xây design system.
        [cm-planning] Kế hoạch: trang đặt lịch, trang dịch vụ,
        trang giới thiệu, trang liên hệ. Ước tính: 30 phút AI làm.
        
Bạn:    Được, làm đi.

AI:     [cm-tdd] Viết test trước...
        [cm-execution] Xây 4 trang...
        [cm-dockit] Tạo mô tả dịch vụ và FAQ...
        [cm-quality-gate] Mọi test đều đạt. Hiệu năng: 98/100.
        [cm-safe-deploy] Đang deploy lên staging...
        
        ✅ Xong. Xem trước: https://staging-myspa.pages.dev
        
Bạn:    Nút đặt lịch nhỏ quá trên điện thoại.

AI:     [cm-debugging] Tìm ra rồi — padding đang 8px, nên là 16px.
        [cm-code-review] Fix ổn. Không ảnh hưởng gì khác.
        [cm-safe-deploy] Đã deploy fix.
        
        ✅ Sửa xong. Thử lại đi.
```

**Con người không viết dòng code nào. AI không gây lỗi nào.** Hệ thống bắt vấn đề điện thoại trước khi nó đến production.

---

## Điều gì tạo nên sự khác biệt

| | 😵 Kỹ năng rời rạc | 🧠 CodyMaster |
|---|---|---|
| **Tích hợp** | Mỗi kỹ năng là độc lập | 50+ kỹ năng liên kết và chia sẻ bộ nhớ |
| **Bộ nhớ** | Quên mọi thứ giữa các phiên | Nhớ dự án, phong cách, sai lầm của bạn |
| **An toàn** | Deploy và cầu nguyện | Bảo vệ đa lớp: test → bảo mật → staging → production |
| **Thiết kế** | UI ngẫu nhiên mỗi lần | Trích xuất thương hiệu, đảm bảo nhất quán |
| **Tài liệu** | "Chắc viết README sau" | Tự tạo tài liệu từ code |
| **Tự cải thiện** | Tĩnh — cài gì dùng nấy | Học từ phản hồi, ngày càng tốt hơn |

---

## Dành cho người xây dựng, không phải dân code

CodyMaster được xây cho người **có ý tưởng, không cần bằng CNTT**.

**Phù hợp với bạn nếu bạn:**
- Muốn nhập tin nhắn và nhận lại sản phẩm hoạt động được
- Muốn AI học hỏi từ sai lầm
- Không muốn tự tay xem từng dòng kết quả từ AI
- Muốn deploy tự tin, không phải cầu nguyện

**Không phù hợp nếu bạn:**
- Thích làm cùng một nghi thức setup cho mọi dự án
- Thích deploy thủ công chậm mà không có lưới an toàn
- Thích giải thích lại codebase mỗi sáng

---

## Tour 10 giây

Thay vì liệt kê 50+ kỹ năng, đây là những gì CodyMaster làm bằng ngôn ngữ đơn giản:

### 💡 Trước khi xây dựng
- **Suy nghĩ trước khi code** — đặt câu hỏi, thách thức giả định, cứu bạn khỏi xây sai thứ
- **Lập kế hoạch kiến trúc** — sơ đồ, luồng dữ liệu, edge case — tất cả trước khi viết code

### 🎨 Trong khi xây dựng
- **Thực thi design system** — màu sắc, font, khoảng cách nhất quán trên mọi trang
- **Viết test trước** — bắt bug trước khi nó tồn tại
- **Debug có hệ thống** — truy nguyên nhân gốc, không đoán mò

### 🚀 Trước khi ship
- **Quét bí mật** — không rò rỉ API key lên GitHub
- **Kiểm tra đúng tài khoản** — không deploy nhầm Cloudflare
- **Chạy quality gate** — không deploy nếu chưa pass test + kiểm tra hiệu năng

### 📈 Sau khi ship
- **Tạo tài liệu** — đọc code, viết docs
- **Học từ phản hồi** — ngày càng thông minh hơn qua mỗi dự án
- **Chạy hồi kết** — ghi lại điều gì hiệu quả, điều gì không, cải thiện quy trình

📖 [Tham khảo đầy đủ →](skills/)

---

## Pipeline Thiết kế

CodyMaster coi thiết kế là **môn học hạng nhất** — không phải thứ nghĩ sau. AI không chỉ viết code; nó đảm bảo tính nhất quán trực quan trên mọi trang.

**Ba cách để có design system:**

| Phương pháp | Khi nào dùng | Cách làm |
|-------------|---------------|----------|
| **Trích xuất từ URL** | Bạn có thương hiệu/website sẵn | `cm-open-design` phân tích website, trích xuất màu, font, khoảng cách |
| **Chọn từ 129 hệ thống** | Bạn muốn aesthetic đã chứng minh | Chọn từ Linear, Stripe, Vercel, Notion, Apple, Tesla, và 123 hệ thống khác |
| **Chọn hướng thiết kế** | Bạn chưa có thương hiệu | Chọn từ 5 phong cách: Editorial, Modern Minimal, Warm Soft, Tech Utility, Brutalist |

```
Trích xuất → Token → Xác thực → Xây dựng → QA
    │           │         │           │        │
    │           │         │           │        └─ cm-quality-gate
    │           │         │           └─ cm-execution
    │           │         └─ cm-ux-master (48 luật UX)
    │           └─ cm-design-system (STITCH_TOKENS)
    └─ cm-open-design (129 hệ thống + trích xuất)
```

📖 [Hướng dẫn pipeline thiết kế đầy đủ →](docs/design-pipeline.md)

---

## Tình huống thực tế

| Bạn nói | Điều xảy ra |
|---------|-------------|
| *"Sửa bug này"* | `cm-debugging` tìm nguyên nhân → `cm-tdd` viết test → `cm-quality-gate` xác nhận |
| *"Làm landing page"* | `cm-brainstorm-idea` → `cm-design-system` → `cm-execution` → `cm-safe-deploy` |
| *"Làm giống Stripe"* | `cm-open-design` trích xuất token Stripe → `cm-design-system` áp dụng → `cm-execution` xây dựng |
| *"Deploy lên production"* | `cm-secret-shield` → `cm-security-gate` → `cm-identity-guard` → `cm-safe-deploy` |
| *"Code này làm gì?"* | `cm-codeintell` đọc codebase → `cm-dockit` tạo tài liệu |
| *"Thêm tiếng Việt"* | `cm-safe-i18n` trích xuất chuỗi → dịch → kiểm tra → ship |
| *"Khởi tạo dự án mới"* | `cm-project-bootstrap` scaffold → `cm-planning` lập kế hoạch → `cm-execution` xây dựng |

---

## Cài đặt

### Một lệnh

```bash
npm install -g codymaster && cm
```

### Wizard làm gì

1. **Phát hiện** mọi công cụ AI bạn có (Claude Code, Cursor, Gemini CLI, Codex, OpenCode, Windsurf, Cline, Aider, Continue, Kiro, Amazon Q, Amp, Copilot, Claude Desktop)
2. **Hỏi** bạn muốn cài kỹ năng cho cái nào (tick sẵn công cụ đã phát hiện)
3. **Cài** vào vị trí native của từng nền tảng
4. **Xong** — mở AI agent và bắt đầu xây dựng

### Sau khi cài

```bash
cm doctor          # Kiểm tra đã cài gì
cm status          # Xem task và tiến độ
cm dashboard       # Mở bảng điều khiển trực quan
```

### Dành cho người dùng Codex

Cách nhanh nhất:

```bash
git clone https://github.com/tody-agent/codymaster.git ~/.cody-master
cd ~/.cody-master
npm ci
npm run build:platforms
```

Sau đó nói với Codex:

```text
Fetch and follow instructions from https://raw.githubusercontent.com/tody-agent/codymaster/main/.codex/INSTALL.md
```

Hoặc dùng trực tiếp cây skill Codex tại `.codex/skills/`.

### Không có Node.js?

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/tody-agent/codymaster/main/install.sh) --all --profile core
```

---

## Bảng điều khiển

Trung tâm điều khiển trực quan cho dự án của bạn:

```
┌─────────────────────────────────────────────┐
│           📊 CodyMaster Dashboard           │
│  Tasks │ Progress │ Tokens │ Logs           │
└─────────────────────────────────────────────┘
```

```bash
cm dashboard start   # Khởi động dashboard
cm dashboard open    # Mở trong trình duyệt
```

Theo dõi task, giám sát tiến độ, xem đội AI đang làm gì — tất cả trên một màn hình.

---

## Cách nó hoạt động bên trong

Dành cho ai tò mò (bỏ qua phần này nếu chỉ muốn xây dựng):

- **Hệ thống bộ nhớ** — AI nhớ dự án của bạn qua các phiên. Không phải giải thích lại.
- **Chuỗi kỹ năng** — Các kỹ năng nói chuyện với nhau. Lập kế hoạch dẫn vào thiết kế, thiết kế dẫn vào code, code dẫn vào test.
- **Kỷ luật hành vi** — Lấy cảm hứng từ [quy tắc coding AI của Andrej Karpathy](https://x.com/karpathy/status/2015883857489522876). AI suy nghĩ trước khi code, giữ mọi thứ đơn giản, thay đổi chính xác.
- **Bảo vệ đa lớp** → Test → quét bảo mật → staging → production. Mỗi lớp bắt những gì lớp trước bỏ lỡ.
- **Tự phục hồi** — Kỹ năng học từ thất bại và cải thiện theo thời gian.

📖 [Tìm hiểu kiến trúc →](docs/architecture/codymaster-brain.md)

---

## Cho nhóm & người nâng cao

### Nhiều AI Agent

Hoạt động với 14+ nền tảng ngay lập tức:

```bash
cm install claude-code --profile core
cm install cursor --profile growth
cm install gemini --profile full
```

### MCP Server

Dùng CodyMaster làm MCP server cho Claude Desktop:

```bash
npx codymaster mcp-serve --install-claude
```

### Tích hợp Goose

```bash
cm mcp-serve --print-config  # Dán vào cấu hình Goose
```

📖 [Tất cả tích hợp →](docs/integrations/)

---

## Đóng góp

1. ⭐ **Star repo** — giúp nhiều người xây dựng tìm thấy hơn
2. Fork → Tạo `skills/cm-your-skill/SKILL.md`
3. Gửi Pull Request

CI chạy `npm run test:gate:kit` trên mọi push và PR.

---

## Tài nguyên

| Tài nguyên | Link |
|-----------|------|
| 🌍 Website | [cody.todyle.com](https://cody.todyle.com) |
| 📖 Tài liệu | [cody.todyle.com/docs](https://cody.todyle.com/docs) |
| 📘 Docs trong repo | [docs/index.md](docs/index.md) |
| 🎨 Pipeline thiết kế | [docs/design-pipeline.md](docs/design-pipeline.md) |
| 🛠️ Kỹ năng | [skills/](skills/) |
| 📖 Câu chuyện | [cody.todyle.com/story](https://cody.todyle.com/story) |

---

## Ai xây dựng cái này

**Tody Le** — Head of Product với hơn 10 năm kinh nghiệm. Không biết viết code. Đã dùng AI để xây dựng sản phẩm thật trong 6 tháng liền. Mỗi kỹ năng trong bộ công cụ đều ra đời từ thất bại thật — tốn thời gian thật và nước mắt thật.

> *"50+ kỹ năng. Mỗi kỹ năng là một bài học. Mỗi bài học là một đêm mất ngủ. Và giờ, bạn không cần phải trải qua những đêm đó nữa."*

---

*Giấy phép ISC — Miễn phí sử dụng, sửa đổi và phân phối.*

**Được xây dựng với ❤️ dành cho cộng đồng vibe coding.**

*"CodyMaster" = "Code Đi" — hãy bắt đầu xây dựng ngay thôi.*
