# `cm://` URI Scheme

> Use when referencing memory or skill resources symbolically.

## Common URIs
```text
cm://memory/working
cm://memory/learnings
cm://memory/learnings/{id}
cm://memory/decisions
cm://skills/{name}
cm://skills/{name}/L0
cm://resources/skeleton
cm://pipeline/current
```

## Purpose
- depth-aware resource loading
- cheap L0/L1 reads before full content
- stable references for memory and skill resources

## Rule
Use symbolic `cm://` access when you need portable, depth-aware references rather than hardcoded file reads.
