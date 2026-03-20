# UX Master v4 — Developer Guide 💻

> **Production-ready components. Exact design tokens. Zero guesswork.**

---

## Who You Are

- 💻 **Frontend Developer** building UI
- ⚛️ **React/Vue Developer** using modern frameworks
- 🏗️ **Tech Lead** architecting component libraries
- 🚀 **Full-Stack Dev** shipping end-to-end

**Your Goal**: Ship consistent, maintainable UI faster

---

## The Developer Experience

### Before UX Master
```javascript
// ❌ Hardcoded values everywhere
<button style={{
  backgroundColor: '#0064FA',  // Is this right?
  padding: '12px 24px',         // Or 16px?
  borderRadius: '6px'           // Or 8px?
}}>
  Click me
</button>

// ❌ Questions for designers:
// - What's the hover color?
// - What about disabled state?
// - Is this spacing correct?
```

### After UX Master
```javascript
// ✅ CSS variables from extracted design system
<button className="btn-primary">
  Click me
</button>

// ✅ In CSS
.btn-primary {
  background-color: var(--semi-color-primary);
  padding: var(--semi-spacing-base) var(--semi-spacing-loose);
  border-radius: var(--semi-border-radius-medium);
}

.btn-primary:hover {
  background-color: var(--semi-color-primary-hover);
}

// ✅ Or use generated component
import { Button } from './components';
<Button variant="primary">Click me</Button>
```

---

## Quick Start

### 1. Install Dependencies

```bash
# Install Playwright for extraction
pip install playwright
playwright install chromium

# Or use setup script
python setup.py
```

### 2. Extract Design System

```bash
# Extract from reference site
python scripts/wizard.py --url https://example.com --name "MyProject"
```

### 3. Use in Your Project

```bash
# Copy to your project
cp output/MyProject/design-system.css src/styles/
cp -r output/MyProject/components/* src/components/

# Import in your app
# src/index.tsx or src/main.tsx
import './styles/design-system.css';
```

### 4. Start Coding

```tsx
// Use generated components
import { Button, Card, Input } from './components';

function App() {
  return (
    <Card variant="elevated">
      <h1>Hello World</h1>
      <Input placeholder="Enter email" />
      <Button variant="primary">Submit</Button>
    </Card>
  );
}
```

---

## Integration Guides

### React + Tailwind CSS

**Setup:**
```bash
# Tailwind already configured in generated components
# Just extend with design tokens

# tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: 'var(--semi-color-primary)',
        secondary: 'var(--semi-color-secondary)',
        // Add more tokens
      },
      spacing: {
        'tight': 'var(--semi-spacing-tight)',
        'base': 'var(--semi-spacing-base)',
        'loose': 'var(--semi-spacing-loose)',
      },
      borderRadius: {
        'sm': 'var(--semi-border-radius-small)',
        'md': 'var(--semi-border-radius-medium)',
        'lg': 'var(--semi-border-radius-large)',
      }
    }
  }
}
```

**Usage:**
```tsx
// Use Tailwind with design tokens
<button className="bg-primary hover:bg-primary-hover px-base py-tight rounded-md">
  Click me
</button>
```

---

### Semi Design

**Install:**
```bash
npm install @douyinfe/semi-ui
```

**Override with extracted tokens:**
```tsx
// App.tsx
import { Button, Card } from '@douyinfe/semi-ui';
import './styles/design-system.css';

function App() {
  return (
    <div style={{
      // Override Semi tokens with extracted values
      '--semi-color-primary': '#0064FA',
      '--semi-color-success': '#10B981',
    }}>
      <Button type="primary">Semi Button</Button>
    </div>
  );
}
```

**CSS Import:**
```css
/* styles/design-system.css */
@import '@douyinfe/semi-ui/dist/css/semi.css';

/* Override with extracted tokens */
:root {
  --semi-color-primary: #0064FA;
  --semi-color-success: #10B981;
  /* ... rest of tokens */
}
```

---

### Vue 3

**Setup:**
```bash
# Generate Vue components
python scripts/component_generator.py \
  --input output/MyProject/design-system.json \
  --all --framework vue \
  --output ./src/components
```

**Usage:**
```vue
<!-- App.vue -->
<template>
  <Card variant="elevated">
    <h1>Hello Vue</h1>
    <Input v-model="email" placeholder="Enter email" />
    <Button variant="primary" @click="submit">Submit</Button>
  </Card>
</template>

<script setup>
import { ref } from 'vue';
import { Button, Card, Input } from './components';

const email = ref('');
const submit = () => console.log(email.value);
</script>

<style>
@import './styles/design-system.css';
</style>
```

---

### Next.js

**Setup:**
```tsx
// app/layout.tsx
import './globals.css';
import './styles/design-system.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Design tokens imported in layout */
```

---

## Working with Generated Components

### Component Structure

```
components/
├── button/
│   ├── component.tsx    # Main component
│   ├── index.ts         # Public exports
│   └── types.ts         # Type definitions (if separate)
├── card/
│   ├── component.tsx
│   └── index.ts
└── input/
    ├── component.tsx
    └── index.ts
```

