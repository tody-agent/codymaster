# Layer 2 — Architecture Diagram

> Purpose: generate a visual map of modules, flows, and boundaries for humans and downstream agents.

## Use When
- You need a system overview, not symbol-level detail
- You are explaining architecture to another agent or human
- Planning or debugging benefits from a visual map

## Process
```
1. READ structure from skeleton and/or code graph
2. IDENTIFY major modules, entry points, and boundaries
3. DRAW Mermaid architecture diagram
4. STORE under .cm/ for reuse
```

## Typical Output
- module groups
- entry points
- major dependencies
- runtime or data-flow direction

## When to Generate
- project onboarding
- before large refactors
- when debugging cross-module failures
- when planning work that spans multiple systems

## Rule
Keep diagrams structural and readable. Avoid rendering every symbol; focus on modules and relationships.
