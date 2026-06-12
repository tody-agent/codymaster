---
title: Security Overview
description: Security-related commands, gates, and skills in CodyMaster — secrets, SAST, and safe automation patterns.
keywords: codymaster security, secret scanning, quality gate, safe deploy
robots: index, follow
---

# Security Overview

## Repository gates

Scripts wired in `package.json`:

- `**gate:secrets**` — `scripts/gate-0-secrets.js` blocks leaked credentials before merge.
- `**gate:check` / `gate:fix**` — `scripts/security-fixer.js` for automated hygiene where applicable.

Run locally before pushing:

```bash
npm run gate:secrets
npm run gate:check
```

## Skills


| Skill               | Focus                                                          |
| ------------------- | -------------------------------------------------------------- |
| `cm-safe-deploy`    | Secrets, release safety, rollback, and deployment checkpoints  |
| `cm-identity-guard` | Wrong-account prevention for git/deploy                        |
| `cm-safe-i18n`      | Mass string changes without breaking HTML/security assumptions |


Paths: `skills/cm-safe-deploy/SKILL.md`, `skills/cm-identity-guard/SKILL.md`, `skills/cm-safe-i18n/SKILL.md`.

## Engineering safety

- **Guardian** commands (engineering group) help block destructive operations — see `src/guardian-core.ts` and [Engineering pipeline](../workflows/engineering-pipeline.md).

## See also

- [Vulnerability management](./vulnerability-management.md)  
- [Deployment](./deployment.md)  
- [Changelog](../resources/changelog.md) — security sections per release
