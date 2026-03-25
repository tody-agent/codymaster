# Frappe App Upgrade & Migration Patterns

## Adding New DocTypes to Existing App

1. Create DocType JSON via Frappe UI
2. Write controller (`.py`) following existing patterns
3. Add doc_events in `hooks.py` if needed
4. Add to fixtures list if it has workflow
5. Update `setup/install.py` if new roles/states needed
6. `bench --site mysite migrate && bench build --app my_app`

## Adding Fields to Existing DocType

```bash
# 1. Modify DocType JSON (via UI or directly)
# 2. Run migration
bench --site mysite migrate

# 3. If adding Custom Fields to core DocTypes (Employee, etc.)
# Add to setup/install.py → _create_custom_fields()
# Add to hooks.py → fixtures → Custom Field filter
```

## Upgrading Engine Logic

1. Modify pure-logic functions in `engines/`
2. Update tests to cover new behavior
3. Run `python -m pytest my_app/tests/ -v`
4. No migration needed — pure Python changes

## Adding New API Endpoint

```python
# 1. Add function in api/my_module.py
@frappe.whitelist()
def new_endpoint(param1, param2):
    if not frappe.has_permission("My DocType", "read"):
        frappe.throw(_("Permission denied"), frappe.PermissionError)
    return engine.process(param1, param2)
```

No hooks.py changes needed — Frappe auto-discovers whitelisted methods.

## Adding New Scheduler Task

```python
# 1. Add function in tasks/daily.py (or new file)
def my_new_task():
    # ... logic
    frappe.db.commit()

# 2. Register in hooks.py
scheduler_events = {
    "daily": [
        "my_app.tasks.daily.my_new_task",  # Add here
    ],
}
```

## Changing Workflow States

⚠️ **CONFIRM before doing this — affects existing records!**

1. Update Workflow JSON
2. Add new states to `setup/install.py` → `_create_workflow_states()`
3. Add new states to `hooks.py` → fixtures → Workflow State filter
4. `bench --site mysite migrate`
5. Check existing records are not in broken state

## Adding New Reports

```bash
# 1. Create report folder
mkdir -p my_app/my_app/report/new_report/
touch my_app/my_app/report/new_report/__init__.py

# 2. Create report files
# new_report.py — execute(), get_columns(), get_data(), get_chart()
# new_report.js — filters definition
# new_report.json — report metadata

# 3. Build
bench build --app my_app
```

## Data Migration Script

```python
"""
scripts/migrate_data.py
Run: bench --site mysite execute my_app.scripts.migrate_data.run

⚠️ ALWAYS backup before running migration scripts!
"""
import frappe

def run():
    frappe.logger("my_app").info("Starting data migration...")
    
    # Process in batches of 100
    records = frappe.get_all("Old DocType", fields=["*"], limit=100)
    for rec in records:
        try:
            frappe.get_doc({
                "doctype": "New DocType",
                "field1": rec.old_field,
            }).insert(ignore_permissions=True)
        except Exception as exc:
            frappe.log_error(str(exc), "Migration error")
    
    frappe.db.commit()
    frappe.logger("my_app").info("Migration complete")
```
