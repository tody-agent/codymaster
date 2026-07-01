## 2025-04-28 - [Critical] Unauthenticated Local Network Exposure

**Vulnerability:** The local express dashboard server (`src/dashboard.ts`) used `app.listen(port)` without explicitly specifying a host. In Node.js, this defaults to binding the server to `0.0.0.0` or `::`, which exposes the unauthenticated dashboard API to the entire local network.
**Learning:** Local CLI tools or developer dashboards that lack authentication must explicitly bind to the loopback interface (`127.0.0.1` or `localhost`). Relying on default bindings risks exposing sensitive development environments, API keys, or project source code to any device on the same local network (e.g., public Wi-Fi).
**Prevention:** Always explicitly bind local-only servers to `127.0.0.1`. When initializing Express apps, use `app.listen(port, '127.0.0.1', callback)`. Regularly audit all `app.listen` or equivalent network socket creation code for missing explicit localhost binding.

## 2026-05-04 - [Critical] Unauthenticated Local Network Exposure in Python Skills

**Vulnerability:** Similar to the previous issue in the Express server, the Python HTTP servers (`skills/cm-content-factory/scripts/dashboard_server.py`) and MCP servers (`skills/cm-ux-master/mcp/server.py`) defaulted to binding to `0.0.0.0` or had `0.0.0.0` hardcoded in config files (`skills/cm-ux-master/mcp/mcp-config.json`). This exposed the unauthenticated dashboards and internal design tool intelligence to the entire local network.
**Learning:** The risk of `0.0.0.0` bindings extends beyond core services to embedded scripts, dashboard utilities, and peripheral MCP skills. If standard frameworks (like `http.server.HTTPServer` or `uvicorn`) are used without explicit `127.0.0.1` binding, they default to exposing the API/UI globally.
**Prevention:** Always default to `127.0.0.1` in environment variable configurations (`os.getenv("HOST", "127.0.0.1")`), CLI parameter defaults, and hardcoded socket definitions across all languages and frameworks. Regularly audit configurations (e.g., `mcp-config.json`) and source code for `0.0.0.0` literals.

## 2026-07-01 - [Critical] Unauthenticated Local Network Exposure in Python Dashboard Servers
**Vulnerability:** The Python dashboard servers ( and ) were initialized with , explicitly binding to all available network interfaces. This exposed the dashboard and its capabilities to any device on the same local network.
**Learning:** This reinforces the previous learnings (from 2025-04-28 and 2026-05-04) that  bindings are a recurrent pattern in this codebase across different languages and frameworks. Even simple standard library servers () used for internal tooling or dashboards are susceptible. The recurrence suggests a need for automated scanning for  literals.
**Prevention:** Changed the bind addresses in the affected Python scripts to  (localhost). To prevent future occurrences, consider adding a pre-commit hook or automated test that explicitly greps the  and  directories for  inside server initialization calls.

## 2025-05-18 - [Critical] Unauthenticated Local Network Exposure in Python Dashboard Servers
**Vulnerability:** The Python dashboard servers (`projects/cm-ux-master/scripts/dashboard_server.py` and `projects/cm-content-factory/scripts/dashboard_server.py`) were initialized with `HTTPServer(("0.0.0.0", args.port), DashboardHandler)`, explicitly binding to all available network interfaces. This exposed the dashboard and its capabilities to any device on the same local network.
**Learning:** This reinforces the previous learnings (from 2025-04-28 and 2026-05-04) that `0.0.0.0` bindings are a recurrent pattern in this codebase across different languages and frameworks. Even simple standard library servers (`http.server`) used for internal tooling or dashboards are susceptible. The recurrence suggests a need for automated scanning for `0.0.0.0` literals.
**Prevention:** Changed the bind addresses in the affected Python scripts to `127.0.0.1` (localhost). To prevent future occurrences, consider adding a pre-commit hook or automated test that explicitly greps the `projects/` and `skills/` directories for `"0.0.0.0"` inside server initialization calls.
