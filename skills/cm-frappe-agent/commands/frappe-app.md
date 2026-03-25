---
description: Create a new Frappe application with complete scaffolding including modules, hooks, and initial structure
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, TodoWrite
argument-hint: <app_name> [--title <title>] [--module <module_name>]
---

# Scaffold New Frappe App

Create a new Frappe application with proper structure, configuration, and initial setup.

## Arguments

Parse the user's input: $ARGUMENTS

- **app_name**: Snake_case app name (e.g., `my_custom_app`)
- **--title**: Human-readable title (e.g., "My Custom App")
- **--module**: Initial module name to create
- **--erpnext**: Include ERPNext dependencies

## Process

### Step 1: Verify Environment

```bash
# Check we're in a bench directory
if [ -f "sites/apps.txt" ]; then
    echo "Bench directory confirmed"
else
    echo "Error: Not in a bench directory"
    exit 1
fi

# Check if app already exists
if [ -d "apps/<app_name>" ]; then
    echo "Error: App already exists"
    exit 1
fi
```

### Step 2: Create App with Bench

```bash
bench new-app <app_name>
```

This will prompt for:
- App Title
- App Description
- App Publisher
- App Email
- App Icon (default: octicon octicon-file-directory)
- App Color (default: grey)
- App License (default: MIT)

### Step 3: Review Generated Structure

```
<app_name>/
├── <app_name>/
│   ├── __init__.py
│   ├── hooks.py              # App configuration
│   ├── modules.txt           # List of modules
│   ├── patches.txt           # Database patches
│   ├── templates/
│   │   ├── __init__.py
│   │   └── pages/
│   ├── www/
│   └── public/
│       ├── css/
│       └── js/
├── requirements.txt          # Python dependencies
├── setup.py                  # Package setup
├── README.md
├── license.txt
└── MANIFEST.in
```

### Step 4: Configure hooks.py

Enhance the generated hooks.py:

```python
app_name = "<app_name>"
app_title = "<App Title>"
app_publisher = "<Publisher>"
app_description = "<Description>"
app_email = "<email>"
app_license = "MIT"

# Required Apps
# required_apps = ["frappe", "erpnext"]

# Fixtures (for export)
# fixtures = [
#     {"dt": "Custom Field", "filters": [["module", "=", "<App Title>"]]},
#     {"dt": "Property Setter", "filters": [["module", "=", "<App Title>"]]}
# ]

# Document Events
# doc_events = {
#     "Sales Invoice": {
#         "validate": "<app_name>.hooks.validate_sales_invoice"
#     }
# }

# Scheduled Tasks
# scheduler_events = {
#     "daily": [
#         "<app_name>.tasks.daily_task"
#     ]
# }

# Website
# website_route_rules = [
#     {"from_route": "/custom-page", "to_route": "Custom Page"}
# ]

# Desk Notifications
# notification_config = "<app_name>.notifications.get_notification_config"

# App includes (for desk)
# app_include_css = "/assets/<app_name>/css/custom.css"
# app_include_js = "/assets/<app_name>/js/custom.js"

# Web includes (for website)
# web_include_css = "/assets/<app_name>/css/web.css"
# web_include_js = "/assets/<app_name>/js/web.js"
```

### Step 5: Create Initial Module

If `--module` specified or ask user:

```bash
mkdir -p apps/<app_name>/<app_name>/<module_name>
touch apps/<app_name>/<app_name>/<module_name>/__init__.py
```

Update modules.txt:
```
<Module Name>
```

### Step 6: Create README

```markdown
# <App Title>

<App Description>

## Installation

```bash
bench get-app <repository_url>
bench --site <sitename> install-app <app_name>
```

## Features

- Feature 1
- Feature 2

## Configuration

1. Go to Settings > <App> Settings
2. Configure options

## License

MIT
```

### Step 7: Install on Site

```bash
bench --site <sitename> install-app <app_name>
```

### Step 8: Initialize Git (Optional)

```bash
cd apps/<app_name>
git init
git add .
git commit -m "Initial commit"
```

## Enhanced Configurations

### For ERPNext Integration

```python
# hooks.py
required_apps = ["frappe", "erpnext"]

# Add custom fields to ERPNext doctypes
after_install = "<app_name>.install.after_install"
before_uninstall = "<app_name>.install.before_uninstall"
```

```python
# install.py
import frappe
from frappe.custom.doctype.custom_field.custom_field import create_custom_fields

def after_install():
    create_custom_fields({
        "Sales Invoice": [
            {
                "fieldname": "custom_field",
                "label": "Custom Field",
                "fieldtype": "Data",
                "insert_after": "customer"
            }
        ]
    })

def before_uninstall():
    # Cleanup custom fields
    pass
```

### For REST API

```python
# api.py
import frappe

@frappe.whitelist()
def get_data(param):
    """API endpoint: /api/method/<app_name>.api.get_data"""
    return {"status": "success", "data": param}

@frappe.whitelist(allow_guest=True)
def public_endpoint():
    """Public API endpoint"""
    return {"message": "Hello World"}
```

### For Scheduled Tasks

```python
# tasks.py
import frappe

def daily_task():
    """Run daily at midnight"""
    # Your task logic
    frappe.db.commit()

def hourly_sync():
    """Run every hour"""
    # Sync logic
    pass
```

### For Custom Pages

```python
# pages/custom_page/custom_page.py
import frappe

def get_context(context):
    context.data = frappe.get_all("DocType", limit=10)
    return context
```

```html
<!-- pages/custom_page/custom_page.html -->
{% extends "templates/web.html" %}

{% block page_content %}
<div class="container">
    <h1>Custom Page</h1>
    {% for item in data %}
        <p>{{ item.name }}</p>
    {% endfor %}
</div>
{% endblock %}
```

## File Templates

### __init__.py
```python
__version__ = "0.0.1"
```

### setup.py
```python
from setuptools import setup, find_packages

setup(
    name="<app_name>",
    version="0.0.1",
    description="<description>",
    author="<author>",
    author_email="<email>",
    packages=find_packages(),
    zip_safe=False,
    include_package_data=True,
    install_requires=[]
)
```

### requirements.txt
```
# Add Python dependencies here
# requests
# pandas
```

## Output

After creation, provide:

1. **Created Files Summary**
   - List all files created
   - Highlight key configuration files

2. **Next Steps**
   ```bash
   # Install on site
   bench --site <sitename> install-app <app_name>

   # Create first DocType
   # Use /doctype-create command

   # Start development
   bench start
   ```

3. **Useful Commands**
   ```bash
   # Run migrations
   bench --site <sitename> migrate

   # Build assets
   bench build --app <app_name>

   # Run tests
   bench --site <sitename> run-tests --app <app_name>

   # Export fixtures
   bench --site <sitename> export-fixtures --app <app_name>
   ```

4. **Development Tips**
   - Use `bench watch` for auto-rebuild
   - Check logs: `tail -f logs/frappe.log`
   - Clear cache after changes: `bench --site <site> clear-cache`
