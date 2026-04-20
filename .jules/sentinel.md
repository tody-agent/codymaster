## 2025-04-20 - [Fix XSS vulnerability via mXSS on textContent]
**Vulnerability:** The dashboard's `esc()` function mitigated simple XSS by using `textContent` inside a dynamically created element, but then retrieving it via `innerHTML`. This exposes the application to Mutation XSS (mXSS), as complex nested HTML tags can be mutated upon serialization/deserialization.
**Learning:** DOM-based sanitization that relies on `innerHTML` serialization is intrinsically vulnerable to mXSS when dealing with malicious input payloads.
**Prevention:** Instead of using the browser DOM parser for simple character escaping, explicitly replace dangerous characters (`<`, `>`, `&`, `"`, `'`) via regular expressions.
