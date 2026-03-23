#!/usr/bin/env node
/**
 * Gate 5: Dist Asset Verification
 * Verifies critical files exist in public/ after build:html + docs:build.
 * Build can "succeed" but produce an incomplete output directory.
 */
const fs = require('fs');
const path = require('path');

const publicDir = 'public';
const langs = ['en', 'vi', 'zh', 'ru', 'ko', 'hi'];
const i18nNamespaces = ['common', 'home', 'pages', 'personas', 'skills', 'vs'];

// Critical HTML pages
const requiredHtml = [
  'index.html',
  'cli.html',
  'faq.html',
  'skills.html',
  'story.html',
  'start.html',
  'playbook.html',
];

// Critical JS files
const requiredJs = [
  'js/kit.js',
  'js/ga-events.js',
];

// Critical CSS files
const requiredCss = [
  'css/kit.css',
  'css/home.css',
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

// i18n files for all languages × namespaces
for (const lang of langs) {
  for (const ns of i18nNamespaces) {
    required.push(path.join(publicDir, 'i18n', lang, `${ns}.json`));
  }
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
