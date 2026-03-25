---
description: Execute remote Frappe REST API operations - CRUD on DocTypes, run reports, manage Web Forms on remote sites
allowed-tools: Bash, Read, Grep, Glob
argument-hint: <operation> <doctype> [--site <url>] [--filters <json>]
---

# Frappe Remote API Operations

Execute REST API operations on remote Frappe/ERPNext sites.

## Arguments

Parse the user's input: $ARGUMENTS

Common operations:
- `get <DocType> <name>` - Get single document
- `list <DocType>` - List documents
- `create <DocType>` - Create document
- `update <DocType> <name>` - Update document
- `count <DocType>` - Count documents
- `report <ReportName>` - Run report
- `discover` - List all DocTypes on site

## Process

### Step 1: Resolve Site & Auth

```bash
# Check for .env file
if [ -f ".env" ]; then
    source .env
    echo "Using site: $FRAPPE_SITE"
else
    echo "No .env found. Please provide site URL and API credentials."
fi
```

### Step 2: Test Connection

```bash
curl -sS "$FRAPPE_SITE/api/method/frappe.auth.get_logged_user" \
  -H "Authorization: token $FRAPPE_API_KEY:$FRAPPE_API_SECRET"
```

### Step 3: Execute Operation

Delegate to `frappe-remote-ops` agent for complex operations.
See `resources/rest-api-patterns.md` for all curl patterns.

### Step 4: Handle Response

Parse with `jq` and present results clearly.

## Security

- Never expose API keys in output
- Confirm before DELETE operations
- Use `--data-urlencode` for special characters
