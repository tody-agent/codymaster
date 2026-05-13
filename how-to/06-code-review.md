# Code Review Process

> Professional review lifecycle with spec compliance and security checks. This guide teaches you how to conduct thorough code reviews that catch issues before they reach production.

## Table of Contents

1. [Overview](#overview)
2. [Review Preparation](#review-preparation)
3. [Running cm-code-review](#running-cm-code-review)
4. [Review Checklist](#review-checklist)
5. [Handling Feedback](#handling-feedback)
6. [Security Review](#security-review)
7. [Performance Review](#performance-review)
8. [Merging](#merging)

---

## Overview

### The Review Pipeline

```
Self-Review → cm-code-review → Address Feedback → Re-Review → Approve → Merge
```

### Skills Used

| Phase | Skill | Purpose |
|-------|-------|---------|
| Review | `cm-code-review` | Professional code review |
| Quality | `cm-quality-gate` | Verify quality standards |
| Security | `cm-security-gate` | Security-specific checks |

### Why Code Review Matters

- **Catch bugs** before they reach production
- **Enforce standards** across the team
- **Share knowledge** about the codebase
- **Prevent security vulnerabilities**
- **Ensure spec compliance**

---

## Review Preparation

### Before Requesting Review

```bash
# 1. Run quality gate
npm run test:gate

# 2. Self-review your changes
git diff main --stat
git diff main

# 3. Check for common issues
# - Hardcoded secrets
# - Missing tests
# - Console.log statements
# - TODO comments without tickets
# - Unused imports/variables
```

### Create Review Request

```bash
# Create PR with detailed description
gh pr create \
  --title "feat: add user authentication" \
  --body "## Summary
- Added login API endpoint
- Added login form component
- Added protected routes middleware
- Added JWT token handling

## Changes
- src/api/auth/login.ts (new)
- src/components/auth/LoginForm.tsx (new)
- src/middleware/auth.ts (new)
- test/api/auth/login.test.ts (new)

## Test Plan
- [x] Unit tests pass
- [x] Integration tests pass
- [x] Manual testing completed

## Screenshots
[Login form screenshot]

## Related Issues
Closes #123"
```

---

## Running cm-code-review

### Start Review

```bash
# Run code review
/cm-code-review
```

### What Reviewer Checks

#### 1. Spec Compliance

```markdown
## Spec Compliance Check

**Reference:** openspec/changes/[feature]/tasks.md

- [ ] All tasks completed
- [ ] Implementation matches design decisions
- [ ] No scope creep (changes outside spec)
- [ ] Edge cases handled as specified
```

#### 2. Logic Correctness

```markdown
## Logic Check

- [ ] Business logic correct
- [ ] Edge cases handled
- [ ] Error handling appropriate
- [ ] State management correct
- [ ] Concurrency issues addressed
```

#### 3. Code Quality

```markdown
## Code Quality Check

- [ ] Clear naming (no abbreviations)
- [ ] Functions do one thing
- [ ] No code duplication
- [ ] Comments explain "why", not "what"
- [ ] No dead code
```

#### 4. Security

```markdown
## Security Check

- [ ] No hardcoded secrets
- [ ] Input validation present
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Authentication/authorization correct
```

#### 5. Performance

```markdown
## Performance Check

- [ ] No unnecessary database queries
- [ ] Efficient algorithms (no N+1 queries)
- [ ] Proper caching
- [ ] No memory leaks
- [ ] Bundle size impact acceptable
```

#### 6. Testing

```markdown
## Test Check

- [ ] Tests cover main scenarios
- [ ] Tests cover edge cases
- [ ] Tests are readable
- [ ] Tests are maintainable
- [ ] No flaky tests
```

---

## Review Checklist

### For Every PR

```markdown
## Pre-Review Checklist

### Code Quality
- [ ] Code compiles/builds
- [ ] No lint errors
- [ ] No type errors
- [ ] Consistent code style
- [ ] Meaningful variable/function names

### Testing
- [ ] New code has tests
- [ ] Tests pass locally
- [ ] No test skips (.skip)
- [ ] Test coverage adequate

### Security
- [ ] No secrets in code
- [ ] Input validated
- [ ] Output escaped
- [ ] Auth checks present

### Documentation
- [ ] README updated (if needed)
- [ ] API docs updated (if needed)
- [ ] Changelog updated (if needed)

### Performance
- [ ] No obvious performance issues
- [ ] Database queries optimized
- [ ] Caching considered
```

### For Security-Sensitive Code

```markdown
## Security Checklist

### Authentication
- [ ] Passwords hashed with bcrypt
- [ ] Tokens have expiration
- [ ] Session management secure
- [ ] Rate limiting on auth endpoints

### Authorization
- [ ] Permission checks on all endpoints
- [ ] No direct object references
- [ ] Role-based access control
- [ ] Audit logging

### Input Validation
- [ ] All user input validated
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] File upload validation

### Secrets
- [ ] No hardcoded credentials
- [ ] Environment variables used
- [ ] Secrets not logged
- [ ] Secrets not in error messages
```

---

## Handling Feedback

### Receiving Feedback

```bash
# 1. Read all feedback
gh pr view [pr-number]

# 2. Understand the concern
# 3. Ask questions if unclear
# 4. Plan fixes
```

### Responding to Feedback

```markdown
## Response Template

### For valid feedback:
> Good catch! I've fixed this in commit [hash].
> The issue was [explanation].

### For unclear feedback:
> Can you clarify what you mean by [specific point]?
> I want to make sure I understand correctly.

### For disagreement:
> I understand your concern about [point].
> However, I chose this approach because [reason].
> What do you think about [alternative]?
```

### Making Changes

```bash
# 1. Create fix
git checkout -b fix/review-feedback

# 2. Make changes
# ... edit files ...

# 3. Commit with clear message
git commit -m "fix: address review feedback

- Added input validation (addressed @reviewer comment)
- Improved error messages
- Added missing test case"

# 4. Push and update PR
git push origin fix/review-feedback

# 5. Comment on PR
gh pr comment [pr-number] --body "Addressed all feedback. Ready for re-review."
```

### Re-Review

```bash
# After feedback addressed
/cm-code-review

# Reviewer will check:
# - All feedback addressed
# - No new issues introduced
# - Quality maintained
```

---

## Security Review

### When to Do Security Review

- Authentication/authorization changes
- Payment processing
- User data handling
- API endpoints
- File uploads
- Database queries

### Security Review Steps

```bash
# Run security gate
/cm-security-gate
```

### Security Checklist

```markdown
## Security Review Checklist

### OWASP Top 10

- [ ] **A01: Broken Access Control**
  - Authorization checked on all endpoints
  - No direct object references
  - CORS properly configured

- [ ] **A02: Cryptographic Failures**
  - Passwords hashed with bcrypt
  - Sensitive data encrypted at rest
  - HTTPS enforced

- [ ] **A03: Injection**
  - SQL injection prevented (parameterized queries)
  - XSS prevented (output escaping)
  - Command injection prevented

- [ ] **A04: Insecure Design**
  - Threat modeling done
  - Security requirements defined
  - Defense in depth

- [ ] **A05: Security Misconfiguration**
  - Default credentials changed
  - Error messages don't leak info
  - Security headers configured

- [ ] **A06: Vulnerable Components**
  - Dependencies up to date
  - No known vulnerabilities
  - Regular audits

- [ ] **A07: Auth Failures**
  - Rate limiting on login
  - Multi-factor authentication
  - Session management secure

- [ ] **A08: Data Integrity Failures**
  - Input validation
  - Serialization protected
  - Integrity checks

- [ ] **A09: Logging Failures**
  - Security events logged
  - Logs protected
  - Monitoring configured

- [ ] **A10: SSRF**
  - Input validation for URLs
  - Allowlist for external requests
  - Network segmentation
```

### Security Fixes

```bash
# Common security fixes

# 1. Add rate limiting
npm install express-rate-limit

# 2. Add CSRF protection
npm install csurf

# 3. Add helmet for security headers
npm install helmet

# 4. Add input validation
npm install joi

# 5. Add SQL injection prevention
# Use parameterized queries or ORM
```

---

## Performance Review

### Performance Checklist

```markdown
## Performance Review Checklist

### Database
- [ ] No N+1 queries
- [ ] Proper indexing
- [ ] Query optimization
- [ ] Connection pooling

### Caching
- [ ] Appropriate cache headers
- [ ] CDN usage
- [ ] Application-level caching
- [ ] Database query caching

### Frontend
- [ ] Bundle size optimized
- [ ] Code splitting
- [ ] Lazy loading
- [ ] Image optimization

### API
- [ ] Pagination implemented
- [ ] Response compression
- [ ] Rate limiting
- [ ] Timeout configuration
```

### Performance Testing

```bash
# Run performance tests
npm run test:performance

# Check bundle size
npm run build
du -sh dist/

# Analyze bundle
npx @next/bundle-analyzer
```

---

## Merging

### Pre-Merge Checklist

```bash
# 1. All checks passing
gh pr checks [pr-number]

# 2. Approvals received
gh pr view [pr-number] --json reviews

# 3. No conflicts
gh pr merge --check

# 4. Branch up to date
git fetch origin
git rebase origin/main
```

### Merge Strategies

```bash
# Squash merge (recommended for features)
gh pr merge [pr-number] --squash

# Merge commit (for complex features)
gh pr merge [pr-number] --merge

# Rebase merge (for linear history)
gh pr merge [pr-number] --rebase
```

### Post-Merge

```bash
# 1. Pull latest
git pull origin main

# 2. Delete feature branch
git branch -d feature/[name]
git push origin --delete feature/[name]

# 3. Verify deployment
/cm-safe-deploy

# 4. Update working memory
cm_natural("remember that [important decision from this PR]")
```

---

## Example: Complete Review

### PR: Add user authentication

#### Step 1: Self-Review

```bash
npm run test:gate
# ✅ All gates pass

git diff main --stat
# src/api/auth/login.ts      | 45 +++
# src/components/auth/LoginForm.tsx | 89 ++++
# src/middleware/auth.ts      | 23 ++
# test/api/auth/login.test.ts | 67 ++++
```

#### Step 2: Request Review

```bash
gh pr create \
  --title "feat: add user authentication" \
  --body "..."
```

#### Step 3: Review Feedback

Reviewer comments:
> - Missing rate limiting on login endpoint
> - Should use bcrypt instead of sha256
> - Missing test for invalid email format

#### Step 4: Address Feedback

```bash
# Fix rate limiting
npm install express-rate-limit

# Fix hashing
npm install bcryptjs

# Add missing test
cat >> test/api/auth/login.test.ts << 'EOF'
it('should reject invalid email format', async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'invalid-email',
      password: 'password123'
    })
  
  expect(response.status).toBe(400)
  expect(response.body.error).toBe('Invalid email format')
})
EOF
```

#### Step 5: Re-Review

```bash
/cm-code-review
# ✅ All feedback addressed
```

#### Step 6: Merge

```bash
gh pr merge [pr-number] --squash
git pull origin main
/cm-safe-deploy
```

---

## Next Steps

- [Security-Sensitive Work](./10-security-workflow.md) — Deep dive into security
- [Safe Deployment Pipeline](./09-safe-deploy.md) — Deploy after review
- [Memory & Context Management](./11-memory-management.md) — Document decisions
