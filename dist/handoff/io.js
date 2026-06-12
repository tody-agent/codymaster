"use strict";
/**
 * Handoff JSON read/write helpers.
 *
 * Files live under `<projectPath>/.cm/handoff/<name>.json`.
 * Validation is intentionally lightweight (no zod dep) — schema field +
 * required key presence is enough to catch drift early.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HandoffError = void 0;
exports.handoffPath = handoffPath;
exports.ensureHandoffDir = ensureHandoffDir;
exports.validateHandoff = validateHandoff;
exports.writeHandoff = writeHandoff;
exports.readHandoff = readHandoff;
exports.listHandoffs = listHandoffs;
exports.clearHandoffs = clearHandoffs;
exports.nowIso = nowIso;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const contracts_js_1 = require("./contracts.js");
class HandoffError extends Error {
}
exports.HandoffError = HandoffError;
function handoffDir(projectPath) {
    return path_1.default.join(projectPath, '.cm', 'handoff');
}
function handoffPath(projectPath, schema) {
    return path_1.default.join(handoffDir(projectPath), contracts_js_1.HANDOFF_FILENAMES[schema]);
}
function ensureHandoffDir(projectPath) {
    const d = handoffDir(projectPath);
    if (!fs_1.default.existsSync(d))
        fs_1.default.mkdirSync(d, { recursive: true });
}
/** Required top-level keys for every envelope. */
const ENVELOPE_KEYS = ['schema', 'emitted_at', 'emitted_by', 'data'];
/** Per-schema required keys inside `data`. */
const DATA_KEYS = {
    'intent@1': ['problem', 'success_criteria', 'constraints', 'options_considered'],
    'plan@1': ['goal', 'decisions', 'first_tasks'],
    'exec@1': ['completed_tasks', 'pending_tasks', 'files_changed', 'test_status'],
    'review@1': ['verdict', 'findings', 'must_fix_count'],
    'quality@1': ['gates_passed', 'gates_failed', 'safe_to_ship', 'evidence'],
    'retro@1': ['sprint_id', 'learnings'],
    'party@1': ['topic', 'personas'],
};
function validateHandoff(obj) {
    if (!obj || typeof obj !== 'object') {
        throw new HandoffError('handoff must be an object');
    }
    const o = obj;
    for (const k of ENVELOPE_KEYS) {
        if (!(k in o))
            throw new HandoffError(`handoff missing key: ${k}`);
    }
    const schema = o.schema;
    if (typeof schema !== 'string' || !(schema in contracts_js_1.HANDOFF_FILENAMES)) {
        throw new HandoffError(`unknown schema: ${String(schema)}`);
    }
    const data = o.data;
    if (!data || typeof data !== 'object') {
        throw new HandoffError('handoff.data must be an object');
    }
    const required = DATA_KEYS[schema];
    for (const k of required) {
        if (!(k in data)) {
            throw new HandoffError(`handoff[${schema}].data missing key: ${k}`);
        }
    }
}
function writeHandoff(projectPath, handoff) {
    validateHandoff(handoff);
    ensureHandoffDir(projectPath);
    const file = handoffPath(projectPath, handoff.schema);
    fs_1.default.writeFileSync(file, JSON.stringify(handoff, null, 2), 'utf8');
    return file;
}
function readHandoff(projectPath, schema) {
    const file = handoffPath(projectPath, schema);
    if (!fs_1.default.existsSync(file))
        return null;
    const raw = fs_1.default.readFileSync(file, 'utf8');
    let parsed;
    try {
        parsed = JSON.parse(raw);
    }
    catch (e) {
        throw new HandoffError(`handoff file is not valid JSON: ${file}`);
    }
    validateHandoff(parsed);
    if (parsed.schema !== schema) {
        throw new HandoffError(`handoff schema mismatch: expected ${schema}, got ${parsed.schema}`);
    }
    return parsed;
}
function listHandoffs(projectPath) {
    const d = handoffDir(projectPath);
    if (!fs_1.default.existsSync(d))
        return [];
    return fs_1.default.readdirSync(d).filter((f) => f.endsWith('.json'));
}
function clearHandoffs(projectPath) {
    const d = handoffDir(projectPath);
    if (!fs_1.default.existsSync(d))
        return 0;
    let n = 0;
    for (const f of fs_1.default.readdirSync(d)) {
        if (f.endsWith('.json')) {
            fs_1.default.unlinkSync(path_1.default.join(d, f));
            n++;
        }
    }
    return n;
}
function nowIso() {
    return new Date().toISOString();
}
