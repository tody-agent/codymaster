---
name: cm-quality-gate
description: "Use before any deployment or completion claim. Enforces test gates, evidence-based verification, and frontend safety checks. No deploy without passing. No claims without evidence."
---

# Quality Gate — Test + Verify + Ship Safe

> **Role: QA Lead** — You enforce test gates, evidence-based verification, and frontend safety. No deploy without passing you.

> **Three checkpoints, one skill:** Pre-deploy testing, evidence verification, frontend safety.

## The Iron Laws
1. **NO DEPLOY** without passing `test:gate`.
2. **NO CLAIMS** without fresh verification output.
3. **NO FRAGILE FRONTEND** — safety tests are mandatory.

---

## Phase 0: Infrastructure Setup
> **Goal:** Identify the framework and install the correct testing dependencies.

1.  **Detect Stack:** Check `package.json` for framework (React, Vue, Astro, etc.) and `wrangler.json(c)`.
2.  **Install Deps:** `npm install -D vitest jsdom acorn`
3.  **Configure:** Create `vitest.config.ts` or `vite.config.ts` with `environment: 'jsdom'`.
4.  **Wire Scripts:**
    ```json
    {
      "scripts": {
        "test:gate": "vitest run --reporter=verbose"
      }
    }
    ```

---

## Phase 1: The 4 Core Test Layers
Do not combine these files. They form the "Quality Gate."

### Layer 1: Frontend Safety (`test/frontend-safety.test.ts`)
Prevents white screens, template corruption, and syntax errors.
```javascript
test('app.js does not contain catastrophic corruption', () => {
    const code = fs.readFileSync('public/static/app.js', 'utf-8');
    expect(code).not.toMatch(/=\s*'[^']*\$\{t\(/); // Bug #1
    expect(code).not.toMatch(/<\s+[a-zA-Z]/); // Bug #2
});
```

### Layer 2: API Routes (`test/api-routes.test.ts`)
Ensures backend endpoints respond correctly.

### Layer 3: Business Logic (`test/business-logic.test.ts`)
Tests pure functions, validations, and transformations.

### Layer 4: i18n Synchronization (`test/i18n-sync.test.ts`)
Guarantees all language files have identical key counts.

---

## Phase 2: Execution (The Gates)

### Gate 1: Pre-Deploy Testing
**ALWAYS** run `npm run test:gate` before deploying. 0 failures required.

### Protocol

1.  **Check for skip override** (explicit user words only):
    -   ✅ "skip tests", "skip testing", "deploy without testing"
    -   ❌ "deploy", "quick deploy", "just push it" (= tests required)

2.  **Run test gate:**
    ```bash
    npm run test:gate
    ```

3.  **Parse results:** total files, total tests, failures, duration

4.  **Gate decision:**
    -   0 failures → proceed to deploy
    -   Any failures → **STOP. Fix first. Do NOT deploy.**

### Anti-Patterns

| DON'T | DO |
|-------|-----|
| Deploy then test | Test then deploy |
| "Tests passed earlier" | Run fresh test:gate NOW |
| Skip for "small changes" | Every change gets tested |
| Run test + deploy parallel | Sequential: test → gate → deploy |

### Gate 2: Evidence Before Claims
**ALWAYS** run the proving command before saying "fixed" or "done."

### The Gate Function

```
1. IDENTIFY → What command proves this claim?
2. RUN → Execute the FULL command (fresh)
3. READ → Full output, check exit code
4. VERIFY → Does output confirm the claim?
5. ONLY THEN → Make the claim
```

### Common Failures

| Claim | Requires | Not Sufficient |
|-------|----------|----------------|
| Tests pass | Test output: 0 failures | "Should pass", previous run |
| Build succeeds | Build: exit 0 | Linter passing |
| Bug fixed | Test symptom: passes | Code changed, assumed fixed |
| Requirements met | Line-by-line checklist | Tests passing |

### Red Flags — STOP
- Using "should", "probably", "seems to"
- Expressing satisfaction before verification
- Trusting agent success reports
- ANY wording implying success without running verification

### Gate 3: Frontend Integrity
Automated via Layer 1 above.

### When
Setting up or enhancing test suites for projects with frontend JavaScript/TypeScript.

### The 7 Layers

| Layer | What it checks | Priority |
|-------|---------------|----------|
| 1. Syntax Validation | JS parses without errors (via acorn) | **CRITICAL** |
| 2. Function Integrity | Named functions exist and are callable | Required |
| 3. Template Safety | HTML templates have matching tags | Required |
| 4. Asset References | Referenced files actually exist | Required |
| 5. Corruption Patterns | Known bad patterns (empty functions, truncation) | Required |
| 6. Import/Export | Module references resolve | Recommended |
| 7. CSS Validation | CSS files parse correctly | Recommended |
| 8. XSS/Injection Safety | No unescaped innerHTML with dynamic data | **CRITICAL** |

### Layer 8: XSS/Injection Safety (Learned: March 2026)

