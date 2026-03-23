# AGENTS.md — {{PROJECT_NAME}}

> AI agents: Read this file FIRST before any task.

## Project Identity
- **Name**: {{PROJECT_NAME}}
- **Type**: {{PROJECT_TYPE}} (Cloudflare Pages)
- **Primary Language**: {{PRIMARY_LANG}}
- **Tech Stack**: {{TECH_STACK}}

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
6. Read `.cm/CONTINUITY.md` at the start of every session for context
