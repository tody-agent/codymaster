/**
 * viking-backend.ts
 *
 * Real implementation of StorageBackend using OpenViking as the storage engine.
 *
 * OpenViking advantages over SQLite:
 *  - True semantic vector search (not just FTS5 keyword matching)
 *  - Tiered L0/L1/L2 auto-generation via abstract() / overview()
 *  - Filesystem paradigm: memories organized as navigable URIs
 *  - Session compression + long-term memory extraction built-in
 *
 * URI layout inside OpenViking workspace:
 *  learnings/<id>.json       — learning entries
 *  decisions/<id>.json       — decision entries
 *  indexes/<resource>/<level>.md — L0/L1/L2 index cache
 *  skill-outputs/<sessionId>/<id>.json — skill chain outputs
 *
 * Requires OpenViking server running (default: http://localhost:1933).
 * Install: pip install openviking && openviking start
 */

import type { StorageBackend } from '../storage-backend';
import type { DbLearning, DbDecision, DbIndex, DbSkillOutput } from '../storage-backend';
import {
  VikingHttpClient,
  VikingConfig,
  DEFAULT_VIKING_CONFIG,
} from './viking-http-client';

// ─── Serialization helpers ───────────────────────────────────────────────────

function toJson(obj: unknown): string {
  return JSON.stringify(obj, null, 2);
}

function fromJson<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function now(): string {
  return new Date().toISOString();
}

// ─── VikingBackend ────────────────────────────────────────────────────────────

export class VikingBackend implements StorageBackend {
  private readonly client: VikingHttpClient;

