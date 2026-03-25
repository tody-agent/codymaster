---
name: frappe-app-builder
description: |
  Build, upgrade, and maintain production-ready Frappe custom apps from scratch.
  Covers the full lifecycle: project scaffold, DocType design, engine architecture,
  API endpoints, scheduler tasks, hooks, workflows, reports, client-side JS,
  testing, and deployment. Synthesized from real production experience.

  ALWAYS trigger for: frappe app, frappe doctype, bench, erpnext, frappe hooks,
  frappe scheduler, frappe workflow, frappe report, frappe api, frappe controller,
  "create frappe app", "write doctype", "frappe custom app", "bench migrate",
  "upgrade frappe", "frappe engine", "frappe webhook", "frappe client script",
  "frappe server script", "frappe test", "improve frappe", "frappe permission",
  "frappe fixture", "frappe workspace", "doc_events"
---

# Goal

Build production-ready Frappe custom apps that are modular, testable, and
maintainable. Every app follows the same battle-tested architecture: separate
business logic engines from Frappe ORM, expose clean APIs, schedule tasks,
test pure-logic without Frappe, and use hooks/fixtures for portability.

---

# Instructions

## 🏗️ Architecture — The 7-Layer Frappe App

Every non-trivial Frappe app should follow this layered architecture:

```
my_app/
├── my_app/
│   └── doctype/              # Layer 1: Data Model (DocType JSON + controllers)
│       ├── my_doctype/
│       │   ├── my_doctype.json
│       │   ├── my_doctype.py      # Server controller
│       │   └── my_doctype.js      # Client controller
│       └── ...
├── engines/                  # Layer 2: Business Logic (PURE Python, no Frappe in core)
│   ├── scoring_engine.py
│   └── benefit_engine.py
├── api/                      # Layer 3: API Endpoints (@frappe.whitelist)
│   ├── external.py           # Webhooks / external system integration
│   └── internal.py           # Internal UI-facing APIs
├── tasks/                    # Layer 4: Scheduled Tasks (daily/weekly/monthly/cron)
│   ├── daily.py
│   ├── weekly.py
│   └── monthly.py
├── setup/                    # Layer 5: Install & Migrate hooks
│   └── install.py
├── tests/                    # Layer 6: Tests (standalone, no Frappe needed for pure logic)
│   ├── test_engine.py
│   └── test_benefit.py
├── public/js/                # Layer 7: Shared Client JS (badges, utilities, list views)
│   └── my_app.js
├── hooks.py                  # The nervous system — connects everything
├── fixtures/                 # Exported Roles, Workflows, Custom Fields
└── modules.txt
```

### Why This Architecture?

| Layer | Why Separate? |
|-------|--------------|
| **DocType** | Frappe manages schema via JSON. Controllers handle validate/submit/cancel |
| **Engines** | Pure logic = testable without Frappe instance. Import in API, tasks, controllers |
| **API** | Clean separation of external webhooks vs internal UI calls |
| **Tasks** | Scheduler events are simple wrappers calling engine functions |
| **Setup** | Idempotent install/migrate = safe `bench migrate` every time |
| **Tests** | Pure-logic tests run with `pytest -v`, no bench needed |
| **Shared JS** | Global utilities, badges, list view settings, reusable across all DocTypes |

---

## 📐 Layer 1: DocType Design

### Controller Pattern (Python)

```python
import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import now


class WarehouseViolation(Document):
    def validate(self):
        """Auto-fill derived fields BEFORE save."""
        self.fetch_employee_details()
        self.set_period()
        self.fetch_penalty_from_type()

    def fetch_employee_details(self):
        """Pull company, branch, name from Employee — avoid manual entry."""
        if self.employee:
            emp = frappe.db.get_value(
                "Employee", self.employee,
                ["company", "branch", "employee_name"], as_dict=True,
            )
            if emp:
                self.company = emp.company
                self.branch = emp.branch
                self.employee_name = emp.employee_name

    def set_period(self):
        """Auto-derive period (YYYY-MM) from date field."""
        if self.date:
            self.period = str(self.date)[:7]

    def fetch_penalty_from_type(self):
        """Auto-fill penalty points from master data if not manually set."""
        if self.violation_type and not self.penalty_points:
            pts = frappe.db.get_value(
                "Warehouse Violation Type", self.violation_type, "penalty_points"
            )
            if pts:
                self.penalty_points = pts

    def on_submit(self):
        """Record who confirmed and when."""
        self.confirmed_by = frappe.session.user
        self.confirmed_at = now()
        self.db_update()
        frappe.msgprint(
            _("Confirmed. Penalty: {0} pts for {1}.").format(
                self.penalty_points, self.employee_name
            ),
            indicator="orange", alert=True,
        )

    def on_cancel(self):
        frappe.msgprint(
            _("Cancelled for {0}.").format(self.employee_name), alert=True
        )
```

