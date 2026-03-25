---
name: cm-frappe-agent
description: |
  Master Frappe Framework and ERPNext full-stack development. Build, upgrade, 
  and maintain production-ready Frappe custom apps using the 7-Layer Architecture
  combined with specialized AI agents for the FULL development lifecycle:
  development, testing, debugging, bug fixing, installation, remote operations,
  and performance optimization.

  ALWAYS trigger for: frappe app, frappe doctype, bench, erpnext, frappe hooks,
  frappe scheduler, frappe workflow, frappe report, frappe api, frappe controller,
  "create frappe app", "write doctype", "frappe custom app", "bench migrate",
  "upgrade frappe", "frappe engine", "frappe webhook", "frappe client script",
  "frappe server script", "frappe test", "improve frappe", "frappe backend",
  "frappe frontend", "frappe remote", "remote api", "frappe cloud", "REST API",
  "curl frappe", "install bench", "setup frappe", "create site", 
  "production setup", "fix bug", "fix error", "solve frappe error",
  "frappe slow", "optimize query", "web form", "portal", "webform client script",
  "frappe performance", "frappe install", "bench setup", "frappe permission",
  "frappe fixture", "frappe workspace", "doc_events", "frappe i18n",
  "frappe report", "frappe translation", "bench new-app"
---

# Goal

To provide a **comprehensive lifecycle toolkit** for Frappe/ERPNext development — from installation and setup, through development and testing, to debugging, bug fixing, remote operations, and performance optimization. Built on the strict **7-Layer Architecture** (separating business logic from the Frappe ORM) with specialized **AI Agents** for each lifecycle stage.

---

# Lifecycle Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FRAPPE DEVELOPMENT LIFECYCLE                      │
│                                                                     │
│  1. INSTALL    → Setup bench, sites, apps          [frappe-installer] │
│  2. PLAN       → Architecture, DocType design       [frappe-planner]  │
│  3. BUILD      → Backend, frontend, full-stack      [backend/frontend]│
│  4. TEST       → Unit tests, integration tests      [commands/test]   │
│  5. DEBUG      → Log analysis, error investigation  [frappe-debugger] │
│  6. FIX        → Structured bug fix loop            [frappe-fixer]    │
│  7. OPTIMIZE   → Performance tuning, caching        [frappe-perf]     │
│  8. DEPLOY     → Migrate, build, production setup   [commands/bench]  │
│  9. OPERATE    → Remote API, monitoring             [frappe-remote]   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

# Instructions

You are the orchestrator of the full Frappe development lifecycle. When handling a task, match it to the right lifecycle stage and invoke the appropriate agent.

## 1. Frappe Architecture Laws: The 7-Layer Pattern

Always reference the core architectural guidelines before implementing any feature:
*See `resources/7-layer-architecture.md` for comprehensive code examples.*

1. **DocType (Layer 1)**: Frappe manages the schema. Controllers handle `validate`, `on_submit`, etc. No heavy business logic here.
2. **Engines (Layer 2)**: **Crucial.** Pure Python logic. No Frappe DB calls inside pure algorithms — side-effect-free and testable.
3. **API (Layer 3)**: `@frappe.whitelist` endpoints using idempotent upsert patterns.
4. **Tasks (Layer 4)**: Scheduler events (daily, weekly) acting as wrappers around Engines.
5. **Setup (Layer 5)**: Idempotent install and migrate hooks (`after_install`, `after_migrate`).
6. **Tests (Layer 6)**: Standalone pure logic tests.
7. **Client JS (Layer 7)**: Shared utility namespaces (`window.myapp`) and list views.

## 2. Agent Orchestration

### Development Agents (Build)
*   **DocType Architect (`agents/doctype-architect.md`)**: Schema, relations, workflow states.
*   **Frappe Backend (`agents/frappe-backend.md`)**: Python APIs, controllers, and background jobs.
*   **Frappe Frontend (`agents/frappe-frontend.md`)**: Client scripts, dialogs, custom formatters.
*   **Frappe Custom Frontend (`agents/frappe-custom-frontend.md`)**: Custom standalone frontend pages.
*   **ERPNext Customizer (`agents/erpnext-customizer.md`)**: Extending core ERPNext modules safely.

