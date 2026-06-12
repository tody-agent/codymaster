# Gate 0.5 — Security Scan

> Run vulnerability and security scanners before progressing deeper into the pipeline.

## Use When
- production or public release prep
- repo risk or CVE concerns exist
- internal CodyMaster release flow requires security evidence

## Commands
```bash
snyk test

aikido-api-client scan-release <repo> $(git rev-parse HEAD) \
  --minimum-severity-level="HIGH"
```

## Strict Internal Variant
```bash
aikido-api-client scan-release <repo> $(git rev-parse HEAD) \
  --minimum-severity-level="HIGH" \
  --fail-on-sast-scan \
  --fail-on-secrets-scan
```

## Decision
- both pass → continue
- either fails → stop and remediate before Gate 1

## Rule
Treat security scan failure as a hard stop, not a warning.
