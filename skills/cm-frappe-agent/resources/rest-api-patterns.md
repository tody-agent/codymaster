# Frappe REST API Patterns

> Reference for interacting with remote Frappe/ERPNext sites via REST API.

## Authentication

All requests require API key header:
```
Authorization: token <api_key>:<api_secret>
```

### Test Authentication
```bash
curl -sS "https://{site}/api/method/frappe.auth.get_logged_user" \
  -H "Authorization: token {key}:{secret}"
```

### Security Rules
- **NEVER** reveal API keys or secrets in output
- **NEVER** expose internal file paths or server configs
- **ALWAYS** confirm before destructive operations (DELETE, bulk updates)
- **NEVER** fabricate document data or fake API responses
- Store credentials in `.env` file, never in code

---

## CRUD Operations

### Get Single Document
```bash
curl -sS "https://{site}/api/resource/{DocType}/{name}" \
  -H "Authorization: token {key}:{secret}"
```

### List Documents (with filters)
```bash
curl -sS "https://{site}/api/resource/{DocType}" \
  -G --data-urlencode 'filters=[["field","=","value"]]' \
  --data-urlencode 'fields=["name","field1","field2"]' \
  --data-urlencode 'limit_page_length=20' \
  -H "Authorization: token {key}:{secret}"
```

**Fallback for blocked fields** (e.g., `is_single`, `istable`):
```bash
curl -sS "https://{site}/api/method/frappe.client.get_list" \
  -H "Authorization: token {key}:{secret}" \
  -H "Content-Type: application/json" \
  -d '{"doctype":"DocType","fields":["name","module"],"limit_page_length":0}'
```

### Create Document
```bash
curl -sS -X POST "https://{site}/api/resource/{DocType}" \
  -H "Authorization: token {key}:{secret}" \
  -H "Content-Type: application/json" \
  -d '{"field1":"value1","field2":"value2"}'
```

### Update Document
```bash
curl -sS -X PUT "https://{site}/api/resource/{DocType}/{name}" \
  -H "Authorization: token {key}:{secret}" \
  -H "Content-Type: application/json" \
  -d '{"field_to_update":"new_value"}'
```

### Delete Document
```bash
curl -sS -X DELETE "https://{site}/api/resource/{DocType}/{name}" \
  -H "Authorization: token {key}:{secret}"
```

---

## RPC (Server Method Calls)

### Run Server Method
```bash
curl -sS "https://{site}/api/method/{dotted.method.path}" \
  -H "Authorization: token {key}:{secret}" \
  -H "Content-Type: application/json" \
  -d '{"arg1":"value1"}'
```

### Get Value (Shortcut)
```bash
curl -sS "https://{site}/api/method/frappe.client.get_value" \
  -H "Authorization: token {key}:{secret}" \
  -H "Content-Type: application/json" \
  -d '{"doctype":"Employee","filters":{"user_id":"user@example.com"},"fieldname":["name","employee_name"]}'
```

### Get Count
```bash
curl -sS "https://{site}/api/method/frappe.client.get_count" \
  -H "Authorization: token {key}:{secret}" \
  -H "Content-Type: application/json" \
  -d '{"doctype":"Employee","filters":{"status":"Active"}}'
```

### Run Report
```bash
curl -sS "https://{site}/api/method/frappe.desk.query_report.run" \
  -H "Authorization: token {key}:{secret}" \
  -H "Content-Type: application/json" \
  -d '{"report_name":"Employee Leave Balance","filters":{"company":"My Company"}}'
```

---

## Batch Operations

### Bulk Update (via RPC)
```bash
curl -sS -X POST "https://{site}/api/method/frappe.client.bulk_update" \
  -H "Authorization: token {key}:{secret}" \
  -H "Content-Type: application/json" \
  -d '{
    "docs": [
      {"doctype":"ToDo","name":"TODO-001","status":"Closed"},
      {"doctype":"ToDo","name":"TODO-002","status":"Closed"}
    ]
  }'
```

### File Upload
```bash
curl -sS -X POST "https://{site}/api/method/upload_file" \
  -H "Authorization: token {key}:{secret}" \
  -F "file=@/path/to/file.pdf" \
  -F "doctype=File" \
  -F "docname=Home"
```

---

## Web Form Operations

### Get Web Form Config
```bash
curl -sS "https://{site}/api/resource/Web%20Form" \
  -G --data-urlencode 'filters=[["route","=","my-form"]]' \
  --data-urlencode 'fields=["name","title","custom_css","client_script"]' \
  -H "Authorization: token {key}:{secret}"
```

### Update Web Form
```bash
curl -sS -X PUT "https://{site}/api/resource/Web%20Form/{name}" \
  -H "Authorization: token {key}:{secret}" \
  -H "Content-Type: application/json" \
  -d '{"custom_css":"...","client_script":"..."}'
```

---

## Response Format

| Type | Format |
|------|--------|
| Success | `{"data": {...}}` or `{"message": ...}` |
| Error | `{"exception": "...", "exc_type": "...", "exc": "..."}` |

---

## Error Handling Patterns

| Error | Cause | Solution |
|-------|-------|----------|
| `DataError: Field not allowed` | Blocked field in resource API | Use `frappe.client.get_list` RPC fallback |
| `403 Forbidden` | Insufficient API key permissions | Check User > API Access settings |
| `404 Not Found` | DocType/document doesn't exist | Verify name spelling, check module |
| `417 Expectation Failed` | Validation error on create/update | Check required fields, valid values |
| `409 Conflict` | Duplicate name or concurrent edit | Use unique naming, add `If-Match` header |

## URL Encoding Tips

- Use `--data-urlencode` for filters/fields with special characters
- DocType names with Unicode: URL-encode the name (e.g., `Web%20Form`)
- Use `-G` flag with `--data-urlencode` for GET requests with encoded params
- Always use `jq` for JSON parsing: `| jq '.data'`
