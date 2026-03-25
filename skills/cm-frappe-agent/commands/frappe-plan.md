---
description: Create a comprehensive implementation plan for Frappe/ERPNext features with technical design, task breakdown, and documentation. Saves plan to a markdown file.
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, Task, TodoWrite, AskUserQuestion, EnterPlanMode, ExitPlanMode
argument-hint: <feature_description>
---

# Frappe Feature Planning

Create a comprehensive implementation plan for a Frappe/ERPNext feature or module.

## Request

$ARGUMENTS

## IMPORTANT: Use Claude's Plan Mode

This command should use Claude's built-in plan mode for comprehensive planning:

1. **Enter Plan Mode** - Use `EnterPlanMode` tool to enter planning mode
2. **Explore & Design** - Use Glob, Grep, Read to analyze codebase
3. **Ask Questions** - Use AskUserQuestion for clarifications
4. **Write Plan** - Save to feature folder using Write tool
5. **Exit Plan Mode** - Use `ExitPlanMode` for user approval

## Process

### Step 1: Enter Plan Mode

First, use the `EnterPlanMode` tool to enter Claude's planning mode. This signals to the user that you're in a planning phase and will present a plan for approval.

### Step 2: Determine Plan Location

Ask the user where to save the plan:

```
Use AskUserQuestion to ask:
"Where should I create the feature folder for this plan?"

Options:
1. ./features/<feature-name>/
2. ./docs/features/<feature-name>/
3. Custom location (let me specify)
```

If user selects custom, ask for the path.

**Feature folder structure**:
```
<path>/<feature-name>/
├── plan/
│   └── PLAN.md          # The implementation plan
├── backend/
├── frontend/
├── doctype/
└── tests/
```

### Step 3: Invoke Planner Agent

Use the Task tool to spawn the `frappe-fullstack:frappe-planner` agent:

**IMPORTANT:** The agent name MUST be fully qualified: `frappe-fullstack:frappe-planner`

```
## Planning Task

Create a comprehensive implementation plan for:
{user's feature description}

## Context
- Working directory: {current directory}
- Explore the codebase to understand existing patterns
- Ask clarifying questions before finalizing the plan

## Required Sections

1. **Overview & Requirements**
   - What is being built
   - Business requirements
   - User stories/workflows

2. **Technical Design**
   - Data model (DocTypes, fields, relationships)
   - Backend architecture (controllers, APIs, jobs)
   - Frontend design (forms, dialogs, actions)
   - Integration points

3. **Implementation Plan**
   - Phased task breakdown
   - Dependencies between tasks
   - File structure

4. **Testing & Deployment**
   - Testing strategy
   - Migration steps
   - Configuration needed

## Process
1. First, explore the codebase for existing patterns
2. Ask clarifying questions about requirements
3. Design the solution
4. Create detailed implementation tasks
5. Return the complete plan document
```

### Step 3: Clarifying Questions

The planner agent should ask questions about:

**Functional Requirements:**
- What are the core features needed?
- What user roles will interact with this?
- What workflows need to be supported?
- Are there any approval processes?

**Technical Requirements:**
- Should this integrate with existing DocTypes?
- Are there external API integrations?
- What reports are needed?
- Email/notification requirements?

**ERPNext Specific (if applicable):**
- Which ERPNext modules does this relate to?
- Should it hook into existing ERPNext workflows?
- Are there stock DocTypes to extend?

### Step 4: Codebase Analysis

The agent will explore:

```bash
# Find existing DocTypes
find . -name "*.json" -path "*/doctype/*" | head -20

# Check hooks.py for patterns
find . -name "hooks.py" | xargs cat

# Find similar features
grep -r "similar_keyword" --include="*.py" --include="*.js"

# Check existing APIs
grep -r "@frappe.whitelist" --include="*.py"
```

### Step 5: Generate Plan Document

Create a comprehensive markdown document:

```markdown
# [Feature Name] Implementation Plan

> Generated: [Date]
> Status: Draft
> Author: Claude (Frappe Planner)

## 1. Overview

### 1.1 Description
[What is being built and why]

### 1.2 Goals
- Goal 1
- Goal 2

### 1.3 Success Criteria
- [ ] Criteria 1
- [ ] Criteria 2

---

## 2. Requirements

### 2.1 Functional Requirements
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Description | High |
| FR-2 | Description | Medium |

### 2.2 User Stories
- As a [role], I want to [action] so that [benefit]

### 2.3 Non-Functional Requirements
- Performance: ...
- Security: ...
- Scalability: ...

---

## 3. Technical Design

### 3.1 Data Model

#### DocType: [Name]
**Purpose**: [Description]

| Field | Type | Options | Required | Description |
|-------|------|---------|----------|-------------|
| field1 | Data | - | Yes | ... |
| field2 | Link | Customer | Yes | ... |

**Relationships**:
- Links to: [DocType]
- Child tables: [DocType]

#### DocType: [Child Table Name]
...

### 3.2 Architecture

```
┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Backend       │
│   (Form/Dialog) │     │   (Controller)  │
└─────────────────┘     └────────┬────────┘
                                 │
                        ┌────────▼────────┐
                        │   Database      │
                        └─────────────────┘
