# Layer 0 — Skeleton Index

> Purpose: lightning-fast, zero-dependency extraction of signatures and module boundaries.

## Use When
- You need instant orientation in an unfamiliar codebase
- The task is mostly navigation, not semantic graph analysis
- You want to avoid repeated grep/list-dir exploration

## Process
```
1. SCAN     find source files across supported languages
2. EXTRACT  capture signatures only: functions, classes, exports, routes
3. GROUP    organize by directory / module boundary
4. CAP      keep the output compact
5. OUTPUT   write .cm/skeleton.md for reuse
```

## Run
```bash
# From project root
bash scripts/index-codebase.sh

# Custom input/output
bash scripts/index-codebase.sh /path/to/project /path/to/output.md
```

## What It Extracts
| Language | Patterns |
|---|---|
| TS / JS | `export`, `function`, `class`, `interface`, `type`, `enum`, routes |
| Python | `def`, `async def`, `class`, route decorators |
| Go | `func`, `struct`, `interface`, `package` |
| Rust | `pub fn`, `struct`, `enum`, `trait`, `mod` |
| Other common langs | top-level functions, classes, interfaces, modules |

## Output Shape
- Entry points
- Compact directory structure
- Per-directory code skeleton with line numbers and symbol signatures
- Enough structure to navigate without loading full files

## Agent Protocol
- If `.cm/skeleton.md` exists and is fresh, read it first.
- Rebuild after major refactors, branch switches, or stale indexes.
- Use it to:
  - locate relevant files quickly
  - understand module boundaries
  - reduce exploratory token spend

## Why It Exists
- ~95%+ compression versus reading raw source
- works on any project size
- zero dependency fallback when CodeGraph is unavailable
