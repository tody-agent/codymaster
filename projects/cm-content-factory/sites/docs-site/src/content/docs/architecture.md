---
title: "Kiến trúc Hệ thống"
description: "Kiến trúc Content Factory — Memory System, Content Pipeline, Intelligence Layer, và Extension System."
keywords: ["architecture", "content factory", "system design"]
sidebar:
  order: 2
---

# Kiến trúc Hệ thống

> **Quick Reference**
> - **Type**: AI Content Production Pipeline
> - **Core**: 8 operating modes
> - **Intelligence**: 3-layer memory + scoreboard
> - **Config**: Single JSON file

## Architecture Diagram

```mermaid
graph TB
    style Memory fill:#ecfdf5,stroke:#10b981,color:#18181b
    style Pipeline fill:#f8fafc,stroke:#60a5fa,color:#18181b
    style Intel fill:#fef3c7,stroke:#f59e0b,color:#18181b
    style Ext fill:#fce7f3,stroke:#ec4899,color:#18181b

    subgraph Memory["🧠 Memory System"]
        M1["Semantic<br/>(long-term patterns)"]
        M2["Episodic<br/>(session experiences)"]
        M3["Working<br/>(current context)"]
    end

    subgraph Pipeline["⚙️ Content Pipeline"]
        P1["Extract"] --> P2["Plan"]
        P2 --> P3["Write"]
        P3 --> P4["Audit"]
        P4 --> P5["SEO"]
        P5 --> P6["Publish"]
    end

    subgraph Intel["📊 Intelligence Layer"]
        I1["Scoreboard"]
        I2["Learn Engine"]
        I3["Research Engine"]
        I4["Monetize Scorer"]
    end

    subgraph Ext["🔌 Extensions"]
        E1["Hooks"]
        E2["OpenClaw Adapter"]
    end

    Memory --> Pipeline
    Pipeline --> Intel
    Intel --> Memory
    Ext --> Pipeline
```

## Core Components

| Component | File | Mô tả |
|-----------|------|-------|
| Pipeline Orchestrator | `scripts/pipeline.py` | Master orchestrator cho full auto mode |
| Extractor | `scripts/extract.py` | Trích xuất kiến thức từ documents |
| Planner | `scripts/plan.py` | Lên kế hoạch topics từ knowledge base |
| Writer | `scripts/write.py` | AI content writer với memory context |
| Auditor | `scripts/audit.py` | Kiểm tra chất lượng + auto-fix |
| SEO Optimizer | `scripts/seo.py` | Tối ưu SEO metadata |
| Publisher | `scripts/publish.py` | Build và deploy content |
| Memory Engine | `scripts/memory.py` | 3-layer memory management |
| Scoreboard | `scripts/scoreboard.py` | Reward/penalty tracking |
| Researcher | `scripts/research.py` | Auto-research engine |
| Monetizer | `scripts/monetize.py` | Monetization scoring |

## Architecture Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Config-driven | Một file JSON điều khiển toàn bộ — portable, version-controllable |
| 2 | 3-layer memory | Semantic (patterns) + Episodic (experiences) + Working (context) |
| 3 | Reward/penalty scoring | Gamification + data-driven quality improvement |
| 4 | Hook-based extensions | Extensible mà không modify core pipeline |
| 5 | Script-per-mode | Mỗi mode là một script độc lập — composable |

## Security

| Layer | Approach |
|-------|----------|
| Config | `.gitignore` API keys, environment variables |
| Memory | Local storage, no external sync |
| Extensions | Sandboxed hooks, no arbitrary code execution |
