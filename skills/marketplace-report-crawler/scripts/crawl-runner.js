/**
 * Marketplace Report Crawl Runner
 * ================================
 * Orchestrator that reads config files and generates crawl instructions
 * for the browser agent to execute.
 * 
 * UPDATED: Now reads from accounts.csv (via csv-reader.js) instead of accounts.json
 * Includes logging integration for activity & bug tracking.
 * 
 * Usage:
 *   node crawl-runner.js --platform shopee --brand "Vita Dairy" --period 202602
 *   node crawl-runner.js --list                    # List all report types
 *   node crawl-runner.js --setup-folders ./data     # Generate folder structure
 *   node crawl-runner.js --status ./data 202602     # Check download status
 *   node crawl-runner.js --dashboard                # Open dashboard
 */

const fs = require('fs');
const path = require('path');

// --- Load configs ---
const configDir = path.join(__dirname, '..', 'config');
const { loadAccounts, getAccountsByBrand, getBrands } = require(
  path.join(__dirname, '..', '..', '..', 'Marketplace_Report', 'scripts', 'csv-reader')
);
const logger = require(
  path.join(__dirname, '..', '..', '..', 'Marketplace_Report', 'scripts', 'logger')
);

let accountsList;
try {
  accountsList = loadAccounts();
} catch (e) {
  // Fallback to JSON if CSV not found
  try {
    const jsonAccounts = JSON.parse(fs.readFileSync(path.join(configDir, 'accounts.json'), 'utf8'));
    accountsList = jsonAccounts.accounts.filter(a => a.active).map(a => ({
      account_id: a.id,
      brand: a.brand,
      platform: a.platforms ? a.platforms[0] : '',
      chrome_profile: a.chromeProfile,
      active: 'true',
      hasCredentials: false,
    }));
    // Expand multi-platform accounts
    const expanded = [];
    jsonAccounts.accounts.filter(a => a.active).forEach(a => {
      a.platforms.forEach(p => {
        expanded.push({
          account_id: `${a.id}-${p}`,
          brand: a.brand,
          brandSlug: a.brandSlug,
          platform: p,
          chrome_profile: a.chromeProfile,
          active: 'true',
          hasCredentials: false,
        });
      });
    });
    accountsList = expanded;
  } catch (e2) {
    console.error('❌ Cannot load accounts from CSV or JSON:', e.message);
    process.exit(1);
  }
}

const reportTypesConfig = JSON.parse(fs.readFileSync(path.join(configDir, 'report-types.json'), 'utf8'));
const DEFAULT_OUTPUT_ROOT = path.join(__dirname, '..', '..', '..', 'Marketplace_Report', 'data');

// --- CLI argument parsing ---
const args = process.argv.slice(2);
const getArg = (name) => {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 ? args[idx + 1] : null;
};
const hasFlag = (name) => args.includes(`--${name}`);

// --- Commands ---

if (hasFlag('list')) {
  // List all report types grouped by platform
  console.log('\n📋 Report Types Registry\n');
  const byPlatform = {};
  reportTypesConfig.reportTypes.forEach(rt => {
    if (!byPlatform[rt.platform]) byPlatform[rt.platform] = [];
    byPlatform[rt.platform].push(rt);
  });
  
  Object.entries(byPlatform).forEach(([platform, reports]) => {
    console.log(`\n🏪 ${platform.toUpperCase()} (${reports.length} types)`);
    console.log('─'.repeat(60));
    reports.forEach(r => {
      const status = r.status === 'active' ? '✅' : '🔄';
      const priority = r.priority ? '⭐' : '  ';
      console.log(`  ${status} ${priority} ${r.id.padEnd(30)} ${r.frequency.padEnd(16)} ${r.exportFormat}`);
    });
  });
  
  console.log('\n\n👥 Accounts (from CSV):');
  const byBrand = {};
  accountsList.forEach(a => {
    if (!byBrand[a.brand]) byBrand[a.brand] = [];
    byBrand[a.brand].push(a.platform);
  });
  Object.entries(byBrand).forEach(([brand, platforms]) => {
    console.log(`  • ${brand}: ${platforms.join(', ')} ${accountsList.find(a => a.brand === brand)?.hasCredentials ? '🔑' : '⚠️ no credentials'}`);
  });
  
  process.exit(0);
}

if (hasFlag('status')) {
  // Check download status for a period
  const outputRoot = args[args.indexOf('--status') + 1] || DEFAULT_OUTPUT_ROOT;
  const period = args[args.indexOf('--status') + 2] || getPreviousMonth();
  
  console.log(`\n📊 Download Status for ${period}\n`);
  console.log(`📂 Root: ${outputRoot}\n`);
  
  let found = 0;
  let missing = 0;
  
  const brandGroups = {};
  accountsList.forEach(a => {
    if (!brandGroups[a.brand]) brandGroups[a.brand] = { brand: a.brand, brandSlug: a.brand.replace(/ /g, '_'), platforms: [] };
    if (!brandGroups[a.brand].platforms.includes(a.platform)) brandGroups[a.brand].platforms.push(a.platform);
  });
  Object.values(brandGroups).forEach(account => {
    console.log(`\n👤 ${account.brand}`);
    account.platforms.forEach(platform => {
      const reports = getReportsForPlatform(platform);
      reports.forEach(rt => {
        const platformDir = platform.charAt(0).toUpperCase() + platform.slice(1);
        const filePath = path.join(
          outputRoot, platformDir, account.brandSlug, rt.id,
          `${period}_${account.brandSlug}_${rt.id}.${rt.fileExtension}`
        );
        
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          const sizeKb = (stats.size / 1024).toFixed(1);
          console.log(`  ✅ ${platform}/${rt.id} (${sizeKb} KB)`);
          found++;
        } else {
          console.log(`  ❌ ${platform}/${rt.id}`);
          missing++;
        }
      });
    });
  });
  
  console.log(`\n📊 Summary: ${found} found, ${missing} missing\n`);
  process.exit(0);
}

