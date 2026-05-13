# New Feature Development

> From idea to production: brainstorm → plan → execute → review → deploy. This guide covers the complete lifecycle of building a new feature with CodyMaster.

## Table of Contents

1. [Overview](#overview)
2. [Phase 1: Strategic Analysis](#phase-1-strategic-analysis)
3. [Phase 2: Planning & Design](#phase-2-planning--design)
4. [Phase 3: Implementation](#phase-3-implementation)
5. [Phase 4: Code Review](#phase-4-code-review)
6. [Phase 5: Quality Gate](#phase-5-quality-gate)
7. [Phase 6: Deployment](#phase-6-deployment)
8. [Phase 7: Monitoring & Iteration](#phase-7-monitoring--iteration)
9. [Complete Example](#complete-example)

---

## Overview

### The Feature Development Pipeline

```
Idea → Analysis → Planning → Implementation → Review → Deploy → Monitor
```

### Skills Used

| Phase | Skill | Purpose |
|-------|-------|---------|
| 1. Analysis | `cm-brainstorm-idea` | Qualify the problem, compare options |
| 2. Planning | `cm-planning` | Write implementation plan |
| 3. Implementation | `cm-execution` + `cm-tdd` | Build with tests |
| 4. Review | `cm-code-review` | Professional code review |
| 5. Quality | `cm-quality-gate` | Verify everything works |
| 6. Deploy | `cm-safe-deploy` | Ship safely |
| 7. Monitor | `cm-status` + dashboard | Track progress |

### When to Use This Workflow

- **Complex features** that touch multiple system areas
- **User-facing changes** that need careful design
- **Cross-cutting concerns** (auth, i18n, performance)
- **Features with multiple implementation options**

### When to Skip

- **Simple bug fixes** → Use [Bug Fixing Workflow](./05-bug-fixing.md)
- **Quick one-off changes** (< 30 min work)
- **Documentation updates** only
- **Dependency updates** only

---

## Phase 1: Strategic Analysis

**Goal:** Understand the problem deeply before jumping to solutions.

### Step 1.1: Codebase Scan

```bash
# Get instant codebase overview
cm index skeleton

# Read the overview
cat .cm/skeleton.md

# If architecture diagram exists
cat .cm/architecture.mmd
```

### Step 1.2: Run cm-brainstorm-idea

```bash
# Start strategic analysis
/cm-brainstorm-idea
```

The skill will:

1. **Scan the codebase** — Understand current architecture
2. **Interview you** — Ask targeted questions:
   - Who does the current product serve?
   - What is the biggest pain point?
   - What is the next business goal?
   - Are there any constraints?
   - What solutions have been tried?
3. **9 Windows Analysis** — Map the problem across time × system perspectives
4. **Generate Options** — 2-3 fundamentally different approaches
5. **Score & Recommend** — Multi-dimensional evaluation

### Step 1.3: Review the Proposal

After analysis, you'll have:

```
openspec/changes/[feature-name]/proposal.md
```

This document contains:
- Qualified problem statement
- 9 Windows analysis
- 2-3 options with scoring
- Recommended option with rationale

### Step 1.4: Approve or Iterate

```bash
# Read the proposal
cat openspec/changes/[feature-name]/proposal.md

# If satisfied, proceed to planning
# If not, iterate with the skill
```

---

## Phase 2: Planning & Design

**Goal:** Create a detailed implementation plan.

### Step 2.1: Run cm-planning

```bash
# Start planning
/cm-planning
```

The skill will:

1. **Read the proposal** from Phase 1
2. **Break down into tasks** — Small, testable units
3. **Create design document** — Architecture decisions, data models
4. **Write tasks.md** — Step-by-step implementation guide

### Step 2.2: Review the Plan

You'll have:

```
openspec/changes/[feature-name]/
├── proposal.md      # From Phase 1
├── design.md        # Architecture decisions
└── tasks.md         # Implementation tasks
```

### Step 2.3: Approve the Plan

```bash
# Read the tasks
cat openspec/changes/[feature-name]/tasks.md

# Example task structure:
## Task 1: Create auth types
- File: src/types/auth.ts
- Define User, Session, Token types
- Tests: test/types/auth.test.ts
- Estimate: 30 min

## Task 2: Implement login API
- File: src/api/auth/login.ts
- POST /api/auth/login endpoint
- Tests: test/api/auth/login.test.ts
- Estimate: 1 hour
```

### Step 2.4: Create Task JSON (Optional)

For autonomous execution:

```bash
# Convert tasks to JSON
cm tasks init openspec/changes/[feature-name]/tasks.md

# This creates cm-tasks.json
```

---

## Phase 3: Implementation

**Goal:** Build the feature with tests.

### Step 3.1: Choose Execution Mode

```bash
# Mode A: Batch (3 tasks at a time, get feedback)
/cm-execution --mode a

# Mode B: Subagent (one agent per task, same session)
/cm-execution --mode b

# Mode E: TRIZ-Parallel (3+ independent tasks, fastest)
/cm-execution --mode e

# Mode F: Party (single agent, multi-perspective)
/cm-execution --mode f
```

### Step 3.2: Execute Tasks

#### For Each Task:

1. **Write failing test first (RED)**
   ```bash
   # Create test file
   cat > test/api/auth/login.test.ts << 'EOF'
   import { describe, it, expect } from 'vitest'
   import { login } from '@/api/auth/login'
   
   describe('login', () => {
     it('returns token for valid credentials', async () => {
       const result = await login({
         email: 'test@example.com',
         password: 'password123'
       })
       expect(result.token).toBeDefined()
     })
   
     it('throws error for invalid credentials', async () => {
       await expect(login({
         email: 'wrong@example.com',
         password: 'wrong'
       })).rejects.toThrow('Invalid credentials')
     })
   })
   EOF
   
   # Verify test fails
   npm run test:run -- login.test.ts
   # Should fail: login function doesn't exist yet
   ```

2. **Implement to pass (GREEN)**
   ```bash
   # Create implementation
   cat > src/api/auth/login.ts << 'EOF'
   export async function login(credentials: {
     email: string
     password: string
   }): Promise<{ token: string }> {
     // Implementation here
     throw new Error('Not implemented')
   }
   EOF
   
   # Run test again
   npm run test:run -- login.test.ts
   # Should still fail, but now we have a clear path
   ```

3. **Refactor (REFACTOR)**
   ```bash
   # Improve implementation
   # Add validation, error handling, etc.
   
   # Run full test suite
   npm run test:run
   
   # Run quality gate
   npm run test:gate:kit
   ```

### Step 3.3: Progress Tracking

```bash
# Check progress
/cm-status

# Or view dashboard
/cm-dashboard
```

### Step 3.4: Between Tasks

```bash
# Update working memory
cm_natural("remember that login uses bcrypt for password hashing")

# Commit completed task
git add -p
git commit -m "feat(auth): add login API endpoint"

# Advance chain (if using skill chain)
cm chain advance <exec-id> "completed login API"
```

---

## Phase 4: Code Review

**Goal:** Ensure code quality and spec compliance.

### Step 4.1: Self-Review

Before requesting review:

```bash
# Review your own changes
git diff main

# Check for:
□ Spec compliance (matches tasks.md)
□ Test coverage
□ Error handling
□ Security considerations
□ Performance implications
□ Code style consistency
```

### Step 4.2: Run cm-code-review

```bash
# Request code review
/cm-code-review
```

The reviewer will check:

1. **Spec compliance** — Does implementation match tasks.md?
2. **Logic correctness** — Are edge cases handled?
3. **Security** — Any OWASP top-10 patterns?
4. **Performance** — Any obvious bottlenecks?
5. **Code quality** — Naming, structure, comments?

### Step 4.3: Address Feedback

```bash
# If issues found
# 1. Fix the issues
# 2. Re-run tests
# 3. Re-run review
# 4. Repeat until clean
```

### Step 4.4: Get Approval

```bash
# Once reviewer approves
# You can proceed to quality gate
```

---

## Phase 5: Quality Gate

**Goal:** Verify everything works before deployment.

### Step 5.1: Run Full Gate

```bash
# Full quality gate
npm run test:gate

# This runs:
# 1. Secret scanning
# 2. Linting
# 3. Type checking
# 4. Unit tests
# 5. Integration tests
# 6. Build verification
```

### Step 5.2: Fix Any Failures

```bash
# If gate fails
# 1. Read the error message
# 2. Fix the issue
# 3. Re-run the gate
# 4. Repeat until passing
```

### Step 5.3: Verify Coverage

```bash
# Check test coverage
npm run test:coverage

# Should have:
# - 80%+ line coverage
# - 80%+ branch coverage
# - All critical paths covered
```

### Step 5.4: Final Verification

```bash
# Manual verification
npm run dev

# Test the feature in browser
# - Happy path works
# - Error handling works
# - Edge cases handled
# - UI/UX is correct
```

---

## Phase 6: Deployment

**Goal:** Ship to production safely.

### Step 6.1: Prepare PR

```bash
# Create feature branch (if not already)
git checkout -b feature/[feature-name]

# Push to remote
git push origin feature/[feature-name]

# Create PR
gh pr create \
  --title "feat: add [feature name]" \
  --body "## Summary
- Added [feature]
- Added tests
- Updated documentation

## Test Plan
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if UI change)
[Add screenshots]"
```

### Step 6.2: Review & Merge

```bash
# After PR is approved
git checkout main
git merge feature/[feature-name]
git push origin main
```

### Step 6.3: Deploy

```bash
# Deploy via CodyMaster (recommended)
/cm-safe-deploy

# Or manual deploy
npm run deploy:production
```

### Step 6.4: Verify Deployment

```bash
# Check deployment status
cm deploy status

# Open in browser
cm deploy open

# Test in production
# - Feature works as expected
# - No errors in logs
# - Performance is acceptable
```

---

## Phase 7: Monitoring & Iteration

**Goal:** Ensure the feature works in production and iterate if needed.

### Step 7.1: Monitor

```bash
# Check for errors
cm logs --tail 100

# Check performance
cm status
```

### Step 7.2: Gather Feedback

```bash
# User feedback
# - Is the feature being used?
# - Are there any issues?
# - Any feature requests?

# Analytics
# - Usage metrics
# - Error rates
# - Performance metrics
```

### Step 7.3: Iterate

```bash
# If issues found
# 1. Create bug fix task
# 2. Use bug fixing workflow
# 3. Deploy fix

# If improvements needed
# 1. Return to Phase 1
# 2. Analyze the improvement
# 3. Plan and implement
```

---

## Complete Example

### Feature: User Authentication

#### Phase 1: Strategic Analysis

```bash
/cm-brainstorm-idea
```

Output:
- Problem: Users need to authenticate to access protected content
- Options:
  - A: JWT tokens (stateless, scalable)
  - B: Session-based (simpler, server-side)
  - C: OAuth2 with providers (Google, GitHub)
- Recommendation: Option A (JWT) for scalability

#### Phase 2: Planning

```bash
/cm-planning
```

Output:
```
openspec/changes/user-auth/
├── proposal.md
├── design.md
└── tasks.md
    - Task 1: Create auth types
    - Task 2: Implement login API
    - Task 3: Create login form
    - Task 4: Add protected routes
    - Task 5: Add logout functionality
```

#### Phase 3: Implementation

```bash
/cm-execution --mode e
```

Execute each task with TDD:

1. **Task 1: Auth types**
   ```typescript
   // src/types/auth.ts
   export interface User {
     id: string
     email: string
     name: string
   }
   
   export interface Session {
     user: User
     token: string
     expiresAt: Date
   }
   ```

2. **Task 2: Login API**
   ```typescript
   // src/api/auth/login.ts
   export async function login(credentials: {
     email: string
     password: string
   }): Promise<Session> {
     // Validate credentials
     // Generate JWT token
     // Return session
   }
   ```

3. **Task 3: Login form**
   ```tsx
   // src/components/auth/LoginForm.tsx
   export function LoginForm() {
     // Form with email/password
     // Submit handler
     // Error display
   }
   ```

4. **Task 4: Protected routes**
   ```typescript
   // src/middleware/auth.ts
   export function withAuth(handler: Function) {
     // Check for valid session
     // Redirect to login if not authenticated
   }
   ```

5. **Task 5: Logout**
   ```typescript
   // src/api/auth/logout.ts
   export async function logout(): Promise<void> {
     // Clear session
     // Redirect to home
   }
   ```

#### Phase 4: Code Review

```bash
/cm-code-review
```

Reviewer checks:
- ✅ Spec compliance
- ✅ Test coverage
- ✅ Security (no hardcoded secrets)
- ✅ Error handling
- ✅ Performance

#### Phase 5: Quality Gate

```bash
npm run test:gate
# ✅ All gates passed
```

#### Phase 6: Deployment

```bash
gh pr create --title "feat: add user authentication"
# PR approved and merged

/cm-safe-deploy
# Deployed to production
```

#### Phase 7: Monitoring

```bash
cm logs --tail 50
# No errors

cm status
# Feature active, 0 issues
```

---

## Next Steps

- [Code Review Process](./06-code-review.md) — Deep dive into review lifecycle
- [Safe Deployment Pipeline](./09-safe-deployment.md) — Deployment safety
- [Parallel Execution Modes](./12-parallel-execution.md) — Advanced execution
