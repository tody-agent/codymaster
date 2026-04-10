/**
 * Proactive skill hints from git status + sprint state (`cm suggest`).
 */

import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { readSprintState, skillMappingForStep, type SprintStep } from './sprint-pipeline';

export interface Suggestion {
  skill: string;
  reason: string;
}

function dedupe(s: Suggestion[]): Suggestion[] {
  const seen = new Set<string>();
  const out: Suggestion[] = [];
  for (const x of s) {
    const k = x.skill.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out;
}

export function gitPorcelain(projectPath: string): string {
  try {
    return execFileSync('git', ['status', '--porcelain'], {
      cwd: projectPath,
      encoding: 'utf8',
      maxBuffer: 2_000_000,
    });
  } catch {
    return '';
  }
}

export function suggestFromContext(projectPath: string): Suggestion[] {
  const root = path.resolve(projectPath);
  const out: Suggestion[] = [];
  const porcelain = gitPorcelain(root);
  const lines = porcelain.split('\n').filter(Boolean);

  const paths = lines.map((l) => l.slice(3).trim()).filter(Boolean);
  const joined = paths.join('\n');

  if (/\.test\.(ts|tsx|js|jsx)\b/m.test(joined)) {
    out.push({ skill: 'cm-tdd', reason: 'Modified or untracked test files in git status.' });
  }
  if (/\.(md|mdx)\b/m.test(joined)) {
    out.push({ skill: 'cm-dockit', reason: 'Markdown/docs paths changed.' });
  }
  if (/(package\.json|package-lock\.json|pnpm-lock|yarn\.lock)/m.test(joined)) {
    out.push({ skill: 'cm-test-gate', reason: 'Dependency lockfiles changed; run the test gate.' });
  }
  if (/(\.github\/workflows\/|Dockerfile|fly\.toml|wrangler)/m.test(joined)) {
    out.push({ skill: 'cm-safe-deploy', reason: 'CI or deploy config changed.' });
  }
  if (lines.length > 8) {
    out.push({ skill: 'cm-git-worktrees', reason: 'Many working-tree changes; consider an isolated worktree.' });
  }

  const sprint = readSprintState(root);
  if (sprint && sprint.current_index >= 0 && sprint.current_index < sprint.pipeline.length) {
    const step = sprint.pipeline[sprint.current_index] as SprintStep;
    const skill = skillMappingForStep(step);
    out.push({
      skill,
      reason: `Active sprint step: **${step}** (index ${sprint.current_index + 1}/${sprint.pipeline.length}).`,
    });
  }

  if (fs.existsSync(path.join(root, '.cm', 'config.yaml'))) {
    out.push({
      skill: 'cm-engineering-meta',
      reason: '`.cm/config.yaml` present; engineering commands honor shared config.',
    });
  }

  return dedupe(out);
}
