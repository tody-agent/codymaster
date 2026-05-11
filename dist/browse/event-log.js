"use strict";
/**
 * EventLog — Upgraded ring buffer with structured events, filtering, and export.
 * Replaces the simple RingBuffer in BrowseDaemon.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventLog = void 0;
let _idCounter = 0;
function nextId() {
    return `evt_${++_idCounter}_${Date.now().toString(36)}`;
}
class EventLog {
    constructor(opts) {
        var _a;
        this.entries = [];
        this.maxSize = (_a = opts === null || opts === void 0 ? void 0 : opts.maxSize) !== null && _a !== void 0 ? _a : 1000;
    }
    /**
     * Push a new event.
     */
    push(entry) {
        var _a;
        const full = {
            id: nextId(),
            timestamp: (_a = entry.timestamp) !== null && _a !== void 0 ? _a : new Date().toISOString(),
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
    query(filter) {
        let result = this.entries;
        if (filter === null || filter === void 0 ? void 0 : filter.category)
            result = result.filter(e => e.category === filter.category);
        if (filter === null || filter === void 0 ? void 0 : filter.type)
            result = result.filter(e => e.type === filter.type);
        if (filter === null || filter === void 0 ? void 0 : filter.severity)
            result = result.filter(e => e.severity === filter.severity);
        if (filter === null || filter === void 0 ? void 0 : filter.source)
            result = result.filter(e => e.source === filter.source);
        if (filter === null || filter === void 0 ? void 0 : filter.since) {
            const sinceMs = new Date(filter.since).getTime();
            result = result.filter(e => new Date(e.timestamp).getTime() >= sinceMs);
        }
        if (filter === null || filter === void 0 ? void 0 : filter.until) {
            const untilMs = new Date(filter.until).getTime();
            result = result.filter(e => new Date(e.timestamp).getTime() <= untilMs);
        }
        if ((filter === null || filter === void 0 ? void 0 : filter.limit) && filter.limit > 0) {
            result = result.slice(-filter.limit);
        }
        return result;
    }
    /**
     * Get the last N entries.
     */
    recent(n) {
        return this.entries.slice(-n);
    }
    /**
     * Snapshot — returns copy of all entries (backward compat with RingBuffer).
     */
    snapshot() {
        return [...this.entries];
    }
    /**
     * Export as JSON-serializable array.
     */
    exportJSON(filter) {
        return this.query(filter);
    }
    /**
     * Get counts by category.
     */
    stats() {
        const counts = {
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
    clear() {
        this.entries = [];
    }
    /**
     * Total entry count.
     */
    get size() {
        return this.entries.length;
    }
}
exports.EventLog = EventLog;
