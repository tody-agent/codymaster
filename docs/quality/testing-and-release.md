---

## title: Testing and Release Gates
description: Build, test, and release quality gates for CodyMaster, aligned to package scripts and CI workflow.
keywords: codymaster test gate, vitest, ci workflow, release checklist
robots: index, follow

# Testing and Release Gates

> [!TIP]
> **Quick reference:** `npm run test:gate:kit` is the highest-confidence pre-merge gate and is used by CI.

## Local Quality Gates

```bash
npm run build
npm run validate:skills
npm run check:skills
npm run test:gate
npm run test:gate:kit
```

## Deployment-Related Scripts

- `npm run deploy`
- `npm run deploy:dry`

These chain security checks, syntax checks, test gates, distribution verification, and smoke checks.

## CI Gate

GitHub Actions (`.github/workflows/ci.yml`) runs:

- `npm ci`
- `npm run test:gate:kit`

## Documentation Sync Rule

When commands or storage behavior change, update:

- [CLI Command Reference](../cli/command-reference.md)
- [Storage and Memory Model](../architecture/data-and-memory.md)
- [REST and MCP API Surface](../api/rest-and-mcp.md)

