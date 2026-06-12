"use strict";
/**
 * ErrorCollector — Structured error classification for browser sessions.
 * Classifies, deduplicates, and exports browser errors.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorCollector = void 0;
const crypto_1 = require("crypto");
const SEVERITY_MAP = {
    'crash': 'critical',
    'js-error': 'error',
    'network-fail': 'error',
    'console-error': 'error',
    'timeout': 'warning',
    'a11y-violation': 'warning',
};
class ErrorCollector {
    constructor(opts) {
        var _a, _b;
        this.errors = [];
        this.seen = new Map(); // fingerprint → last timestamp ms
        this.maxErrors = (_a = opts === null || opts === void 0 ? void 0 : opts.maxErrors) !== null && _a !== void 0 ? _a : 1000;
        this.dedupWindowMs = (_b = opts === null || opts === void 0 ? void 0 : opts.dedupWindowMs) !== null && _b !== void 0 ? _b : 2000;
    }
    /**
     * Add a raw error. Classifies severity and deduplicates.
     */
    add(input) {
        var _a;
        const fp = this.fingerprint(input);
        const now = Date.now();
        const lastSeen = this.seen.get(fp);
        // Dedup within window
        if (lastSeen !== undefined && now - lastSeen < this.dedupWindowMs) {
            return null;
        }
        this.seen.set(fp, now);
        const error = {
            id: (0, crypto_1.randomUUID)(),
            type: input.type,
            severity: (_a = SEVERITY_MAP[input.type]) !== null && _a !== void 0 ? _a : 'error',
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
    addConsole(type, text, source) {
        if (type !== 'error' && type !== 'warning')
            return null;
        return this.add({
            type: type === 'error' ? 'console-error' : 'a11y-violation',
            source: source !== null && source !== void 0 ? source : 'console',
            message: text,
        });
    }
    /**
     * Convenience: classify a network failure.
     */
    addNetworkFailure(url, method, status, failure) {
        return this.add({
            type: 'network-fail',
            source: url,
            message: `${method} ${url} → ${status !== null && status !== void 0 ? status : 'failed'}${failure ? `: ${failure}` : ''}`,
            context: { method, status, failure },
        });
    }
    /**
     * Convenience: classify a page crash.
     */
    addCrash(message) {
        return this.add({
            type: 'crash',
            source: 'page',
            message,
        });
    }
    /**
     * Get all collected errors, optionally filtered.
     */
    getAll(filter) {
        let result = this.errors;
        if (filter === null || filter === void 0 ? void 0 : filter.type)
            result = result.filter(e => e.type === filter.type);
        if (filter === null || filter === void 0 ? void 0 : filter.severity)
            result = result.filter(e => e.severity === filter.severity);
        return result;
    }
    /**
     * Get error count by severity.
     */
    stats() {
        const counts = { critical: 0, error: 0, warning: 0, info: 0 };
        for (const e of this.errors) {
            counts[e.severity]++;
        }
        return counts;
    }
    /**
     * Export errors as JSON-serializable array.
     */
    exportJSON() {
        return [...this.errors];
    }
    /**
     * Clear all errors.
     */
    clear() {
        this.errors = [];
        this.seen.clear();
    }
    /**
     * Get total count.
     */
    get size() {
        return this.errors.length;
    }
    fingerprint(input) {
        return `${input.type}:${input.source}:${input.message.slice(0, 200)}`;
    }
}
exports.ErrorCollector = ErrorCollector;
