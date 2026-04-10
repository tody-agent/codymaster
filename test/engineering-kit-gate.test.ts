/**
 * Engineering kit gate — verifies the CodyMaster CLI surface and repo scripts
 * align with the shipped engineering track (browse, sprint, guardian, retro,
 * suggest, design-studio, distro, skills layout).
 *
 * Complements cm-test-gate layers: business-logic + integration with scripts.
 */
import { describe, it, expect } from 'vitest';
import { Command } from 'commander';
import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { registerAllCommands } from '../src/cli/command-registry';
import { loadCmConfig } from '../src/cm-config';
import { loadRetroEntries, filterSince, formatRetroJson, countByTool } from '../src/retro-summary';
import { validateSkillPackDir } from '../src/distro-validate';
import { initDesignStudioArtifacts } from '../src/cli/commands/design-studio';

const REPO_ROOT = path.resolve(__dirname, '..');

function findSubcommand(parent: Command, name: string): Command | undefined {
  return parent.commands.find((c) => c.name() === name);
}

function assertCommandChain(program: Command, chain: string[]): Command {
  let cur: Command = program;
  for (const part of chain) {
    const next = findSubcommand(cur, part);
    expect(next, `missing subcommand "${part}" under "${cur.name()}"`).toBeDefined();
    cur = next!;
  }
  return cur;
}

describe('engineering kit gate — CLI surface', () => {
  it('registers expected engineering commands and nested subcommands', () => {
    const program = new Command();
    program.name('cm');
    registerAllCommands(program);

    const roots = [
      'browse',
      'sprint',
      'guardian',
      'canary',
      'second-opinion',
      'qa-visual',
      'conductor',
      'retro',
      'suggest',
      'design-studio',
      'distro',
    ];
    for (const r of roots) {
      expect(findSubcommand(program, r), `top-level command missing: ${r}`).toBeDefined();
    }

    assertCommandChain(program, ['browse', 'start']);
    assertCommandChain(program, ['sprint', 'init']);
    assertCommandChain(program, ['guardian', 'check']);
    assertCommandChain(program, ['retro', 'summary']);
    assertCommandChain(program, ['design-studio', 'init']);
    assertCommandChain(program, ['design-studio', 'status']);
    assertCommandChain(program, ['distro', 'validate']);
    assertCommandChain(program, ['conductor', 'list']);
  });
});

describe('engineering kit gate — core modules', () => {
  it('loadCmConfig returns empty object when config file missing', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cm-kit-'));
    try {
      expect(loadCmConfig(tmp)).toEqual({});
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('retro summary pipeline handles empty file', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cm-kit-'));
    try {
      const j = path.join(tmp, 'operational-learnings.jsonl');
      fs.writeFileSync(j, '', 'utf8');
      const entries = filterSince(loadRetroEntries(j), '2020-01-01');
      const byTool = countByTool(entries);
      const json = JSON.parse(formatRetroJson(entries, byTool));
      expect(json.total).toBe(0);
      expect(json.entries).toEqual([]);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('distro validate accepts in-repo skill with SKILL.md', () => {
    const skillDir = path.join(REPO_ROOT, 'skills', 'cm-how-it-work');
    const r = validateSkillPackDir(skillDir);
    expect(r.ok).toBe(true);
  });

  it('design-studio init is idempotent on file counts', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cm-kit-ds-'));
    try {
      const a = initDesignStudioArtifacts(tmp);
      expect(a.created).toBe(4);
      const b = initDesignStudioArtifacts(tmp);
      expect(b.created).toBe(0);
      expect(b.skipped).toBe(4);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});

describe('engineering kit gate — skills scripts', () => {
  it('validate-skills.mjs exits 0', () => {
    const script = path.join(REPO_ROOT, 'scripts', 'validate-skills.mjs');
    execFileSync(process.execPath, [script], { cwd: REPO_ROOT, stdio: 'pipe' });
  });

  it('build-skills.mjs --check exits 0', () => {
    const script = path.join(REPO_ROOT, 'scripts', 'build-skills.mjs');
    execFileSync(process.execPath, [script, '--check'], { cwd: REPO_ROOT, stdio: 'pipe' });
  });
});

describe('engineering kit gate — package contract', () => {
  it('package.json declares cm bin and test:gate script', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8')) as {
      bin?: Record<string, string>;
      scripts?: Record<string, string>;
    };
    expect(pkg.bin?.cm).toBe('dist/index.js');
    expect(pkg.scripts?.['test:gate']).toMatch(/vitest/);
  });

  it('dist/index.js exists after build (run npm run build in CI before tests)', () => {
    const entry = path.join(REPO_ROOT, 'dist', 'index.js');
    expect(fs.existsSync(entry), 'dist/index.js missing — run npm run build').toBe(true);
  });
});
