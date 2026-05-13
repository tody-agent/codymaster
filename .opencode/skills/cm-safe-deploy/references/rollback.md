# Rollback Protocol

> Use when a deploy fails or the deployed target is unhealthy.

## Trigger
- Gate 6 smoke test fails
- production issue detected immediately after release
- wrong artifact or config shipped

## Response
1. Stop forward rollout
2. Revert to last known good artifact or deployment target
3. Verify the rollback target with smoke checks
4. Capture incident details and root cause

## Rule
Rollback is part of the deploy system, not a last-minute improvisation.
