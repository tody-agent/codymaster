---
description: Invoke the ERPNext customizer agent for extending ERPNext with custom fields, hooks, fixtures, and module-specific customizations
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, Task, TodoWrite
argument-hint: <customization_description>
---

# ERPNext Customization

You are invoking the specialized ERPNext customizer agent for extending and customizing ERPNext.

## Request

$ARGUMENTS

## Agent Invocation

Use the Task tool to spawn the `frappe-fullstack:erpnext-customizer` agent with the following configuration:

**IMPORTANT:** The agent name MUST be fully qualified: `frappe-fullstack:erpnext-customizer`

### Agent Prompt Template

```
You are customizing ERPNext for specific business requirements.

## Task
{user's customization description}

## Context
- This is ERPNext customization (not core modification)
- All changes should be in a custom app
- Use hooks, custom fields, and fixtures

## Your Responsibilities

1. **Analyze the Customization**
   - Which ERPNext DocTypes are affected?
   - What custom fields are needed?
   - What hooks/events to intercept?
   - What workflows to implement?

2. **Explore Existing Patterns**
   - Check how ERPNext handles similar cases
   - Find extension points in ERPNext code
   - Identify reusable utilities

3. **Implement the Customization**
   - Create custom fields via fixtures
   - Add hooks in hooks.py
   - Write override functions
   - Set up workflows if needed

4. **Ensure Portability**
   - Export as fixtures
   - Document the customization
   - Handle ERPNext upgrades gracefully

## Output Requirements
- Custom field definitions (fixtures)
- hooks.py configuration
- Override functions
- Workflow definitions (if applicable)
- Installation/export commands
```

## Capabilities

The erpnext-customizer agent excels at:

### Custom Fields
```python
# In install.py
from frappe.custom.doctype.custom_field.custom_field import create_custom_fields

custom_fields = {
    "Sales Invoice": [
        {
            "fieldname": "custom_channel",
            "label": "Sales Channel",
            "fieldtype": "Link",
            "options": "Sales Channel",
            "insert_after": "customer"
        }
    ]
}
create_custom_fields(custom_fields)
```

### Document Hooks
```python
# hooks.py
doc_events = {
    "Sales Invoice": {
        "validate": "my_app.overrides.sales_invoice.validate",
        "on_submit": "my_app.overrides.sales_invoice.on_submit"
    }
}
```

### Override Class
```python
# hooks.py
override_doctype_class = {
    "Sales Invoice": "my_app.overrides.CustomSalesInvoice"
}
```

### Fixtures
```python
# hooks.py
fixtures = [
    {"dt": "Custom Field", "filters": [["module", "=", "My App"]]},
    {"dt": "Property Setter", "filters": [["module", "=", "My App"]]},
    {"dt": "Workflow", "filters": [["name", "=", "My Workflow"]]}
]
```

### Workflows
```python
workflow = {
    "doctype": "Workflow",
    "name": "Sales Order Approval",
    "document_type": "Sales Order",
    "is_active": 1,
    "states": [...],
    "transitions": [...]
}
```

## ERPNext Modules Reference

| Module | Key DocTypes |
|--------|-------------|
| Accounts | Sales Invoice, Purchase Invoice, Payment Entry, GL Entry |
| Stock | Stock Entry, Delivery Note, Purchase Receipt, Item |
| Selling | Quotation, Sales Order, Customer |
| Buying | Purchase Order, Supplier, RFQ |
| Manufacturing | BOM, Work Order, Job Card |
| HR | Employee, Salary Slip, Leave Application |
| CRM | Lead, Opportunity |
| Projects | Project, Task, Timesheet |
| Assets | Asset, Depreciation |

## Common Customizations

1. **"Add custom field to Sales Invoice for tracking"**
   → Custom field definition + fixture

2. **"Validate credit limit before Sales Order submission"**
   → Hook on before_submit

3. **"Auto-create Task when Opportunity is won"**
   → Hook on on_update with status check

4. **"Custom approval workflow for Purchase Orders"**
   → Workflow definition + custom fields for approvers

5. **"Add custom report for sales by channel"**
   → Script report with custom query

6. **"Modify print format to include custom fields"**
   → Custom print format template

## Tools Available to Agent

- **Glob**: Find ERPNext and custom app files
- **Grep**: Search ERPNext patterns
- **Read**: Read ERPNext source for extension points
- **Write**: Create override files
- **Edit**: Modify hooks.py, fixtures
- **Bash**: Export fixtures, run commands

## File Locations

```
my_app/
├── hooks.py                    # Hook configuration
├── fixtures/                   # Exported fixtures
│   ├── custom_field.json
│   └── property_setter.json
├── install.py                  # Post-install setup
└── my_module/
    └── overrides/
        ├── sales_invoice.py    # SI overrides
        └── sales_order.py      # SO overrides
```

## Post-Implementation

1. **Export Fixtures**
   ```bash
   bench --site <site> export-fixtures --app my_app
   ```

2. **Install/Reinstall App**
   ```bash
   bench --site <site> install-app my_app
   # or
   bench --site <site> migrate
   ```

3. **Clear Cache**
   ```bash
   bench --site <site> clear-cache
   ```

4. **Test Customization**
   - Verify custom fields appear
   - Test hook functions
   - Validate workflow transitions
