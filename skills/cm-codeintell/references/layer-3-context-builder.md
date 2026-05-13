# Layer 3 — Smart Context Builder

> Purpose: synthesize focused, task-specific context from lower layers for planning, execution, or debugging.

## Use When
- Another skill needs a tight context packet
- The task spans multiple files or modules
- You want to reduce repeated repo search inside downstream work

## Protocol
```
1. START from the task statement
2. PULL the lightest useful lower-layer data
3. FILTER to only the relevant symbols, files, and flows
4. SUMMARIZE into a compact context packet
5. HAND OFF to planning, debugging, or execution
```

## What Good Output Includes
- relevant files or modules
- important symbols
- entry points or integration boundaries
- likely impact radius
- known unknowns or hotspots

## Adaptive Rule
- Small task → minimal file list + one flow
- Medium task → symbols + impact
- Large task → layered packet with boundaries and risk areas

## Guardrail
Do not dump the whole graph into context. Synthesize for the task at hand.
