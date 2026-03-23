#!/usr/bin/env node
/**
 * Gate 6: Post-Deploy Smoke Test
 * Verifies the deployed site returns HTTP 200.
 * Usage: node scripts/gate-6-smoke-test.js [optional-url]
 */

const DEPLOY_URL = process.argv[2] || process.env.DEPLOY_URL || 'https://cody-master.pages.dev';

async function smokeTest() {
  console.log(`🔍 Smoke testing: ${DEPLOY_URL}`);

  try {
    const res = await fetch(DEPLOY_URL);
    if (res.status === 200) {
      console.log(`✅ Gate 6 passed: HTTP ${res.status} from ${DEPLOY_URL}`);
    } else {
      console.error(`❌ Gate 6 FAILED: HTTP ${res.status} from ${DEPLOY_URL}`);
      console.error('   ⚠  Consider immediate rollback.');
      process.exit(1);
    }
  } catch (err) {
    console.error(`❌ Gate 6 FAILED: Could not reach ${DEPLOY_URL}`);
    console.error(`   Error: ${err.message}`);
    console.error('   ⚠  Consider immediate rollback.');
    process.exit(1);
  }
}

smokeTest();
