/**
 * Installation Command Tests
 *
 * Verifies that installation commands across all documentation sources
 * (pages.json EN/VI, docs/sop/installation.md, .claude-plugin configs,
 * install.sh) are consistent and use the standardized naming:
 *   - Marketplace: "codymaster"
 *   - Plugin: "cm"
 *   - No stale "cody-master" references in install commands
 */
import { test, expect, describe } from 'vitest';
import fs from 'fs';
import path from 'path';

// ─── Helpers ──────────────────────────────────────
const root = path.resolve(__dirname, '..');

function readJSON(relPath: string) {
  const full = path.join(root, relPath);
  return JSON.parse(fs.readFileSync(full, 'utf-8'));
}

function readText(relPath: string) {
  return fs.readFileSync(path.join(root, relPath), 'utf-8');
}

/** Recursively collect all "code" values from an object tree */
function collectCodeValues(obj: any): string[] {
  const codes: string[] = [];
  if (typeof obj === 'string') return codes;
  if (Array.isArray(obj)) {
    obj.forEach(item => codes.push(...collectCodeValues(item)));
  } else if (typeof obj === 'object' && obj !== null) {
    for (const [key, val] of Object.entries(obj)) {
      if (key === 'code' && typeof val === 'string') {
        codes.push(val);
      } else {
        codes.push(...collectCodeValues(val));
      }
    }
  }
  return codes;
}

// ─── 1. Claude Plugin Config Consistency ──────────
describe('Claude plugin config files', () => {
  test('marketplace.json declares marketplace name "codymaster"', () => {
    const mkt = readJSON('.claude-plugin/marketplace.json');
    expect(mkt.name).toBe('codymaster');
  });

  test('marketplace.json declares plugin name "cm"', () => {
    const mkt = readJSON('.claude-plugin/marketplace.json');
    const plugin = mkt.plugins?.[0];
    expect(plugin).toBeDefined();
    expect(plugin.name).toBe('cm');
  });

  test('plugin.json declares name "cm"', () => {
    const pkg = readJSON('.claude-plugin/plugin.json');
    expect(pkg.name).toBe('cm');
  });

  test('marketplace and plugin versions match', () => {
    const mkt = readJSON('.claude-plugin/marketplace.json');
    const pkg = readJSON('.claude-plugin/plugin.json');
    expect(mkt.plugins[0].version).toBe(pkg.version);
  });
});

