---
name: cm-project-bootstrap
description: Use when starting any new project from scratch. Asks for project identity (name, GitHub org, Cloudflare account), detects project type, sets up design system, staging+production, i18n from day 1, SEO foundation, AGENTS.md manifest, test infrastructure, 8-gate deploy pipeline, and disciplined development workflows. Prevents wrong deploys, redundant repos, and technical debt from day 0.
---

# CodyMaster Project Bootstrap v2.0

> **Every project starts here. No exceptions.**

## Core Principles

- ASK FIRST. BUILD SECOND. NEVER ASSUME IDENTITY.
- STAGING IS MANDATORY. PRODUCTION IS EARNED.
- I18N FROM DAY 1. DESIGN SYSTEM BEFORE COMPONENTS.
- SEO IS INFRASTRUCTURE. EVERY PROJECT GETS AN AGENTS.MD.

## 11-Phase Bootstrap Process

| Phase | Name | Purpose |
|-------|------|---------|
| 0 | Identity Lock | WHO are you deploying as? |
| 0.5 | Security Foundation | HOW to prevent secret leaks? (calls `cm-secret-shield`) |
| 1 | Project Type Detection | WHAT kind of project? |
| 2 | Repository & Environments | WHERE does code live? |
| 3 | Design System Foundation | HOW does it look? |
| 4 | i18n From Day 1 | WHICH languages? |
| 5 | SEO Foundation | HOW will people find it? |
| 6 | AGENTS.md + Git Safety | HOW do agents collaborate? |
| 7 | Test Infrastructure | HOW do we catch bugs? |
| 8 | Deploy Pipeline (8 Gates) | HOW does code ship? |
| 9 | Development Workflow | HOW do we work daily? |

---

## Phase 0: Identity Lock 🔐

> **MANDATORY. Cannot proceed without this.**

1. Check `~/.cm-identity-history.json` for previous identities → suggest pre-fill
2. Ask 6 questions (with suggestions from history):
   - Project name (kebab-case), GitHub org, Cloudflare ID, Domain, Primary language, Target languages
3. Verify identity with user confirmation
4. Create `.project-identity.json` with all config
5. Save to `~/.cm-identity-history.json` for future projects
6. Call `cm-identity-guard` to verify git config matches

## Phase 0.5: Security Foundation 🛡️

> Calls `cm-secret-shield` for setup + adds code-level security utilities.

1. Create `.gitleaks.toml` with Supabase + generic high-entropy rules
2. Setup pre-commit hook (`.git/hooks/pre-commit`) — scans staged files
3. Add `security:scan` script to `package.json`
4. Create `.dev.vars.example` template (committed). `.dev.vars` = real secrets (gitignored)
5. **[NEW] Security Utilities (Learned: March 2026):**
   - **Python projects:** Copy `safe_path.py` to `scripts/` — provides `safe_resolve()`, `safe_join()`, `safe_open()` for path traversal prevention
   - **JS/TS frontend:** Add `esc()` function to sanitize HTML — prevent DOM XSS
   - **Express apps:** Add `app.disable('x-powered-by')` + `express.json({ limit: '1mb' })`
   - **Create `.snyk`** policy file for managing false positives
   - **Rule:** ALL paths from CLI/config/API → `safe_resolve()`. ALL innerHTML → `esc()`. No exceptions.

## Phase 1: Project Type Detection 🔍

> Default UI: shadcn/ui + Tailwind. Default layout: Mobile-first.

| Type | Stack |
|------|-------|
| A. Static Website | HTML + vanilla JS + CSS |
| B. SPA (Vite) | Vite + React + TS + shadcn/ui |
| C. Cloudflare Workers | Hono + wrangler + TS |
| D. Fullstack | Hono + Vite + React + shadcn/ui |
| E. Content Site | Astro + MDX |

Scaffold based on type, install `vitest` for all. Enforce mobile-first base styles.

## Phase 2: Repository & Environments 🏠

1. `git init` + `main` (staging) + `production` branches
2. Configure Cloudflare Pages: `npx wrangler pages project create`
3. Add `deploy:staging` and `deploy:production` scripts
4. Create hardened `.gitignore` (secrets, env files, build output)

## Phase 3: Design System Foundation 🎨

> Design tokens BEFORE components. shadcn/ui as default. Mobile-first always.

