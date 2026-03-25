---
description: Invoke the Frappe debugger agent for troubleshooting errors, analyzing logs, debugging permissions, and investigating performance issues
allowed-tools: Bash, Read, Grep, Glob, Task
argument-hint: <error_or_issue_description>
---

# Frappe Debug & Troubleshoot

You are invoking the specialized Frappe debugger agent for investigating and resolving issues.

## Request

$ARGUMENTS

## Agent Invocation

Use the Task tool to spawn the `frappe-fullstack:frappe-debugger` agent with the following configuration:

**IMPORTANT:** The agent name MUST be fully qualified: `frappe-fullstack:frappe-debugger`

### Agent Prompt Template

```
You are debugging a Frappe/ERPNext issue.

## Issue
{user's error or issue description}

## Context
- Working directory: {current directory}
- Check logs, database, permissions, cache

## Your Responsibilities

1. **Gather Information**
   - Check error logs
   - Identify the error type
   - Find relevant stack traces
   - Check recent changes

2. **Analyze the Problem**
   - Determine root cause
   - Check for common issues
   - Verify configuration
   - Test hypotheses

3. **Provide Solution**
   - Step-by-step fix
   - Commands to run
   - Code changes if needed
   - Prevention tips

## Output Requirements
- Clear diagnosis of the issue
- Root cause explanation
- Solution steps
- Verification commands
```

## Capabilities

The frappe-debugger agent excels at:

### Log Analysis
```bash
# Check error logs
tail -100 logs/frappe.log | grep -i error

# Check web errors
tail -50 logs/web.error.log

# Check worker errors
tail -50 logs/worker.error.log

# Site-specific logs
tail -100 sites/<site>/logs/frappe.log
```

### Error Types

| Error | Common Causes |
|-------|---------------|
| `ValidationError` | Failed validation in controller |
| `PermissionError` | Missing role or user permission |
| `LinkValidationError` | Referenced document doesn't exist |
| `MandatoryError` | Required field is empty |
| `DuplicateEntryError` | Unique constraint violation |
| `TimestampMismatchError` | Concurrent edit conflict |

### Permission Debugging
```python
# In bench console
frappe.session.user
frappe.get_roles()
frappe.has_permission("DocType", "write", "doc_name")
```

### Database Issues
```sql
-- Check for orphaned records
SELECT * FROM `tabChild`
WHERE parent NOT IN (SELECT name FROM `tabParent`);

-- Check table sizes
SELECT table_name, ROUND(data_length/1024/1024, 2) as MB
FROM information_schema.tables
WHERE table_schema = DATABASE()
ORDER BY data_length DESC;
```

### Cache Issues
```bash
# Clear all cache
bench --site <site> clear-cache

# Clear Redis
redis-cli FLUSHALL

# Clear specific
frappe.cache().delete_value("key")
```

### Background Job Issues
```bash
# Check pending jobs
bench --site <site> show-pending-jobs

# Check scheduler
bench --site <site> show-scheduler-status

# View failed jobs
bench --site <site> console
>>> from rq import Queue
>>> from frappe.utils.background_jobs import get_redis_conn
>>> q = Queue("failed", connection=get_redis_conn())
>>> for job in q.jobs: print(job.exc_info)
```

## Common Issues & Solutions

### 1. "Document not found"
```bash
# Check if document exists
bench --site <site> console
>>> frappe.db.exists("DocType", "name")
```

### 2. "Permission denied"
```bash
# Check user roles and permissions
bench --site <site> console
>>> frappe.get_roles("user@email.com")
>>> frappe.get_all("DocPerm", filters={"parent": "DocType"})
```

### 3. "Module not found"
```bash
# Reinstall apps
pip install -e apps/frappe
pip install -e apps/my_app
```

### 4. "Migration failed"
```bash
# Check what's failing
bench --site <site> migrate --skip-failing

# Check patches
cat apps/my_app/my_app/patches.txt
```

### 5. "Assets not loading"
```bash
# Rebuild assets
bench build --force

# Check for JS errors in browser console
# Hard refresh: Ctrl+Shift+R
```

### 6. "Slow performance"
```bash
# Enable slow query log
# In site_config.json: "log_slow_queries": 1

# Check slow queries
grep "slow_query" logs/frappe.log
```

### 7. "Background job stuck"
```bash
# Check workers
ps aux | grep worker

# Restart workers
sudo supervisorctl restart frappe-bench-workers:*
```

### 8. "Redis connection refused"
```bash
# Check Redis
redis-cli ping

# Restart Redis
sudo systemctl restart redis
```

## Diagnostic Commands

```bash
# Site health check
bench --site <site> doctor

# Show database size
bench --site <site> mariadb -e "
SELECT table_name,
       ROUND(data_length/1024/1024, 2) as data_mb
FROM information_schema.tables
WHERE table_schema = DATABASE()
ORDER BY data_length DESC
LIMIT 10"

# Check scheduler status
bench --site <site> show-scheduler-status

# List installed apps
bench --site <site> list-apps

# Check versions
bench version
```

## Debug Checklist

1. [ ] Check logs: `tail -100 logs/frappe.log`
2. [ ] Identify error type from traceback
3. [ ] Check permissions if PermissionError
4. [ ] Check document exists if LinkValidationError
5. [ ] Clear cache: `bench --site <site> clear-cache`
6. [ ] Check Redis is running
7. [ ] Check background workers if job-related
8. [ ] Verify recent code changes with git log
9. [ ] Test in bench console
10. [ ] Check browser console for JS errors

## Tools Available to Agent

- **Bash**: Run diagnostic commands, check logs
- **Read**: Read log files, config files
- **Grep**: Search logs and code for errors
- **Glob**: Find relevant files

**Note**: Debug agent has read-only focus to investigate without making changes. Solutions are provided for user to implement.

## Output Format

The debugger will provide:

1. **Diagnosis**: What's wrong and why
2. **Root Cause**: The underlying issue
3. **Solution**: Step-by-step fix
4. **Verification**: How to confirm it's fixed
5. **Prevention**: How to avoid in future
