# Gate 6 — Deploy + Smoke Test

> Final stage: deploy the validated artifact, then prove the deployed target behaves.

## Steps
1. Deploy using the project’s approved command or workflow.
2. Confirm deploy success signal or URL.
3. Run smoke checks against the deployed target.
4. Stop immediately if smoke checks fail.

## Smoke Test Focus
- app loads
- key routes respond
- critical UI does not white-screen
- critical backend endpoint responds if relevant

## Rule
A green deploy command without a green smoke test is not a successful deployment.
