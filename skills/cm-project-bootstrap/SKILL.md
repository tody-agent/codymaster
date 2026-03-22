---
name: cm-project-bootstrap
description: Use when starting any new project from scratch. Asks for project identity (name, GitHub org, Cloudflare account), detects project type, sets up design system, staging+production, i18n from day 1, SEO foundation, AGENTS.md manifest, test infrastructure, 8-gate deploy pipeline, and disciplined development workflows. Prevents wrong deploys, redundant repos, and technical debt from day 0.
---

# 🏗️ CodyMaster Project Bootstrap v2.0

> **Every project starts here. No exceptions.**
> Inspired by best practices from Amp, Claude Code, Cursor, Lovable, and Manus agents.

## Core Principles

```
ASK FIRST. BUILD SECOND. NEVER ASSUME IDENTITY.
STAGING IS MANDATORY. PRODUCTION IS EARNED.
I18N FROM DAY 1. NOT "LATER."
DESIGN SYSTEM BEFORE COMPONENTS. TOKENS BEFORE PIXELS.
SEO IS NOT AN AFTERTHOUGHT. IT'S INFRASTRUCTURE.
EVERY PROJECT GETS AN AGENTS.MD. NO EXCEPTIONS.
```

---

## 11-Phase Bootstrap Process

```
Phase 0:    Identity Lock           — WHO are you deploying as?
Phase 0.5:  Security Foundation     — HOW do we prevent secret leaks?
Phase 1:    Project Type Detection   — WHAT kind of project?
Phase 2:    Repository & Environments — WHERE does code live?
Phase 3:    Design System Foundation — HOW does it look?
Phase 4:    i18n From Day 1         — WHICH languages?
Phase 5:    SEO Foundation          — HOW will people find it?
Phase 6:    AGENTS.md + Git Safety  — HOW do agents collaborate?
Phase 7:    Test Infrastructure     — HOW do we catch bugs?
Phase 8:    Deploy Pipeline (8 Gates) — HOW does code ship?
Phase 9:    Development Workflow    — HOW do we work daily?
```

---

## Phase 0: Identity Lock 🔐

> **MANDATORY. Cannot proceed without this.**
> **Values are NOT hardcoded — check history, suggest, let user confirm.**

### Step 1: Check Identity History

Before asking anything, check if `~/.cm-identity-history.json` exists.
If it does, load previous identities and **suggest** the most recently used values.

```json
// ~/.cm-identity-history.json — Auto-maintained across projects
{
  "lastUsed": "2026-03-17",
  "identities": [
    {
      "github": { "org": "my-work-org" },
      "cloudflare": { "accountId": "abc123def456ghi789jkl012mno345pqr" },
      "i18n": { "primary": "en", "targets": ["es", "fr", "de"] },
      "usedCount": 5,
      "lastProject": "my-awesome-project",
      "lastUsed": "2026-03-17"
    }
  ]
}
```

### Step 2: Ask with Suggestions

Present the 6 questions, pre-filling from history where available.
User only needs to **confirm or change**:

```
📋 NEW PROJECT — Identity Setup
(Values from your last project shown as suggestions)

1. Project name (kebab-case):       ___________
2. GitHub org [my-work-org]:         → Enter to keep, or type new
3. Cloudflare ID [abc12...5pqr]:     → Enter to keep, or type new
4. Domain:                           ___________
5. Primary language [en]:            → Enter to keep, or type new
6. Target languages [es, fr, de]:    → Enter to keep, or type new
```

> **RULE:** Never assume. Always show. Let user confirm.
> If no history exists, ask all 6 from scratch.

### Step 3: Verify Identity

```
⚠️ BEFORE PROCEEDING — CONFIRM:
🔐 GitHub Org:     {org}
☁️  Cloudflare:     {accountId}
🌐 Domain:         {domain}
🗣️  Languages:      {primary} (primary), {targets}
✅ Correct? → proceed
❌ Wrong?  → fix before continuing
```

### Step 4: Create `.project-identity.json`

```json
{
  "projectName": "{name}",
  "github": {
    "org": "{org}",
    "repo": "{name}"
  },
  "cloudflare": {
    "accountId": "{accountId}",
    "projectName": "{name}",
    "productionBranch": "production"
  },
  "domain": {
    "production": "{domain}",
    "staging": "staging.{domain}"
  },
  "i18n": {
    "primary": "{primary}",
    "targets": ["{targets}"]
  },
  "createdAt": "{date}",
  "bootstrapVersion": "2.0"
}
```

### Step 5: Save to History

After creating `.project-identity.json`, update `~/.cm-identity-history.json`:
- Add or update the identity entry
- Increment `usedCount`
- Update `lastProject` and `lastUsed`
- This ensures **next project** gets pre-filled suggestions automatically

> Call `cm-identity-guard` to verify git config matches the GitHub org BEFORE any git push.

---

## Phase 0.5: Security Foundation 🛡️

> **NEW — Defense-in-depth from day 0. Secrets leak at project start when security is "later."**
> **Calls `cm-secret-shield` for setup.**

