#!/usr/bin/env node
/**
 * Validates skills under skills/.
 *
 * Always-required (errors, fail build):
 *   - SKILL.md exists with H1 title and YAML frontmatter (`name`, `description`)
 *
 * Opt-in v2 rules (errors only when frontmatter `compressed: true`):
 *   - `token_budget` integer in [100, 6000]
 *   - `## TL;DR` section present, ≤8 non-empty lines (≤5 recommended)
 *   - SKILL.md ≤200 lines (warning only)
 *
 * Skills with `deprecated: true` are exempt from v2 rules.
 *
 * Migration: as skills are refactored to the new template
 * (skills/_shared/SKILL_TEMPLATE.md), set `compressed: true` to enforce
 * v2 quality. Once all core skills are migrated, the opt-in becomes default.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..', 'skills');

const SKIP_DIRS = new Set(['profiles', 'extensions', 'scripts']);

let errors = 0;
let warnings = 0;

function parseFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return null;
  const out = {};
  for (const line of m[1].split('\n')) {
    const mm = line.match(/^([A-Za-z_][A-Za-z0-9_-]*)\s*:\s*(.*)$/);
    if (!mm) continue;
    let v = mm[2].trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    if (v === 'true') v = true;
    else if (v === 'false') v = false;
    else if (/^-?\d+$/.test(v)) v = parseInt(v, 10);
    out[mm[1]] = v;
  }
  return out;
}

function extractTldr(text) {
  const m = text.match(/^##\s+TL;DR\s*\n([\s\S]*?)(?=\n##\s|$)/m);
  if (!m) return null;
  return m[1].split('\n').filter((l) => l.trim().length > 0);
}

if (!fs.existsSync(root)) {
  console.error('No skills/ directory');
  process.exit(1);
}

let migratedCount = 0;
let totalCount = 0;

for (const name of fs.readdirSync(root, { withFileTypes: true })) {
  if (!name.isDirectory()) continue;
  if (name.name.startsWith('_') || name.name.startsWith('.')) continue;
  if (SKIP_DIRS.has(name.name)) continue;

  const md = path.join(root, name.name, 'SKILL.md');
  if (!fs.existsSync(md)) {
    console.error(`✗ ${name.name}: missing SKILL.md`);
    errors++;
    continue;
  }
  totalCount++;

  const text = fs.readFileSync(md, 'utf8');
  const fm = parseFrontmatter(text);

  if (!/^#\s+\S/m.test(text)) {
    console.error(`✗ ${name.name}: missing H1 title`);
    errors++;
  }

  if (!fm) {
    console.error(`✗ ${name.name}: missing YAML frontmatter`);
    errors++;
    continue;
  }
  if (!fm.name) {
    console.error(`✗ ${name.name}: frontmatter missing 'name'`);
    errors++;
  }
  if (!fm.description) {
    console.error(`✗ ${name.name}: frontmatter missing 'description'`);
    errors++;
  }

  const isDeprecated = fm.deprecated === true;
  const isCompressed = fm.compressed === true;

  if (isCompressed && !isDeprecated) {
    migratedCount++;

    if (typeof fm.token_budget !== 'number') {
      console.error(`✗ ${name.name}: compressed skill missing 'token_budget' (number)`);
      errors++;
    } else if (fm.token_budget < 100 || fm.token_budget > 6000) {
      console.error(`✗ ${name.name}: token_budget ${fm.token_budget} out of range [100, 6000]`);
      errors++;
    }

    const tldr = extractTldr(text);
    if (!tldr) {
      console.error(`✗ ${name.name}: compressed skill missing '## TL;DR' section`);
      errors++;
    } else {
      if (tldr.length > 8) {
        console.error(`✗ ${name.name}: TL;DR has ${tldr.length} non-empty lines (max 8)`);
        errors++;
      } else if (tldr.length > 5) {
        console.warn(`⚠ ${name.name}: TL;DR has ${tldr.length} non-empty lines (recommend ≤5)`);
        warnings++;
      }
    }

    const totalLines = text.split('\n').length;
    if (totalLines > 200) {
      console.warn(`⚠ ${name.name}: SKILL.md is ${totalLines} lines (recommend ≤200)`);
      warnings++;
    }
  }
}

console.log(`validate-skills: ${migratedCount}/${totalCount} skills migrated to v2 (compressed:true)`);
if (warnings) console.warn(`validate-skills: ${warnings} warning(s)`);
if (errors) {
  console.error(`validate-skills: ${errors} error(s)`);
  process.exit(1);
}
console.log('validate-skills: OK');
