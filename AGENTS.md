# AGENTS.md — CodyMaster repository

Short orientation for AI coding agents and human maintainers working in **this** repo.

## Authority in code

| Need | Source |
|------|--------|
| CLI commands | `src/cli/command-registry.ts` |
| Engineering subcommands (browse, sprint, guardian, …) | `src/cli/commands/engineering.ts` |
| Shared project config | `.cm/config.example.yaml` → copy to `.cm/config.yaml`; loader `src/cm-config.ts` |
| MCP tools | `src/mcp-context-server.ts` |
| Browse HTTP API | `src/browse-server.ts` |
| Sprint state | `src/sprint-pipeline.ts`, `.cm/sprint/` |

## Before you claim “done”

```bash
npm run test:gate:kit
```

Same sequence runs in CI (`.github/workflows/ci.yml`).

## Documentation entry points

- [Browse daemon runbook](docs/browse-daemon.md) — Playwright, token, troubleshooting  
- [Guardian hooks](docs/workflows/guardian-hooks.md) — safe command gating  
- [Engineering pipeline](docs/workflows/engineering-pipeline.md)  
- [ADRs](docs/adr/001-playwright-browse-daemon.md) (001–003)  

## Continuity in consumer projects

When working **inside another project** that uses CodyMaster, read **that** project’s `.cm/CONTINUITY.md`, not this file.
