---
description: Invoke the Frappe backend agent for server-side Python development including controllers, APIs, database operations, and background jobs
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, Task, TodoWrite
argument-hint: <task_description>
---

# Frappe Backend Development

You are invoking the specialized Frappe backend agent for server-side Python development.

## Request

$ARGUMENTS

## Agent Invocation

Use the Task tool to spawn the `frappe-fullstack:frappe-backend` agent with the following configuration:

**IMPORTANT:** The agent name MUST be fully qualified: `frappe-fullstack:frappe-backend`

### Agent Prompt Template

```
You are working on a Frappe/ERPNext backend task.

## Task
{user's task description}

## Context
- Working directory: {current directory}
- Site: {detect from sites/currentsite.txt if available}

## Your Responsibilities

1. **Analyze the Request**
   - Understand what backend functionality is needed
   - Identify which DocTypes are involved
   - Determine if this is controller logic, API, or background job

2. **Explore the Codebase**
   - Find relevant existing code patterns
   - Check existing controllers for conventions
   - Identify utility functions that can be reused

3. **Implement the Solution**
   - Write clean, well-documented Python code
   - Follow Frappe coding conventions
   - Include proper error handling
   - Add validation where needed

4. **Provide Complete Code**
   - Controller methods with lifecycle hooks
   - Whitelisted APIs with proper decorators
   - Database queries using frappe.db API
   - Background jobs if long-running operations

## Output Requirements
- Provide complete, working code
- Include file paths for where code should go
- Explain any configuration needed (hooks.py, etc.)
- List commands to run (migrate, clear-cache, etc.)
```

## Capabilities

The frappe-backend agent excels at:

### Controller Development
- Document lifecycle hooks (validate, before_save, on_submit, etc.)
- Custom validation logic
- Calculated fields and totals
- Status management
- Related document operations

### Whitelisted APIs
```python
@frappe.whitelist()
def my_api_endpoint(param1, param2):
    # API logic
    return result
```

### Database Operations
```python
# Query
results = frappe.db.get_all("DocType", filters={}, fields=[])

# Update
frappe.db.set_value("DocType", "name", "field", "value")

# Raw SQL
frappe.db.sql("SELECT * FROM `tabDocType` WHERE condition")
```

### Background Jobs
```python
frappe.enqueue(
    "myapp.tasks.heavy_task",
    queue="long",
    timeout=600,
    **kwargs
)
```

### Scheduled Tasks (hooks.py)
```python
scheduler_events = {
    "daily": ["myapp.tasks.daily_task"],
    "hourly": ["myapp.tasks.hourly_task"]
}
```

## Common Tasks

1. **"Add validation to prevent negative quantities"**
   → Controller validate method

2. **"Create API to fetch customer dashboard data"**
   → Whitelisted method with aggregation queries

3. **"Send email notification when order is approved"**
   → on_update hook with email logic

4. **"Sync data from external API daily"**
   → Scheduled background job

5. **"Calculate running totals across child table"**
   → Controller validate with iteration

## Tools Available to Agent

- **Glob**: Find Python files and patterns
- **Grep**: Search for existing implementations
- **Read**: Read existing code for context
- **Write**: Create new files
- **Edit**: Modify existing code
- **Bash**: Run bench commands, check structure

## Post-Implementation

After the agent completes:

1. **Run Migration** (if DocType changed)
   ```bash
   bench --site <site> migrate
   ```

2. **Clear Cache**
   ```bash
   bench --site <site> clear-cache
   ```

3. **Test the Code**
   ```bash
   bench --site <site> console
   # Test your functions
   ```

4. **Run Tests**
   ```bash
   bench --site <site> run-tests --module <module>
   ```