**Key patterns:**
- `validate()` = auto-fill derived fields (period from date, employee details from Link)
- `on_submit()` = record audit trail (who, when), show user feedback
- `on_cancel()` = cleanup or notify
- Use `self.db_update()` after modifying fields in `on_submit` (doc already saved)
- Use `frappe.db.get_value()` for single-field lookups (fast, no full doc load)

### Controller Pattern (JavaScript)

```javascript
frappe.ui.form.on("Warehouse Violation", {
    refresh(frm) {
        // Color-coded workflow state indicator
        if (frm.doc.workflow_state) {
            const colors = {
                "Pending": "orange", "Confirmed": "green",
                "Appealed": "blue", "Waived": "red"
            };
            frm.page.set_indicator(
                frm.doc.workflow_state,
                colors[frm.doc.workflow_state] || "gray"
            );
        }

        // Dashboard indicators for key metrics
        if (frm.doc.penalty_points) {
            frm.dashboard.add_indicator(
                __("Penalty: {0} pts", [frm.doc.penalty_points]),
                frm.doc.penalty_points >= 8 ? "red" :
                frm.doc.penalty_points >= 5 ? "orange" : "blue"
            );
        }

        // Custom action buttons (non-submitted docs only)
        if (!frm.is_new() && frm.doc.docstatus === 0) {
            frm.add_custom_button(__("View Dashboard"), function () {
                frappe.set_route("query-report", "Employee Summary", {
                    period: frm.doc.period
                });
            }, __("Actions"));
        }
    },

    date(frm) {
        // Auto-fill period from date
        boxme.autoSetPeriod(frm, "date", "period");
    },

    violation_type(frm) {
        // Auto-fill penalty from master data
        if (frm.doc.violation_type) {
            frappe.db.get_value(
                "Warehouse Violation Type",
                frm.doc.violation_type,
                "penalty_points",
                (r) => {
                    if (r && r.penalty_points) {
                        frm.set_value("penalty_points", r.penalty_points);
                    }
                }
            );
        }
    }
});
```

### DocType Design Rules

```
✅ DO:
- Use Link fields to reference other DocTypes (Employee, Company, Branch)
- Add "period" field (Data, YYYY-MM) auto-derived from date
- Use Submittable DocTypes for records that need approval workflows
- Set "module" in DocType JSON to your app module name
- Add naming_rule or autoname for meaningful document names

❌ DON'T:
- Hardcode company/branch/employee names — always use Link fields
- Put business logic in DocType controllers — use engines/ instead
- Forget to add "module" property — makes fixtures export fail
- Create DocType without think about workflow states first
```

---

## ⚙️ Layer 2: Business Logic Engines

**The most important pattern.** Separate pure logic from Frappe ORM.

### Pure-Logic Functions (No Frappe Imports)

```python
"""
All pure-logic functions have NO frappe DB calls.
Safe to unit-test without a running Frappe instance.
"""
PPH_LEVEL_ORDER = ["needs_improvement", "average", "good", "excellent"]

_DEFAULT_THRESHOLDS = [
    {"level": "needs_improvement", "min_pph": 0,  "max_pph": 35},
    {"level": "average",           "min_pph": 35, "max_pph": 55},
    {"level": "good",              "min_pph": 55, "max_pph": 75},
    {"level": "excellent",         "min_pph": 75, "max_pph": None},
]

def classify_pph_level(pph: float, thresholds: list) -> str:
    """Classify using half-open intervals [min, max). Falls back to defaults."""
    if not thresholds:
        thresholds = _DEFAULT_THRESHOLDS
    for t in sorted(thresholds, key=lambda x: x["min_pph"]):
        min_v = float(t["min_pph"])
        max_v = t.get("max_pph")
        if pph >= min_v and (max_v is None or pph < float(max_v)):
            return t["level"]
    return thresholds[-1]["level"]

def pph_level_gte(level: str, min_level: str) -> bool:
    """True if level >= min_level in ordering."""
    return PPH_LEVEL_ORDER.index(level) >= PPH_LEVEL_ORDER.index(min_level)
```

