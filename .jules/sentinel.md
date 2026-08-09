## 2025-04-28 - [Critical] Unauthenticated Local Network Exposure

**Vulnerability:** The local express dashboard server (`src/dashboard.ts`) used `app.listen(port)` without explicitly specifying a host. In Node.js, this defaults to binding the server to `0.0.0.0` or `::`, which exposes the unauthenticated dashboard API to the entire local network.
**Learning:** Local CLI tools or developer dashboards that lack authentication must explicitly bind to the loopback interface (`127.0.0.1` or `localhost`). Relying on default bindings risks exposing sensitive development environments, API keys, or project source code to any device on the same local network (e.g., public Wi-Fi).
**Prevention:** Always explicitly bind local-only servers to `127.0.0.1`. When initializing Express apps, use `app.listen(port, '127.0.0.1', callback)`. Regularly audit all `app.listen` or equivalent network socket creation code for missing explicit localhost binding.

## 2026-05-04 - [Critical] Unauthenticated Local Network Exposure in Python Skills

**Vulnerability:** Similar to the previous issue in the Express server, the Python HTTP servers (`skills/cm-content-factory/scripts/dashboard_server.py`) and MCP servers (`skills/cm-ux-master/mcp/server.py`) defaulted to binding to `0.0.0.0` or had `0.0.0.0` hardcoded in config files (`skills/cm-ux-master/mcp/mcp-config.json`). This exposed the unauthenticated dashboards and internal design tool intelligence to the entire local network.
**Learning:** The risk of `0.0.0.0` bindings extends beyond core services to embedded scripts, dashboard utilities, and peripheral MCP skills. If standard frameworks (like `http.server.HTTPServer` or `uvicorn`) are used without explicit `127.0.0.1` binding, they default to exposing the API/UI globally.
**Prevention:** Always default to `127.0.0.1` in environment variable configurations (`os.getenv("HOST", "127.0.0.1")`), CLI parameter defaults, and hardcoded socket definitions across all languages and frameworks. Regularly audit configurations (e.g., `mcp-config.json`) and source code for `0.0.0.0` literals.

## 2026-05-05 - [Critical] Unauthenticated Local Network Exposure in Python Projects
**Vulnerability:** Python HTTP servers and MCP servers in the `projects/` directory were found to be binding to `0.0.0.0` (or having it as a default), exposing them to the local network.
**Learning:** Similar to the previous issue in the `skills/` directory, the risk of `0.0.0.0` bindings also extended to the `projects/` directory.
**Prevention:** Always default to `127.0.0.1` in environment variable configurations, CLI parameter defaults, and hardcoded socket definitions across all languages and frameworks, regardless of whether they are in the `skills/` or `projects/` directory.
## 2025-03-09 - [Command Injection via execSync in TDD Gate]
**Vulnerability:** `src/execution/tdd-gate.ts` uses `execSync` with unsanitized string interpolation: ``execSync(`npx vitest run ${testFile} --reporter=verbose`, ...)``. An attacker could supply a malicious file path leading to arbitrary command execution. Additionally, using `npx` via `execSync` is known to spawn a vulnerable shell (`cmd.exe`) on Windows.
**Learning:** String interpolation in shell commands is dangerous, especially when processing external file paths. Also, executing `.cmd` or `.bat` on Windows via Node.js functions without `shell: false` and array arguments is a common pitfall.
**Prevention:** Avoid `execSync` with strings. Use `child_process.execFileSync` or `spawnSync` with an arguments array. For CLI tools like `vitest`, resolve the JS entry point and use `process.execPath` instead of relying on the shell to find `npx`.
