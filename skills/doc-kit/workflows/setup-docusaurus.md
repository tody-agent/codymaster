---
description: "Scaffold a premium Docusaurus site from generated documentation files."
---

# Setup Docusaurus — Premium Workflow

Create a professional Docusaurus static site from the generated documentation.

## Prerequisites

- Node.js 18+
- Generated docs in `[project_root]/docs/`

## Steps

### 1. Initialize Docusaurus + Mermaid

// turbo
```bash
cd [project_root]
npx -y create-docusaurus@latest docusaurus-site classic --typescript
```

// turbo
```bash
cd docusaurus-site
npm install @docusaurus/theme-mermaid
```

### 2. Clean Boilerplate & Copy Docs

// turbo
```bash
# CRITICAL: Remove ALL default boilerplate docs first
rm -rf docusaurus-site/docs/*
rm -rf docusaurus-site/blog
rm -rf docusaurus-site/src/pages/index.tsx

# Copy generated docs
cp -r docs/*.md docusaurus-site/docs/

# Fix MDX-incompatible filenames
cd docusaurus-site/docs

# Rename underscore-prefixed files (they are ignored by Docusaurus)
for f in _*.md; do
  [ -f "$f" ] && mv "$f" "${f#_}"
done

# Rename README.md to index.md (Docusaurus convention)
[ -f README.md ] && mv README.md index.md

# Remove old/duplicate docs if any (common in projects)
# Files with dots in names cause issues (e.g., Deploy.vi.md)
for f in *.*.md; do
  [ -f "$f" ] && rm "$f"
done
```

### 3. Apply Premium Configuration

Copy the premium template from doc-kit:

```bash
# Copy premium CSS
cp ~/.gemini/antigravity/skills/doc-kit/templates/docusaurus-premium/src/css/custom.css \
   docusaurus-site/src/css/custom.css

# Copy premium config as base (then customize below)
cp ~/.gemini/antigravity/skills/doc-kit/templates/docusaurus-premium/docusaurus.config.ts \
   docusaurus-site/docusaurus.config.ts
```

Then **customize** `docusaurus-site/docusaurus.config.ts`:

Replace all `[PLACEHOLDER]` values:
- `[Project Name]` → actual project name
- `[GITHUB_URL]` → actual GitHub URL
- Update `url` and `baseUrl` for deployment target
- Add footer links (Discord, HuggingFace, etc.)
- Adjust `i18n` locales if multilingual

### 4. Generate Sidebar

Create `docusaurus-site/sidebars.ts` based on the actual docs structure.

**Method:** Scan `docusaurus-site/docs/` and build sidebar config:

```typescript
import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docs: [
    'index',
    // Group by logical categories based on actual content
    {
      type: 'category',
      label: 'Architecture & Technical',
      items: [
        // List actual filenames (without .md) found in docs/
        // e.g., 'architecture', 'database', 'deployment', 'data-flow'
      ],
    },
    {
      type: 'category',
      label: 'User Guides',
      items: [
        // Auto-populate from docs/sop/*.md files
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      items: [
        // Auto-populate from docs/api/*.md files
      ],
    },
  ],
};

export default sidebars;
```

> **Important:** Sidebar item IDs must match actual filenames (without `.md` extension).
> Files with underscore prefix are ignored by Docusaurus — that's why Step 2 renames them.

### 5. Build & Verify

```bash
cd docusaurus-site
npm run build 2>&1 | tee build.log
```

**Expected:** Build completes with exit code 0. Check `build.log` for warnings.

**Common build errors and fixes:**

| Error | Cause | Fix |
|-------|-------|-----|
| `Unexpected character` | Unescaped `<`, `{` in markdown | Escape: `\<`, `\{` |
| `sidebar document ids do not exist` | Wrong ID in sidebars.ts | Match actual filenames |
| `Invalid sidebar file` | Underscore-prefixed files | Rename: remove `_` prefix |
| `Duplicate routes` | Multiple index pages | Keep only one `index.md` |
| Mobile sidebar transparent | Glassmorphism `rgba()` in `--ifm-navbar-background-color` | See CSS fix below |

### 6. Verify Mobile Menu

> **CRITICAL**: The premium CSS uses glassmorphism (`rgba()` background) on the navbar.
> Docusaurus reuses `--ifm-navbar-background-color` for the mobile sidebar,
> making it transparent. The template CSS already overrides this with opaque colors.
>
> **If you customize `custom.css`**, NEVER:
> - Set `--ifm-navbar-background-color` to a translucent `rgba()` value
> - Add `overflow-y: auto` on `.navbar-sidebar__items` (clips the panel slide)
> - Override `transform` on `.navbar-sidebar` (breaks Docusaurus's slide animation)

After build, verify mobile menu works:

1. Serve the site: `npm run serve -- --port 3000`
2. Open in browser at mobile viewport (390×844)
3. Click hamburger menu (☰)
4. Verify: sidebar has opaque background, all items visible, navigation works

### 7. Preview

```bash
cd docusaurus-site
npm run serve -- --port 3000
```

Open `http://localhost:3000` to preview.

### 8. Post-Setup Optimizations (Optional)

#### Add Search Plugin
```bash
cd docusaurus-site
npm install @easyops-cn/docusaurus-search-local
```

Add to `docusaurus.config.ts`:
```typescript
themes: [
  '@docusaurus/theme-mermaid',
  ['@easyops-cn/docusaurus-search-local', { hashed: true }],
],
```

#### Deploy to GitHub Pages
```bash
cd docusaurus-site
GIT_USER=<GITHUB_USERNAME> npm run deploy
```
