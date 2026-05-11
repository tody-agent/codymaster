#!/usr/bin/env node
/**
 * Pack the CodyMaster Claude plugin into ./cm.plugin (zip archive).
 *
 * Token-efficiency strategy (the plugin is consumed by Claude Code):
 *   - skills/<name>/  → only SKILL.md + references/ (Claude loads on demand)
 *   - skills/_shared/ → kept as-is (small, used by helpers)
 *   - dist/           → required by .mcp.json (cm-context MCP server)
 *   - Strip per-skill bloat: tests, examples, output, scripts, data, docs,
 *     localized READMEs, .tmpl files, hidden files.
 *
 * Output: ./cm.plugin
 */
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '..');
const stagingRoot = path.join(repoRoot, '.pack-staging');
const outFile = path.join(repoRoot, 'cm.plugin');

const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf-8'));
const VERSION = pkg.version;

console.log(`📦 Packing CodyMaster plugin v${VERSION}…`);

// ── Reset staging ────────────────────────────────────────────────────────────
if (fs.existsSync(stagingRoot)) fs.rmSync(stagingRoot, { recursive: true, force: true });
fs.mkdirSync(stagingRoot, { recursive: true });
if (fs.existsSync(outFile)) fs.rmSync(outFile);

// ── Helpers ──────────────────────────────────────────────────────────────────
function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function copyFile(src, dst) {
  ensureDir(path.dirname(dst));
  fs.copyFileSync(src, dst);
}

function copyDirAll(src, dst, filter = () => true) {
  if (!fs.existsSync(src)) return 0;
  let count = 0;
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const sp = path.join(src, entry.name);
    const dp = path.join(dst, entry.name);
    if (entry.name.startsWith('.')) continue;
    if (entry.isDirectory()) {
      count += copyDirAll(sp, dp, filter);
    } else if (entry.isFile() && filter(sp, entry.name)) {
      copyFile(sp, dp);
      count++;
    }
  }
  return count;
}

// ── 1. Plugin manifest ───────────────────────────────────────────────────────
const stagedManifestDir = path.join(stagingRoot, '.claude-plugin');
ensureDir(stagedManifestDir);
copyFile(
  path.join(repoRoot, '.claude-plugin', 'plugin.json'),
  path.join(stagedManifestDir, 'plugin.json'),
);
copyFile(
  path.join(repoRoot, '.claude-plugin', 'marketplace.json'),
  path.join(stagedManifestDir, 'marketplace.json'),
);
console.log('  ✓ .claude-plugin/');

// ── 2. Slash commands & sub-agents ───────────────────────────────────────────
const cmdCount = copyDirAll(
  path.join(repoRoot, 'commands'),
  path.join(stagingRoot, 'commands'),
  (_, name) => name.endsWith('.md'),
);
console.log(`  ✓ commands/  (${cmdCount} files)`);

const agentCount = copyDirAll(
  path.join(repoRoot, 'agents'),
  path.join(stagingRoot, 'agents'),
  (_, name) => name.endsWith('.md'),
);
console.log(`  ✓ agents/    (${agentCount} files)`);

// ── 3. .mcp.json (MCP server entry) ──────────────────────────────────────────
copyFile(path.join(repoRoot, '.mcp.json'), path.join(stagingRoot, '.mcp.json'));
console.log('  ✓ .mcp.json');

// ── 4. dist/ (runtime for MCP server + cm CLI) ───────────────────────────────
const distCount = copyDirAll(
  path.join(repoRoot, 'dist'),
  path.join(stagingRoot, 'dist'),
  (_, name) => name.endsWith('.js') || name.endsWith('.json') || name.endsWith('.md'),
);
console.log(`  ✓ dist/      (${distCount} files)`);

// package.json is referenced at runtime by dist/index.js + dist/mcp-context-server.js.
// Ship a slim version (no devDependencies, no scripts) to keep installs lean.
const slimPkg = {
  name: pkg.name,
  version: pkg.version,
  description: pkg.description,
  main: pkg.main,
  bin: pkg.bin,
  dependencies: pkg.dependencies,
  engines: pkg.engines,
  homepage: pkg.homepage,
  repository: pkg.repository,
};
fs.writeFileSync(path.join(stagingRoot, 'package.json'), JSON.stringify(slimPkg, null, 2));
console.log('  ✓ package.json (slim)');

