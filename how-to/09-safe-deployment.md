# Safe Deployment Pipeline

> Multi-gate deploy pipeline with rollback strategy. This guide teaches you how to deploy safely with CodyMaster's 8-gate system.

## Table of Contents

1. [Overview](#overview)
2. [The 8 Gates](#the-8-gates)
3. [Pre-Deployment](#pre-deployment)
4. [Running the Pipeline](#running-the-pipeline)
5. [Post-Deployment](#post-deployment)
6. [Rollback Strategy](#rollback-strategy)
7. [Monitoring](#monitoring)

---

## Overview

### Why Safe Deployment?

- **Prevent incidents** — Catch issues before they reach production
- **Automate quality** — Consistent checks every deploy
- **Rollback quickly** — Recover from issues fast
- **Track deployments** — Know what changed and when

### The 8 Gates

```
Secret → Syntax → Test → Build → Lint → TypeCheck → Security → Deploy
```

Each gate must pass before proceeding. Any failure = STOP.

---

## The 8 Gates

### Gate 1: Secret Scanning

```bash
# Check for secrets
npm run gate:secrets

# What it checks:
# - API keys
# - Passwords
# - Tokens
# - Private keys
# - Connection strings
```

### Gate 2: Syntax Check

```bash
# Check syntax
npm run gate:syntax

# What it checks:
# - JavaScript/TypeScript syntax
# - JSON syntax
# - YAML syntax
# - CSS syntax
```

### Gate 3: Test Suite

```bash
# Run tests
npm run gate:tests

# What it checks:
# - Unit tests pass
# - Integration tests pass
# - Coverage threshold met
```

### Gate 4: Build

```bash
# Build the project
npm run gate:build

# What it checks:
# - TypeScript compiles
# - No build errors
# - Output generated
```

### Gate 5: Linting

```bash
# Run linter
npm run gate:lint

# What it checks:
# - Code style
# - Unused imports
# - Complexity rules
# - Best practices
```

### Gate 6: Type Check

```bash
# Type checking
npm run gate:typecheck

# What it checks:
# - TypeScript types
# - No type errors
# - Strict mode compliance
```

### Gate 7: Security Scan

```bash
# Security scan
npm run gate:security

# What it checks:
# - Vulnerable dependencies
# - Security patterns
# - OWASP top 10
```

### Gate 8: Deployment

```bash
# Deploy
npm run deploy

# What it does:
# - Build production bundle
# - Upload to hosting
# - Configure CDN
# - Verify deployment
```

---

## Pre-Deployment

### Step 1: Verify All Gates

```bash
# Run all gates locally
npm run test:gate

# Should pass all 8 gates
```

### Step 2: Check Git Status

```bash
# Ensure clean working directory
git status

# Should show:
# On branch main
# nothing to commit, working tree clean
```

### Step 3: Verify Branch

```bash
# Ensure on correct branch
git branch

# Should be on:
# * main
```

### Step 4: Pull Latest

```bash
# Get latest changes
git pull origin main
```

### Step 5: Check CI Status

```bash
# Check CI/CD status
gh api repos/{owner}/{repo}/actions/runs --jq '.workflow_runs[0].status'

# Should show:
# "completed"
```

---

## Running the Pipeline

### Option 1: Use cm-safe-deploy (Recommended)

```bash
# Run the full pipeline
/cm-safe-deploy

# This will:
# 1. Run all 8 gates
# 2. Build production bundle
# 3. Deploy to hosting
# 4. Verify deployment
# 5. Notify on success/failure
```

### Option 2: Manual Pipeline

```bash
# Gate 1: Secrets
npm run gate:secrets
if [ $? -ne 0 ]; then echo "Gate 1 FAILED"; exit 1; fi

# Gate 2: Syntax
npm run gate:syntax
if [ $? -ne 0 ]; then echo "Gate 2 FAILED"; exit 1; fi

# Gate 3: Tests
npm run gate:tests
if [ $? -ne 0 ]; then echo "Gate 3 FAILED"; exit 1; fi

# Gate 4: Build
npm run gate:build
if [ $? -ne 0 ]; then echo "Gate 4 FAILED"; exit 1; fi

# Gate 5: Lint
npm run gate:lint
if [ $? -ne 0 ]; then echo "Gate 5 FAILED"; exit 1; fi

# Gate 6: TypeCheck
npm run gate:typecheck
if [ $? -ne 0 ]; then echo "Gate 6 FAILED"; exit 1; fi

# Gate 7: Security
npm run gate:security
if [ $? -ne 0 ]; then echo "Gate 7 FAILED"; exit 1; fi

# Gate 8: Deploy
npm run deploy
if [ $? -ne 0 ]; then echo "Gate 8 FAILED"; exit 1; fi

echo "✅ All gates passed! Deployment successful."
```

### Option 3: CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      
      # Gate 1: Secrets
      - name: Gate 1 - Secret Scanning
        run: npm run gate:secrets
      
      # Gate 2: Syntax
      - name: Gate 2 - Syntax Check
        run: npm run gate:syntax
      
      # Gate 3: Tests
      - name: Gate 3 - Test Suite
        run: npm run gate:tests
      
      # Gate 4: Build
      - name: Gate 4 - Build
        run: npm run gate:build
      
      # Gate 5: Lint
      - name: Gate 5 - Linting
        run: npm run gate:lint
      
      # Gate 6: TypeCheck
      - name: Gate 6 - Type Check
        run: npm run gate:typecheck
      
      # Gate 7: Security
      - name: Gate 7 - Security Scan
        run: npm run gate:security
      
      # Gate 8: Deploy
      - name: Gate 8 - Deploy
        if: success()
        run: npm run deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

---

## Post-Deployment

### Step 1: Verify Deployment

```bash
# Check deployment status
cm deploy status

# Open in browser
cm deploy open

# Test the application
# - All features work
# - No errors in console
# - Performance acceptable
```

### Step 2: Monitor Logs

```bash
# Check for errors
cm logs --tail 100

# Should show:
# No errors
# All services healthy
```

### Step 3: Check Metrics

```bash
# Check performance
cm status

# Should show:
# Response time: < 200ms
# Error rate: < 0.1%
# Uptime: 99.9%
```

### Step 4: Update Documentation

```bash
# Update changelog
cat >> CHANGELOG.md << 'EOF'
## [1.2.0] - 2024-01-15

### Added
- User authentication feature
- Login form component
- Protected routes middleware

### Fixed
- Login timeout on slow connections
- Password validation for legacy hashes
EOF

# Commit documentation
git add CHANGELOG.md
git commit -m "docs: update changelog for v1.2.0"
```

### Step 5: Notify Team

```bash
# Send notification
gh pr comment [pr-number] --body "✅ Deployed to production: https://app.example.com"

# Or via Slack
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"✅ Deployed v1.2.0 to production"}' \
  $SLACK_WEBHOOK_URL
```

---

## Rollback Strategy

### When to Rollback

- **Critical bug** — Feature broken in production
- **Performance issue** — Response time degraded
- **Security vulnerability** — Security issue discovered
- **Data issue** — Data corruption or loss

### Option 1: Git Rollback

```bash
# Revert last commit
git revert HEAD

# Push to main
git push origin main

# CI/CD will auto-deploy previous version
```

### Option 2: Manual Rollback

```bash
# Deploy previous version
git checkout [previous-commit-hash]
npm run deploy

# Or use Cloudflare Pages rollback
cm deploy rollback
```

### Option 3: Feature Flag

```typescript
// Disable feature via feature flag
const FEATURES = {
  NEW_AUTH: process.env.FEATURE_NEW_AUTH === 'false' ? false : true
}

// In your code
if (FEATURES.NEW_AUTH) {
  // New auth logic
} else {
  // Old auth logic
}
```

### Option 4: Database Rollback

```bash
# If database changes were made
cm db rollback --to [migration-id]

# Verify
cm db status
```

### Rollback Checklist

```markdown
## Rollback Checklist

- [ ] Identify issue
- [ ] Decide rollback strategy
- [ ] Execute rollback
- [ ] Verify rollback
- [ ] Monitor for issues
- [ ] Document incident
- [ ] Schedule fix
```

---

## Monitoring

### Post-Deploy Monitoring

```bash
# Monitor for 15 minutes after deploy
cm monitor --duration 15m

# This will:
# - Watch error rates
# - Monitor response times
# - Check for anomalies
# - Alert on issues
```

### Setting Up Alerts

```bash
# Configure alerts
cm alerts configure \
  --error-rate 0.01 \
  --response-time 500 \
  --uptime 99.9

# Alerts will be sent to:
# - Slack
# - Email
# - PagerDuty (if configured)
```

### Monitoring Dashboard

```bash
# Open monitoring dashboard
cm monitor dashboard

# This shows:
# - Real-time metrics
# - Error logs
# - Performance graphs
# - Deployment history
```

---

## Example: Complete Deployment

### Step 1: Pre-Deployment

```bash
# Run all gates
npm run test:gate
# ✅ All gates passed

# Check git status
git status
# On branch main
# nothing to commit, working tree clean

# Pull latest
git pull origin main
```

### Step 2: Deploy

```bash
# Run safe deploy
/cm-safe-deploy

# Output:
# 🔒 Gate 1: Secret Scanning... ✅ PASSED
# 🔒 Gate 2: Syntax Check... ✅ PASSED
# 🔒 Gate 3: Test Suite... ✅ PASSED
# 🔒 Gate 4: Build... ✅ PASSED
# 🔒 Gate 5: Linting... ✅ PASSED
# 🔒 Gate 6: Type Check... ✅ PASSED
# 🔒 Gate 7: Security Scan... ✅ PASSED
# 🚀 Gate 8: Deploy... ✅ PASSED
# 
# ✅ All gates passed! Deployment successful.
# 🌐 URL: https://app.example.com
```

### Step 3: Post-Deployment

```bash
# Verify deployment
cm deploy open

# Check for errors
cm logs --tail 50
# No errors

# Monitor
cm monitor --duration 15m
# All metrics normal
```

### Step 4: Notify

```bash
# Notify team
gh pr comment [pr-number] --body "✅ Deployed to production"

# Update changelog
cat >> CHANGELOG.md << 'EOF'
## [1.2.0] - 2024-01-15

### Added
- User authentication feature
EOF

# Commit
git add CHANGELOG.md
git commit -m "docs: update changelog"
git push
```

---

## Next Steps

- [Security-Sensitive Work](./10-security-workflow.md) — Security deployment
- [Monitoring & Alerting](./monitoring.md) — Advanced monitoring
- [Incident Response](./incident-response.md) — Handle production issues
