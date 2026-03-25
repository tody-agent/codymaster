---
name: web-forms
description: Frappe Web Form development patterns — client scripts, CSS, guest access, and common gotchas.
---

# Web Forms

Patterns for developing Frappe Web Forms (portal pages).

## When to Use

- Creating public-facing forms (customer portals, application forms)
- Customizing existing Web Form client scripts
- Styling Web Forms with custom CSS
- Managing Web Forms via REST API

## Key References

- `resources/web-form-patterns.md` — Complete client script patterns, CSS, and gotchas

## Critical Gotchas

1. **Use `set_values()` NOT `set_value()`** — WebForm extends FieldGroup, not Form
2. **Always wrap in `frappe.ready()`** — ensures form is loaded before code runs
3. **Read-only fields CAN be set** via `set_values()` in client scripts

## Quick Template

```javascript
frappe.ready(function() {
    // Set initial values
    frappe.web_form.set_values({
        date: frappe.datetime.get_today()
    });

    // Validate before submit
    frappe.web_form.validate = function() {
        let values = frappe.web_form.get_values();
        if (!values.email) {
            frappe.msgprint(__('Email is required'));
            return false;
        }
        return true;
    };
});
```