### Step 1: Create `.gitleaks.toml`

Create project-level Gitleaks configuration:

```toml
# .gitleaks.toml — Secret Shield Config
title = "CM Secret Shield"

[extend]
useDefault = true

[[rules]]
id = "supabase-service-key"
description = "Supabase Service Role Key"
regex = '''eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+'''
tags = ["supabase", "jwt"]

[[rules]]
id = "generic-high-entropy"
description = "High entropy string that may be a secret"
regex = '''(?i)(api[_-]?key|secret[_-]?key|access[_-]?token|private[_-]?key|auth[_-]?token)\s*[=:]\s*['"][a-zA-Z0-9/+=]{20,}['"]'''
tags = ["generic"]

[allowlist]
paths = ['''\.gitleaks\.toml$''', '''\.dev\.vars\.example$''', '''node_modules/''', '''dist/''']
```

### Step 2: Setup Pre-Commit Hook

```bash
# Install git pre-commit hook for secret scanning
mkdir -p .git/hooks
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/sh
echo "🛡️ Secret Shield: scanning staged files..."
if command -v gitleaks &> /dev/null; then
  gitleaks git --pre-commit --staged --verbose
  if [ $? -ne 0 ]; then
    echo "❌ SECRET DETECTED! Commit blocked."
    exit 1
  fi
  echo "✅ No secrets detected"
else
  echo "⚠️ Gitleaks not installed. Running basic checks..."
  STAGED=$(git diff --cached --name-only --diff-filter=ACM)
  PATTERNS="SERVICE_KEY|ANON_KEY|PRIVATE_KEY|DB_PASSWORD|SECRET_KEY|sk-[a-zA-Z0-9]{20,}"
  for file in $STAGED; do
    if echo "$file" | grep -qE '\.(js|ts|json|toml|yaml|env)$'; then
      if git diff --cached "$file" | grep -qE "$PATTERNS"; then
        echo "❌ Potential secret in: $file"
        exit 1
      fi
    fi
  done
  echo "✅ Basic check passed"
fi
EOF
chmod +x .git/hooks/pre-commit
```

### Step 3: Add Security Script

Add to `package.json`:
```json
{
  "scripts": {
    "security:scan": "node scripts/security-scan.js || echo 'Create scripts/security-scan.js from cm-secret-shield'"
  }
}
```

### Step 4: Create `.dev.vars.example`

```bash
# .dev.vars.example — Template for local secrets (committed to repo)
# Copy to .dev.vars and fill in real values
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_KEY=your_service_key_here
SUPABASE_ANON_KEY=your_anon_key_here
```

> **RULE:** `.dev.vars` = real secrets (gitignored). `.dev.vars.example` = template (committed).

---

## Phase 1: Project Type Detection 🔍

> **Detect project type → auto-select the right stack.**
> **Default UI: shadcn/ui + Tailwind. Default layout: Mobile-first.**
> **Unless user explicitly requests otherwise.**

### Step 1: Ask Project Type

Present these options to the user:

| Type | When to use | Stack |
|------|------------|-------|
| **A. Static Website** | Docs, landing pages, portfolios | HTML + vanilla JS + CSS |
| **B. SPA (Vite)** | Dashboards, apps with client routing | Vite + React + TypeScript + **shadcn/ui** |
| **C. Cloudflare Workers** | APIs, backends, serverless functions | Hono + wrangler + TypeScript |
| **D. Fullstack (Workers + SPA)** | Complete apps with API + frontend | Hono + Vite + React + **shadcn/ui** |
| **E. Content Site (Astro)** | Blogs, docs, content-heavy sites | Astro + MDX |

### UI Library Default Rules

```
🎨 DEFAULT UI LIBRARY: shadcn/ui + Tailwind CSS
📱 DEFAULT LAYOUT: Mobile-first responsive

These defaults apply UNLESS user explicitly says otherwise.
Examples of overrides:
  - "Use Ant Design" → switch to Ant Design
  - "No mobile needed" → skip mobile optimization
  - "Desktop only" → desktop-first layout

If user says nothing about UI → use shadcn/ui + mobile-first.
```

### Step 2: Scaffold Based on Type

#### Type A: Static Website
```bash
mkdir -p public/static/{css,js,img} src tests/unit docs
touch public/index.html public/static/css/design-tokens.css public/static/css/style.css public/static/js/app.js
```

#### Type B: SPA (Vite) — with shadcn/ui
```bash
# Check available options first
npx -y create-vite@latest --help
# Scaffold React + TypeScript
npx -y create-vite@latest ./ --template react-ts
# Install Tailwind CSS
npm install -D tailwindcss @tailwindcss/vite
# Install and init shadcn/ui
npx -y shadcn@latest init
```

#### Type C: Cloudflare Workers
```bash
npm init -y
npm install hono wrangler --save-dev
mkdir -p src tests/unit
touch src/index.ts wrangler.jsonc
```

