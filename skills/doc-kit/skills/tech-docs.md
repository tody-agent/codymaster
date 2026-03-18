# Technical Documentation Generator — UX Master Edition

Generate professional technical system documentation with rich diagrams, visual hierarchy, and progressive disclosure.

## Input Required

- `docs/_analysis.md` (output from analyze-codebase)
- Access to source code for deep tracing

## Content Guidelines

**Before generating, read `skills/content-guidelines.md` for:**
- MDX safety rules (escape `<`, `{`, `}`)
- Mermaid theme-neutral rules (no hardcoded colors)
- Frontmatter requirements
- Writing style rules

## Output Files

### 1. `docs/architecture.md` — System Architecture

```markdown
---
title: "System Architecture"
description: "Architecture overview and system design"
sidebar_position: 2
---

# System Architecture

> **Quick Reference**
> - **Type**: [Monolith / Microservices / Serverless]
> - **Stack**: [Primary technologies]
> - **Key Modules**: [Core module names]
> - **Deployment**: [Docker / K8s / Serverless]

## Overview
[Brief description of what the system does and who it serves]

## Architecture Diagram

```mermaid
graph TB

    Client["🌐 Client"] --> API["⚙️ API Server"]
    API --> DB["🗄️ Database"]
```

## Core Components

| Component | Description | Technology | Key Files |
|-----------|-------------|------------|-----------|

## Main Processing Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant A as API
    participant S as Service
    participant D as Database

    C->>A: Request
    A->>S: Process
    S->>D: Query
    D-->>S: Result
    S-->>A: Response
    A-->>C: JSON
```

## Architecture Decision Records (ADR)

| # | Decision | Context | Status |
|---|----------|---------|--------|
| 1 | [Decision] | [Why this was chosen] | Accepted |
| 2 | [Decision] | [Why this was chosen] | Accepted |

<details>
<summary>ADR-001: [Decision Title]</summary>

**Context:** [What problem were we solving?]

**Decision:** [What we decided]

**Consequences:**
- ✅ [Positive outcome]
- ⚠️ [Trade-off]
- ❌ [Risk accepted]

</details>

## Security
[Auth model, trust boundaries, data sensitivity]

## Scalability & Performance

| Aspect | Strategy | Limit |
|--------|----------|-------|
| Caching | [Strategy] | [Max size/TTL] |
| Rate Limiting | [Strategy] | [Requests/min] |
| Scaling | [Horizontal/Vertical] | [Max instances] |
```

### 2. `docs/database.md` — Database

```markdown
---
title: "Database"
description: "Schema, data relations, and data model"
sidebar_position: 3
---

# Database

> **Quick Reference**
> - **Engine**: [PostgreSQL / MySQL / MongoDB / SQLite]
> - **ORM**: [Prisma / SQLAlchemy / TypeORM / None]
> - **Tables**: [Count]
> - **Migrations**: [Tool used]

## ER Diagram

```mermaid
erDiagram
    USERS ||--o{ ORDERS : places
    ORDERS ||--|{ ORDER_ITEMS : contains
```

## Tables

### [Table Name]
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|

## Relationships
| Table A | Table B | Type | FK | ON DELETE |
|---------|---------|------|----|-----------|

## Indexes & Constraints

| Table | Index | Columns | Type | Purpose |
|-------|-------|---------|------|---------|

<details>
<summary>Migration History</summary>

| Version | Date | Description |
|---------|------|-------------|
| 001 | [date] | Initial schema |

</details>
```

### 3. `docs/deployment.md` — Deployment

```markdown
---
title: "Deployment Guide"
description: "Installation, configuration, and deployment"
sidebar_position: 4
---

# Deployment Guide

> **Quick Reference**
> - **Platform**: [Docker / AWS / Vercel / Bare Metal]
> - **Min Requirements**: [CPU / RAM / Disk]
> - **Ports**: [List of ports used]
> - **Health Check**: `GET /health`

## System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | [min] | [recommended] |
| RAM | [min] | [recommended] |
| Disk | [min] | [recommended] |
| Runtime | [version] | [version] |

## Environment Variables

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|

:::warning Security
Never commit `.env` files. Use secrets management in production.
:::

## Local Setup

```bash
# Step 1: Clone
git clone [repo_url]
cd [project]

# Step 2: Install dependencies
[install_command]

# Step 3: Configure
cp .env.example .env
# Edit .env with your values

# Step 4: Run
[run_command]
```

## Docker Deployment

```yaml
# docker-compose.yml explanation
```

## CI/CD Pipeline

```mermaid
graph LR
    A["🔀 Push"] --> B["🧪 Test"]
    B --> C["📦 Build"]
    C --> D["🚀 Deploy"]
```

## Monitoring & Health

| Endpoint | Purpose | Expected |
|----------|---------|----------|
| `GET /health` | Health check | `200 OK` |
| `GET /metrics` | Prometheus | Metrics data |
```

### 4. `docs/data-flow.md` — Data Flow

```markdown
---
title: "Data Flow"
description: "Data flow diagrams and integration points"
sidebar_position: 5
---

# Data Flow

> **Quick Reference**
> - **Pattern**: [Request-Response / Event-Driven / Streaming]
> - **Protocol**: [REST / gRPC / WebSocket / GraphQL]
> - **Serialization**: [JSON / Protobuf / MessagePack]

## End-to-End Data Flow

```mermaid
graph TB
    Input["📥 Input"] --> Process["⚙️ Processing"]
    Process --> Output["📤 Output"]
```

## Main Workflows

### [Feature Name]

```mermaid
sequenceDiagram
    participant U as User
    participant A as API
    participant S as Service
    participant D as Database
```

1. User action → ...
2. API receives → ...
3. Business logic → ...
4. Database → ...
5. Response → ...

## External Integrations

| Service | Protocol | Direction | Data | Rate Limit |
|---------|----------|-----------|------|------------|

## Events / Webhooks

| Event | Trigger | Payload | Consumer |
|-------|---------|---------|----------|
```

## Rules

- **Quick Reference card** at top of every file (summary box)
- **Minimum 2 Mermaid diagrams per file**
- **Every claim cites** `(file_path:line_number)`
- **No hardcoded Mermaid colors** — let native theming handle light/dark
- **Use admonitions** (`:::tip`, `:::warning`, `:::danger`) for callouts
- **Use `<details>` Progressive Disclosure** for secondary information
- **Tables** for all structured data — never use bullet lists for tabular data
- **Explain WHY before WHAT** in every section
- **MDX-safe content** — escape `<`, `{`, `}` in non-code blocks
