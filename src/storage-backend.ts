import {
  openDb, closeDb, getDbPath,
  insertLearning, getLearningById, queryLearnings,
  insertDecision, queryDecisions,
  upsertIndex, getIndex,
  writeSkillOutput, getSkillOutputs,
  recordExecutionAnalysis, getExecutionAnalyses, getSkillMetric, listSkillMetrics,
} from './context-db';
import type {
  DbLearning, DbDecision, DbIndex, DbSkillOutput, DbExecutionAnalysis, DbSkillMetric,
  DbEvolutionRecommendation, DbSkillJudgment,
} from './context-db';
import { loadCmConfig } from './cm-config';

// Re-export types so callers only need one import
export type {
  DbLearning, DbDecision, DbIndex, DbSkillOutput, DbExecutionAnalysis, DbSkillMetric,
  DbEvolutionRecommendation, DbSkillJudgment,
};

// ─── Interface ────────────────────────────────────────────────────────────────

/**
 * StorageBackend — abstraction layer over CodyMaster's persistent memory store.
 *
 * Implement this interface to swap the storage engine without touching callers.
 * Current implementation: SqliteBackend (default).
 *
 * Config: .cm/config.yaml → storage.backend: sqlite
 */
export interface StorageBackend {
  // Lifecycle
  initialize(): void;
  close(): void;

  // Learnings
  insertLearning(learning: DbLearning): void;
  getLearningById(id: string): DbLearning | null;
  queryLearnings(query: string, scope?: string, limit?: number): DbLearning[];

  // Decisions
  insertDecision(decision: DbDecision): void;
  queryDecisions(query: string, limit?: number): DbDecision[];

  // Index cache (L0/L1 pre-generated content)
  upsertIndex(resource: string, level: string, content: string, sourceHash?: string): void;
  getIndex(resource: string, level: string): DbIndex | null;

  // Skill chain outputs
  writeSkillOutput(output: DbSkillOutput): void;
  getSkillOutputs(sessionId: string): DbSkillOutput[];

  // Execution telemetry
  recordExecutionAnalysis(analysis: DbExecutionAnalysis): void;
  getExecutionAnalyses(limit?: number): DbExecutionAnalysis[];
  getSkillMetric(skill: string): DbSkillMetric | null;
  listSkillMetrics(limit?: number): DbSkillMetric[];
}

// ─── SqliteBackend ────────────────────────────────────────────────────────────

/**
 * Default backend — thin wrapper around context-db.ts (better-sqlite3 + FTS5).
 * context-db.ts is NOT modified; this class is purely additive.
 */
export class SqliteBackend implements StorageBackend {
  private readonly dbPath: string;

  constructor(projectPath: string) {
    this.dbPath = getDbPath(projectPath);
  }

  initialize(): void { openDb(this.dbPath); }
  close(): void      { closeDb(this.dbPath); }

  insertLearning(l: DbLearning): void            { insertLearning(this.dbPath, l); }
  getLearningById(id: string): DbLearning | null { return getLearningById(this.dbPath, id); }
  queryLearnings(q: string, scope?: string, limit = 10): DbLearning[] {
    return queryLearnings(this.dbPath, q, scope, limit);
  }

  insertDecision(d: DbDecision): void                    { insertDecision(this.dbPath, d); }
  queryDecisions(q: string, limit = 10): DbDecision[]   { return queryDecisions(this.dbPath, q, limit); }

  upsertIndex(resource: string, level: string, content: string, sourceHash?: string): void {
    upsertIndex(this.dbPath, resource, level, content, sourceHash);
  }
  getIndex(resource: string, level: string): DbIndex | null {
    return getIndex(this.dbPath, resource, level);
  }

  writeSkillOutput(o: DbSkillOutput): void               { writeSkillOutput(this.dbPath, o); }
  getSkillOutputs(sessionId: string): DbSkillOutput[]    { return getSkillOutputs(this.dbPath, sessionId); }

  recordExecutionAnalysis(a: DbExecutionAnalysis): void  { recordExecutionAnalysis(this.dbPath, a); }
  getExecutionAnalyses(limit = 20): DbExecutionAnalysis[] { return getExecutionAnalyses(this.dbPath, limit); }
  getSkillMetric(skill: string): DbSkillMetric | null    { return getSkillMetric(this.dbPath, skill); }
  listSkillMetrics(limit = 50): DbSkillMetric[]          { return listSkillMetrics(this.dbPath, limit); }
}


// ─── Factory ─────────────────────────────────────────────────────────────────

/**
 * Returns the configured StorageBackend for the given project.
 *
 * Reads `.cm/config.yaml → storage.backend` via `loadCmConfig` (default: `sqlite`).
 * Legacy `storage.backend: viking` configs are warned and routed back to sqlite.
 *
 * Usage:
 *   const backend = getBackend('/path/to/project');
 *   backend.initialize();
 *   const results = backend.queryLearnings('i18n locale');
 */
export function getBackend(projectPath: string): StorageBackend {
  const cfg = loadCmConfig(projectPath);
  const engine = (cfg.storage?.backend ?? 'sqlite').toLowerCase();

  switch (engine) {
    case 'viking': {
      console.warn(
        '[CodyMaster] storage.backend: viking has been removed. ' +
        'Falling back to sqlite for the supported default path.'
      );
      return new SqliteBackend(projectPath);
    }
    case 'sqlite':
    default:
      return new SqliteBackend(projectPath);
  }
}
