---
name: cm-secret-shield
description: "Defense-in-depth security for AI-assisted development. Pre-commit secret scanning (Gitleaks + native fallback), repo-wide pattern detection, token lifecycle management, and AI agent safety rules. Prevents secret leaks at every stage: write → commit → push → deploy. Use BEFORE any git push or deploy, or when setting up new projects."
---

# 🛡️ Secret Shield — Defense-in-Depth Security

> **Secrets leak at FIVE stages. Guard ALL five.**
> Write → Commit → Push → Deploy → Runtime
> One missed stage = one leaked key = one compromised system.

## The Iron Laws

```
NEVER commit secrets. EVER.
NEVER output secrets in logs, chat, or AI responses.
NEVER trust .gitignore alone — it doesn't protect git history.
PRE-COMMIT HOOKS are your FIRST line of defense.
ROTATION is not optional after a leak.
```

## When to Use

**ALWAYS** when:
- Setting up a new project (called by `cm-project-bootstrap` Phase 0.5)
- Before first `git push` on any project
- After discovering a potential secret leak
- Setting up CI/CD pipelines
- Reviewing security posture of existing projects
- User says: "check secrets", "security audit", "leaked key", "rotate token"

**Integrates with:**
- `cm-project-bootstrap` — Security Foundation phase
- `cm-safe-deploy` — Gate 0 enhanced secret hygiene
- `cm-test-gate` — Layer 5 security scan
- `cm-identity-guard` — Token lifecycle management

---

## The 5 Defense Layers

```
┌─────────────────────────────────────────────────────────┐
│ Layer 1: WRITE GUARD         — AI agent behavior rules  │
│ Layer 2: PRE-COMMIT GUARD    — Block secrets at commit  │
│ Layer 3: REPO SCAN           — Full repo pattern check  │
│ Layer 4: DEPLOY GATE         — Pre-deploy secret audit  │
│ Layer 5: RUNTIME GUARD       — Env var hygiene & rotation│
└─────────────────────────────────────────────────────────┘
```

---

## Layer 1: Write Guard — AI Agent Safety Rules

> **Goal:** Prevent the AI agent itself from introducing secrets into code.

### Rules for AI Agents

```
✅ DO:
- Use environment variables: process.env.SECRET_KEY
- Use .dev.vars for local development
- Use platform-specific secret stores: wrangler secret put, Supabase vault
- Mask secrets in logs: console.log('Key:', key.slice(0,4) + '***')
- Reference secret NAMES, not VALUES

❌ NEVER:
- Hardcode API keys, tokens, or passwords in source code
- Put secrets in wrangler.jsonc, package.json, or any tracked file
- Output full secret values in chat, logs, or error messages
- Use placeholder secrets that look real (e.g., sk-1234567890abcdef)
- Store secrets in i18n files, README, or documentation
```

### Secret Patterns to NEVER Generate

```javascript
// ❌ NEVER write code like this:
const API_KEY = "sk-proj-abc123def456ghi789";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
const DB_PASSWORD = "<YOUR_SECURE_PASSWORD>";
fetch('https://api.example.com', { headers: { Authorization: 'Bearer <YOUR_TOKEN>' } });

// ✅ ALWAYS write code like this:
const API_KEY = process.env.API_KEY;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
// For Cloudflare Workers:
export default { async fetch(req, env) { const key = env.API_KEY; } };
```

---

## Layer 2: Pre-Commit Guard — Block Secrets at Commit

> **Goal:** Automatically scan staged files BEFORE they enter git history.

### Option A: Gitleaks (Recommended — Industry Standard)

#### Step 1: Install Gitleaks

```bash
# macOS
brew install gitleaks

# Linux
# Download from https://github.com/gitleaks/gitleaks/releases

# Verify installation
gitleaks version
```

#### Step 2: Create `.gitleaks.toml` (Project Root)

