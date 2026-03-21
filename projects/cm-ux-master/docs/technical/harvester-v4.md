# Harvester v4 — AI-Powered Visual Extraction

**Harvester v4** là công cụ thu thập design system tự động dựa trên kiến trúc [Semi Design](https://semi.design) (DouyinFE), cho phép bóc tách và tái hiện toàn diện design system của bất kỳ website nào.

## 🎯 Mục tiêu

Chuyển đổi từ:
- ❌ Code frontend chậm/cũ
- ❌ Không có design system chuẩn
- ❌ Khó maintain

Sang:
- ✅ Design system chuẩn Semi Design
- ✅ Component library tái sử dụng
- ✅ AI-powered code generation
- ✅ Xịn hơn, nhanh hơn, rẻ hơn

## ✨ Tính năng v4

| Feature | Description |
|---------|-------------|
| **Browser Automation** | Tự động mở browser, thu thập dữ liệu |
| **AI Visual Analysis** | Phân tích màu sắc, layout, typography |
| **Multi-page Crawl** | Thu thập từ nhiều trang cùng lúc |
| **Semi Architecture** | Kiến trúc chuẩn DouyinFE Semi Design |
| **Component Generation** | Tự động tạo React/Vue components |
| **Figma Tokens** | Export tokens cho Figma |
| **CLI Unified** | Một command cho toàn bộ workflow |

## 🚀 Quick Start

### 1. Cài đặt dependencies

```bash
cd /Users/todyle/Library/Mobile\ Documents/com~apple~CloudDocs/Code/AgentSkills/ux-master

# Cài Playwright
pip install playwright
playwright install chromium
```

### 2. Quick workflow (Extract + Index + Generate)

```bash
python3 scripts/harvester_cli.py quick https://example.com
```

### 3. Output

```
output/
├── design-system.css      # CSS variables theo Semi Design
├── design-system.json     # Full design tokens
├── figma-tokens.json      # Figma Tokens Studio
└── components/            # Generated components
    ├── button/
    ├── card/
    └── input/
```

## 📖 Sử dụng chi tiết

### A. Browser Automation

```bash
# Single URL
python3 scripts/harvester_browser.py --url https://example.com

# With screenshots
python3 scripts/harvester_browser.py --url https://example.com --mobile

# Multi-page crawl
python3 scripts/harvester_browser.py --url https://example.com --crawl --max-pages 5
```

### B. Design System Indexer

```bash
# Index single harvest
python3 scripts/design_system_indexer.py \
  --input harvest.json \
  --name "MyApp"

# Merge multiple
python3 scripts/design_system_indexer.py \
  --multi page1.json page2.json page3.json \
  --name "UnifiedSystem"

# With Figma tokens
python3 scripts/design_system_indexer.py \
  --input harvest.json \
  --figma
```

### C. Component Generator

```bash
# Generate all
python3 scripts/component_generator.py \
  --input design-system.json \
  --all --output ./components

# Specific component
python3 scripts/component_generator.py \
  --input design-system.json \
  --component button

# Semi Design framework
python3 scripts/component_generator.py \
  --input design-system.json \
  --all --framework semi
```

### D. Unified CLI

```bash
# Extract only
python3 scripts/harvester_cli.py extract --url https://example.com

# Extract + Generate
python3 scripts/harvester_cli.py extract --url https://example.com --generate

# Index only
python3 scripts/harvester_cli.py index --input harvest.json --name "MyApp"

# Generate only
python3 scripts/harvester_cli.py generate --input design-system.json --all
```

## 🏗️ Kiến trúc Semi Design

### Color System

```css
/* Brand Colors */
--semi-color-primary
--semi-color-secondary
--semi-color-tertiary

/* Semantic Colors */
--semi-color-success
--semi-color-warning
--semi-color-danger
--semi-color-info

/* Neutral Scale */
--semi-color-neutral-50 to -900

/* Background */
--semi-color-bg-0  /* Page */
--semi-color-bg-1  /* Card */
--semi-color-bg-2  /* Sidebar */
--semi-color-bg-3  /* Header */
--semi-color-bg-4  /* Modal */

/* Fill (Hover/Selected) */
--semi-color-fill-0
--semi-color-fill-1
--semi-color-fill-2

/* Text */
--semi-color-text-0  /* Primary */
--semi-color-text-1  /* Secondary */
--semi-color-text-2  /* Tertiary */
--semi-color-text-3  /* Disabled */
```

### Spacing System

```css
--semi-spacing-none: 0
--semi-spacing-super-tight: 2px
--semi-spacing-extra-tight: 4px
--semi-spacing-tight: 8px
--semi-spacing-base-tight: 12px
--semi-spacing-base: 16px
--semi-spacing-base-loose: 20px
--semi-spacing-loose: 24px
--semi-spacing-extra-loose: 32px
--semi-spacing-super-loose: 40px
```

### Border Radius

```css
--semi-border-radius-extra-small: 3px
--semi-border-radius-small: 3px
--semi-border-radius-medium: 6px
--semi-border-radius-large: 12px
--semi-border-radius-circle: 50%
--semi-border-radius-full: 9999px
```

### Shadow System

```css
--semi-shadow-sm: 0 0 1px rgba(0,0,0,0.1)
--semi-shadow-elevated: 0 0 1px rgba(0,0,0,0.3), 0 4px 14px rgba(0,0,0,0.1)
--semi-shadow-lg: 0 0 1px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.12)
```

## 🔧 Generated Components

### React + Tailwind

```tsx
// Button với variants
<Button variant="primary" size="md">
  Click me
</Button>

// Card
<Card variant="elevated">
  <CardContent>
    Content here
  </CardContent>
</Card>
```

### Semi Design

```tsx
import { Button, Card, Input } from "@douyinfe/semi-ui";

<Button type="primary" size="large">
  Click me
</Button>

<Card title="Title">
  Card content
</Card>
```

## 📊 Workflow cho Doanh nghiệp

### Phase 1: Thu thập (1-2 ngày)

```bash
# Thu thập từ app hiện tại
python3 scripts/harvester_cli.py extract \
  --url https://myapp.com \
  --crawl --max-pages 20 \
  --output ./myapp-design-system
```

### Phase 2: Index & Standardize (1 ngày)

```bash
# Tạo design system chuẩn
python3 scripts/design_system_indexer.py \
  --multi ./myapp-design-system/*.json \
  --name "MyAppDesignSystem"
```

### Phase 3: Component Library (2-3 ngày)

```bash
# Generate component library
python3 scripts/component_generator.py \
  --input ./myapp-design-system/design-system.json \
  --all --framework react-tailwind \
  --output ./myapp-components
```

### Phase 4: Tích hợp (ongoing)

Sử dụng AI IDE/CLI + UX Master để code với design system mới:

```bash
# Trong project mới
npm install @douyinfe/semi-ui  # hoặc Tailwind với design tokens

# Sử dụng generated components
import { Button, Card, Input } from "./components";
```

## 🎨 Ví dụ: Chuyển đổi từ app cũ sang mới

### Before (Code cũ)

```tsx
// ❌ Hardcoded, không consistent
<button className="px-4 py-2 bg-blue-500 text-white rounded">
  Save
</button>

<button className="px-3 py-1 bg-blue-400 text-white rounded-sm">
  Cancel
</button>
```

### After (Với Design System)

```tsx
// ✅ Consistent, maintainable
<Button variant="primary" size="md">
  Save
</Button>

<Button variant="secondary" size="md">
  Cancel
</Button>
```

## 🔗 Tích hợp với AI Coding

### Claude/Cursor/Windsurf

```markdown
Sử dụng design system từ file ./design-system.css
Các component có sẵn trong ./components/

Yêu cầu:
1. Sử dụng Button với variant="primary" cho action chính
2. Card với variant="elevated" cho content blocks
3. Màu primary: var(--semi-color-primary)
4. Spacing: sử dụng --semi-spacing-* variables
```

## 📚 Tài liệu tham khảo

- [Semi Design Documentation](https://semi.design)
- [Semi Design GitHub](https://github.com/DouyinFE/semi-design)
- [Figma Tokens Studio](https://tokens.studio)

## 📝 License

MIT License - UX Master AI