if (hasFlag('plan')) {
  // Generate a crawl plan for the browser agent
  const platform = getArg('platform');
  const brand = getArg('brand');
  const period = getArg('period') || getPreviousMonth();
  const outputRoot = getArg('output') || DEFAULT_OUTPUT_ROOT;
  
  console.log('\n🗺️  Crawl Plan\n');
  console.log(`Platform: ${platform || 'ALL'}`);
  console.log(`Brand: ${brand || 'ALL'}`);
  console.log(`Period: ${period}`);
  console.log(`Output: ${outputRoot}\n`);
  
  const tasks = generateCrawlTasks(platform, brand, period, outputRoot);
  
  tasks.forEach((task, i) => {
    console.log(`\n--- Task ${i + 1}/${tasks.length} ---`);
    console.log(`Platform: ${task.platform}`);
    console.log(`Brand: ${task.brand}`);
    console.log(`Report: ${task.reportType.name} (${task.reportType.id})`);
    console.log(`URL: ${task.reportType.url}`);
    console.log(`Save to: ${task.outputPath}`);
    console.log(`Steps:`);
    task.reportType.exportSteps.forEach((step, j) => {
      console.log(`  ${j + 1}. ${step}`);
    });
  });
  
  console.log(`\n📋 Total tasks: ${tasks.length}`);
  process.exit(0);
}

if (hasFlag('dashboard')) {
  // Open dashboard in browser
  const dashboardPath = path.join(__dirname, '..', '..', '..', 'Marketplace_Report', 'dashboard', 'index.html');
  const { exec } = require('child_process');
  const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  exec(`${cmd} "${dashboardPath}"`);
  console.log(`\n📊 Opening dashboard: ${dashboardPath}\n`);
  logger.activity({ action: 'open_dashboard', message: 'Dashboard opened' });
  process.exit(0);
}

// --- Default: show help ---
console.log(`
🕷️  Marketplace Report Crawl Runner
====================================

Commands:
  --list                          List all report types & accounts
  --status <output_root> <YYYYMM> Check download status
  --plan [options]                Generate crawl plan for browser agent
  --dashboard                     Open dashboard in browser

Plan options:
  --platform <shopee|lazada|tiktok>  Filter by platform
  --brand <brand_name>               Filter by brand  
  --period <YYYYMM>                  Target period (default: previous month)
  --output <path>                    Output root directory

Examples:
  node crawl-runner.js --list
  node crawl-runner.js --status ./data 202602
  node crawl-runner.js --plan --platform shopee --brand "Vita Dairy" --period 202602
  node crawl-runner.js --plan --platform lazada --period 202602
  node crawl-runner.js --dashboard
`);

// --- Helper functions ---

function getPreviousMonth() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.getFullYear().toString() + (d.getMonth() + 1).toString().padStart(2, '0');
}

function getReportsForPlatform(platform) {
  const seen = new Set();
  return reportTypesConfig.reportTypes.filter(rt => {
    if (rt.platform !== platform || rt.status === 'disabled') return false;
    if (seen.has(rt.id)) return false;
    seen.add(rt.id);
    return true;
  });
}

function generateCrawlTasks(platform, brand, period, outputRoot) {
  const tasks = [];
  const brandGroups = {};
  accountsList.forEach(a => {
    if (!brandGroups[a.brand]) brandGroups[a.brand] = { brand: a.brand, brandSlug: a.brand.replace(/ /g, '_'), platforms: [], chromeProfile: a.chrome_profile };
    if (!brandGroups[a.brand].platforms.includes(a.platform)) brandGroups[a.brand].platforms.push(a.platform);
  });
  const targetAccounts = Object.values(brandGroups).filter(a => {
    if (brand && a.brand !== brand) return false;
    return true;
  });
  
  targetAccounts.forEach(account => {
    const targetPlatforms = platform ? [platform] : account.platforms;
    targetPlatforms.forEach(p => {
      if (!account.platforms.includes(p)) return;
      const reports = getReportsForPlatform(p);
      reports.forEach(rt => {
        const platformDir = p.charAt(0).toUpperCase() + p.slice(1);
        const outputPath = path.join(
          outputRoot, platformDir, account.brandSlug, rt.id,
          `${period}_${account.brandSlug}_${rt.id}.${rt.fileExtension}`
        );
        tasks.push({
          platform: p,
          brand: account.brand,
          brandSlug: account.brandSlug,
          chromeProfile: account.chromeProfile,
          reportType: rt,
          period,
          outputPath
        });
      });
    });
  });
  
  return tasks;
}

module.exports = { generateCrawlTasks, getReportsForPlatform, getPreviousMonth };
