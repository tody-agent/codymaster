## 2024-05-24 - [Fix DOM-based mXSS]
**Vulnerability:** The project previously used `document.createElement('div'); d.textContent = str; return d.innerHTML;` for sanitization in `public/dashboard/app.js`. This approach is known to be vulnerable to DOM-based Mutation XSS (mXSS) depending on browser-specific DOM parsing rules when innerHTML reflects content into attributes.
**Learning:** Using DOM injection via textContent and retrieving innerHTML is not entirely secure against XSS vulnerabilities compared to strict regular expression string replacement.
**Prevention:** Use a regex-based string replacement method for sanitizing unsafe characters like `&`, `<`, `>`, `"`, and `'`.