### Lifecycle Agents (Operate)
*   **Frappe Installer (`agents/frappe-installer.md`)**: Bench setup, site creation, production deployment.
*   **Frappe Planner (`agents/frappe-planner.md`)**: Feature planning and technical design.
*   **Frappe Debugger (`agents/frappe-debugger.md`)**: Error analysis and log investigation.
*   **Frappe Fixer (`agents/frappe-fixer.md`)**: Structured bug-fix loop (reproduce → diagnose → fix → verify).
*   **Frappe Performance (`agents/frappe-performance.md`)**: Query optimization, profiling, caching.
*   **Frappe Environment Doctor (`agents/frappe-doctor.md`)**: Environment health checks, user record repair, and zombie process cleanup.
*   **Frappe Remote Ops (`agents/frappe-remote-ops.md`)**: REST API operations for remote/cloud sites.
*   **GitHub Workflow (`agents/github-workflow.md`)**: Git operations and CI/CD.

## 3. Dedicated Sub-Skills

*   `skills/doctype-patterns/SKILL.md` – Best practices for custom fields, naming rules.
*   `skills/server-scripts/SKILL.md` – Server-side Python patterns.
*   `skills/client-scripts/SKILL.md` – JavaScript form/list configurations.
*   `skills/frappe-api/SKILL.md` – Frappe Framework ORM and Python API usage.
*   `skills/bench-commands/SKILL.md` – Bench CLI reference.
*   `skills/remote-operations/SKILL.md` – REST API patterns for remote sites.
*   `skills/web-forms/SKILL.md` – Web Form development patterns.

## 4. Resource References

*   `resources/7-layer-architecture.md` – Core architecture with code examples.
*   `resources/code-patterns-guide.md` – **Production code patterns** (Layer 1-9 with real code, i18n, CI/CD, strict constraints).
*   `resources/bench_commands.md` – Managing sites, building, caching.
*   `resources/common_pitfalls.md` – Things to avoid.
*   `resources/scaffold_checklist.md` – New app scaffolding.
*   `resources/upgrade_patterns.md` – Version upgrade patterns.
*   `resources/rest-api-patterns.md` – REST API curl patterns.
*   `resources/doctype-registry.md` – DocType discovery and exploration.
*   `resources/installation-guide.md` – Complete setup guide.
*   `resources/web-form-patterns.md` – Web Form scripting.

---

# Best Practices

*   **Never Modify Core Files**: Always use `hooks.py`, Client Scripts, or Custom Fields.
*   **DB Security**: Always use parameterized queries to prevent SQL injection.
*   **Naming Conventions (CRITICAL)**: **ALWAYS** use English for `fieldname` (must be `snake_case`, e.g., `violation_name`) and DocType `names` (must be `Title Case`, e.g., `Warehouse Violation`). **NEVER** use Vietnamese or other non-ASCII characters in schema (`name` or `fieldname`). Use Frappe's Translation system or Field `Label` for localized display text. Non-ASCII names cause Frappe/MariaDB query builder & Insights SQL errors.
*   **Testable Logic**: Keep controllers focused on dispatching. Business logic in `engines/`.
*   **Error Logging**: ALWAYS use `frappe.log_error()`, NEVER `frappe.logger`.
*   **Bug Fixes**: Follow the structured fix loop (reproduce → diagnose → fix → verify → document).
*   **Environment Recovery**: When site boots fail with 500 errors, use `redis-cli flushall`, `bench clear-cache`, and verify core system users (`Guest`, `Administrator`) have `enabled=1` and `user_type='System User'`.
*   **Remote Operations**: Never expose API keys. Always confirm destructive operations.

---

# Constraints

*   Ensure all custom DocTypes have a Custom App module for proper export.
*   Do not run destructive `bench` commands (like `--force` or `drop`) without explicit user consent.
*   Avoid raw SQL unless performing complex joins the ORM cannot handle.
*   Respect Document-level permissions unless explicitly instructed to use `ignore_permissions=True`.
*   Never fabricate document data or fake API responses for remote operations.


<!-- Generated by Skill Creator Ultra v1.0 - Upgraded v2.0 with lifecycle agents, remote ops, bug fixing, installation, and performance -->
