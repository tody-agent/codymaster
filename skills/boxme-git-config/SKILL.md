---
description: Verify and fix git configuration to ensure all pushes go to omisocial GitHub account
---

# Git Account Verification

Use this skill when: "check git", "verify git", "git account", "fix remote", "push fails", or before any deploy/push operation.

## Expected Configuration

| Setting | Expected Value |
|---------|---------------|
| `gh auth status` | `omisocial` |
| `git remote origin` | `https://github.com/omisocial/boxme_levelling.git` |
| `git config user.name` | `omisocial` |
| `git config user.email` | `omisocial@users.noreply.github.com` |

## Quick Check

Run this one-liner to verify everything:

```bash
echo "=== GitHub CLI ===" && gh auth status 2>&1 | head -3 && echo "=== Git Remote ===" && git remote get-url origin && echo "=== Git User ===" && git config user.name && git config user.email
```

## Fix if Wrong

### GitHub CLI (gh) logged into wrong account
```bash
gh auth logout
gh auth login
# Select: Login with web browser → omisocial
```

### Git remote pointing to wrong repo
```bash
git remote set-url origin https://github.com/omisocial/boxme_levelling.git
```

### Git user config wrong
```bash
git config user.name "omisocial"
git config user.email "omisocial@users.noreply.github.com"
```

## Project Root
```
/Users/todyle/Library/Mobile Documents/com~apple~CloudDocs/Code/Boxme_Projects/boxme_levelling-main
```

## Account History

| Account | Purpose | Status |
|---------|---------|--------|
| `omisocial` | Current active GitHub account | ✅ Active |
| `boxmevibe` | Previous GitHub account | ⚠️ Archived as `old-boxmevibe` remote |
