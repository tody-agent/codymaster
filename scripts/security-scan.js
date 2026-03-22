const fs = require('fs');
const path = require('path');

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

const SKIP_DIRS = ['node_modules', '.git', 'dist', '.wrangler', '.next', 'coverage'];
const SCAN_EXTS = ['.js', '.ts', '.jsx', '.tsx', '.json', '.toml', '.yaml', '.yml',
                    '.env', '.cfg', '.conf', '.ini', '.md', '.html', '.jsonc'];

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
        for (const pattern of DANGEROUS_PATTERNS) {
          const matches = content.match(pattern.regex);
          if (matches) {
            findings.push({ file: fullPath, pattern: pattern.name, count: matches.length });
          }
        }
      }
    }
  } catch (e) { /* skip unreadable dirs */ }
}

scanDir('.');

if (findings.length > 0) {
  console.error('❌ SECRET SCAN FOUND ' + findings.length + ' POTENTIAL ISSUES:');
  findings.forEach(f => {
    console.error('  ⚠ ' + f.file + ' — ' + f.pattern + ' (' + f.count + ' match(es))');
  });
  console.error('');
  process.exit(1);
} else {
  console.log('✅ Repo scan: no secrets detected');
}
