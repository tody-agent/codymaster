## 2025-04-20 - [Fix XSS vulnerability via mXSS on textContent]
**Vulnerability:** The dashboard's `esc()` function mitigated simple XSS by using `textContent` inside a dynamically created element, but then retrieving it via `innerHTML`. This exposes the application to Mutation XSS (mXSS), as complex nested HTML tags can be mutated upon serialization/deserialization.
**Learning:** DOM-based sanitization that relies on `innerHTML` serialization is intrinsically vulnerable to mXSS when dealing with malicious input payloads.
**Prevention:** Instead of using the browser DOM parser for simple character escaping, explicitly replace dangerous characters (`<`, `>`, `&`, `"`, `'`) via regular expressions.

## 2026-04-25 - [Express Server Hardening]
**Vulnerability:** Express servers `src/dashboard.ts` and `src/browse-server.ts` lacked basic security headers (MIME sniffing protection, Clickjacking protection, XSS filtering) and `src/browse-server.ts` leaked the server technology via the `x-powered-by` header.
**Learning:** Express applications expose the `x-powered-by` header by default and do not set any basic security headers out-of-the-box, leaving internal tools vulnerable to standard web-based attacks if exposed.
**Prevention:** Always use `app.disable('x-powered-by')` and set fundamental security headers (`X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`) via a middleware (or use a library like Helmet) when configuring an Express application.
