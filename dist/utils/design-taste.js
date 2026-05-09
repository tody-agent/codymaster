"use strict";
/**
 * Design taste memory — per-project log of approved/rejected design choices
 * (color, font, layout). Each entry decays 5 % per week so old taste does
 * not lock in stale aesthetics; entries with weight < 0.1 are dropped on read.
 *
 * Storage: `.cm/design-taste.json` (JSON, not JSONL — small file, full rewrite).
 *
 * Consumed by cm-design-system and cm-ui-preview to bias token / prompt
 * generation toward what the user has already approved.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tastePath = tastePath;
exports.recordTaste = recordTaste;
exports.decayEntries = decayEntries;
exports.loadTaste = loadTaste;
exports.topTaste = topTaste;
exports.compactTaste = compactTaste;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const FILENAME = path_1.default.join('.cm', 'design-taste.json');
const DECAY_PER_WEEK = 0.05;
const MIN_WEIGHT = 0.1;
const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;
function tastePath(projectPath) {
    return path_1.default.join(projectPath, FILENAME);
}
function readRaw(p) {
    if (!fs_1.default.existsSync(p))
        return { version: 1, entries: [] };
    try {
        const raw = JSON.parse(fs_1.default.readFileSync(p, 'utf8'));
        if (!raw || raw.version !== 1 || !Array.isArray(raw.entries)) {
            return { version: 1, entries: [] };
        }
        return raw;
    }
    catch (_a) {
        return { version: 1, entries: [] };
    }
}
function writeRaw(p, file) {
    fs_1.default.mkdirSync(path_1.default.dirname(p), { recursive: true });
    fs_1.default.writeFileSync(p, JSON.stringify(file, null, 2) + '\n');
}
function recordTaste(projectPath, input, now = new Date()) {
    const p = tastePath(projectPath);
    const file = readRaw(p);
    // Idempotent on (dimension, value, verdict): refresh ts/weight instead of duplicating.
    const existing = file.entries.find(e => e.dimension === input.dimension && e.value === input.value && e.verdict === input.verdict);
    const entry = {
        dimension: input.dimension,
        value: input.value,
        verdict: input.verdict,
        weight: 1.0,
        ts: now.toISOString(),
    };
    if (existing) {
        existing.weight = 1.0;
        existing.ts = entry.ts;
    }
    else {
        file.entries.push(entry);
    }
    writeRaw(p, file);
    return existing !== null && existing !== void 0 ? existing : entry;
}
/**
 * Apply exponential decay (5 %/week) and drop entries below MIN_WEIGHT.
 * Pure: does not write back.
 */
function decayEntries(entries, now = new Date()) {
    const nowMs = now.getTime();
    const out = [];
    for (const e of entries) {
        const ageWeeks = Math.max(0, (nowMs - new Date(e.ts).getTime()) / MS_PER_WEEK);
        const decayed = e.weight * Math.pow(1 - DECAY_PER_WEEK, ageWeeks);
        if (decayed >= MIN_WEIGHT) {
            out.push(Object.assign(Object.assign({}, e), { weight: Number(decayed.toFixed(4)) }));
        }
    }
    return out;
}
function loadTaste(projectPath, now = new Date()) {
    return decayEntries(readRaw(tastePath(projectPath)).entries, now);
}
function topTaste(projectPath, dimension, n = 5, now = new Date()) {
    const live = loadTaste(projectPath, now).filter(e => e.dimension === dimension);
    const sortDesc = (a, b) => b.weight - a.weight;
    return {
        approved: live.filter(e => e.verdict === 'approved').sort(sortDesc).slice(0, n),
        rejected: live.filter(e => e.verdict === 'rejected').sort(sortDesc).slice(0, n),
    };
}
/**
 * Rewrite the file with decayed entries, dropping stale ones.
 * Cm-continuity or a periodic task can call this; not required for reads.
 */
function compactTaste(projectPath, now = new Date()) {
    const p = tastePath(projectPath);
    const before = readRaw(p).entries;
    const after = decayEntries(before, now);
    writeRaw(p, { version: 1, entries: after });
    return before.length - after.length;
}
