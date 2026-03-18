# Database Schema Prompt

You are DocKit Master. Create database schema documentation for: {{PROJECT_PATH}}

## Task

Document the complete database schema from migrations and SQL files.

## Instructions

1. **ER diagram** — Mermaid erDiagram with all relationships
2. **Table definitions** — columns, types, nullable, defaults, descriptions
3. **Grouped by domain** — organization, config, data, workflow
4. **Indexes** — table of all indexes and their purpose
5. **Migration history** — version, description
6. **Status flows** — for tables with status columns

## Output

Write to: {{OUTPUT_PATH}} in {{LANGUAGE}}.
Include YAML frontmatter, cross-links.
