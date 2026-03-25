---
name: remote-operations
description: REST API patterns and best practices for managing remote Frappe/ERPNext sites via curl.
---

# Remote Operations

Patterns for interacting with remote Frappe/ERPNext sites via REST API.

## When to Use

- Managing Frappe Cloud sites (no bench CLI access)
- Operating on remote self-hosted Frappe instances
- Automating document operations across sites
- Managing Web Forms from code

## Key References

- `resources/rest-api-patterns.md` — Complete curl patterns for CRUD, RPC, reports
- `resources/doctype-registry.md` — DocType discovery and exploration
- `resources/web-form-patterns.md` — Web Form client script patterns
- `agents/frappe-remote-ops.md` — Full remote operations agent

## Quick Reference

### Authentication
```
Authorization: token <api_key>:<api_secret>
```

### Common Operations
| Operation | Method | Endpoint |
|-----------|--------|----------|
| Get doc | GET | `/api/resource/{DocType}/{name}` |
| List docs | GET | `/api/resource/{DocType}` |
| Create doc | POST | `/api/resource/{DocType}` |
| Update doc | PUT | `/api/resource/{DocType}/{name}` |
| Delete doc | DELETE | `/api/resource/{DocType}/{name}` |
| Run method | POST | `/api/method/{method}` |
| Get value | POST | `/api/method/frappe.client.get_value` |
| Get count | POST | `/api/method/frappe.client.get_count` |

### Security Rules
1. Never expose API keys in output
2. Confirm before destructive operations
3. Store credentials in `.env` files
4. Rate-limit batch operations
