import fs from 'fs';
import path from 'path';

// ─── Types ──────────────────────────────────────────────────────────────────

interface LearningEntry {
  id: string;
  error?: string;
  whatFailed?: string;
  scope?: string;
  ttl?: number;
  status?: string;
  reinforceCount?: number;
}

export interface IndexResult {
  learnings: string;
  skeleton: string;
  continuity: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const CM_DIR = '.cm';

// ─── Learnings Index (L0) ───────────────────────────────────────────────────

export function generateLearningsIndex(projectPath: string): string {
  const learningsPath = path.join(projectPath, CM_DIR, 'memory', 'learnings.json');
  let learnings: LearningEntry[] = [];

  try {
    if (fs.existsSync(learningsPath)) {
      learnings = JSON.parse(fs.readFileSync(learningsPath, 'utf-8'));
    }
  } catch {
    learnings = [];
  }

  const active = learnings.filter(l => !l.status || l.status === 'active');
  const lines: string[] = [
    `# Learnings Index (${active.length} entries)`,
    `> L0 summary — read full entry by ID when needed`,
    '',
  ];

  for (const l of active) {
    const id = l.id || '?';
    const summary = l.error || l.whatFailed || '(no description)';
    const scope = l.scope ? `[${l.scope}` : '[global';
    const ttl = l.ttl ? `, TTL:${l.ttl}d]` : ']';
    const reinforce = l.reinforceCount && l.reinforceCount > 0 ? ` ×${l.reinforceCount}` : '';
    lines.push(`- ${id}: ${summary} ${scope}${ttl}${reinforce}`);
  }

  const index = lines.join('\n');

  // Write to disk
  const outPath = path.join(projectPath, CM_DIR, 'learnings-index.md');
  try {
    fs.writeFileSync(outPath, index, 'utf-8');
  } catch { /* non-fatal */ }

  return index;
}

// ─── Skeleton Index (L0) ────────────────────────────────────────────────────

export function generateSkeletonIndex(projectPath: string): string {
  const skeletonPath = path.join(projectPath, CM_DIR, 'skeleton.md');

  if (!fs.existsSync(skeletonPath)) {
    const fallback = '# Skeleton Index\n> No skeleton.md found. Run `cm continuity index` to generate.\n';
    const outPath = path.join(projectPath, CM_DIR, 'skeleton-index.md');
    try { fs.writeFileSync(outPath, fallback, 'utf-8'); } catch { /* non-fatal */ }
    return fallback;
  }

  const content = fs.readFileSync(skeletonPath, 'utf-8');
  const lines = content.split('\n');
  const result: string[] = ['# Skeleton Index (L0)\n'];

  // Extract Entry Points section
  const entryIdx = lines.findIndex(l => /entry points?/i.test(l));
  if (entryIdx !== -1) {
    result.push('## Entry Points');
    for (let i = entryIdx + 1; i < Math.min(entryIdx + 8, lines.length); i++) {
      if (lines[i].startsWith('#')) break;
      if (lines[i].trim()) result.push(lines[i]);
    }
    result.push('');
  }

  // Extract top-level src/ module names from directory tree
  const modules: string[] = [];
  for (const line of lines) {
    // Match lines like "  continuity.ts (469 lines)" or "src/continuity.ts"
    const m = line.match(/(?:^|\s{2,4})(\w[\w-]+)\.ts\b/);
    if (m && !m[1].includes('test') && !m[1].includes('spec')) {
      if (!modules.includes(m[1])) modules.push(m[1]);
    }
    if (modules.length >= 12) break;
  }

  if (modules.length > 0) {
    result.push('## Core Modules');
    result.push(modules.map(m => `- ${m}`).join('\n'));
    result.push('');
  }

  // Extract Config Files section
  const configIdx = lines.findIndex(l => /config files?/i.test(l));
  if (configIdx !== -1) {
    result.push('## Config');
    for (let i = configIdx + 1; i < Math.min(configIdx + 6, lines.length); i++) {
      if (lines[i].startsWith('#')) break;
      if (lines[i].trim()) result.push(lines[i]);
    }
    result.push('');
  }

  // Extract Tests section
  const testIdx = lines.findIndex(l => /^#+\s*tests?/i.test(l));
  if (testIdx !== -1) {
    result.push('## Tests');
    for (let i = testIdx + 1; i < Math.min(testIdx + 6, lines.length); i++) {
      if (lines[i].startsWith('#')) break;
      if (lines[i].trim()) result.push(lines[i]);
    }
  }

  const index = result.join('\n');
  const outPath = path.join(projectPath, CM_DIR, 'skeleton-index.md');
  try { fs.writeFileSync(outPath, index, 'utf-8'); } catch { /* non-fatal */ }

  return index;
}

// ─── Continuity Abstract ────────────────────────────────────────────────────

export function generateContinuityAbstract(projectPath: string): string {
  const contPath = path.join(projectPath, CM_DIR, 'CONTINUITY.md');

  if (!fs.existsSync(contPath)) {
    return '> No session active.';
  }

  const content = fs.readFileSync(contPath, 'utf-8');

  // Extract key fields
  const phaseMatch = content.match(/Current Phase:\s*(.+)/);
  const iterMatch = content.match(/Current Iteration:\s*(\d+)/);
  const goalMatch = content.match(/## Active Goal\s*\n([^\n#]+)/);
  const taskMatch = content.match(/- Title:\s*(.+)/);
  const nextMatch = content.match(/## Next Actions.*?\n1\.\s*(.+)/);

  const phase = phaseMatch ? phaseMatch[1].trim() : 'idle';
  const iter = iterMatch ? iterMatch[1] : '0';
  const goal = goalMatch ? goalMatch[1].trim() : 'No active goal';
  const task = taskMatch ? taskMatch[1].trim() : null;
  const next = nextMatch ? nextMatch[1].trim() : null;

  const parts = [
    `**Phase:** ${phase} (iter ${iter}) | **Goal:** ${goal}`,
  ];
  if (task) parts.push(`**Task:** ${task}`);
  if (next) parts.push(`**Next:** ${next}`);

  return parts.join('\n');
}

// ─── Refresh All ────────────────────────────────────────────────────────────

export function refreshAllIndexes(projectPath: string): IndexResult {
  return {
    learnings: generateLearningsIndex(projectPath),
    skeleton: generateSkeletonIndex(projectPath),
    continuity: generateContinuityAbstract(projectPath),
  };
}
