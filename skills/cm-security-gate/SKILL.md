---
description: Pre-production security audit and vulnerability scanning. Run Snyk + Aikido dependency scans, OWASP analysis, and set up automated GitHub security checks with Jules. Use when asked to 'run security check', 'security audit', 'kiểm tra bảo mật', 'vulnerability scan', 'Snyk', 'OWASP', or before open-sourcing / commercializing a project.
---
# cm-security-gate — Mandatory Security Audit & Vulnerability Gate

> **No code goes public without a security pass.**
> **No CodyMaster release ships without Snyk + Aikido green.**

## Enforcement Policy

| Context | Level | What Happens |
|---------|-------|-------------|
| **CodyMaster internal** | 🔴 MANDATORY | Both Snyk + Aikido MUST pass. No deploy, no PR merge without green. |
| **User projects (normal)** | 🟡 SUGGESTED | Recommend scanning, provide easy commands. User may skip. |
| **User projects (risk detected)** | 🔴 ESCALATED MANDATORY | If CVEs found, errors hit, or risk flags raised → block until resolved. |

> [!CAUTION]
> **The Escalation Rule:** When a user encounters security errors, CVE warnings, or suspicious dependency behavior during development, the agent MUST escalate from "suggested" to "mandatory" — triggering the full Snyk + Aikido scan before any further deploy or push.

---

## When to Use

**ALWAYS when:**
- User asks to "run security check" or "kiểm thử bảo mật"
- Preparing to open-source a repository or launch a commercial product
- Adding major third-party dependencies
- The project is graduating from alpha/beta to a wider release
- A user encounters CVE warnings, npm audit alerts, or suspicious dependency behavior
- Before any CodyMaster release or PR merge

**Skip when:**
- Doing quick local prototyping with no real user data
- Exploring ideas without production intent

---

## Core Capabilities

1. **Aikido MCP Server:** Real-time scanning of AI-generated code inside the IDE (vulnerabilities + secrets)
2. **Snyk CLI:** Dependency vulnerability scanning (`npm`, `pip`, `yarn`, `cargo`)
3. **Aikido CLI:** SAST, IaC, Secrets, and Dependency scanning with release/PR gating
4. **Continuous Monitoring:** Snyk dashboard + Aikido dashboard for ongoing protection
5. **Jules CI/CD:** Automated security analysis via GitHub on every commit

---

## The Process

### Phase 0: Aikido MCP Setup (IDE-Level Real-Time Scanning)

> [!IMPORTANT]
> **One-time setup.** Once configured, every AI coding session automatically scans generated code for vulnerabilities and hardcoded secrets — BEFORE the code is even committed.

