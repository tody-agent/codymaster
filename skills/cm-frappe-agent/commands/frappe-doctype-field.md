---
description: Add, modify, or remove fields from an existing Frappe DocType with automatic JSON updates
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
argument-hint: <doctype_name> <action> [field_details]
---

# Manage DocType Fields

Add, modify, or remove fields from an existing Frappe DocType. This command helps you update the DocType JSON file correctly.

## Arguments

Parse the user's input: $ARGUMENTS

- **doctype_name**: Name of the existing DocType
- **action**: add, modify, remove, list
- **field_details**: Field specifications (for add/modify)

## Actions

### List Fields
Show current fields in the DocType:
```
/doctype-field "Sales Order" list
```

### Add Field
Add a new field to the DocType:
```
/doctype-field "Sales Order" add customer_reference Data
/doctype-field "Sales Order" add priority Select "Low\nMedium\nHigh"
/doctype-field "Sales Order" add items Table "Sales Order Item"
```

### Modify Field
Modify an existing field:
```
/doctype-field "Sales Order" modify customer_name label "Client Name"
/doctype-field "Sales Order" modify status options "Draft\nActive\nClosed"
```

### Remove Field
Remove a field (with confirmation):
```
/doctype-field "Sales Order" remove customer_reference
```

## Process

### Step 1: Find DocType JSON

```bash
# Search for the DocType JSON file
find . -name "*.json" -path "*/doctype/*" | xargs grep -l '"name": "<DocType Name>"'
```

Or if you know the app:
```bash
# Convert DocType name to path
# "Sales Order" -> sales_order
cat apps/<app>/<module>/doctype/<doctype_dir>/<doctype_dir>.json
```

### Step 2: Read Current Structure

Read and parse the DocType JSON to understand:
- Current fields and their order
- Field types and options
- Existing sections and columns

### Step 3: Validate Field Operation

For **add**:
- Check field name doesn't exist
- Validate field type
- Suggest appropriate position

For **modify**:
- Verify field exists
- Validate new property values

For **remove**:
- Check field exists
- Warn about dependencies
- Check if field is used in filters, reports, or code

### Step 4: Apply Changes

Modify the JSON file maintaining proper structure:

#### Adding a Field

Position options:
- After a specific field
- In a specific section
- At the end

```json
{
  "fieldname": "new_field",
  "fieldtype": "Data",
  "label": "New Field",
  "insert_after": "existing_field"
}
```

#### Modifying a Field

Update only specified properties:
```json
{
  "fieldname": "existing_field",
  "label": "New Label",
  "reqd": 1
}
```

#### Removing a Field

Remove from fields array and field_order.

### Step 5: Update Related Files

After JSON changes:

1. **Client Script** - Add/remove field handlers
2. **Controller** - Update validation/calculations
3. **Migration Required** - Remind to run migrate

## Field Type Reference

### Basic Types
| Type | Usage | Options |
|------|-------|---------|
| Data | Short text | - |
| Text | Long text | - |
| Select | Dropdown | Options separated by \n |
| Check | Checkbox | - |
| Int | Integer | - |
| Float | Decimal | - |
| Currency | Money | - |
| Date | Date only | - |
| Datetime | Date + time | - |

### Link Types
| Type | Usage | Options |
|------|-------|---------|
| Link | Reference | DocType name |
| Dynamic Link | Polymorphic | Field containing DocType |
| Table | Child table | Child DocType name |
| Table MultiSelect | Many-to-many | Link DocType |

### Special Types
| Type | Usage |
|------|-------|
| Attach | File upload |
| Attach Image | Image upload |
| Section Break | Section divider |
| Column Break | Column divider |
| Tab Break | Tab navigation |
| HTML | Static content |

## Field Properties

### Display Properties
```json
{
  "label": "Field Label",
  "description": "Help text shown below field",
  "bold": 1,
  "hidden": 0,
  "read_only": 0,
  "print_hide": 0
}
```

### Data Properties
```json
{
  "reqd": 1,
  "unique": 0,
  "default": "Default Value",
  "options": "Option1\nOption2",
  "allow_on_submit": 0,
  "no_copy": 0,
  "translatable": 0
}
```

### Display Control
```json
{
  "in_list_view": 1,
  "in_standard_filter": 1,
  "in_global_search": 1,
  "in_preview": 1,
  "allow_in_quick_entry": 1
}
```

### Conditional Properties
```json
{
  "depends_on": "eval:doc.enable_feature",
  "mandatory_depends_on": "eval:doc.status=='Active'",
  "read_only_depends_on": "eval:doc.docstatus==1"
}
```

### Link Properties
```json
{
  "options": "Customer",
  "fetch_from": "customer.customer_name",
  "fetch_if_empty": 1
}
```

## Common Field Patterns

### Status Field
```json
{
  "fieldname": "status",
  "fieldtype": "Select",
  "label": "Status",
  "options": "\nDraft\nPending\nApproved\nRejected",
  "default": "Draft",
  "in_list_view": 1,
  "in_standard_filter": 1,
  "read_only": 1
}
```

### Customer with Fetch
```json
[
  {
    "fieldname": "customer",
    "fieldtype": "Link",
    "label": "Customer",
    "options": "Customer",
    "reqd": 1
  },
  {
    "fieldname": "customer_name",
    "fieldtype": "Data",
    "label": "Customer Name",
    "fetch_from": "customer.customer_name",
    "read_only": 1
  }
]
```

### Date Range
```json
[
  {
    "fieldname": "from_date",
    "fieldtype": "Date",
    "label": "From Date",
    "reqd": 1
  },
  {
    "fieldname": "to_date",
    "fieldtype": "Date",
    "label": "To Date",
    "reqd": 1
  }
]
```

### Amount Calculation
```json
[
  {"fieldname": "qty", "fieldtype": "Float", "label": "Qty"},
  {"fieldname": "rate", "fieldtype": "Currency", "label": "Rate"},
  {"fieldname": "amount", "fieldtype": "Currency", "label": "Amount", "read_only": 1}
]
```

## Post-Change Steps

After modifying the DocType JSON:

1. **Run Migration**
   ```bash
   bench --site <sitename> migrate
   ```

2. **Clear Cache** (if schema unchanged)
   ```bash
   bench --site <sitename> clear-cache
   ```

3. **Update Controller** (if logic needed)
   - Add validation for new fields
   - Update calculations

4. **Update Client Script** (if UI logic needed)
   - Add field change handlers
   - Update visibility conditions

## Output

Provide:
1. Summary of changes made
2. Updated field list
3. Migration command to run
4. Any additional code changes needed
