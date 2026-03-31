const fs = require('fs');
const path = '../CodyMaster_Site/public/i18n/vi/home.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

data.v2 = data.v2 || {};
data.v2.title = "CodyMaster — Siêu Trợ Lý Nâng Cấp Năng Lực Cho AI Agent Của Bạn";
data.v2.hero = {
  badge1: "v4.3.0",
  badge2: "60 Kỹ Năng",
  badge3: "11+ Nền Tảng",
  badge4: "Mã Nguồn Mở",
  title: "Không thay thế AI của bạn.<br>Nó <em>nâng cấp</em> AI của bạn.",
  desc: "CodyMaster là một <strong>siêu trợ lý</strong> tích hợp thẳng vào AI coding agent của bạn. Nó trao cho agent bộ nhớ 5 tầng, hệ thống bảo vệ 8 cổng, và 60 kỹ năng chuyên biệt. Agent ngừng là junior bối rối — trở thành cộng sự tự sửa lỗi, tự tối ưu.",
  cta1: "🧬 Cộng sinh ngay — 60 giây",
  micro: "Miễn phí · Mã nguồn mở · Tương thích Cursor, Claude Code, Gemini, Windsurf, Kiro, Copilot & hơn nữa"
};
data.v2.diagnosis = {
  label: "🩺 Chẩn đoán",
  title: "AI Agent của bạn đang bệnh.<br>Bạn chỉ chưa biết thôi.",
  desc: "Mọi AI coding agent — Cursor, Claude Code, Copilot, Gemini — đều mắc những căn bệnh nan y giống nhau. Chúng thông minh nhưng đầy khiếm khuyết. Đây là chẩn đoán.",
  cards: {
    c1: { title: "Hội chứng Mất Trí Nhớ", desc: "Mỗi session là trang giấy trắng. Nó quên sạch context, lặp lại lỗi cũ, bạn phải giải thích lại từ đầu. Như làm việc với thực tập sinh mới mỗi buổi sáng — mỗi buổi sáng." },
    c2: { title: "Rối loạn Nhận dạng Thương hiệu", desc: "Cùng 1 brand, nó thiết kế 3 phong cách hoàn toàn khác nhau. Khách hàng nhìn vào tưởng bạn là 3 công ty khác nhau. Không design system, không consistency." },
    c3: { title: "Suy sụp Tự miễn dịch", desc: "Fix 1 bug, âm thầm phá vỡ 5 chỗ khác. Không test, không gate, không review. Code tự tấn công chính nó. Mỗi \"fix\" là một canh bạc." },
    c4: { title: "Suy giảm Miễn dịch Bảo mật", desc: "Hardcode API key, push secret lên GitHub, không quét lỗ hổng. Không có cơ chế phòng vệ. Hoá đơn AWS 10.000$ vào sáng hôm sau — chuyện có thật." },
    c5: { title: "Rối loạn Trao đổi chất Token", desc: "Đốt 140.000+ tokens mỗi lượt. Load toàn bộ skill dù chỉ cần 1. Chậm, đắt, lãng phí. Giống cơ thể không biết tiêu hoá — ăn nhiều mà không hấp thụ." },
    c6: { title: "Bất ổn Di truyền Output", desc: "Cùng prompt, khác ngày, output hoàn toàn khác. Không chuẩn hoá, không pattern, không nhất quán. Deploy = nhắm mắt cầu nguyện." }
  }
};

fs.writeFileSync(path, JSON.stringify(data, null, 2));
console.log("Batch 1 properties added to " + path);
