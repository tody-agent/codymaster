---
description: "Scaffold a premium VitePress site from generated documentation files."
---

# Setup VitePress — Premium Workflow

Create a professional VitePress static site from the generated documentation.

## Prerequisites

- Node.js 18+
- Generated docs in `[project_root]/docs/`

## Steps

### 1. Scaffold Premium Boilerplate

// turbo
```bash
cd [project_root]
# Copy the entire robust boilerplate (includes package.json, tests, and .vitepress)
cp -r ~/.gemini/antigravity/skills/cm-dockit/templates/vitepress-premium docs-site

# Install dependencies
cd docs-site
npm install
```

> **Note:** The new boilerplate is configured with `srcDir: '../docs'`. This means VitePress will automatically read your generated Markdown from `[project_root]/docs/` without needing to copy them into `docs-site/`! This prevents duplicate files and sync issues.

### 2. Verify Output & Run Test Gate

// turbo
```bash
cd [project_root]/docs-site
# Run the automated frontend testing gate to verify config and dependencies
npm run test:gate
```

> **Important:** If `test:gate` fails, the `config.mts` or Markdown frontmatter may have syntax errors. Fix them before proceeding.

### 3. Customize Configuration

Edit `docs-site/.vitepress/config.mts`:

Replace all `[PLACEHOLDER]` values:
- `[Project Name]` → actual project name
- Update `sitemap.hostname` for deployment target
- Add social links (GitHub, etc.)

### 4. Generate Sidebar

Update the `sidebar` in `docs-site/.vitepress/config.mts` based on actual docs structure.

**Method:** Scan `docs-site/` and build sidebar config:

```typescript
sidebar: [
  {
    text: 'Overview',
    items: [
      { text: 'Introduction', link: '/' },
    ],
  },
  {
    text: 'Architecture & Technical',
    items: [
      // List actual filenames found in docs-site/
      // e.g., { text: 'Architecture', link: '/architecture' },
      // e.g., { text: 'Database', link: '/database' },
    ],
  },
  {
    text: 'User Guides',
    items: [
      // Auto-populate from docs-site/sop/*.md
    ],
  },
  {
    text: 'API Reference',
    items: [
      // Auto-populate from docs-site/api/*.md
    ],
  },
],
```

> **Important:** VitePress sidebar `link` values are file paths without `.md` extension.
> Example: `architecture.md` → `link: '/architecture'`

### 5. Build & Verify

// turbo
```bash
cd docs-site
npm run build 2>&1 | tee build.log
```

**Expected:** Build completes with exit code 0. Check `build.log` for warnings.

**Common build errors and fixes:**

| Error | Cause | Fix |
|-------|-------|-----|
| `dead link found` | Broken relative link | Fix link path |
| `sidebar item not found` | Wrong link in sidebar config | Match actual filenames |
| `YAML parse error` | Invalid frontmatter | Fix YAML syntax |

> **Note:** VitePress uses pure markdown — no MDX escaping issues!
> Characters like `<`, `{`, `}` work normally in markdown content.

### 6. Preview

```bash
cd docs-site
npm run dev -- --port 3000
```

Open `http://localhost:3000` to preview.

**Verify checklist:**
- [ ] Mermaid diagrams render correctly ← **CRITICAL**
- [ ] Dark/light mode toggle works
- [ ] Sidebar navigation works
- [ ] Search works (type `/` to focus)
- [ ] Admonitions (:::tip, :::warning) display correctly
- [ ] `<details>` sections expand/collapse
- [ ] Mobile responsive (hamburger menu)

### 7. Post-Setup Optimizations (Optional)

#### Code Groups (Multi-platform examples)

VitePress has built-in code groups (replaces Docusaurus Tabs):

```md
::: code-group

```bash [npm]
npm install myapp
```

```bash [yarn]
yarn add myapp
```

```bash [pnpm]
pnpm add myapp
```

:::
```

#### Deploy to GitHub Pages

```bash
# Add to package.json scripts:
# "docs:build": "vitepress build",
# "docs:preview": "vitepress preview"

# Build and deploy
cd docs-site
npx vitepress build
# Output is in .vitepress/dist/
```

#### Deploy to Cloudflare Pages

```bash
# Build command: npx vitepress build
# Build output directory: .vitepress/dist
# Node.js version: 18
```

#### Deploy to Vercel

```bash
# Framework Preset: VitePress
# Build command: npx vitepress build
# Output directory: .vitepress/dist
```
