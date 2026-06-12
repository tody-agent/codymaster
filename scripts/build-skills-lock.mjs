#!/usr/bin/env node
/**
 * Build/refresh skills-lock.json with sha256 + version for every skill.
 *
 * Usage:
 *   node scripts/build-skills-lock.mjs           → rewrite skills-lock.json
 *   node scripts/build-skills-lock.mjs --check   → exit 1 on drift, no write
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SKILLS = path.join(ROOT, 'skills');
const LOCK = path.join(ROOT, 'skills-lock.json');

const args = new Set(process.argv.slice(2));
const checkOnly = args.has('--check');

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function parseFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const out = {};
  const v = m[1].match(/^version:\s*['"]?([\w.\-+]+)['"]?\s*$/m);
  if (v) out.version = v[1];
  const d = m[1].match(/^deprecated:\s*(true|false)\s*$/m);
  if (d) out.deprecated = d[1] === 'true';
  return out;
}

function buildLock() {
  const skills = {};
  if (fs.existsSync(SKILLS)) {
    for (const name of fs.readdirSync(SKILLS).sort()) {
      if (!name.startsWith('cm-')) continue;
      const skillFile = path.join(SKILLS, name, 'SKILL.md');
      if (!fs.existsSync(skillFile)) continue;
      const text = fs.readFileSync(skillFile, 'utf8');
      const fm = parseFrontmatter(text);
      skills[name] = {
        sha256: sha256(skillFile),
        ...(fm.version ? { version: fm.version } : {}),
        ...(fm.deprecated ? { deprecated: true } : {}),
      };
    }
  }
  return {
    version: 2,
    generated_at: new Date().toISOString(),
    skills,
  };
}

const next = buildLock();

if (checkOnly) {
  if (!fs.existsSync(LOCK)) {
    console.error('✗ skills-lock.json missing');
    process.exit(1);
  }
  const prev = JSON.parse(fs.readFileSync(LOCK, 'utf8'));
  const drift = [];
  for (const [name, entry] of Object.entries(next.skills)) {
    const before = prev.skills?.[name];
    if (!before) drift.push(`+ ${name} (new)`);
    else if (before.sha256 !== entry.sha256) drift.push(`Δ ${name} (hash drift)`);
  }
  for (const name of Object.keys(prev.skills ?? {})) {
    if (!next.skills[name]) drift.push(`- ${name} (removed)`);
  }
  if (drift.length) {
    console.error('✗ skills-lock drift:');
    for (const line of drift) console.error('  ' + line);
    console.error('Run `node scripts/build-skills-lock.mjs` to refresh.');
    process.exit(1);
  }
  console.log(`✓ skills-lock OK (${Object.keys(next.skills).length} skills)`);
  process.exit(0);
}

fs.writeFileSync(LOCK, JSON.stringify(next, null, 2) + '\n', 'utf8');
console.log(`✓ wrote skills-lock.json (${Object.keys(next.skills).length} skills)`);
