# API Reference Generator — UX Master Edition

Automatically generate API reference documentation with multi-language SDK examples and visual request flows.

## Input Required

- `docs/_analysis.md` (output from analyze-codebase)
- Access to route files, controllers, middleware, type definitions

## Content Guidelines

**Before generating, read `skills/content-guidelines.md` for:**
- Writing style rules
- Mermaid theme-neutral rules

## Procedure

### 1. Scan Route Files

Detect routing patterns by framework:

| Framework | Route Pattern |
|-----------|--------------|
| Express.js | `router.get('/path', handler)` |
| Next.js API | `app/api/*/route.ts` |
| FastAPI | `@app.get('/path')` |
| Hono | `app.get('/path', handler)` |
| Go (chi/gin) | `r.Get("/path", handler)` |
| NestJS | `@Get('/path')` decorator |
| Bun / Elysia | `app.get('/path', handler)` |
| Deno / Fresh | `GET /api/path` handler exports |

### 2. Extract Endpoint Details

For each endpoint, extract:
- HTTP method + path (with params)
- Middleware / guards (auth, rate limit)
- Request body schema (from types/validators)
- Response schema (from return types)
- Status codes (from error handlers)

### 3. Group by Resource

Organize endpoints by resource:
```
/api/users      → Users
/api/orders     → Orders
/api/products   → Products
```

### 4. Generate Files

Output to `docs/api/[resource].md`

## API Reference Template

```markdown
---
title: "[Resource Name] API"
description: "API reference for [resource]"
---

# [Resource Name] API

> **Quick Reference**
> - **Base URL**: `[base_url]/api/[resource]`
> - **Auth**: Bearer Token / API Key / None
> - **Rate Limit**: [X requests/min]
> - **Content-Type**: `application/json`

## Endpoints Overview

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/resource` | List items | ✅ |
| GET | `/api/resource/:id` | Get details | ✅ |
| POST | `/api/resource` | Create item | ✅ |
| PUT | `/api/resource/:id` | Update item | ✅ |
| DELETE | `/api/resource/:id` | Delete item | ✅ |

---

## GET /api/resource

List all [resource].

### Parameters

| Name | Location | Type | Required | Default | Description |
|------|----------|------|----------|---------|-------------|
| page | query | number | ❌ | 1 | Page number |
| limit | query | number | ❌ | 20 | Items per page |
| sort | query | string | ❌ | `created_at` | Sort field |

### Response

**200 OK**
```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

**401 Unauthorized**
```json
{
  "error": "Authentication required",
  "code": "AUTH_REQUIRED"
}
```

### Examples

<details>
<summary>cURL</summary>

```bash
curl -X GET "https://api.example.com/api/resource?page=1&limit=10" \
  -H "Authorization: Bearer <token>"
```

</details>

<details>
<summary>Python</summary>

```python
import requests

response = requests.get(
    "https://api.example.com/api/resource",
    params={"page": 1, "limit": 10},
    headers={"Authorization": f"Bearer {token}"}
)
data = response.json()
```

</details>

<details>
<summary>JavaScript (fetch)</summary>

```javascript
const response = await fetch('/api/resource?page=1&limit=10', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();
```

</details>

<details>
<summary>Go</summary>

```go
req, _ := http.NewRequest("GET", "https://api.example.com/api/resource?page=1", nil)
req.Header.Set("Authorization", "Bearer "+token)
resp, _ := http.DefaultClient.Do(req)
```

</details>
```

## Index File

Generate `docs/api/index.md`:

```markdown
---
title: "API Reference"
description: "API reference documentation"
---

# API Reference

> **Quick Reference**
> - **Base URL**: `[detected base URL]`
> - **Auth Method**: [Bearer token / API key / OAuth2]
> - **Response Format**: JSON
> - **API Version**: [v1 / v2]

## Authentication

```bash
# Include this header in all authenticated requests
Authorization: Bearer <your_access_token>
```

:::warning
API keys should never be exposed in client-side code. Use server-side proxying or environment variables.
:::

## Endpoints

| Resource | Endpoints | Base Path | Auth |
|----------|-----------|-----------|------|
| Users | 5 | /api/users | ✅ |
| Orders | 4 | /api/orders | ✅ |

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| 400 | Bad Request | Invalid or missing request data |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource does not exist |
| 422 | Unprocessable | Validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Internal server error |

## Rate Limiting

| Tier | Limit | Window |
|------|-------|--------|
| Free | 60 req | per minute |
| Pro | 600 req | per minute |

:::tip
Rate limit headers are included in every response:
`X-RateLimit-Remaining`, `X-RateLimit-Reset`
:::
```

## Rules

- **Quick Reference card** at top of every API page
- **Extract schemas from actual type definitions** — never guess
- **Include real validation rules** from validators (Zod, Joi, class-validator)
- **Show both success and error responses** for every endpoint
- **Multi-language SDK examples** using `<details>` (cURL, Python, JS, Go)
- **Use `:::warning` admonition** for security-related notes
- **Use `:::tip` admonition** for usage tips
- **Cite source**: `(file_path:line_number)` for each endpoint
