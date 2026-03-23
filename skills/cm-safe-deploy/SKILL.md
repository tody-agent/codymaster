---
name: cm-safe-deploy
description: Use when setting up deployment infrastructure for any project - establishes multi-gate deploy pipeline with test gates, build verification, frontend safety checks, version bump, changelog generation, and rollback strategy before code reaches production
---

# Safe Deploy Pipeline v2

> **Role: Release Engineer** — You manage the 9-gate pipeline from secret hygiene to changelog. No shortcuts.

## The Iron Law

**NO DEPLOY WITHOUT PASSING ALL GATES. GATES ARE SEQUENTIAL. EACH MUST PASS BEFORE THE NEXT.**

## When to Use

- Setting up a new project's deployment infrastructure
- Project has no test gate before deploy
- After a production incident caused by untested code
- Adding CI/CD to an existing project

## The 9-Gate Pipeline

```
Gate 0: Secret Hygiene → Gate 1: Syntax → Gate 2: Test Suite → Gate 3: i18n Parity →
Gate 4: Build → Gate 5: Dist Verify → Gate 6: Deploy + Smoke → Gate 7: Version Bump → Gate 8: Changelog
```

Each gate MUST pass. On failure → STOP, fix, retry from failed gate.

---

### Gate 0: Secret Hygiene (<0.5s)

Check wrangler config for secret values (SERVICE_KEY, ANON_KEY, DB_PASSWORD). Verify `.gitignore` has `.env` + `.dev.vars`. Verify no secret files tracked by git. Calls `cm-secret-shield` Layer 4.

**Rule:** `SERVICE_KEY`/`ANON_KEY` → Cloudflare Secrets (`wrangler secret put`), NEVER in `wrangler.jsonc`. Local dev secrets → `.dev.vars` (gitignored).

### Gate 1: Syntax Validation (<1s)

| Stack | Command |
|-------|---------|
| Vanilla JS | `node -c path/to/app.js` |
| TypeScript | `npx tsc --noEmit` |
| Python | `python -m py_compile app.py` |

Gives exact line number of error instantly, before the slower test suite.

### Gate 2: Test Suite

Must include: frontend safety, backend API, business logic, i18n sync, integration tests. Run via `npm run test:gate` (`vitest run --reporter=verbose`). 0 failures → proceed.

### Gate 3: i18n Parity Check

All language files must have identical key counts and no null/empty values. Skip if project has no i18n.

### Gate 4: Build Verification

`npm run build` must succeed. Catches: import failures, tree-shaking errors, missing env vars, bundle size issues.

### Gate 5: Dist Asset Verification

Verify critical files exist in `dist/`: worker entry, frontend JS/CSS, translation files, critical assets.

### Gate 6: Deploy + Smoke Test

Deploy command by platform: Cloudflare (`wrangler pages deploy`), Vercel (`vercel --prod`), Netlify (`netlify deploy --prod`). Post-deploy: `curl` deployed URL, must return HTTP 200.

### Gate 7: Version Bump (POST-DEPLOY)

Detect bump type from commits: `fix:`/`bug:` → patch, `feat:`/`improve:` → minor. Update `package.json` version, commit.

### Gate 8: Changelog Generation (POST-DEPLOY)

Collect commits since last tag, categorize into **🚀 Improvements** and **🐛 Bug Fixes**. Write to `CHANGELOG.md`, git tag release.
**CRITICAL:** The `CHANGELOG.md` file dynamically powers the public `/docs/changelog` page. You MUST ensure this gate passes and updates the changelog accurately so the documentation site reflects the latest version history.

---

## Composing the Deploy Script

```json
{
  "scripts": {
    "deploy": "node -c src/app.js && npm run test:gate && npm run build && YOUR_DEPLOY_COMMAND && npm run release:version && npm run release:changelog"
  }
}
```

Chain with `&&` — any gate failure stops the chain.

## Rollback Protocol

| Severity | Action |
|----------|--------|
| White screen | `git revert HEAD && npm run deploy` |
| Broken translations | `git checkout HEAD~1 -- i18n/*.json && npm run deploy` |
| API error | `git revert HEAD && npm run deploy` |
| Cloudflare | `wrangler pages deployment rollback <id>` |

## Post-Release Memory (cm-continuity)

**On SUCCESS:** Update CONTINUITY.md: "Released v[version] — all 9 gates passed"
**On FAILURE:** Write to `learnings.json`: gate, error, root cause, prevention. Update CONTINUITY.md blockers.

## Template Files (load on-demand with view_file)

| Template | Use When |
|----------|----------|
| `templates/deploy.sh` | Setting up the full 9-gate deploy script |

## Integration

| Skill | When |
|-------|------|
| `cm-quality-gate` | Gate 2 frontend tests |
| `cm-secret-shield` | Gate 0 deep scanning |
| `cm-safe-i18n` | i18n-specific gates |
| `cm-identity-guard` | Gate 0 verifies deploy identity |
| `cm-continuity` | Post-release memory |
| `cm-dockit` | Gate 8 changelog → docs |
