/**
 * viking-http-client.ts
 *
 * Thin HTTP wrapper around the OpenViking REST API (localhost:1933 by default).
 * Uses Node.js built-in `fetch` (Node 18+) — no extra dependencies.
 *
 * OpenViking API reference: https://github.com/volcengine/OpenViking
 */

export interface VikingConfig {
  host: string;       // default: localhost
  port: number;       // default: 1933
  workspace: string;  // OpenViking workspace name
  timeout: number;    // ms, default: 60000
}

export const DEFAULT_VIKING_CONFIG: VikingConfig = {
  host: 'localhost',
  port: 1933,
  workspace: 'codymaster',
  timeout: 60_000,
};

// ─── Response shapes ────────────────────────────────────────────────────────

export interface OvWriteResult {
  task_id?: string;
  uri?: string;
  status?: string;
}

export interface OvReadResult {
  content: string;
  uri?: string;
}

export interface OvSearchResult {
  items: OvSearchItem[];
}

export interface OvSearchItem {
  uri: string;
  score: number;
  content?: string;
  metadata?: Record<string, unknown>;
}

export interface OvLsResult {
  items: OvLsItem[];
}

export interface OvLsItem {
  uri: string;
  name: string;
  is_dir: boolean;
  size?: number;
}

export interface OvStatusResult {
  healthy: boolean;
  version?: string;
  workspace?: string;
}

// ─── Client ─────────────────────────────────────────────────────────────────

export class VikingHttpClient {
  private readonly baseUrl: string;
  private readonly workspace: string;
  private readonly timeout: number;

  constructor(config: VikingConfig = DEFAULT_VIKING_CONFIG) {
    this.baseUrl = `http://${config.host}:${config.port}`;
    this.workspace = config.workspace;
    this.timeout = config.timeout;
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private workspaceUri(path: string): string {
    // Normalize: ov://<workspace>/<path>
    const clean = path.startsWith('/') ? path.slice(1) : path;
    return `ov://${this.workspace}/${clean}`;
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'DELETE',
    endpoint: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body != null ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`OpenViking HTTP ${res.status} at ${endpoint}: ${text}`);
      }

      // 204 No Content
      if (res.status === 204) return {} as T;

      return (await res.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  }

  // ── Health ────────────────────────────────────────────────────────────────

  async health(): Promise<OvStatusResult> {
    return this.request<OvStatusResult>('GET', '/health');
  }

  async isHealthy(): Promise<boolean> {
    try {
      const status = await this.health();
      return status.healthy === true;
    } catch {
      return false;
    }
  }

  // ── Filesystem ops ────────────────────────────────────────────────────────

  /**
   * Write content to a URI.
   * mode: 'overwrite' (default) | 'append'
   */
  async write(
    uriPath: string,
    content: string,
    mode: 'overwrite' | 'append' = 'overwrite',
  ): Promise<OvWriteResult> {
    return this.request<OvWriteResult>('POST', '/write', {
      uri: this.workspaceUri(uriPath),
      content,
      mode,
      wait: true,
    });
  }

  /** Read content from a URI. */
  async read(uriPath: string): Promise<string> {
    const res = await this.request<OvReadResult>('POST', '/read', {
      uri: this.workspaceUri(uriPath),
    });
    return res.content ?? '';
  }

  /** List items under a URI directory. */
  async ls(uriPath: string): Promise<OvLsItem[]> {
    const res = await this.request<OvLsResult>('POST', '/ls', {
      uri: this.workspaceUri(uriPath),
    });
    return res.items ?? [];
  }

  /** Delete a URI (file or directory). */
  async rm(uriPath: string, recursive = false): Promise<void> {
    await this.request<void>('POST', '/rm', {
      uri: this.workspaceUri(uriPath),
      recursive,
    });
  }

  /** Create directory at URI. */
  async mkdir(uriPath: string): Promise<void> {
    await this.request<void>('POST', '/mkdir', {
      uri: this.workspaceUri(uriPath),
    });
  }

  // ── Search ────────────────────────────────────────────────────────────────

  /**
   * Semantic vector search within a target URI scope.
   * Returns top-k results sorted by relevance score.
   */
  async search(
    query: string,
    targetUriPath: string,
    limit = 10,
    scoreThreshold?: number,
  ): Promise<OvSearchItem[]> {
    const body: Record<string, unknown> = {
      query,
      target_uri: this.workspaceUri(targetUriPath),
      limit,
    };
    if (scoreThreshold != null) body.score_threshold = scoreThreshold;

    const res = await this.request<OvSearchResult>('POST', '/search', body);
    return res.items ?? [];
  }

  // ── Tiered summaries ──────────────────────────────────────────────────────

  /** Get L0 abstract summary of a URI. */
  async abstract(uriPath: string): Promise<string> {
    const res = await this.request<{ content: string }>('POST', '/abstract', {
      uri: this.workspaceUri(uriPath),
    });
    return res.content ?? '';
  }

  /** Get L1 overview of a URI. */
  async overview(uriPath: string): Promise<string> {
    const res = await this.request<{ content: string }>('POST', '/overview', {
      uri: this.workspaceUri(uriPath),
    });
    return res.content ?? '';
  }
}
