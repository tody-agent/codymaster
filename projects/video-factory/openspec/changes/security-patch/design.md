# Design: Khắc phục Lỗ hổng Tràn ngược System Commands (Command Injection) và Nguồn cung cấp (Supply Chain)

## Context & Technical Approach
Ứng dụng đang sử dụng `execSync` thông qua node `child_process` để gọi liên tục các script sinh ra ngoài hệ điều hành (`edge-tts`, `say`, `npx`, `nlm`). Việc truyền tham số sử dụng chuỗi nội suy (string interpolation) gây rủi ro bảo mật cực cao nếu file kịch bản (JSON array) hoặc input của AI cố tình/vô tình trả về ký tự điều khiển shell (như backtick, semicolon, `$( ...)`).
Giải pháp: Chuyển toàn bộ chuỗi nội suy thành mảng biến tham số đầu vào. Dùng `execFileSync` hoặc `spawnSync` để Node.js escape thông tin một cách an toàn nhất, đóng dấu gói thành một arg duy nhất trước khi đưa tới file nhị phân.
Hơn nữa, dependency của React (Remotion) kéo version cũ của `loader-utils` (có lỗ hổng ReDOS). Giải quyết qua npm overrides ở gốc package.json.

## Proposed Changes
### `package.json`
- **What changes:** Thêm node `overrides`.
- **Why this approach:** Cho phép ép mọi module con sử dụng `loader-utils` patch an toàn mà không cần chờ remotion update.

### `pipelines/agents/tts.ts`
- **What changes:** Thay `execSync(chuỗi)` thành `execFileSync(binary, [args])`.
- **Why this approach:** Xử lý ký tự đặc biệt theo đúng nghĩa đen, không nội suy lệnh Linux/macOS. 

### `pipelines/agents/renderer.ts`
- **What changes:** Thay đổi tương đương cho `npx remotion ...`
- **Why this approach:** Vì nội suy `safeProps` trước đây chưa xử lý escape triệt để.

### `pipelines/agents/nlm.ts`
- **What changes:** Thay đổi tương đương API của Terminal Client `nlm`.

## Verification
1. Chạy `npm install` và `snyk test` để clean vulnerabilities.
2. Sinh thử video/audio thật thông qua luồng chạy lệnh để confirm module còn tương tác thành công như cũ.