```toml
# .gitleaks.toml — Cody Master Secret Shield Configuration
title = "CM Secret Shield — Gitleaks Config"

# Extend default rules (catches 100+ known patterns)
[extend]
useDefault = true

# Custom rules for Cody Master projects
[[rules]]
id = "supabase-service-key"
description = "Supabase Service Role Key"
regex = '''eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+'''
tags = ["supabase", "jwt"]

[[rules]]
id = "cloudflare-api-token"
description = "Cloudflare API Token"
regex = '''[A-Za-z0-9_-]{40}'''
entropy = 4.5
secretGroup = 0
tags = ["cloudflare"]

[[rules]]
id = "generic-high-entropy"
description = "High entropy string that may be a secret"
regex = '''(?i)(api[_-]?key|secret[_-]?key|access[_-]?token|private[_-]?key|auth[_-]?token)\s*[=:]\s*['"][a-zA-Z0-9/+=]{20,}['"]'''
tags = ["generic"]

# Allow patterns (reduce false positives)
[allowlist]
paths = [
  '''\.gitleaks\.toml$''',
  '''\.dev\.vars\.example$''',
  '''node_modules/''',
  '''dist/''',
  '''\.git/'''
]
```

#### Step 3: Setup Git Pre-Commit Hook

```bash
# Create the hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# CM Secret Shield — Pre-Commit Guard
# Scans staged files for secrets before allowing commit

echo "🛡️ Secret Shield: scanning staged files..."

# Check if gitleaks is installed
if command -v gitleaks >/dev/null 2>&1; then
  gitleaks git --pre-commit --staged --verbose
  if [ $? -ne 0 ]; then
    echo ""
    echo "❌ SECRET DETECTED! Commit blocked."
    echo ""
    echo "To fix:"
    echo "  1. Remove the secret from your code"
    echo "  2. Use environment variables instead"
    echo "  3. If false positive: add to .gitleaks.toml allowlist"
    echo ""
    echo "To bypass (DANGEROUS): git commit --no-verify"
    exit 1
  fi
  echo "✅ Secret Shield: no secrets detected"
else
  # Fallback: basic pattern check without gitleaks
  echo "⚠️ Gitleaks not installed. Running basic checks..."
  STAGED=$(git diff --cached --name-only --diff-filter=ACM)
  PATTERNS="SERVICE_KEY|ANON_KEY|PRIVATE_KEY|DB_PASSWORD|SECRET_KEY|API_SECRET|sk-[a-zA-Z0-9]{20,}|-----BEGIN.*KEY-----"

  for file in $STAGED; do
    if echo "$file" | grep -qE '\.(js|ts|jsx|tsx|json|toml|yaml|yml|env|cfg|conf|ini)$'; then
      if git diff --cached "$file" | grep -qE "$PATTERNS"; then
        echo "❌ Potential secret found in: $file"
        echo "   Run: git diff --cached $file | grep -E '$PATTERNS'"
        exit 1
      fi
    fi
  done
  echo "✅ Basic check passed (install gitleaks for deeper scanning)"
fi
EOF

chmod +x .git/hooks/pre-commit
echo "✅ Pre-commit hook installed"
```

### Option B: Native Git Hook Only (No Dependencies)

For projects that can't install Gitleaks, the basic pattern check in the hook above works as a fallback.

---

## Layer 3: Repo Scan — Full Repository Audit

> **Goal:** Scan the entire repository for secrets that may have been committed before the pre-commit hook was set up.

### Quick Scan Script

