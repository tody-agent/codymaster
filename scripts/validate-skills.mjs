#!/usr/bin/env node
/**
 * Ensures each skill folder under skills/ has SKILL.md with a title line.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..', 'skills');

/** Directories under skills/ that are not standalone skills (assets, packs). */
const SKIP_DIRS = new Set(['profiles', 'extensions', 'scripts']);

let errors = 0;
if (!fs.existsSync(root)) {
  console.error('No skills/ directory');
  process.exit(1);
}

for (const name of fs.readdirSync(root, { withFileTypes: true })) {
  if (!name.isDirectory()) continue;
  if (name.name.startsWith('_') || name.name.startsWith('.')) continue;
  if (SKIP_DIRS.has(name.name)) continue;
  const md = path.join(root, name.name, 'SKILL.md');
  if (!fs.existsSync(md)) {
    console.error(`Missing SKILL.md: ${name.name}`);
    errors++;
    continue;
  }
  const text = fs.readFileSync(md, 'utf8');
  if (!/^#\s+\S/m.test(text)) {
    console.error(`SKILL.md missing H1 title: ${name.name}`);
    errors++;
  }
}

if (errors) {
  console.error(`validate-skills: ${errors} error(s)`);
  process.exit(1);
}
console.log('validate-skills: OK');