// ── 5. Skills — TOKEN-OPTIMIZED ──────────────────────────────────────────────
// For each cm-* skill: copy SKILL.md (always) + references/ (if present).
// Drop tests/, scripts/, data/, output/, docs/, examples/, localized READMEs.
// This mirrors what `build-skills.mjs#copyDirShallow` already does for Claude.
const skillsSrc = path.join(repoRoot, 'skills');
const skillsDst = path.join(stagingRoot, 'skills');
ensureDir(skillsDst);

let skillCount = 0;
let refFileCount = 0;
for (const entry of fs.readdirSync(skillsSrc, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  if (entry.name === '_shared') continue;
  if (entry.name === 'profiles' || entry.name === 'scripts') continue;
  if (!entry.name.startsWith('cm-')) continue;

  const srcSkill = path.join(skillsSrc, entry.name);
  const dstSkill = path.join(skillsDst, entry.name);
  const skillMd = path.join(srcSkill, 'SKILL.md');
  if (!fs.existsSync(skillMd)) continue;

  copyFile(skillMd, path.join(dstSkill, 'SKILL.md'));
  skillCount++;

  const refDir = path.join(srcSkill, 'references');
  if (fs.existsSync(refDir) && fs.statSync(refDir).isDirectory()) {
    refFileCount += copyDirAll(refDir, path.join(dstSkill, 'references'));
  }
}
console.log(`  ✓ skills/    (${skillCount} skills, ${refFileCount} reference files)`);

// _shared (helpers, conventions, template) — needed by skill execution
const sharedCount = copyDirAll(
  path.join(skillsSrc, '_shared'),
  path.join(skillsDst, '_shared'),
  (_, name) => name.endsWith('.md'),
);
console.log(`  ✓ skills/_shared/ (${sharedCount} files)`);

// skills/config.schema.json (referenced by some skills)
const schemaSrc = path.join(skillsSrc, 'config.schema.json');
if (fs.existsSync(schemaSrc)) {
  copyFile(schemaSrc, path.join(skillsDst, 'config.schema.json'));
}

// ── 6. README (concise, plugin-scoped) ───────────────────────────────────────
const readme = `# CodyMaster Claude Plugin (cm) v${VERSION}

50+ AI agent skills for disciplined, token-efficient development with Claude Code.

## What's inside
- **${skillCount} skills** in \`skills/\` — Each skill is a focused SKILL.md (Layer-3, loaded on demand).
- **${cmdCount} slash commands** in \`commands/\` — \`/plan\`, \`/build\`, \`/review\`, \`/deploy\`, etc.
- **${agentCount} sub-agents** in \`agents/\` — engineer, architect, pm, reviewer, security.
- **MCP server** \`cm-context\` — context bus, skill index, learnings (\`dist/mcp-context-server.js\`).

## Token-efficiency
- Skills use Layer-1 / Layer-2 / Layer-3 progressive disclosure (\`cm-skill-index\`).
- Layer-1 index (~100 tok) loads at session start; SKILL.md only on trigger.
- This pack ships **only** \`SKILL.md\` + \`references/\` per skill — tests, scripts,
  examples, generated output, and localized READMEs are excluded to keep the
  on-disk footprint small and Claude's file-discovery cheap.

## Quick start
\`\`\`
/cm-start <your objective>
\`\`\`
See \`skills/cm-how-it-work/SKILL.md\` for the full workflow.

## Repository
https://github.com/tody-agent/codymaster
`;
fs.writeFileSync(path.join(stagingRoot, 'README.md'), readme);
console.log('  ✓ README.md');

// ── 7. Zip ───────────────────────────────────────────────────────────────────
console.log('\n📐 Creating cm.plugin (zip)…');
execFileSync(
  'zip',
  ['-rq', outFile, '.claude-plugin', 'commands', 'agents', '.mcp.json', 'dist', 'skills', 'package.json', 'README.md'],
  { cwd: stagingRoot, stdio: 'inherit' },
);

// ── 8. Cleanup + report ──────────────────────────────────────────────────────
const stats = fs.statSync(outFile);
const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
fs.rmSync(stagingRoot, { recursive: true, force: true });

console.log(`\n✅ cm.plugin built — ${sizeMB} MB`);
console.log(`   ${outFile}`);