### Config Cascade Pattern (Frappe DB)

```python
def get_config_with_cascade(
    company: str, branch: str = None, designation: str = None,
    as_of_date: str = None,
) -> list:
    """
    Fetch config with specificity cascade:
      1. Company + Branch + Designation (most specific)
      2. Company + Branch
      3. Company only
    Returns the most specific matching rows.
    """
    if not as_of_date:
        as_of_date = frappe.utils.today()

    date_filter = """
        AND effective_from <= %(date)s
        AND (effective_to IS NULL OR effective_to = '' OR effective_to >= %(date)s)
        AND is_active = 1
    """

    for b, d in [(branch, designation), (branch, None), (None, None)]:
        conds = "company = %(company)s"
        params = {"company": company, "date": as_of_date}

        if b:
            conds += " AND branch = %(branch)s"
            params["branch"] = b
        else:
            conds += " AND (branch IS NULL OR branch = '')"

        if d:
            conds += " AND designation = %(designation)s"
            params["designation"] = d
        else:
            conds += " AND (designation IS NULL OR designation = '')"

        rows = frappe.db.sql(
            f"SELECT * FROM `tabConfig DocType` WHERE {conds} {date_filter}",
            params, as_dict=True,
        )
        if rows:
            return rows
    return []
```

### Main Pipeline Pattern

```python
def calculate_period_score(employee: str, period_type: str, period_value: str) -> dict:
    """
    Full scoring pipeline for one employee over a period.
    Returns a dict matching the target DocType fields.
    """
    start_date, end_date = get_period_date_range(period_type, period_value)

    emp = frappe.db.get_value("Employee", employee,
        ["company", "branch", "designation"], as_dict=True)
    if not emp:
        frappe.throw(f"Employee {employee!r} not found")

    # Step 1: Aggregate raw data
    raw_data = frappe.db.sql("""
        SELECT value, hours FROM `tabRaw Data`
        WHERE employee = %(emp)s AND date BETWEEN %(s)s AND %(e)s
    """, {"emp": employee, "s": start_date, "e": end_date}, as_dict=True)

    # Step 2: Classify using pure-logic functions
    avg_value = statistics.mean([r.value for r in raw_data]) if raw_data else 0
    level = classify_level(avg_value, get_config(emp.company, emp.branch))

    # Step 3: Aggregate related documents (submitted only = docstatus=1)
    penalties = frappe.db.sql("""
        SELECT COALESCE(SUM(points), 0) AS total
        FROM `tabPenalty` WHERE employee = %(emp)s AND period = %(p)s AND docstatus = 1
    """, {"emp": employee, "p": period_value[:7]}, as_dict=True)

    # Step 4: Return structured result matching DocType fields
    return {
        "employee": employee,
        "period_type": period_type,
        "period_value": period_value,
        "company": emp.company,
        "avg_value": avg_value,
        "level": level,
        "total_penalty": penalties[0].total if penalties else 0,
    }
```

**Key patterns:**
- Separate pure functions (classify, compare) from DB functions (fetch, aggregate)
- Always filter by `docstatus = 1` for submitted documents
- Use `COALESCE(SUM(...), 0)` to avoid NULL results
- Return dicts that match target DocType field names exactly

---

## 🌐 Layer 3: API Endpoints

### External Webhook Pattern (WMS/ERP Integration)