```bash
# scripts/security-scan.js — Repo-wide secret detection
node -e "
const fs = require('fs');
const path = require('path');

const DANGEROUS_PATTERNS = [
  { name: 'Service Key Variable', regex: /(?:SERVICE_KEY|SERVICE_ROLE)\s*[=:]\s*['\"][a-zA-Z0-9._\/-]{20,}/g },
  { name: 'Anon Key Variable', regex: /ANON_KEY\s*[=:]\s*['\"][a-zA-Z0-9._\/-]{20,}/g },
  { name: 'Private Key Block', regex: /-----BEGIN\s+(RSA|EC|DSA|OPENSSH)?\s*PRIVATE KEY-----/g },
  { name: 'JWT Token', regex: /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g },
  { name: 'Generic API Key', regex: /(?:api[_-]?key|api[_-]?secret|access[_-]?token)\s*[=:]\s*['\"][a-zA-Z0-9\/+=]{20,}['\"/]/gi },
  { name: 'AWS Key', regex: /AKIA[0-9A-Z]{16}/g },
  { name: 'Slack Token', regex: /xox[baprs]-[0-9a-zA-Z-]{10,}/g },
  { name: 'GitHub Token', regex: /gh[ps]_[a-zA-Z0-9]{36,}/g },
  { name: 'Stripe Key', regex: /[sr]k_(test|live)_[a-zA-Z0-9]{20,}/g },
  { name: 'DB Password', regex: /(?:DB_PASSWORD|DATABASE_URL)\s*[=:]\s*['\"][^'\"]{8,}/gi },
];

const SKIP_DIRS = ['node_modules', '.git', 'dist', '.wrangler', '.next', 'coverage'];
const SCAN_EXTS = ['.js', '.ts', '.jsx', '.tsx', '.json', '.toml', '.yaml', '.yml',
                    '.env', '.cfg', '.conf', '.ini', '.md', '.html', '.jsonc'];

let findings = [];

function scanDir(dir) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (SKIP_DIRS.includes(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile() && SCAN_EXTS.some(ext => entry.name.endsWith(ext))) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        for (const pattern of DANGEROUS_PATTERNS) {
          const matches = content.match(pattern.regex);
          if (matches) {
            findings.push({ file: fullPath, pattern: pattern.name, count: matches.length });
          }
        }
      }
    }
  } catch (e) { /* skip unreadable dirs */ }
}

scanDir('.');

if (findings.length > 0) {
  console.error('❌ SECRET SCAN FOUND ' + findings.length + ' POTENTIAL ISSUES:');
  findings.forEach(f => {
    console.error('  ⚠ ' + f.file + ' — ' + f.pattern + ' (' + f.count + ' match(es))');
  });
  console.error('');
  console.error('Actions:');
  console.error('  1. Review each finding — some may be false positives');
  console.error('  2. Move real secrets to .dev.vars (local) or platform secrets (production)');
  console.error('  3. If secret was committed, rotate it IMMEDIATELY');
  process.exit(1);
} else {
  console.log('✅ Repo scan: no secrets detected in ' + SCAN_EXTS.length + ' file types');
}
"
```

### Add to package.json

```json
{
  "scripts": {
    "security:scan": "node scripts/security-scan.js",
    "security:precommit": "gitleaks git --pre-commit --staged || echo 'Install gitleaks for deep scan'"
  }
}
```

---

## Layer 4: Deploy Gate — Pre-Deploy Secret Audit

> **Goal:** Final check before code leaves the machine. Integrated with `cm-safe-deploy` Gate 0.

### Enhanced Gate 0 Check

```bash
# Run BEFORE deploy — catches what pre-commit might have missed
node -e "
const fs = require('fs');

// 1. Check tracked files for secrets
const dangerous = ['SERVICE_KEY', 'ANON_KEY', 'DB_PASSWORD', 'SECRET_KEY',
                   'PRIVATE_KEY', 'API_SECRET', 'AUTH_TOKEN'];

const filesToCheck = [
  'wrangler.jsonc', 'wrangler.toml', 'wrangler.json',
  'package.json', 'tsconfig.json',
  ...fs.readdirSync('src').filter(f => f.endsWith('.ts') || f.endsWith('.js')).map(f => 'src/' + f)
].filter(f => fs.existsSync(f));

let failed = false;

for (const file of filesToCheck) {
  const content = fs.readFileSync(file, 'utf-8');
  for (const key of dangerous) {
    // Check for actual values (not just variable names)
    const valuePattern = new RegExp(key + '\\\\s*[=:]\\\\s*[\"\\'][a-zA-Z0-9/+=]{20,}', 'g');
    if (valuePattern.test(content)) {
      console.error('❌ DANGER: ' + file + ' contains a ' + key + ' VALUE');
      failed = true;
    }
  }
}

// 2. Check .gitignore has required patterns
if (fs.existsSync('.gitignore')) {
  const gitignore = fs.readFileSync('.gitignore', 'utf-8');
  const required = ['.env', '.dev.vars'];
  const missing = required.filter(r => !gitignore.includes(r));
  if (missing.length > 0) {
    console.error('❌ .gitignore missing: ' + missing.join(', '));
    failed = true;
  }
}

// 3. Check .env files aren't tracked
const { execSync } = require('child_process');
try {
  const tracked = execSync('git ls-files', { encoding: 'utf-8' });
  const badFiles = ['.env', '.dev.vars', '.env.local', '.env.production'];
  const trackedBad = badFiles.filter(f => tracked.split('\\n').includes(f));
  if (trackedBad.length > 0) {
    console.error('❌ CRITICAL: Secret files tracked by git: ' + trackedBad.join(', '));
    console.error('   Fix: git rm --cached ' + trackedBad.join(' '));
    failed = true;
  }
} catch (e) { /* not a git repo */ }

if (failed) {
  console.error('\\n🛡️ Secret Shield: Deploy blocked. Fix issues above.');
  process.exit(1);
}
console.log('✅ Secret Shield: deploy gate passed');
"
```

