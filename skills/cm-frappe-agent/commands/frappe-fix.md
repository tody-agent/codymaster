---
description: Fix Frappe/ERPNext bugs with a structured loop - reproduce, diagnose, fix, verify, document. Unlike debug (analysis-only), this actually applies fixes.
allowed-tools: Bash, Read, Write, Edit, Grep, Glob
argument-hint: <error_description_or_issue>
---

# Fix Frappe Bug

Apply a structured bug fix following the mandatory loop: reproduce → diagnose → fix → verify → document.

## Arguments

Parse the user's input: $ARGUMENTS

## Process

### Step 1: Invoke Fixer Agent

Delegate to `frappe-fixer` agent with the issue details.

**Agent Prompt:**
```
You are fixing a Frappe/ERPNext bug.

## Issue
{user's error or issue description}

## Context
- Working directory: {current directory}
- Follow the mandatory FIX LOOP: reproduce → diagnose → hypothesize → fix → verify → document

## Requirements
1. REPRODUCE the bug first — confirm it exists
2. DIAGNOSE the root cause — not just symptoms
3. HYPOTHESIZE the minimal fix
4. APPLY the fix
5. VERIFY it works and no regressions
6. DOCUMENT what was fixed and why
```

### Step 2: Verify Fix

After the fixer agent completes:
```bash
# Run tests
bench --site <site> run-tests --app <app> --failfast

# Clear cache
bench --site <site> clear-cache

# Check logs
tail -20 logs/frappe.log | grep -i error
```

### Integration

- If analysis is needed first → use `frappe-debug` command (delegates to debugger)
- If fix requires schema changes → the fixer will coordinate with `doctype-architect`
- If fix is on a remote site → the fixer will coordinate with `frappe-remote-ops`
