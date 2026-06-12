---
title: Browse daemon — install, run, and troubleshoot
description: Run cm browse locally with Playwright, CM_BROWSE_TOKEN, and cm qa-visual in under ten minutes.
keywords: cm browse, playwright, CM_BROWSE_TOKEN, qa-visual, troubleshooting
robots: index, follow
---

# Browse daemon (Playwright)

This page is the **operator runbook** for the local HTTP browse server. Architecture rationale: [ADR 001 — Playwright browse daemon](./adr/001-playwright-browse-daemon.md).

> **Host-native first.** This daemon is a **fallback**. On Claude Code / Antigravity / Cursor / Codex, use the platform's native browser mode (Claude in Chrome, Claude Preview, Chrome DevTools / Playwright MCP) instead — see [browser strategy](../skills/_shared/browser-strategy.md). Reach for this daemon only on a bare CLI host with no browser mode, and never auto-start it — suggest it to the user first.

## Goal

From a clean machine, you can run **`cm browse start`** and then **`cm qa-visual`** (or your own HTTP client) against a **Bearer-protected** API.

## Prerequisites

- Node.js **20+** and a built CLI (`npm run build` in the CodyMaster repo, or a published `codymaster` install).
- **Playwright Chromium** (one-time):

```bash
npx playwright install chromium
```

## 1. Set a production-style token

Generate a random secret (do **not** commit it):

```bash
export CM_BROWSE_TOKEN="$(openssl rand -hex 24)"
```

Optional: copy `.cm/config.example.yaml` to `.cm/config.yaml` and set `browse.port` / `browse.host` (token should stay in env for real use).

## 2. Start the daemon (terminal 1)

From your **project root** (or pass `--project` if your CLI supports it):

```bash
cm browse start --token "$CM_BROWSE_TOKEN"
```

Defaults are aligned with the example config (often port **17395**, host **127.0.0.1**). Override if needed:

```bash
cm browse start --host 127.0.0.1 --port 17395 --token "$CM_BROWSE_TOKEN"
```

Check health (no auth):

```bash
curl -s http://127.0.0.1:17395/health
```

## 3. Run visual QA (terminal 2)

```bash
cm qa-visual --url https://example.com --token "$CM_BROWSE_TOKEN"
```

Point `--url` at your app (local or deployed). The command talks to the running daemon using the same token.

## 4. Typical failure modes

| Symptom | Cause | Fix |
|--------|--------|-----|
| `401` / `unauthorized` | Wrong or missing `Authorization: Bearer` | Use the **exact** same token as `cm browse start`; export `CM_BROWSE_TOKEN` in both terminals. |
| `EADDRINUSE` / port busy | Another process on the port | `cm browse start --port <other>` or stop the old daemon. |
| Playwright launch error | Chromium not installed | `npx playwright install chromium`. |
| Connection refused | Daemon not running or wrong host/port | Confirm `curl /health` and CLI flags. |

## 5. Security notes

- Treat `CM_BROWSE_TOKEN` like an API key: **not** in frontend bundles, not in screenshots committed to git.
- The daemon is intended for **localhost**; do not expose it to untrusted networks without additional controls.

## See also

- [REST and MCP API Surface](./api/rest-and-mcp.md) — HTTP route summary  
- [Servers and MCP Runtime](./architecture/servers-and-mcp.md)  
- Skill: `skills/cm-browse/SKILL.md`  
- [Engineering pipeline](./workflows/engineering-pipeline.md)