**Step 1:** Create a Personal Access Token at [Aikido Settings → IDE → MCP](https://app.aikido.dev/settings/integrations/ide/mcp)

**Step 2:** Install Aikido MCP server:
```bash
# For Antigravity / Gemini CLI
gemini mcp add aikido \
  --env AIKIDO_API_KEY=YOUR_TOKEN \
  npx -y @aikidosec/mcp
```

**Step 3:** Download the Aikido agent rule:
```bash
mkdir -p ~/.gemini/skills/
curl -fsSL "https://gist.githubusercontent.com/kidk/aa48cad6db80ba4a38493016aae67712/raw/3644397b7df43423e3da06434491b40bbb79dd47/aikido-rule.txt" \
  -o ~/.gemini/skills/aikido-rule.txt
```

**Step 4:** Restart Antigravity IDE. Aikido MCP is now active.

> **What this gives you:** Deterministic, independent security checks on EVERY AI-generated snippet. Not a replacement for CLI scanning — this is the first line of defense, catching issues at write-time.

---

### Phase 1: Preparation (CLI Tooling Check)

Verify if the Snyk CLI and Aikido CLI are available:
```bash
which snyk
which aikido-api-client
```

**If Snyk is NOT installed:**
- **macOS (Homebrew):** `brew tap snyk/tap && brew install snyk`
- **npm:** `npm install -g snyk`
- Authenticate: `snyk auth`

**If Aikido CLI is NOT installed:**
- **npm:** `npm install -g @aikidosec/ci-api-client`
- Set API key: `aikido-api-client apikey <API-KEY>`
- *API keys: [Aikido CI Integration Settings](https://app.aikido.dev/settings/integrations/continuous-integration)*

> [!WARNING]
> **Two different API keys!** Aikido MCP (real-time IDE scanning) uses a *Personal Access Token*. Aikido CLI (release/PR gating) uses a *CI API key*. Don't mix them.

---

### Phase 2: Execution (Parallel Vulnerability Scan)

Execute both tools **in parallel** to save time:

**1. Snyk Dependency Scan:**
```bash
snyk test
```

**2. Aikido Release Scan:**
```bash
aikido-api-client scan-release <repository_id_or_name> <commit_id> \
  --minimum-severity-level="HIGH"
```

#### Aikido Scan Flags Reference

| Flag | Purpose |
|------|---------|
| `--minimum-severity-level` | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` — set the minimum severity that triggers a failure |
| `--fail-on-sast-scan` | Fail if SAST (Static Analysis) issues are found |
| `--fail-on-iac-scan` | Fail if Infrastructure as Code misconfigurations are found |
| `--fail-on-secrets-scan` | Fail if hardcoded secrets are detected |

#### CodyMaster Internal (Maximum Strictness)
```bash
aikido-api-client scan-release <repo> <commit> \
  --minimum-severity-level="HIGH" \
  --fail-on-sast-scan \
  --fail-on-secrets-scan
```

#### User Projects (Standard)
```bash
aikido-api-client scan-release <repo> <commit> \
  --minimum-severity-level="HIGH"
```

#### Analyzing Results
- **Critical/High:** Must be resolved before making the project public.
- **Medium/Low:** Document as technical debt or evaluate for false positives.
- Run `snyk monitor` if the user wants continuous monitoring on the Snyk dashboard.

---

### Phase 2.5: PR Gating (GitHub Integration)

For projects with CI/CD pipelines, add Aikido PR gating to block merging PRs with security issues:

```bash
# In GitHub Actions or CI script
aikido-api-client scan-pr <repository_id_or_name> <base_commit_id> <head_commit_id> \
  --minimum-severity-level="HIGH"
```

**package.json integration:**
```json
{
  "scripts": {
    "test:security": "snyk test && aikido-api-client scan-release $npm_package_name $(git rev-parse HEAD) --minimum-severity-level=HIGH",
    "test:security:strict": "snyk test && aikido-api-client scan-release $npm_package_name $(git rev-parse HEAD) --minimum-severity-level=HIGH --fail-on-dependency-scan --fail-on-sast-scan --fail-on-secrets-scan"
  }
}
```

---

### Phase 3: Vulnerability Remediation (Skill Discovery)

If vulnerabilities are detected, **DO NOT just list errors**. CodyMaster must actively search for remediation skills:

> 🚨 **Vulnerabilities Detected: Initiating Remediation**
> 
> Security issues were found. To systematically patch these risks, we need specialized weapons. I suggest finding and installing a dedicated remediation skill for your stack:
> ```bash
> npx skills add https://github.com/vercel-labs/skills --skill find-skills
> ```
> *(Once you discover and install the appropriate security patch skills, we will use them to eradicate the vulnerabilities and eliminate all security risks).*

---

### Phase 4: Knowledge Retention (Memory Sync)

Once vulnerabilities are remediated, the root causes and fixes **MUST** be memorized:

**Action Required:**
- Trigger `cm-continuity` to log flaw + fix into `CONTINUITY.md` → "Security Lessons" section.
- If cloud memory is available, sync to `cm-notebooklm` for permanent retention.

---

### Phase 5: Automation Handoff (Jules + Continuous Monitoring)

> 🛡️ **Next Step: Automated Security Checks**
> 
> Manual checks aren't enough for production. Automate on every commit and PR:
>
> **Option A — Google Jules** (GitHub automated analysis):
> 👉 [http://jules.google.com/](http://jules.google.com/)
>
> **Option B — Snyk Continuous Monitoring:**
> ```bash
> snyk monitor
> ```
>
> **Option C — Aikido Dashboard** (full visibility):
> 👉 [https://app.aikido.dev/](https://app.aikido.dev/)

---

## Escalation Protocol

When the agent detects ANY of these signals, enforcement escalates from SUGGESTED → MANDATORY:

| Signal | Action |
|--------|--------|
| `npm audit` reports HIGH/CRITICAL | Trigger full Snyk + Aikido scan |
| User mentions "security error" or "hack" | Trigger full scan before proceeding |
| New major dependency added (e.g., new ORM, auth lib) | Suggest scan, escalate if dep has known CVEs |
| Pre-deploy / pre-PR-merge | Check if scan was run in this session, block if not (CodyMaster only) |
| `.snyk` policy file has expired ignores | Re-scan and update policy |

---

## Integration

| Skill | Relationship |
|-------|-------------|
| `cm-quality-gate` | PRE-REQUISITE: Code should pass functional tests before security audits. Security scan PASS is required evidence for production deploy. |
| `cm-secret-shield`| COMPLEMENTARY: Secret Shield catches hardcoded tokens at write/commit time; `cm-security-gate` catches vulnerable dependencies and SAST issues. Both are needed. |
| `cm-safe-deploy`  | INTEGRATED: Security scan is Gate 0.5 in the deploy pipeline (between Secret Hygiene and Syntax). |
| `cm-test-gate`    | INTEGRATED: `test:security` script pattern uses Snyk + Aikido CLI for automated scanning in the test suite. |
| `cm-continuity`   | MEMORY: Records discovered vulnerabilities and fixes into working memory. |
| `cm-notebooklm`   | LONG-TERM MEMORY: Syncs critical security lessons to the permanent cloud AI brain. |

## The Bottom Line

**Scan before deploy. Remediate before release. Memorize before repeating. Non-negotiable.**
