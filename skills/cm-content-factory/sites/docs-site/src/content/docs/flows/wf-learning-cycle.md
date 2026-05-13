---
title: "Self-Learning Cycle"
description: "Workflow cho Content Factory self-learning cycle — feedback detection, pattern extraction, memory update."
keywords: ["workflow", "self-learning", "memory", "feedback"]
sidebar:
  order: 3
---

# 🔄 Self-Learning Cycle

> **Quick Reference**
> - **Trigger**: Sau user feedback, edits, hoặc deletes
> - **Outcome**: Memory system cập nhật, writing quality cải thiện

## Process Flow

```mermaid
graph TB
    style Start fill:#ecfdf5,stroke:#10b981,color:#18181b
    style End fill:#ecfdf5,stroke:#10b981,color:#18181b

    Start(["▶ User Feedback"])
    A["1. Detect Changes (git diff)"]
    B["2. Calculate Score"]
    C["3. Extract Patterns"]
    D["4. Update Semantic Memory"]
    E["5. Adjust Writing Style"]
    End(["✅ System Improved"])

    Start --> A --> B --> C --> D --> E --> End
```

## Scoring Rules

| Event | Points | Detection |
|-------|--------|-----------|
| User praise | +10 | Keyword detection |
| Engagement | +5 | Analytics hook |
| Audit pass first try | +3 | Auto-detect |
| User edits article | -5 | Git diff |
| User deletes article | -10 | Git diff |
| Audit fail | -3 | Auto-detect |

## Grading Tiers

| Tier | Points | Level |
|------|--------|-------|
| 🏆 S-Tier | 100+ | Master content creator |
| 🥇 A-Tier | 50-99 | Expert |
| 🥈 B-Tier | 20-49 | Skilled |
| 🥉 C-Tier | 0-19 | Learning |
| 📉 D-Tier | < 0 | Needs improvement |
