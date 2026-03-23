#!/usr/bin/env node
/**
 * Gate 1: Syntax Validation
 * Fast-fail (< 2s). Catches syntax errors before the slower test suite.
 * - Parses all JS files in public/js/ with acorn
 * - Runs tsc --noEmit for TypeScript in src/
 */
const { parse } = require('acorn');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let failed = false;

// 1. Parse all JS files in public/js/
const jsDir = 'public/js';
if (fs.existsSync(jsDir)) {
  const jsFiles = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));
  for (const file of jsFiles) {
    const filePath = path.join(jsDir, file);
    const code = fs.readFileSync(filePath, 'utf-8');
    try {
      parse(code, { ecmaVersion: 2022, sourceType: 'script' });
    } catch (err) {
      console.error(`❌ Syntax error in ${filePath}:`);
      console.error(`   Line ${err.loc?.line}, Column ${err.loc?.column}: ${err.message}`);
      failed = true;
    }
  }
  if (!failed) {
    console.log(`✅ ${jsFiles.length} JS files parsed successfully`);
  }
} else {
  console.log('⚠  No public/js/ directory found, skipping JS syntax check');
}

// 2. TypeScript compilation check
if (fs.existsSync('tsconfig.json')) {
  try {
    execSync('npx tsc --noEmit', { encoding: 'utf-8', stdio: 'pipe' });
    console.log('✅ TypeScript compilation check passed');
  } catch (err) {
    console.error('❌ TypeScript compilation errors:');
    console.error(err.stdout || err.stderr || err.message);
    failed = true;
  }
}

if (failed) {
  console.error('\n🔴 Gate 1 FAILED. Fix syntax errors before proceeding.');
  process.exit(1);
}
console.log('✅ Gate 1 passed: syntax validation complete');
