---
title: "Write Mode Sequence"
description: "Sequence diagram cho Write Mode — memory loading, template selection, content generation, scoring."
keywords: ["sequence diagram", "write mode", "content generation"]
sidebar:
  order: 4
---

# ⏱️ Write Mode — Sequence

> **Quick Reference**
> - **Trigger**: `scripts/write.py --batch N`
> - **Components**: Memory, Template Engine, AI Writer, Audit, Scoreboard
> - **Steps**: 8

## Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    
    actor User as 👤 User
    participant Mem as 🧠 Memory
    participant Topic as 📋 Topic Queue
    participant Writer as ✍️ AI Writer
    participant Audit as 🔍 Auditor
    participant Score as 📊 Scoreboard

    User->>Writer: write --batch 1
    Writer->>Mem: Load context (semantic + episodic)
    Mem-->>Writer: Writing patterns, style, mistakes
    Writer->>Topic: Get next topic
    Topic-->>Writer: Topic + knowledge context
    Writer->>Writer: Generate content
    Writer->>Audit: Auto-audit
    Audit-->>Score: +3 if pass, -3 if fail
    Writer->>Mem: Create episodic memory
    Writer-->>User: Content articles ready
```