#### Type D: Fullstack — with shadcn/ui
```bash
# Workers backend + Vite frontend in one repo
mkdir -p api/src frontend/src tests/{unit,integration}
npm init -y
npm install hono wrangler --save-dev
cd frontend && npx -y create-vite@latest ./ --template react-ts
npm install -D tailwindcss @tailwindcss/vite
npx -y shadcn@latest init
```

#### Type E: Astro
```bash
npx -y create-astro@latest --help
npx -y create-astro@latest ./ --template blog --typescript strict
```

### Step 3: Install Common Dependencies

For ALL project types:
```bash
npm install --save-dev vitest
```

### Step 4: Mobile-First Setup

For ALL projects with UI, enforce mobile-first from scaffold:

```css
/* Mobile-first media queries — ALWAYS start from mobile */
/* Default styles = mobile (< 640px) */

/* sm: 640px+ */
@media (min-width: 640px) { }
/* md: 768px+ */
@media (min-width: 768px) { }
/* lg: 1024px+ */
@media (min-width: 1024px) { }
/* xl: 1280px+ */
@media (min-width: 1280px) { }
```

```
📱 MOBILE-FIRST RULES:
1. Default CSS = mobile layout (no media query needed)
2. Add complexity with min-width media queries
3. Touch targets minimum 44x44px
4. Test on 375px width (iPhone SE) as baseline
5. Navigation: bottom nav or hamburger on mobile
6. Tables: horizontal scroll or card layout on mobile
7. Forms: single column, full width inputs on mobile
```

---

## Phase 2: Repository & Environments 🏠

### Step 1: Initialize Git

```bash
git init
git checkout -b main
```

### Step 2: Create Staging + Production Branches

```bash
# main = staging (default)
# production = production only
git checkout -b production
git checkout main
```

### Step 3: Configure Cloudflare Pages

```bash
npx wrangler pages project create PROJECT_NAME --production-branch production
```

### Step 4: Add Deploy Scripts to package.json

```json
{
  "scripts": {
    "deploy:staging": "npx wrangler pages deploy ./public --project-name=PROJECT_NAME --branch=main",
    "deploy:production": "npx wrangler pages deploy ./public --project-name=PROJECT_NAME --branch=production",
    "test": "vitest run",
    "test:gate": "npm run test"
  }
}
```

> Adjust `./public` to match your build output directory based on project type.

### Step 5: Create `.gitignore` (Hardened)

```gitignore
# === Secret Shield: Mandatory Ignores ===
# Environment & secret files
.env
.env.*
!.env.example
!.env.test
.dev.vars
!.dev.vars.example
.secret-lifecycle.json

# Platform-specific secrets
*.pem
*.key
*.p12

# Build & dependencies
node_modules/
dist/
.wrangler/
.next/

# OS & IDE
.DS_Store
*.log
```

---

## Phase 3: Design System Foundation 🎨

> **Design tokens BEFORE components. Semantic naming ALWAYS.**
> **Saved per brand — consistent across ALL projects of the same user/company.**
> **shadcn/ui components as default. Mobile-first always.**

### Step 0: Check for Existing Brand Profile

Before creating a new design system, check if `~/.cm-design-profiles/` exists.
If the user has a previous design profile, **reuse it** for brand consistency.

```json
// ~/.cm-design-profiles/{org-name}.json
// Auto-saved after first project. Reused for all future projects.
{
  "orgName": "my-work-org",
  "brand": {
    "name": "Acme Corp",
    "industry": "technology",
    "style": "professional-modern"
  },
  "colors": {
    "primary": { "50": "#eff6ff", "500": "#3b82f6", "600": "#2563eb", "700": "#1d4ed8" },
    "accent": { "500": "#f59e0b" },
    "success": "#22c55e",
    "warning": "#f59e0b",
    "error": "#ef4444"
  },
  "typography": {
    "fontFamily": "Inter",
    "monoFamily": "JetBrains Mono"
  },
  "ui": {
    "library": "shadcn/ui",
    "borderRadius": "0.5rem",
    "darkMode": true
  },
  "lastUpdated": "2026-03-17",
  "usedInProjects": ["my-awesome-project", "my-frontend-app"]
}
```

**Rules:**
- If profile exists → load and apply. Ask user: "Found design profile for {orgName}. Reuse it?"
- If no profile → ask user about brand/industry → create new profile
- After bootstrap, **always save** the design profile to `~/.cm-design-profiles/`
- Profile is updated with each new project that uses it

### Step 1: Ask Brand Context (if no profile exists)

```
🎨 DESIGN SYSTEM SETUP

No existing design profile found. Tell me about your brand:

1. Company/Brand name:          ___________
2. Industry:                    ___________
3. Style preference:            (professional / playful / minimal / bold)
4. Primary brand color (hex):   ___________ (or "auto" to suggest)
5. Dark mode needed?            (yes / no) [default: yes]
6. UI Library:                  [shadcn/ui] (Enter to keep, or type alternative)
```

### Step 2: Create Design Tokens

**For shadcn/ui projects (default):**