```python
@frappe.whitelist(allow_guest=False)
def receive_data(data):
    """
    POST /api/method/my_app.api.external.receive_data
    Body: {"data": [{...}, {...}]}
    Auth: token api_key:api_secret
    """
    if isinstance(data, str):
        data = json.loads(data)

    created = skipped = 0
    errors = []

    for rec in data:
        emp_code = rec.get("employee_code")
        try:
            employee = frappe.db.get_value(
                "Employee", {"employee_number": emp_code}, "name"
            )
            if not employee:
                errors.append({"code": emp_code, "error": f"Not found"})
                skipped += 1
                continue

            # Deduplicate: skip if already exists
            if frappe.db.exists("My DocType", {"employee": employee, "date": rec["date"]}):
                skipped += 1
                continue

            doc = frappe.get_doc({
                "doctype": "My DocType",
                "employee": employee,
                "date": rec.get("date"),
                "value": rec.get("value", 0),
                "source": "external_system",
            })
            doc.insert(ignore_permissions=True)
            created += 1

        except Exception as exc:
            errors.append({"code": emp_code, "error": str(exc)})
            skipped += 1
            frappe.log_error(str(exc), "receive_data")

    frappe.db.commit()
    return {"status": "ok" if not errors else "partial",
            "created": created, "skipped": skipped, "errors": errors}
```

### Internal API Pattern (UI + Dashboard)

```python
@frappe.whitelist()
def calculate_for_employee(employee, period_type, period_value, overwrite=False):
    """Manual trigger with idempotent upsert."""
    if not frappe.has_permission("My DocType", "write"):
        frappe.throw(_("Permission denied"), frappe.PermissionError)

    data = engine.calculate(employee, period_type, period_value)

    existing = frappe.db.get_value("My DocType", {
        "employee": employee, "period_type": period_type,
        "period_value": period_value,
    })

    if existing:
        if not overwrite:
            return {"status": "exists", "name": existing}
        doc = frappe.get_doc("My DocType", existing)
        if doc.docstatus == 1:
            frappe.throw(_("Cannot overwrite submitted record"))
        doc.update(data)
        doc.save(ignore_permissions=True)
        frappe.db.commit()
        return {"status": "updated", "name": doc.name}

    doc = frappe.get_doc({"doctype": "My DocType", **data})
    doc.insert(ignore_permissions=True)
    frappe.db.commit()
    return {"status": "created", "name": doc.name}
```

### Permission Query Pattern

```python
def get_permission_query(user: str) -> str:
    """Row-level security: user sees only their own records unless manager/admin."""
    roles = frappe.get_roles(user)
    admin_roles = {"System Manager", "HR Reviewer", "Department Manager"}
    if admin_roles & set(roles):
        return ""  # No filter = see all
    emp = frappe.db.get_value("Employee", {"user_id": user}, "name")
    if emp:
        return f"`tabMy DocType`.employee = '{emp}'"
    return "1=0"  # See nothing
```

**Key patterns:**
- `allow_guest=False` for webhooks (requires API key auth)
- Parse `data` as string or dict (Frappe may pass either)
- Batch processing with created/skipped/errors counters
- Idempotent upsert: check existing → update or insert
- `frappe.db.commit()` after bulk operations
- Permission queries for row-level security

---

## ⏰ Layer 4: Scheduler Tasks

### Pattern: Batch Processing All Employees

```python
def run_monthly_calculation(year_month: str = None):
    """Monthly task: calculate scores for ALL active employees."""
    if not year_month:
        year_month = add_months(today(), -1)[:7]

    frappe.logger("my_app").info(f"[Monthly] Starting for {year_month}")
    employees = frappe.get_all("Employee", filters={"status": "Active"}, fields=["name"])
    ok = err = 0

    for emp in employees:
        try:
            data = engine.calculate(emp.name, "month", year_month)
            existing = frappe.db.get_value("Score", {
                "employee": emp.name, "period_type": "month",
                "period_value": year_month,
            })
            if existing:
                doc = frappe.get_doc("Score", existing)
                if doc.docstatus == 0:  # Only update drafts
                    doc.update(data)
                    doc.save(ignore_permissions=True)
            else:
                frappe.get_doc({"doctype": "Score", **data}).insert(ignore_permissions=True)
            ok += 1
        except Exception as exc:
            err += 1
            frappe.log_error(str(exc), f"Monthly — {emp.name}")

    frappe.db.commit()
    frappe.logger("my_app").info(f"[Monthly] Done: {ok} ok, {err} errors")
```

