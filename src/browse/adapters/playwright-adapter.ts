/**
 * PlaywrightAdapter — BrowserAdapter implementation using Playwright.
 * Extracted from the original BrowseDaemon page operations.
 */

import type {
  BrowserAdapter,
  SessionOpts,
  A11ySnapshot,
  A11yNode,
  ConsoleEntry,
  NetworkEntry,
  BrowserError,
  EngineInfo,
} from './types';
import { ErrorCollector } from '../error-collector';

export class PlaywrightAdapter implements BrowserAdapter {
  readonly name = 'playwright';

  private browser: import('playwright').Browser | null = null;
  private context: import('playwright').BrowserContext | null = null;
  private page: import('playwright').Page | null = null;
  private errorCollector = new ErrorCollector();
  private consoleLog: ConsoleEntry[] = [];
  private networkLog: NetworkEntry[] = [];
  private videoDir: string | null = null;
  private refMap: Record<string, string> = {};

  async isAvailable(): Promise<boolean> {
    try {
      const pw = await import('playwright');
      return !!pw.chromium;
    } catch {
      return false;
    }
  }

  async startSession(opts?: SessionOpts): Promise<void> {
    const pw = await import('playwright');
    const headless = opts?.headless ?? true;

    this.browser = await pw.chromium.launch({ headless });
    const contextOpts: Record<string, unknown> = {};
    if (opts?.viewport) contextOpts.viewport = opts.viewport;
    if (opts?.userAgent) contextOpts.userAgent = opts.userAgent;
    if (opts?.recordVideo) {
      this.videoDir = opts.videoDir ?? '/tmp/cm-browse-videos';
      contextOpts.recordVideo = { dir: this.videoDir };
    }

    this.context = await this.browser.newContext(contextOpts as any);
    this.page = await this.context.newPage();

    // Wire console events
    this.page.on('console', (msg) => {
      const entry: ConsoleEntry = {
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString(),
      };
      this.consoleLog.push(entry);

      // Feed error collector
      if (msg.type() === 'error' || msg.type() === 'warning') {
        this.errorCollector.addConsole(msg.type(), msg.text());
      }
    });

    // Wire page errors (uncaught exceptions)
    this.page.on('pageerror', (err) => {
      this.errorCollector.add({
        type: 'js-error',
        source: 'page',
        message: err.message,
        stack: err.stack,
      });
    });

    // Wire network events
    if (this.context) {
      this.context.on('response', (response) => {
        try {
          const entry: NetworkEntry = {
            url: response.url(),
            method: response.request().method(),
            status: response.status(),
            statusText: response.statusText(),
            timestamp: new Date().toISOString(),
            resourceType: response.request().resourceType(),
          };
          this.networkLog.push(entry);

          // Capture failures
          if (response.status() >= 400) {
            this.errorCollector.addNetworkFailure(
              response.url(),
              response.request().method(),
              response.status(),
            );
          }
        } catch {
          /* ignore */
        }
      });

      this.context.on('requestfailed', (request) => {
        this.errorCollector.addNetworkFailure(
          request.url(),
          request.method(),
          undefined,
          request.failure()?.errorText,
        );
      });
    }
  }

  async navigate(url: string): Promise<void> {
    if (!this.page) throw new Error('No active session');
    await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  }

  async click(ref: string): Promise<void> {
    if (!this.page) throw new Error('No active session');
    const cleanRef = ref.replace(/^@/, '');
    await this.page.click(`[data-cm-ref="${cleanRef}"]`, { timeout: 15_000 });
  }

  async fill(ref: string, value: string): Promise<void> {
    if (!this.page) throw new Error('No active session');
    const cleanRef = ref.replace(/^@/, '');
    await this.page.fill(`[data-cm-ref="${cleanRef}"]`, value, { timeout: 15_000 });
  }

  async type(ref: string, text: string, opts?: { delay?: number }): Promise<void> {
    if (!this.page) throw new Error('No active session');
    const cleanRef = ref.replace(/^@/, '');
    await this.page.fill(`[data-cm-ref="${cleanRef}"]`, text, { timeout: 15_000 });
  }

  async press(key: string): Promise<void> {
    if (!this.page) throw new Error('No active session');
    await this.page.keyboard.press(key);
  }

  async screenshot(opts?: { fullPage?: boolean }): Promise<Buffer> {
    if (!this.page) throw new Error('No active session');
    return this.page.screenshot({ type: 'png', fullPage: opts?.fullPage });
  }

  async getSnapshot(): Promise<A11ySnapshot> {
    if (!this.page) throw new Error('No active session');

    // Use Playwright's accessibility snapshot
    const pwSnapshot = await (this.page as any).accessibility.snapshot();

    // Also tag interactive elements with data-cm-ref
    const refMapping = await this.page.evaluate(() => {
      const sel = 'a[href],button,input,textarea,select,[role="button"],[onclick]';
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

    this.refMap = refMapping;

    // Convert Playwright a11y tree to our format
    const root = this.convertA11yNode(pwSnapshot, 0);

    return {
      root,
      refs: refMapping,
      timestamp: new Date().toISOString(),
    };
  }

  async getConsole(): Promise<ConsoleEntry[]> {
    return [...this.consoleLog];
  }

  async getNetwork(): Promise<NetworkEntry[]> {
    return [...this.networkLog];
  }

  async getErrors(): Promise<BrowserError[]> {
    return this.errorCollector.getAll();
  }

  async startRecording(): Promise<void> {
    // Video recording must be set at context creation time in Playwright
    // This is a no-op if not started with recordVideo
    if (!this.context) throw new Error('No active session');
  }

  async stopRecording(): Promise<string> {
    if (!this.page) throw new Error('No active session');
    // Playwright saves video on page close
    const video = this.page.video();
    if (video) {
      const path = await video.path();
      return path;
    }
    return '';
  }

  getEngineInfo(): EngineInfo {
    return {
      name: 'playwright',
      version: '1.x',
      capabilities: {
        a11ySnapshot: true,
        videoRecording: true,
        networkCapture: true,
        consoleCapture: true,
      },
    };
  }

  async closeSession(): Promise<void> {
    if (this.page) await this.page.close().catch(() => {});
    if (this.context) await this.context.close().catch(() => {});
    if (this.browser) await this.browser.close().catch(() => {});
    this.page = null;
    this.context = null;
    this.browser = null;
    this.consoleLog = [];
    this.networkLog = [];
    this.errorCollector.clear();
    this.refMap = {};
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private convertA11yNode(node: any, depth: number): A11yNode {
    if (!node) return { role: 'unknown', name: '', ref: `@e${depth}` };

    const ref = `@e${depth}`;
    const result: A11yNode = {
      role: node.role ?? 'unknown',
      name: node.name ?? '',
      ref,
    };

    if (node.value !== undefined) result.value = String(node.value);
    if (node.focused) result.focused = true;
    if (node.disabled) result.disabled = true;
    if (node.expanded !== undefined) result.expanded = node.expanded;
    if (node.selected !== undefined) result.selected = node.selected;

    if (node.children && Array.isArray(node.children)) {
      result.children = node.children.map((child: any, i: number) =>
        this.convertA11yNode(child, depth * 10 + i + 1),
      );
    }

    return result;
  }
}
