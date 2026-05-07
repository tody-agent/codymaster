/**
 * Stack Detection Engine — scan a project root for ecosystem signals
 * (package.json, pyproject.toml, Cargo.toml, go.mod, Gemfile) and emit
 * a token-light suggestion list.
 *
 * Output is intentionally compact — designed to be embedded into the
 * agent context at session start without bloating the budget.
 */

import fs from 'fs';
import path from 'path';

export type StackKind =
  | 'node'
  | 'python'
  | 'rust'
  | 'go'
  | 'ruby'
  | 'unknown';

export interface DetectedFramework {
  /** Canonical id, e.g. "react", "next", "django". */
  id: string;
  /** Source file the signal came from. */
  source: string;
  /** Resolved version range/string when available. */
  version?: string;
}

export interface StackReport {
  /** Project root scanned. */
  root: string;
  /** Distinct ecosystems present. */
  kinds: StackKind[];
  /** Frameworks/libraries surfaced. */
  frameworks: DetectedFramework[];
  /** Skills suggested for this stack (skill name without the cm- prefix when canonical). */
  suggested_skills: string[];
  /** ISO timestamp the report was generated. */
  generated_at: string;
}

const FRAMEWORK_TO_SKILLS: Record<string, string[]> = {
  react: ['cm-design-system'],
  next: ['cm-design-system', 'cm-safe-deploy'],
  vue: ['cm-design-system'],
  svelte: ['cm-design-system'],
  vite: ['cm-design-system'],
  express: ['cm-safe-deploy'],
  fastify: ['cm-safe-deploy'],
  vitest: ['cm-tdd'],
  jest: ['cm-tdd'],
  playwright: ['cm-browse'],
  django: ['cm-safe-deploy'],
  flask: ['cm-safe-deploy'],
  fastapi: ['cm-safe-deploy'],
  pytest: ['cm-tdd'],
  rails: ['cm-safe-deploy'],
  rspec: ['cm-tdd'],
  axum: ['cm-safe-deploy'],
  actix: ['cm-safe-deploy'],
  gin: ['cm-safe-deploy'],
  echo: ['cm-safe-deploy'],
};

const KIND_DEFAULT_SKILLS: Record<StackKind, string[]> = {
  node: ['cm-tdd', 'cm-clean-code', 'cm-quality-gate'],
  python: ['cm-tdd', 'cm-clean-code', 'cm-quality-gate'],
  rust: ['cm-tdd', 'cm-clean-code', 'cm-quality-gate'],
  go: ['cm-tdd', 'cm-clean-code', 'cm-quality-gate'],
  ruby: ['cm-tdd', 'cm-clean-code', 'cm-quality-gate'],
  unknown: ['cm-quality-gate'],
};

function readText(p: string): string | null {
  try {
    if (!fs.existsSync(p)) return null;
    return fs.readFileSync(p, 'utf8');
  } catch {
    return null;
  }
}

function safeParseJson(s: string | null): any {
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}

function detectNode(root: string): DetectedFramework[] {
  const pkg = safeParseJson(readText(path.join(root, 'package.json')));
  if (!pkg) return [];
  const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
  const out: DetectedFramework[] = [];
  const map: Array<[string, string]> = [
    ['react', 'react'],
    ['next', 'next'],
    ['vue', 'vue'],
    ['svelte', 'svelte'],
    ['vite', 'vite'],
    ['express', 'express'],
    ['fastify', 'fastify'],
    ['vitest', 'vitest'],
    ['jest', 'jest'],
    ['@playwright/test', 'playwright'],
  ];
  for (const [pkgName, fwId] of map) {
    if (deps[pkgName]) {
      out.push({ id: fwId, source: 'package.json', version: String(deps[pkgName]) });
    }
  }
  return out;
}