```javascript
import { execSync } from 'child_process';

test('no unescaped innerHTML with dynamic data', () => {
  // Scan all JS files for innerHTML with template literals NOT using escape
  const result = execSync(
    `grep -rn 'innerHTML.*\\\${' public/js/*.js | grep -v 'esc\\|SecurityUtils' || true`,
    { encoding: 'utf-8' }
  );
  expect(result.trim()).toBe(''); // Must be empty = all escaped
});

test('sanitize.js loaded in all HTML pages', () => {
  const htmlFiles = execSync('ls public/*.html', { encoding: 'utf-8' }).trim().split('\n');
  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    if (content.includes('kit.js')) {
      expect(content).toContain('sanitize.js'); // Must load before kit.js
    }
  }
});
```

### Setup

```bash
npm install -D vitest acorn
```

### Layer 1: Syntax Check (Most Critical)

```javascript
import { parse } from 'acorn';
import { readFileSync } from 'fs';

test('app.js has valid syntax', () => {
  const code = readFileSync('public/static/app.js', 'utf-8');
  expect(() => parse(code, { ecmaVersion: 2022, sourceType: 'script' })).not.toThrow();
});
```

> This single test would have prevented the March 2026 white-screen incident.

---

### Gate 4: Update Working Memory

Per `_shared/helpers.md#Update-Continuity`

After ALL gates pass → record `✅ Quality gate passed: [test count] tests, 0 failures`

After ANY gate fails → **FIRST run Memory Integrity Check:**
1. List active learnings/decisions for the failing module
2. Ask: "Did AI follow a learning/decision that caused this failure?"
3. If YES → HEAL memory (invalidate/correct/scope-reduce) BEFORE recording new learning
4. Record meta-learning in `.cm/meta-learnings.json` if memory was the cause

---

### Gate 5: Quality Score Report

After all gates execute, output a numeric quality score:

```
🎯 Gate Score: 87/100
├── Secret Scan:      10/10 ✅
├── Syntax:           10/10 ✅
├── Tests:             8/10 ⚠️  (2 skipped tests)
├── i18n Parity:      10/10 ✅
├── Build:            10/10 ✅
├── Dist Verify:      10/10 ✅
├── Frontend Safety:   9/10 ✅
└── Coverage:          7/10 ⚠️  (75% vs 80% target)
```

**Scoring Rules:**
| Component | Max | How to Score |
|-----------|-----|-------------|
| Secret Scan | 10 | 10 = clean, 0 = any secret found |
| Syntax | 10 | 10 = no errors, 0 = parse fails |
| Tests | 15 | 15 = all pass, −2 per failure, −1 per skip |
| i18n | 10 | 10 = parity, −5 per mismatch |
| Build | 15 | 15 = clean build, 0 = build fails |
| Dist Verify | 10 | 10 = all files present, −2 per missing |
| Frontend Safety | 15 | 15 = all layers pass, −3 per failure |
| Coverage | 15 | 15 = ≥80%, scale down linearly |

**Thresholds:**
- **≥80** → ✅ **PASS** — safe to deploy
- **60-79** → ⚠️ **WARN** — deploy with caution, document risks
- **<60** → ❌ **FAIL** — fix before deploy

---

### Gate 6: Security Scan (Snyk Code) (Added: March 2026)

> Run SAST scan to catch path traversal, XSS, injection, and other vulnerabilities BEFORE deploy.

```bash
# If snyk CLI installed:
snyk code test --severity-threshold=high

# Gate decision:
# 0 HIGH findings → proceed
# Any HIGH findings → STOP. Fix before deploy.
# MEDIUM findings → review, add to .snyk if mitigated
```

**When findings are false positives:**
1. Verify the mitigation is real (e.g., `safe_resolve()` for path traversal, `esc()` for XSS)
2. Add to `.snyk` exclude with documentation explaining the mitigation
3. Never suppress without documenting WHY

**Scoring:**
| Component | Max | How to Score |
|-----------|-----|-------------|
| Security Scan | 10 | 10 = 0 HIGH, −5 per HIGH, −1 per unreviewed MEDIUM |

---

### Gate 7: i18n HTML Safety (Added: March 2026)

> Translation JSON files must NOT contain structural HTML markup (icons, links, scripts). Only safe formatting tags (`<strong>`, `<em>`, `<br>`, `<code>`) are acceptable. Structural HTML in translations conflicts with XSS sanitizers.

```bash
# Check for dangerous HTML in translation files
grep -rn '<i \|<a \|<script\|<svg\|onclick\|onerror\|href=' public/i18n/**/*.json || true

# Gate decision:
# 0 matches → proceed
# Any matches → STOP. Move HTML markup to templates, not translation values.
```

---

## Integration
| Skill | Relationship |
|-------|-------------|
| `cm-safe-deploy` | Quality gate is the primary blocker for the deploy pipeline |
| `cm-identity-guard` | Verify identity before using quality gate to ship |
| `cm-tdd` | TDD creates the logic for Layer 3 |
| `cm-safe-i18n` | Leverages Layer 4 for parity checks |

## The Bottom Line

**Test before deploy. Evidence before claims. Safety before shipping. Non-negotiable.**
