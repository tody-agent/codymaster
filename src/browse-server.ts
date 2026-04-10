/**
 * Local HTTP browse daemon (Playwright + Express). Bearer auth.
 * Refs: POST /refs/refresh tags interactive elements with data-cm-ref.
 */

import express, { Request, Response, NextFunction } from 'express';
import type { Browser, BrowserContext, Page } from 'playwright';

export interface BrowseServerOptions {
  host?: string;
  port?: number;
  token: string;
  headless?: boolean;
}

export interface RingBuffer<T> {
  push(item: T): void;
  snapshot(): T[];
}

function createRing<T>(max: number): RingBuffer<T> {
  const buf: T[] = [];
  return {
    push(item: T) {
      buf.push(item);
      while (buf.length > max) buf.shift();
    },
    snapshot: () => [...buf],
  };
}

export class BrowseDaemon {
  private app = express();
  private httpServer: import('http').Server | null = null;
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private consoleBuf = createRing<{ type: string; text: string; ts: string }>(200);
  private networkBuf = createRing<{ url: string; method: string; status?: number; ts: string }>(200);
  private refMap: Record<string, string> = {};

  constructor(private opts: BrowseServerOptions) {
    this.app.use(express.json({ limit: '2mb' }));
    this.app.use(this.authMiddleware.bind(this));
    this.routes();
  }

  private authMiddleware(req: Request, res: Response, next: NextFunction): void {
    if (req.path === '/health') return next();
    const h = req.headers.authorization || '';
    const want = `Bearer ${this.opts.token}`;
    if (h !== want) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    next();
  }

  private routes(): void {
    this.app.get('/health', (_req, res) => {
      res.json({ ok: true, hasPage: !!this.page });
    });

    this.app.post('/session/start', async (req, res) => {
      try {
        const headless = req.body?.headless ?? this.opts.headless ?? true;
        const pw = await import('playwright');
        this.browser = await pw.chromium.launch({ headless });
        this.context = await this.browser.newContext();
        this.page = await this.context.newPage();
        this.page.on('console', (msg) => {
          this.consoleBuf.push({
            type: msg.type(),
            text: msg.text(),
            ts: new Date().toISOString(),
          });
        });
        this.context.on('response', (response) => {
          try {
            this.networkBuf.push({
              url: response.url(),
              method: response.request().method(),
              status: response.status(),
              ts: new Date().toISOString(),
            });
          } catch {
            /* ignore */
          }
        });
        res.json({ ok: true });
      } catch (e) {
        res.status(500).json({ error: (e as Error).message });
      }
    });

    this.app.post('/navigate', async (req, res) => {
      try {
        const url = req.body?.url as string;
        if (!url || !this.page) {
          res.status(400).json({ error: 'url required and session must be started' });
          return;
        }
        await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
        res.json({ ok: true, url: this.page.url() });
      } catch (e) {
        res.status(500).json({ error: (e as Error).message });
      }
    });

    this.app.post('/refs/refresh', async (_req, res) => {
      try {
        if (!this.page) {
          res.status(400).json({ error: 'no session' });
          return;
        }
        const mapping = await this.page.evaluate(() => {
          const sel =
            'a[href],button,input,textarea,select,[role="button"],[onclick]';
          const nodes = Array.from(document.querySelectorAll(sel));
          const out: Record<string, string> = {};
          nodes.forEach((el, i) => {
            const id = `e${i + 1}`;
            (el as HTMLElement).setAttribute('data-cm-ref', id);
            const tag = el.tagName.toLowerCase();
            const txt = (el.textContent || '').trim().slice(0, 80);
            out[id] = `${tag}${txt ? `: ${txt}` : ''}`;
          });
          return out;
        });
        this.refMap = mapping;
        res.json({ ok: true, refs: mapping });
      } catch (e) {
        res.status(500).json({ error: (e as Error).message });
      }
    });

    this.app.post('/click', async (req, res) => {
      try {
        const ref = (req.body?.ref as string)?.replace(/^@/, '');
        if (!ref || !this.page) {
          res.status(400).json({ error: 'ref required' });
          return;
        }
        await this.page.click(`[data-cm-ref="${ref}"]`, { timeout: 15_000 });
        res.json({ ok: true });
      } catch (e) {
        res.status(500).json({ error: (e as Error).message });
      }
    });

    this.app.post('/fill', async (req, res) => {
      try {
        const ref = (req.body?.ref as string)?.replace(/^@/, '');
        const value = req.body?.value as string;
        if (!ref || value === undefined || !this.page) {
          res.status(400).json({ error: 'ref and value required' });
          return;
        }
        await this.page.fill(`[data-cm-ref="${ref}"]`, value, { timeout: 15_000 });
        res.json({ ok: true });
      } catch (e) {
        res.status(500).json({ error: (e as Error).message });
      }
    });

    this.app.get('/screenshot', async (_req, res) => {
      try {
        if (!this.page) {
          res.status(400).json({ error: 'no session' });
          return;
        }
        const buf = await this.page.screenshot({ type: 'png' });
        res.setHeader('Content-Type', 'image/png');
        res.send(buf);
      } catch (e) {
        res.status(500).json({ error: (e as Error).message });
      }
    });

    this.app.get('/console', (_req, res) => {
      res.json({ entries: this.consoleBuf.snapshot() });
    });

    this.app.get('/network', (_req, res) => {
      res.json({ entries: this.networkBuf.snapshot() });
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
    if (this.page) await this.page.close().catch(() => {});
    if (this.context) await this.context.close().catch(() => {});
    if (this.browser) await this.browser.close().catch(() => {});
    this.page = null;
    this.context = null;
    this.browser = null;
    if (this.httpServer) {
      await new Promise<void>((r) => this.httpServer!.close(() => r()));
      this.httpServer = null;
    }
  }
}
