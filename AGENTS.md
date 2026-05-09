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
| Skill Indexing | `src/indexer/skills.ts` |

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

## Behavioral baseline (Karpathy discipline)

Always-on rules for any agent editing code in this repo. Each maps to a skill that enforces it in detail.

1. **Think before coding** — state assumptions, surface ambiguity, push back on overscoped asks. → `cm-planning`, `cm-brainstorm-idea`
2. **Simplicity first** — minimum code that solves the problem, no speculative abstractions or error paths. → `cm-clean-code`, `cm-tdd`
3. **Surgical changes** — every changed line must trace to the task; match existing style; mention out-of-scope dead code, don't delete. → `cm-execution`, `cm-code-review`
4. **Goal-driven execution** — translate tasks into verifiable success criteria; loop until green; evidence over claims. → `cm-tdd`, `cm-quality-gate`

Source: derived from Andrej Karpathy's notes on LLM coding pitfalls.

## Continuity in consumer projects

When working **inside another project** that uses CodyMaster, read **that** project’s `.cm/CONTINUITY.md`, not this file.
