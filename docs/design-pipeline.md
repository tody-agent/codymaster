# Design Pipeline

> CodyMaster's design system — from brand extraction to pixel-perfect UI, enforced across every page.

## Why Design Matters

Most AI coding agents produce inconsistent UI: different colors on each page, random font sizes, no spacing system. CodyMaster treats design as a **first-class discipline** — not an afterthought.

```
Random AI Output:              CodyMaster Output:
┌──────────┐  ┌──────────┐    ┌──────────┐  ┌──────────┐
│ Blue btn │  │ Red btn  │    │ Consistent│  │ Consistent│
│ 14px txt │  │ 16px txt │    │ tokens    │  │ tokens    │
│ 8px gap  │  │ 16px gap │    │ everywhere│  │ everywhere│
└──────────┘  └──────────┘    └──────────┘  └──────────┘
     😵 No system                  🧠 One design system
```

---

## The Design Pipeline

```
User Request
    │
    ▼
┌─────────────────┐     "I want a landing page like Stripe"
│ cm-brainstorm   │──── Understand intent, audience, brand
│ -idea           │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     Extract from URL, pick from 129 systems,
│ cm-open-design  │──── or choose from 5 visual directions
│ (MCP)           │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     Convert to STITCH_TOKENS format:
│ cm-design-      │──── colors, typography, spacing, radius
│ system          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     Validate against 48 UX laws,
│ cm-ux-master    │──── accessibility (WCAG AA), usability
└────────┬────────┘
         │
         ▼
┌─────────────────┐     Generate HTML/CSS or component code
│ cm-execution    │──── with design tokens applied
└────────┬────────┘
         │
         ▼
┌─────────────────┐     Visual QA via Playwright browser,
│ cm-quality-gate │──── screenshot comparison, perf check
└─────────────────┘
```

---

## Three Ways to Get a Design System

### Option 1: From a URL (Extract Existing Brand)

```
You:    Extract design from https://stripe.com
AI:     [cm-open-design] Analyzing stripe.com...
        Found: purple gradient (#533afd), clean sans-serif,
        generous whitespace, rounded corners.
        [cm-design-system] Tokens extracted. Ready to use.
```

**How it works:**
1. `cm-open-design` fetches the URL and analyzes colors, fonts, spacing
2. Converts to a DESIGN.md with 9 sections (theme, palette, typography, components, layout, depth, rules, responsive, agent guide)
3. `cm-design-system` maps to STITCH_TOKENS format
4. Tokens are enforced across all generated pages

### Option 2: From 129 Professional Design Systems

Open Design includes design systems from top companies:

| Category | Systems |
|----------|---------|
| **AI & LLM** | Anthropic (Claude), OpenAI, Cohere, Mistral, ElevenLabs, xAI |
| **Developer Tools** | Linear, Cursor, Supabase, Figma, Sentry, PostHog, Raycast |
| **Productivity** | Notion, Lovable, Webflow, Cal.com, Slack, Discord |
| **E-Commerce** | Shopify, Stripe, Nike, Airbnb, Starbucks |
| **Backend** | MongoDB, ClickHouse, Sanity, Resend, HashiCorp |
| **Automotive** | Tesla, BMW, Ferrari, Lamborghini, Bugatti |
| **Media** | Spotify, Pinterest, The Verge, WIRED |
| **Fintech** | Coinbase, Kraken, Revolut, Wise, Mastercard |
| **+ 57 more** | From awesome-design-skills collection |

**Usage:**
```
You:    Use Linear's design system for our dashboard
AI:     [cm-open-design] Fetching Linear design system...
        Ultra-minimal, precise, purple accent (#5e6ad2).
        [cm-design-system] Applied. All components will use
        Linear's tokens.
```

### Option 3: From 5 Visual Directions (No Brand Needed)

When the user has no existing brand, offer these curated directions:

