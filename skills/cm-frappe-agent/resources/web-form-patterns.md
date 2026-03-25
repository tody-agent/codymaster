# Web Form Development Patterns

> Patterns for building Frappe Web Forms (portal pages) — client scripts, CSS, and gotchas.

---

## Key Differences: Web Form vs Desk Form

| Aspect | Desk Form (`.js`) | Web Form (Client Script) |
|--------|-------------------|--------------------------|
| API | `frappe.ui.form.Form` | `frappe.web_form` (extends FieldGroup) |
| Set values | `frm.set_value()` | `frappe.web_form.set_values({...})` ← **PLURAL** |
| Ready event | `refresh(frm)` | `frappe.ready(function() { ... })` |
| Context | `cur_frm` | `frappe.web_form` |
| Field access | `frm.fields_dict.fieldname` | `frappe.web_form.fields_dict.fieldname` |

> [!WARNING]
> The most common mistake: using `set_value()` (singular) instead of `set_values()` (plural) in Web Forms. WebForm extends FieldGroup, NOT Form.

---

## Client Script Patterns

### Basic Structure
```javascript
frappe.ready(function() {
    // All Web Form code goes inside frappe.ready()
    // This ensures the form is fully loaded before running

    // Set initial values
    frappe.web_form.set_values({
        date: frappe.datetime.get_today(),
        status: 'Open'
    });

    // Listen for field changes
    frappe.web_form.on('change', function(field, value) {
        if (field === 'category') {
            handle_category_change(value);
        }
    });
});
```

### Set Read-Only Fields
```javascript
frappe.ready(function() {
    // Read-only fields CAN still be set via set_values()
    frappe.web_form.set_values({
        employee_name: frappe.session.user_fullname,
        submit_date: frappe.datetime.get_today()
    });
});
```

### Conditional Field Visibility
```javascript
frappe.ready(function() {
    frappe.web_form.on('change', function(field, value) {
        if (field === 'request_type') {
            // Show/hide fields based on selection
            let show_urgency = (value === 'Emergency');
            frappe.web_form.fields_dict.urgency_level.$wrapper.toggle(show_urgency);
            frappe.web_form.fields_dict.emergency_contact.$wrapper.toggle(show_urgency);
        }
    });
});
```

### Custom Validation Before Submit
```javascript
frappe.ready(function() {
    frappe.web_form.validate = function() {
        let values = frappe.web_form.get_values();

        if (!values.email || !values.email.includes('@')) {
            frappe.msgprint(__('Please enter a valid email address'));
            return false; // Prevents submission
        }

        if (values.start_date > values.end_date) {
            frappe.msgprint(__('End date must be after start date'));
            return false;
        }

        return true; // Allow submission
    };
});
```

### Call Server Methods
```javascript
frappe.ready(function() {
    frappe.web_form.on('change', function(field, value) {
        if (field === 'employee_id') {
            frappe.call({
                method: 'my_app.api.get_employee_details',
                args: { employee_id: value },
                callback: function(r) {
                    if (r.message) {
                        frappe.web_form.set_values({
                            employee_name: r.message.employee_name,
                            department: r.message.department
                        });
                    }
                }
            });
        }
    });
});
```

### After Load / After Save
```javascript
frappe.ready(function() {
    // After form loads
    frappe.web_form.after_load = function() {
        console.log('Form loaded with data:', frappe.web_form.doc);
    };

    // After form saves
    frappe.web_form.after_save = function() {
        frappe.msgprint(__('Thank you! Your submission has been recorded.'));
    };
});
```

---

## Custom CSS Patterns

### Professional Form Styling
```css
/* Card-style form container */
.web-form-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
}

/* Section headings */
.web-form-container .section-head {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-color);
    border-bottom: 2px solid var(--primary);
    padding-bottom: 0.5rem;
    margin-bottom: 1.5rem;
}

/* Success message styling */
.web-form-container .success-page {
    text-align: center;
    padding: 3rem 1rem;
}

/* Hide specific fields */
.frappe-control[data-fieldname="internal_notes"] {
    display: none;
}

/* Custom button styling */
.web-form-container .btn-primary-dark {
    background: var(--primary);
    border: none;
    padding: 0.75rem 2rem;
    font-size: 1rem;
    border-radius: 8px;
}
```

### Responsive Layout
```css
@media (max-width: 768px) {
    .web-form-container {
        padding: 1rem;
    }

    .web-form-container .form-group {
        margin-bottom: 1rem;
    }
}
```

---

## Common Gotchas

### 1. Timing Issues
```javascript
// ❌ WRONG: Code runs before form is ready
frappe.web_form.set_values({ field: 'value' });

// ✅ CORRECT: Always wrap in frappe.ready()
frappe.ready(function() {
    frappe.web_form.set_values({ field: 'value' });
});
```

### 2. set_value vs set_values
```javascript
// ❌ WRONG: set_value doesn't exist on WebForm
frappe.web_form.set_value('field', 'value');

// ✅ CORRECT: Use set_values (plural) with object
frappe.web_form.set_values({ field: 'value' });
```

### 3. Guest Access
```javascript
// For forms allowing guest submissions, check login state:
frappe.ready(function() {
    if (frappe.session.user === 'Guest') {
        // Show limited fields
        frappe.web_form.fields_dict.internal_field.$wrapper.hide();
    }
});
```

### 4. File Uploads in Web Forms
```javascript
// Web Forms handle file uploads differently
// Use the Attach field type in DocType, Web Form will auto-create upload widget
// For custom upload handling:
frappe.ready(function() {
    frappe.web_form.on('change', function(field, value) {
        if (field === 'attachment' && value) {
            console.log('File uploaded:', value);
        }
    });
});
```

---

## Managing Web Forms via REST API

### Get Web Form Configuration
```bash
curl -sS "https://{site}/api/resource/Web%20Form" \
  -G --data-urlencode 'filters=[["route","=","my-form"]]' \
  --data-urlencode 'fields=["name","title","custom_css","client_script"]' \
  -H "Authorization: token {key}:{secret}"
```

### Update Web Form Client Script
```bash
curl -sS -X PUT "https://{site}/api/resource/Web%20Form/{name}" \
  -H "Authorization: token {key}:{secret}" \
  -H "Content-Type: application/json" \
  -d '{"client_script":"frappe.ready(function() { ... })"}'
```
