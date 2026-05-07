---
name: cm-post-deploy-canary
description: "Use after deployment to run smoke tests and post-deploy canary checks via the browse daemon."
---
# cm-post-deploy-canary — smoke + browse tail

## CLI

```bash
cm canary --url https://app.example.com
cm canary --url https://app.example.com --browse-port 17395 --token "$CM_BROWSE_TOKEN"
```

## Flow

1. **HTTP GET** the URL (status < 400).
2. Optionally pull **browse daemon** `/console` for recent browser errors after deploy.

## Next

- Wire into **cm-safe-deploy** as a final step.
- Add programmatic CWV (Lighthouse) when you need baselines per PR.
