/**
 * Browse Hybrid Bridge — Unified adapter interface and types.
 * Both PlaywrightAdapter and AgentBrowserAdapter implement BrowserAdapter.
 */

// ── Session ──────────────────────────────────────────────────────────────────

export interface SessionOpts {
  headless?: boolean;
  viewport?: { width: number; height: number };
  userAgent?: string;
  recordVideo?: boolean;
  videoDir?: string;
}

// ── A11y Snapshot ────────────────────────────────────────────────────────────

export interface A11yNode {
  role: string;
  name: string;
  ref: string;            // @e1, @e2, …
  value?: string;
  description?: string;
  focused?: boolean;
  disabled?: boolean;
  expanded?: boolean;
  selected?: boolean;
  children?: A11yNode[];
}

export interface A11ySnapshot {
  root: A11yNode;
  refs: Record<string, string>;   // ref → "role: name"
  timestamp: string;
}

// ── Console / Network ────────────────────────────────────────────────────────

export interface ConsoleEntry {
  type: string;           // log, warn, error, info, debug
  text: string;
  timestamp: string;
  source?: string;
  lineNo?: number;
}

export interface NetworkEntry {
  url: string;
  method: string;
  status?: number;
  statusText?: string;
  timestamp: string;
  duration?: number;
  resourceType?: string;
  failure?: string;
}

// ── Errors ───────────────────────────────────────────────────────────────────

export type ErrorType =
  | 'js-error'
  | 'network-fail'
  | 'console-error'
  | 'a11y-violation'
  | 'timeout'
  | 'crash';

export type ErrorSeverity = 'critical' | 'error' | 'warning' | 'info';

export interface BrowserError {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  source: string;         // file/url/module
  message: string;
  stack?: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

// ── Engine Info ──────────────────────────────────────────────────────────────

export interface EngineInfo {
  name: string;           // 'playwright' | 'agent-browser'
  version: string;
  capabilities: {
    a11ySnapshot: boolean;
    videoRecording: boolean;
    networkCapture: boolean;
    consoleCapture: boolean;
  };
}

// ── BrowserAdapter Interface ─────────────────────────────────────────────────

export interface BrowserAdapter {
  readonly name: string;

  /** Check if this adapter's runtime is available. */
  isAvailable(): Promise<boolean>;

  /** Launch browser and create a new page/context. */
  startSession(opts?: SessionOpts): Promise<void>;

  /** Navigate to URL. */
  navigate(url: string): Promise<void>;

  /** Click element by ref (@eN). */
  click(ref: string): Promise<void>;

  /** Fill input by ref (@eN). */
  fill(ref: string, value: string): Promise<void>;

  /** Type text character-by-character. */
  type(ref: string, text: string, opts?: { delay?: number }): Promise<void>;

  /** Press a key. */
  press(key: string): Promise<void>;

  /** Take screenshot (PNG). */
  screenshot(opts?: { fullPage?: boolean }): Promise<Buffer>;

  /** Get accessibility tree snapshot with @eN refs. */
  getSnapshot(): Promise<A11ySnapshot>;

  /** Get console entries since session start. */
  getConsole(): Promise<ConsoleEntry[]>;

  /** Get network entries since session start. */
  getNetwork(): Promise<NetworkEntry[]>;

  /** Get collected errors. */
  getErrors(): Promise<BrowserError[]>;

  /** Start video recording. */
  startRecording(): Promise<void>;

  /** Stop video recording, return file path. */
  stopRecording(): Promise<string>;

  /** Get engine info. */
  getEngineInfo(): EngineInfo;

  /** Close page, context, browser. */
  closeSession(): Promise<void>;
}
