# Integration Workflows

> Load this only when `cm-codeintell` is being wired into another skill flow.

## `cm-start`
- Run Layer 0 early for baseline project orientation
- Add deeper layers only when project size or task complexity justifies it

## `cm-planning`
- Use Layer 0 or Layer 1 to map boundaries and likely impacted files
- Use Layer 2 when architecture communication matters
- Use Layer 3 for a planning-ready context packet

## `cm-debugging`
- Use Layer 1 for caller/callee tracing and impact
- Use Layer 3 when the bug spans multiple modules or runtime paths

## `cm-execution`
- Use Layer 1 or Layer 3 as pre-flight context
- Keep execution prompts focused on touched files and interfaces

## Rule
`cm-codeintell` is infrastructure, not a destination. Use it to reduce downstream search cost and ambiguity.
