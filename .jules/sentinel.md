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

## 2026-05-06 - [CRITICAL] Command Injection in execSync with String Interpolation

**Vulnerability:** The TDD gate script (`src/execution/tdd-gate.ts`) used `execSync` to run `vitest` via a constructed string: `npx vitest run ${testFile} --reporter=verbose`. Since `testFile` is not strictly validated or escaped, malicious inputs could inject arbitrary shell commands.
**Learning:** `execSync` and `exec` invoke a shell by default. Any unsanitized or loosely validated variable interpolated into a string passed to these functions is a severe command injection vulnerability.
**Prevention:** Always use `execFileSync` or `spawnSync` with an explicit array of arguments. This prevents shell evaluation of variables. Furthermore, never execute batch files (like `.cmd` or `.bat`) via these functions on Windows, as they still spawn a shell. Instead, resolve the tool's JavaScript entry point and execute it directly via `process.execPath`.

## 2026-05-06 - [CRITICAL] Command Injection in execSync with String Interpolation (Revision)

**Vulnerability:** The TDD gate script (`src/execution/tdd-gate.ts`) used `execSync` to run `vitest` via a constructed string: `npx vitest run ${testFile} --reporter=verbose`. Since `testFile` is not strictly validated or escaped, malicious inputs could inject arbitrary shell commands.
**Learning:** `execSync` and `exec` invoke a shell by default. Any unsanitized or loosely validated variable interpolated into a string passed to these functions is a severe command injection vulnerability. Furthermore, using ESM-specific variables like `import.meta.url` in files that are compiled as CommonJS (`"module": "commonjs"`) will cause build errors (TS1343).
**Prevention:** Always use `execFileSync` or `spawnSync` with an explicit array of arguments. This prevents shell evaluation of variables. Furthermore, never execute batch files (like `.cmd` or `.bat`) via these functions on Windows, as they still spawn a shell. Instead, resolve the tool's JavaScript entry point and execute it directly via `process.execPath`. To support dynamic resolution in files compiled to CommonJS without triggering static analysis issues, use `typeof require !== 'undefined' ? require.resolve : null`.
