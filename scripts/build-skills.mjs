#!/usr/bin/env node
/**
 * Build / sync skills.
 *
 * Modes:
 *   1. Template render — reads skills/<name>/SKILL.md.tmpl + meta.json,
 *      writes SKILL.md. Always runs.
 *   2. Multi-platform sync — when --platforms is passed (or --all-platforms),
 *      mirrors ALL cm-* skill folders + _shared/ into per-platform install dirs.
 *
 * Usage:
 *   node scripts/build-skills.mjs                                 # template only
 *   node scripts/build-skills.mjs --check                         # template + (when --platforms) drift check
 *   node scripts/build-skills.mjs --platforms cursor,codex,opencode
 *   node scripts/build-skills.mjs --all-platforms
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '..');
const skillsRoot = path.join(repoRoot, 'skills');
const args = process.argv.slice(2);
const check = args.includes('--check');

function getFlag(name) {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return null;
  return args[i + 1] ?? '';
}

const platformsArg = getFlag('platforms');
const allPlatforms = args.includes('--all-platforms');

// All 14 supported platforms
const PLATFORM_DIRS = {
  'claude-code': path.join(repoRoot, '.claude', 'skills'),
  'claude-desktop': path.join(repoRoot, '.claude-desktop', 'skills'),
  cursor: path.join(repoRoot, '.cursor-plugin', 'skills'),
  windsurf: path.join(repoRoot, '.windsurf', 'skills'),
  antigravity: path.join(repoRoot, '.gemini', 'skills'),
  codex: path.join(repoRoot, '.codex', 'skills'),
  opencode: path.join(repoRoot, '.opencode', 'skills'),
  cline: path.join(repoRoot, '.cline', 'skills'),
  kiro: path.join(repoRoot, '.kiro', 'skills'),
  copilot: path.join(repoRoot, '.copilot', 'skills'),
  aider: path.join(repoRoot, '.aider', 'skills'),
  continue: path.join(repoRoot, '.continue', 'skills'),
  'amazon-q': path.join(repoRoot, '.amazonq', 'skills'),
  amp: path.join(repoRoot, '.amp', 'skills'),
};

function render(tmpl, vars) {
  return tmpl.replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : `{{${k}}}`));
}

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function copyFileIdempotent(src, dst) {
  const srcBuf = fs.readFileSync(src);
  if (fs.existsSync(dst)) {
    const dstBuf = fs.readFileSync(dst);
    if (sha256(srcBuf) === sha256(dstBuf)) return 'skipped';
  }
  if (check) return 'drift';
  ensureDir(path.dirname(dst));
  fs.writeFileSync(dst, srcBuf);
  return 'synced';
}

function copyDirShallow(srcDir, dstDir) {
  const result = { synced: 0, skipped: 0, drift: 0 };
  if (!fs.existsSync(srcDir)) return result;
  ensureDir(dstDir);

  const skillFile = path.join(srcDir, 'SKILL.md');
  if (fs.existsSync(skillFile)) {
    result[copyFileIdempotent(skillFile, path.join(dstDir, 'SKILL.md'))]++;
  }

  const refDir = path.join(srcDir, 'references');
  if (fs.existsSync(refDir) && fs.statSync(refDir).isDirectory()) {
    for (const entry of fs.readdirSync(refDir)) {
      const s = path.join(refDir, entry);
      if (fs.statSync(s).isFile()) {
        result[copyFileIdempotent(s, path.join(dstDir, 'references', entry))]++;
      }
    }
  }
  return result;
}

// Copy _shared/ directory recursively
function copySharedHelpers(srcRoot, dstRoot) {
  const sharedSrc = path.join(srcRoot, '_shared');
  const sharedDst = path.join(dstRoot, '_shared');
  if (!fs.existsSync(sharedSrc)) return { synced: 0, skipped: 0, drift: 0 };
  
  const result = { synced: 0, skipped: 0, drift: 0 };
  ensureDir(sharedDst);
  
  for (const entry of fs.readdirSync(sharedSrc)) {
    const srcFile = path.join(sharedSrc, entry);
    const dstFile = path.join(sharedDst, entry);
    if (fs.statSync(srcFile).isFile()) {
      result[copyFileIdempotent(srcFile, dstFile)]++;
    }
  }
  return result;
}

// Get ALL cm-* skills from skills/ directory
function getAllCmSkills() {
  if (!fs.existsSync(skillsRoot)) return [];
  return fs.readdirSync(skillsRoot, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name.startsWith('cm-'))
    .map(d => d.name);
}

// --- Mode 1: template render ---
let tmplCount = 0;
if (fs.existsSync(skillsRoot)) {
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
}

if (tmplCount === 0) {
  console.log('build-skills: no SKILL.md.tmpl under skills/ (OK)');
} else {
  console.log(check ? `build-skills: --check OK (${tmplCount})` : `build-skills: wrote ${tmplCount} skill(s)`);
}

// --- Mode 2: multi-platform sync ---
let platforms = [];
if (allPlatforms) platforms = Object.keys(PLATFORM_DIRS);
else if (platformsArg) {
  platforms = platformsArg.split(',').map(s => s.trim()).filter(Boolean);
}

if (platforms.length > 0) {
  // Get ALL cm-* skills (not just top 35)
  const list = getAllCmSkills();
  console.log(`build-skills: found ${list.length} cm-* skills to sync`);

  for (const platform of platforms) {
    const dst = PLATFORM_DIRS[platform];
    if (!dst) {
      console.error(`build-skills: unknown platform '${platform}' (valid: ${Object.keys(PLATFORM_DIRS).join(',')})`);
      process.exit(2);
    }
    
    let synced = 0, skipped = 0, drift = 0, missing = 0;
    
    // Sync _shared/ helpers
    const sharedResult = copySharedHelpers(skillsRoot, dst);
    synced += sharedResult.synced;
    skipped += sharedResult.skipped;
    drift += sharedResult.drift;
    
    // Sync ALL cm-* skills
    for (const name of list) {
      const srcDir = path.join(skillsRoot, name);
      if (!fs.existsSync(srcDir)) {
        missing++;
        console.warn(`  ! ${platform}: skill '${name}' not found in skills/`);
        continue;
      }
      const r = copyDirShallow(srcDir, path.join(dst, name));
      synced += r.synced; skipped += r.skipped; drift += r.drift;
    }
    
    if (check && drift > 0) {
      console.error(`build-skills: --check FAILED for ${platform} (drift=${drift})`);
      process.exit(2);
    }
    const tag = check ? 'check' : 'sync';
    console.log(`build-skills[${platform}] ${tag}: synced=${synced} skipped=${skipped} drift=${drift} missing=${missing} total=${list.length + 1}`);
  }
}
