---
description: Invoke multiple Frappe agents in parallel for full-stack development - coordinates backend, frontend, and architecture agents for complete feature implementation
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, Task, TodoWrite, AskUserQuestion
argument-hint: <feature_description>
---

# Frappe Full-Stack Development

Orchestrate multiple specialized agents to build complete features across the full Frappe stack.

## Request

$ARGUMENTS

## Orchestration Strategy

This command coordinates multiple agents working in parallel for comprehensive feature development.

### Phase 1: Understanding & Planning

First, understand the scope:

1. **Analyze the Feature Request**
   - What data needs to be stored? (DocType design)
   - What backend logic is needed? (Controllers, APIs)
   - What UI/UX is required? (Form scripts, dialogs)
   - Is ERPNext integration needed? (Customizations, hooks)

2. **Create Todo List**
   Use TodoWrite to track:
   - [ ] DocType/data model design
   - [ ] Backend implementation
   - [ ] Frontend implementation
   - [ ] Integration/hooks (if needed)
   - [ ] Testing

### Phase 2: Parallel Agent Invocation

Launch agents in parallel using multiple Task tool calls in a single message.

**IMPORTANT:** Agent names MUST be fully qualified with plugin prefix:
- `frappe-fullstack:doctype-architect`
- `frappe-fullstack:frappe-backend`
- `frappe-fullstack:frappe-frontend`
- `frappe-fullstack:erpnext-customizer`

```
┌─────────────────────────────────────────────────────────────┐
│                    PARALLEL EXECUTION                        │
├─────────────────┬─────────────────┬─────────────────────────┤
│ frappe-fullstack│ frappe-fullstack│ frappe-fullstack:       │
│ :doctype-       │ :frappe-backend │ frappe-frontend         │
│ architect       │                 │                         │
│                 │                 │                         │
│ • Design schema │ • Controllers   │ • Form scripts          │
│ • Field types   │ • APIs          │ • Dialogs               │
│ • Relationships │ • Validation    │ • Field handlers        │
│ • Permissions   │ • Background    │ • Custom buttons        │
└─────────────────┴─────────────────┴─────────────────────────┘
```

### Agent Prompts

#### DocType Architect Agent
```
Design the data model for: {feature description}

Requirements:
- Identify all entities/DocTypes needed
- Define fields with appropriate types
- Establish relationships (Link, Table)
- Set up naming conventions
- Define permissions

Output:
- Complete DocType JSON(s)
- Relationship diagram (text)
- Field specifications
```

#### Backend Agent
```
Implement server-side logic for: {feature description}

The DocType structure is: {from architect agent or existing}

Requirements:
- Controller methods (validate, lifecycle hooks)
- Whitelisted APIs for frontend
- Database queries if complex
- Background jobs if long-running
- Email/notification logic

Output:
- Complete Python controller
- API functions
- hooks.py updates if needed
```

#### Frontend Agent
```
Implement client-side functionality for: {feature description}

The DocType and APIs are: {from other agents or existing}

Requirements:
- Form script with event handlers
- Custom buttons for actions
- Dialogs for user input
- Field visibility/requirement logic
- frappe.call to backend APIs

Output:
- Complete JavaScript form script
- Any list view customizations
- Dialog implementations
```

### Phase 3: Integration

After parallel agents complete:

1. **Merge Outputs**
   - Combine all generated code
   - Resolve any conflicts
   - Ensure API names match between frontend/backend

2. **Add ERPNext Integration** (if needed)
   Spawn `frappe-fullstack:erpnext-customizer` agent for:
   - Custom fields on stock DocTypes
   - Hooks configuration
   - after_migrate setup (preferred over fixtures)

3. **Create Files**
   Write all files to appropriate locations:
   ```
   my_app/
   └── my_module/
       └── doctype/
           └── my_doctype/
               ├── my_doctype.json    # From architect
               ├── my_doctype.py      # From backend
               ├── my_doctype.js      # From frontend
               └── test_my_doctype.py # Tests
   ```

### Phase 4: Finalization

1. **Update hooks.py** if needed
2. **Run Migration**
   ```bash
   bench --site <site> migrate
   ```
3. **Build Assets**
   ```bash
   bench build --app <app>
   ```
4. **Clear Cache**
   ```bash
   bench --site <site> clear-cache
   ```

## Example Workflows

### Example 1: "Create a customer feedback system"

**Parallel Agents:**

1. **doctype-architect**: Designs "Customer Feedback" DocType
   - Fields: customer, rating, category, description, status, assigned_to
   - Child table for follow-up actions

2. **frappe-backend**: Implements
   - Validation (rating 1-5)
   - Auto-assign based on category
   - Email notification on submission
   - API to get feedback statistics

3. **frappe-frontend**: Creates
   - Star rating widget
   - Category-based field visibility
   - "Resolve" button for assigned user
   - Dashboard statistics display

### Example 2: "Add approval workflow to purchase requests"

**Parallel Agents:**

1. **doctype-architect**: Modifies/creates
   - Approval fields (approved_by, approval_date, rejection_reason)
   - Status field with workflow states

2. **frappe-backend**: Implements
   - Permission checks for approval
   - Email to approver on submission
   - Budget validation before approval
   - API for bulk approval

3. **frappe-frontend**: Creates
   - Approve/Reject buttons (conditional)
   - Rejection reason dialog
   - Status indicator colors
   - Pending approvals list filter

4. **erpnext-customizer** (if extending ERPNext):
   - Custom fields on Material Request
   - Workflow definition
   - Role permissions

## Agent Coordination Tips

1. **Share Context**: Pass DocType definitions from architect to other agents
2. **Consistent Naming**: Ensure API method names match between frontend/backend
3. **Handle Dependencies**: Backend APIs must exist before frontend can call them
4. **Test Incrementally**: Verify each layer works before integrating

## Tools Available

| Tool | Purpose |
|------|---------|
| Task | Spawn specialized agents |
| TodoWrite | Track progress |
| Glob | Find files |
| Grep | Search code |
| Read | Read existing code |
| Write | Create files |
| Edit | Modify files |
| Bash | Run commands |
| AskUserQuestion | Clarify requirements |

## Output Checklist

After completion, verify:

- [ ] DocType JSON created/modified
- [ ] Python controller implemented
- [ ] JavaScript form script implemented
- [ ] APIs accessible from frontend
- [ ] hooks.py updated (if needed)
- [ ] Migration successful
- [ ] Assets built
- [ ] Cache cleared
- [ ] Feature tested in browser
