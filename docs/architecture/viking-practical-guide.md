---
title: Thực Chiến: Đưa OpenViking & OpenSpace vào một Project mới
description: Hướng dẫn tích hợp và các Use Case thực tế khi CodyMaster kết hợp sức mạnh của OpenViking và OpenSpace.
---

# 🚀 Thực Chiến: Ứng dụng OpenViking + OpenSpace vào Project

Sự kết hợp giữa **OpenViking** (Não bộ ngữ nghĩa - Vector Memory) và **OpenSpace** (Hệ điều hành Agent đa nhiệm - Multi-Agent OS) biến CodyMaster từ một công cụ code thông thường thành một **Hệ Thống Trí Tuệ Tập Thể** cho dự án của bạn.

Dưới đây là hướng dẫn chính xác những gì bạn cần làm để kích hoạt, và những Use Case thực tế giá trị nhất.

---

## 🛠 Phần 1: Cần làm gì để áp dụng vào một Project?

Để "hack" não bộ Viking vào dự án hiện tại, bạn chỉ cần thực hiện 3 bước đơn giản:

### Bước 1: Khởi động OpenViking Engine (Local hoặc Server nội bộ)
Viking sẽ chạy như một Core Service lưu trữ vector.
```bash
# Cài đặt qua PIP
pip install openviking --upgrade

# Chạy server ở chế độ daemon (mặc định port 1933)
openviking start
```

### Bước 2: Cấu hình Project nối vào Viking
Vào thư mục gốc của dự án, mở file `.cm/config.yaml` và trỏ Storage Backend về Viking:
```yaml
storage:
  backend: viking
  viking:
    host: localhost
    port: 1933
    workspace: my-awesome-project # Tên định danh của project này trên Viking
```

### Bước 3: Ép Agent "Ăn" Mã Nguồn (Ingestion)
Sau khi setup, hệ thống sẽ tự động phân tích và Vector hóa toàn bộ quyết định, lỗi, và kiến trúc của dự án lên Viking. Bạn kích hoạt lệnh học:
```bash
cm codeintell --index-all   # Quét toàn bộ kiến trúc (OpenSpace AST)
cm continuity sync          # Đẩy toàn bộ Lịch sử lỗi / Quyết định cũ lên Viking
```
*Xong! Từ giờ toàn bộ Agent hoạt động trên Project này sẽ chia sẻ chung một "Bể Trí Tuệ".*

---

## 🔥 Phần 2: Các Use Case "Đáng Tiền" Nhất Khi Áp Dụng Thực Tế

Khi Viking (Trí nhớ ngữ nghĩa) kết hợp với OpenSpace (Quản lý nhiều Agent cùng lúc), bạn sẽ làm được những việc mà trước đây các AI thông thường "bó tay":

### 🌟 Use Case 1: Onboarding "Tốc Độ Ánh Sáng" Cho Agent Vào Monolith
*Bài toán:* Khi đưa 1 AI Agent mới vào maintain một hệ thống Monolith cũ 5 năm tuổi, việc đọc hết codebase sẽ nổ Token limit và agent sẽ bị "đơ" hoặc ảo giác.

*Cách hệ thống giải quyết:*
1. Agent mới gửi truy vấn: `"Tôi cần sửa luồng thanh toán giỏ hàng, cho tôi kiến trúc liên quan."`
2. **Viking** tìm kiếm ngữ nghĩa, hiểu rằng "thanh toán" liên quan đến `CheckoutService`, `StripeController` và `OrderSaga`.
3. Thay vì trả về 10 file code dài ngoằng, Viking tự động tạo và trả về **L1 Overview** (Một bản tóm tắt siêu ngắn gọn về luồng Checkout).
4. **Kết quả:** Agent nắm ngay luồng xử lý trong 5 giây, chỉ tốn 300 Token, và biết chính xác file nào cần Edit mà không cần đọc toàn bộ hệ thống.

---

### 🌟 Use Case 2: Phối Hợp Gỡ Lỗi Xuyên Thời Gian (Multi-Agent Knowledge Sharing)
*Bài toán:* Agent A debug một bài toán cực khó mất 4 tiếng. Tuần sau, Agent B lại gặp lỗi đó ở một component khác. Chúng ta không muốn Agent B mất thêm 4 tiếng nữa.

*Cách hệ thống giải quyết:*
1. Agent A sửa xong lỗi (ví dụ: *Memory leak do Cache Redis không có TTL*), **OpenSpace** tự động lưu kinh nghiệm đó lên **Viking**.
2. Tuần sau, Agent B được user giao task, ứng dụng bị crash văng ra log có chữ `"OOM Killed"`.
3. Agent B hỏi Viking: `"Ứng dụng sập do hết bộ nhớ"`. Do dùng Vector, Viking hiểu `"OOM Killed"` và `"Memory Leak"` là anh em họ hàng. Nó lập tức ném kinh nghiệm của Agent A cho Agent B.
4. **Kết quả:** Agent B không cần suy nghĩ mông lung, gọi thẳng lệnh sửa TTL trên Redis. Fix lỗi trong 1 phút thay vì 4 tiếng.

---

### 🌟 Use Case 3: Refactoring Ngữ Nghĩa Toàn Dự Án (Semantic Code Refactoring)
*Bài toán:* Bạn muốn thay đổi cách hệ thống "Xác thực người dùng", bạn cần quy hoạch lại mọi nơi đang check quyền User.

*Cách hệ thống giải quyết (khi không có Viking):* Bạn dùng Regex hoặc `grep -r "checkAuth"`. Bạn sẽ bỏ sót những file code ghi là `verifyToken` hay `ensureLoggedIn`. Nguy cơ sập hệ thống (Oversight Regression) rất cao.

*Cách hệ thống giải quyết (với Viking + OpenSpace):*
1. Agent gọi hệ thống: `"Tìm tất cả các Logic có tính chất xác thực danh tính người dùng trước khi thực thi action."`
2. **Viking** vét toàn bộ các code blocks trong dự án. Dù code ghi là `verifyToken`, `checkAuth`, `AuthGuard`, hay `ensureLoggedIn`, nó đều lôi ra hết vì **chúng có chung Tọa Độ Ngữ Nghĩa**.
3. **OpenSpace** nhận list các file đó, và tự động tạo ra một **Kế hoạch Refactor (Implementation Plan)** chính xác tuyệt đối không lọt một khe nào.

---

### 🌟 Use Case 4: Theo dõi và phòng chống Nợ Kỹ Thuật (Tech Debt Guard)
*Bài toán:* Lập trình viên thường "để lại tạm" một đoạn code xấu (`// TODO: fix later`) và sau đó quên mất, theo thời gian tích tụ thành nợ kỹ thuật phá vỡ kiến trúc.

*Cách hệ thống giải quyết:*
1. Bất cứ khi nào Agent nhận lệnh `cm quality-gate` trước khi deploy.
2. Nó sẽ quét qua code và dùng **Viking** để tra cứu: *"Đoạn code này có vi phạm những Architecture Decisions (ADR) mà hệ thống từng cam kết trong quá khứ không?"*
3. Nếu bạn từng ghi vào bộ nhờ: *"Không gọi trực tiếp DB từ Controller"*, Viking sẽ "đánh hơi" thấy điểm tương đồng ngữ nghĩa giữa luồng hiện tại và luật cấm kia.
4. Nó chặn tiến trình deploy và đề xuất cấu trúc ulang (refactor) lại ngay lập tức. Đây là một trình bảo vệ kiến trúc bằng tư duy thay vì chỉ bằng Linter khô khan.
