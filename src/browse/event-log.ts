/**
 * EventLog — Upgraded ring buffer with structured events, filtering, and export.
 * Replaces the simple RingBuffer in BrowseDaemon.
 */

export type EventCategory = 'console' | 'network' | 'error' | 'session' | 'interaction';

export interface EventLogEntry {
  id: string;
  category: EventCategory;
  type: string;           // sub-type: 'log', 'error', 'GET', 'click', etc.
  message: string;
  timestamp: string;
  severity?: string;      // critical, error, warning, info
  source?: string;
  metadata?: Record<string, unknown>;
}

export interface EventLogOptions {
  maxSize?: number;
}

export interface EventFilter {
  category?: EventCategory;
  type?: string;
  severity?: string;
  since?: string;         // ISO timestamp
  until?: string;         // ISO timestamp
  source?: string;
  limit?: number;
}

let _idCounter = 0;
function nextId(): string {
  return `evt_${++_idCounter}_${Date.now().toString(36)}`;
}

export class EventLog {
  private entries: EventLogEntry[] = [];
  private maxSize: number;

  constructor(opts?: EventLogOptions) {
    this.maxSize = opts?.maxSize ?? 1000;
  }

  /**
   * Push a new event.
   */
  push(entry: Omit<EventLogEntry, 'id' | 'timestamp'> & { timestamp?: string }): EventLogEntry {
    const full: EventLogEntry = {
      id: nextId(),
      timestamp: entry.timestamp ?? new Date().toISOString(),
      category: entry.category,
      type: entry.type,
      message: entry.message,
      severity: entry.severity,
      source: entry.source,
      metadata: entry.metadata,
    };

    this.entries.push(full);

    // Evict oldest
    while (this.entries.length > this.maxSize) {
      this.entries.shift();
    }

    return full;
  }

  /**
   * Get all entries, optionally filtered.
   */
  query(filter?: EventFilter): EventLogEntry[] {
    let result = this.entries;

    if (filter?.category) result = result.filter(e => e.category === filter.category);
    if (filter?.type) result = result.filter(e => e.type === filter.type);
    if (filter?.severity) result = result.filter(e => e.severity === filter.severity);
    if (filter?.source) result = result.filter(e => e.source === filter.source);
    if (filter?.since) {
      const sinceMs = new Date(filter.since).getTime();
      result = result.filter(e => new Date(e.timestamp).getTime() >= sinceMs);
    }
    if (filter?.until) {
      const untilMs = new Date(filter.until).getTime();
      result = result.filter(e => new Date(e.timestamp).getTime() <= untilMs);
    }

    if (filter?.limit && filter.limit > 0) {
      result = result.slice(-filter.limit);
    }

    return result;
  }

  /**
   * Get the last N entries.
   */
  recent(n: number): EventLogEntry[] {
    return this.entries.slice(-n);
  }

  /**
   * Snapshot — returns copy of all entries (backward compat with RingBuffer).
   */
  snapshot(): EventLogEntry[] {
    return [...this.entries];
  }

  /**
   * Export as JSON-serializable array.
   */
  exportJSON(filter?: EventFilter): EventLogEntry[] {
    return this.query(filter);
  }

  /**
   * Get counts by category.
   */
  stats(): Record<EventCategory, number> {
    const counts: Record<EventCategory, number> = {
      console: 0, network: 0, error: 0, session: 0, interaction: 0,
    };
    for (const e of this.entries) {
      counts[e.category]++;
    }
    return counts;
  }

  /**
   * Clear all entries.
   */
  clear(): void {
    this.entries = [];
  }

  /**
   * Total entry count.
   */
  get size(): number {
    return this.entries.length;
  }
}
