---
title: 'ADR 001 — Local Playwright browse daemon (HTTP + bearer)'
description: Why CodyMaster exposes browser automation as a local HTTP service with Playwright.
keywords: adr, browse daemon, playwright, visual qa
robots: index, follow
---

# ADR 001: Local Playwright browse daemon

## Status

Accepted

## Context

Agents and CLI tools need a **real browser** for visual QA, screenshots, console/network capture, and light DOM automation. Alternatives considered:

- **Embed Playwright only inside MCP long-lived process** — couples browser lifecycle to one client; harder to reuse from shell scripts and second terminal.
- **Remote browser farm** — extra cost, latency, and secrets handling for typical local dev.
- **Puppeteer-only** — viable, but Playwright’s cross-browser story and API fit agent “drive the page” workflows well.

## Decision

Run a **local HTTP server** (`src/browse-server.ts`) that:

- Launches **Chromium via Playwright** on demand (`POST /session/start`).
- Protects mutating routes with **Bearer token** auth (`Authorization: Bearer <token>`); `GET /health` stays unauthenticated for probes.
- Exposes focused endpoints (navigate, click, fill, screenshot, refs refresh, console/network buffers) documented in [REST and MCP API Surface](../api/rest-and-mcp.md).

CLI entry: `cm browse start` (options align with `.cm/config.yaml` → `browse:` and env `CM_BROWSE_TOKEN`).

## Consequences

- **Positive:** Any client (CLI, agent, CI helper) can use the same contract; token is easy to rotate per project.
- **Positive:** Visual flows (`cm qa-visual`) share one daemon instead of spawning browsers per call.
- **Negative:** Operators must install browser binaries (`npx playwright install chromium`) and keep token out of client-side code.
- **Operational:** Port conflicts and `401` when token mismatches — see [Browse daemon runbook](../browse-daemon.md).

## Related

- [Browse daemon runbook](../browse-daemon.md)
- Skill: `skills/cm-browse/SKILL.md`
