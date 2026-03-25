---
description: Manage Git workflows - create branches, commit changes, push, and create PRs following team conventions
---

# GitHub Workflow Command

You are helping the user with Git and GitHub operations for their Frappe/ERPNext project.

## Task: $ARGUMENTS

Use the `frappe-fullstack:github-workflow` agent to handle this request.

**IMPORTANT:** The agent name MUST be fully qualified: `frappe-fullstack:github-workflow`

The agent will:

1. **For branch creation**: Ask for task ID and description, create branch from default branch
2. **For commits**: Stage changes and commit WITHOUT co-author or generated footers
3. **For PRs**: Create pull request with proper format

## Branch Naming Convention
Format: `{task-id}-{short-description}`
- Example: `123-payment-api`, `456-fix-validation`

## Commit Standards
- No co-authored-by lines
- No "Generated with Claude Code" footers
- Clear, descriptive messages

## Common Operations

**Create branch:**
```
/frappe-github create branch
```

**Commit changes:**
```
/frappe-github commit
```

**Push to remote:**
```
/frappe-github push
```

**Create PR:**
```
/frappe-github create pr
```

**Full workflow:**
```
/frappe-github I need to create a branch, commit my changes, and create a PR
```

Invoke the `frappe-fullstack:github-workflow` agent to handle the user's request. Ask for task ID and description if creating a branch. Follow all team conventions for commits and PRs.
