## 2025-04-20 - [Fix XSS vulnerability via mXSS on textContent]
**Vulnerability:** The dashboard's `esc()` function mitigated simple XSS by using `textContent` inside a dynamically created element, but then retrieving it via `innerHTML`. This exposes the application to Mutation XSS (mXSS), as complex nested HTML tags can be mutated upon serialization/deserialization.
**Learning:** DOM-based sanitization that relies on `innerHTML` serialization is intrinsically vulnerable to mXSS when dealing with malicious input payloads.
**Prevention:** Instead of using the browser DOM parser for simple character escaping, explicitly replace dangerous characters (`<`, `>`, `&`, `"`, `'`) via regular expressions.

## 2025-04-26 - [Harden multiple Express servers]
**Vulnerability:** The application instantiates multiple Express servers (e.g., `dashboard.ts`, `browse-server.ts`) but does not uniformly apply security best practices such as disabling `x-powered-by` or setting fundamental security headers (`X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`).
**Learning:** In codebases with disparate internal services or multiple entry points, it is easy to overlook hardening on secondary servers. Even local or internal tools should follow defense in depth to limit exposure in case of an SSRF or pivoting attack.
**Prevention:** Always encapsulate Express server creation in a shared hardened factory function or explicitly audit all `express()` instantiations to ensure security middleware is uniformly applied.

## 2025-04-27 - [Fix Command Injection Vulnerabilities]
**Vulnerability:** The application used `exec` and `execSync` with string interpolation for system commands involving user-supplied arguments (e.g., URLs and Git branches). This allowed potential execution of arbitrary commands if an attacker could control those inputs.
**Learning:** Shell interpolation of user input via `exec` or `execSync` is inherently unsafe and leads to command injection, as special shell characters are evaluated.
**Prevention:** Instead of string interpolation with `exec`/`execSync`, use `child_process.execFile()` or `child_process.execFileSync()` and pass arguments as an array to bypass shell interpretation entirely.
