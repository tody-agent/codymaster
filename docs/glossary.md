---
title: Glossary
description: Shared terminology used in CodyMaster architecture, workflows, and runtime behavior.
keywords: codymaster glossary, continuity, context bus, mcp
robots: index, follow
---

# Glossary

> [!TIP]
> **Quick reference:** Use this page for consistent language across engineering, docs, and operations.

## Terms

- **Context Bus**: Project-local shared state file used to pass outputs across skill/workflow steps.
- **Continuity**: Structured working-memory format tracked in `.cm/CONTINUITY.md`.
- **L0/L1/L2**: Retrieval depth levels used by URI resolution and context loading.
- **MCP Context Server**: JSON-RPC stdio server exposing CodyMaster memory and pipeline tools.
- **Skill Output**: Persisted output artifact from a step in a chained workflow.
- **Sprint Artifact**: File/state emitted by sprint pipeline lifecycle operations.
- **Storage Backend**: Pluggable persistence implementation (`sqlite` or `viking`).

See also:

- [System Overview](./architecture/system-overview.md)
- [Storage and Memory Model](./architecture/data-and-memory.md)
- [Servers and MCP Runtime](./architecture/servers-and-mcp.md)