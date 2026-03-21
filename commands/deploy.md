---
description: Deploy safely with multi-gate pipeline — test → build → stage → verify → production
argument-hint: "[staging|production]"
---

# /deploy — Safe Deployment Pipeline

Multi-gate deploy: run tests → verify build → deploy to staging → verify → optionally promote to production.

## Invocation

```
/deploy staging
/deploy production
```

## Workflow

### Step 1: Pre-Flight Checks

Apply **cm-test-gate** skill:
- Run `npm run test:gate`
- Verify all tests pass
- Check build output

### Step 2: Identity Guard

Apply **cm-identity-guard** skill:
- Verify git config matches `.project-identity.json`
- Confirm Cloudflare account is correct
- Prevent wrong-account deploys

### Step 3: Deploy

Apply **cm-safe-deploy** skill:
- Deploy to staging first (always)
- Verify staging deployment
- Only promote to production if explicitly requested
- Rollback strategy ready

### Step 4: Post-Deploy

- Run smoke tests on deployed URL
- Verify critical paths work
- Update CONTINUITY.md with deploy status

## Notes

- Production deploys always require explicit user confirmation
- Staging is mandatory — no direct-to-production
- Use `cm-secret-shield` scan before any deploy
