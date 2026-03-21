<div align="center">

# ✦ MasterDesign Agent

> **Bạn kể ý tưởng. AI tạo ra kiệt tác.**

[English](README.md) • [Tiếng Việt](README-vi.md) • [中文](README-zh.md) • [Русский](README-ru.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
![Platforms](https://img.shields.io/badge/platforms-6-brightgreen.svg)
![Entries](https://img.shields.io/badge/design%20rules-838%2B-purple.svg)
![UX Laws](https://img.shields.io/badge/UX%20Laws-48-ff69b4.svg)
![Tests](https://img.shields.io/badge/tests-7%20suites-green.svg)

</div>

---

## 🛑 Vấn đề thực sự

Bạn có một ý tưởng tuyệt vời. Bạn mô tả nó cho AI. Nhưng giao diện mà AI tạo ra lại... **quá tệ**.
Nó trông đại trà, mang đậm "mùi AI", và thiếu vắng một hệ thống thiết kế đồng nhất. Nút bấm thì nhỏ, form nhập liệu dài lê thê, và trải nghiệm người dùng đầy ức chế.

Đây là thực tế cay đắng của 90% nhà sáng lập, lập trình viên và quản lý dự án. Mã nguồn có xuất sắc đến đâu mà mặt tiền bệ rạc thì dự án cũng coi như bỏ đi.

## ✨ Phép màu công nghệ

**MasterDesign Agent** biến mọi công cụ AI (Cursor, Claude, Gemini...) của bạn thành một **buồng thiết kế cao cấp**.
Nó hoạt động âm thầm phía sau. Bạn chỉ cần ra lệnh, và AI sẽ tự động áp dụng các tiêu chuẩn thiết kế hàng đầu thế giới để nhào nặn ra sản phẩm.

| ❌ Không có MasterDesign Agent | ✦ Với MasterDesign Agent |
|---------------------|--------------|
| AI tạo UI đại trà, giả tạo | Giao diện choáng ngợp, chốt gục khách hàng |
| Mỗi trang một kiểu, lộn xộn | Hệ thống thiết kế đồng bộ tuyệt đối |
| Nút bấm vô hình, menu mê cung | Áp dụng 48 định luật tâm lý học hành vi |
| Không biết design tốt hay xấu | 37 lưới lọc kiểm định khắt khe tự động |
| Đốt $3K–$15K thuê designer, chờ đợi | **0 đồng, 0 giây chờ, kết quả xuất sắc** |

---

## 🚀 Có gì mới trong v2.0?

Chúng tôi đã nâng cấp toàn diện sức mạnh của bộ kit:

- 🧬 **Harvester v3 (Trích xuất toàn diện):** Bóc tách 50-80+ design tokens từ bất kỳ website nào. Chụp lại biểu đồ màu, hệ màu semantic, thang màu xám, tỷ lệ chữ, khoảng cách và thông số layout. Biến DNA của đối thủ thành của bạn trong 5 phút.
- 🗂️ **Project Registry:** Quản lý hàng loạt dự án thiết kế dễ dàng. Trộn (merge) dữ liệu harvest từ nhiều trang vào một dự án duy nhất.
- 📖 **Design Doc Generator:** Tự động gen ra trang HTML Tàit liệu thiết kế (Documentation) hiển thị bảng màu, font chữ, components mẫu.
- 🔗 **Token Mapper & Semi MCP Bridge:** Chuyển hóa design tokens sang biến CSS của Semi Design. Tự động sinh code CSS overrides, JSON cho Figma và template React component.
- 🧪 **7 Bộ Test Suites toàn diện:** Đảm bảo chất lượng bằng phương pháp TDD for Design.

---

## 🧠 Bộ não thiết kế đích thực

MasterDesign Agent không phải là một cái template. Nó là một ma trận trí tuệ chứa **838+ quy tắc thiết kế**, bao phủ **13 tech stacks** và **13 ngành hàng** (Fintech, SaaS, Thương mại điện tử...).

- **67 Phong cách UI:** Từ Glassmorphism thanh lịch tới Brutalism táo bạo.
- **96 Bảng màu & 57 Cặp font chữ:** Chọn lọc khắt khe cho hiệu ứng thị giác tối đa.
- **48 Định luật UX:** Tự động áp dụng Định luật Hick (giảm lựa chọn), Định luật Fitts (tăng kích thước vùng bấm), Ngưỡng Doherty (phản hồi siêu tốc), v.v.
- **37 Bài Design Tests:** Đóng vai trò như một màng lọc QA trước khi AI nhả code cho bạn.

---

## ⚡ Bắt đầu trong 60 giây

### Bước 1: Kiểm tra Python
Đảm bảo máy bạn đã cài Python 3:
```bash
python3 --version
```

### Bước 2: Clone & Cài đặt
```bash
git clone https://github.com/relukdev/ux-master.git
cd ux-master
python3 scripts/install.py
```

Trình cài đặt sẽ tự động tìm các AI tool hiện có và cấu hình ngay lập tức.
*Bạn muốn cài riêng cho 1 tool?*
```bash
python3 scripts/install.py --platform cursor
python3 scripts/install.py --platform amp --global
# Hoặc cài cho tất cả:
python3 scripts/install.py --platform all --global
```

### Bước 3: Chiêm ngưỡng phép màu
Mở AI tool của bạn (vd: Cursor) và gõ:
> *"Tạo landing page cho dịch vụ spa thượng lưu, phong cách modern minimal."*

Nếu AI bắt đầu nhắc đến **design systems, UX Laws, hoặc design tests** — Chúc mừng, MasterDesign Agent đã thức tỉnh! 🎉

---

## 🔌 Nền tảng AI hỗ trợ

Hòa hợp kỳ diệu cùng luồng làm việc của bạn:
- **Cursor** (`--platform cursor`) - IDE code bằng AI số 1 hiện nay.
- **Claude / Amp** (`--platform amp`) - CLI siêu mạnh từ Anthropic.
- **Gemini CLI** (`--platform gemini`) - Công cụ của Google.
- **Antigravity** (`--platform antigravity`) - Extension nội bộ của Google.
- **OpenCode** (`--platform opencode`) - Lựa chọn mã nguồn mở.
- **Claude Code** (`--platform claude`) - Hỗ trợ phiên bản cũ.

---

## 💎 Phiên bản Free và Pro

| Tính năng | Free | Pro |
|---------|------|-----|
| Mức Giá | **$0** | **$39** (One-time) |
| Design Rules & UX Laws | 838+ & 48 | 838+ & 48 |
| Design Tests | 37 | 37 |
| Harvester (Trích xuất) | **v1 (~15 tokens)** | **v3 (80+ tokens)** 🔥 |
| Token Mapper | ❌ | ✅ CSS/Figma |
| Design Doc Generator | ❌ | ✅ HTML Output |
| Project Registry | ❌ | ✅ |
| Hỗ trợ | Cộng đồng | Ưu tiên |

> **Thăng hạng lên Pro ngay hôm nay:** 👉 [ux-master.dev/pro](https://ux-master.dev/pro)

---

## 🤝 Đóng góp
Dự án luôn chào đón sự đóng góp của bạn! Nếu bạn muốn cải thiện ruleset, thêm framework mới hay bổ sung UX laws:
1. Fork repo và tạo branch mới (`git checkout -b feature/y-tuong-hay`).
2. Commit thay đổi của bạn.
3. Push lên branch và mở Pull Request.

## 📄 Giấy phép
Sử dụng MIT License - bạn được quyền tự do dùng trong bất kỳ dự án nào.

---
> **MasterDesign Agent** — 1 cái đầu cân cả phòng thiết kế. ✦
