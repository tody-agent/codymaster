# DocType Registry

> Reference for discovering and exploring DocTypes on Frappe/ERPNext sites.

---

## How to Generate a Site-Specific Registry

### Via bench console
```python
bench --site <sitename> console

# List all DocTypes grouped by module
import json
from collections import defaultdict

doctypes = frappe.get_all("DocType", fields=["name", "module"], limit_page_length=0)
by_module = defaultdict(list)
for dt in doctypes:
    by_module[dt.module].append(dt.name)

for module in sorted(by_module.keys()):
    names = sorted(by_module[module])
    print(f"\n## {module} ({len(names)})")
    print(", ".join(names))
```

### Via REST API (remote sites)
```bash
curl -sS "https://{site}/api/method/frappe.client.get_list" \
  -H "Authorization: token {key}:{secret}" \
  -H "Content-Type: application/json" \
  -d '{"doctype":"DocType","fields":["name","module"],"limit_page_length":0}' \
  | jq '[.message[] | {name, module}] | group_by(.module) | map({module: .[0].module, count: length, doctypes: [.[].name]})'
```

---

## Core Frappe Modules (Standard)

These modules exist on every Frappe site:

| Module | Typical DocTypes | Purpose |
|--------|-----------------|---------|
| **Core** | DocType, User, Role, File, Report, Page | Framework foundation |
| **Custom** | Custom Field, Client Script, Property Setter | Customization layer |
| **Desk** | ToDo, Dashboard, Kanban Board, Workspace | User interface |
| **Email** | Email Account, Notification, Email Template | Email system |
| **Integrations** | Webhook, OAuth Client, Connected App | Third-party integrations |
| **Printing** | Print Format, Letter Head | Print templates |
| **Website** | Web Page, Web Form, Blog Post | Website/portal |
| **Workflow** | Workflow, Workflow State, Workflow Action | Document workflows |
| **Automation** | Assignment Rule, Auto Repeat | Automation rules |
| **Contacts** | Address, Contact | Contact management |
| **Geo** | Country, Currency | Geographic data |

---

## ERPNext Modules (if installed)

| Module | Key DocTypes | Purpose |
|--------|-------------|---------|
| **Accounts** | Sales Invoice, Purchase Invoice, Journal Entry, Payment Entry | Accounting |
| **Selling** | Customer, Sales Order, Quotation | Sales management |
| **Buying** | Supplier, Purchase Order, Request for Quotation | Procurement |
| **Stock** | Item, Warehouse, Stock Entry, Delivery Note | Inventory |
| **HR** | Employee, Leave Application, Attendance, Expense Claim | Human resources |
| **Payroll** | Salary Slip, Salary Structure, Payroll Entry | Payroll processing |
| **Manufacturing** | BOM, Work Order, Job Card | Manufacturing |
| **Projects** | Project, Task, Timesheet | Project management |
| **Assets** | Asset, Asset Movement, Depreciation Schedule | Fixed assets |
| **CRM** | Lead, Opportunity, Campaign | Customer relationship |
| **Support** | Issue, Service Level Agreement | Customer support |
| **Setup** | Company, Department, Designation, Employee | Organization setup |

---

## Quick DocType Discovery Commands

### Find DocTypes by keyword
```python
# In bench console
frappe.get_all("DocType",
    filters={"name": ["like", "%Invoice%"]},
    fields=["name", "module", "issingle"],
    limit_page_length=0
)
```

### Find custom app DocTypes
```python
frappe.get_all("DocType",
    filters={"module": "My Custom Module"},
    fields=["name", "issingle", "istable"],
    limit_page_length=0
)
```

### Check DocType metadata
```python
meta = frappe.get_meta("Sales Invoice")
print(f"Fields: {len(meta.fields)}")
print(f"Is Submittable: {meta.is_submittable}")
print(f"Is Child Table: {meta.istable}")
for df in meta.fields:
    print(f"  {df.fieldname} ({df.fieldtype})" + (" *" if df.reqd else ""))
```

### Find child tables of a DocType
```python
meta = frappe.get_meta("Sales Invoice")
for df in meta.fields:
    if df.fieldtype == "Table":
        print(f"  {df.fieldname} → {df.options}")
```

---

## Common Patterns

### Get all Link fields pointing to a DocType
```python
# Find all DocTypes that link to "Customer"
links = frappe.get_all("DocField",
    filters={"fieldtype": "Link", "options": "Customer"},
    fields=["parent", "fieldname"],
    limit_page_length=0
)
for l in links:
    print(f"  {l.parent}.{l.fieldname}")
```

### Export DocType Registry to File
```python
import json
from collections import defaultdict

doctypes = frappe.get_all("DocType",
    fields=["name", "module", "issingle", "istable", "is_submittable"],
    limit_page_length=0
)
by_module = defaultdict(list)
for dt in doctypes:
    by_module[dt.module].append(dt)

output = {}
for module in sorted(by_module.keys()):
    output[module] = [{
        "name": dt.name,
        "single": bool(dt.issingle),
        "child": bool(dt.istable),
        "submittable": bool(dt.is_submittable)
    } for dt in sorted(by_module[module], key=lambda x: x.name)]

with open("doctype-registry.json", "w") as f:
    json.dump(output, f, indent=2)
print(f"Exported {len(doctypes)} DocTypes across {len(output)} modules")
```
