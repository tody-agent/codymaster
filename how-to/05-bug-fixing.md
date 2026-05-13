# Bug Fixing Workflow

> Systematic debugging with root cause analysis and regression prevention. This guide teaches you how to find and fix bugs permanently, not just patch symptoms.

## Table of Contents

1. [Overview](#overview)
2. [Phase 1: Reproduce](#phase-1-reproduce)
3. [Phase 2: Root Cause Analysis](#phase-2-root-cause-analysis)
4. [Phase 3: Write Regression Test](#phase-3-write-regression-test)
5. [Phase 4: Implement Fix](#phase-4-implement-fix)
6. [Phase 5: Verify Fix](#phase-5-verify-fix)
7. [Phase 6: Prevent Recurrence](#phase-6-prevent-recurrence)
8. [Common Bug Patterns](#common-bug-patterns)
9. [Tools & Commands](#tools--commands)

---

## Overview

### The Bug Fixing Pipeline

```
Reproduce → Root Cause → Regression Test → Fix → Verify → Prevent
```

### Skills Used

| Phase | Skill | Purpose |
|-------|-------|---------|
| 1-2. Analysis | `cm-debugging` | Systematic 5-phase investigation |
| 3. Test | `cm-tdd` | Write failing test first |
| 4. Fix | `cm-execution` | Implement the fix |
| 5. Verify | `cm-quality-gate` | Ensure fix works |
| 6. Prevent | `cm-continuity` | Document learnings |

### The Golden Rule

> **Fix the root cause, not the symptom.**
> A fix that doesn't address the root cause will reappear in a different file.

---

## Phase 1: Reproduce

**Goal:** Create a reliable reproduction of the bug.

### Step 1.1: Gather Information

```bash
# Get error details
cm logs --tail 100

# Check recent changes
git log --oneline -10

# Check what files changed
git diff HEAD~5 --name-only
```

### Step 1.2: Document the Bug

```markdown
## Bug Report

**Title:** [Brief description]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Behavior:** [What should happen]

**Actual Behavior:** [What actually happens]

**Environment:**
- OS: [macOS/Linux/Windows]
- Node.js: [version]
- Browser: [if applicable]

**Error Message:**
```
[Full error message]
```

**Frequency:** [Always/Sometimes/Rarely]

**Screenshots:** [If applicable]
```

### Step 1.3: Create Minimal Reproduction

```bash
# Find the simplest way to trigger the bug
# This could be:
# - A unit test
# - An API call
# - A UI interaction
# - A script

# Example: Create reproduction script
cat > reproduce-bug.ts << 'EOF'
// Minimal reproduction of the bug
async function reproduceBug() {
  // Steps to reproduce
  const result = await buggyFunction(input)
  console.log('Result:', result)
  console.log('Expected:', expected)
  console.log('Match:', result === expected)
}

reproduceBug().catch(console.error)
EOF

# Run it
npx tsx reproduce-bug.ts
```

### Step 1.4: Verify Reproduction

```bash
# Run the reproduction
npx tsx reproduce-bug.ts

# Should consistently show the bug
# If it doesn't, you don't have a reliable reproduction
```

---

## Phase 2: Root Cause Analysis

**Goal:** Find the actual cause, not just the symptom.

### Step 2.1: Run cm-debugging

```bash
/cm-debugging
```

The skill will guide you through:

### Step 2.2: 5 Whys Analysis

Ask "why" repeatedly until you reach the root cause:

```markdown
## 5 Whys Analysis

**Problem:** Login fails with "Invalid credentials" for correct password

**Why 1:** Why does login fail?
→ Because `validatePassword()` returns false for correct password

**Why 2:** Why does `validatePassword()` return false?
→ Because it's comparing against a hashed password that doesn't match

**Why 3:** Why doesn't the hash match?
→ Because the password was hashed with bcrypt but validated with sha256

**Why 4:** Why are different algorithms used?
→ Because the migration script used sha256 but the app uses bcrypt

**Why 5:** Why wasn't this caught in migration?
→ Because the migration test only checked if the column existed, not the algorithm

**Root Cause:** Migration script used wrong hashing algorithm

**Fix:** Update migration script to use bcrypt, re-run migration
```

### Step 2.3: Code Trace

```bash
# Find all places where the bug could occur
grep -r "validatePassword" src/
grep -r "hashPassword" src/
grep -r "bcrypt" src/
grep -r "sha256" src/

# Read the relevant code
cat src/auth/password.ts
cat src/migration/001-add-password-hash.ts
```

### Step 2.4: Identify Impact

```markdown
## Impact Analysis

**Files affected:**
- src/auth/password.ts (validation logic)
- src/migration/001-add-password-hash.ts (migration script)
- test/auth/password.test.ts (missing test case)

**Users affected:**
- All users who migrated before [date]
- New users are not affected

**Severity:**
- High: Users cannot log in
- No data loss
- No security vulnerability
```

---

## Phase 3: Write Regression Test

**Goal:** Create a test that fails before the fix and passes after.

### Step 3.1: Design the Test

```markdown
## Regression Test Plan

**Test file:** test/auth/password-validation.test.ts

**Test cases:**
1. Should validate password with bcrypt hash
2. Should reject password with wrong hash algorithm
3. Should handle migration from sha256 to bcrypt
```

### Step 3.2: Write Failing Test (RED)

```bash
# Create test file
cat > test/auth/password-validation.test.ts << 'EOF'
import { describe, it, expect, beforeAll } from 'vitest'
import { validatePassword, hashPassword } from '@/auth/password'

describe('Password Validation', () => {
  it('should validate password with bcrypt hash', async () => {
    const password = 'securePassword123'
    const hash = await hashPassword(password)
    
    const isValid = await validatePassword(password, hash)
    expect(isValid).toBe(true)
  })

  it('should reject password with wrong hash algorithm', async () => {
    const password = 'securePassword123'
    // Simulate sha256 hash (wrong algorithm)
    const wrongHash = 'sha256:' + Buffer.from(password).toString('base64')
    
    const isValid = await validatePassword(password, wrongHash)
    expect(isValid).toBe(false)
  })

  it('should handle migration from sha256 to bcrypt', async () => {
    const password = 'securePassword123'
    const sha256Hash = 'sha256:' + Buffer.from(password).toString('base64')
    
    // Should auto-migrate to bcrypt
    const isValid = await validatePassword(password, sha256Hash)
    expect(isValid).toBe(true)
    
    // Verify new hash is bcrypt
    const newHash = await hashPassword(password)
    expect(newHash).toMatch(/^\$2[aby]?\$/)
  })
})
EOF

# Run test - should fail
npm run test:run -- password-validation.test.ts
# Expected: 2/3 tests failing (the sha256 tests)
```

### Step 3.3: Verify Test Fails

```bash
# Run the test
npm run test:run -- password-validation.test.ts

# Output:
# ✓ should validate password with bcrypt hash
# ✗ should reject password with wrong hash algorithm
# ✗ should handle migration from sha256 to bcrypt

# Tests fail as expected - now we can implement the fix
```

---

## Phase 4: Implement Fix

**Goal:** Fix the root cause to make tests pass.

### Step 4.1: Analyze Current Code

```bash
# Read the buggy code
cat src/auth/password.ts
```

### Step 4.2: Implement Fix (GREEN)

```bash
# Fix the code
cat > src/auth/password.ts << 'EOF'
import bcrypt from 'bcryptjs'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function validatePassword(
  password: string,
  hash: string
): Promise<boolean> {
  // Handle migration from sha256 to bcrypt
  if (hash.startsWith('sha256:')) {
    // Validate with old algorithm
    const sha256Hash = 'sha256:' + Buffer.from(password).toString('base64')
    if (hash === sha256Hash) {
      // Re-hash with bcrypt and update
      const newHash = await hashPassword(password)
      // TODO: Update in database
      console.log('Migrated password hash from sha256 to bcrypt')
      return true
    }
    return false
  }
  
  // Standard bcrypt validation
  return bcrypt.compare(password, hash)
}
EOF
```

### Step 4.3: Verify Tests Pass

```bash
# Run tests again
npm run test:run -- password-validation.test.ts

# Output:
# ✓ should validate password with bcrypt hash
# ✓ should reject password with wrong hash algorithm
# ✓ should handle migration from sha256 to bcrypt

# All tests pass!
```

### Step 4.4: Run Full Test Suite

```bash
# Ensure no regressions
npm run test:run

# Should all pass
```

---

## Phase 5: Verify Fix

**Goal:** Ensure the fix works in all scenarios.

### Step 5.1: Manual Testing

```bash
# Start the app
npm run dev

# Test the bug scenario
# 1. Try logging in with affected account
# 2. Verify login works
# 3. Verify new hash is stored
# 4. Test edge cases
```

### Step 5.2: Quality Gate

```bash
# Run full quality gate
npm run test:gate

# Should pass all gates
```

### Step 5.3: Edge Cases

```markdown
## Edge Cases to Test

- [ ] Login with correct password (existing user)
- [ ] Login with correct password (new user)
- [ ] Login with wrong password
- [ ] Login with empty password
- [ ] Login with special characters
- [ ] Concurrent logins
- [ ] Password reset flow
```

### Step 5.4: Performance Check

```bash
# Check for performance regression
npm run test:performance

# If available, compare before/after
```

---

## Phase 6: Prevent Recurrence

**Goal:** Ensure this bug class doesn't happen again.

### Step 6.1: Document the Fix

```bash
# Update CONTINUITY.md
cm_natural("remember that password validation must handle both sha256 (legacy) and bcrypt (current) hashes, and auto-migrate on login")

# Add to project documentation
cat >> docs/decisions/password-hashing.md << 'EOF'

## Password Hashing Decision (2024-01-15)

**Decision:** Use bcrypt for all password hashing

**Context:** Migration from sha256 to bcrypt revealed inconsistent hashing algorithms

**Consequences:**
- All new passwords use bcrypt
- Legacy sha256 hashes auto-migrate on login
- Migration script updated to use bcrypt
- Added regression test for algorithm migration
EOF
```

### Step 6.2: Add Preventive Tests

```bash
# Add test to prevent regression
cat > test/auth/password-migration.test.ts << 'EOF'
import { describe, it, expect } from 'vitest'
import { validatePassword } from '@/auth/password'

describe('Password Migration Prevention', () => {
  it('should never use sha256 for new passwords', async () => {
    // This test ensures we never reintroduce sha256
    const password = 'testPassword123'
    
    // Hash should always be bcrypt
    const hash = await hashPassword(password)
    expect(hash).toMatch(/^\$2[aby]?\$/)
    
    // Should not start with sha256
    expect(hash).not.toMatch(/^sha256:/)
  })

  it('should handle legacy sha256 hashes gracefully', async () => {
    const password = 'legacyPassword'
    const sha256Hash = 'sha256:' + Buffer.from(password).toString('base64')
    
    // Should work but auto-migrate
    const isValid = await validatePassword(password, sha256Hash)
    expect(isValid).toBe(true)
  })
})
EOF
```

### Step 6.3: Update Code Review Checklist

```bash
# Add to code review checklist
cat >> .cm/code-review-checklist.md << 'EOF'

## Security Checklist

- [ ] No hardcoded secrets
- [ ] Password hashing uses bcrypt (not sha256, md5, etc.)
- [ ] Input validation on all user inputs
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (escape output)
- [ ] CSRF protection enabled
EOF
```

### Step 6.4: Create Learning

```bash
# Save learning for future reference
cm_natural("important: never use sha256 or md5 for password hashing. Always use bcrypt with at least 12 rounds. Migration from weak hashes should auto-migrate on login.")

# This learning will be retrieved next time someone works on auth
```

---

## Common Bug Patterns

### Pattern 1: Race Condition

**Symptom:** Intermittent failures, data inconsistency

**Root Cause:** Multiple operations accessing shared state simultaneously

**Fix:**
```typescript
// Before (race condition)
let count = 0
function increment() {
  count = count + 1  // Not atomic
}

// After (atomic operation)
let count = 0
function increment() {
  count++  // Atomic in single-threaded JS
  // Or use mutex for async operations
}
```

### Pattern 2: Null Reference

**Symptom:** "Cannot read property of undefined"

**Root Cause:** Missing null check

**Fix:**
```typescript
// Before (no null check)
function getUser(id: string) {
  return users[id].name  // Crashes if user not found
}

// After (with null check)
function getUser(id: string) {
  const user = users[id]
  return user?.name ?? 'Unknown'
}
```

### Pattern 3: Memory Leak

**Symptom:** Performance degrades over time

**Root Cause:** Event listeners not cleaned up

**Fix:**
```typescript
// Before (memory leak)
useEffect(() => {
  window.addEventListener('resize', handleResize)
  // Never removed
}, [])

// After (cleanup)
useEffect(() => {
  window.addEventListener('resize', handleResize)
  return () => window.removeEventListener('resize', handleResize)
}, [])
```

### Pattern 4: Off-by-One Error

**Symptom:** Array bounds, loop iterations

**Root Cause:** Incorrect boundary condition

**Fix:**
```typescript
// Before (off-by-one)
for (let i = 0; i <= array.length; i++) {  // One too many
  console.log(array[i])
}

// After (correct)
for (let i = 0; i < array.length; i++) {  // Correct
  console.log(array[i])
}
```

---

## Tools & Commands

### Debugging Commands

```bash
# Start debugging session
/cm-debugging

# Check logs
cm logs --tail 50

# Search for errors
grep -r "ERROR" logs/

# Check recent changes
git log --oneline -10
git diff HEAD~3
```

### Testing Commands

```bash
# Run specific test
npm run test:run -- test-file.test.ts

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run regression tests
npm run test:run -- --grep "regression"
```

### Quality Commands

```bash
# Full quality gate
npm run test:gate

# Quick gate
npm run test:gate:kit

# Specific gates
npm run gate:secrets
npm run gate:lint
npm run gate:tests
```

### Memory Commands

```bash
# Save learning
cm_natural("remember that...")

# Retrieve learning
cm_natural("what did we learn about...")

# Browse all learnings
cm_natural("show me all project learnings")
```

---

## Example: Complete Bug Fix

### Bug: Login timeout on slow connections

#### Phase 1: Reproduce

```bash
# Create reproduction
cat > reproduce-login-timeout.ts << 'EOF'
async function reproduce() {
  const start = Date.now()
  
  try {
    await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    })
    
    console.log(`Login took ${Date.now() - start}ms`)
  } catch (error) {
    console.error('Login failed:', error)
  }
}

// Simulate slow connection
setTimeout(reproduce, 30000)  // Wait 30 seconds
EOF
```

#### Phase 2: Root Cause

```bash
/cm-debugging
```

Root cause: Timeout set to 5 seconds, but slow connections need 30+ seconds

#### Phase 3: Regression Test

```typescript
// test/api/auth/login-timeout.test.ts
it('should handle slow connections with 30s timeout', async () => {
  const controller = new AbortController()
  setTimeout(() => controller.abort(), 30000)
  
  const response = await fetch('/api/auth/login', {
    signal: controller.signal,
    // ...
  })
  
  expect(response.ok).toBe(true)
})
```

#### Phase 4: Fix

```typescript
// src/api/auth/login.ts
export async function login(credentials: LoginCredentials) {
  const controller = new AbortController()
  setTimeout(() => controller.abort(), 30000)  // 30 second timeout
  
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    signal: controller.signal,
    body: JSON.stringify(credentials)
  })
  
  return response.json()
}
```

#### Phase 5: Verify

```bash
npm run test:run -- login-timeout.test.ts
# ✓ passes

npm run test:gate
# ✅ all gates pass
```

#### Phase 6: Prevent

```bash
cm_natural("remember that API timeout must be 30 seconds for slow connections, not 5 seconds")
```

---

## Next Steps

- [Code Review Process](./06-code-review.md) — Review the fix
- [Safe Deployment Pipeline](./09-safe-deploy.md) — Deploy the fix
- [Memory & Context Management](./11-memory-management.md) — Save learnings
