# Layer 1 — Code Graph

> Purpose: AST-based structural graph for symbol search, callers, callees, and impact analysis.

## Use When
- You need to know what calls a symbol
- You need to know what a symbol calls
- You need impact analysis before a risky change
- Skeleton orientation is not enough

## Setup
```bash
# One-time install
npx @colbymchenry/codegraph

# Initialize and index
codegraph init .
codegraph index .
```

## MCP Setup
```json
{
  "mcpServers": {
    "codegraph": {
      "command": "codegraph",
      "args": ["serve"]
    }
  }
}
```

## Core Queries
| Tool / Query | Use |
|---|---|
| `codegraph_search(query)` | find symbols by name or meaning |
| `codegraph_context(task)` | assemble focused structural context |
| `codegraph_callers(symbol)` | find inbound usage |
| `codegraph_callees(symbol)` | find outbound calls |
| `codegraph_impact(symbol)` | estimate blast radius |
| `codegraph_files(path)` | inspect project structure with metadata |
| `codegraph_node(symbol)` | inspect one symbol deeply |

## Replace This Pattern
| Instead of | Use |
|---|---|
| repeated grep for symbol names | `codegraph_search(...)` |
| manual caller tracing | `codegraph_callers(...)` |
| guessing blast radius | `codegraph_impact(...)` |
| recursive directory spelunking | `codegraph_files(...)` |

## Freshness Rules
- Check status before relying on the graph
- Sync after major refactors or branch changes
- Re-index when the graph is stale or missing

## Guardrail
If graph setup is unavailable, fall back to Layer 0 rather than blocking work entirely.
