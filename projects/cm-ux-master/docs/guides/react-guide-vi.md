# Hướng dẫn sử dụng UX Master với React (Dự án Fila) ⚛️

Chào anh! Đây là hướng dẫn nhanh để anh tích hợp bộ thiết kế đã harvest từ dự án **Fila** vào ứng dụng React của mình.

## 1. Thành phần đã tạo
Em đã dùng CLI để tạo sẵn các tài liệu và mã nguồn sau trong thư mục `output/fila/`:
- `design-system.html`: Trang tài liệu thiết kế đầy đủ (màu sắc, font chữ, sample).
- `design-system.css`: Toàn bộ các biến CSS (Design Tokens).
- `components/`: Thư mục chứa các component React cơ bản (`button`, `card`, `input`, `badge`).
- `FilaDashboard.tsx`: Một file React mẫu hoàn chỉnh sử dụng các token.

## 2. Các bước tích hợp

### Bước 1: Copy tài liệu vào dự án của anh
```bash
# 1. Copy file CSS vào thư mục styles của React
cp output/fila/design-system.css path/to/your/src/styles/

# 2. Copy bộ component vào thư mục components
cp -r output/fila/components/* path/to/your/src/components/
```

### Bước 2: Import CSS Toàn cục
Trong file entry của ứng dụng (thường là `App.tsx` hoặc `main.tsx`):
```tsx
import './styles/design-system.css';
```

### Bước 3: Sử dụng Component
```tsx
import { Button, Card, Input } from './components';

function FilaExample() {
  return (
    <Card variant="elevated">
      <h1 style={{ color: 'var(--semi-color-primary)' }}>Chào mừng tới Fila</h1>
      <Input placeholder="Nhập tên dự án..." />
      <Button variant="primary">Lưu ngay</Button>
    </Card>
  );
}
```

## 3. Quản lý Design Tokens
Dữ liệu của anh sử dụng **Semi Design Architecture**. Anh có thể dùng trực tiếp các biến CSS trong code để đảm bảo đồng bộ hoàn toàn:
- Màu thương hiệu: `var(--semi-color-primary)`
- Bo góc: `var(--semi-border-radius-medium)`
- Spacing: `var(--semi-spacing-base)`

🚀 **Chúc anh code vui vẻ!**
