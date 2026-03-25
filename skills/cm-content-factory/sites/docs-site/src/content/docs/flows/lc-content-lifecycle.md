---
title: "Content Lifecycle"
description: "Vòng đời content article — 7 trạng thái từ Draft đến Archived. State diagram cho content management."
keywords: ["lifecycle", "content states", "state diagram"]
sidebar:
  order: 5
---

# 🔁 Content Article Lifecycle

> **Quick Reference**
> - **Entity**: Content Article
> - **States**: 7
> - **Terminal**: Archived, Deleted

## State Diagram

```mermaid
stateDiagram-v2
    direction LR
    
    [*] --> Draft : write mode
    Draft --> InReview : submit
    InReview --> Draft : reject
    InReview --> Approved : pass audit
    Approved --> SEOOptimized : seo mode
    SEOOptimized --> Published : publish
    Published --> Updated : user edits
    Updated --> InReview : resubmit
    Published --> Archived : outdated
    Draft --> Deleted : discard
    Deleted --> [*]
    Archived --> [*]
```

## Transition Table

| From | To | Trigger | Score Impact |
|------|----|---------|-------------|
| — | Draft | Write mode creates content | 0 |
| Draft | InReview | Submit for audit | 0 |
| InReview | Draft | Audit fail | -3 |
| InReview | Approved | Audit pass | +3 |
| Approved | SEOOptimized | SEO mode runs | 0 |
| SEOOptimized | Published | Publish mode | 0 |
| Published | Updated | User edits | -5 |
| Published | Archived | Content outdated | 0 |
| Draft | Deleted | User discards | -10 |
