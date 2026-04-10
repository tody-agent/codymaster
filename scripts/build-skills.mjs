#!/usr/bin/env node
/**
 * Generate SKILL.md from SKILL.md.tmpl + meta.json when present.
 * Usage: node scripts/build-skills.mjs [--check]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillsRoot = path.join(__dirname, '..', 'skills');
const check = process.argv.includes('--check');

function render(tmpl, vars) {
  return tmpl.replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : `{{${k}}}`));
}

let tmplCount = 0;
if (!fs.existsSync(skillsRoot)) process.exit(0);

for (const dir of fs.readdirSync(skillsRoot, { withFileTypes: true })) {
  if (!dir.isDirectory()) continue;
  const folder = path.join(skillsRoot, dir.name);
  const tmplPath = path.join(folder, 'SKILL.md.tmpl');
  const metaPath = path.join(folder, 'meta.json');
  const outPath = path.join(folder, 'SKILL.md');
  if (!fs.existsSync(tmplPath)) continue;

  tmplCount++;
  const tmpl = fs.readFileSync(tmplPath, 'utf8');
  let meta = {};
  if (fs.existsSync(metaPath)) {
    meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  }
  const out = render(tmpl, meta);
  if (check) {
    const cur = fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf8') : '';
    if (cur !== out) {
      console.error(`check failed: ${outPath} out of date (run npm run build:skills)`);
      process.exit(2);
    }
  } else {
    fs.writeFileSync(outPath, out, 'utf8');
  }
}

if (tmplCount === 0) {
  console.log('build-skills: no SKILL.md.tmpl under skills/ (OK)');
} else {
  console.log(check ? `build-skills: --check OK (${tmplCount})` : `build-skills: wrote ${tmplCount} skill(s)`);
}
