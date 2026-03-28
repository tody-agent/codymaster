#!/usr/bin/env node
/**
 * Gate 5: Dist Asset Verification
 * Verifies critical files exist in public/ after build:html + docs:build.
 * Build can "succeed" but produce an incomplete output directory.
 */
const fs = require('fs');
const path = require('path');

const publicDir = 'public';
// Critical HTML pages
const requiredHtml = [
  'dashboard/index.html',
];

// Critical JS files
const requiredJs = [
  'dashboard/app.js',
];

// Critical CSS files
const requiredCss = [
  'dashboard/style.css',
];

// Build required file list
const required = [];

// HTML pages
for (const html of requiredHtml) {
  required.push(path.join(publicDir, html));
}

// JS files
for (const js of requiredJs) {
  required.push(path.join(publicDir, js));
}

// CSS files
for (const css of requiredCss) {
  required.push(path.join(publicDir, css));
}


// Check all required files
const missing = required.filter(f => !fs.existsSync(f));

if (missing.length > 0) {
  console.error('❌ Missing critical files:');
  missing.forEach(f => console.error('   ' + f));
  console.error(`\n🔴 Gate 5 FAILED. ${missing.length} file(s) missing from build output.`);
  process.exit(1);
}

console.log(`✅ Gate 5 passed: all ${required.length} critical files present`);