---

## Layer 5: Runtime Guard — Token Lifecycle Management

> **Goal:** Manage secrets throughout their lifecycle — creation, usage, rotation, revocation.

### Token Rotation Schedule

| Platform | Token Type | Max Lifetime | Rotation Trigger |
|----------|-----------|-------------|-----------------|
| **Supabase** | `anon_key` | 90 days | Dashboard → Settings → API |
| **Supabase** | `service_role_key` | 30 days | Dashboard → Settings → API |
| **Cloudflare** | API Token | 90 days | Dashboard → My Profile → API Tokens |
| **GitHub** | Personal Access Token | 90 days | Settings → Developer Settings → PAT |
| **GitHub** | Fine-grained Token | 30-90 days | Use expiring tokens when possible |
| **OpenAI/Gemini** | API Key | 90 days | Rotate in platform dashboard |

### Secret Lifecycle File

Track secrets in `.secret-lifecycle.json` (add to `.gitignore`!):

```json
{
  "_WARNING": "This file tracks secret metadata ONLY. NEVER put actual values here.",
  "secrets": [
    {
      "name": "SUPABASE_ANON_KEY",
      "platform": "supabase",
      "store": "cloudflare-secrets",
      "createdAt": "2026-03-01",
      "rotateBy": "2026-06-01",
      "lastRotated": "2026-03-01",
      "status": "active"
    },
    {
      "name": "SUPABASE_SERVICE_KEY",
      "platform": "supabase",
      "store": "cloudflare-secrets",
      "createdAt": "2026-03-01",
      "rotateBy": "2026-04-01",
      "lastRotated": "2026-03-01",
      "status": "active"
    }
  ]
}
```

### Emergency Rotation Playbook

When a secret is leaked, follow this sequence **immediately**:

```
┌─────────────────────────────────────────────────────┐
│ 1. REVOKE — Disable the old key in platform dashboard│
│ 2. ROTATE — Generate a new key                       │
│ 3. UPDATE — Push new key to secret store             │
│ 4. DEPLOY — Redeploy affected services               │
│ 5. SCAN — Check git history for the old key          │
│ 6. SCRUB — Remove from git history if needed         │
│ 7. AUDIT — Review access logs for unauthorized use   │
└─────────────────────────────────────────────────────┘
```

#### Per-Platform Rotation Commands

**Supabase:**
```bash
# 1. Go to Supabase Dashboard → Project Settings → API
# 2. Click "Regenerate" on the compromised key
# 3. Update Cloudflare Secrets:
wrangler secret put SUPABASE_ANON_KEY      # Paste new value
wrangler secret put SUPABASE_SERVICE_KEY   # Paste new value
# 4. Update local .dev.vars with new values
# 5. Redeploy
npm run deploy:staging
```

