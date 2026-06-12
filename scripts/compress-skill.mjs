#!/usr/bin/env node
/**
 * Migrate a skill to v2 compressed format.
 *
 *   - Adds frontmatter: `token_budget: <N>`, `compressed: true`, `deprecated: false`
 *   - Inserts `## TL;DR` block after the H1 if not present
 *   - Preserves the rest of the body verbatim
 *
 * Usage:
 *   node scripts/compress-skill.mjs <skill-name> <token_budget> "<tldr-line-1>" "<tldr-line-2>" ...
 *
 * Idempotent: skips skills already marked `compressed: true`.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const [, , name, budgetArg, ...tldrLines] = process.argv;
if (!name || !budgetArg || tldrLines.length === 0) {
  console.error('Usage: compress-skill.mjs <skill-name> <token_budget> "<tldr-1>" ["<tldr-2>" ...]');
  process.exit(1);
}
const budget = parseInt(budgetArg, 10);
if (Number.isNaN(budget) || budget < 100 || budget > 6000) {
  console.error(`token_budget must be int 100..6000, got: ${budgetArg}`);
  process.exit(1);
}

const file = path.join(__dirname, '..', 'skills', name, 'SKILL.md');
if (!fs.existsSync(file)) {
  console.error(`✗ ${name}: SKILL.md not found`);
  process.exit(1);
}

const original = fs.readFileSync(file, 'utf8');
if (/^compressed:\s*true/m.test(original)) {
  console.log(`• ${name}: already compressed, skipping`);
  process.exit(0);
}

const fmMatch = original.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
if (!fmMatch) {
  console.error(`✗ ${name}: missing YAML frontmatter`);
  process.exit(1);
}
let fmText = fmMatch[1];
const body = fmMatch[2];

// Append fields if missing.
if (!/^token_budget:/m.test(fmText)) fmText += `\ntoken_budget: ${budget}`;
if (!/^compressed:/m.test(fmText)) fmText += `\ncompressed: true`;
if (!/^deprecated:/m.test(fmText)) fmText += `\ndeprecated: false`;

// Insert ## TL;DR after the H1 if absent.
let newBody = body;
if (!/^##\s+TL;DR\b/m.test(body)) {
  const h1 = body.match(/^(#\s+[^\n]+\n)/m);
  if (!h1) {
    console.error(`✗ ${name}: missing H1`);
    process.exit(1);
  }
  const tldrBlock =
    `\n## TL;DR\n` +
    tldrLines.map((l) => `- ${l}`).join('\n') +
    `\n`;
  newBody = body.replace(h1[0], h1[0] + tldrBlock);
}

const out = `---\n${fmText}\n---\n${newBody}`;
fs.writeFileSync(file, out, 'utf8');
console.log(`✓ ${name}: compressed (budget=${budget})`);