| # | Direction | Primary | Accent | Font | Best For |
|---|-----------|---------|--------|------|----------|
| 1 | **Editorial Monocle** | `#1a1a1a` | `#c9a96e` | Playfair Display + Inter | Luxury, editorial, portfolios |
| 2 | **Modern Minimal** | `#09090b` | `#3b82f6` | Inter + JetBrains Mono | SaaS, tech products |
| 3 | **Warm Soft** | `#44403c` | `#f97316` | DM Sans + Inter | Lifestyle, wellness, food |
| 4 | **Tech Utility** | `#0a0a0a` | `#22c55e` | Space Grotesk + IBM Plex Mono | Dev tools, terminal UIs |
| 5 | **Brutalist Experimental** | `#171717` | `#ef4444` | Space Mono + Inter | Creative, experimental, art |

**Usage:**
```
You:    I don't have a brand yet. Just make it look good.
AI:     Here are 5 directions. Which speaks to you?
        1. Editorial Monocle — warm gold, serif elegance
        2. Modern Minimal — clean blue, tech-forward
        3. Warm Soft — earth tones, friendly
        4. Tech Utility — dark + neon, developer aesthetic
        5. Brutalist — high contrast, bold
You:    #4, Tech Utility.
AI:     [cm-open-design] Applying Tech Utility tokens.
        Dark canvas (#0a0a0a), neon green (#22c55e),
        Space Grotesk headings. Building your pages.
```

---

## 31 Skill Types (Prototypes & Templates)

Open Design provides pre-built templates for common scenarios:

### Design & Marketing

| Skill | What It Produces |
|-------|-----------------|
| `web-prototype` | Single-page HTML landing, marketing page |
| `saas-landing` | Hero / features / pricing / CTA layout |
| `dashboard` | Admin panel with sidebar, charts, tables |
| `pricing-page` | Standalone pricing with comparison tables |
| `mobile-app` | iPhone 15 Pro / Pixel framed screens |
| `social-carousel` | 3-card 1080×1080 social media posts |
| `magazine-poster` | Single-page magazine-style poster |
| `motion-frames` | Motion-design hero with CSS animations |
| `email-marketing` | Brand product-launch HTML email |

### Deck Presentations

| Skill | What It Produces |
|-------|-----------------|
| `guizang-ppt` | Magazine-style web presentation |
| `simple-deck` | Minimal horizontal-swipe deck |
| `replit-deck` | Product-walkthrough deck |
| `weekly-update` | Team weekly cadence deck |

### Office & Operations

| Skill | What It Produces |
|-------|-----------------|
| `pm-spec` | PM specification document |
| `team-okrs` | OKR scoresheet |
| `kanban-board` | Board snapshot |
| `eng-runbook` | Incident runbook |
| `finance-report` | Executive finance summary |
| `invoice` | Single-page invoice |

---

## The DESIGN.md Format

Every design system in Open Design produces a DESIGN.md with 9 sections:

```markdown
# Design System: [Name]

## 1. Visual Theme & Atmosphere
   — Overall mood, key characteristics, what makes it distinctive

## 2. Color Palette & Roles
   — Primary, accent, semantic (error/success), surface scale, border colors

## 3. Typography Rules
   — Font families, hierarchy (display → body → caption → mono), principles

## 4. Component Stylings
   — Buttons, cards, inputs, navigation, images, distinctive components

## 5. Layout Principles
   — Spacing system (8px base), grid, whitespace philosophy, radius scale

## 6. Depth & Elevation
   — Shadow levels (flat → border → ambient → elevated), shadow philosophy

## 7. Do's and Don'ts
   — What to always do, what to never do

## 8. Responsive Behavior
   — Breakpoints, touch targets, collapsing strategy

## 9. Agent Prompt Guide
   — Quick color reference, example component prompts, iteration rules
```

---

## Token Mapping: Open Design → CodyMaster

The design pipeline converts Open Design tokens to a standard format:

```css
/* Extracted from Cursor DESIGN.md via cm-open-design */
:root {
  /* Colors */
  --bg-primary: #f2f1ed;        /* Page background */
  --bg-secondary: #ebeae5;      /* Section backgrounds */
  --text-primary: #26251e;      /* Headings, body text */
  --text-secondary: rgba(38, 37, 30, 0.65);
  --accent: #f54e00;            /* CTAs, links, highlights */
  --border: rgba(38, 37, 30, 0.1);

  /* Typography */
  --font-display: 'Inter', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Spacing (8px base) */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;

  /* Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-pill: 9999px;

  /* Shadows */
  --shadow-card: rgba(0,0,0,0.14) 0px 28px 70px;
  --shadow-ambient: rgba(0,0,0,0.02) 0px 0px 16px;
}
```

