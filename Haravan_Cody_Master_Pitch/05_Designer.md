# Gửi Designer: Cây Nối Trực Tiếp với Mã Nguồn (Code)

> *"Có bao giờ bạn tỉ mẩn thiết kế một màn hình tuyệt mỹ trên Figma, căn đúng khoảng cách 16px, bảng màu HSL mượt mà... nhưng 2 tuần sau, giao diện lên trình duyệt bị Dev biến dạng thành một thứ gì đó trông là lạ?"*

Chào khối óc thị giác của Haravan.

Giữa Designer và Coder (Frontend) có chung một bi kịch ngàn đời: **"Độ vênh chuyển giao" (Handoff Translation Loss)**. Mỗi khi giao diện vẽ xong, Team Dev lại phải căng mắt ra đọc chỉ số CSS, chuyển ngữ ra React. Rất thường xuyên do gấp tiến độ, Dev dùng nhầm mã màu (Token), padding thụt ra thụt vào. Quá trình kiểm tra UI (Pixel-perfect check) gây tốn năng lượng khủng khiếp cho đôi bên.

**Cody Master Kit** sẽ biến bản vẽ thiết kế của bạn thành Mã Nguồn (Code-Ready) gần như ngay lập tức, mà khối Frontend có thể cắm vào chạy luôn.

### 🔄 Cách Mạng Hóa Quy Trình Thiết Kế Không Giới Hạn

**1. Từ Nét Nuốt Ra Code Sống Dữ Liệu (From Static to Code-Ready)**
- **👉 Trước đây (Before):** Figma sinh ra các tấm ảnh tĩnh. Dev nhìn và "chế lại" giao diện bằng mã nguồn React hoăc CSS tay.
- **🚀 Với Cody Master (After):** Nền tảng `cm-ui-preview` đóng vai trò phiên dịch. Bạn không nhất thiết phải vẽ Figma. Từ một đoạn văn bản (Text-to-UI) diễn tả chức năng từ PO/PM, AI lập tức tạo ra Giao diện thực tác động được (Rendered UI) sử dụng các MCP server chuyên nghiệp như Pencil.dev. Đầu ra có thể xuất thành Component code React để Dev copy & paste. Xong. 

**2. Di Sản "Design System" Tuyệt Đối**
- **👉 Trước đây (Before):** Có quy chế cho Polaris hay Harvester đấy, nhưng nếu Designer lười hoặc quên, và Dev tiện tay gõ luôn `#ff0000`, thì Design System cũng "vứt xó".
- **🚀 Với Cody Master (After):** Tính năng `cm-design-system` và `cm-ux-master` sẽ bóc tách (extract) toàn bộ Design System của Harvester hiện tại thành bộ não Tokens. Mỗi khi AI sinh ra màn hình mới, nó sẽ tự động khóa cứng vào bộ Tokens gốc này. Sẽ không bao giờ có chuyện lệch chuẩn hệ thống UI.

### 🛠️ 3 Thao Tác Cách Mạng Quy Trình Thiết Kế

Đừng chỉ dừng lại ở Wireframe trên bảng trắng. Ngày mai, hãy áp dụng quy trình "Preview Trước, Code Sau":

**Bước 1: Rút Trích Design Tokens Hiện Tại**
Sử dụng AI thu thập dữ liệu bộ nguyên tắc:
*`"Gọi luồng cm-design-system. Quét trang Landing Haravan hiện tại, lấy chuẩn Typography, Bảng Màu, Padding. Lưu thành bộ Tokens dự án cho tôi."`*

**Bước 2: Tự Động Hóa Khâu Nháp UI Trực Quan**
Ngồi giữa buổi họp lấy Requirement, thay vì đợi bản Figma nháp:
*`"Kích hoạt cm-ui-preview. Sử dụng bộ Harvester Token vừa lưu, vẽ ra màn hình Quản lý Trạng thái Đơn hàng 3 cột (Grid) qua Pencil.dev."`*

**Bước 3: Handoff Trực Tiếp**
Xuất hệ thống này cho Frontend với một cái vỗ vai: "Đấy, code chuẩn Token 100% rồi đấy, Dev chỉ việc nối API vào thôi".

Bạn đã thực sự trở thành một UX/UI Architect chi phối cả đầu ra kỹ thuật của hệ thống.
