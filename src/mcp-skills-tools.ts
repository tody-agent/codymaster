/**
 * Extra MCP tool handlers: plan/review/qa/deploy/search — bridge to sprint + memory.
 */

import fs from 'fs';
import path from 'path';
import { readBus } from './context-bus';
import {
  readSprintState,
  SPRINT_STEPS,
  skillMappingForStep,
  sprintArtifactPreviewFromDisk,
} from './sprint-pipeline';
import { openDb, getDbPath, queryLearnings, queryDecisions } from './context-db';

export function cmPlanTool(projectPath: string) {
  const sprint = readSprintState(projectPath);
  const bus = readBus(projectPath);
  const preview = sprintArtifactPreviewFromDisk(projectPath);
  return {
    sprint_active: !!sprint,
    sprint: sprint ?? null,
    context_bus: bus,
    default_pipeline: SPRINT_STEPS,
    next_skill_hint: sprint
      ? sprint.current_index >= sprint.pipeline.length
        ? '(sprint complete — run cm-retro)'
        : skillMappingForStep(sprint.pipeline[sprint.current_index])
      : 'cm-planning',
    artifact_paths: preview.artifacts,
  };
}

export function cmReviewTool(projectPath: string) {
  const artDir = path.join(projectPath, '.cm', 'sprint', 'artifacts', 'review.md');
  let review = '';
  if (fs.existsSync(artDir)) review = fs.readFileSync(artDir, 'utf8');
  return {
    review_artifact: artDir,
    has_content: review.length > 0,
    preview: review.slice(0, 4000),
    hint: 'Use cm-code-review skill for full checklist; paste diff + requirements.',
  };
}

export function cmQaTool(projectPath: string) {
  return {
    browse_daemon: 'Run: cm browse start --token <secret> then POST /session/start',
    visual: 'Use the cm-browse workflow against http://localhost:3000 for visual QA',
    gates: ['cm-quality-gate'],
  };
}

export function cmDeployTool(projectPath: string) {
  return {
    hint: 'Use cm-safe-deploy skill; after ship run cm canary --url <prod>',
    project: projectPath,
  };
}

export function cmSearchTool(
  projectPath: string,
  args: { query: string; scope?: 'learnings' | 'decisions' | 'all'; limit?: number }
) {
  const { query, scope = 'all', limit = 10 } = args;
  const dbPath = getDbPath(projectPath);
  openDb(dbPath);
  const results: Record<string, unknown>[] = [];
  if (scope === 'all' || scope === 'learnings') {
    for (const l of queryLearnings(dbPath, query, undefined, limit)) {
      results.push({ type: 'learning', ...l });
    }
  }
  if (scope === 'all' || scope === 'decisions') {
    for (const d of queryDecisions(dbPath, query, limit)) {
      results.push({ type: 'decision', ...d });
    }
  }
  return { query, scope, count: results.length, results };
}

export function cmMemoryQueryTool(
  projectPath: string,
  args: { query: string; limit?: number }
) {
  return cmSearchTool(projectPath, { ...args, scope: 'all' });
}
