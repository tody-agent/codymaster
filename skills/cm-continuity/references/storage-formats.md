# Storage Formats

> Use only when editing persistence, migration, or compat logic.

## Primary Stores
- `.cm/CONTINUITY.md`
- `.cm/context-bus.json`
- `.cm/context.db`
- fallback / compat JSON files for learnings and decisions
- L0 indexes such as `.cm/learnings-index.md` and `.cm/skeleton-index.md`

## Stored Concepts
- learnings
- decisions
- skill outputs
- cached indexes
- continuity scratch state

## Rule
Default to supported runtime storage behavior. Treat older formats as compatibility, not the primary model.