function detectPython(root: string): DetectedFramework[] {
  const out: DetectedFramework[] = [];
  const py = readText(path.join(root, 'pyproject.toml'));
  const req = readText(path.join(root, 'requirements.txt'));
  const blob = `${py ?? ''}\n${req ?? ''}`;
  const map: Array<[RegExp, string]> = [
    [/\bdjango\b/i, 'django'],
    [/\bflask\b/i, 'flask'],
    [/\bfastapi\b/i, 'fastapi'],
    [/\bpytest\b/i, 'pytest'],
  ];
  for (const [re, id] of map) {
    if (re.test(blob)) {
      out.push({ id, source: py ? 'pyproject.toml' : 'requirements.txt' });
    }
  }
  return out;
}

function detectRust(root: string): DetectedFramework[] {
  const c = readText(path.join(root, 'Cargo.toml'));
  if (!c) return [];
  const out: DetectedFramework[] = [];
  if (/\baxum\s*=/.test(c)) out.push({ id: 'axum', source: 'Cargo.toml' });
  if (/\bactix-web\s*=/.test(c)) out.push({ id: 'actix', source: 'Cargo.toml' });
  return out;
}

function detectGo(root: string): DetectedFramework[] {
  const m = readText(path.join(root, 'go.mod'));
  if (!m) return [];
  const out: DetectedFramework[] = [];
  if (/gin-gonic\/gin/.test(m)) out.push({ id: 'gin', source: 'go.mod' });
  if (/labstack\/echo/.test(m)) out.push({ id: 'echo', source: 'go.mod' });
  return out;
}

function detectRuby(root: string): DetectedFramework[] {
  const g = readText(path.join(root, 'Gemfile'));
  if (!g) return [];
  const out: DetectedFramework[] = [];
  if (/['"]rails['"]/.test(g)) out.push({ id: 'rails', source: 'Gemfile' });
  if (/['"]rspec['"]/.test(g)) out.push({ id: 'rspec', source: 'Gemfile' });
  return out;
}

export function detectStack(root: string): StackReport {
  const kinds: StackKind[] = [];
  if (fs.existsSync(path.join(root, 'package.json'))) kinds.push('node');
  if (
    fs.existsSync(path.join(root, 'pyproject.toml')) ||
    fs.existsSync(path.join(root, 'requirements.txt'))
  ) kinds.push('python');
  if (fs.existsSync(path.join(root, 'Cargo.toml'))) kinds.push('rust');
  if (fs.existsSync(path.join(root, 'go.mod'))) kinds.push('go');
  if (fs.existsSync(path.join(root, 'Gemfile'))) kinds.push('ruby');
  if (kinds.length === 0) kinds.push('unknown');

  const frameworks: DetectedFramework[] = [
    ...detectNode(root),
    ...detectPython(root),
    ...detectRust(root),
    ...detectGo(root),
    ...detectRuby(root),
  ];

  const suggested = new Set<string>();
  for (const k of kinds) for (const s of KIND_DEFAULT_SKILLS[k]) suggested.add(s);
  for (const f of frameworks) for (const s of FRAMEWORK_TO_SKILLS[f.id] ?? []) suggested.add(s);

  return {
    root,
    kinds,
    frameworks,
    suggested_skills: [...suggested].sort(),
    generated_at: new Date().toISOString(),
  };
}

/**
 * Render the stack report as a token-light Markdown block suitable for
 * `.cm/project-skills.md`. Caller is responsible for writing it.
 */
export function renderStackMarkdown(r: StackReport): string {
  const lines: string[] = [];
  lines.push('# Project Stack');
  lines.push('');
  lines.push(`Generated: ${r.generated_at}`);
  lines.push('');
  lines.push(`Ecosystems: ${r.kinds.join(', ')}`);
  if (r.frameworks.length) {
    lines.push('');
    lines.push('Frameworks:');
    for (const f of r.frameworks) {
      const v = f.version ? ` (${f.version})` : '';
      lines.push(`- ${f.id}${v}  [${f.source}]`);
    }
  }
  if (r.suggested_skills.length) {
    lines.push('');
    lines.push('Suggested skills:');
    for (const s of r.suggested_skills) lines.push(`- ${s}`);
  }
  lines.push('');
  return lines.join('\n');
}

export function writeProjectSkills(root: string, r: StackReport): string {
  const dir = path.join(root, '.cm');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'project-skills.md');
  fs.writeFileSync(file, renderStackMarkdown(r), 'utf8');
  return file;
}