### Pattern: Reminder Notifications

```python
def send_pending_reminders():
    """Notify managers about records pending > 3 days."""
    cutoff = add_days(today(), -3)
    pending = frappe.db.sql("""
        SELECT r.name, r.employee, e.employee_name, e.reports_to
        FROM `tabMy Record` r
        LEFT JOIN `tabEmployee` e ON r.employee = e.name
        WHERE r.docstatus = 0 AND r.creation <= %(cutoff)s
    """, {"cutoff": cutoff}, as_dict=True)

    by_manager = {}
    for row in pending:
        if row.reports_to:
            by_manager.setdefault(row.reports_to, []).append(row)

    for mgr, records in by_manager.items():
        mgr_email = frappe.db.get_value("Employee", mgr, "user_id")
        if mgr_email:
            frappe.sendmail(
                recipients=[mgr_email],
                subject=f"[My App] {len(records)} records need review",
                message=format_reminder_html(records),
            )
```

### hooks.py Scheduler Config

```python
scheduler_events = {
    "daily": [
        "my_app.tasks.daily.run_daily_aggregation",
        "my_app.tasks.daily.send_pending_reminders",
    ],
    "weekly": [
        "my_app.tasks.weekly.run_weekly_calculation",
    ],
    "cron": {
        "0 1 1 * *": [  # 1st of month at 01:00
            "my_app.tasks.monthly.run_monthly_calculation",
        ]
    },
}
```

---

## 🔗 hooks.py — The Nervous System

```python
app_name = "my_app"
app_title = "My App"
app_publisher = "My Company"
app_description = "App description"
app_license = "MIT"

required_apps = ["frappe/hrms"]  # Declare dependencies

# ── Assets ────────────────────────────────────────────────────────────────
app_include_js = ["/assets/my_app/js/my_app.js"]

# ── DocType JS overrides (for core DocTypes like Employee) ────────────────
doctype_js = {
    "Employee": "public/js/employee.js"
}

# ── After install / migrate ───────────────────────────────────────────────
after_install = "my_app.setup.install.after_install"
after_migrate = "my_app.setup.install.after_migrate"

# ── Doc Events (server-side hooks) ────────────────────────────────────────
doc_events = {
    "My Submittable Doc": {
        "on_submit": "my_app.engines.my_engine.on_doc_submit",
        "on_cancel": "my_app.engines.my_engine.on_doc_cancel",
    },
    "My Auto Doc": {
        "after_insert": "my_app.engines.my_engine.on_doc_insert",
    },
}

# ── Fixtures (portable across sites) ─────────────────────────────────────
fixtures = [
    {"dt": "Role", "filters": [["name", "in", ["My Role 1", "My Role 2"]]]},
    {"dt": "Custom Field", "filters": [["module", "=", "My App"]]},
    {"dt": "Workflow", "filters": [["document_type", "in", ["My Doc"]]]},
    {"dt": "Workflow State", "filters": [["name", "in", [
        "Draft", "Pending", "Approved", "Rejected"
    ]]]},
]

# ── Permission query conditions ───────────────────────────────────────────
permission_query_conditions = {
    "My Score Doc": "my_app.api.internal.get_permission_query",
}
```

---

## 🛠️ Layer 5: Setup / Install

