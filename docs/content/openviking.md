# OpenViking: Vector-Accurate Memory

**OpenViking** is the storage engine for CodyMaster's long-term semantic memory. It solves the "context window" problem by intelligently retrieving only the most relevant pieces of information for any given task.

---

## 🔍 How it Works

OpenViking indexes your workspace on three levels:

1.  **L0 (Structural)**: File names, function signatures, and directory maps.
2.  **L1 (Summarized)**: AI-generated summaries of modules and features.
3.  **L2 (Granular)**: Full-text vector embeddings of every line of code.

When an agent needs information, it queries the **Neural Spine**, which uses OpenViking to search across all three levels in parallel.

## ⚙️ Configuration

You can configure your memory depth in `codymaster.json`:

```json
{
  "memory": {
    "engine": "openviking",
    "storage": "sqlite-fts5",
    "embeddingModel": "text-embedding-3-small",
    "autoIndex": true
  }
}
```

## 🚀 Performance

- **Zero-Latency Search**: Sub-10ms retrieval for 1M+ vectors (Local SQLite/FTS5).
- **Infinite Context**: Seamlessly bridge data from past sessions into new ones.
- **Smart Pruning**: Automatically archive old or irrelevant context to stay under token limits.

---

[docs/](./index.html#v5-intro) ← Back to Intro
