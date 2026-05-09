# Layered Memory System

**CodyMaster's Smart Spine memory** is built to keep context retrieval practical, local-first, and honest about what ships today.

## Why this matters

Standard AI workflows often over-rely on blunt keyword search or huge prompt dumps. That creates three predictable problems:
- agents miss architectural relationships between files
- token windows fill with low-signal context
- teams start depending on extra services before the core workflow is even stable

## The CodyMaster approach

CodyMaster uses a layered memory model that combines:

1. **L0 indexes** for fast structural awareness
2. **SQLite + FTS5** for durable searchable learnings and decisions
3. **L1/L2 progressive loading** so agents only load richer context when the task actually needs it
4. **Context Bus** for passing task outputs between skill steps without re-deriving state from chat

## What you get in practice

- Local-first memory with no extra semantic service required
- Better context targeting than raw grep-only workflows
- Lower token usage through progressive loading
- A supportable default setup that works across real projects today

## Recommended setup

The supported CodyMaster path is:

```bash
npm install
npm run build
npm run test:gate:kit
```

From there, CodyMaster builds and queries context through the shipped Smart Spine stack without requiring a separate semantic service.