```python
def after_install():
    """Run once after bench install-app. Must be idempotent."""
    _create_roles()
    _create_custom_fields()
    _create_workflow_states()
    frappe.db.commit()

def after_migrate():
    """Run after every bench migrate. Must be idempotent."""
    _ensure_roles()
    _create_workflow_states()
    frappe.db.commit()

def _create_roles():
    for role in ["My Role 1", "My Role 2"]:
        if not frappe.db.exists("Role", role):
            frappe.get_doc({
                "doctype": "Role", "role_name": role, "desk_access": 1
            }).insert(ignore_permissions=True)

def _create_custom_fields():
    """Add custom fields to core DocTypes (e.g., Employee)."""
    fields = [
        {
            "dt": "Employee",
            "fieldname": "my_app_code",
            "fieldtype": "Data",
            "label": "My App Code",
            "insert_after": "employee_number",
            "unique": 1, "search_index": 1,
            "module": "My App",
        },
    ]
    for cf in fields:
        if not frappe.db.exists("Custom Field", {"dt": cf["dt"], "fieldname": cf["fieldname"]}):
            frappe.get_doc({"doctype": "Custom Field", **cf}).insert(ignore_permissions=True)

def _create_workflow_states():
    states = [
        {"state": "Draft",    "icon": "edit",    "style": ""},
        {"state": "Pending",  "icon": "time",    "style": "Warning"},
        {"state": "Approved", "icon": "ok-sign", "style": "Success"},
        {"state": "Rejected", "icon": "remove",  "style": "Danger"},
    ]
    for ws in states:
        if not frappe.db.exists("Workflow State", ws["state"]):
            frappe.get_doc({
                "doctype": "Workflow State",
                "workflow_state_name": ws["state"],
                "icon": ws["icon"], "style": ws["style"],
            }).insert(ignore_permissions=True)
```

---

## 📊 Layer 6: Reports

### Script Report Pattern

**Python (employee_scoring_summary.py):**

```python
def execute(filters=None):
    filters = filters or {}
    columns = get_columns()
    data = get_data(filters)
    chart = get_chart(data)
    report_summary = get_report_summary(data)
    return columns, data, None, chart, report_summary

def get_columns():
    return [
        {"fieldname": "employee", "label": "Employee", "fieldtype": "Link",
         "options": "Employee", "width": 120},
        {"fieldname": "value", "label": "Value", "fieldtype": "Float",
         "precision": 1, "width": 90},
        # ... more columns
    ]

def get_data(filters):
    conditions = "WHERE d.docstatus != 2"
    values = {}
    if filters.get("company"):
        conditions += " AND d.company = %(company)s"
        values["company"] = filters["company"]
    # ... more filters
    return frappe.db.sql(f"""
        SELECT d.employee, d.value, ...
        FROM `tabMy Doc` d {conditions}
        ORDER BY d.value DESC
    """, values, as_dict=True)

def get_chart(data):
    if not data:
        return None
    top = data[:10]
    return {
        "data": {
            "labels": [r.employee_name for r in top],
            "datasets": [
                {"name": "Value", "values": [r.value for r in top]},
            ],
        },
        "type": "bar",
        "colors": ["#2980b9"],
    }

def get_report_summary(data):
    if not data:
        return []
    total = len(data)
    avg = sum(r.value for r in data) / total if total else 0
    return [
        {"value": total, "label": "Total", "datatype": "Int", "indicator": "Blue"},
        {"value": round(avg, 1), "label": "Average", "datatype": "Float",
         "indicator": "Green" if avg >= 50 else "Orange"},
    ]
```

**JavaScript (employee_scoring_summary.js):**

```javascript
frappe.query_reports["Employee Scoring Summary"] = {
    filters: [
        {
            fieldname: "company",
            label: __("Company"),
            fieldtype: "Link",
            options: "Company",
            default: frappe.defaults.get_user_default("Company"),
        },
        {
            fieldname: "period",
            label: __("Period (YYYY-MM)"),
            fieldtype: "Data",
            default: frappe.datetime.get_today().substring(0, 7),
        },
    ],
};
```

---

## 🎨 Layer 7: Shared Client JS

```javascript
/**
 * Global client-side utilities namespace.
 * Loaded via app_include_js in hooks.py.
 */
window.myapp = window.myapp || {};

// Color-coded badge
myapp.levelBadge = function (level, colorMap) {
    const info = colorMap[level] || { color: "#888", label: level || "N/A" };
    return `<span style="background:${info.color};color:#fff;padding:2px 8px;
        border-radius:4px;font-size:12px;font-weight:600;">${info.label}</span>`;
};

// Promise-based Frappe method call
myapp.callMethod = function (method, args) {
    return new Promise((resolve, reject) => {
        frappe.call({
            method, args,
            callback: (r) => r?.message != null ? resolve(r.message) : reject(r),
            error: reject,
        });
    });
};

