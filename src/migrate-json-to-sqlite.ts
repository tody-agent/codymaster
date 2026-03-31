import fs from 'fs';
import path from 'path';
import { openDb, insertLearning, insertDecision, getDbPath } from './context-db';
import type { DbLearning, DbDecision } from './context-db';

// ─── Types (legacy JSON shapes) ─────────────────────────────────────────────

interface LegacyLearning {
  id?: string;
  whatFailed?: string;
  what_failed?: string;
  error?: string;
  whyFailed?: string;
  why_failed?: string;
  cause?: string;
  howToPrevent?: string;
  how_to_prevent?: string;
  prevention?: string;
  scope?: string;
  ttl?: number;
  reinforceCount?: number;
  reinforce_count?: number;
  status?: string;
  date?: string;
  timestamp?: string;
  agent?: string;
  taskId?: string;
  task_id?: string;
  module?: string;
}

interface LegacyDecision {
  id?: string;
  decision?: string;
  rationale?: string;
  scope?: string;
  status?: string;
  supersededBy?: string;
  superseded_by?: string;
  date?: string;
  timestamp?: string;
  agent?: string;
}

// ─── Migration ───────────────────────────────────────────────────────────────

export interface MigrationResult {
  learnings: { migrated: number; skipped: number };
  decisions: { migrated: number; skipped: number };
  dbPath: string;
  backupCreated: boolean;
}

export function migrateJsonToSqlite(projectPath: string): MigrationResult {
  const cmDir = path.join(projectPath, '.cm');
  const dbPath = getDbPath(projectPath);

  openDb(dbPath);

  const result: MigrationResult = {
    learnings: { migrated: 0, skipped: 0 },
    decisions: { migrated: 0, skipped: 0 },
    dbPath,
    backupCreated: false,
  };

  // ── Migrate learnings ─────────────────────────────────────────────────────
  const learningsPath = path.join(cmDir, 'memory', 'learnings.json');
  if (fs.existsSync(learningsPath)) {
    // Backup
    const backupPath = learningsPath + '.backup';
    fs.copyFileSync(learningsPath, backupPath);
    result.backupCreated = true;

    let raw: LegacyLearning[] = [];
    try {
      raw = JSON.parse(fs.readFileSync(learningsPath, 'utf-8'));
    } catch { /* invalid JSON — skip */ }

    for (const l of raw) {
      try {
        const now = new Date().toISOString();
        const learning: DbLearning = {
          id: l.id ?? `L-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          what_failed: l.whatFailed ?? l.what_failed ?? l.error ?? '(unknown)',
          why_failed: l.whyFailed ?? l.why_failed ?? l.cause ?? '',
          how_to_prevent: l.howToPrevent ?? l.how_to_prevent ?? l.prevention ?? '',
          scope: l.scope ?? 'global',
          ttl: l.ttl ?? 60,
          reinforce_count: l.reinforceCount ?? l.reinforce_count ?? 0,
          status: l.status ?? 'active',
          created_at: l.date ?? l.timestamp ?? now,
          updated_at: l.date ?? l.timestamp ?? now,
          agent: l.agent,
          task_id: l.taskId ?? l.task_id,
          module: l.module,
        };
        insertLearning(dbPath, learning);
        result.learnings.migrated++;
      } catch {
        result.learnings.skipped++;
      }
    }
  }

  // ── Migrate decisions ─────────────────────────────────────────────────────
  const decisionsPath = path.join(cmDir, 'memory', 'decisions.json');
  if (fs.existsSync(decisionsPath)) {
    const backupPath = decisionsPath + '.backup';
    fs.copyFileSync(decisionsPath, backupPath);

    let raw: LegacyDecision[] = [];
    try {
      raw = JSON.parse(fs.readFileSync(decisionsPath, 'utf-8'));
    } catch { /* invalid JSON — skip */ }

    for (const d of raw) {
      try {
        const now = new Date().toISOString();
        const decision: DbDecision = {
          id: d.id ?? `D-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          decision: d.decision ?? '(unknown)',
          rationale: d.rationale ?? '',
          scope: d.scope ?? 'global',
          status: d.status ?? 'active',
          superseded_by: d.supersededBy ?? d.superseded_by,
          created_at: d.date ?? d.timestamp ?? now,
          agent: d.agent,
        };
        insertDecision(dbPath, decision);
        result.decisions.migrated++;
      } catch {
        result.decisions.skipped++;
      }
    }
  }

  return result;
}

// ─── Bidirectional: SQLite → JSON export (backward compat) ───────────────────

export interface ExportResult {
  learnings: number;
  decisions: number;
  learningsPath: string;
  decisionsPath: string;
}

export function exportSqliteToJson(projectPath: string): ExportResult {
  const cmDir = path.join(projectPath, '.cm');
  const memDir = path.join(cmDir, 'memory');
  const dbPath = getDbPath(projectPath);
  const db = openDb(dbPath);

  fs.mkdirSync(memDir, { recursive: true });

  // Export learnings
  const learnings = db.prepare(`
    SELECT id, what_failed, why_failed, how_to_prevent, scope, ttl,
           reinforce_count as reinforceCount, status, created_at as date,
           agent, task_id as taskId, module
    FROM learnings
    WHERE status != 'archived'
    ORDER BY created_at DESC
  `).all();

  const learningsPath = path.join(memDir, 'learnings.json');
  fs.writeFileSync(learningsPath, JSON.stringify(learnings, null, 2), 'utf-8');

  // Export decisions
  const decisions = db.prepare(`
    SELECT id, decision, rationale, scope, status,
           superseded_by as supersededBy, created_at as date, agent
    FROM decisions
    WHERE status != 'archived'
    ORDER BY created_at DESC
  `).all();

  const decisionsPath = path.join(memDir, 'decisions.json');
  fs.writeFileSync(decisionsPath, JSON.stringify(decisions, null, 2), 'utf-8');

  return {
    learnings: (learnings as unknown[]).length,
    decisions: (decisions as unknown[]).length,
    learningsPath,
    decisionsPath,
  };
}
