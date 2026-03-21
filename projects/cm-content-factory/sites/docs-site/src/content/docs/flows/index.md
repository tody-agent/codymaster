---
title: "Process Flows"
description: "Tất cả process flow diagrams cho Content Factory — pipeline workflow, memory lifecycle, content journey."
keywords: ["process flow", "workflow", "content factory", "pipeline"]
sidebar:
  order: 1
---

# Process Flows

> **Quick Reference**
> - **Workflows**: 2
> - **Sequences**: 1
> - **Lifecycles**: 1
> - **Journeys**: 1

## System Overview

```mermaid
graph TB
    style System fill:#f8fafc,stroke:#e5e7eb,color:#18181b

    subgraph System["Content Factory"]
        M1["Extract"]
        M2["Plan"]
        M3["Write"]
        M4["Audit"]
        M5["SEO"]
        M6["Publish"]
        M7["Learn"]
        M8["Research"]
    end

    M1 --> M2 --> M3 --> M4 --> M5 --> M6
    M4 -->|"fail"| M3
    M6 --> M7
    M8 --> M1
```

## Directory

### Workflows

| # | Flow | Persona | Link |
|---|------|---------|------|
| 1 | Content Pipeline | Content Manager Lan | [Xem](./wf-content-pipeline) |
| 2 | Self-Learning Cycle | Hệ thống tự động | [Xem](./wf-learning-cycle) |

### Sequences

| # | Flow | Components | Link |
|---|------|-----------|------|
| 1 | Write Mode Processing | 5 steps | [Xem](./seq-write-mode) |

### Lifecycles

| # | Entity | States | Link |
|---|--------|--------|------|
| 1 | Content Article | 7 states | [Xem](./lc-content-lifecycle) |

### Journeys

| # | Journey | Persona | Link |
|---|---------|---------|------|
| 1 | First Content Batch | Content Writer Tú | [Xem](./uj-first-batch) |
