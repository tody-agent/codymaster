## 2025-04-28 - [Critical] Unauthenticated Local Network Exposure

**Vulnerability:** The local express dashboard server (`src/dashboard.ts`) used `app.listen(port)` without explicitly specifying a host. In Node.js, this defaults to binding the server to `0.0.0.0` or `::`, which exposes the unauthenticated dashboard API to the entire local network.
**Learning:** Local CLI tools or developer dashboards that lack authentication must explicitly bind to the loopback interface (`127.0.0.1` or `localhost`). Relying on default bindings risks exposing sensitive development environments, API keys, or project source code to any device on the same local network (e.g., public Wi-Fi).
**Prevention:** Always explicitly bind local-only servers to `127.0.0.1`. When initializing Express apps, use `app.listen(port, '127.0.0.1', callback)`. Regularly audit all `app.listen` or equivalent network socket creation code for missing explicit localhost binding.

## 2026-05-04 - [Critical] Unauthenticated Local Network Exposure in Python Skills

**Vulnerability:** Similar to the previous issue in the Express server, the Python HTTP servers (`skills/cm-content-factory/scripts/dashboard_server.py`) and MCP servers (`skills/cm-ux-master/mcp/server.py`) defaulted to binding to `0.0.0.0` or had `0.0.0.0` hardcoded in config files (`skills/cm-ux-master/mcp/mcp-config.json`). This exposed the unauthenticated dashboards and internal design tool intelligence to the entire local network.
**Learning:** The risk of `0.0.0.0` bindings extends beyond core services to embedded scripts, dashboard utilities, and peripheral MCP skills. If standard frameworks (like `http.server.HTTPServer` or `uvicorn`) are used without explicit `127.0.0.1` binding, they default to exposing the API/UI globally.
**Prevention:** Always default to `127.0.0.1` in environment variable configurations (`os.getenv("HOST", "127.0.0.1")`), CLI parameter defaults, and hardcoded socket definitions across all languages and frameworks. Regularly audit configurations (e.g., `mcp-config.json`) and source code for `0.0.0.0` literals.

## 2024-06-03 - Hardcoded Fallback Token
**Vulnerability:** The CLI engineering commands (`src/cli/commands/engineering.ts`) used a hardcoded string `"dev-token-change-me"` as a fallback authentication token for local APIs (e.g., the browse daemon) when no configuration or environment variable was provided. Hardcoded tokens can be easily abused if local endpoints are exposed.
**Learning:** Hardcoding security-critical material, even fallback values, is dangerous. In a multi-process environment (like an agent UI connecting to a background daemon), authentication tokens must be both dynamic and persisted securely to allow communication while remaining unpredictable to attackers.
**Prevention:** Generate a cryptographically secure random token (e.g., `crypto.randomBytes(16).toString('hex')`) when initializing the application if no token is configured. Persist this fallback token to a local file (e.g., `.cm/browse_token`) using restrictive permissions (`0o600` via `fs.promises.writeFile`) to allow local cross-process communication securely without exposing a static secret.
