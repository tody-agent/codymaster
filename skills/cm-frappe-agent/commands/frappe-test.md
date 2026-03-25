---
description: Run Frappe tests with various options including specific DocTypes, modules, apps, and coverage reporting
allowed-tools: Bash, Read, Grep, Glob
argument-hint: [app_name] [--doctype <name>] [--module <name>] [--coverage]
---

# Run Frappe Tests

Execute Frappe test suites with various filtering and reporting options.

## Arguments

Parse the user's input: $ARGUMENTS

- **app_name**: (Optional) App to test
- **--doctype**: Test specific DocType
- **--module**: Test specific module
- **--coverage**: Generate coverage report
- **--parallel**: Run tests in parallel
- **--failfast**: Stop on first failure

## Process

### Step 1: Detect Environment

```bash
# Find site
cat sites/currentsite.txt 2>/dev/null || echo "No default site"

# List available apps
ls apps/
```

### Step 2: Determine Test Scope

Based on arguments, determine what to test:
- All tests (no arguments)
- App tests (`--app erpnext`)
- Module tests (`--module erpnext.accounts`)
- DocType tests (`--doctype "Sales Invoice"`)

### Step 3: Run Tests

#### All Tests
```bash
bench --site <sitename> run-tests
```

#### App Tests
```bash
bench --site <sitename> run-tests --app my_app
```

#### Module Tests
```bash
bench --site <sitename> run-tests --module my_app.my_module.doctype.my_doctype
```

#### DocType Tests
```bash
bench --site <sitename> run-tests --doctype "My DocType"
```

#### With Coverage
```bash
bench --site <sitename> run-tests --app my_app --coverage
```

#### Parallel Tests
```bash
bench --site <sitename> run-tests --app my_app --parallel
```

#### Skip Test Data Setup
```bash
bench --site <sitename> run-tests --app my_app --skip-setup
```

### Step 4: Analyze Results

Parse test output for:
- Passed tests
- Failed tests
- Errors
- Skipped tests
- Coverage percentage (if enabled)

## Test File Structure

```
my_app/
└── my_module/
    └── doctype/
        └── my_doctype/
            └── test_my_doctype.py
```

## Writing Tests

### Basic Test
```python
# test_my_doctype.py
import frappe
from frappe.tests.utils import FrappeTestCase


class TestMyDocType(FrappeTestCase):
    def setUp(self):
        """Run before each test"""
        self.doc = make_test_doc()

    def tearDown(self):
        """Run after each test"""
        frappe.db.rollback()

    def test_create_document(self):
        """Test document creation"""
        doc = frappe.get_doc({
            "doctype": "My DocType",
            "field1": "value1"
        })
        doc.insert()

        self.assertTrue(doc.name)
        self.assertEqual(doc.field1, "value1")

    def test_validate_required_field(self):
        """Test that required field raises error"""
        doc = frappe.get_doc({
            "doctype": "My DocType"
            # Missing required field
        })

        with self.assertRaises(frappe.MandatoryError):
            doc.insert()

    def test_calculation(self):
        """Test amount calculation"""
        doc = frappe.get_doc({
            "doctype": "My DocType",
            "qty": 10,
            "rate": 100
        })
        doc.insert()

        self.assertEqual(doc.amount, 1000)
```

### Test with Fixtures
```python
# test_records.json (in same directory)
[
    {
        "doctype": "My DocType",
        "name": "TEST-001",
        "field1": "Test Value"
    }
]
```

```python
# test_my_doctype.py
class TestMyDocType(FrappeTestCase):
    def test_with_fixture(self):
        """Test using fixture data"""
        doc = frappe.get_doc("My DocType", "TEST-001")
        self.assertEqual(doc.field1, "Test Value")
```

