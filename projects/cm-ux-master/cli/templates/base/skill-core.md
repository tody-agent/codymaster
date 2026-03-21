# {{title}}

{{description}}

{{#if has_ux_laws}}
## Core Capabilities

- **48 UX Laws** - Psychology-driven design principles (Fitts's Law, Hick's Law, Doherty Threshold, etc.)
- **37 Design Tests** - Automated validation with pass/fail criteria
- **Design System Extractor** - Extract tokens from any website
- **Multi-Device Support** - 20 device profiles including mobile, tablet, watch, TV, foldable, VR
{{/if}}

## Prerequisites

Check if Python is installed:

```bash
python3 --version || python --version
```

If Python is not installed:

**macOS:**
```bash
brew install python3
```

**Ubuntu/Debian:**
```bash
sudo apt update && sudo apt install python3
```

**Windows:**
```powershell
winget install Python.Python.3.12
```

---

## How to Use This {{skill_or_workflow}}

When user requests UI/UX work (design, build, create, implement, review, fix, improve), follow this workflow:

### Step 1: Analyze User Requirements

Extract key information:
- **Product type**: SaaS, e-commerce, portfolio, dashboard, landing page, mobile app
- **Style keywords**: minimal, playful, professional, elegant, dark mode
- **Industry**: healthcare, fintech, gaming, education, beauty
- **Stack**: React, Vue, Next.js, or default to `html-tailwind`

### Step 2: Generate Design System (REQUIRED)

**Always start with `--design-system`**:

```bash
python3 {{script_path}} "<product_type> <industry> <keywords>" --design-system [-p "Project Name"]
```

This command:
1. Searches 5 domains in parallel (product, style, color, landing, typography)
2. Applies reasoning rules with UX Laws mapping
3. Returns complete design system: pattern, style, colors, typography, effects
4. Includes applicable UX Laws and Design Tests
5. Lists anti-patterns to avoid

**Example:**
```bash
python3 {{script_path}} "fintech crypto dashboard" --design-system -p "CryptoApp"
```

### Step 2b: Query UX Laws (NEW)

Get psychology-based design principles:

```bash
python3 {{script_path}} "mobile app fitts" --domain ux-laws -n 5
python3 {{script_path}} "e-commerce checkout" --domain ux-laws
```

**48 UX Laws** mapped across 12 product types with:
- Law definition and application
- Pass/fail criteria
- Anti-patterns
- Severity levels

### Step 2c: Query Design Tests (NEW)

Get TDD-style validation criteria:

```bash
python3 {{script_path}} "landing page hero" --domain design-tests -n 5
python3 {{script_path}} "mobile touch target" --domain design-tests
```

**37 Design Tests** with:
- Measurable pass/fail criteria
- Test methods (visual audit, automated, functional)
- Severity levels (Critical, High, Medium, Low)

### Step 3: Persist Design System (Master + Overrides)

```bash
python3 {{script_path}} "<query>" --design-system --persist -p "Project Name"
```

Creates:
- `design-system/MASTER.md` — Global Source of Truth
- `design-system/pages/` — Page-specific overrides

**With page override:**
```bash
python3 {{script_path}} "<query>" --design-system --persist -p "Project" --page "dashboard"
```

### Step 4: Supplement with Detailed Searches

```bash
# More style options
python3 {{script_path}} "glassmorphism dark" --domain style

# Chart recommendations
python3 {{script_path}} "real-time dashboard" --domain chart

# UX best practices
python3 {{script_path}} "animation accessibility" --domain ux

# Animation patterns
python3 {{script_path}} "micro-interaction" --domain animation

# Responsive patterns
python3 {{script_path}} "mobile-first" --domain responsive
```

### Step 5: Stack Guidelines

```bash
python3 {{script_path}} "<keyword>" --stack html-tailwind
```

Available: `html-tailwind`, `react`, `nextjs`, `vue`, `nuxtjs`, `nuxt-ui`, `svelte`, `astro`, `swiftui`, `react-native`, `flutter`, `shadcn`, `jetpack-compose`, `angular`, `htmx`, `electron`, `tauri`

---

## Search Reference

### Available Domains (16)

| Domain | Entries | Use For |
|--------|---------|---------|
| `ux-laws` | 48 | Psychology principles, behavioral design |
| `design-tests` | 37 | Validation criteria, test cases |
| `style` | 67 | UI styles, effects, CSS keywords |
| `color` | 96 | Color palettes by product type |
| `typography` | 57 | Font pairings, Google Fonts |
| `product` | 96 | Product type recommendations |
| `landing` | 30 | Page structure, CTA strategies |
| `chart` | 25 | Chart types, data visualization |
| `ux` | 99 | Best practices, anti-patterns |
| `animation` | 30 | Micro-interactions, transitions |
| `responsive` | 25 | Breakpoints, container queries |
| `accessibility` | 25 | WCAG 2.2 patterns |
| `devices` | 20 | Device-specific guidelines |

### Available Stacks (17)

| Stack | Focus |
|-------|-------|
| `html-tailwind` | Tailwind utilities, responsive, a11y |
| `react` | Hooks, performance, patterns |
| `nextjs` | App Router, SSR, RSC |
| `vue` | Composition API, Pinia |
| `svelte` | Runes, stores, transitions |
| `astro` | Islands architecture |
| `angular` | Signals, standalone, NgRx |
| `swiftui` | iOS/macOS native |
| `react-native` | Cross-platform mobile |
| `flutter` | Dart widgets, Material |
| `shadcn` | shadcn/ui components |
| `electron` | Desktop - IPC, security |
| `tauri` | Desktop - Rust commands |

---

## Execution Workflow (MANDATORY Output Format)

### Step 1: 🧠 UX Reasoning

Explain (2-3 bullets) which UX Laws you applied:

```
- Fitts's Law → Primary "Save" in thumb zone, 48px touch target
- Hick's Law → Advanced settings hidden, only 2 visible CTAs
- Doherty Threshold → Skeleton loader for data table
```

### Step 2: 💻 Production-Ready Code

Provide clean, modular code with inline UX comments:

```html
<!-- UX: Fitts's Law — Touch target ≥ 44px -->
<button class="min-h-[44px] min-w-[44px]">

<!-- UX: Doherty Threshold — Skeleton loader -->
<div class="animate-pulse bg-gray-200 rounded h-4">
```

### Step 3: ✅ Validation Checklist

```
✅ Fitts's Law: Touch targets ≥ 44px
✅ Hick's Law: Max 2 CTAs, progressive disclosure
✅ Miller's Law: Data chunked in groups of 6
✅ Doherty: Skeleton + Empty + Error states
✅ A11y: focus-visible, WCAG AA contrast
```

---

## Output Formats

```bash
# ASCII box (default)
python3 {{script_path}} "fintech" --design-system

# Markdown
python3 {{script_path}} "fintech" --design-system -f markdown

# JSON
python3 {{script_path}} "fintech" --design-system -f json
```

---

## Pre-Delivery Checklist

### Core Directive Compliance
- [ ] Fitts's Law: ALL touch targets ≥ 44×44px
- [ ] Hick's Law: Max 1-2 primary CTAs per view
- [ ] Miller's Law: Info chunked in groups of 5-9
- [ ] Doherty: <400ms feedback, skeleton loaders
- [ ] A11y: WCAG 2.1 AA contrast, focus-visible
- [ ] Inline UX Comments: Code explains constraints

### Visual Quality
- [ ] No emojis as icons (use SVG)
- [ ] Consistent icon library (Heroicons/Lucide)
- [ ] Brand logos correct (Simple Icons)
- [ ] Hover states don't shift layout

### Interaction
- [ ] cursor-pointer on all clickable elements
- [ ] Smooth transitions (150-300ms)
- [ ] Focus states visible
- [ ] prefers-reduced-motion respected

### Responsive
- [ ] Tested at 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll on mobile
- [ ] Touch targets scale appropriately