Design tokens are managed through `tailwind.config.ts` and shadcn's CSS variables.
Customize `app/globals.css` (or `src/index.css`) with brand colors:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* === Brand Colors (from profile or user input) === */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;       /* ← Brand primary */
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;          /* ← Brand primary */
    --radius: 0.5rem;

    /* === Additional Semantic Tokens === */
    --success: 142.1 76.2% 36.3%;
    --warning: 37.7 92.1% 50.2%;
    --info: 221.2 83.2% 53.3%;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }
}
```

**For vanilla/static projects:**

Create `design-tokens.css` with CSS custom properties (see example in project scaffold).
Use the same brand colors from the profile.

### Step 3: Install shadcn/ui Components (SPA/Fullstack projects)

Install essential base components:

```bash
# Core layout components
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add toast
npx shadcn@latest add skeleton
```

> Only install what's needed. Add more components as features require them.

### Step 4: Mobile-First Base Styles

```css
/* Always include these mobile-first foundations */

/* Touch-friendly interactive elements */
button, a, [role="button"] {
  min-height: 44px;
  min-width: 44px;
}

/* Responsive container */
.container {
  width: 100%;
  padding-inline: 1rem;
}

@media (min-width: 640px) { .container { padding-inline: 1.5rem; } }
@media (min-width: 1024px) { .container { max-width: 1024px; margin-inline: auto; } }
@media (min-width: 1280px) { .container { max-width: 1280px; } }

/* Safe area for mobile devices */
body {
  padding: env(safe-area-inset-top) env(safe-area-inset-right)
           env(safe-area-inset-bottom) env(safe-area-inset-left);
}
```

### Step 5: Save Design Profile

After setting up the design system, **auto-save** to `~/.cm-design-profiles/{org}.json`:
- Brand colors, fonts, border radius, UI library preference
- Add current project to `usedInProjects` array
- Next project with same org → instant design system reuse

### Design System Rules

```
✅ DO:
- Use shadcn/ui components as building blocks (SPA/Fullstack)
- Use semantic color tokens: bg-primary, text-muted-foreground
- Design mobile layout FIRST, then enhance for larger screens
- Reuse brand profile from ~/.cm-design-profiles/
- Touch targets: minimum 44x44px
- Test at 375px (iPhone SE) as baseline

❌ DON'T:
- Use raw hex colors: color: #333 → use token
- Design desktop-first then "fix" mobile
- Create new color palette when brand profile exists
- Skip dark mode (enabled by default)
- Use fixed widths on mobile: width: 500px
- Ignore safe-area-inset on mobile
```

---

## Phase 4: i18n From Day 1 🌍

> **Keep from v1 — enhanced to be framework-agnostic.**

### Step 1: Create i18n Engine

For **static/vanilla** projects, create `i18n.js`:

```javascript
const i18n = {
  currentLang: 'vi',
  translations: {},

  async init(lang) {
    this.currentLang = lang || localStorage.getItem('lang') || 'vi';
    try {
      const res = await fetch(`/static/i18n/${this.currentLang}.json`);
      this.translations = await res.json();
    } catch {
      const fallback = await fetch('/static/i18n/vi.json');
      this.translations = await fallback.json();
    }
    this.apply();
  },

  t(key) {
    return key.split('.').reduce((obj, k) => obj?.[k], this.translations) || `[${key}]`;
  },

  apply() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = this.t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = this.t(el.dataset.i18nPlaceholder);
    });
    document.documentElement.lang = this.currentLang;
  },

  async switchTo(lang) {
    localStorage.setItem('lang', lang);
    await this.init(lang);
  }
};
```

For **React/Vite** projects, use `react-i18next`:
```bash
npm install i18next react-i18next i18next-browser-languagedetector
```

For **Astro** projects, use `astro-i18n` or manual routing.

### Step 2: Create Language Files

```
i18n/
├── vi.json   ← Source of truth (primary language)
├── en.json
├── th.json
└── ph.json
```

### Step 3: i18n Rules

```
✅ DO:
- Write ALL user-facing strings with t() or data-i18n
- Primary language file is source of truth
- MAX 30 strings per batch when extracting
- Run i18n-sync test after every batch

❌ DON'T:
- Hardcode strings: "Save" → use t('common.save')
- Add 600 strings in one shot → app crashes
- Translate before primary language is complete
- Skip audit gates between batches
```

---

## Phase 5: SEO Foundation 🔍

> **NEW — Learn from Lovable & Cursor: SEO is infrastructure, not afterthought.**

### Step 1: HTML Head Template

Every page must include:

```html
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- SEO: Title and Description -->
  <title data-i18n="meta.title">Project Name — Short description</title>
  <meta name="description" data-i18n-content="meta.description" content="Page description 150-160 characters">

  <!-- SEO: Open Graph -->
  <meta property="og:title" content="Project Name">
  <meta property="og:description" content="Page description">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://yourdomain.com">
  <meta property="og:image" content="https://yourdomain.com/og-image.png">

  <!-- SEO: Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Project Name">
  <meta name="twitter:description" content="Page description">

  <!-- SEO: Canonical URL -->
  <link rel="canonical" href="https://yourdomain.com">

  <!-- Performance: Preconnect to fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">

  <!-- Styles -->
  <link rel="stylesheet" href="/static/css/design-tokens.css">
  <link rel="stylesheet" href="/static/css/style.css">
