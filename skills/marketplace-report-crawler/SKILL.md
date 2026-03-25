---
name: marketplace-report-crawler
description: |
  Automated marketplace report crawler for Shopee, Lazada, TikTok seller portals.
  Uses CSV-based account config with credential security. Includes dashboard,
  activity/bug logging, and progress reporting.

  SECURITY: AI MUST NEVER read username/password columns from accounts.csv.
  Use get-credential.js to retrieve credentials for browser-only use.

  ALWAYS trigger for: marketplace report, crawl data, download marketplace report, export shopee,
  export lazada, export tiktok, GBS data, seller report, download seller report,
  "aggregate reports", "crawl marketplace", "data crawling", "seller data",
  "marketplace income", "ads report", "affiliate report", "advertising report",
  "wallet statement", "shipping fee", "shipping cost"
---

# Marketplace Report Crawler v2.0

## Key Principle: Agent-Native + Session Persistence

> **Login happens ONCE. OTP is entered ONCE. Sessions are saved FOREVER.**

Marketplaces require OTP/CAPTCHA to login. OTP codes are held by customers/accountants
and can't be requested repeatedly. Therefore:

1. **First login**: AI agent uses its OWN browser to login (bypasses CAPTCHA naturally)
2. **Export cookies**: After login, cookies are saved to disk
3. **Future runs**: Inject saved cookies → skip login entirely
4. **Only re-login**: When session actually expires (rare)

## 🔒 Security Rules

> **CRITICAL**: These rules MUST be followed at all times.

1. **NEVER** read/log/print `username`/`password` columns from `accounts.csv`
2. **ONLY** use helper scripts to access credentials:
   - `node scripts/get-credential.js <id> username` → raw username
   - `node scripts/get-credential.js <id> password` → raw password
3. Credentials go **directly** into browser form fields — never stored in context

## Architecture

```
scripts/
├── get-login-info.js    # Platform config (URL, selectors) — NO credentials
├── get-credential.js    # Raw credential value for browser fill
├── session-store.js     # Cookie persistence (save/check/inject/list)
├── auto-login.js        # Automated login (agent-browser) + agent-delegate
├── pipeline.js          # Sequential pipeline orchestrator
├── csv-reader.js        # CSV parser with credential masking
├── logger.js            # Activity + Bug logging
└── run-report.js        # Progress report generator

config/
├── accounts.csv         # 🔐 Credentials (gitignored)
├── pipeline-config.json # Platform selectors, timeouts
└── report-types.json    # 25 report type definitions

~/.marketplace-crawler/sessions/  # Persistent cookie storage
└── <account_id>/
    ├── cookies.json
    └── session-meta.json
```

## Workflow: First-Time Login (One-Time)

### Step 1: Get Login Info
```bash
node scripts/get-login-info.js zott-lazada
# Returns: { loginUrl, platform, dashboardUrl, loginSelectors }
```

### Step 2: Login via Agent Browser

Use YOUR browser tool (browser_subagent / Claude browser / Manus Chrome):

1. Navigate to the `loginUrl` from step 1
2. Get credentials:
   ```bash
   node scripts/get-credential.js zott-lazada username  # → nguy...@zott.vn
   node scripts/get-credential.js zott-lazada password  # → raw password
   ```
3. Fill username into the login form
4. Fill password
5. Click login button
6. **If CAPTCHA**: Solve it visually (your browser looks like a real user)
7. **If OTP**: Ask user for the 6-digit code, enter it
8. Verify you reached the dashboard

### Step 3: Export & Save Cookies

After successful login, run this in the browser console:
```javascript
// Get all cookies for the current domain
const cookies = document.cookie.split(';').map(c => {
  const [name, ...rest] = c.trim().split('=');
  return { name, value: rest.join('='), domain: location.hostname, path: '/' };
});
JSON.stringify(cookies);
```

Save the output:
```bash
echo '<cookies_json>' | node scripts/session-store.js save zott-lazada agent-browser
```

### Step 4: Verify Session Saved
```bash
node scripts/session-store.js list
node scripts/session-store.js check zott-lazada
```

## Workflow: Subsequent Runs (Automatic)

```bash
# 1. Check if session is still valid
node scripts/session-store.js check zott-lazada

# 2. Inject cookies and navigate to dashboard
node scripts/session-store.js inject zott-lazada
# → Outputs JS to set cookies in browser

# 3. Run pipeline for reports
node scripts/pipeline.js --period 202603 --platform lazada --dry-run
node scripts/pipeline.js --period 202603 --platform lazada
```

## Auto-Login Fallback

For accounts without CAPTCHA/OTP challenges, `auto-login.js` can automate login:

```bash
# Automated login via agent-browser CLI
node scripts/auto-login.js --account zott-lazada --headed

# If CAPTCHA detected → exits with code 2 + JSON with screenshot
# Agent then takes over with its own browser

# After agent solves challenge:
node scripts/auto-login.js --account zott-lazada --verify
```

## Pipeline Commands

```bash
# Dry run — see what will happen
node scripts/pipeline.js --period 202603 --dry-run

# Run specific platform
node scripts/pipeline.js --period 202603 --platform lazada

# Run single account
node scripts/pipeline.js --period 202603 --account zott-lazada --headed

# Resume after interruption
node scripts/pipeline.js --period 202603 --resume
```

## Report Types (25 total)

| Platform | Reports | Format |
|----------|---------|--------|
| Shopee (7) | Income, PDF Report, Wallet, Affiliate Invoice/Product, Ads, Ads Wallet | Excel/PDF |
| Lazada (7) | Income, PDF Report, Wallet, Ads Onsite/Product, Ads Wallet, Shipping Fee | Excel/PDF |
| TikTok (7) | Income, Wallet, Affiliate Orders/Invoice, Ads Dashboard/Cost/Revenue | Excel |

## Session Store Commands

```bash
node scripts/session-store.js save <id>           # Save cookies from stdin
node scripts/session-store.js check <id>           # Check validity
node scripts/session-store.js inject <id>          # Output injection JS
node scripts/session-store.js list                 # List all sessions
node scripts/session-store.js export-script <id>   # Browser export helper
```
