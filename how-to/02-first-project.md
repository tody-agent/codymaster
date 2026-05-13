# Your First Project

> Bootstrap a new project with design system, CI/CD, and deploy pipeline from Day 0. This guide walks you through creating a production-ready project using CodyMaster's best practices.

## Table of Contents

1. [Project Types](#project-types)
2. [Interactive Bootstrap](#interactive-bootstrap)
3. [Manual Bootstrap](#manual-bootstrap)
4. [Design System Setup](#design-system-setup)
5. [CI/CD Configuration](#cicd-configuration)
6. [Testing Infrastructure](#testing-infrastructure)
7. [i18n from Day 0](#i18n-from-day-0)
8. [First Feature](#first-feature)
9. [Deployment](#deployment)

---

## Project Types

CodyMaster supports multiple project types with optimized configurations:

| Type | Framework | Use Case |
|------|-----------|----------|
| **Next.js** | React + SSR/SSG | Web apps, e-commerce, marketing sites |
| **Astro** | Content-focused | Blogs, docs, landing pages |
| **React** | Client-side SPA | Dashboards, admin panels |
| **Vue** | Reactive UI | Interactive applications |
| **Node.js** | Backend API | REST/GraphQL services |
| **Python** | FastAPI/Django | ML apps, data services |
| **Flutter** | Cross-platform mobile | iOS + Android apps |

---

## Interactive Bootstrap

### Step 1: Start the Wizard

```bash
# Navigate to your workspace (not inside any project)
cd ~/projects

# Run the bootstrap wizard
cm project bootstrap
```

### Step 2: Answer Questions

The wizard will ask:

```
? Project name: my-awesome-app
? Project type: (Use arrow keys)
  ❯ Next.js (React + SSR)
    Astro (Content-focused)
    React (Client SPA)
    Vue (Reactive UI)
    Node.js (Backend API)
    Python (FastAPI)
    Flutter (Mobile)

? GitHub organization: your-org
? Use TypeScript? Yes
? Include design system? Yes
? Include i18n (multi-language)? Yes
? Deployment target: Cloudflare Pages
? Include testing? Yes
? Include linting/formatting? Yes
```

### Step 3: Review Summary

```
📋 Project Summary:

  Name:           my-awesome-app
  Type:           Next.js + TypeScript
  Design System:  Shadcn UI + Tailwind
  i18n:           English + Vietnamese
  Testing:        Vitest + Testing Library
  CI/CD:          GitHub Actions → Cloudflare
  Quality Gates:  Secret scan + Tests + Build + Lint

Proceed? (Y/n)
```

### Step 4: Wait for Setup

The wizard will:

1. **Create project structure**
   ```
   my-awesome-app/
   ├── .cm/
   ├── openspec/
   ├── agents/
   ├── src/
   ├── test/
   ├── docs/
   ├── public/
   ├── .github/workflows/
   ├── AGENTS.md
   ├── GEMINI.md
   └── package.json
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure design system**
   ```bash
   # Shadcn UI components
   npx shadcn-ui@latest init
   ```

4. **Set up testing**
   ```bash
   # Vitest + React Testing Library
   npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
   ```

5. **Configure i18n**
   ```bash
   # next-intl for Next.js
   npm install next-intl
   ```

6. **Set up CI/CD**
   ```yaml
   # .github/workflows/ci.yml
   name: CI/CD
   on: [push, pull_request]
   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
         - run: npm ci
         - run: npm run test:gate:kit
     deploy:
       needs: test
       if: github.ref == 'refs/heads/main'
       # ... deploy to Cloudflare
   ```

7. **Install Git hooks**
   ```bash
   cm hooks install
   ```

8. **Initialize memory system**
   ```bash
   cm continuity init
   ```

9. **Generate codebase analysis**
   ```bash
   cm index skeleton
   ```

10. **Run verification**
    ```bash
    cm doctor
    ```

---

## Manual Bootstrap

If you prefer manual setup:

### Step 1: Create Project

```bash
# Create Next.js project
npx create-next-app@latest my-app --typescript --tailwind --eslint --app --src-dir

cd my-app
```

### Step 2: Add CodyMaster

```bash
# Initialize CodyMaster
cm init

# The wizard will create:
# .cm/config.yaml
# .cm/CONTINUITY.md
# AGENTS.md
# .gitignore updates
```

### Step 3: Configure Settings

Edit `.cm/config.yaml`:

```yaml
project:
  name: "my-app"
  type: "nextjs"

quality:
  gates:
    secrets: true
    tests: true
    build: true
    lint: true

skills:
  auto_load: true
  max_concurrent: 3
```

### Step 4: Set Up Design System

```bash
# Install Shadcn UI
npx shadcn-ui@latest init

# Add components
npx shadcn-ui@latest add button card form input
```

### Step 5: Configure Testing

```bash
# Install testing dependencies
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom

# Create vitest.config.ts
cat > vitest.config.ts << 'EOF'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './test/setup.ts',
    globals: true,
  },
})
EOF

# Add test script to package.json
npm pkg set scripts.test="vitest"
npm pkg set scripts.test:run="vitest run"
```

### Step 6: Set Up i18n

```bash
# Install next-intl
npm install next-intl

# Create locale files
mkdir -p messages
cat > messages/en.json << 'EOF'
{
  "common": {
    "greeting": "Hello",
    "farewell": "Goodbye"
  }
}
EOF

cat > messages/vi.json << 'EOF'
{
  "common": {
    "greeting": "Xin chào",
    "farewell": "Tạm biệt"
  }
}
EOF
```

### Step 7: Set Up Quality Gates

```bash
# Create quality gate script
cat > scripts/test-gate.sh << 'EOF'
#!/bin/bash
set -e

echo "🔒 Running quality gates..."

# Gate 1: Secret scanning
echo "1/4 Scanning for secrets..."
npm run gate:secrets

# Gate 2: Linting
echo "2/4 Running linter..."
npm run lint

# Gate 3: Type checking
echo "3/4 Type checking..."
npm run typecheck

# Gate 4: Tests
echo "4/4 Running tests..."
npm run test:run

echo "✅ All gates passed!"
EOF

chmod +x scripts/test-gate.sh
npm pkg set scripts.test:gate="bash scripts/test-gate.sh"
```

### Step 8: Set Up Git Hooks

```bash
# Install pre-commit hooks
cm hooks install

# Verify
ls -la .git/hooks/
```

---

## Design System Setup

### Option A: Shadcn UI (Recommended)

```bash
# Initialize
npx shadcn-ui@latest init

# The wizard will ask:
# - Style: Default, New York, or Zinc
# - Base color: Slate, Gray, Zinc, Neutral, Stone
# - CSS variables: Yes/No
# - Tailwind config location
# - Components import alias
# - Utils import alias

# Add components as needed
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add form
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add dialog
```

### Option B: Custom Design System

```bash
# Create design tokens
mkdir -p src/design-system/tokens

cat > src/design-system/tokens/colors.ts << 'EOF'
export const colors = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  // ... more colors
}
EOF
```

### Option C: Extract from Existing Site

```bash
# Use cm-design-system to extract tokens
cm design extract https://example.com

# This will:
# 1. Analyze the site's CSS
# 2. Extract color palette
# 3. Extract typography scale
# 4. Extract spacing system
# 5. Generate design tokens
```

---

## CI/CD Configuration

### GitHub Actions (Default)

The bootstrap creates `.github/workflows/ci.yml`:

```yaml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      
      - name: Run quality gates
        run: npm run test:gate:kit
      
      - name: Build
        run: npm run build

  deploy:
    name: Deploy
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run build
      
      - name: Deploy to Cloudflare
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy ./out --project-name=my-app
```

### GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - test
  - deploy

test:
  stage: test
  image: node:20
  script:
    - npm ci
    - npm run test:gate:kit
    - npm run build

deploy:
  stage: deploy
  only:
    - main
  script:
    - npm ci
    - npm run build
    - npx wrangler pages deploy ./out --project-name=my-app
  variables:
    CLOUDFLARE_API_TOKEN: $CLOUDFLARE_API_TOKEN
```

---

## Testing Infrastructure

### Test Structure

```
test/
├── setup.ts              # Global test setup
├── unit/
│   ├── components/
│   │   └── Button.test.tsx
│   ├── hooks/
│   │   └── useAuth.test.ts
│   └── utils/
│       └── formatDate.test.ts
├── integration/
│   ├── api/
│   │   └── login.test.ts
│   └── pages/
│       └── dashboard.test.ts
└── e2e/
    └── user-flow.test.ts
```

### Example Tests

```typescript
// test/unit/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    fireEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>)
    expect(screen.getByText('Click me')).toBeDisabled()
  })
})
```

### Running Tests

```bash
# Run all tests
npm run test:run

# Run with coverage
npm run test:coverage

# Run specific test
npm run test:run -- Button.test.tsx

# Watch mode
npm run test:watch
```

---

## i18n from Day 0

### Project Structure

```
messages/
├── en.json              # English
├── vi.json              # Vietnamese
└── ja.json              # Japanese (add later)

src/
├── i18n/
│   ├── config.ts        # i18n configuration
│   └── request.ts       # Request configuration
└── app/
    └── [locale]/
        ├── layout.tsx   # Locale-aware layout
        └── page.tsx     # Locale-aware page
```

### Configuration

```typescript
// src/i18n/config.ts
export const locales = ['en', 'vi', 'ja'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'
```

### Usage in Components

```tsx
// app/[locale]/page.tsx
import { useTranslations } from 'next-intl'

export default function HomePage() {
  const t = useTranslations('common')
  
  return (
    <h1>{t('greeting')}</h1>
  )
}
```

### Adding New Languages

```bash
# 1. Create message file
cat > messages/ja.json << 'EOF'
{
  "common": {
    "greeting": "こんにちは",
    "farewell": "さようなら"
  }
}
EOF

# 2. Add locale to config
# Edit src/i18n/config.ts:
# export const locales = ['en', 'vi', 'ja'] as const

# 3. Test
npm run dev
# Visit /ja
```

---

## First Feature

### Using cm-start (Autonomous)

```bash
# Start with a feature goal
/cm-start "Add user authentication with login form and protected routes"

# The system will:
# 1. Create OpenSpec design
# 2. Break down into tasks
# 3. Execute via RARV loop
# 4. Run quality gates
# 5. Report completion
```

### Manual Feature Development

```bash
# Step 1: Plan
/cm-planning "Add user authentication"

# Step 2: Review the plan
cat openspec/changes/authentication/tasks.md

# Step 3: Execute tasks
/cm-execution

# Step 4: Review
/cm-code-review

# Step 5: Deploy
/cm-safe-deploy
```

---

## Deployment

### First Deploy

```bash
# Ensure secrets are set
gh secret set CLOUDFLARE_API_TOKEN
gh secret set CLOUDFLARE_ACCOUNT_ID

# Deploy
npm run deploy

# Or via CodyMaster
/cm-safe-deploy
```

### Verify Deployment

```bash
# Check deployment status
cm deploy status

# Open in browser
cm deploy open
```

### Custom Domain

```bash
# Add custom domain
cm deploy domain add example.com

# Configure DNS
# Add CNAME record pointing to your Cloudflare Pages URL
```

---

## Next Steps

- [Vibe Coding Daily Loop](./03-vibe-coding-loop.md) — Learn the daily rhythm
- [New Feature Development](./04-feature-development.md) — Build features systematically
- [Memory & Context Management](./11-memory-management.md) — Set up cross-session memory