```

### 3.3 Backend Components

#### Controllers
- `my_doctype.py`: Validation, calculations, events

#### APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `myapp.api.create_record` | Creates new record |
| GET | `myapp.api.get_dashboard` | Dashboard data |

#### Background Jobs
- `process_daily`: Runs daily at midnight

### 3.4 Frontend Components

#### Form Script (`my_doctype.js`)
- Custom buttons: [List]
- Field handlers: [List]
- Dialogs: [List]

#### List View
- Indicators: [Status colors]
- Filters: [Default filters]

### 3.5 ERPNext Integration (if applicable)
- Hooks: [doc_events, etc.]
- Custom Fields: [On which DocTypes]
- Workflows: [If any]

---

## 4. Implementation Plan

### Phase 1: Foundation
**Focus**: Data model and basic structure

| # | Task | Files | Dependencies |
|---|------|-------|--------------|
| 1.1 | Create DocType JSON | `doctype/my_doctype/my_doctype.json` | None |
| 1.2 | Create child table | `doctype/my_child/my_child.json` | 1.1 |
| 1.3 | Run migration | - | 1.1, 1.2 |

### Phase 2: Backend Logic
**Focus**: Controllers and APIs

| # | Task | Files | Dependencies |
|---|------|-------|--------------|
| 2.1 | Implement controller | `doctype/my_doctype/my_doctype.py` | Phase 1 |
| 2.2 | Create APIs | `api.py` | 2.1 |
| 2.3 | Add background jobs | `tasks.py`, `hooks.py` | 2.1 |

### Phase 3: Frontend
**Focus**: User interface

| # | Task | Files | Dependencies |
|---|------|-------|--------------|
| 3.1 | Create form script | `doctype/my_doctype/my_doctype.js` | Phase 2 |
| 3.2 | Add custom dialogs | `public/js/dialogs.js` | 3.1 |
| 3.3 | Create list view | `doctype/my_doctype/my_doctype_list.js` | 3.1 |

### Phase 4: Testing & Polish
**Focus**: Quality and documentation

| # | Task | Files | Dependencies |
|---|------|-------|--------------|
| 4.1 | Write unit tests | `test_my_doctype.py` | Phase 2, 3 |
| 4.2 | Integration testing | - | 4.1 |
| 4.3 | Documentation | `README.md` | All |

---

## 5. File Structure

```
my_app/
├── my_module/
│   ├── doctype/
│   │   ├── my_doctype/
│   │   │   ├── my_doctype.json
│   │   │   ├── my_doctype.py
│   │   │   ├── my_doctype.js
│   │   │   └── test_my_doctype.py
│   │   └── my_child/
│   │       └── my_child.json
│   └── api.py
├── tasks.py
├── hooks.py (updates)
└── public/
    └── js/
        └── dialogs.js
```

---

## 6. Testing Strategy

### Unit Tests
- [ ] Test validation rules
- [ ] Test calculations
- [ ] Test API responses

### Integration Tests
- [ ] Test complete workflows
- [ ] Test with ERPNext (if applicable)

### Manual Testing
- [ ] Form submission flow
- [ ] Error handling
- [ ] Permission checks

---

## 7. Deployment

### Pre-deployment
1. Backup database
2. Review migrations

### Deployment Steps
```bash
# 1. Pull latest code
git pull

# 2. Run migrations
bench --site <site> migrate

# 3. Build assets
bench build --app my_app

# 4. Clear cache
bench --site <site> clear-cache

# 5. Restart (production)
sudo supervisorctl restart all
```

### Post-deployment
- [ ] Verify migrations ran
- [ ] Test core functionality
- [ ] Monitor error logs

---

## 8. Open Questions

- [ ] Question 1?
- [ ] Question 2?

---

## 9. References

- Similar feature: [Link/Path]
- ERPNext docs: [Link]
- Related DocTypes: [List]

---

## Appendix

### A. Mockups/Wireframes
[If any]

### B. Sample Data
[If any]

### C. Change Log
| Date | Change | Author |
|------|--------|--------|
| [Date] | Initial plan | Claude |
```

### Step 6: Save the Plan

Write the plan to the feature folder:

```python
# Use Write tool to save
file_path = "<feature-folder>/plan/PLAN.md"
```

### Step 7: Exit Plan Mode

**IMPORTANT:** After writing the plan file, use `ExitPlanMode` tool to:
1. Signal that planning is complete
2. Present the plan to user for approval
3. User will review and approve before implementation begins

### Step 8: Summary

After user approves the plan, provide:

1. **Plan Location**: Where the file was saved
2. **Quick Summary**: Key decisions and structure
3. **Next Steps**: How to start implementation
4. **Commands to Use**:
   ```
   /frappe-fullstack:frappe-doctype-create [DocType] [module]
   /frappe-fullstack:frappe-backend [task]
   /frappe-fullstack:frappe-frontend [task]
   ```

## Output

The command produces:

1. **Saved Plan File**: Comprehensive markdown document in feature folder
2. **User Approval**: Plan mode ensures user reviews and approves
3. **Console Summary**:
   - Plan saved to: `<feature-folder>/plan/PLAN.md`
   - Key components identified
   - Implementation phases overview
   - Suggested next commands

## Tips

- Use `/frappe-plan` before starting any significant feature
- Plan mode ensures user reviews before implementation
- Review and refine the plan with stakeholders
- Update the plan as requirements evolve
- Reference the plan during implementation with `/frappe-fullstack`