1. Check `~/.cm-design-profiles/{org}.json` for existing brand profile → reuse
2. If no profile: ask brand context (name, industry, style, primary color, dark mode)
3. Create design tokens (CSS custom properties for shadcn/ui or vanilla)
4. Install base shadcn/ui components: button, input, label, card, dialog, dropdown-menu, toast, skeleton
5. Add mobile-first base styles (44px touch targets, responsive container, safe-area)
6. Save design profile to `~/.cm-design-profiles/`

## Phase 4: i18n From Day 1 🌍

1. Create i18n engine (vanilla `i18n.js` or `react-i18next`)
2. Create language files: primary (source of truth) + targets
3. Rules: ALL strings via `t()` or `data-i18n`. MAX 30 strings per batch. Run i18n-sync test after every batch.

## Phase 5: SEO Foundation 🔍

Every page must have: title (<60 chars), meta description (150-160 chars), exactly ONE h1, heading hierarchy (no skipping), semantic HTML, alt attributes, canonical URL, Open Graph, lang attribute, unique IDs.

## Phase 6: AGENTS.md + Git Safety 🤖

1. Create `AGENTS.md` at root — project overview, commands, structure, conventions, rules
2. Enforce conventional commits: `feat:`, `fix:`, `docs:`, `test:`, `chore:`, `i18n:`
3. Branch protection: main (staging, no force push), production (merge from main only)
4. Create PR template (`.github/pull_request_template.md`)

## Phase 7: Test Infrastructure 🧪

1. Create `vitest.config.js`
2. Create `tests/unit/frontend-safety.test.js` — HTML structure, JS syntax, CSS tokens, AGENTS.md exists
3. Create `tests/unit/i18n-sync.test.js` — key parity across languages
4. Wire up `test:gate` in package.json

## Phase 8: Deploy Pipeline (8 Gates) 🚀

Gates run sequentially: Identity → Branch → Test → Build → i18n → Lint → Accessibility → Performance.
See `cm-safe-deploy` for the full 9-gate pipeline details.

## Phase 9: Development Workflow 🔄

Daily loop: Plan → Branch → TDD → Build → Test → Review → Commit → Deploy staging → Verify → Merge production.

Deploy rules: `deploy` = staging. `deploy production` = requires staging verified first.

## Phase 9.5: Working Memory Init 🧠

1. Create `.cm/CONTINUITY.md` from `cm-continuity` template
2. Add `.cm/` to `.gitignore` (local working memory)
3. Reference in AGENTS.md

## Adaptive Skills Discovery 🧠

When agent encounters unknown task:
1. DETECT gap → 2. `npx skills find "{keyword}"` → 3. REVIEW SKILL.md → 4. ASK user → 5. INSTALL → 6. USE → 7. LOG to `.cm-skills-log.json`

Safety: always show user before installing, prefer known repos, install project-level, log every install.

## Output Checklist ✅

After bootstrap, project MUST have: `.project-identity.json`, `AGENTS.md`, `.gitignore` (hardened), `.gitleaks.toml`, pre-commit hook, `.dev.vars.example`, `package.json` (with deploy/test scripts), design tokens/shadcn, i18n files, SEO meta tags, test files, main + production branches, `.cm/CONTINUITY.md`.

## Template Files (load on-demand with view_file)

| Template | Use When |
|----------|----------|
| `templates/vitest.config.js` | Phase 7: Setting up test infrastructure |
| `templates/frontend-safety.test.js` | Phase 7: Creating frontend safety tests |
| `templates/i18n-sync.test.js` | Phase 7: Creating i18n sync tests |
| `templates/project-identity.json` | Phase 0: Creating .project-identity.json |
| `templates/AGENTS.md` | Phase 6: Creating AGENTS.md |
| `templates/pr-template.md` | Phase 6: Creating PR template |

## Anti-Patterns ❌

| Anti-Pattern | Prevention |
|-------------|------------|
| Skip identity lock | Phase 0 is MANDATORY |
| No staging branch | Always 2 branches |
| i18n "later" | Phase 4 from day 1 |
| Raw hex colors | Design tokens only |
| No AGENTS.md | Phase 6 creates it |
| deploy = production | deploy = staging default |
| 600 i18n strings at once | MAX 30 per batch |
