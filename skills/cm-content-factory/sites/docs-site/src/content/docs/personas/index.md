---
title: "Personas — Tổng quan"
description: "Buyer và User Personas cho Content Factory — ai sử dụng, ai quyết định. 3 User Personas và 2 Buyer Personas."
keywords: ["personas", "content factory", "user persona", "buyer persona"]
sidebar:
  order: 1
---

# Personas

> **Quick Reference**
> - **User Personas**: 3
> - **Buyer Personas**: 2

## Hệ sinh thái

```mermaid
graph TB
    style BP1 fill:#ecfdf5,stroke:#10b981,color:#18181b
    style BP2 fill:#ecfdf5,stroke:#10b981,color:#18181b
    style UP1 fill:#f8fafc,stroke:#60a5fa,color:#18181b
    style UP2 fill:#f8fafc,stroke:#60a5fa,color:#18181b
    style UP3 fill:#f8fafc,stroke:#60a5fa,color:#18181b

    subgraph Buyers["Buyer Personas"]
        BP1["CMO Hương"]
        BP2["Content Lead Khoa"]
    end

    subgraph Users["User Personas"]
        UP1["Content Manager Lan"]
        UP2["SEO Specialist Minh"]
        UP3["Content Writer Tú"]
    end

    BP1 -->|"phê duyệt"| UP1
    BP2 -->|"quản lý"| UP1
    BP2 -->|"hỗ trợ"| UP3
```

## Danh mục

### Buyer Personas

| # | Persona | JTBD | Type |
|---|---------|------|------|
| 1 | [CMO Hương](./buyer-cmo-huong) | Scale content production mà không tăng headcount | Decision Maker |
| 2 | [Content Lead Khoa](./buyer-content-lead-khoa) | Chuẩn hóa content workflow cho team | Champion |

### User Personas

| # | Persona | Vai trò | Tần suất |
|---|---------|---------|---------|
| 1 | [Content Manager Lan](./user-content-manager-lan) | Quản lý pipeline, review content | Hàng ngày |
| 2 | [SEO Specialist Minh](./user-seo-minh) | Tối ưu SEO, phân tích traffic | Hàng tuần |
| 3 | [Content Writer Tú](./user-writer-tu) | Viết và edit nội dung | Hàng ngày |
