#!/usr/bin/env node
/**
 * 🛠️ CodyMaster Security Fixer
 * Automated remediation for security vulnerabilities and secret leaks.
 * 
 * Usage:
 *   node scripts/security-fixer.js          # Audit only
 *   node scripts/security-fixer.js --fix    # Audit + Fix
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DANGEROUS_PATTERNS = [
  { name: 'Service Key Variable', regex: /(?:SERVICE_KEY|SERVICE_ROLE)\s*[=:]\s*['\"][a-zA-Z0-9._\/-]{20,}/g },
  { name: 'Anon Key Variable', regex: /ANON_KEY\s*[=:]\s*['\"][a-zA-Z0-9._\/-]{20,}/g },
  { name: 'Private Key Block', regex: /-----BEGIN\s+(RSA|EC|DSA|OPENSSH)?\s*PRIVATE KEY-----/g },
  { name: 'JWT Token', regex: /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g },
  { name: 'Generic API Key', regex: /(?:api[_-]?key|api[_-]?secret|access[_-]?token)\s*[=:]\s*['\"][a-zA-Z0-9\/+=]{20,}['\"/]/gi },
  { name: 'AWS Key', regex: /AKIA[0-9A-Z]{16}/g },
  { name: 'Slack Token', regex: /xox[baprs]-[0-9a-zA-Z-]{10,}/g },
  { name: 'GitHub Token', regex: /gh[ps]_[a-zA-Z0-9]{36,}/g },
  { name: 'Stripe Key', regex: /[sr]k_(test|live)_[a-zA-Z0-9]{20,}/g },
  { name: 'DB Password', regex: /(?:DB_PASSWORD|DATABASE_URL)\s*[=:]\s*['\"][^'\"]{8,}/gi },
];

const SKIP_DIRS = ['node_modules', '.git', 'dist', '.wrangler', '.next', 'coverage', '.cm'];
const SCAN_EXTS = ['.js', '.ts', '.jsx', '.tsx', '.json', '.toml', '.yaml', '.yml',
                    '.env', '.cfg', '.conf', '.ini', '.md', '.html', '.jsonc'];

const args = process.argv.slice(2);
const shouldFix = args.includes('--fix');
const isDryRun = args.includes('--dry-run');

let findings = [];

function scanDir(dir) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (SKIP_DIRS.includes(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile() && SCAN_EXTS.some(ext => entry.name.endsWith(ext))) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        let fileStatus = { file: fullPath, issues: [] };
        
        for (const pattern of DANGEROUS_PATTERNS) {
          const matches = content.match(pattern.regex);
          if (matches) {
            fileStatus.issues.push({ pattern: pattern.name, matches: matches });
          }
        }
        
        if (fileStatus.issues.length > 0) {
          findings.push(fileStatus);
        }
      }
    }
  } catch (e) {}
}

console.log('🔍 Starting Security Audit...');
scanDir('.');

if (findings.length === 0) {
  console.log('✅ No vulnerabilities detected.');
  process.exit(0);
}

console.error(`❌ Found ${findings.length} files with issues:`);
findings.forEach(f => {
  console.error(`  ⚠ ${f.file}`);
  f.issues.forEach(i => console.error(`    - ${i.pattern}: ${i.matches.length} matches`));
});

if (shouldFix) {
  console.log('\n🔧 Applying Automated Remediation...');
  findings.forEach(f => {
    let content = fs.readFileSync(f.file, 'utf-8');
    let originalContent = content;

    f.issues.forEach(issue => {
      issue.matches.forEach(match => {
        const half = Math.floor(match.length / 2);
        const prefix = match.substring(0, Math.max(4, match.length - 12));
        const masked = prefix + '*'.repeat(match.length - prefix.length);
        content = content.replace(match, masked);
      });
    });

    if (content !== originalContent) {
      if (isDryRun) {
        console.log(`  [DRY RUN] Would mask secrets in ${f.file}`);
      } else {
        fs.writeFileSync(f.file, content);
        console.log(`  ✅ Masked secrets in ${f.file}`);
      }
    }

    // Auto-gitignore check
    if (!SKIP_DIRS.includes(path.basename(f.file))) {
        const gitIgnorePath = path.join(path.dirname(f.file), '.gitignore');
        const fileName = path.basename(f.file);
        if (fs.existsSync(gitIgnorePath)) {
            const gitIgnoreContent = fs.readFileSync(gitIgnorePath, 'utf-8');
            if (!gitIgnoreContent.includes(fileName)) {
                if (isDryRun) {
                    console.log(`  [DRY RUN] Would add ${fileName} to ${gitIgnorePath}`);
                } else {
                    fs.appendFileSync(gitIgnorePath, `\n${fileName}\n`);
                    console.log(`  ✅ Added ${fileName} to .gitignore`);
                }
            }
        }
    }
  });

  // Dependency check
  console.log('\n📦 Checking for dependency vulnerabilities...');
  try {
    execSync('npm audit fix', { stdio: 'inherit' });
  } catch (e) {
    console.error('  ⚠️ npm audit fix failed or found issues that require manual attention.');
  }
} else {
  console.log('\n💡 Tip: Run with --fix to apply automated remediation.');
}

// Generate Report
const report = {
  timestamp: new Date().toISOString(),
  summary: {
    total_files_scanned: findings.length, // approximation of issues
    total_issues: findings.reduce((acc, f) => acc + f.issues.length, 0),
  },
  findings: findings
};

fs.writeFileSync('security-report.json', JSON.stringify(report, null, 2));
console.log('\n📊 Security report generated: security-report.json');