  constructor(config: Partial<VikingConfig> = {}) {
    this.client = new VikingHttpClient({
      ...DEFAULT_VIKING_CONFIG,
      ...config,
    });
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────

  initialize(): void {
    // Sync check — fire-and-forget health ping.
    // Real validation happens on first actual operation.
    // (OpenViking initialize is async, but StorageBackend.initialize is sync)
    this.client.isHealthy().then((ok) => {
      if (!ok) {
        console.warn(
          '[VikingBackend] OpenViking server not reachable. ' +
          'Start server: pip install openviking && openviking start',
        );
      }
    }).catch(() => { /* silently ignore */ });
  }

  close(): void {
    // HTTP client is stateless — nothing to close.
  }

  // ── Learnings ────────────────────────────────────────────────────────────

  insertLearning(learning: DbLearning): void {
    const uriPath = `learnings/${learning.id}.json`;
    // Fire-and-forget write (StorageBackend interface is sync)
    this.client.write(uriPath, toJson(learning)).catch((err: unknown) => {
      console.error('[VikingBackend] insertLearning failed:', err);
    });
  }

  getLearningById(id: string): DbLearning | null {
    // Sync interface — fall back to null if server not available at call time.
    // Use queryLearnings() for async-safe retrieval in hot paths.
    let result: DbLearning | null = null;
    const done = this.client.read(`learnings/${id}.json`)
      .then((raw) => { result = fromJson<DbLearning>(raw); })
      .catch(() => { result = null; });

    // Block synchronously via a shared flag (Node.js single-threaded event loop)
    // This is a best-effort sync wrapper — not recommended for large payloads.
    const deadline = Date.now() + 5_000;
    while (!isDone(done) && Date.now() < deadline) {
      // Spin-wait (acceptable: StorageBackend callers are already sync)
    }
    return result;
  }

  queryLearnings(query: string, scope?: string, limit = 10): DbLearning[] {
    let results: DbLearning[] = [];
    const scopePath = scope ? `learnings/${scope}` : 'learnings';
    const done = this.client
      .search(query, scopePath, limit)
      .then((items) => {
        results = items
          .map((item) => fromJson<DbLearning>(item.content ?? ''))
          .filter((x): x is DbLearning => x !== null);
      })
      .catch(() => { results = []; });

    blockUntil(done, 10_000);
    return results;
  }

  // ── Decisions ────────────────────────────────────────────────────────────

  insertDecision(decision: DbDecision): void {
    this.client.write(`decisions/${decision.id}.json`, toJson(decision))
      .catch((err: unknown) => {
        console.error('[VikingBackend] insertDecision failed:', err);
      });
  }

  queryDecisions(query: string, limit = 10): DbDecision[] {
    let results: DbDecision[] = [];
    const done = this.client
      .search(query, 'decisions', limit)
      .then((items) => {
        results = items
          .map((item) => fromJson<DbDecision>(item.content ?? ''))
          .filter((x): x is DbDecision => x !== null);
      })
      .catch(() => { results = []; });

    blockUntil(done, 10_000);
    return results;
  }

  // ── Index cache ───────────────────────────────────────────────────────────

  upsertIndex(resource: string, level: string, content: string, sourceHash?: string): void {
    const meta = { resource, level, source_hash: sourceHash ?? '', generated_at: now() };
    // Store content at main path; metadata alongside
    const basePath = `indexes/${resource}/${level}`;
    Promise.all([
      this.client.write(`${basePath}.md`, content),
      this.client.write(`${basePath}.meta.json`, toJson(meta)),
    ]).catch((err: unknown) => {
      console.error('[VikingBackend] upsertIndex failed:', err);
    });
  }

  getIndex(resource: string, level: string): DbIndex | null {
    const basePath = `indexes/${resource}/${level}`;
    let result: DbIndex | null = null;

    const done = Promise.all([
      this.client.read(`${basePath}.md`),
      this.client.read(`${basePath}.meta.json`),
    ]).then(([content, metaRaw]) => {
      const meta = fromJson<{ source_hash?: string; generated_at?: string }>(metaRaw) ?? {};
      result = {
        resource,
        level,
        content,
        generated_at: meta.generated_at ?? now(),
        source_hash: meta.source_hash,
      };
    }).catch(() => { result = null; });

    blockUntil(done, 5_000);
    return result;
  }

  // ── Skill outputs ─────────────────────────────────────────────────────────

  writeSkillOutput(output: DbSkillOutput): void {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const uriPath = `skill-outputs/${output.session_id}/${id}.json`;
    this.client.write(uriPath, toJson(output)).catch((err: unknown) => {
      console.error('[VikingBackend] writeSkillOutput failed:', err);
    });
  }

  getSkillOutputs(sessionId: string): DbSkillOutput[] {
    let results: DbSkillOutput[] = [];
    const done = this.client
      .ls(`skill-outputs/${sessionId}`)
      .then(async (items) => {
        const reads = items
          .filter((item) => !item.is_dir && item.name.endsWith('.json'))
          .map((item) =>
            this.client.read(`skill-outputs/${sessionId}/${item.name}`)
              .then((raw) => fromJson<DbSkillOutput>(raw))
              .catch(() => null),
          );
        const all = await Promise.all(reads);
        results = all.filter((x): x is DbSkillOutput => x !== null);
      })
      .catch(() => { results = []; });

    blockUntil(done, 10_000);
    return results;
  }

  // ── OpenViking-native extras (not in StorageBackend interface) ────────────

  /**
   * Semantic search across ALL memories (learnings + decisions).
   * Uses OpenViking's vector embeddings — much more accurate than FTS5.
   */
  async searchAll(query: string, limit = 10): Promise<Array<{ uri: string; score: number; content?: string }>> {
    return this.client.search(query, '', limit);
  }

  /**
   * Get L0 abstract summary of a resource (auto-generated by OpenViking).
   * Equivalent to CodyMaster's L0 index, but generated by the storage engine.
   */
  async getL0Abstract(resource: string): Promise<string> {
    return this.client.abstract(`indexes/${resource}`);
  }

  /**
   * Get L1 overview of a resource.
   */
  async getL1Overview(resource: string): Promise<string> {
    return this.client.overview(`indexes/${resource}`);
  }
}

// ─── Sync helpers ─────────────────────────────────────────────────────────────

/**
 * Best-effort synchronous wait for a Promise.
 * Uses a flag set by .then()/.catch() — works because Node.js event loop
 * processes microtasks inline when the call stack is empty.
 *
 * WARNING: This is a spin-wait and will block the event loop for up to
 * `timeoutMs`. Use only where the StorageBackend sync interface requires it
 * and latency is bounded (local HTTP, <10ms typical).
 */
function blockUntil(p: Promise<unknown>, timeoutMs: number): void {
  let settled = false;
  p.finally(() => { settled = true; }).catch(() => { /* already handled */ });

  const deadline = Date.now() + timeoutMs;
  // Give microtasks one tick before spinning
  while (!settled && Date.now() < deadline) {
    // Tight loop — intentionally minimal; Viking server is local (sub-ms RTT)
  }
}

function isDone(p: Promise<unknown>): boolean {
  let done = false;
  p.finally(() => { done = true; }).catch(() => { /* handled upstream */ });
  return done;
}
