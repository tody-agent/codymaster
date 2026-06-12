# Browser Strategy — Host-Native First, Daemon as Fallback

> **Shared policy. Any CodyMaster skill that needs a real browser (visual QA,
> screenshots, click/fill, console/network, post-deploy smoke) MUST follow this
> order. Do not proactively start the bundled `cm browse` Playwright daemon.**

Modern coding hosts ship their own browser mode/agent that is more convenient,
better integrated, and already authenticated. Prefer them. The in-repo Playwright
daemon (`cm browse`) exists only for bare CLI hosts that have **no** browser mode.

## Detection order (use the first that applies)

1. **Claude Code** — use the host's browser tools when present:
   `Claude in Chrome` (navigate / click / screenshot / read_page / console / network),
   `Claude Preview`, or a Chrome DevTools / Playwright MCP. These need no daemon.
2. **Google Antigravity / Cursor / Codex** — use the platform's built-in
   **browser mode / browser agent**. Drive the page through it directly.
3. **Any host-provided browser MCP** (generic Playwright/Chromium MCP) — use it.
4. **Bare CLI host with no browser mode** — only then **suggest** the local daemon
   to the user; do **not** auto-launch it:
   > "No host browser detected. To run real-browser QA I can use the local
   > Playwright daemon — run `cm browse start --port 17395` and re-try, or skip."
   Proceed only after the user opts in.

## Rules

- **Never** make "start `cm browse` + `cm qa-visual`" a default step before
  claiming a UI works. If a host browser exists, use it.
- **Never** auto-start the daemon silently. On fallback, surface the one-liner and
  let the user decide (it installs Chromium + holds a token — a real cost).
- HTTP-only checks (status code, `curl`) do **not** need any browser — keep using
  them for liveness/smoke before reaching for a browser at all.
- When you do use a host browser, report which one you used so the run is auditable.

## Capability map (what each path covers)

| Need | Host-native (preferred) | Daemon fallback |
|------|-------------------------|-----------------|
| Screenshot | `Claude in Chrome` screenshot / Preview / DevTools MCP | `cm qa-visual` |
| Navigate / click / fill | host browser tools | `cm browse` HTTP API |
| Console / network errors | host browser console/network read | `cm browse` `/console` `/network` |
| Post-deploy smoke | HTTP GET first, then host browser if needed | `cm canary --browse-port …` |

See also: [docs/browse-daemon.md](../../docs/browse-daemon.md) (fallback runbook),
[ADR 001](../../docs/adr/001-playwright-browse-daemon.md) (rationale + host-first amendment).