### Test API Endpoints
```python
class TestMyAPI(FrappeTestCase):
    def test_whitelisted_method(self):
        """Test API endpoint"""
        from my_app.api import get_data

        result = get_data("param1")

        self.assertIsNotNone(result)
        self.assertIn("key", result)

    def test_api_permissions(self):
        """Test API requires login"""
        frappe.set_user("Guest")

        with self.assertRaises(frappe.PermissionError):
            from my_app.api import protected_method
            protected_method()

        frappe.set_user("Administrator")
```

### Test Document Events
```python
class TestMyDocTypeEvents(FrappeTestCase):
    def test_on_submit(self):
        """Test submit creates linked document"""
        doc = make_test_doc()
        doc.insert()
        doc.submit()

        # Check linked document was created
        linked = frappe.get_all("Linked DocType",
            filters={"reference": doc.name})

        self.assertEqual(len(linked), 1)

    def test_on_cancel_reverses(self):
        """Test cancel reverses changes"""
        doc = make_test_doc()
        doc.insert()
        doc.submit()

        original_value = get_related_value()

        doc.cancel()

        new_value = get_related_value()
        self.assertNotEqual(original_value, new_value)
```

## Test Utilities

### Create Test Records
```python
def make_test_doc(**kwargs):
    """Helper to create test documents"""
    doc = frappe.get_doc({
        "doctype": "My DocType",
        "field1": kwargs.get("field1", "Default"),
        "field2": kwargs.get("field2", "Default")
    })
    return doc


def make_test_customer():
    """Create test customer"""
    if not frappe.db.exists("Customer", "_Test Customer"):
        doc = frappe.get_doc({
            "doctype": "Customer",
            "customer_name": "_Test Customer",
            "customer_type": "Company"
        })
        doc.insert()
    return frappe.get_doc("Customer", "_Test Customer")
```

### Assertions
```python
# Common assertions
self.assertEqual(a, b)
self.assertNotEqual(a, b)
self.assertTrue(condition)
self.assertFalse(condition)
self.assertIsNone(value)
self.assertIsNotNone(value)
self.assertIn(item, container)
self.assertNotIn(item, container)
self.assertRaises(ExceptionType, callable, *args)
self.assertAlmostEqual(a, b, places=2)
```

### Test Context Managers
```python
from frappe.tests.utils import change_settings

class TestWithSettings(FrappeTestCase):
    def test_with_changed_settings(self):
        with change_settings("Selling Settings", {
            "allow_negative_stock": 1
        }):
            # Test with changed settings
            pass
        # Settings restored after context
```

## Coverage Report

```bash
# Generate coverage
bench --site <sitename> run-tests --app my_app --coverage

# View coverage report
# HTML report in htmlcov/index.html
```

## Debugging Tests

### Run with Verbose Output
```bash
bench --site <sitename> run-tests --app my_app -v
```

### Run Single Test
```bash
bench --site <sitename> run-tests \
    --module my_app.my_module.doctype.my_doctype.test_my_doctype \
    --test test_create_document
```

### Debug in Console
```bash
bench --site <sitename> console
```

```python
# In console
from my_app.my_module.doctype.my_doctype.test_my_doctype import TestMyDocType

test = TestMyDocType()
test.setUp()
test.test_create_document()  # Run specific test
```

## Common Test Patterns

### Test Permissions
```python
def test_user_cannot_access(self):
    frappe.set_user("test_user@example.com")

    with self.assertRaises(frappe.PermissionError):
        frappe.get_doc("Restricted DocType", "DOC-001")

    frappe.set_user("Administrator")
```

### Test Validation
```python
def test_date_validation(self):
    doc = make_test_doc()
    doc.start_date = "2024-01-15"
    doc.end_date = "2024-01-10"  # Before start

    with self.assertRaises(frappe.ValidationError):
        doc.insert()
```

### Test Background Jobs
```python
def test_enqueued_job(self):
    from my_app.tasks import my_task

    # Run synchronously for testing
    result = my_task(param="value")

    self.assertEqual(result, expected_value)
```

## Output

After running tests, provide:
1. Summary: passed/failed/errors
2. Failed test details
3. Coverage percentage (if requested)
4. Suggestions for fixing failures
