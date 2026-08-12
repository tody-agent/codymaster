/**
 * Local HTTP browse daemon (Hybrid Bridge). Bearer auth.
 * Supports both Playwright and agent-browser via adapter pattern.
 * All existing endpoints are backward compatible.
 */

import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import type { BrowserAdapter } from './browse/adapters/types';
import { createAdapter, type EngineName } from './browse/adapter-factory';
import { EventLog } from './browse/event-log';

export interface BrowseServerOptions {
  host?: string;
  port?: number;
  token: string;
  headless?: boolean;
  engine?: EngineName;
}

export class BrowseDaemon {
  private app = express();
  private httpServer: import('http').Server | null = null;
  private adapter: BrowserAdapter | null = null;
  private eventLog = new EventLog({ maxSize: 1000 });
  private engineName = 'unknown';
  private sessionActive = false;

  constructor(private opts: BrowseServerOptions) {
    this.hostGuardEnabled = BrowseDaemon.LOOPBACK_HOSTS.has(
      String(this.opts.host || '127.0.0.1').toLowerCase()
    );
    this.app.disable('x-powered-by');
    this.app.use((_req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none';");
      next();
    });
    this.app.use(express.json({ limit: '2mb' }));
    this.app.use(this.authMiddleware.bind(this));
    this.routes();
  }

