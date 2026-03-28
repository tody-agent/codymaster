#!/usr/bin/env node
/**
 * Gate 0: Secret Hygiene
 * Fastest gate (< 0.5s). Checks for leaked secrets before anything else runs.
 */
const fs = require('fs');
const { execSync } = require('child_process');

let failed = false;

// 1. Check wrangler config files for hardcoded secret values
const wranglerFiles = ['wrangler.toml', 'wrangler.jsonc', 'wrangler.json'];
const dangerous = [
  'SERVICE_KEY', 'ANON_KEY', 'DB_PASSWORD', 'SECRET_KEY', 'PRIVATE_KEY', 'API_SECRET',
  'GCP_SERVICE_ACCOUNT', 'AZURE_CONNECTION_STRING', 'HEROKU_API_KEY', 'POSTMAN_API_KEY'
];

for (const wf of wranglerFiles) {
  if (!fs.existsSync(wf)) continue;
  const src = fs.readFileSync(wf, 'utf-8');
  for (const key of dangerous) {
    const valuePattern = new RegExp(key + '\\s*[=:]\\s*["\'][a-zA-Z0-9/+=]{20,}', 'g');
    if (valuePattern.test(src)) {
      console.error('❌ DANGEROUS: ' + wf + ' contains a ' + key + ' VALUE');
      console.error('   Fix: wrangler secret put ' + key + ' (then remove from ' + wf + ')');
      failed = true;
    }
  }
}

// 2. Check .gitignore has required patterns
if (fs.existsSync('.gitignore')) {
  const gi = fs.readFileSync('.gitignore', 'utf-8');
  const required = ['.env', '.dev.vars'];
  const missing = required.filter(r => !gi.includes(r));
  if (missing.length > 0) {
    console.error('❌ .gitignore missing: ' + missing.join(', '));
    failed = true;
  }
} else {
  console.error('❌ No .gitignore found!');
  failed = true;
}

// 3. Check .env / .dev.vars files aren't tracked by git
try {
  const tracked = execSync('git ls-files', { encoding: 'utf-8' });
  const badFiles = ['.env', '.dev.vars', '.env.local', '.env.production'];
  const trackedBad = badFiles.filter(f => tracked.split('\n').includes(f));
  if (trackedBad.length > 0) {
    console.error('❌ CRITICAL: Secret files tracked by git: ' + trackedBad.join(', '));
    console.error('   Fix: git rm --cached ' + trackedBad.join(' '));
    failed = true;
  }
} catch (e) {
  // Not a git repo — skip
}

if (failed) {
  console.error('\n🛡️  Gate 0 FAILED. Fix issues above before deploying.');
  process.exit(1);
}
console.log('✅ Gate 0 passed: secret hygiene verified');
