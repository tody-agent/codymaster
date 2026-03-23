# Hướng dẫn Vibe Coding cho người không biết code

> **Vibe Coding** = Bạn nói, AI code. Không cần biết lập trình.  
> Tài liệu này dành cho người không phải dân dev — founders, PMs, marketers, designers — muốn dùng AI để tạo sản phẩm thật.

---

## Mục lục

1. [Vibe Coding là gì?](#vibe-coding-là-gì)
2. [Bạn cần chuẩn bị gì?](#bạn-cần-chuẩn-bị-gì)
3. [Cài đặt CodyMaster (5 phút)](#cài-đặt-codymaster-5-phút)
4. [Workflow 5 bước](#workflow-5-bước)
5. [10 Prompt mẫu — Copy & dùng ngay](#10-prompt-mẫu)
6. [Mẹo để vibe coding hiệu quả](#mẹo-để-vibe-coding-hiệu-quả)
7. [Sai lầm thường gặp](#sai-lầm-thường-gặp)
8. [Câu hỏi thường gặp (FAQ)](#câu-hỏi-thường-gặp)

---

## Vibe Coding là gì?

**Vibe Coding** là phương pháp tạo sản phẩm bằng cách **nói chuyện với AI**. Bạn mô tả ý tưởng bằng ngôn ngữ tự nhiên (tiếng Việt hoàn toàn OK), và AI sẽ:

- 📋 Lập kế hoạch chi tiết
- 🎨 Thiết kế giao diện chuyên nghiệp
- 💻 Viết code production-ready
- 🧪 Test tự động, quét bảo mật
- 🚀 Deploy lên internet

### Ví von dễ hiểu

| | Cách cũ | Vibe Coding |
|---|---|---|
| **Vai trò** | Bạn là thợ xây | Bạn là kiến trúc sư / đạo diễn |
| **Bạn làm gì** | Tự học code, tự xây | Mô tả ý tưởng, review, phê duyệt |
| **AI làm gì** | Đưa gợi ý rời rạc | Chạy cả team: lập kế hoạch, design, code, test, deploy |
| **Kết quả** | Code rời, tự ghép | Sản phẩm hoàn chỉnh, live trên internet |

### Ai nên dùng Vibe Coding?

- ✅ **Founders** — Có idea nhưng không biết code
- ✅ **Product Managers** — Muốn prototype nhanh
- ✅ **Marketers** — Cần landing page, blog, content
- ✅ **Designers** — Muốn biến mockup thành code
- ✅ **Bất kỳ ai** — Muốn tạo website, app, tool mà không thuê dev

---

## Bạn cần chuẩn bị gì?

### Phần cứng
- 💻 Máy tính (Mac, Windows, hoặc Linux)
- 🌐 Internet ổn định

### Phần mềm (chọn 1 trong các AI agent sau)

| Agent | Nền tảng | Ghi chú |
|-------|----------|---------|
| **Cursor IDE** | Desktop app | Giao diện đẹp, dễ dùng nhất cho người mới |
| **Claude Code** | CLI (Terminal) | Mạnh mẽ, cần biết mở Terminal |
| **Gemini Antigravity** | CLI (Terminal) | Miễn phí, tích hợp Google |
| **OpenCode** | CLI (Terminal) | Open source |

> 💡 **Gợi ý cho người mới:** Dùng **Cursor IDE** — có giao diện visual, không cần gõ lệnh Terminal.

### Tài khoản
- GitHub account (miễn phí, dùng để lưu code)
- Account cho AI agent bạn chọn

---

## Cài đặt CodyMaster (5 phút)

### Cách 1: Cài tự động (Khuyên dùng)

Mở Terminal (trên Mac: tìm "Terminal" trong Spotlight) và paste lệnh này:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/tody-agent/codymaster/main/install.sh) --all
```

Lệnh này tự động phát hiện và cài CodyMaster cho tất cả AI agent trên máy bạn.

### Cách 2: Cài riêng cho từng agent

**Cursor IDE:**
```bash
git clone https://github.com/tody-agent/codymaster.git ~/.cody-master
cp -r ~/.cody-master/skills .cursor/skills/
```

**Claude Code:**
```bash
claude plugin install cm@codymaster
```

**Gemini Antigravity:**
```bash
gemini extensions install https://github.com/tody-agent/codymaster
```

### Kiểm tra cài đặt thành công

Sau khi cài, mở agent và gõ:
```
/cm-status
```

Nếu thấy thông tin về CodyMaster → bạn đã cài thành công! 🎉

---

## Workflow 5 bước

Đây là quy trình CodyMaster tự động chạy khi bạn nhờ nó làm việc:

### Bước 1: 💬 Bạn Chat — Mô tả ý tưởng

Nói với AI bạn muốn gì, bằng tiếng Việt bình thường:

```
"Tạo 1 landing page cho spa tên Serenity. Giao diện tối giản, 
sang trọng, có form đặt lịch, gallery ảnh, và section đánh giá 
của khách hàng."
```

**Mẹo:** Càng cụ thể càng tốt. Nêu rõ:
- Tên brand
- Phong cách / tone (sang trọng, vui tươi, chuyên nghiệp...)
- Các chức năng cần có
- Màu sắc ưa thích (nếu có)

### Bước 2: 📋 AI Phân tích & Lập kế hoạch

CodyMaster sẽ:
1. Phân tích yêu cầu của bạn
2. Hỏi thêm nếu thiếu thông tin
3. Viết ra `implementation_plan.md` — kế hoạch chi tiết

**⚠️ QUAN TRỌNG:** AI sẽ hỏi bạn duyệt kế hoạch trước khi code. **HÃY ĐỌC KỸ** và góp ý! Đây là lúc bạn "chỉ đạo" quan trọng nhất.

### Bước 3: 🎨 AI Thiết kế giao diện

CodyMaster tự động:
- Chọn font, màu sắc phù hợp
- Áp dụng 48 quy tắc UX (Fitts's Law, Hick's Law, v.v.)
- Tạo preview để bạn xem trước

Bạn review và nói: "Oke" hoặc "Đổi font to hơn, thêm nút CTA ở cuối".

### Bước 4: 💻 AI Code & Test

CodyMaster viết code với đầy đủ:
- ✅ Test tự động (test trước, code sau — TDD)
- ✅ Quét bảo mật (không lộ secret key, password)
- ✅ Kiểm tra lỗi tự động

Bạn **không cần đọc code**. Chỉ cần xem kết quả chạy test hiện pass ✅ hay fail ❌.

### Bước 5: 🚀 Deploy lên internet

CodyMaster chạy pipeline 8 cổng kiểm tra:

```
Gate 1: Kiểm tra secret → Gate 2: Syntax → Gate 3: Test 
→ Gate 4: i18n → Gate 5: Build → Gate 6: Smoke test 
→ Gate 7: Deploy → Gate 8: Verify live
```

Mọi cổng pass → sản phẩm tự động lên internet! 🎉

---

## 10 Prompt mẫu

Copy & paste những prompt này vào AI agent để bắt đầu ngay:

### 1. 🌐 Tạo Landing Page
```
Tạo landing page cho thương hiệu [TÊN]. Ngành [NGÀNH]. 
Tone [PHONG CÁCH]. Cần có: hero section, giới thiệu, bảng giá, 
testimonials, form liên hệ, và footer. Deploy luôn.
```

### 2. 📊 Dashboard quản lý
```
Tạo dashboard quản lý [LOẠI DỮ LIỆU] cho [LOẠI BUSINESS]. 
Cần biểu đồ doanh thu theo ngày/tháng, bảng danh sách [ITEMS], 
filter theo khoảng thời gian.
```

### 3. 📱 Hệ thống booking
```
Tạo hệ thống đặt lịch hẹn cho [LOẠI DỊCH VỤ]. 
Khách chọn dịch vụ → chọn ngày giờ → nhập thông tin → xác nhận. 
Gửi email reminder trước 24h.
```

### 4. 🛒 Trang bán hàng
```
Tạo trang bán hàng cho sản phẩm [TÊN SẢN PHẨM]. 
Cần: ảnh sản phẩm, mô tả, giá, nút mua hàng, FAQ, 
social proof, và nút Zalo/Messenger.
```

### 5. ✍️ Blog & Content
```
Tạo blog cho brand [TÊN] trong lĩnh vực [LĨNH VỰC]. 
Viết 5 bài đầu tiên về [CHỦ ĐỀ]. SEO tối ưu. 
Triển khai blog hoàn chỉnh và deploy.
```

### 6. 🐛 Sửa lỗi
```
Trang web bị lỗi: [MÔ TẢ LỖI]. 
Hành vi mong muốn: [PHẢI NHƯ THẾ NÀO]. 
Hãy tìm root cause và sửa.
```

### 7. 🎨 Chỉnh sửa giao diện
```
Đổi giao diện hiện tại sang tone [MÀU SẮC]. 
Font chữ đổi sang [TÊN FONT]. 
Thêm animation mượt khi scroll.
```

### 8. 🌍 Thêm đa ngôn ngữ
```
Thêm tiếng [NGÔN NGỮ] cho toàn bộ website. 
Dịch tất cả nội dung. Thêm nút chuyển ngôn ngữ ở header.
```

### 9. 📱 Responsive check
```
Kiểm tra và sửa giao diện trên mobile. 
Đảm bảo tất cả section hiển thị đẹp trên iPhone và Android.
```

### 10. 📝 Tạo tài liệu
```
Đọc toàn bộ code dự án này và tạo:
1. Tài liệu kiến trúc (architecture)
2. Hướng dẫn sử dụng cho user
3. API reference
```

---

## Mẹo để vibe coding hiệu quả

### 🎯 Mô tả cụ thể, đừng chung chung

| ❌ Quá chung | ✅ Cụ thể |
|---|---|
| "Tạo website đẹp" | "Tạo landing page cho quán cà phê Morning Brew. Tone rustic, ấm áp. Màu nâu + kem. Cần menu, gallery 6 ảnh, form đặt bàn, và map Google." |
| "Sửa lỗi website" | "Khi bấm nút 'Đặt hàng' ở trang product.html, trang bị reload thay vì show popup xác nhận." |

### 🪜 Chia nhỏ — Đừng yêu cầu "tất cả" cùng lúc

```
# ❌ Sai
"Tạo app hoàn chỉnh có đăng nhập, dashboard, báo cáo, chat, thanh toán"

# ✅ Đúng
Chat 1: "Tạo trang đăng nhập + đăng ký"
Chat 2: "Thêm dashboard sau khi đăng nhập"
Chat 3: "Thêm trang báo cáo với biểu đồ"
```

### 👀 Luôn review kế hoạch AI đưa ra

AI sẽ đưa `implementation_plan.md` trước khi code. **ĐỌC KỸ!** 

Góp ý cụ thể:
- "Bỏ phần chat real-time, chưa cần."
- "Thêm section FAQ ở landing page."
- "Dùng màu xanh navy thay vì xanh lá."

### 🗣️ Dùng tiếng Việt thoải mái

CodyMaster hiểu tiếng Việt. Bạn không cần dùng tiếng Anh hay thuật ngữ kỹ thuật.

### 📸 Gửi ảnh tham khảo

Nếu bạn thích giao diện một website nào đó:
- Gửi URL: *"Tham khảo giao diện https://example.com"*
- Hoặc screenshot: *"Thiết kế tương tự ảnh này"*

### 🔁 Iterate — Sửa liên tục bằng chat

Sau khi có bản đầu:
- *"Nút CTA to hơn, đổi màu cam"*
- *"Thêm section đánh giá khách hàng"*  
- *"Font tiêu đề đổi sang Montserrat"*

AI nhớ context → cập nhật mà không phá code cũ.

### ⚡ Dùng lệnh `/cm-start` để tự động hóa

```
/cm-start "Tạo blog về skincare cho brand Serenity, 10 bài SEO"
```

CodyMaster sẽ tự chạy toàn bộ pipeline: Plan → Design → Code → Test → Deploy.

---

## Sai lầm thường gặp

### 1. ❌ Không đọc kế hoạch AI đưa ra

**Hậu quả:** AI làm sai hướng → phải bỏ code và làm lại.  
**Cách sửa:** Luôn đọc `implementation_plan.md` và comment trước khi approve.

### 2. ❌ Yêu cầu quá nhiều thứ 1 lần

**Hậu quả:** AI bị overload → kết quả nửa vời.  
**Cách sửa:** Chia thành các bước nhỏ. Xong bước này mới làm bước tiếp.

### 3. ❌ Prompt quá mơ hồ

**Hậu quả:** AI phải đoán → kết quả không đúng ý.  
**Cách sửa:** Nêu rõ tên, màu, chức năng, phong cách. Càng cụ thể càng tốt.

### 4. ❌ Copy-paste code từ ChatGPT thay vì dùng workflow

**Hậu quả:** Code rời rạc, không test, không deploy flow.  
**Cách sửa:** Dùng CodyMaster workflow — nó tự xử lý toàn bộ pipeline.

### 5. ❌ Không kiểm tra trên mobile

**Hậu quả:** Website đẹp trên laptop nhưng hỏng trên điện thoại.  
**Cách sửa:** Sau khi deploy, luôn check trên điện thoại. Hoặc nhờ AI: *"Kiểm tra responsive trên mobile."*

---

## Câu hỏi thường gặp

### Tôi hoàn toàn không biết code, dùng được không?

**Có!** CodyMaster được tạo bởi một Product Manager (Tody Le) — không phải developer. Bạn chỉ cần chat bằng ngôn ngữ tự nhiên.

### Vibe coding khác gì ChatGPT?

| | ChatGPT | CodyMaster (Vibe Coding) |
|---|---|---|
| Output | Đoạn code rời rạc | Sản phẩm hoàn chỉnh |
| Test | Không | Tự động TDD |
| Bảo mật | Không check | 8 cổng kiểm tra |
| Deploy | Bạn tự lo | 1 command |
| Bộ nhớ | Quên mỗi session | Nhớ context dự án |

### Tốn phí không?

**CodyMaster miễn phí 100%.** Bạn chỉ trả phí cho AI agent (Cursor ~$20/tháng, Claude API theo usage). Nhiều agent có free tier.

### Sản phẩm tạo ra có "thật" không?

**Có.** Đây là code thật, deploy thật, chạy trên internet thật. Không phải mockup. CodyMaster tạo production-ready code với test coverage, security scan, và 8-gate deploy pipeline.

### Nếu muốn sửa sau thì sao?

Chat lại! AI nhớ context dự án qua `cm-continuity`. Ví dụ: *"Đổi màu header sang xanh đậm"* — AI cập nhật mà không phá code cũ.

### Tôi có thể tạo gì với vibe coding?

- 🌐 Landing pages & Websites
- 📊 Dashboard & Admin panels
- 📱 Booking systems
- 🛒 E-commerce pages
- ✍️ Blog & Content platforms
- 📝 Documentation sites
- 📧 Email templates
- 🎨 UI/UX mockups

---

## Bắt đầu ngay

```bash
# 1. Cài CodyMaster (1 lệnh)
bash <(curl -fsSL https://raw.githubusercontent.com/tody-agent/codymaster/main/install.sh) --all

# 2. Mở AI agent và gõ:
/cm-start "Mô tả dự án của bạn ở đây"

# 3. Ngồi review và chat feedback. CodyMaster xử lý phần còn lại.
```

> **"34 skills. Mỗi skill là 1 bài học. Mỗi bài học là 1 đêm mất ngủ. 
> Và bây giờ, bạn không cần phải trải qua những đêm đó."**  
> — Tody Le, Creator of CodyMaster

---

*Tài liệu này là một phần của [CodyMaster Kit](https://github.com/tody-agent/codymaster) — Free & Open Source.*