### Using Components

```tsx
// Option 1: Import specific component
import { Button } from './components/button';

// Option 2: Import from barrel file
import { Button, Card, Input } from './components';

// Option 3: Import all
import * as UI from './components';

function App() {
  return (
    <UI.Card>
      <UI.Input placeholder="Type here" />
      <UI.Button variant="primary">Submit</UI.Button>
    </UI.Card>
  );
}
```

### Component Props

```tsx
// Button component interface
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

// Usage
<Button 
  variant="primary" 
  size="lg"
  onClick={handleClick}
>
  Click me
</Button>
```

---

## Design Tokens in Code

### CSS Variables

```css
/* Generated design-system.css */
:root {
  /* Colors */
  --semi-color-primary: #0064FA;
  --semi-color-primary-hover: #0052CC;
  --semi-color-primary-active: #0041A3;
  
  --semi-color-success: #10B981;
  --semi-color-warning: #F59E0B;
  --semi-color-danger: #EF4444;
  
  --semi-color-neutral-50: #F9FAFB;
  --semi-color-neutral-100: #F3F4F6;
  /* ... 200-900 */
  
  --semi-color-bg-0: #FFFFFF;
  --semi-color-bg-1: #F9FAFB;
  --semi-color-text-0: #111827;
  --semi-color-text-1: #4B5563;
  
  /* Typography */
  --semi-font-family-regular: 'Inter', -apple-system, sans-serif;
  --semi-font-size-regular: 14px;
  --semi-font-size-header-1: 32px;
  --semi-font-weight-bold: 600;
  --semi-line-height-regular: 1.5;
  
  /* Spacing */
  --semi-spacing-none: 0;
  --semi-spacing-tight: 8px;
  --semi-spacing-base: 16px;
  --semi-spacing-loose: 24px;
  
  /* Borders */
  --semi-border-radius-small: 3px;
  --semi-border-radius-medium: 6px;
  --semi-border-radius-large: 12px;
  --semi-border-thickness: 1px;
  
  /* Shadows */
  --semi-shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --semi-shadow-elevated: 0 4px 14px rgba(0,0,0,0.1);
}
```

### Using in JavaScript/TypeScript

```tsx
// Access tokens in JS
const primaryColor = getComputedStyle(document.documentElement)
  .getPropertyValue('--semi-color-primary');
// → " #0064FA"

// Set tokens dynamically
document.documentElement.style.setProperty(
  '--semi-color-primary', 
  '#FF0000'
);

// React hook for tokens
function useDesignToken(token: string) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(token);
}

// Usage
const primaryColor = useDesignToken('--semi-color-primary');
```

---

## Advanced Usage

### Customizing Components

```tsx
// Extend generated component
import { Button as BaseButton } from './components/button';

interface MyButtonProps extends React.ComponentProps<typeof BaseButton> {
  icon?: React.ReactNode;
}

export function Button({ icon, children, ...props }: MyButtonProps) {
  return (
    <BaseButton {...props}>
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </BaseButton>
  );
}
```

### Creating New Components

```tsx
// Use tokens to build custom components
interface StatCardProps {
  label: string;
  value: string;
  trend: 'up' | 'down' | 'neutral';
}

export function StatCard({ label, value, trend }: StatCardProps) {
  return (
    <div 
      className="p-6 rounded-lg"
      style={{
        backgroundColor: 'var(--semi-color-bg-1)',
        borderRadius: 'var(--semi-border-radius-large)',
        boxShadow: 'var(--semi-shadow-elevated)'
      }}
    >
      <p style={{ color: 'var(--semi-color-text-2)' }}>{label}</p>
      <h3 style={{ 
        color: 'var(--semi-color-text-0)',
        fontSize: 'var(--semi-font-size-header-3)'
      }}>
        {value}
      </h3>
      <span style={{
        color: trend === 'up' 
          ? 'var(--semi-color-success)' 
          : 'var(--semi-color-danger)'
      }}>
        {trend === 'up' ? '↑' : '↓'}
      </span>
    </div>
  );
}
```

---

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/design-system.yml
name: Design System Sync

on:
  push:
    branches: [main]
  schedule:
    - cron: '0 0 * * 1'  # Weekly check

jobs:
  extract-and-compare:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'
      
      - name: Install dependencies
        run: |
          pip install playwright
          playwright install chromium
      
      - name: Extract design system
        run: |
          python scripts/wizard.py \
            --url ${{ vars.STAGING_URL }} \
            --output ./current-ds
      
      - name: Compare with baseline
        run: |
          python scripts/figma_bridge.py compare \
            --harvester ./baseline/design-system.json \
            --figma ./current-ds/figma-tokens.json \
            > ./diff-report.md
      
      - name: Upload diff
        uses: actions/upload-artifact@v3
        with:
          name: design-system-diff
          path: ./diff-report.md
      
      - name: Comment PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const diff = fs.readFileSync('./diff-report.md', 'utf8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## 🎨 Design System Changes\n\n${diff}`
            });
