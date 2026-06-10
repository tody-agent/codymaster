## 2025-04-28 - [Critical] Unauthenticated Local Network Exposure

**Vulnerability:** The local express dashboard server (`src/dashboard.ts`) used `app.listen(port)` without explicitly specifying a host. In Node.js, this defaults to binding the server to `0.0.0.0` or `::`, which exposes the unauthenticated dashboard API to the entire local network.
**Learning:** Local CLI tools or developer dashboards that lack authentication must explicitly bind to the loopback interface (`127.0.0.1` or `localhost`). Relying on default bindings risks exposing sensitive development environments, API keys, or project source code to any device on the same local network (e.g., public Wi-Fi).
**Prevention:** Always explicitly bind local-only servers to `127.0.0.1`. When initializing Express apps, use `app.listen(port, '127.0.0.1', callback)`. Regularly audit all `app.listen` or equivalent network socket creation code for missing explicit localhost binding.

## 2026-05-04 - [Critical] Unauthenticated Local Network Exposure in Python Skills

**Vulnerability:** Similar to the previous issue in the Express server, the Python HTTP servers (`skills/cm-content-factory/scripts/dashboard_server.py`) and MCP servers (`skills/cm-ux-master/mcp/server.py`) defaulted to binding to `0.0.0.0` or had `0.0.0.0` hardcoded in config files (`skills/cm-ux-master/mcp/mcp-config.json`). This exposed the unauthenticated dashboards and internal design tool intelligence to the entire local network.
**Learning:** The risk of `0.0.0.0` bindings extends beyond core services to embedded scripts, dashboard utilities, and peripheral MCP skills. If standard frameworks (like `http.server.HTTPServer` or `uvicorn`) are used without explicit `127.0.0.1` binding, they default to exposing the API/UI globally.
**Prevention:** Always default to `127.0.0.1` in environment variable configurations (`os.getenv("HOST", "127.0.0.1")`), CLI parameter defaults, and hardcoded socket definitions across all languages and frameworks. Regularly audit configurations (e.g., `mcp-config.json`) and source code for `0.0.0.0` literals.

## 2025-06-10 - [Critical] Command Injection via execSync String Interpolation

**Vulnerability:** The application used `execSync` in `src/execution/tdd-gate.ts` with string interpolation to run shell commands (`execSync(\`npx vitest run \${testFile} --reporter=verbose\`)`). This creates a command injection risk if the `testFile` variable is influenced by unsanitized user input, allowing arbitrary shell command execution.
**Learning:** Using synchronous or asynchronous shell execution functions (like `execSync` or `exec`) with interpolated strings is a dangerous pattern. When variables are directly concatenated into the command string, the underlying shell can be manipulated using special characters like `;`, `&`, or `|`.
**Prevention:** Always use execution functions that accept an array of arguments, such as `execFileSync` or `spawnSync`. This bypasses shell interpretation and safely passes the variables as literal arguments to the executable. For example, use `execFileSync('npx', ['vitest', 'run', testFile])`. Ensure cross-platform compatibility by explicitly handling `.cmd` extensions on Windows when executing `npx` or similar tools directly.
