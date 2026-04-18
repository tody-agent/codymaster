# Design: Productize the OpenSpace-Inspired Advisory Loop

## Context

The repo already ships:

- `src/execution-analyzer.ts`
- `execution_analyses` and `skill_metrics` in SQLite
- `qualityWeight()`
- `selectTopSkills()`
- `cm-skill-health` and `cm-skill-evolution`

The next design step is not a new engine from zero. It is to connect these parts into a complete operator-facing loop.

## Scope

### 1. Analyzer Visibility

Add a thin reporting layer over the existing analyzer data:

- recent execution analyses
- per-skill metrics
- latest recommendation (`FIX`, `DERIVED`, `CAPTURED`)
- confidence and target skills

Likely implementation points:

- `src/cli/commands/engineering.ts` or a dedicated skill-health/evolution command file
- small query helpers in [src/context-db.ts](/Volumes/Data/Skills/codymaster/Cody_Master/src/context-db.ts) if needed

### 2. Quality-Weighted Routing

Extend [src/skill-chain.ts](/Volumes/Data/Skills/codymaster/Cody_Master/src/skill-chain.ts) so scoring can incorporate:

- text relevance
- mandatory-step bonus
- quality weight from skill metrics

Constraints:

- mandatory non-optional steps still always win
- low-signal or unseen skills must degrade gracefully, not disappear
- routing changes must stay explainable in logs

### 3. Analyzer-to-Evolution Handoff

Connect analyzer outputs to the self-healing skills:

- `cm-skill-health` reads evidence from metrics and analyses
- `cm-skill-evolution` consumes a structured advisory note

This can stay skill/procedure-driven in phase 1, but the data path should be explicit and repeatable.

## Non-goals

- No autonomous mutation loop
- No new external execution container
- No second persistence layer
- No replacement of Smart Spine primitives

## Verification

- [test/execution-analyzer.test.ts](/Volumes/Data/Skills/codymaster/Cody_Master/test/execution-analyzer.test.ts) continues to pass
- new tests cover quality-weighted routing behavior
- new tests cover reading analyzer reports from SQLite
- repo gate stays green with `npm run test:gate:kit`
