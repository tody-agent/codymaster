---
description: Invoke the Frappe frontend agent for client-side JavaScript development including form scripts, dialogs, list views, and UI customization
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, Task, TodoWrite
argument-hint: <task_description>
---

# Frappe Frontend Development

You are invoking the specialized Frappe frontend agent for client-side JavaScript development.

## Request

$ARGUMENTS

## Agent Invocation

Use the Task tool to spawn the `frappe-fullstack:frappe-frontend` agent with the following configuration:

**IMPORTANT:** The agent name MUST be fully qualified: `frappe-fullstack:frappe-frontend`

### Agent Prompt Template

```
You are working on a Frappe/ERPNext frontend task.

## Task
{user's task description}

## Context
- Working directory: {current directory}
- This is client-side JavaScript for Frappe Desk

## Your Responsibilities

1. **Analyze the Request**
   - Understand what UI/UX functionality is needed
   - Identify which DocTypes and forms are involved
   - Determine if this is form script, dialog, or list customization

2. **Explore the Codebase**
   - Find existing client scripts for patterns
   - Check for reusable dialog patterns
   - Identify existing UI conventions

3. **Implement the Solution**
   - Write clean, well-documented JavaScript
   - Follow Frappe client-side conventions
   - Handle async operations properly
   - Include proper error handling and user feedback

4. **Provide Complete Code**
   - Form event handlers (refresh, validate, field changes)
   - Custom buttons and actions
   - Dialogs and prompts
   - frappe.call for server communication

## Output Requirements
- Provide complete, working JavaScript code
- Include file paths (doctype.js location)
- Explain any server-side APIs needed
- Note if bench build is required
```

## Capabilities

The frappe-frontend agent excels at:

### Form Scripts
```javascript
frappe.ui.form.on('My DocType', {
    refresh: function(frm) {
        // Add buttons, toggle fields
    },
    validate: function(frm) {
        // Client-side validation
    },
    field_name: function(frm) {
        // Field change handler
    }
});
```

### Child Table Events
```javascript
frappe.ui.form.on('My DocType Item', {
    qty: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        row.amount = row.qty * row.rate;
        frm.refresh_field('items');
    }
});
```

### Custom Buttons
```javascript
frm.add_custom_button(__('Action'), function() {
    // Button logic
}, __('Actions'));
```

### Dialogs
```javascript
let dialog = new frappe.ui.Dialog({
    title: __('My Dialog'),
    fields: [
        {fieldname: 'field1', fieldtype: 'Data', label: 'Field 1'}
    ],
    primary_action: function(values) {
        // Handle submission
    }
});
dialog.show();
```

### Server Calls
```javascript
frappe.call({
    method: 'myapp.api.my_function',
    args: { param: value },
    freeze: true,
    callback: function(r) {
        // Handle response
    }
});
```

### Field Manipulation
```javascript
// Show/hide
frm.toggle_display('fieldname', condition);

// Required
frm.toggle_reqd('fieldname', condition);

// Read-only
frm.set_df_property('fieldname', 'read_only', 1);

// Set query for Link field
frm.set_query('customer', function() {
    return { filters: { status: 'Active' } };
});
```

## Common Tasks

1. **"Add button to create follow-up task"**
   → Custom button with dialog for task details

2. **"Show/hide fields based on document type selection"**
   → Field change handler with toggle_display

3. **"Auto-calculate totals when qty or rate changes"**
   → Child table field events

4. **"Validate that end date is after start date"**
   → validate event with frappe.throw

5. **"Fetch customer details when customer is selected"**
   → Field change with frappe.call

6. **"Add custom filter to link field"**
   → set_query with dynamic filters

## Tools Available to Agent

- **Glob**: Find JavaScript files
- **Grep**: Search for existing patterns
- **Read**: Read existing client scripts
- **Write**: Create new files
- **Edit**: Modify existing code
- **Bash**: Check file structure, run bench build

## File Locations

```
my_app/
└── my_module/
    └── doctype/
        └── my_doctype/
            └── my_doctype.js    # Form script
```

For list view:
```
my_app/
└── my_module/
    └── doctype/
        └── my_doctype/
            └── my_doctype_list.js    # List script
```

## Post-Implementation

After the agent completes:

1. **Build Assets** (if new files created)
   ```bash
   bench build --app my_app
   ```

2. **Clear Cache**
   ```bash
   bench --site <site> clear-cache
   ```

3. **Hard Refresh Browser**
   - Ctrl+Shift+R to reload without cache

4. **Check Browser Console**
   - F12 → Console for JavaScript errors