</head>
<body>
  <!-- Content with semantic HTML -->
  <header role="banner">...</header>
  <nav role="navigation" aria-label="Main">...</nav>
  <main role="main">
    <h1>One H1 per page</h1>
    ...
  </main>
  <footer role="contentinfo">...</footer>

  <script src="/static/js/i18n.js"></script>
  <script src="/static/js/app.js" defer></script>
</body>
</html>
```

### Step 2: SEO Checklist

Every page must pass:

| # | Check | Rule |
|---|-------|------|
| 1 | Title tag | Descriptive, unique per page, < 60 chars |
| 2 | Meta description | Compelling, 150-160 chars |
| 3 | H1 tag | Exactly ONE per page |
| 4 | Heading hierarchy | h1 → h2 → h3 (no skipping) |
| 5 | Semantic HTML | `<header>`, `<nav>`, `<main>`, `<footer>`, `<article>`, `<section>` |
| 6 | Alt attributes | Every `<img>` has descriptive alt text |
| 7 | Canonical URL | Prevents duplicate content |
| 8 | Open Graph | Social sharing preview |
| 9 | Lang attribute | `<html lang="vi">` matches current language |
| 10 | Unique IDs | All interactive elements have unique, descriptive IDs |

---

## Phase 6: AGENTS.md + Git Safety 🤖

> **NEW — Learn from Amp & Claude Code: Project manifest for AI collaboration.**

### Step 1: Create AGENTS.md

Every project MUST have this file at root:

```markdown
# AGENTS.md — Project Manifest

> This file helps AI agents understand and work with this project effectively.

## Project Overview
- **Name**: my-awesome-docs
- **Type**: Static Website (Cloudflare Pages)
- **Primary Language**: English (en)
- **Tech Stack**: HTML, vanilla JS, CSS, Cloudflare Pages

## Commands
- `npm run dev` — Start local dev server
- `npm run test` — Run all tests
- `npm run test:gate` — Run pre-deploy test gate
- `npm run deploy:staging` — Deploy to staging
- `npm run deploy:production` — Deploy to production

## Project Structure
```
public/           — Static files served directly
  static/css/     — Stylesheets (design-tokens.css, style.css)
  static/js/      — JavaScript (app.js, i18n.js)
  static/i18n/    — Language files (vi.json, en.json, ...)
src/              — Backend source (if applicable)
tests/            — Test files
docs/plans/       — Implementation plans
```

## Code Conventions
- **i18n**: ALL user-facing strings must use t() or data-i18n. vi.json is source of truth.
- **CSS**: Use design tokens only. Never raw hex colors or arbitrary spacing.
- **Commits**: Conventional format — `feat:`, `fix:`, `docs:`, `test:`, `chore:`
- **Branches**: `main` = staging, `production` = production only
- **Deploy**: Always staging first. Production requires explicit request.

## Important Rules
1. Run `cm-identity-guard` before any git push
2. Never force push to main or production
3. i18n extraction: MAX 30 strings per batch
4. Run test:gate before every deploy
5. Check `.project-identity.json` for deploy targets
```

### Step 2: Git Safety Protocol

#### Conventional Commits
From the very first commit, enforce:

```
feat: add user login page
fix: correct i18n key for save button
docs: update README with deploy instructions
test: add frontend safety tests
chore: update dependencies
i18n: extract settings page strings (batch 3/5)
```

#### Branch Protection Rules
```
main branch:
  ✅ Direct push allowed (staging)
  ❌ Never force push
  ✅ Run test:gate before deploy

production branch:
  ❌ Never direct push
  ✅ Only via: git checkout production && git merge main && git push
  ✅ Requires staging verification first
  ❌ Never force push
```

#### First Commit
```bash
git add .
git commit -m "chore: bootstrap project with cm-project-bootstrap v2.0"
```

#### PR Template (`.github/pull_request_template.md`)
```markdown
## What Changed
<!-- Brief description -->

## Test Plan
- [ ] Tests pass (`npm run test:gate`)
- [ ] Staging verified
- [ ] i18n keys present in all languages
- [ ] No raw strings in UI

## Deploy
- [ ] Ready for staging
- [ ] Ready for production (requires staging verification)
```

---

## Phase 7: Test Infrastructure 🧪

### Step 1: Create Test Config

```javascript
// vitest.config.js (or vitest.config.ts)
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.{js,ts}'],
  },
});
```

### Step 2: Frontend Safety Tests

Create `tests/unit/frontend-safety.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

