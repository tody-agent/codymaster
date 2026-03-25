# Frappe App Scaffold Checklist

Use this checklist when creating a new Frappe custom app from scratch.

## Phase 1: Foundation

- [ ] `bench new-app my_app` — scaffold the app
- [ ] Create folder structure:
  ```
  mkdir -p my_app/{engines,api,tasks,setup,tests,scripts,fixtures}
  mkdir -p my_app/public/js
  touch my_app/{engines,api,tasks,setup,tests}/__init__.py
  ```
- [ ] `bench --site mysite install-app my_app`
- [ ] `bench --site mysite set-config developer_mode 1`

## Phase 2: Data Model

- [ ] Design DocTypes on paper first (fields, links, workflows)
- [ ] Identify which DocTypes are Submittable (need approval flow)
- [ ] Identify Master DocTypes (config, types, rules)
- [ ] Create DocTypes via Frappe UI or JSON files
- [ ] Add `module` property to all DocTypes

## Phase 3: Hooks & Setup

- [ ] Configure `hooks.py`:
  - [ ] `app_name`, `app_title`, `required_apps`
  - [ ] `app_include_js` for shared client JS
  - [ ] `after_install`, `after_migrate`
  - [ ] `doc_events` for submit/cancel/insert hooks
  - [ ] `fixtures` for Roles, Custom Fields, Workflows
  - [ ] `scheduler_events` for daily/weekly/monthly tasks
  - [ ] `permission_query_conditions` for row-level security
- [ ] Write `setup/install.py` (idempotent role/field/state creation)

## Phase 4: Business Logic

- [ ] Create `engines/` with pure-logic functions (no Frappe imports)
- [ ] Create config cascade functions (with Frappe DB)
- [ ] Create main pipeline function (aggregates everything)
- [ ] Write doc-event hook functions (on_submit, on_cancel, after_insert)

## Phase 5: APIs

- [ ] Create external API (`api/external.py`) for webhook/integration
- [ ] Create internal API (`api/internal.py`) for UI-facing calls
- [ ] Add permission checks (`frappe.has_permission()`)
- [ ] Add permission query functions for row-level security

## Phase 6: Scheduler Tasks

- [ ] `tasks/daily.py` — aggregation, reminders
- [ ] `tasks/weekly.py` — weekly calculations
- [ ] `tasks/monthly.py` — monthly calculations, benefit checks
- [ ] Register all in `hooks.py` → `scheduler_events`

## Phase 7: Client Side

- [ ] Create `public/js/my_app.js` with shared utilities
- [ ] Write DocType `.js` files (refresh, field triggers, custom buttons)
- [ ] Add list view settings with workflow color indicators

## Phase 8: Reports

- [ ] Create Script Reports with `execute()`, `get_columns()`, `get_data()`
- [ ] Add charts via `get_chart()` (bar, line, pie)
- [ ] Add summary cards via `get_report_summary()`
- [ ] Create `.js` filter definitions

## Phase 9: Testing

- [ ] Write standalone tests for pure-logic functions
- [ ] Run: `python -m pytest my_app/tests/ -v`

## Phase 10: Deploy

- [ ] `bench --site mysite migrate`
- [ ] `bench build --app my_app`
- [ ] Export fixtures: `bench --site mysite export-fixtures --app my_app`
- [ ] Test on staging before production
- [ ] Push to git