```

### Pre-commit Hook

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Validate design tokens
python scripts/validate-tokens.py --config design-system.json

# Check for hardcoded colors (anti-pattern)
if grep -r "#[0-9A-Fa-f]\{6\}" src/ --include="*.tsx" --include="*.css"; then
  echo "❌ Hardcoded colors detected. Use CSS variables instead."
  exit 1
fi
```

---

## Testing

### Visual Regression Testing

```typescript
// design-system.test.ts
import { render, screen } from '@testing-library/react';
import { Button } from './components/button';

describe('Design System', () => {
  test('uses correct primary color', () => {
    render(<Button variant="primary">Test</Button>);
    const button = screen.getByRole('button');
    
    const styles = window.getComputedStyle(button);
    expect(styles.backgroundColor).toBe('rgb(0, 100, 250)'); // #0064FA
  });
  
  test('button variants exist', () => {
    const { rerender } = render(<Button variant="primary">P</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
    
    rerender(<Button variant="secondary">S</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
    
    rerender(<Button variant="outline">O</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
```

### Token Validation

```typescript
// tokens.test.ts
import tokens from './styles/design-system.json';

describe('Design Tokens', () => {
  test('has all required color tokens', () => {
    expect(tokens.color.primary).toBeDefined();
    expect(tokens.color.success).toBeDefined();
    expect(tokens.color.danger).toBeDefined();
  });
  
  test('neutral scale is complete', () => {
    const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
    steps.forEach(step => {
      expect(tokens.color[`neutral-${step}`]).toBeDefined();
    });
  });
  
  test('typography scale exists', () => {
    expect(tokens.typography['font-family-regular']).toBeDefined();
    expect(tokens.typography['font-size-regular']).toBeDefined();
  });
});
```

---

## Troubleshooting

### Issue: Components don't match design

**Debug:**
```bash
# 1. Check CSS variables loaded
python -c "
import json
with open('src/styles/design-system.json') as f:
    data = json.load(f)
    print('Primary:', data['tokens']['color']['primary'])
"

# 2. Verify in browser console
// document.documentElement.style.getPropertyValue('--semi-color-primary')

# 3. Re-extract with longer wait
python scripts/wizard.py --url ... --wait 5
```

### Issue: TypeScript errors

**Fix:**
```bash
# Regenerate with strict mode
cat > tsconfig.components.json << 'EOF'
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
EOF

# Check types
tsc --project tsconfig.components.json --noEmit
```

### Issue: Tokens not updating

**Fix:**
```bash
# Clear cache
rm -rf output/MyProject/

# Re-extract
python scripts/wizard.py --url ... --name MyProject

# Verify
ls -la output/MyProject/
```

---

## Best Practices

### Do's ✅

```css
/* ✅ Use CSS variables */
.button {
  background-color: var(--semi-color-primary);
}

/* ✅ Use semantic names */
.card {
  background-color: var(--semi-color-bg-1);
  color: var(--semi-color-text-0);
}

/* ✅ Use spacing tokens */
.container {
  padding: var(--semi-spacing-base);
  gap: var(--semi-spacing-tight);
}
```

### Don'ts ❌

```css
/* ❌ No hardcoded values */
.button {
  background-color: #0064FA; /* Don't do this */
}

/* ❌ No magic numbers */
.card {
  padding: 17px; /* Use tokens instead */
}

/* ❌ No inconsistent colors */
.text-primary { color: #111; }
.text-main { color: #0f0f0f; } /* Pick one */
```

---

## Your Workflow

### Daily Development

```bash
# 1. Extract reference (one-time)
python scripts/wizard.py --url https://reference.com --name "Reference"

# 2. Copy to project
cp output/Reference/design-system.css src/styles/
cp -r output/Reference/components/* src/components/

# 3. Import in app
import './styles/design-system.css';

# 4. Use components
import { Button, Card } from './components';
```

### When Design Changes

```bash
# 1. Re-extract
python scripts/wizard.py --url https://updated-site.com --name "Updated"

# 2. Diff changes
diff output/Old/design-system.css output/Updated/design-system.css

# 3. Update selectively
cp output/Updated/design-system.css src/styles/

# 4. Regenerate components if needed
python scripts/component_generator.py \
  --input output/Updated/design-system.json \
  --all
```

---

## Resources

- [Semi Design Docs](https://semi.design) — Component API reference
- [Tailwind CSS](https://tailwindcss.com) — Utility classes
- [CSS Variables](https://developer.mozilla.org/en-US/docs/Web/CSS/--*) — MDN reference
- [Design Tokens](https://design-tokens.github.io) — W3C spec

---

## Getting Help

**Questions?**
- Check [HOW-IT-WORKS.md](../technical/how-it-works.md)
- Review generated component code
- Run `python scripts/test_harvester_v4.py`

**Issues?**
- Re-extract with `--wait 5`
- Verify with `--verbose`
- Check screenshots in output

---

**Ready to code with confidence?** 💻

```bash
python scripts/wizard.py --url https://your-reference-site.com
```