// Auto-set period from date field
myapp.autoSetPeriod = function (frm, dateField, periodField) {
    const d = frm.doc[dateField];
    if (d && d.length >= 7) frm.set_value(periodField, d.substring(0, 7));
};

// List View Settings with workflow color indicators
frappe.listview_settings['My Submittable Doc'] = {
    get_indicator(doc) {
        const colors = {
            "Pending": "orange", "Approved": "green",
            "Rejected": "red", "Draft": "gray"
        };
        const c = colors[doc.workflow_state] || "gray";
        return [__(doc.workflow_state), c, "workflow_state,=," + doc.workflow_state];
    }
};
```

---

## 🧪 Layer 6: Testing

### Standalone Pure-Logic Tests (No Frappe!)

```python
"""
Run: python -m pytest my_app/tests/test_engine.py -v
No Frappe instance needed — tests only pure-logic functions.
"""
import unittest

# Inline pure-logic (copy from engine, no frappe imports)
PPH_LEVEL_ORDER = ["needs_improvement", "average", "good", "excellent"]
_DEFAULT_THRESHOLDS = [
    {"level": "needs_improvement", "min_pph": 0,  "max_pph": 35},
    {"level": "average",           "min_pph": 35, "max_pph": 55},
]
# ... paste pure functions here

class TestClassifyLevel(unittest.TestCase):
    def test_boundary(self):
        self.assertEqual(classify_level(35, _DEFAULT_THRESHOLDS), "average")

    def test_empty_defaults(self):
        self.assertEqual(classify_level(60, []), "good")

class TestLevelOrdering(unittest.TestCase):
    def test_gte(self):
        self.assertTrue(level_gte("excellent", "good"))
        self.assertFalse(level_gte("average", "good"))

if __name__ == "__main__":
    unittest.main(verbosity=2)
```

**Why inline pure functions in test files?**
- Tests run with `pytest -v` — no bench, no MariaDB, no Frappe site
- CI/CD friendly — fast, isolated, reliable
- Keep the test file self-contained

---

## 🔄 Workflow Design

### Common Workflow Patterns

| DocType Category | States | Submittable? |
|-----------------|--------|--------------|
| **Violation/Penalty** | Pending → Confirmed → Appealed / Waived | Yes |
| **Score/Review** | Draft → Manager Review → HR Approved → Final | Yes |
| **Recovery/Request** | Pending → Approved / Rejected | Yes |
| **Bonus/Reward** | Pending Approval → Approved / Rejected | Yes |
| **Config/Master** | N/A (no workflow, just CRUD) | No |

### Workflow State Colors

```python
STATE_STYLES = {
    "Draft":    ("edit",    ""),        # Gray
    "Pending":  ("time",    "Warning"), # Orange
    "Approved": ("ok-sign", "Success"), # Green
    "Rejected": ("remove",  "Danger"),  # Red
    "Review":   ("eye-open","Warning"), # Orange
    "Final":    ("star",    "Success"), # Green
}
```

---

# Examples

## Example 1: Scaffold a New Frappe Custom App

**WARNING:** Always use `bench new-app` to create the initial app structure! Do not create it manually, as Frappe Cloud and other tools rely on standard boilerplate files (`setup.py`, `MANIFEST.in`, `patches.txt`, `hooks.py`, etc.) that are generated by `bench`. Failure to do so will result in "Not a valid Frappe App" errors during deployment.

```bash
# 1. Create app (this generates setup.py, pyproject.toml, MANIFEST.in, requirements.txt, etc.)
bench new-app my_custom_app

# 2. Create module structure inside the generated app
mkdir -p apps/my_custom_app/my_custom_app/{engines,api,tasks,setup,tests,scripts,fixtures}
mkdir -p apps/my_custom_app/my_custom_app/public/js
touch apps/my_custom_app/my_custom_app/{engines,api,tasks,setup,tests}/__init__.py

# 3. Install on site
bench --site mysite.localhost install-app my_custom_app

