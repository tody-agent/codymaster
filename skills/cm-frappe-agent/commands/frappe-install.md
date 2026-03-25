---
description: Install and setup Frappe bench, create sites, install apps, and configure production environments
allowed-tools: Bash, Read, Write, Grep, Glob
argument-hint: <action> [--site <sitename>] [--app <appname>]
---

# Frappe Installation & Setup

Install bench, create sites, install apps, and setup production environments.

## Arguments

Parse the user's input: $ARGUMENTS

Common actions:
- `prerequisites` - Check/install system prerequisites
- `bench` - Initialize a new bench directory
- `site <name>` - Create a new site
- `app <name>` - Install an app on a site
- `production` - Setup production (nginx, supervisor)
- `docker` - Setup Docker development environment
- `check` - Verify current installation health

## Process

### Step 1: Detect Environment

```bash
# Check what's already installed
which bench 2>/dev/null && bench --version || echo "Bench not installed"
which python3 && python3 --version
which node && node --version
which mysql && mysql --version
redis-cli --version 2>/dev/null || echo "Redis not installed"
```

### Step 2: Execute Requested Action

Delegate to `frappe-installer` agent for complex operations.
See `resources/installation-guide.md` for detailed instructions.

### Step 3: Verify Installation

```bash
bench --site <site> doctor  # Health check
```

## Safety

- Always suggest backup before major changes
- Confirm before production setup
- Check for existing bench directories before init
