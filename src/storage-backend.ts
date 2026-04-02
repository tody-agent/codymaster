import fs from 'fs';
import path from 'path';
import {
  openDb, closeDb, getDbPath,
  insertLearning, getLearningById, queryLearnings,
  insertDecision, queryDecisions,
  upsertIndex, getIndex,
  writeSkillOutput, getSkillOutputs,
} from './context-db';
import type { DbLearning, DbDecision, DbIndex, DbSkillOutput } from './context-db';
import { VikingBackend as RealVikingBackend } from './backends/viking-backend';
import type { VikingConfig } from './backends/viking-http-client';
import { DEFAULT_VIKING_CONFIG } from './backends/viking-http-client';

// Re-export types so callers only need one import
export type { DbLearning, DbDecision, DbIndex, DbSkillOutput };

// ─── Interface ────────────────────────────────────────────────────────────────

/**
 * StorageBackend — abstraction layer over CodyMaster's persistent memory store.
 *
 * Implement this interface to swap the storage engine without touching callers.
 * Current implementations: SqliteBackend (default), VikingBackend (stub).
 *
 * Config: .cm/config.yaml → storage.backend: sqlite | viking
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
}


// ─── Config loader ────────────────────────────────────────────────────────────

interface StorageConfig {
  storage?: {
    backend?: string;
    viking?: Partial<VikingConfig>;
  };
}

/**
 * Minimal YAML parser — reads `storage.backend` and `storage.viking.*` keys.
 * Avoids adding a js-yaml dependency for a handful of config fields.
 *
 * Supported format:
 *   storage:
 *     backend: viking
 *     viking:
 *       host: localhost
 *       port: 1933
 *       workspace: codymaster
 *       timeout: 60000
 */
function loadStorageConfig(projectPath: string): StorageConfig {
  const configPath = path.join(projectPath, '.cm', 'config.yaml');
  if (!fs.existsSync(configPath)) return {};
  try {
    const raw = fs.readFileSync(configPath, 'utf-8');

    // Extract storage.backend
    const backendMatch = raw.match(
      /^storage:\s*\n(?:[ \t]+\S[^\n]*\n)*?[ \t]+backend:\s*(\S+)/m,
    );
    const backend = backendMatch?.[1]?.trim();

    // Extract storage.viking.* keys
    const vikingBlock = raw.match(/[ \t]+viking:\s*\n((?:[ \t]{4,}[^\n]+\n?)*)/m);
    let viking: Partial<VikingConfig> | undefined;
    if (vikingBlock?.[1]) {
      viking = {};
      for (const line of vikingBlock[1].split('\n')) {
        const kv = line.match(/[ \t]+(\w+):\s*(\S+)/);
        if (!kv) continue;
        const [, key, val] = kv;
        if (key === 'host')      viking.host = val;
        if (key === 'workspace') viking.workspace = val;
        if (key === 'port')      viking.port = parseInt(val, 10);
        if (key === 'timeout')   viking.timeout = parseInt(val, 10);
      }
    }

    if (!backend) return {};
    return { storage: { backend, ...(viking ? { viking } : {}) } };
  } catch {
    return {};
  }
}

// ─── Factory ─────────────────────────────────────────────────────────────────

/**
 * Returns the configured StorageBackend for the given project.
 *
 * Reads `.cm/config.yaml → storage.backend` (default: `sqlite`).
 * For `viking` backend, reads `storage.viking.*` for connection config.
 *
 * Usage:
 *   const backend = getBackend('/path/to/project');
 *   backend.initialize();
 *   const results = backend.queryLearnings('i18n locale');
 */
export function getBackend(projectPath: string): StorageBackend {
  const config = loadStorageConfig(projectPath);
  const engine = config?.storage?.backend ?? 'sqlite';

  switch (engine) {
    case 'viking': {
      const vikingConfig = { ...DEFAULT_VIKING_CONFIG, ...config?.storage?.viking };
      return new RealVikingBackend(vikingConfig);
    }
    case 'sqlite':
    default:
      return new SqliteBackend(projectPath);
  }
}

// Re-export VikingBackend so callers can use it directly if needed
export { RealVikingBackend as VikingBackend };