# 4. Enable dev mode
bench --site mysite.localhost set-config developer_mode 1
```

## Example 2: Add a New DocType with Full Stack

1. Create DocType via Frappe UI or JSON
2. Write controller (`.py`) with validate/on_submit/on_cancel
3. Write client script (`.js`) with refresh/field triggers
4. Register doc_events in `hooks.py`
5. Add engine function for business logic
6. Write API endpoint calling engine
7. Add scheduler task for batch processing
8. Write tests for pure logic
9. `bench --site mysite migrate && bench build --app my_custom_app`

---

## 🌍 Layer 8: Multi-Language (i18n)

### Translation Workflow

Frappe uses bare strings wrapped in translation functions: `_("String")` in Python and `__("String")` in JavaScript. Do not use translation keys; use the English baseline string as the key.

1. **Wrap all UI-facing strings:**
    - Python: `frappe._("User {0} not found").format(user_id)`
    - JS: `__("User {0} not found", [user_id])`
2. **Export strings to CSV:**
    `bench --site <site> get-untranslated <language-code> <path/to/output.csv>`
3. **Translate and Import:**
    Add translations to the CSV, then place the translated translations in `my_app/translations/<lang>.csv`.

### Translation Rules
```
✅ DO:
- Use English as the default bare string.
- Use `{0}`, `{1}` for interpolation (positional args) to allow word reordering in other languages.
- Run `bench --site <site> migrate` to clear caches and load new translations.

❌ DON'T:
- Translate log messages or internal system errors meant for developers.
- Use concatenation (`_("Hello") + " " + user`) — always interpolate (`_("Hello {0}").format(user)`).
```

---

## 🚀 Layer 9: CI/CD & GitHub Actions

When building or fixing CI/CD pipelines (`ci.yml`, `linter.yml`) for Frappe apps, adhere to the following stability rules:

### Versions & Environments
- **Python:** Strictly unify the Python version across ALL jobs (e.g., `python-version: '3.12'`). Avoid alpha versions (e.g., 3.14) that break dependencies.
- **Node.js:** Use Node 20+ (e.g., `node-version: 20`). Frappe v15 ecosystem deeply relies on packages like `jsdom@29+` which explicitly drop Node 18 support.
- **GitHub Actions:** Use stable tags (`@v4`, `@v5`). Never guess action versions (`@v6`) as it causes silent failures.

### Frappe Installation in CI
- **Skip Assets:** Always use `--skip-assets` with `bench get-app` to prevent memory exhaustion (OOM errors) and esbuild race conditions during concurrent CI setups.
- **Local App Registration:** If you `bench get-app /path/to/local/app --skip-assets`, the app is **NOT** added to `sites/apps.txt` automatically.
- **apps.txt Fix:** Manually append it safely before `bench install-app`:
  ```bash
  grep -q my_app sites/apps.txt 2>/dev/null || printf '\nmy_app\n' >> sites/apps.txt
  ```
  *(Always use `printf '\n...'` instead of `echo` to prevent concatenating with the last line if it lacks a trailing newline.)*

---

# Constraints

## NEVER
- Push directly to production branch
- Delete or modify DocType JSON files without `bench migrate` after
- Hardcode employee/company references — always use Link fields
- Skip `frappe.db.commit()` after bulk operations
- Use `frappe.db.sql` for INSERT/UPDATE when ORM is available
- Put complex business logic directly in DocType controllers
- Ignore `docstatus` when querying submitted documents

## ALWAYS
- Run `bench --site <site> migrate` after changing DocType schemas
- Run `bench build --app <app>` after changing JS/CSS
- Use `@frappe.whitelist()` decorator for API endpoints
- Use `frappe.has_permission()` before operations in APIs
- Separate pure logic into `engines/` for testability
- Use `frappe.logger("app_name")` for structured logging
- Make `after_install` and `after_migrate` idempotent
- Filter by `docstatus = 1` when aggregating submitted records
- Use `COALESCE(SUM(...), 0)` to avoid NULL in SQL aggregations
- Add `frappe.db.commit()` at the end of batch task functions

## CONFIRM
- Before running `bench --site <site> reinstall` (destroys data)
- Before bulk data migration scripts
- Before modifying workflow states (affects existing records)
- Before `bench drop-site` or `--force` commands

<!-- Generated by Skill Creator Ultra v1.0 -->