**Cloudflare API Token:**
```bash
# 1. Dashboard → My Profile → API Tokens → Roll
# 2. Update any CI/CD systems using this token
# 3. Verify with: wrangler whoami
```

**GitHub Token:**
```bash
# 1. Settings → Developer Settings → PAT → Regenerate
# 2. Update gh auth: gh auth login
# 3. Verify: gh auth status
```

---

## Security Audit Checklist

Run this checklist for any project to assess its security posture:

```markdown
## 🛡️ Secret Shield Audit

### Layer 1: Write Guard
- [ ] No hardcoded secrets in source files
- [ ] Environment variables used for all secrets
- [ ] .dev.vars exists with local secrets (not committed)
- [ ] .dev.vars.example exists with placeholder names (committed)

### Layer 2: Pre-Commit Guard
- [ ] .git/hooks/pre-commit exists and is executable
- [ ] Gitleaks installed OR native fallback hook active
- [ ] .gitleaks.toml configured for project

### Layer 3: Repo Scan
- [ ] `npm run security:scan` passes clean
- [ ] No JWT tokens in tracked files
- [ ] No API keys in configuration files
- [ ] No private keys in repository

### Layer 4: Deploy Gate
- [ ] Gate 0 checks ALL source files (not just wrangler.jsonc)
- [ ] .gitignore includes: .env, .dev.vars, .env.local, .env.production
- [ ] No .env files tracked by git
- [ ] Cloudflare Secrets used for production values

### Layer 5: Runtime Guard
- [ ] .secret-lifecycle.json tracks all secrets (metadata only)
- [ ] No secrets past rotation deadline
- [ ] Emergency rotation playbook known by team
- [ ] Post-incident: keys rotated, history scrubbed
```

---

## Hardened .gitignore Template

Every project using Secret Shield should have AT MINIMUM these patterns:

```gitignore
# === Secret Shield: Mandatory Ignores ===

# Environment & secret files
.env
.env.*
!.env.example
!.env.test
.dev.vars
!.dev.vars.example

# Secret lifecycle tracking (contains metadata, not values)
.secret-lifecycle.json

# Platform-specific
.wrangler/
*.pem
*.key
*.p12
*.pfx

# OS artifacts
.DS_Store
Thumbs.db

# Dependencies
node_modules/

# Build output
dist/
build/
.next/
.nuxt/

# IDE
.vscode/settings.json
.idea/
```

---

## Red Flags — STOP

| Thought | Reality |
|---------|---------|
| "It's just a dev key" | Dev keys have the same permissions as prod keys |
| ".gitignore will protect me" | It can't remove what's already in git history |
| "I'll rotate it later" | Later = never. Rotate NOW. |
| "It was only exposed briefly" | Bots scan GitHub in real-time for leaked keys |
| "This is a private repo" | Private doesn't mean secured. Colleagues, CI, forks all have access |
| "The pre-commit hook is annoying" | 3-second scan vs. hours of incident response |
| "I'll add --no-verify just this once" | That "once" is when the leak happens |

---

## Integration

| Skill | Relationship |
|-------|-------------|
| `cm-project-bootstrap` | Phase 0.5 calls Secret Shield for initial security setup |
| `cm-safe-deploy` | Gate 0 uses Layer 4 enhanced secret audit |
| `cm-test-gate` | Layer 5 security test uses Layer 3 patterns |
| `cm-identity-guard` | Layer 5 token rotation extends identity lifecycle |
| `cm-quality-gate` | Secret shield is a prerequisite gate |

### Lifecycle Position

```
cm-project-bootstrap → cm-secret-shield (setup) → development cycle
                                                      ↓
                        cm-secret-shield (pre-commit) ← git commit
                        cm-secret-shield (gate 0)     ← cm-safe-deploy
                        cm-secret-shield (scan)       ← cm-test-gate
                        cm-secret-shield (rotation)   ← cm-identity-guard
```

## The Bottom Line

**5 layers. Every stage. No exceptions.**

Write Guard → Pre-Commit → Repo Scan → Deploy Gate → Runtime Guard.

A 3-second scan prevents a 3-day incident. This is non-negotiable.
