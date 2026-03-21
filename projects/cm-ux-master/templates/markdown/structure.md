# Markdown Documentation Structure

Standard folder structure for plain Markdown documentation.

## Standard Layout

```
docs/
├── README.md                    # Landing page / index
│
├── 01-architecture.md           # System architecture
├── 02-database.md               # Database schema
├── 03-deployment.md             # Deployment guide
├── 04-data-flow.md              # Data flow diagrams
│
├── sop/                         # SOP User Guides
│   ├── index.md                 # SOP overview
│   ├── 01-authentication.md     # Login, register, password
│   ├── 02-user-management.md    # CRUD users
│   ├── 03-[module-name].md      # One per feature module
│   └── ...
│
├── api/                         # API Reference
│   ├── index.md                 # API overview, auth, errors
│   ├── users.md                 # Users endpoints
│   ├── orders.md                # Orders endpoints
│   └── ...
│
└── assets/                      # Screenshots, images
    └── screenshots/
```

## Naming Conventions

| Rule | Example |
|------|---------|
| Lowercase with hyphens | `user-management.md` |
| Number prefix for ordering | `01-architecture.md` |
| SOP files by module | `sop/03-order-management.md` |
| API files by resource | `api/users.md` |

## Frontmatter Template

Every `.md` file should include:

```yaml
---
title: "Page Title"
description: "Brief description"
---
```

## Link Conventions

Use relative links between docs:

```markdown
See [Architecture](./01-architecture.md) for details.
Refer to [Users API](./api/users.md#create-user).
```
