# Common Frappe Pitfalls & Solutions

Hard-won lessons from production Frappe apps.

## 1. Forgetting `frappe.db.commit()` After Bulk Operations

**Problem:** Batch task creates 100 records but none appear in DB.
**Cause:** Frappe's auto-commit only works for single-request lifecycle.
**Fix:** Always add `frappe.db.commit()` at the end of scheduler tasks and bulk API calls.

```python
# ✅ Correct
def run_monthly():
    for emp in employees:
        frappe.get_doc({...}).insert(ignore_permissions=True)
    frappe.db.commit()  # Don't forget!

# ❌ Wrong — records may never be committed
def run_monthly():
    for emp in employees:
        frappe.get_doc({...}).insert(ignore_permissions=True)
```

## 2. Querying Non-Submitted Documents

**Problem:** Aggregation includes draft and cancelled records.
**Fix:** Always filter by `docstatus = 1` for submitted records.

```python
# ✅ Correct
frappe.db.sql("""
    SELECT SUM(points) FROM `tabViolation`
    WHERE employee = %s AND docstatus = 1
""", employee)

# ❌ Wrong — includes drafts and cancelled
frappe.db.sql("""
    SELECT SUM(points) FROM `tabViolation`
    WHERE employee = %s
""", employee)
```

## 3. NULL SUM Results

**Problem:** `SUM()` returns NULL when no rows match, causing TypeError.
**Fix:** Use `COALESCE(SUM(...), 0)`.

```python
# ✅ Correct
result = frappe.db.sql("""
    SELECT COALESCE(SUM(points), 0) AS total FROM `tabBonus`
    WHERE employee = %(emp)s AND docstatus = 1
""", {"emp": employee}, as_dict=True)
total = result[0].total  # Always a number

# ❌ Wrong — total could be None
result = frappe.db.sql("""SELECT SUM(points) AS total ...""")
total = result[0].total  # Could be None!
```

## 4. Non-Idempotent Install/Migrate Hooks

**Problem:** `bench migrate` crashes because role/field already exists.
**Fix:** Always check existence before creating.

```python
# ✅ Correct
if not frappe.db.exists("Role", "My Role"):
    frappe.get_doc({"doctype": "Role", "role_name": "My Role"}).insert()

# ❌ Wrong — crashes on second migrate
frappe.get_doc({"doctype": "Role", "role_name": "My Role"}).insert()
```

## 5. Modifying Fields in on_submit Without db_update

**Problem:** Setting fields in `on_submit()` but changes don't persist.
**Cause:** By on_submit time, the doc is already saved.
**Fix:** Call `self.db_update()` after modifying fields.

```python
# ✅ Correct
def on_submit(self):
    self.confirmed_by = frappe.session.user
    self.confirmed_at = now()
    self.db_update()  # Persist the changes!

# ❌ Wrong — changes are lost
def on_submit(self):
    self.confirmed_by = frappe.session.user
    # Forgot db_update!
```

## 6. Business Logic in DocType Controllers

**Problem:** Complex calculations in `.py` controller = untestable.
**Fix:** Put logic in `engines/`, call from controller.

```python
# ✅ Correct — controller delegates to engine
class MyDoc(Document):
    def on_submit(self):
        from my_app.engines.engine import process_submission
        process_submission(self)

# ❌ Wrong — 200 lines of business logic in controller
class MyDoc(Document):
    def on_submit(self):
        # 200 lines of complex calculations here...
```

## 7. Hardcoded Company/Branch References

**Problem:** App only works for one company.
**Fix:** Always use Link fields and dynamic lookups.

```python
# ✅ Correct
company = frappe.db.get_value("Employee", employee, "company")
config = get_config(company=company)

# ❌ Wrong
config = get_config(company="Boxme Vietnam")
```

## 8. Missing Permission Checks in APIs

**Problem:** Any logged-in user can call your API.
**Fix:** Always check permissions first.

```python
# ✅ Correct
@frappe.whitelist()
def my_api(employee):
    if not frappe.has_permission("My DocType", "write"):
        frappe.throw(_("Permission denied"), frappe.PermissionError)
    # ... proceed

# ❌ Wrong — no permission check
@frappe.whitelist()
def my_api(employee):
    # Anyone can call this!
```

## 9. Forgetting to Build After JS Changes

**Problem:** JS changes don't appear in browser.
**Fix:** Run `bench build --app my_app` after any JS/CSS change.

