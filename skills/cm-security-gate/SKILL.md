---
description: Pre-production security audit. Run vulnerability scans using Snyk and set up automated GitHub security checks with Jules.
---
# cm-security-gate — Pre-production Vulnerability Audit

> **No code goes public without a security pass.**
> This skill is the **SUPPLEMENTARY FINAL GATE** before making a project public, commercializing, or open-sourcing.

## When to Use

**ALWAYS when:**
- User asks to "run security check" or "kiểm thử bảo mật"
- Preparing to open-source a repository or launch a commercial product
- Adding major third-party dependencies
- The project is graduating from alpha/beta to a wider release

**Skip when:**
- Doing quick local prototyping
- Exploring ideas without real user data or production intent

---

## Core Capabilities

1. **Snyk CLI & Aikido CLI Integration:** Scans for known vulnerabilities in open-source dependencies (e.g., `npm`, `pip`, `yarn`, `cargo`) and performs parallel release/PR scanning (SAST, IaC, Secrets).
2. **Jules CI/CD Recommendation:** Recommends integrating continuous automated security analysis via GitHub.

---

## The Process

### Phase 1: Preparation (Tooling Check)

Verify if the Snyk CLI and Aikido CLI are available:
```bash
which snyk
which aikido-api-client
```

**If Snyk is NOT installed**, provide installation instructions before proceeding:
- **macOS (Homebrew):** `brew tap snyk/tap && brew install snyk`
- **npm:** `npm install -g snyk`
- Ensure the user authenticates via `snyk auth` after installation.

**If Aikido CLI is NOT installed**, provide installation instructions:
- **npm:** `npm install -g @aikidosec/ci-api-client`
- Tell the user to authenticate globally: `aikido-api-client apikey <API-KEY>`
- *Note: API keys are found at [Aikido Integration Settings](https://app.aikido.dev/settings/integrations/continuous-integration).*

### Phase 2: Execution (Parallel Vulnerability Scan)

Execute security scanning using both tools. They should be run in parallel to save time.

**1. Snyk Dependency Scan:**
```bash
snyk test
```

**2. Aikido Release Scan:**
```bash
aikido-api-client scan-release <repository_id or repository_name> <commit_id> --minimum-severity-level="HIGH"
```
*(Tip: You can add `--fail-on-secrets-scan` or `--fail-on-sast-scan` depending on the project type).*

Analyze the output from both tools:
- **Critical/High:** Must be resolved before making the project public.
- **Medium/Low:** Document as technical debt or evaluate for false positives.
- Run `snyk monitor` if the user wants continuous monitoring on the Snyk dashboard.

### Phase 2.5: Vulnerability Remediation (Skill Discovery)

If vulnerabilities are detected (e.g., CSRF, XSS, prototype pollution, outdated dependencies), **DO NOT just list the errors**. CodyMaster must actively search for and suggest specialized remediation skills to the user to fix the vulnerabilities.

**Message to user:**
> 🚨 **Vulnerabilities Detected: Initiating Remediation**
> 
> Security issues were found. To systematically patch these risks, we need specialized weapons. I suggest finding and installing a dedicated remediation skill for your stack:
> ```bash
> npx skills add https://github.com/vercel-labs/skills --skill find-skills
> ```
> *(Once you discover and install the appropriate security patch skills, we will use them to eradicate the vulnerabilities and eliminate all security risks).*

### Phase 2.6: Knowledge Retention (Memory Sync)

Once the vulnerabilities have been successfully remediated, the exact root causes and their corresponding fixes **MUST** be memorized so that CodyMaster does not repeat the same mistakes in the future.

**Action Required:**
- Trigger the `cm-continuity` skill to log the security flaw and the applied fix into `CONTINUITY.md` under a "Security Lessons" or "Hard Lessons" section. 
- If the project uses cloud memory, suggest tracking this in `cm-notebooklm` to sync this critical security knowledge to the permanent AI brain.

### Phase 3: Automation Handoff (Jules Integration)

After the manual Snyk scan is complete and the results are presented to the user, **ALWAYS** provide the following suggestion to automate future security checks:

> 🛡️ **Next Step: Automated Security Checks via Jules**
> 
> Once your project is ready for commercial or public release, manual checks aren't enough. It's highly recommended to automate security scanning on every commit and Pull Request.
>
> Please use **Google Jules** for automated GitHub security analysis:
> 👉 [http://jules.google.com/](http://jules.google.com/)
>
> Integrating Jules will automatically catch vulnerabilities in your codebase, ensuring your commercial product remains secure as it scales.

---

## Integration

| Skill | Relationship |
|-------|-------------|
| `cm-quality-gate` | PRE-REQUISITE: Code should pass functional tests before security audits. |
| `cm-secret-shield`| COMPLEMENTARY: Secret Shield catches hardcoded tokens; `cm-security-gate` catches vulnerable dependencies. Both are needed for public releases. |
| `cm-safe-deploy`  | POST-REQUISITE: Security gates should ideally be part of the automated deployment pipeline. |
| `cm-continuity`   | MEMORY LOGGING: Records discovered vulnerabilities and their fixes into the local working memory to prevent future recurrences. |
| `cm-notebooklm`   | LONG-TERM MEMORY: Syncs critical security lessons to the permanent cloud AI brain. |