// ─── 2. Pages.json Platform Data Integrity ────────
describe.each(['en', 'vi'])('pages.json (%s) platform data integrity', (lang) => {
  const pages = readJSON(`public/i18n/${lang}/pages.json`);
  const platforms = pages.startPage?.platforms ?? [];

  test('has at least 5 platforms', () => {
    expect(platforms.length).toBeGreaterThanOrEqual(5);
  });

  test('every platform has id, label, emoji, and steps', () => {
    for (const p of platforms) {
      expect(p.id, `platform missing id`).toBeTruthy();
      expect(p.label, `${p.id} missing label`).toBeTruthy();
      expect(p.emoji, `${p.id} missing emoji`).toBeTruthy();
      expect(p.steps, `${p.id} missing steps`).toBeInstanceOf(Array);
      expect(p.steps.length, `${p.id} has zero steps`).toBeGreaterThan(0);
    }
  });

  test('every step has a title and description', () => {
    for (const p of platforms) {
      for (const step of p.steps) {
        expect(step.title, `${p.id} step missing title`).toBeTruthy();
        expect(step.description, `${p.id} step missing description`).toBeTruthy();
      }
    }
  });

  test('platform IDs are unique', () => {
    const ids = platforms.map((p: any) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('includes google-antigravity platform', () => {
    const ids = platforms.map((p: any) => p.id);
    expect(ids).toContain('google-antigravity');
  });

  test('includes claude-code platform', () => {
    const ids = platforms.map((p: any) => p.id);
    expect(ids).toContain('claude-code');
  });
});

// ─── 3. Claude Code Commands Are Standardized ─────
describe.each(['en', 'vi'])('pages.json (%s) Claude Code commands', (lang) => {
  const pages = readJSON(`public/i18n/${lang}/pages.json`);
  const platforms = pages.startPage?.platforms ?? [];
  const claude = platforms.find((p: any) => p.id === 'claude-code');

  test('marketplace add uses "tody-agent/codymaster"', () => {
    expect(claude).toBeDefined();
    const codes = collectCodeValues(claude!.steps);
    const addCmd = codes.find(c => c.includes('marketplace add'));
    expect(addCmd).toBeDefined();
    expect(addCmd).toContain('tody-agent/codymaster');
    // Must NOT contain the old hyphenated name in the marketplace arg
    expect(addCmd).not.toMatch(/marketplace add.*cody-master/);
  });

  test('plugin install uses "cm@codymaster"', () => {
    expect(claude).toBeDefined();
    const codes = collectCodeValues(claude!.steps);
    const installCmd = codes.find(c => c.includes('plugin install'));
    expect(installCmd).toBeDefined();
    expect(installCmd).toContain('cm@codymaster');
    // Must NOT contain old "cody-master@cody-master"
    expect(installCmd).not.toContain('cody-master@cody-master');
  });
});

// ─── 4. EN and VI Platforms Are In Sync ───────────
describe('EN and VI platforms parity', () => {
  const enPages = readJSON('public/i18n/en/pages.json');
  const viPages = readJSON('public/i18n/vi/pages.json');
  const enPlatforms = enPages.startPage?.platforms ?? [];
  const viPlatforms = viPages.startPage?.platforms ?? [];

  test('same number of platforms', () => {
    expect(viPlatforms.length).toBe(enPlatforms.length);
  });

  test('same platform IDs in same order', () => {
    const enIds = enPlatforms.map((p: any) => p.id);
    const viIds = viPlatforms.map((p: any) => p.id);
    expect(viIds).toEqual(enIds);
  });

  test('same number of steps per platform', () => {
    for (let i = 0; i < enPlatforms.length; i++) {
      const enP = enPlatforms[i];
      const viP = viPlatforms[i];
      expect(
        viP.steps.length,
        `${enP.id}: VI has ${viP.steps.length} steps, EN has ${enP.steps.length}`
      ).toBe(enP.steps.length);
    }
  });

  test('actual CLI install commands are identical between EN and VI', () => {
    // Extract only actual shell commands from code blocks
    // Skip: empty lines, bash comments, @-mention examples, and instructional text
    const CLI_PREFIXES = /^(bash|claude|npx|git|cp|gemini|codex|opencode|curl|pip|brew|npm)\b/;

    const extractShellCommands = (codes: string[]): string[] => {
      const cmds: string[] = [];
      for (const block of codes) {
        for (const line of block.split('\n')) {
          const trimmed = line.trim();
          if (CLI_PREFIXES.test(trimmed)) {
            cmds.push(trimmed);
          }
        }
      }
      return cmds;
    };

    for (let i = 0; i < enPlatforms.length; i++) {
      const enCmds = extractShellCommands(collectCodeValues(enPlatforms[i].steps));
      const viCmds = extractShellCommands(collectCodeValues(viPlatforms[i].steps));
      expect(
        viCmds,
        `${enPlatforms[i].id}: shell commands differ between EN and VI`
      ).toEqual(enCmds);
    }
  });
});

// ─── 5. docs/sop/installation.md Consistency ──────
describe('docs/sop/installation.md', () => {
  const doc = readText('docs/sop/installation.md');

  test('uses "tody-agent/codymaster" for marketplace', () => {
    expect(doc).toContain('claude plugin marketplace add tody-agent/codymaster');
  });

  test('uses "cm@codymaster" for plugin install', () => {
    expect(doc).toContain('claude plugin install cm@codymaster');
  });

  test('does not contain stale "cody-master@cody-master"', () => {
    expect(doc).not.toContain('cody-master@cody-master');
  });

  test('does not contain stale "cm@cody-master"', () => {
    expect(doc).not.toContain('cm@cody-master');
  });
});

// ─── 6. install.sh Consistency ────────────────────
describe('install.sh', () => {
  const script = readText('install.sh');

  test('marketplace name uses "codymaster" (no hyphen)', () => {
    // The script should reference the marketplace as "codymaster"
    expect(script).toContain('codymaster');
  });

  test('does not install "cody-master@cody-master" (stale name)', () => {
    expect(script).not.toContain('install.*cody-master@cody-master');
    // More precise: no line that does `plugin install cody-master`
    expect(script).not.toMatch(/plugin install\s+cody-master@cody-master/);
  });

  test('install.sh is executable (has shebang)', () => {
    expect(script.startsWith('#!/')).toBe(true);
  });
});

// ─── 7. No Stale "cody-master" in Any Install Code ─
describe('no stale "cody-master" in installation code blocks', () => {
  test.each(['en', 'vi'])('pages.json (%s) has no "cody-master@cody-master"', (lang) => {
    const raw = readText(`public/i18n/${lang}/pages.json`);
    expect(raw).not.toContain('cody-master@cody-master');
  });

  test.each(['en', 'vi'])('pages.json (%s) has no "cm@cody-master"', (lang) => {
    const raw = readText(`public/i18n/${lang}/pages.json`);
    expect(raw).not.toContain('cm@cody-master');
  });
});

// ─── 8. NPM Installation Method ──────────────────
describe('NPM installation method', () => {
  test.each(['en', 'vi'])('pages.json (%s) has npm platform', (lang) => {
    const pages = readJSON(`public/i18n/${lang}/pages.json`);
    const platforms = pages.startPage?.platforms ?? [];
    const ids = platforms.map((p: any) => p.id);
    expect(ids).toContain('npm');
  });

  test.each(['en', 'vi'])('pages.json (%s) npm platform has "npm install -g codymaster"', (lang) => {
    const pages = readJSON(`public/i18n/${lang}/pages.json`);
    const platforms = pages.startPage?.platforms ?? [];
    const npm = platforms.find((p: any) => p.id === 'npm');
    expect(npm).toBeDefined();
    const codes = collectCodeValues(npm!.steps);
    const installCmd = codes.find((c: string) => c.includes('npm install -g codymaster'));
    expect(installCmd).toBeDefined();
  });

  test('docs/sop/installation.md mentions npm install method', () => {
    const doc = readText('docs/sop/installation.md');
    expect(doc).toContain('npm install -g codymaster');
    expect(doc).toContain('npm update -g codymaster');
  });
});
