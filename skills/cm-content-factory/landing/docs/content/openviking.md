# OpenViking Semantic Memory

**OpenViking** is CodyMaster's high-performance memory backend. It replaces chaotic keyword-based grep searches and blind RAG chunking with a highly structured Semantic Vector Engine.

## The Problem with Standard AI Search

Typical AI coding agents use raw text searches or simple AST parsing limits to find context. This causes **Code Amnesia**:
- The agent forgets standard component library practices.
- The agent invents (hallucinates) missing variables.
- Scaling to million-line codebases overflows the token limit, crashing the session.

## The OpenViking Solution

OpenViking introduces **L0/L1/L2 Progressive Summarization** coupled with SQLite FTS5 and Vector Embeddings.

### How it works:

1. **L0 (Skeleton Index)**: A fast map of the entire directory structure, capturing file names, exports, and imports. 
2. **L1 (Symbol Index)**: Extracts function signatures, class interfaces, and variable definitions without the bulky implementation details.
3. **L2 (Full Context)**: The heavy vector embeddings (using local or API-driven embedding models) that store actual logic and edge cases.

When the agent attempts to refactor a component, OpenViking performs a semantic lookup on L1 and L2 databases, pulling *only* the exact functions and files impacted by the change.

## Native Integration

OpenViking works autonomously in the background. When CodyMaster initializes in a project, it creates a `.viking` directory (ignored via `.gitignore`) mapped entirely to a rapid local SQLite store.

```bash
# Force an on-demand re-index of the OpenViking graph
cody-master viking index --force
```

By ensuring agents have a complete layout of the system at all times, OpenViking single-handedly eliminates structural regressions in mature projects.
