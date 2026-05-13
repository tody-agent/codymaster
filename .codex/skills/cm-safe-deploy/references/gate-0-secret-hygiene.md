# Gate 0 — Secret Hygiene

> Fastest fail. Prevent secrets, tracked env files, and unsafe config from reaching a remote.

## Use When
- Before any deploy
- While setting up a deploy pipeline
- After any secret-related incident

## What This Gate Checks
- secrets embedded in deploy config
- missing `.gitignore` coverage for local secret files
- tracked `.env` or `.dev.vars` files
- dangerous secret placement in repo-managed config

## Essential Check
```bash
node -e "
const fs = require('fs');
const { execSync } = require('child_process');
const wranglerFiles = ['wrangler.jsonc', 'wrangler.toml', 'wrangler.json'];
const dangerous = ['SERVICE_KEY', 'ANON_KEY', 'DB_PASSWORD', 'SECRET_KEY', 'PRIVATE_KEY', 'API_SECRET'];
let failed = false;

for (const wf of wranglerFiles) {
  if (!fs.existsSync(wf)) continue;
  const src = fs.readFileSync(wf, 'utf-8');
  for (const key of dangerous) {
    const valuePattern = new RegExp(key + '\\\\s*[=:]\\\\s*[\"\\'][a-zA-Z0-9/+=]{20,}', 'g');
    if (valuePattern.test(src)) {
      console.error('❌ DANGEROUS: ' + wf + ' contains a ' + key + ' VALUE');
      failed = true;
    }
  }
}

if (fs.existsSync('.gitignore')) {
  const gi = fs.readFileSync('.gitignore', 'utf-8');
  const required = ['.env', '.dev.vars'];
  const missing = required.filter(r => !gi.includes(r));
  if (missing.length > 0) {
    console.error('❌ .gitignore missing: ' + missing.join(', '));
    failed = true;
  }
}

try {
  const tracked = execSync('git ls-files', { encoding: 'utf-8' });
  const badFiles = ['.env', '.dev.vars', '.env.local', '.env.production'];
  const trackedBad = badFiles.filter(f => tracked.split('\\n').includes(f));
  if (trackedBad.length > 0) {
    console.error('❌ tracked secret files: ' + trackedBad.join(', '));
    failed = true;
  }
} catch {}

if (failed) process.exit(1);
console.log('✅ Gate 0 passed');
"
```

## Remediation
- move secrets to platform secret managers
- scrub or untrack local secret files
- rotate any leaked values immediately

## Rule
If Gate 0 fails, do not continue to later gates.
