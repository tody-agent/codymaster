## 2025-04-28 - [Critical] Unauthenticated Local Network Exposure

**Vulnerability:** The local express dashboard server (`src/dashboard.ts`) used `app.listen(port)` without explicitly specifying a host. In Node.js, this defaults to binding the server to `0.0.0.0` or `::`, which exposes the unauthenticated dashboard API to the entire local network.
**Learning:** Local CLI tools or developer dashboards that lack authentication must explicitly bind to the loopback interface (`127.0.0.1` or `localhost`). Relying on default bindings risks exposing sensitive development environments, API keys, or project source code to any device on the same local network (e.g., public Wi-Fi).
**Prevention:** Always explicitly bind local-only servers to `127.0.0.1`. When initializing Express apps, use `app.listen(port, '127.0.0.1', callback)`. Regularly audit all `app.listen` or equivalent network socket creation code for missing explicit localhost binding.

## 2026-05-04 - [Critical] Unauthenticated Local Network Exposure in Python Skills

**Vulnerability:** Similar to the previous issue in the Express server, the Python HTTP servers (`skills/cm-content-factory/scripts/dashboard_server.py`) and MCP servers (`skills/cm-ux-master/mcp/server.py`) defaulted to binding to `0.0.0.0` or had `0.0.0.0` hardcoded in config files (`skills/cm-ux-master/mcp/mcp-config.json`). This exposed the unauthenticated dashboards and internal design tool intelligence to the entire local network.
**Learning:** The risk of `0.0.0.0` bindings extends beyond core services to embedded scripts, dashboard utilities, and peripheral MCP skills. If standard frameworks (like `http.server.HTTPServer` or `uvicorn`) are used without explicit `127.0.0.1` binding, they default to exposing the API/UI globally.
**Prevention:** Always default to `127.0.0.1` in environment variable configurations (`os.getenv("HOST", "127.0.0.1")`), CLI parameter defaults, and hardcoded socket definitions across all languages and frameworks. Regularly audit configurations (e.g., `mcp-config.json`) and source code for `0.0.0.0` literals.

## 2025-05-18 - [Critical] Command Injection via String Interpolation in execSync

**Vulnerability:** The `src/execution/tdd-gate.ts` script used `execSync` with string interpolation for the `testFile` argument (`execSync(\`npx vitest run ${testFile} --reporter=verbose\`)`). If `testFile` contained shell metacharacters, it could lead to command injection and arbitrary code execution in the child process.
**Learning:** Using `execSync` with string interpolation is an extremely high security risk, especially when executing dynamically generated shell commands using potentially untrusted input. Node's `child_process.exec` and `execSync` interpret shell strings, making them inherently vulnerable to command injection if arguments are not strictly validated or escaped.
**Prevention:** Never use `execSync` with string interpolation for dynamic commands. Always use `execFileSync` or `spawnSync` and pass arguments as an array to bypass shell interpretation (e.g., `execFileSync('npx', ['vitest', 'run', testFile])`). Also, dynamically determine the command based on the OS (e.g., `process.platform === 'win32' ? 'npx.cmd' : 'npx'`) to prevent execution failures on Windows.
