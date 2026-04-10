---
title: Use Cases
description: Practical CodyMaster use cases — from solo vibe coding to team agent ops with memory and gates.
keywords: codymaster use cases, ai workflow, team agents
robots: index, follow
---

# Use Cases

## Solo developer — “I lose context every session”

**Outcome:** cheaper restarts, fewer repeated mistakes.  
**How:**

1. Maintain `.cm/CONTINUITY.md` and learnings (`cm-continuity` skill).
2. Use MCP `cm_query` / `cm_resolve` in your agent host (`src/mcp-context-server.ts`).
3. Run `npm run test:gate` before you context-switch branches.

## Team — “We need visibility, not another chat thread”

**Outcome:** shared board + history without a SaaS lock-in.  
**How:**

1. Run `cm dashboard start` — Mission Control on `http://localhost:6969` (`src/cli/commands/dashboard.ts`).
2. Keep canonical task/deploy state in `kanban.json` (`src/data.ts`).
3. Use `cm-skill-chain` for repeatable multi-step automation.

## Product + engineering — “Big initiative, many options”

**Outcome:** decisions are explicit before code lands.  
**How:**

1. `cm-brainstorm-idea` → qualify problem + compare options.
2. `cm-planning` → implementation plan.
3. `cm-execution` → parallelize independent workstreams.
4. Record decisions to memory for MCP retrieval later.

## Growth / content — “Ship assets without breaking the app”

**Outcome:** marketing velocity with guardrails.  
**How:**

1. `cm-content-factory`, `cm-auto-publisher`, `cm-notebooklm` skills.
2. Still run `npm run test:gate:kit` when changes touch code paths.

## Security-sensitive repo — “Agents + secrets = anxiety”

**Outcome:** fewer credential leaks, safer refactors.  
**How:**

1. `npm run gate:secrets` locally (`package.json`).
2. `cm-secret-shield`, `cm-identity-guard`, `cm-security-gate` skills.
3. Prefer dry deploy: `npm run deploy:dry`.

## See also

- [Vibe coding guide](../getting-started/vibe-coding-guide.md)  
- [Skills library](../skills/index.md)  
- [Showcase](./showcase.md)