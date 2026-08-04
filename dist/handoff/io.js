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
const PLAN_TASK_KEYS = [
    'id',
    'goal',
    'deliverable',
    'files',
    'dependencies',
    'interfaces',
    'acceptance_criteria',
    'steps',
    'verification',
    'commit_boundary',
];
const PLACEHOLDER_PATTERN = /\b(?:TODO|TBD|implement later|fill in details|add tests|handle edge cases|appropriate error handling|write tests for the above|similar to task)\b/i;
function requireObject(value, location) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new HandoffError(`${location} must be an object`);
    }
    return value;
}
function requireString(value, location) {
    if (typeof value !== 'string' || value.trim() === '') {
        throw new HandoffError(`${location} must be a non-empty string`);
    }
    return value;
}
function requireStringArray(value, location, allowEmpty = true) {
    if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) {
        throw new HandoffError(`${location} must be ${allowEmpty ? 'an' : 'a non-empty'} array`);
    }
    return value.map((item, index) => requireString(item, `${location}[${index}]`));
}
function rejectPlaceholders(value, location) {
    if (typeof value === 'string' && PLACEHOLDER_PATTERN.test(value)) {
        throw new HandoffError(`${location} contains placeholder text`);
    }
    if (Array.isArray(value)) {
        value.forEach((item, index) => rejectPlaceholders(item, `${location}[${index}]`));
    }
    else if (value && typeof value === 'object') {
        for (const [key, item] of Object.entries(value)) {
            rejectPlaceholders(item, `${location}.${key}`);
        }
    }
}
function validatePlanTaskSpecs(data) {
    if (!('task_specs' in data))
        return;
    if (!Array.isArray(data.task_specs) || data.task_specs.length === 0) {
        throw new HandoffError('handoff[plan@1].data.task_specs must be a non-empty array');
    }
    const taskIds = new Set();
    data.task_specs.forEach((value, taskIndex) => {
        const location = `handoff[plan@1].data.task_specs[${taskIndex}]`;
        const task = requireObject(value, location);
        for (const key of PLAN_TASK_KEYS) {
            if (!(key in task))
                throw new HandoffError(`${location} missing key: ${key}`);
        }
        const id = requireString(task.id, `${location}.id`);
        if (taskIds.has(id))
            throw new HandoffError(`${location}.id must be unique: ${id}`);
        taskIds.add(id);
        requireString(task.goal, `${location}.goal`);
        requireString(task.deliverable, `${location}.deliverable`);
        requireString(task.commit_boundary, `${location}.commit_boundary`);
        requireStringArray(task.dependencies, `${location}.dependencies`);
        requireStringArray(task.acceptance_criteria, `${location}.acceptance_criteria`, false);
        if (!Array.isArray(task.files) || task.files.length === 0) {
            throw new HandoffError(`${location}.files must be a non-empty array`);
        }
        const taskFiles = new Set();
        task.files.forEach((fileValue, fileIndex) => {
            const fileLocation = `${location}.files[${fileIndex}]`;
            const file = requireObject(fileValue, fileLocation);
            taskFiles.add(requireString(file.path, `${fileLocation}.path`));
            if (!['create', 'modify', 'delete'].includes(String(file.action))) {
                throw new HandoffError(`${fileLocation}.action must be create, modify, or delete`);
            }
        });
        const interfaces = requireObject(task.interfaces, `${location}.interfaces`);
        requireStringArray(interfaces.consumes, `${location}.interfaces.consumes`);
        requireStringArray(interfaces.produces, `${location}.interfaces.produces`);
        if (!Array.isArray(task.steps) || task.steps.length === 0) {
            throw new HandoffError(`${location}.steps must be a non-empty array`);
        }
        const stepIds = new Set();
        const tddPhases = [];
        task.steps.forEach((stepValue, stepIndex) => {
            const stepLocation = `${location}.steps[${stepIndex}]`;
            const step = requireObject(stepValue, stepLocation);
            const stepId = requireString(step.id, `${stepLocation}.id`);
            if (stepIds.has(stepId)) {
                throw new HandoffError(`${stepLocation}.id must be unique: ${stepId}`);
            }
            stepIds.add(stepId);
            requireString(step.action, `${stepLocation}.action`);
            const stepFiles = requireStringArray(step.files, `${stepLocation}.files`, false);
            stepFiles.forEach((stepFile, fileIndex) => {
                if (!taskFiles.has(stepFile)) {
                    throw new HandoffError(`${stepLocation}.files[${fileIndex}] must be within the task scope`);
                }
            });
            const cycle = requireObject(step.test_cycle, `${stepLocation}.test_cycle`);
            if (!['red', 'green', 'refactor', 'verify'].includes(String(cycle.phase))) {
                throw new HandoffError(`${stepLocation}.test_cycle.phase is invalid`);
            }
            if (cycle.phase === 'red' || cycle.phase === 'green') {
                tddPhases.push(cycle.phase);
            }
            requireString(cycle.command, `${stepLocation}.test_cycle.command`);
            requireString(cycle.expected_result, `${stepLocation}.test_cycle.expected_result`);
        });
        if (tddPhases.length > 0 && (!tddPhases.includes('red') || !tddPhases.includes('green'))) {
            throw new HandoffError(`${location}.steps using TDD must include both RED and GREEN phases`);
        }
        if (tddPhases.length > 0
            && (tddPhases[0] !== 'red' || tddPhases[tddPhases.length - 1] !== 'green')) {
            throw new HandoffError(`${location}.steps must put RED before GREEN`);
        }
        const verification = requireObject(task.verification, `${location}.verification`);
        requireString(verification.command, `${location}.verification.command`);
        requireString(verification.expected_result, `${location}.verification.expected_result`);
        rejectPlaceholders(task, location);
    });
    for (const firstTask of requireStringArray(data.first_tasks, 'handoff[plan@1].data.first_tasks')) {
        if (!taskIds.has(firstTask)) {
            throw new HandoffError(`handoff[plan@1].data.first_tasks references missing task_specs id: ${firstTask}`);
        }
    }
}
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
    if (schema === 'plan@1') {
        validatePlanTaskSpecs(data);
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
