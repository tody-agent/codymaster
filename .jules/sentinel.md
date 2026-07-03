## 2025-04-28 - [Critical] Unauthenticated Local Network Exposure

**Vulnerability:** The local express dashboard server (`src/dashboard.ts`) used `app.listen(port)` without explicitly specifying a host. In Node.js, this defaults to binding the server to `0.0.0.0` or `::`, which exposes the unauthenticated dashboard API to the entire local network.
**Learning:** Local CLI tools or developer dashboards that lack authentication must explicitly bind to the loopback interface (`127.0.0.1` or `localhost`). Relying on default bindings risks exposing sensitive development environments, API keys, or project source code to any device on the same local network (e.g., public Wi-Fi).
**Prevention:** Always explicitly bind local-only servers to `127.0.0.1`. When initializing Express apps, use `app.listen(port, '127.0.0.1', callback)`. Regularly audit all `app.listen` or equivalent network socket creation code for missing explicit localhost binding.

## 2026-05-04 - [Critical] Unauthenticated Local Network Exposure in Python Skills

**Vulnerability:** Similar to the previous issue in the Express server, the Python HTTP servers (`skills/cm-content-factory/scripts/dashboard_server.py`) and MCP servers (`skills/cm-ux-master/mcp/server.py`) defaulted to binding to `0.0.0.0` or had `0.0.0.0` hardcoded in config files (`skills/cm-ux-master/mcp/mcp-config.json`). This exposed the unauthenticated dashboards and internal design tool intelligence to the entire local network.
**Learning:** The risk of `0.0.0.0` bindings extends beyond core services to embedded scripts, dashboard utilities, and peripheral MCP skills. If standard frameworks (like `http.server.HTTPServer` or `uvicorn`) are used without explicit `127.0.0.1` binding, they default to exposing the API/UI globally.
**Prevention:** Always default to `127.0.0.1` in environment variable configurations (`os.getenv("HOST", "127.0.0.1")`), CLI parameter defaults, and hardcoded socket definitions across all languages and frameworks. Regularly audit configurations (e.g., `mcp-config.json`) and source code for `0.0.0.0` literals.

## 2026-05-18 - [Critical] Command Injection via `execSync`

**Vulnerability:** The TDD gate script (`src/execution/tdd-gate.ts`) used `execSync` to run `npx vitest run ${testFile}`, directly embedding the `testFile` variable into the shell command string. Since the `testFile` parameter originates from user/developer input, a maliciously formatted filename could inject and execute arbitrary shell commands.
**Learning:** `execSync` (and similar functions like `exec`) passes the entire string command to a system shell (`/bin/sh` or `cmd.exe`). This means characters like `;`, `&`, or `|` in the input are interpreted as command separators. This pattern is dangerous whenever any part of the command string includes variable input.
**Prevention:** Always use `execFileSync` (or `execFile`/`spawnSync`) when executing commands with variable arguments. Pass arguments as an array instead of a single string. This approach bypasses shell interpretation entirely, allowing the operating system to safely pass the exact array strings directly to the executable. Note that when using `execFileSync` to run `.cmd` files on Windows (like `npx.cmd`), cross-platform dynamic extension handling is necessary.
