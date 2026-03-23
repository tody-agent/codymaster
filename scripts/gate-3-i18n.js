const fs = require('fs');
const path = require('path');
const I18N_DIR = path.resolve(process.cwd(), 'public/i18n');
const langs = ['vi', 'en', 'zh', 'ru', 'ko', 'hi'];
const namespaces = fs.readdirSync(path.join(I18N_DIR, 'en'))
  .filter(f => f.endsWith('.json'))
  .map(f => f.replace('.json', ''));

let globalFailed = false;

namespaces.forEach(ns => {
  const results = {};
  for (const lang of langs) {
    const filePath = path.join(I18N_DIR, lang, ns + '.json');
    if (!fs.existsSync(filePath)) {
        console.error(`❌ File missing: ${filePath}`);
        globalFailed = true;
        continue;
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const flatKeys = JSON.stringify(data).split('":').length - 1;
    results[lang] = flatKeys;
  }
  
  const counts = Object.values(results);
  if (counts.length === 0) return;
  const firstCount = counts[0];
  if (counts.some(c => c !== firstCount)) {
    console.error(`❌ KEY PARITY FAILURE in namespace: ${ns}`);
    console.error(JSON.stringify(results));
    globalFailed = true;
  }
  
  // Check for null/empty values
  let nullCount = 0;
  for (const lang of langs) {
    const filePath = path.join(I18N_DIR, lang, ns + '.json');
    if (!fs.existsSync(filePath)) continue;
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const check = (obj, prefix) => {
      for (const [k, v] of Object.entries(obj)) {
        if (k === '_meta') continue;
        if (typeof v === 'object' && v !== null && !Array.isArray(v)) { check(v, prefix + '.' + k); continue; }
        if (v === null || v === undefined || v === '') {
          console.error(`  ⚠ ${lang}.${prefix}.${k} is null/empty`);
          nullCount++;
        }
      }
    };
    check(data, ns);
  }
  if (nullCount > 0) {
    console.error(`❌ Found ${nullCount} null/empty translation values in ${ns}!`);
    globalFailed = true;
  }
});

if (globalFailed) {
  process.exit(1);
}
console.log('✅ Gate 3 passed: i18n parity verified across all namespaces');