```bash
# After changing any .js or .css file:
bench build --app my_app

# Or for development with auto-rebuild:
bench --site mysite clear-cache
```

## 10. SQL Injection via String Formatting

**Problem:** User input injected directly into SQL.
**Fix:** Always use parameterized queries.

```python
# ✅ Correct — parameterized
frappe.db.sql("""
    SELECT * FROM `tabEmployee` WHERE name = %(emp)s
""", {"emp": employee}, as_dict=True)

# ❌ Wrong — SQL injection risk
frappe.db.sql(f"SELECT * FROM `tabEmployee` WHERE name = '{employee}'")
```

## 11. Workflow State Records Not Created

**Problem:** Workflow fails because Workflow State records don't exist.
**Fix:** Create all workflow states in `after_install` / `after_migrate`.

## 12. Custom Fields Missing Module Property

**Problem:** `bench export-fixtures` doesn't pick up custom fields.
**Fix:** Always set `"module": "My App"` in custom field definitions.

## 12b. Non-ASCII/Accented Characters in Schema (Names/Fieldnames)

**Problem:** Creating DocTypes or fields with non-ASCII characters (e.g., Vietnamese `custom_tên_vi_phạm`) causes cryptic Frappe Builder and MariaDB SQL parsing errors, specifically breaking Frappe Insights and complex `apply_user_permissions` queries.
**Fix:** **ALWAYS** use strict English for DocType `name` (Title Case) and `fieldname` (snake_case). Use the `label` property or Frappe Translation system for localized display in the UI. **NEVER** use non-ASCII characters in schema definitions.

---

## Remote API & Operations Pitfalls

## 13. Using `set_value()` in Web Form Client Scripts

**Problem:** WebForm shows error or silently fails.
**Cause:** WebForm extends `FieldGroup`, NOT `Form`. It uses `set_values()` (plural).
**Fix:** Always use `frappe.web_form.set_values({...})`.

```javascript
// ✅ Correct
frappe.ready(function() {
    frappe.web_form.set_values({ date: frappe.datetime.get_today() });
});

// ❌ Wrong — set_value doesn't exist on WebForm
frappe.web_form.set_value('date', frappe.datetime.get_today());
```

## 14. Web Form Code Outside `frappe.ready()`

**Problem:** Code runs before form is loaded, fields are undefined.
**Fix:** Always wrap Web Form client script code in `frappe.ready()`.

```javascript
// ❌ Wrong — form may not be loaded yet
frappe.web_form.set_values({ field: 'value' });

// ✅ Correct
frappe.ready(function() {
    frappe.web_form.set_values({ field: 'value' });
});
```

## 15. Exposing API Keys in Output or Logs

**Problem:** API keys leaked in console output, error logs, or AI responses.
**Fix:** Always use environment variables, never hardcode credentials.

```bash
# ✅ Correct — use .env file
source .env
curl -sS "$FRAPPE_SITE/api/resource/Employee" \
  -H "Authorization: token $FRAPPE_API_KEY:$FRAPPE_API_SECRET"

# ❌ Wrong — hardcoded credentials
curl -sS "https://mysite.com/api/resource/Employee" \
  -H "Authorization: token abc123:xyz789"
```

## 16. Using `frappe.logger` Instead of `frappe.log_error`

**Problem:** Log entries disappear, not visible in Error Log DocType.
**Fix:** ALWAYS use `frappe.log_error()` for persistent logging.

```python
# ✅ Correct — visible in Error Log
frappe.log_error(title="Debug", message=f"Value: {value}")

# ❌ Wrong — logs to file only, easy to miss
logger = frappe.logger("myapp")
logger.info(f"Value: {value}")
```

## 17. Using `ignore_permissions=True` as a Bug Fix

**Problem:** Permission error → developer bypasses permissions instead of fixing them.
**Fix:** Fix the actual permission (add role, DocPerm, User Permission). Only use `ignore_permissions=True` for system operations (scheduler tasks, install hooks).

```python
# ✅ Correct — fix the permission
# Add "My Role" to DocPerm for "My DocType" with read/write
# Then users with "My Role" can access naturally

# ❌ Wrong — bypassing permissions hides real issues
doc = frappe.get_doc("My DocType", name)
doc.save(ignore_permissions=True)  # DON'T do this to "fix" permission errors
```
