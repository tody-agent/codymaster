#!/usr/bin/env node
/**
 * Deprecate a skill: archives original SKILL.md to SKILL.archive.md
 * and replaces SKILL.md with a small redirect stub.
 *
 * Usage:
 *   node scripts/deprecate-skill.mjs <skill-name> <merged-into> [reason]
 *
 * Idempotent: skips if SKILL.md already has `deprecated: true`.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const [, , name, mergedInto, ...reasonParts] = process.argv;
if (!name || !mergedInto) {
  console.error('Usage: deprecate-skill.mjs <skill-name> <merged-into> [reason]');
  process.exit(1);
}
const reason = reasonParts.join(' ') || `consolidated into ${mergedInto}`;

const dir = path.join(__dirname, '..', 'skills', name);
const file = path.join(dir, 'SKILL.md');
const archive = path.join(dir, 'SKILL.archive.md');

if (!fs.existsSync(file)) {
  console.error(`✗ ${name}: SKILL.md not found`);
  process.exit(1);
}

const original = fs.readFileSync(file, 'utf8');
if (/^deprecated:\s*true/m.test(original)) {
  console.log(`• ${name}: already deprecated, skipping`);
  process.exit(0);
}

if (!fs.existsSync(archive)) {
  fs.writeFileSync(archive, original, 'utf8');
}

const stub = `---
name: ${name}
description: "[Deprecated] ${reason}. Use \`${mergedInto}\` instead."
deprecated: true
merged_into: ${mergedInto}
---

# ${name} — Deprecated

> ⚠️ This skill is deprecated as of CodyMaster v6.0.0 and will be removed in v6.1.0.
>
> **Use \`${mergedInto}\` instead.** ${reason}.
>
> See [docs/migration-v2.md](../../docs/migration-v2.md) for the full mapping.

The original content is preserved at [SKILL.archive.md](SKILL.archive.md) for reference.

## Migration

\`\`\`bash
# Old:           cm <use this skill>
# New (v6.0+):   cm ${mergedInto.replace(/^cm-/, '')} <equivalent action>
\`\`\`

If you depend on a capability that didn't carry over, please file an issue:
https://github.com/tody-agent/codymaster/issues
`;

fs.writeFileSync(file, stub, 'utf8');
console.log(`✓ ${name} → deprecated, redirects to ${mergedInto}`);
