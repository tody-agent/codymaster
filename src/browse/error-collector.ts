/**
 * ErrorCollector — Structured error classification for browser sessions.
 * Classifies, deduplicates, and exports browser errors.
 */

import { randomUUID } from 'crypto';
import type { BrowserError, ErrorType, ErrorSeverity } from './adapters/types';

export interface ErrorCollectorOptions {
  maxErrors?: number;
  dedupWindowMs?: number;
}

interface RawErrorInput {
  type: ErrorType;
  source: string;
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
}

const SEVERITY_MAP: Record<ErrorType, ErrorSeverity> = {
  'crash': 'critical',
  'js-error': 'error',
  'network-fail': 'error',
  'console-error': 'error',
  'timeout': 'warning',
  'a11y-violation': 'warning',
};

export class ErrorCollector {
  private errors: BrowserError[] = [];
  private seen = new Map<string, number>(); // fingerprint → last timestamp ms
  private maxErrors: number;
  private dedupWindowMs: number;

  constructor(opts?: ErrorCollectorOptions) {
    this.maxErrors = opts?.maxErrors ?? 1000;
    this.dedupWindowMs = opts?.dedupWindowMs ?? 2000;
  }

  /**
   * Add a raw error. Classifies severity and deduplicates.
   */
  add(input: RawErrorInput): BrowserError | null {
    const fp = this.fingerprint(input);
    const now = Date.now();
    const lastSeen = this.seen.get(fp);

    // Dedup within window
    if (lastSeen !== undefined && now - lastSeen < this.dedupWindowMs) {
      return null;
    }

    this.seen.set(fp, now);

    const error: BrowserError = {
      id: randomUUID(),
      type: input.type,
      severity: SEVERITY_MAP[input.type] ?? 'error',
      source: input.source,
      message: input.message,
      stack: input.stack,
      timestamp: new Date().toISOString(),
      context: input.context,
    };

    this.errors.push(error);

    // Evict oldest if over limit
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    return error;
  }

  /**
   * Convenience: classify a console message.
   */
  addConsole(type: string, text: string, source?: string): BrowserError | null {
    if (type !== 'error' && type !== 'warning') return null;

    return this.add({
      type: type === 'error' ? 'console-error' : 'a11y-violation',
      source: source ?? 'console',
      message: text,
    });
  }

  /**
   * Convenience: classify a network failure.
   */
  addNetworkFailure(url: string, method: string, status?: number, failure?: string): BrowserError | null {
    return this.add({
      type: 'network-fail',
      source: url,
      message: `${method} ${url} → ${status ?? 'failed'}${failure ? `: ${failure}` : ''}`,
      context: { method, status, failure },
    });
  }

  /**
   * Convenience: classify a page crash.
   */
  addCrash(message: string): BrowserError {
    return this.add({
      type: 'crash',
      source: 'page',
      message,
    })!;
  }

  /**
   * Get all collected errors, optionally filtered.
   */
  getAll(filter?: { type?: ErrorType; severity?: ErrorSeverity }): BrowserError[] {
    let result = this.errors;
    if (filter?.type) result = result.filter(e => e.type === filter.type);
    if (filter?.severity) result = result.filter(e => e.severity === filter.severity);
    return result;
  }

  /**
   * Get error count by severity.
   */
  stats(): Record<ErrorSeverity, number> {
    const counts: Record<ErrorSeverity, number> = { critical: 0, error: 0, warning: 0, info: 0 };
    for (const e of this.errors) {
      counts[e.severity]++;
    }
    return counts;
  }

  /**
   * Export errors as JSON-serializable array.
   */
  exportJSON(): BrowserError[] {
    return [...this.errors];
  }

  /**
   * Clear all errors.
   */
  clear(): void {
    this.errors = [];
    this.seen.clear();
  }

  /**
   * Get total count.
   */
  get size(): number {
    return this.errors.length;
  }

  private fingerprint(input: RawErrorInput): string {
    return `${input.type}:${input.source}:${input.message.slice(0, 200)}`;
  }
}
