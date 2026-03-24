# Security

CodyMaster takes security seriously. Here's how the skill kit prevents and detects security vulnerabilities.

## Built-in Security Skills

| Skill | What it does |
|-------|-------------|
| **cm-secret-shield** | Pre-commit secret scanning, repo-wide pattern detection, token lifecycle management |
| **cm-identity-guard** | Verify git/deploy identity before push — prevents wrong-account deploys |
| **cm-quality-gate** | Layer 8: XSS scan + Gate 6: Snyk SAST integration |

## Security Rules in Code Generation

Five skills enforce security patterns when generating or reviewing code:

### cm-execution — Security Rules
- **Frontend:** No `innerHTML` without `escapeHtml()`, prefer `textContent`, validate URLs
- **Python:** All paths from config/input must use `safe_resolve()`, no `shell=True`
- **Node/Express:** Disable `x-powered-by`, set body limits, filter prototype pollution

### cm-planning — Scope Definition
Requires answering: *How will dynamic data be rendered?* before starting frontend work.

### cm-tdd — Security TDD
Every XSS, path traversal, or injection fix starts with a failing test.

### cm-code-review — Part D: Security Checklist
Mandatory security pass covering frontend, backend, and general patterns.

### cm-quality-gate — Automated Scans
- **Layer 8:** Grep scan for unescaped `innerHTML` patterns
- **Gate 6:** Snyk Code SAST with severity-based gate decisions

## Utilities

### sanitize.js (Frontend)
Shared utility loaded in all HTML pages:
- `escapeHtml(str)` — Prevents DOM XSS in innerHTML
- `escapeHtmlWithBreaks(str)` — Preserves `\n` as `<br>` while escaping HTML
- `escapeAttr(str)` — Prevents attribute injection

### safe_path.py (Python)
Path traversal prevention:
- `safe_resolve(base, path)` — Validates path stays within base directory
- `safe_join(base, *parts)` — Safe path joining
- `safe_open(base, path)` — Safe file open

## Audit Results (March 2026)

| Scan | Result |
|------|--------|
| Snyk Code (SAST) | ✅ 0 medium+ issues |
| innerHTML grep scan | ✅ 0 unescaped patterns |
| Secret scan | ✅ 0 real issues (2 false positives in docs) |

## Reporting Vulnerabilities

If you discover a security vulnerability, please report it responsibly by opening a private issue on [GitHub](https://github.com/tody-agent/codymaster/security).