describe('Frontend Safety', () => {
  // Test 1: HTML files have proper structure
  it('index.html has required meta tags', () => {
    const html = readFileSync('public/index.html', 'utf-8');
    expect(html).toContain('<meta charset=');
    expect(html).toContain('<meta name="viewport"');
    expect(html).toContain('<title');
    expect(html).toContain('lang=');
  });

  // Test 2: No syntax errors in JS files
  it('JavaScript files parse without errors', () => {
    const jsDir = 'public/static/js';
    if (!existsSync(jsDir)) return;
    const files = readdirSync(jsDir).filter(f => f.endsWith('.js'));
    files.forEach(file => {
      const content = readFileSync(join(jsDir, file), 'utf-8');
      expect(() => new Function(content)).not.toThrow();
    });
  });

  // Test 3: CSS files reference design tokens (not raw values)
  it('stylesheets use design tokens', () => {
    const cssFile = 'public/static/css/style.css';
    if (!existsSync(cssFile)) return;
    const css = readFileSync(cssFile, 'utf-8');
    // Warn if raw hex colors found outside of design-tokens.css
    const rawColors = css.match(/#[0-9a-fA-F]{3,8}(?!.*design-tokens)/g);
    if (rawColors && rawColors.length > 0) {
      console.warn(`⚠️ Found ${rawColors.length} raw color values. Use design tokens instead.`);
    }
  });

  // Test 4: Design tokens file exists
  it('design-tokens.css exists', () => {
    expect(existsSync('public/static/css/design-tokens.css')).toBe(true);
  });

  // Test 5: AGENTS.md exists
  it('AGENTS.md exists at project root', () => {
    expect(existsSync('AGENTS.md')).toBe(true);
  });

  // Test 6: .project-identity.json exists
  it('.project-identity.json exists', () => {
    expect(existsSync('.project-identity.json')).toBe(true);
  });
});
```

### Step 3: i18n Sync Tests

Create `tests/unit/i18n-sync.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

describe('i18n Sync', () => {
  const i18nDir = 'public/static/i18n';

  it('primary language file exists', () => {
    expect(existsSync(join(i18nDir, 'vi.json'))).toBe(true);
  });

  it('all language files have same keys as primary', () => {
    if (!existsSync(i18nDir)) return;
    const primaryKeys = getAllKeys(
      JSON.parse(readFileSync(join(i18nDir, 'vi.json'), 'utf-8'))
    );

    const langFiles = readdirSync(i18nDir)
      .filter(f => f.endsWith('.json') && f !== 'vi.json');

    langFiles.forEach(file => {
      const langKeys = getAllKeys(
        JSON.parse(readFileSync(join(i18nDir, file), 'utf-8'))
      );
      const missing = primaryKeys.filter(k => !langKeys.includes(k));
      expect(missing, `${file} missing keys: ${missing.join(', ')}`).toEqual([]);
    });
  });
});

function getAllKeys(obj, prefix = '') {
  return Object.entries(obj).flatMap(([key, val]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    return typeof val === 'object' && val !== null
      ? getAllKeys(val, fullKey)
      : [fullKey];
  });
}
```

### Step 4: Package Scripts

Ensure `package.json` has:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:gate": "vitest run"
  }
}
```

---

## Phase 8: Deploy Pipeline (8 Gates) 🚀

> **Enhanced from 6 to 8 gates — adding accessibility + performance.**

### The 8 Gates

```
Gate 1: Identity Check     — .project-identity.json matches deploy target
Gate 2: Branch Check       — On correct branch (main=staging, production=prod)
Gate 3: Test Gate          — npm run test:gate passes
Gate 4: Build Gate         — npm run build succeeds (if applicable)
Gate 5: i18n Gate          — All language files in sync
Gate 6: Lint Gate          — No lint errors (if linter configured)
Gate 7: Accessibility Gate — Semantic HTML, alt tags, ARIA labels present
Gate 8: Performance Gate   — No obviously large bundles or unoptimized assets
```

### Gate Implementation

#### Gate 1: Identity Check
```bash
# Read .project-identity.json → confirm Cloudflare account + project name
cat .project-identity.json | jq '.cloudflare'
```

#### Gate 2: Branch Check
```bash
# Verify current branch
BRANCH=$(git branch --show-current)
if [ "$1" = "production" ] && [ "$BRANCH" != "production" ]; then
  echo "❌ Must be on production branch for production deploy"
  exit 1
fi
```

#### Gate 3: Test Gate
```bash
npm run test:gate
```

#### Gate 4: Build Gate
```bash
npm run build 2>&1 || { echo "❌ Build failed"; exit 1; }
```

#### Gate 5: i18n Gate
```bash
# Verified by i18n-sync test in Gate 3
echo "✅ i18n sync verified by test suite"
```

#### Gate 6: Lint Gate
```bash
npm run lint 2>&1 || echo "⚠️ Lint warnings (non-blocking)"
```

#### Gate 7: Accessibility Gate
```bash
# Check HTML for basic accessibility
echo "Checking semantic HTML..."
grep -r '<img' public/ | grep -v 'alt=' && echo "❌ Images missing alt attributes" || echo "✅ All images have alt"
grep -r 'role=' public/index.html > /dev/null && echo "✅ ARIA roles present" || echo "⚠️ Consider adding ARIA roles"
```

#### Gate 8: Performance Gate
```bash
# Check for obviously large files
find public/ -type f -size +500k | head -5
if [ $? -eq 0 ]; then
  echo "⚠️ Large files detected. Consider optimizing."
fi
echo "✅ Performance gate passed"
```

### Deploy Commands

```bash
# Staging (default)
npm run deploy:staging

# Production (explicit only)
npm run deploy:production
```

---

## Phase 9: Development Workflow 🔄

### Daily Development Loop

```
1. Plan     → cm-brainstorm / cm-writing-plans
2. Branch   → cm-using-git-worktrees (optional for complex features)
3. TDD      → cm-test-driven-development
4. Build    → Implement the feature
5. Test     → npm run test:gate
6. Review   → cm-requesting-code-review
7. Commit   → Conventional commit format
8. Deploy   → deploy:staging (8-gate pipeline)
9. Verify   → Check staging URL
10. Merge   → production branch (when ready)
```

### When to Call Which Skill

| Situation | Skill |
|-----------|-------|
| Starting a feature | `cm-brainstorm` |
| Writing implementation plan | `cm-writing-plans` |
| Need isolated workspace | `cm-using-git-worktrees` |
| Writing tests first | `cm-test-driven-development` |
| Running independent tasks | `cm-subagent-driven-development` |
| Executing a plan | `cm-executing-plans` |
| Before deploying | `cm-pre-deploy-testing` → `cm-identity-guard` |
| After implementing | `cm-requesting-code-review` |
| Receiving review | `cm-receiving-code-review` |
| Bug found | `cm-systematic-debugging` |
| Extracting i18n | `cm-safe-i18n-translation` |
| Before git push | `cm-identity-guard` |
| Finishing feature branch | `cm-finishing-a-development-branch` |
| Before claiming done | `cm-verification-before-completion` |
| **Need a skill you don't have** | **→ Adaptive Skills Discovery (below)** |

### Deploy Behavior Rules

```
User says "deploy"           → Deploy to STAGING
User says "deploy staging"   → Deploy to STAGING
User says "deploy production"→ Deploy to PRODUCTION (requires staging verified)
User says "deploy prod"      → Deploy to PRODUCTION (requires staging verified)

After successful production deploy:
→ Suggest updating CHANGELOG.md
→ Suggest updating docs/ if applicable
→ Suggest creating git tag: git tag v1.x.x
```

---

## Adaptive Skills Discovery 🧠

> **The bootstrap doesn't just set up a project — it LEARNS what the project needs.**
> **Like a framework that finds its own missing pieces.**

### Philosophy

```
DON'T just fail when you hit something you've never done.
DO search for a skill that can help.
DON'T install blindly — review what the skill does first.
DO remember what was useful for next time.
```

### How It Works: The Discovery Loop

When the agent encounters a task it doesn't have a skill for:

```
1. DETECT  → "I need to do X but don't have a matching skill"
2. SEARCH  → npx skills find {keyword}    — search skills.sh registry
3. REVIEW  → Read the SKILL.md of the found skill — is it safe & relevant?
4. ASK     → "Found skill '{name}': {description}. Install it?"
5. INSTALL → npx skills add {source} --skill {name} -a antigravity -y
6. USE     → Apply the newly installed skill to the current task
7. LOG     → Record what was installed + why in .cm-skills-log.json
```

### Step 1: Search for Skills

Use `npx skills find` to search the community registry at [skills.sh](https://skills.sh):

```bash
# Interactive search (fuzzy finder)
npx skills find

# Search by keyword
npx skills find "nextjs"
npx skills find "supabase"
npx skills find "testing"
npx skills find "deployment"

# Browse a known skills repository
npx skills add vercel-labs/agent-skills --list
```

### Step 2: Install Safely

```bash
# Install to Antigravity agent (project-level)
npx skills add vercel-labs/agent-skills --skill {skill-name} -a antigravity

# Install globally (available to all projects)
npx skills add vercel-labs/agent-skills --skill {skill-name} -a antigravity -g

# From any GitHub repo
npx skills add https://github.com/{owner}/{repo} --skill {skill-name} -a antigravity
```

### Step 3: Log What Was Installed

Maintain `.cm-skills-log.json` at project root to track what was discovered:

```json
{
  "discoveredSkills": [
    {
      "name": "supabase-rls",
      "source": "vercel-labs/agent-skills",
      "installedAt": "2026-03-17",
      "reason": "User needed Row Level Security setup",
      "scope": "project"
    }
  ]
}
```

### When to Trigger Discovery

| Situation | Search Keywords |
|-----------|----------------|
| User asks for something you've never done | Search by the technology/concept name |
| A framework you're unfamiliar with | `npx skills find "{framework}"` |
| Complex DevOps / CI/CD setup | `npx skills find "deployment"`, `"ci"`, `"docker"` |
| Database patterns | `npx skills find "prisma"`, `"supabase"`, `"drizzle"` |
| Testing frameworks | `npx skills find "playwright"`, `"cypress"`, `"vitest"` |
| UI component libraries | `npx skills find "shadcn"`, `"radix"`, `"design-system"` |
| Auth / payment / external | `npx skills find "auth"`, `"stripe"`, `"clerk"` |

### Safety Rules

```
✅ DO:
- Always show the user what skill you found before installing
- Prefer skills from known repos (vercel-labs/agent-skills, etc.)
- Install project-level by default, global only if user agrees
- Log every installed skill with reason
- Check `npx skills list` to avoid duplicates

❌ DON'T:
- Install skills without user confirmation
- Install from untrusted/unknown sources without review
- Override existing cm-* skills with external ones
- Install more than needed — minimal is better
```

### Self-Improvement Loop

After completing a project, the bootstrap gets smarter:

```
1. Review .cm-skills-log.json — what new skills were needed?
2. If a skill was useful → suggest making it a permanent cm-* skill
3. If the same type of skill is needed across 3+ projects → 
   auto-suggest: "This skill seems essential. Make it part of your default toolkit?"
4. Update ~/.cm-identity-history.json with commonly needed skill patterns
```

---

## Phase 9.5: Working Memory Init 🧠

> **MANDATORY. Every project gets a CONTINUITY.md.**
> **This is what makes AI remember context across sessions.**

### Step 1: Create `.cm/` directory

```bash
mkdir -p .cm
```

### Step 2: Create CONTINUITY.md

Write `.cm/CONTINUITY.md` using the template from `cm-continuity` skill:
- Set `Project:` to the project name from `.project-identity.json`
- Set `Current Phase:` to `bootstrapping`
- Set `Active Goal:` to the user's stated project purpose
- Leave `Mistakes & Learnings` empty (will be populated during development)

### Step 3: Add to .gitignore

`.cm/CONTINUITY.md` is **LOCAL working memory** — do NOT commit:

```gitignore
# Working memory (local only)
.cm/
```

### Step 4: Add to AGENTS.md

Add this line to the AGENTS.md "Important Rules" section:

```markdown
- Read `.cm/CONTINUITY.md` at the start of every session for context
```

### Why This Saves Tokens

Next session, AI reads ~200 tokens from CONTINUITY.md instead of
re-scanning 50+ files (~15,000 tokens). **Savings: ~97% on context loading.**

---

## Anti-Patterns ❌

| # | Anti-Pattern | Consequence | Prevention |
|---|-------------|-------------|------------|
| 1 | Skip identity lock | Deploy to wrong Cloudflare account | Phase 0 is MANDATORY |
| 2 | No staging branch | Bugs hit production directly | Always 2 branches |
| 3 | i18n "later" | Weeks of refactoring | Phase 4 from day 1 |
| 4 | Raw hex colors | Inconsistent UI, broken dark mode | Design tokens only |
| 5 | No AGENTS.md | AI agents make wrong assumptions | Phase 6 creates it |
| 6 | deploy = production | Users see bugs | deploy = staging default |
| 7 | Code before plan | Technical debt from start | cm-writing-plans first |
| 8 | Skip test:gate | "Tests pass" but app broken | 8-gate pipeline |
| 9 | 600 i18n strings at once | App crash | MAX 30 per batch |
| 10 | No design tokens | Every component has different colors | Phase 3 foundation |
| 11 | Force push to main | Lost commits, broken deploys | Never. Period. |
| 12 | No PR template | Unverified code reaches production | Phase 6 creates it |

---

## Output Checklist ✅

After bootstrap, the project MUST have:

```
✅ .project-identity.json     — Identity locked
✅ ~/.cm-identity-history.json — Identity saved for future suggestions
✅ ~/.cm-design-profiles/{org}.json — Brand design system saved
✅ .gitleaks.toml             — Secret scanning config (Phase 0.5)
✅ .git/hooks/pre-commit      — Secret Shield pre-commit hook (Phase 0.5)
✅ .dev.vars.example          — Secret template (Phase 0.5)
✅ AGENTS.md                  — AI collaboration manifest
✅ .github/pull_request_template.md — PR template
✅ .gitignore                 — Hardened ignores (secrets, keys, env files)
✅ package.json               — With deploy:staging, deploy:production, test:gate, security:scan
✅ shadcn/ui initialized      — (SPA/Fullstack) or design-tokens.css (Static)
✅ globals.css / style.css    — Brand tokens + mobile-first base styles
✅ i18n/vi.json               — Primary language file
✅ i18n/[lang].json           — Target language files (empty structure)
✅ index.html                 — With SEO meta tags, semantic HTML
✅ tests/frontend-safety      — Safety checks
✅ tests/i18n-sync            — Key parity tests
✅ vitest.config.js           — Test configuration
✅ main branch                — Staging deploys
✅ production branch          — Production deploys
✅ First commit               — "chore: bootstrap with cm-project-bootstrap v2.0"
✅ .cm/CONTINUITY.md           — Working memory for AI context persistence
```