  private static readonly LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '::1', '[::1]']);

  /**
   * Host-header allowlist. Only enforced when the daemon is bound to a loopback
   * address — that is the only case where browser DNS-rebinding applies. If the
   * operator explicitly binds to a non-loopback host (--host), they have opted
   * into network exposure and the bearer token is the protection, so we don't
   * second-guess the Host header (which a remote client legitimately varies).
   */
  private hostGuardEnabled = true;

  private authMiddleware(req: Request, res: Response, next: NextFunction): void {
    // Defeat DNS-rebinding on loopback binds: a rebound attacker page still
    // carries its original hostname in the Host header, so only accept loopback.
    if (this.hostGuardEnabled) {
      const host = String(req.headers.host || '').split(':')[0].toLowerCase();
      if (!BrowseDaemon.LOOPBACK_HOSTS.has(host)) {
        res.status(403).json({ error: 'forbidden host' });
        return;
      }
    }
    if (req.path === '/health') return next();
    const h = req.headers.authorization || '';
    const want = `Bearer ${this.opts.token}`;
    const givenBuf = Buffer.from(h);
    const wantBuf = Buffer.from(want);
    if (givenBuf.length !== wantBuf.length || !crypto.timingSafeEqual(givenBuf, wantBuf)) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    next();
  }

  private routes(): void {
    // ── Health (no auth) ───────────────────────────────────────────────────
    this.app.get('/health', (_req, res) => {
      res.json({ ok: true, session: this.sessionActive, engine: this.engineName });
    });

    // ── Session start ─────────────────────────────────────────────────────
    this.app.post('/session/start', async (req, res) => {
      try {
        const headless = req.body?.headless ?? this.opts.headless ?? true;
        const engine = (req.body?.engine as EngineName) ?? this.opts.engine ?? 'auto';

        const result = await createAdapter(engine);
        this.adapter = result.adapter;
        this.engineName = result.engine;

        await this.adapter.startSession({ headless });
        this.sessionActive = true;

        this.eventLog.push({
          category: 'session',
          type: 'start',
          message: `Session started with ${result.engine}${result.fallback ? ' (fallback)' : ''}`,
        });

        res.json({ ok: true, engine: result.engine, fallback: result.fallback });
      } catch (e) {
        res.status(500).json({ error: (e as Error).message });
      }
    });

    // ── Navigate ──────────────────────────────────────────────────────────
    this.app.post('/navigate', async (req, res) => {
      try {
        const url = req.body?.url as string;
        if (!url || !this.adapter) {
          res.status(400).json({ error: 'url required and session must be started' });
          return;
        }
        await this.adapter.navigate(url);

        this.eventLog.push({
          category: 'session',
          type: 'navigate',
          message: url,
          source: url,
        });

        res.json({ ok: true, url });
      } catch (e) {
        res.status(500).json({ error: (e as Error).message });
      }
    });

    // ── Refs refresh (backward compat — still tags data-cm-ref) ───────────
    this.app.post('/refs/refresh', async (_req, res) => {
      try {
        if (!this.adapter) {
          res.status(400).json({ error: 'no session' });
          return;
        }
        const snapshot = await this.adapter.getSnapshot();

        this.eventLog.push({
          category: 'interaction',
          type: 'refs/refresh',
          message: `Refreshed refs: ${Object.keys(snapshot.refs).length} elements`,
        });

        res.json({ ok: true, refs: snapshot.refs });
      } catch (e) {
        res.status(500).json({ error: (e as Error).message });
      }
    });

    // ── Click ─────────────────────────────────────────────────────────────
    this.app.post('/click', async (req, res) => {
      try {
        const ref = req.body?.ref as string;
        if (!ref || !this.adapter) {
          res.status(400).json({ error: 'ref required' });
          return;
        }
        await this.adapter.click(ref);

        this.eventLog.push({
          category: 'interaction',
          type: 'click',
          message: ref,
        });

        res.json({ ok: true });
      } catch (e) {
        res.status(500).json({ error: (e as Error).message });
      }
    });

    // ── Fill ──────────────────────────────────────────────────────────────
    this.app.post('/fill', async (req, res) => {
      try {
        const ref = req.body?.ref as string;
        const value = req.body?.value as string;
        if (!ref || value === undefined || !this.adapter) {
          res.status(400).json({ error: 'ref and value required' });
          return;
        }
        await this.adapter.fill(ref, value);

        this.eventLog.push({
          category: 'interaction',
          type: 'fill',
          message: `${ref} = "${value.slice(0, 50)}"`,
        });

        res.json({ ok: true });
      } catch (e) {
        res.status(500).json({ error: (e as Error).message });
      }
    });

    // ── Screenshot ────────────────────────────────────────────────────────
    this.app.get('/screenshot', async (_req, res) => {
      try {
        if (!this.adapter) {
          res.status(400).json({ error: 'no session' });
          return;
        }
        const buf = await this.adapter.screenshot();
        res.setHeader('Content-Type', 'image/png');
        res.send(buf);
      } catch (e) {
        res.status(500).json({ error: (e as Error).message });
      }
    });

    // ── Console (backward compat) ─────────────────────────────────────────
    this.app.get('/console', async (_req, res) => {
      try {
        if (!this.adapter) {
          res.json({ entries: [] });
          return;
        }
        const entries = await this.adapter.getConsole();
        res.json({ entries });
      } catch (e) {
        res.status(500).json({ error: (e as Error).message });
      }
    });

    // ── Network (backward compat) ─────────────────────────────────────────
    this.app.get('/network', async (_req, res) => {
      try {
        if (!this.adapter) {
          res.json({ entries: [] });
          return;
        }
        const entries = await this.adapter.getNetwork();
        res.json({ entries });
      } catch (e) {
        res.status(500).json({ error: (e as Error).message });
      }
    });

    // ── NEW: Errors ───────────────────────────────────────────────────────
    this.app.get('/errors', async (req, res) => {
      try {
        if (!this.adapter) {
          res.json({ errors: [] });
          return;
        }
        const filter: Record<string, string> = {};
        if (req.query.type) filter.type = req.query.type as string;
        if (req.query.severity) filter.severity = req.query.severity as string;

        const errors = await this.adapter.getErrors();
        let filtered = errors;
        if (filter.type) filtered = filtered.filter(e => e.type === filter.type);
        if (filter.severity) filtered = filtered.filter(e => e.severity === filter.severity);

        res.json({ errors: filtered, total: errors.length });
      } catch (e) {
        res.status(500).json({ error: (e as Error).message });
      }
    });

    // ── NEW: A11y Snapshot ────────────────────────────────────────────────
    this.app.get('/a11y-snapshot', async (_req, res) => {
      try {
        if (!this.adapter) {
          res.status(400).json({ error: 'no session' });
          return;
        }
        const snapshot = await this.adapter.getSnapshot();
        res.json(snapshot);
      } catch (e) {
        res.status(500).json({ error: (e as Error).message });
      }
    });

    // ── NEW: Record start ─────────────────────────────────────────────────
    this.app.post('/record/start', async (_req, res) => {
      try {
        if (!this.adapter) {
          res.status(400).json({ error: 'no session' });
          return;
        }
        await this.adapter.startRecording();

        this.eventLog.push({
          category: 'session',
          type: 'record/start',
          message: 'Video recording started',
        });

        res.json({ ok: true });
      } catch (e) {
        res.status(500).json({ error: (e as Error).message });
      }
    });

    // ── NEW: Record stop ──────────────────────────────────────────────────
    this.app.post('/record/stop', async (_req, res) => {
      try {
        if (!this.adapter) {
          res.status(400).json({ error: 'no session' });
          return;
        }
        const path = await this.adapter.stopRecording();

        this.eventLog.push({
          category: 'session',
          type: 'record/stop',
          message: `Video saved: ${path}`,
        });

        res.json({ ok: true, path });
      } catch (e) {
        res.status(500).json({ error: (e as Error).message });
      }
    });

    // ── NEW: Engine info ──────────────────────────────────────────────────
    this.app.get('/engine', (_req, res) => {
      if (!this.adapter) {
        res.json({ name: this.engineName, active: false });
        return;
      }
      const info = this.adapter.getEngineInfo();
      res.json({ ...info, active: this.sessionActive });
    });

    // ── NEW: Event log ────────────────────────────────────────────────────
    this.app.get('/events', (req, res) => {
      const filter: Record<string, string> = {};
      if (req.query.category) filter.category = req.query.category as string;
      if (req.query.limit) filter.limit = req.query.limit as string;

      const entries = this.eventLog.query({
        category: filter.category as any,
        limit: filter.limit ? parseInt(filter.limit, 10) : undefined,
      });
      res.json({ entries, total: this.eventLog.size });
    });
  }

  async listen(): Promise<void> {
    const host = this.opts.host || '127.0.0.1';
    const port = this.opts.port ?? 17395;
    return new Promise((resolve, reject) => {
      this.httpServer = this.app.listen(port, host, () => resolve());
      this.httpServer.on('error', reject);
    });
  }

  async close(): Promise<void> {
    if (this.adapter) {
      await this.adapter.closeSession().catch(() => {});
      this.adapter = null;
    }
    this.sessionActive = false;
    this.eventLog.clear();
    if (this.httpServer) {
      await new Promise<void>((r) => this.httpServer!.close(() => r()));
      this.httpServer = null;
    }
  }
}
