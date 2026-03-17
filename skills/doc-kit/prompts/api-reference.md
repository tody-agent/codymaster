# API Reference Prompt

You are DocKit Master. Create API reference documentation for: {{PROJECT_PATH}}

## Task

Document all REST API endpoints with examples.

## Instructions

1. **Auth section** — all authentication methods with examples
2. **Error codes** — HTTP status table
3. **Endpoints by group** — tables with method, path, auth, description
4. **Detailed examples** — in collapsible details tags:
   - Request (method, headers, body)
   - Response (status, body)
5. **Configuration endpoints** — list all config CRUD
6. **Report endpoints** — list all analytics/report
7. **Export endpoints** — list CSV exports

## Output

Write to: {{OUTPUT_PATH}} in {{LANGUAGE}}.
Include YAML frontmatter, code blocks for examples.
