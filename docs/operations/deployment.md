---
title: Deployment
description: CodyMaster release gates, deploy scripts, CI workflow, and safe deploy skills for production-bound changes.
keywords: codymaster deployment, ci, test gate, safe deploy
robots: index, follow
---

# Deployment

## Built-in npm gates

From `package.json`:


| Script               | Purpose                                                                  |
| -------------------- | ------------------------------------------------------------------------ |
| `npm run deploy:dry` | Run secrets + syntax + full test kit + dist verify; prints ready message |
| `npm run deploy`     | Same chain + smoke test (`scripts/gate-6-smoke-test.js`)                 |


Individual gates include `gate:secrets`, `gate:syntax`, `gate:dist`, `gate:smoke`.

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs:

```bash
npm ci
npm run test:gate:kit
```

## Skills you may combine

- `cm-safe-deploy` — multi-gate deploy mindset and checklists (`skills/cm-safe-deploy/SKILL.md`)
- `cm-quality-gate` — completion claims require evidence (`skills/cm-quality-gate/SKILL.md`)
- `cm-post-deploy-canary` — post-release verification patterns (`skills/cm-post-deploy-canary/SKILL.md`)

## Practical checklist before shipping

1. `npm run test:gate:kit` green locally
2. No secrets in diff (`npm run gate:secrets`)
3. Dist artifact matches entrypoints (`npm run gate:dist`)
4. Update [Changelog](../resources/changelog.md) for user-visible changes

## See also

- [Testing and release gates](../quality/testing-and-release.md)  
- [Security overview](./security-overview.md)  
- [Engineering pipeline](../workflows/engineering-pipeline.md)

