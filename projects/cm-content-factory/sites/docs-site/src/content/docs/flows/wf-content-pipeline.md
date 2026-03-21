---
title: "Content Pipeline Workflow"
description: "Business workflow cho Content Factory pipeline — từ Extract đến Publish, với audit loop và memory integration."
keywords: ["workflow", "content pipeline", "automation"]
sidebar:
  order: 2
---

# 🔄 Content Pipeline Workflow

> **Quick Reference**
> - **Persona**: [Content Manager Lan](../personas/user-content-manager-lan)
> - **Trigger**: Có source documents mới hoặc cần batch mới
> - **Outcome**: Published content đạt audit standards

## Process Flow

```mermaid
graph TB
    style Start fill:#ecfdf5,stroke:#10b981,color:#18181b
    style End fill:#ecfdf5,stroke:#10b981,color:#18181b
    style Decision fill:#fef3c7,stroke:#f59e0b,color:#18181b

    Start(["▶ Source Documents"])
    A["1. Extract Knowledge"]
    B["2. Plan Topics"]
    C["3. Write Content"]
    D["4. Auto Audit"]
    Decision{"Pass?"}
    E["5. SEO Optimize"]
    F["6. Publish"]
    G["Fix Issues"]
    H["7. Learn & Score"]
    End(["✅ Published"])

    Start --> A --> B --> C --> D --> Decision
    Decision -->|"Pass"| E --> F --> H --> End
    Decision -->|"Fail"| G --> C
```

## Step Details

| Bước | Mode | Command | Output |
|------|------|---------|--------|
| 1 | Extract | `scripts/extract.py` | `knowledge-base/` |
| 2 | Plan | `scripts/plan.py` | `topics-queue/batch-{DATE}.json` |
| 3 | Write | `scripts/write.py --batch N` | Content articles |
| 4 | Audit | `scripts/audit.py` | Pass/Fail report |
| 5 | SEO | `scripts/seo.py extract && apply` | Optimized metadata |
| 6 | Publish | `scripts/publish.py` | Deployed content |
| 7 | Learn | `scripts/memory.py --learn` | Updated memory |
