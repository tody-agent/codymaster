---
description: Bootstrap a new project with design system, CI/CD, i18n, SEO, and deploy pipeline
argument-hint: "<project name or description>"
---

# /bootstrap — Full Project Setup

Complete project bootstrap: identity lock → security → scaffold → design system → i18n → SEO → AGENTS.md → tests → deploy pipeline.

## Invocation

```
/bootstrap My new SaaS dashboard
/bootstrap E-commerce landing page with Tailwind
```

## Workflow

### Step 1: Gather Requirements

Ask the user for:
- Project name (kebab-case)
- Project type (Static / SPA / Workers / Fullstack / Astro)
- GitHub org and Cloudflare account
- Domain and languages

### Step 2: Execute Bootstrap

Apply the **cm-project-bootstrap** skill:
1. Identity Lock (Phase 0)
2. Security Foundation with **cm-secret-shield** (Phase 0.5)
3. Project scaffold based on type (Phase 1)
4. Repository + staging/production branches (Phase 2)
5. Design system with tokens (Phase 3)
6. i18n from day 1 (Phase 4)
7. SEO meta tags (Phase 5)
8. AGENTS.md generation (Phase 6)
9. Test infrastructure with **cm-test-gate** (Phase 7)
10. Deploy pipeline (Phase 8)

### Step 3: Verify

Run `npm run test:gate` to confirm setup.

### Step 4: Suggest Next

- "Ready to plan features? → `/plan`"
- "Need UI design? → `/ux`"
- "Ready to deploy? → `/deploy`"
