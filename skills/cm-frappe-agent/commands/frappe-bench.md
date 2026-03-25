---
description: Execute Frappe Bench CLI commands safely with site awareness and common operation shortcuts
allowed-tools: Bash, Read, Grep, Glob
argument-hint: <command> [--site <sitename>]
---

# Execute Bench Command

Safely execute Frappe Bench CLI commands with proper site context and validation.

## Arguments

Parse the user's input: $ARGUMENTS

Common commands:
- `migrate` - Run database migrations
- `build` - Build JavaScript/CSS assets
- `clear-cache` - Clear Redis cache
- `console` - Open Python console
- `start` - Start development server
- `update` - Update apps and migrate
- `backup` - Backup site
- `restore` - Restore from backup

## Process

### Step 1: Detect Bench Directory

Find the frappe-bench directory:
```bash
# Check if we're in a bench directory
if [ -f "sites/apps.txt" ]; then
    echo "Bench directory found: $(pwd)"
else
    # Try to find bench directory
    find ~ -name "frappe-bench" -type d 2>/dev/null | head -3
fi
```

### Step 2: Identify Available Sites

```bash
# List available sites
ls sites/ | grep -v "apps.txt\|common_site_config.json\|assets"
```

### Step 3: Determine Current Site

```bash
# Check default site
cat sites/currentsite.txt 2>/dev/null || echo "No default site set"
```

### Step 4: Execute Command

Based on the requested operation:

#### Migrate
```bash
bench --site <sitename> migrate
```

**Safety checks:**
- Warn about uncommitted changes in apps
- Suggest backup before migrate
- Check for pending patches

#### Build
```bash
# Build all apps
bench build

# Build specific app
bench build --app <app_name>

# Build with verbose output
bench build --verbose

# Production build
bench build --production
```

#### Clear Cache
```bash
bench --site <sitename> clear-cache
```

#### Console
```bash
bench --site <sitename> console

# Example usage in console:
# >>> doc = frappe.get_doc("Customer", "CUST-001")
# >>> frappe.db.sql("SELECT * FROM tabCustomer LIMIT 5", as_dict=True)
```

#### Start Development Server
```bash
bench start
```

**Note:** This will occupy the terminal. Use Ctrl+C to stop.

#### Update
```bash
# Full update
bench update

# Update without backup
bench update --no-backup

# Update specific apps
bench update --apps frappe,erpnext

# Update without migrations
bench update --no-migrations
```

**Safety checks:**
- Warn about production sites
- Suggest backup first
- Check for uncommitted changes

#### Backup
```bash
# Basic backup
bench --site <sitename> backup

# With files
bench --site <sitename> backup --with-files
```

Output location: `sites/<sitename>/private/backups/`

#### Restore
```bash
bench --site <sitename> restore <path_to_backup.sql.gz>

# With files
bench --site <sitename> restore <backup.sql.gz> \
    --with-private-files <private.tar> \
    --with-public-files <public.tar>
```

**Safety checks:**
- Confirm before restore
- Warn about data loss

#### Other Common Commands

```bash
# Set admin password
bench --site <sitename> set-admin-password <newpassword>

# Add system manager
bench --site <sitename> add-system-manager <email>

# Enable/disable scheduler
bench --site <sitename> enable-scheduler
bench --site <sitename> disable-scheduler

# Show pending jobs
bench --site <sitename> show-pending-jobs

# Doctor - check site health
bench --site <sitename> doctor

# MariaDB console
bench --site <sitename> mariadb

# Export fixtures
bench --site <sitename> export-fixtures

# Run tests
bench --site <sitename> run-tests --app <app_name>
```

## Safety Guidelines

### Destructive Commands (Require Confirmation)
- `drop-site` - Deletes entire site
- `reinstall` - Drops and recreates database
- `restore` - Overwrites current data
- `reset` - Resets to fresh install

### Production Warnings
Before running on production:
1. Confirm site is in maintenance mode
2. Ensure backup exists
3. Check for active users

### Command Validation

For any command, check:
1. Is the site name valid?
2. Is the command recognized by bench?
3. Are there any pending migrations?

## Error Handling

Common issues:

### "Site not found"
```bash
# Check available sites
ls sites/
```

### "Module not found"
```bash
# Rebuild environment
bench setup env
pip install -e apps/frappe -e apps/erpnext
```

### "Migration failed"
```bash
# Check error logs
tail -100 logs/frappe.log

# Skip failing patches
bench --site <sitename> migrate --skip-failing
```

### "Build failed"
```bash
# Clear node modules and rebuild
rm -rf node_modules
yarn install
bench build
```

## Output

After command execution:
1. Show command output
2. Report success/failure
3. Suggest next steps if applicable
4. Warn about any issues detected

## Quick Reference

| Task | Command |
|------|---------|
| Start dev server | `bench start` |
| Migrate database | `bench --site <site> migrate` |
| Clear cache | `bench --site <site> clear-cache` |
| Build assets | `bench build` |
| Backup site | `bench --site <site> backup` |
| View logs | `tail -f logs/frappe.log` |
| Python console | `bench --site <site> console` |
| MySQL console | `bench --site <site> mariadb` |
| Run tests | `bench --site <site> run-tests` |
| Check health | `bench --site <site> doctor` |
