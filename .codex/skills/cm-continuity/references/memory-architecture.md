# Memory Architecture

> Use when the task touches memory design, load strategy, or cross-session recall internals.

## Tiers
| Tier | Purpose |
|---|---|
| 1 | sensory / in-call transient thinking |
| 2 | working memory: current session and near-term state |
| 3 | long-term memory: learnings, decisions, outputs, indexes |
| 4 | external semantic memory for very large projects |
| 5 | structural code memory via `cm-codeintell` |

## Core Components
- `CONTINUITY.md` for active session scratchpad
- context bus for live chain state
- `context.db` or compat storage for reinforced learnings and decisions
- L0 indexes for cheap memory loads

## Design Intent
- cheap default context load
- stronger memory only when reinforced or queried
- structural and semantic memory separated from active session state

## Rule
Do not load advanced memory tiers by default when working memory is enough.
