# Security-Sensitive Work

> Guardian hooks, secret scanning, and security skills. This guide teaches you how to handle security-sensitive code with CodyMaster.

## Table of Contents

1. [Overview](#overview)
2. [Security Skills](#security-skills)
3. [Guardian Hooks](#guardian-hooks)
4. [Secret Scanning](#secret-scanning)
5. [Security Review](#security-review)
6. [Common Vulnerabilities](#common-vulnerabilities)
7. [Best Practices](#best-practices)

---

## Overview

### Why Security Matters

- **Data protection** — Prevent unauthorized access
- **Compliance** — Meet regulatory requirements
- **Trust** — Maintain user confidence
- **Liability** — Avoid legal consequences

### Security Skills

| Skill | Purpose |
|-------|---------|
| `cm-secret-shield` | Credential detection, rotation workflows |
| `cm-identity-guard` | Auth/authz review |
| `cm-security-gate` | Pre-merge OWASP audit |
| `cm-guardian-runtime` | Runtime security checks |

---

## Security Skills

### cm-secret-shield

```bash
# Scan for secrets
/cm-secret-shield scan

# Rotate secrets
/cm-secret-shield rotate

# Check pre-commit hooks
/cm-secret-shield hooks
```

### cm-identity-guard

```bash
# Verify account before push/deploy
/cm-identity-guard verify

# Check identity
/cm-identity-guard check
```

### cm-security-gate

```bash
# Run security audit
/cm-security-gate

# Check OWASP top 10
/cm-security-gate --owasp
```

---

## Guardian Hooks

### What are Guardian Hooks?

Guardian hooks are pre-commit and pre-push hooks that:
- Scan for secrets
- Check for vulnerabilities
- Enforce security policies
- Block unsafe commits

### Install Guardian Hooks

```bash
# Install hooks
cm hooks install

# Verify installation
ls -la .git/hooks/
# Should see:
# pre-commit
# commit-msg
# pre-push
```

### Hook Behavior

```bash
# Pre-commit hook
# 1. Scans for secrets
# 2. Checks for vulnerabilities
# 3. Enforces code style
# 4. Blocks if issues found

# Pre-push hook
# 1. Runs full test suite
# 2. Checks for secrets
# 3. Verifies build
# 4. Blocks if issues found
```

### Bypassing Hooks (Emergency Only)

```bash
# Skip pre-commit hook (emergency only)
git commit --no-verify -m "emergency fix"

# Skip pre-push hook (emergency only)
git push --no-verify
```

**Warning:** Only bypass hooks in emergencies. Always follow up with a proper commit.

---

## Secret Scanning

### Manual Scanning

```bash
# Scan entire codebase
npm run gate:secrets

# Scan specific directory
/cm-secret-shield scan --dir src/

# Scan for specific patterns
/cm-secret-shield scan --pattern "api_key|secret|password"
```

### Secret Patterns

```bash
# Common patterns to detect
- API keys (AWS, Google, Stripe)
- Passwords
- Private keys
- Connection strings
- Tokens (JWT, OAuth)
- Credentials
```

### Example Detection

```bash
# Secret found in code
❌ src/config.ts:15 - Hardcoded API key detected
   Pattern: AKIA[0-9A-Z]{16}
   
# Fix options:
# 1. Move to environment variable
# 2. Use secrets manager
# 3. Remove from code
```

### Environment Variables

```bash
# Check .env file
cat .env.example

# Should show:
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
# DATABASE_URL=
# JWT_SECRET=
```

### Gitignore

```bash
# Ensure .env is in .gitignore
cat .gitignore

# Should include:
# .env
# .env.local
# .env.*.local
```

---

## Security Review

### Pre-Merge Security Review

```bash
# Run security gate
/cm-security-gate

# This checks:
# - OWASP top 10
# - Authentication/authorization
# - Input validation
# - Output encoding
# - Error handling
# - Logging
```

### OWASP Top 10 Checklist

```markdown
## OWASP Top 10 Checklist

### A01: Broken Access Control
- [ ] Authorization checked on all endpoints
- [ ] No direct object references
- [ ] CORS properly configured
- [ ] Rate limiting enabled

### A02: Cryptographic Failures
- [ ] Passwords hashed with bcrypt
- [ ] Sensitive data encrypted at rest
- [ ] HTTPS enforced
- [ ] No weak algorithms

### A03: Injection
- [ ] SQL injection prevented (parameterized queries)
- [ ] XSS prevented (output escaping)
- [ ] Command injection prevented
- [ ] LDAP injection prevented

### A04: Insecure Design
- [ ] Threat modeling done
- [ ] Security requirements defined
- [ ] Defense in depth
- [ ] Secure design patterns

### A05: Security Misconfiguration
- [ ] Default credentials changed
- [ ] Error messages don't leak info
- [ ] Security headers configured
- [ ] Unnecessary features disabled

### A06: Vulnerable Components
- [ ] Dependencies up to date
- [ ] No known vulnerabilities
- [ ] Regular audits
- [ ] Automated scanning

### A07: Auth Failures
- [ ] Rate limiting on login
- [ ] Multi-factor authentication
- [ ] Session management secure
- [ ] Password policy enforced

### A08: Data Integrity Failures
- [ ] Input validation
- [ ] Serialization protected
- [ ] Integrity checks
- [ ] Secure update mechanism

### A09: Logging Failures
- [ ] Security events logged
- [ ] Logs protected
- [ ] Monitoring configured
- [ ] Alerting enabled

### A10: SSRF
- [ ] Input validation for URLs
- [ ] Allowlist for external requests
- [ ] Network segmentation
- [ ] Response validation
```

---

## Common Vulnerabilities

### 1. SQL Injection

**Vulnerable:**
```typescript
const query = `SELECT * FROM users WHERE id = ${userId}`
```

**Secure:**
```typescript
const query = 'SELECT * FROM users WHERE id = ?'
const result = await db.query(query, [userId])
```

### 2. XSS (Cross-Site Scripting)

**Vulnerable:**
```tsx
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

**Secure:**
```tsx
import DOMPurify from 'dompurify'

const clean = DOMPurify.sanitize(userInput)
<div dangerouslySetInnerHTML={{ __html: clean }} />
```

### 3. CSRF (Cross-Site Request Forgery)

**Vulnerable:**
```typescript
app.post('/transfer', (req, res) => {
  // No CSRF protection
  transfer(req.body.amount)
})
```

**Secure:**
```typescript
import csrf from 'csurf'

app.use(csrf({ cookie: true }))

app.post('/transfer', (req, res) => {
  // CSRF token verified
  transfer(req.body.amount)
})
```

### 4. Path Traversal

**Vulnerable:**
```typescript
app.get('/file/:name', (req, res) => {
  const filePath = `./files/${req.params.name}`
  res.sendFile(filePath)
})
```

**Secure:**
```typescript
import path from 'path'

app.get('/file/:name', (req, res) => {
  const filePath = path.join('./files', req.params.name)
  if (!filePath.startsWith('./files')) {
    return res.status(403).send('Forbidden')
  }
  res.sendFile(filePath)
})
```

### 5. Weak Password Hashing

**Vulnerable:**
```typescript
const hash = crypto.createHash('md5').update(password).digest('hex')
```

**Secure:**
```typescript
import bcrypt from 'bcryptjs'

const hash = await bcrypt.hash(password, 12)
```

### 6. Hardcoded Secrets

**Vulnerable:**
```typescript
const API_KEY = 'sk-1234567890abcdef'
```

**Secure:**
```typescript
const API_KEY = process.env.API_KEY
if (!API_KEY) {
  throw new Error('API_KEY environment variable not set')
}
```

---

## Best Practices

### 1. Environment Variables

```bash
# Use environment variables for secrets
export AWS_ACCESS_KEY_ID=your-key
export DATABASE_URL=your-url

# Never commit .env files
echo ".env" >> .gitignore
```

### 2. Secrets Management

```bash
# Use a secrets manager
# - AWS Secrets Manager
# - HashiCorp Vault
# - Azure Key Vault
# - Google Secret Manager

# Example with AWS
aws secretsmanager get-secret-value --secret-id prod/myapp/db
```

### 3. Input Validation

```typescript
import Joi from 'joi'

const schema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required(),
  name: Joi.string().min(1).max(100).required()
})

const { error, value } = schema.validate(req.body)
if (error) {
  return res.status(400).json({ error: error.details[0].message })
}
```

### 4. Output Encoding

```typescript
import escape from 'escape-html'

// Encode output
res.send(`<p>${escape(userInput)}</p>`)
```

### 5. Rate Limiting

```typescript
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
})

app.use('/api/', limiter)
```

### 6. Security Headers

```typescript
import helmet from 'helmet'

app.use(helmet())
```

### 7. HTTPS

```typescript
import https from 'https'
import fs from 'fs'

const options = {
  key: fs.readFileSync('privkey.pem'),
  cert: fs.readFileSync('cert.pem')
}

https.createServer(options, app).listen(443)
```

### 8. Logging

```typescript
import winston from 'winston'

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
})

// Log security events
logger.info('Login attempt', { userId, ip, userAgent })
logger.error('Failed login', { userId, ip, reason })
```

### 9. Monitoring

```bash
# Monitor for security events
cm monitor --security

# Set up alerts
cm alerts configure \
  --failed-login 5 \
  --rate-limit 100 \
  --error-rate 0.01
```

### 10. Incident Response

```bash
# Document incident
cat >> incidents/$(date +%Y-%m-%d).md << 'EOF'
# Security Incident: [Date]

## Summary
[Brief description]

## Impact
[What was affected]

## Response
[What was done]

## Lessons Learned
[What to improve]
EOF
```

---

## Example: Security Review

### PR: Add payment processing

#### Step 1: Security Scan

```bash
/cm-security-gate

# Output:
# ⚠️ Security findings:
# - Hardcoded API key in src/payment.ts:15
# - Missing rate limiting on payment endpoint
# - No input validation on amount
```

#### Step 2: Fix Issues

```bash
# Fix 1: Move API key to env
sed -i 's/const API_KEY = "sk-123"/const API_KEY = process.env.STRIPE_API_KEY/' src/payment.ts

# Fix 2: Add rate limiting
cat >> src/payment.ts << 'EOF'
import rateLimit from 'express-rate-limit'

const paymentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5 // 5 requests per minute
})

app.use('/api/payment', paymentLimiter)
EOF

# Fix 3: Add input validation
cat >> src/payment.ts << 'EOF'
import Joi from 'joi'

const paymentSchema = Joi.object({
  amount: Joi.number().positive().max(10000).required(),
  currency: Joi.string().valid('usd', 'eur', 'gbp').required()
})
EOF
```

#### Step 3: Re-Scan

```bash
/cm-security-gate

# Output:
# ✅ No security findings
```

#### Step 4: Merge

```bash
gh pr merge [pr-number] --squash
/cm-safe-deploy
```

---

## Next Steps

- [Safe Deployment Pipeline](./09-safe-deploy.md) — Secure deployment
- [Code Review Process](./06-code-review.md) — Security review
- [Memory & Context Management](./11-memory-management.md) — Document security decisions
