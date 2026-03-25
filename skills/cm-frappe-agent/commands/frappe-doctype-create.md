---
description: Create a new Frappe DocType with complete scaffolding including JSON definition, Python controller, JavaScript client script, and tests
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, TodoWrite
argument-hint: <doctype_name> [module_name] [--child] [--single] [--submittable]
---

# Create Frappe DocType

You are creating a new DocType in a Frappe application. Follow this systematic process to create a complete, working DocType with all necessary files.

## Arguments

Parse the user's input: $ARGUMENTS

- **doctype_name**: Name of the DocType (e.g., "Project Task", "Customer Feedback")
- **module_name**: (Optional) Module to create DocType in
- **--child**: Create as child table (istable=1)
- **--single**: Create as Single DocType (issingle=1)
- **--submittable**: Create as submittable document (is_submittable=1)

## Process

### Step 1: Discover Project Structure

1. Find the Frappe app in the current directory:
   ```bash
   find . -name "hooks.py" -path "*/apps/*" | head -5
   ```

2. Read hooks.py to understand the app structure:
   ```bash
   cat <app_path>/hooks.py
   ```

3. Check modules.txt for available modules:
   ```bash
   cat <app_path>/modules.txt
   ```

4. If module not specified, ask user which module to use

### Step 2: Create Directory Structure

Convert DocType name to directory name:
- "Project Task" → "project_task"
- Use snake_case

Create the DocType directory:
```bash
mkdir -p <app>/<module>/doctype/<doctype_dir>
touch <app>/<module>/doctype/<doctype_dir>/__init__.py
```

### Step 3: Ask About Fields

Ask the user about the fields they want to add. Provide suggestions based on DocType name:

- For "Invoice": items table, customer, amounts, dates
- For "Task": title, description, status, assigned_to, dates
- For "Settings": configuration fields, checkboxes
- For child tables: item reference, qty, rate, amount

Common field patterns to suggest:
1. **Status field**: Draft → Active → Completed
2. **Date range**: start_date, end_date
3. **Amount fields**: qty, rate, amount, total
4. **References**: customer, supplier, user links

### Step 4: Create DocType JSON

Create the JSON file with:

```json
{
  "name": "<DocType Name>",
  "module": "<Module Name>",
  "doctype": "DocType",
  "engine": "InnoDB",
  "field_order": [],
  "fields": [
    // Fields based on user requirements
  ],
  "permissions": [
    {
      "role": "System Manager",
      "read": 1,
      "write": 1,
      "create": 1,
      "delete": 1
    }
  ],
  "autoname": "naming_series:",
  "naming_rule": "By \"Naming Series\" field",
  "is_submittable": 0,
  "istable": 0,
  "issingle": 0,
  "track_changes": 1,
  "sort_field": "modified",
  "sort_order": "DESC"
}
```

### Step 5: Create Python Controller

```python
# <doctype>.py
import frappe
from frappe import _
from frappe.model.document import Document


class <ClassName>(Document):
    def validate(self):
        pass

    def before_save(self):
        pass

    def after_insert(self):
        pass

    def on_update(self):
        pass
```

Add relevant hooks based on DocType type:
- For submittable: on_submit, on_cancel
- For documents with calculations: validate with totals
- For documents with dates: date validation

### Step 6: Create JavaScript Client Script

```javascript
// <doctype>.js
frappe.ui.form.on('<DocType Name>', {
    refresh: function(frm) {
        // Custom buttons and field toggles
    },

    validate: function(frm) {
        // Client-side validation
    }
});
```

Add field handlers for:
- Link fields that need to fetch data
- Numeric fields that need calculations
- Conditional field visibility

### Step 7: Create Test File

```python
# test_<doctype>.py
import frappe
from frappe.tests.utils import FrappeTestCase


class Test<ClassName>(FrappeTestCase):
    def test_create_document(self):
        doc = frappe.get_doc({
            "doctype": "<DocType Name>",
            # Required fields
        })
        doc.insert()
        self.assertTrue(doc.name)

    def test_validate(self):
        # Test validation logic
        pass
```

### Step 8: Update Module Files

If this is a new module, update:
- modules.txt (add module name)
- Create module directory structure

### Step 9: Migrate

Remind user to run migration:
```bash
bench --site <sitename> migrate
```

## File Locations

```
<app_name>/
└── <module_name>/
    └── doctype/
        └── <doctype_name>/
            ├── __init__.py
            ├── <doctype_name>.json      # DocType definition
            ├── <doctype_name>.py        # Python controller
            ├── <doctype_name>.js        # Client script
            └── test_<doctype_name>.py   # Tests
```

## Field Type Quick Reference

| Data | Field Type | Notes |
|------|------------|-------|
| Text (short) | Data | Max 140 chars |
| Text (long) | Text | Unlimited |
| Number | Int/Float | Use Float for decimals |
| Money | Currency | Company currency aware |
| Date | Date/Datetime | |
| Yes/No | Check | Checkbox |
| Dropdown | Select | Options separated by \n |
| Reference | Link | options = DocType name |
| Child items | Table | options = Child DocType |
| File | Attach | Single file |
| Image | Attach Image | With preview |

## Common Patterns

### Naming Series Field
```json
{
  "fieldname": "naming_series",
  "fieldtype": "Select",
  "label": "Series",
  "options": "NEW-.YYYY.-.####",
  "default": "NEW-.YYYY.-.####",
  "reqd": 1
}
```

### Status Field
```json
{
  "fieldname": "status",
  "fieldtype": "Select",
  "label": "Status",
  "options": "\nDraft\nOpen\nClosed\nCancelled",
  "default": "Draft",
  "in_list_view": 1,
  "in_standard_filter": 1
}
```

### Amount Calculation (in child table)
```json
[
  {"fieldname": "item", "fieldtype": "Link", "options": "Item", "in_list_view": 1},
  {"fieldname": "qty", "fieldtype": "Float", "in_list_view": 1},
  {"fieldname": "rate", "fieldtype": "Currency", "in_list_view": 1},
  {"fieldname": "amount", "fieldtype": "Currency", "in_list_view": 1, "read_only": 1}
]
```

## Output

After completion, provide:

1. Summary of files created
2. List of fields added
3. Next steps:
   - Run `bench --site <site> migrate`
   - Customize form layout in Desk
   - Add more fields as needed
   - Write controller logic
   - Create tests

## Important Notes

- Use the doctype-architect agent for complex data modeling
- Use the frappe-backend agent for controller logic
- Use the frappe-frontend agent for client scripts
- Always follow Frappe naming conventions
- Test the migration before proceeding
