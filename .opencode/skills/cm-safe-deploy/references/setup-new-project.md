# Setup — New Project Deploy Infrastructure

> Use this when a project does not yet have a reliable gated deploy path.

## Setup Sequence
1. Create test infrastructure
2. Add gate scripts to `package.json`
3. Add frontend safety tests where relevant
4. Create deploy workflow / script
5. Ensure secret handling and identity checks are in place

## Minimum Outcome
- `test:gate` exists
- syntax and build checks exist
- deploy command is scripted
- smoke verification path is defined
- rollback path is known

## Rule
Do not mix “setup the pipeline” with “run a live deploy” in one uncontrolled step.
