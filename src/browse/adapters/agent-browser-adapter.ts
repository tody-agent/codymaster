/**
 * AgentBrowserAdapter — BrowserAdapter implementation using agent-browser CLI.
 * Calls the Rust CLI via child_process, parses structured output.
 */

import { spawn, execFile } from 'child_process';
import { promisify } from 'util';
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

const execFileAsync = promisify(execFile);

export class AgentBrowserAdapter implements BrowserAdapter {
  readonly name = 'agent-browser';

  private errorCollector = new ErrorCollector();
  private consoleLog: ConsoleEntry[] = [];
  private networkLog: NetworkEntry[] = [];
  private sessionActive = false;
  private currentUrl = '';

  async isAvailable(): Promise<boolean> {
    try {
      const { stdout } = await execFileAsync('agent-browser', ['--version'], { timeout: 5000 });
      return stdout.trim().length > 0;
    } catch {
      return false;
    }
  }

  async startSession(opts?: SessionOpts): Promise<void> {
    const args = ['open'];
    if (opts?.headless === false) args.push('--headed');
    await this.exec(args);
    this.sessionActive = true;
  }

  async navigate(url: string): Promise<void> {
    await this.exec(['navigate', url]);
    this.currentUrl = url;
  }

  async click(ref: string): Promise<void> {
    const cleanRef = ref.startsWith('@') ? ref : `@${ref}`;
    await this.exec(['click', cleanRef]);
  }

  async fill(ref: string, value: string): Promise<void> {
    const cleanRef = ref.startsWith('@') ? ref : `@${ref}`;
    await this.exec(['fill', cleanRef, value]);
  }

  async type(ref: string, text: string, opts?: { delay?: number }): Promise<void> {
    const cleanRef = ref.startsWith('@') ? ref : `@${ref}`;
    const args = ['type', cleanRef, text];
    if (opts?.delay) args.push('--delay', String(opts.delay));
    await this.exec(args);
  }

  async press(key: string): Promise<void> {
    await this.exec(['press', key]);
  }

  async screenshot(opts?: { fullPage?: boolean }): Promise<Buffer> {
    const args = ['screenshot'];
    if (opts?.fullPage) args.push('--full-page');
    const { stdout } = await this.exec(args);
    // agent-browser outputs base64 or file path
    if (stdout.startsWith('/')) {
      const fs = await import('fs');
      return fs.readFileSync(stdout.trim());
    }
    return Buffer.from(stdout.trim(), 'base64');
  }

  async getSnapshot(): Promise<A11ySnapshot> {
    const { stdout } = await this.exec(['snapshot']);
    return this.parseSnapshot(stdout);
  }

  async getConsole(): Promise<ConsoleEntry[]> {
    try {
      const { stdout } = await this.exec(['console']);
      const entries = JSON.parse(stdout);
      this.consoleLog = entries.map((e: any) => ({
        type: e.level ?? e.type ?? 'log',
        text: e.text ?? e.message ?? '',
        timestamp: e.timestamp ?? new Date().toISOString(),
      }));
    } catch {
      /* return cached */
    }
    return [...this.consoleLog];
  }

  async getNetwork(): Promise<NetworkEntry[]> {
    try {
      const { stdout } = await this.exec(['network']);
      const entries = JSON.parse(stdout);
      this.networkLog = entries.map((e: any) => ({
        url: e.url,
        method: e.method ?? 'GET',
        status: e.status,
        timestamp: e.timestamp ?? new Date().toISOString(),
      }));
    } catch {
      /* return cached */
    }
    return [...this.networkLog];
  }

  async getErrors(): Promise<BrowserError[]> {
    return this.errorCollector.getAll();
  }

  async startRecording(): Promise<void> {
    await this.exec(['record', 'start']);
  }

  async stopRecording(): Promise<string> {
    const { stdout } = await this.exec(['record', 'stop']);
    return stdout.trim();
  }

  getEngineInfo(): EngineInfo {
    return {
      name: 'agent-browser',
      version: 'latest',
      capabilities: {
        a11ySnapshot: true,
        videoRecording: true,
        networkCapture: true,
        consoleCapture: true,
      },
    };
  }

  async closeSession(): Promise<void> {
    try {
      await this.exec(['close']);
    } catch {
      /* ignore */
    }
    this.sessionActive = false;
    this.consoleLog = [];
    this.networkLog = [];
    this.errorCollector.clear();
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private async exec(args: string[]): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      const proc = spawn('agent-browser', args, { timeout: 30_000 });
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data: Buffer) => { stdout += data.toString(); });
      proc.stderr.on('data', (data: Buffer) => { stderr += data.toString(); });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          const err = new Error(`agent-browser exited ${code}: ${stderr}`);
          this.errorCollector.add({
            type: 'js-error',
            source: 'agent-browser',
            message: stderr || `exit code ${code}`,
          });
          reject(err);
        }
      });

      proc.on('error', (err) => {
        this.errorCollector.add({
          type: 'js-error',
          source: 'agent-browser',
          message: err.message,
        });
        reject(err);
      });
    });
  }

  private parseSnapshot(raw: string): A11ySnapshot {
    try {
      // Try JSON format first
      const parsed = JSON.parse(raw);
      return {
        root: this.normalizeA11yNode(parsed, 0),
        refs: parsed.refs ?? {},
        timestamp: new Date().toISOString(),
      };
    } catch {
      // Fallback: parse text-based a11y tree
      return this.parseTextSnapshot(raw);
    }
  }

  private normalizeA11yNode(node: any, depth: number): A11yNode {
    if (!node) return { role: 'unknown', name: '', ref: `@e${depth}` };

    const result: A11yNode = {
      role: node.role ?? 'unknown',
      name: node.name ?? '',
      ref: node.ref ?? `@e${depth}`,
    };

    if (node.value) result.value = String(node.value);
    if (node.focused) result.focused = true;
    if (node.disabled) result.disabled = true;

    if (node.children && Array.isArray(node.children)) {
      result.children = node.children.map((child: any, i: number) =>
        this.normalizeA11yNode(child, depth * 10 + i + 1),
      );
    }

    return result;
  }

  private parseTextSnapshot(raw: string): A11ySnapshot {
    const refs: Record<string, string> = {};
    const lines = raw.split('\n').filter(l => l.trim());

    // Parse lines like: "  [button] Submit (@e1)"
    const root: A11yNode = { role: 'WebArea', name: this.currentUrl, ref: '@e0', children: [] };

    for (const line of lines) {
      const match = line.match(/\[(\w+)\]\s*(.+?)\s*\(@e(\d+)\)/);
      if (match) {
        const [, role, name, num] = match;
        const ref = `@e${num}`;
        refs[ref] = `${role}: ${name}`;
        root.children!.push({ role, name, ref });
      }
    }

    return { root, refs, timestamp: new Date().toISOString() };
  }
}