---

## Integration with Other Skills

| Skill | Role in Design Pipeline |
|-------|------------------------|
| `cm-open-design` | Source: 129 design systems, extraction, MCP bridge |
| `cm-design-system` | Core: token management, STITCH_TOKENS format, enforcement |
| `cm-ux-master` | Validation: 48 UX laws, 37 design tests, WCAG AA |
| `cm-ui-preview` | Rendering: HTML/CSS generation, device frames |
| `cm-execution` | Output: builds actual pages with tokens applied |
| `cm-quality-gate` | QA: visual regression, performance, accessibility |
| `cm-planning` | Discovery: includes design in feature planning phase |
| `cm-brainstorm-idea` | Direction: helps pick visual direction |

---

## Quick Recipes

### Recipe 1: "Build me a SaaS landing page"

```
cm-brainstorm-idea → cm-open-design (pick Modern Minimal) →
cm-design-system → cm-execution → cm-quality-gate
```

### Recipe 2: "Make it look like Linear"

```
cm-open-design (get Linear DESIGN.md) → cm-design-system →
cm-ux-master (validate) → cm-execution → cm-quality-gate
```

### Recipe 3: "Extract my brand from mywebsite.com"

```
cm-open-design (extract from URL) → cm-design-system →
cm-ux-master → cm-execution → cm-quality-gate
```

### Recipe 4: "I have no brand, surprise me"

```
cm-open-design (offer 5 directions) → user picks →
cm-design-system → cm-execution → cm-quality-gate
```

### Recipe 5: "Audit my current design"

```
cm-ux-master (48 laws) → cm-ux-master (37 tests) →
cm-ux-master (WCAG AA) → generate report
```

---

## Setup

### Open Design MCP Server

```bash
# Clone and build
cd /Volumes/Data/Builder/Stuff
git clone https://github.com/nexu-io/open-design.git
cd open-design
corepack enable
pnpm install
pnpm --filter @open-design/daemon build

# Register with your AI tool
claude mcp add-json --scope user open-design '{
  "command": "node",
  "args": ["/path/to/open-design/apps/daemon/dist/cli.js", "mcp"],
  "env": {
    "OD_DATA_DIR": "/path/to/open-design/.od"
  }
}'

# Start daemon
pnpm tools-dev start web
# → Web UI: http://localhost:7456
```

### Verify

```bash
# Check daemon is running
curl http://localhost:56382/api/design-systems

# Should return JSON with 129 design systems
```

📖 [Full MCP setup guide →](../.opencode/skills/cm-open-design/resources/mcp-setup-guide.md)

---

## Fallback: Built-in Design Systems

If Open Design is unavailable, CodyMaster falls back to built-in systems:

| System | Style | Best For |
|--------|-------|----------|
| **Shadcn** | Minimal, monochrome | Utility apps, dashboards |
| **Halo** | Warm, friendly | Consumer products |
| **Lunaris** | Dark, premium | Developer tools |
| **Nitro** | Bold, energetic | Marketing, landing pages |

These are always available — no MCP server required.

---

## Device Frames

Open Design provides pixel-accurate device frames for prototypes:

- **iPhone 15 Pro** — with Dynamic Island
- **Pixel** — Android flagship
- **iPad Pro** — tablet layouts
- **MacBook** — desktop previews
- **Browser Chrome** — web app mockups

Use these with `cm-ui-preview` to show designs in realistic context.

---

## Further Reading

- [cm-open-design SKILL.md](../.opencode/skills/cm-open-design/SKILL.md) — Full skill reference
- [Design Systems Catalog](../.opencode/skills/cm-open-design/resources/design-systems-catalog.md) — All 129 systems
- [MCP Setup Guide](../.opencode/skills/cm-open-design/resources/mcp-setup-guide.md) — Installation
- [UX Master Reference](../.opencode/skills/cm-ux-master/SKILL.md) — 48 UX laws
- [Open Design GitHub](https://github.com/nexu-io/open-design) — Source code
