"use strict";
/**
 * Opinionated sprint pipeline + Context Bus files under `.cm/sprint/`.
 * Complements root `context-bus.json` with step artifacts (ADR 002).
 *
 * v2.0: optional structured handoff JSON via `src/handoff/`. Sprint skills
 * may call `completeSprintStepWithHandoff()` to emit a typed handoff file
 * alongside the Markdown artifact.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SPRINT_STEPS = void 0;
exports.readSprintState = readSprintState;
exports.writeSprintState = writeSprintState;
exports.initSprint = initSprint;
exports.completeSprintStep = completeSprintStep;
exports.completeSprintStepWithHandoff = completeSprintStepWithHandoff;
exports.skipSprintStep = skipSprintStep;
exports.resetSprint = resetSprint;
exports.sprintDryRun = sprintDryRun;
exports.sprintArtifactPreviewFromDisk = sprintArtifactPreviewFromDisk;
exports.skillMappingForStep = skillMappingForStep;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const handoff_1 = require("./handoff");
exports.SPRINT_STEPS = [
    'brainstorm',
    'plan',
    'design',
    'tdd',
    'build',
    'review',
    'qa',
    'security',
    'ship',
    'monitor',
    'retro',
];
function sprintDir(projectPath) {
    return path_1.default.join(projectPath, '.cm', 'sprint');
}
function statePath(projectPath) {
    return path_1.default.join(sprintDir(projectPath), 'state.json');
}
function ensureSprintDir(projectPath) {
    const d = sprintDir(projectPath);
    const art = path_1.default.join(d, 'artifacts');
    if (!fs_1.default.existsSync(art))
        fs_1.default.mkdirSync(art, { recursive: true });
}
function normalizeSprintState(raw) {
    var _a;
    return Object.assign(Object.assign({}, raw), { version: raw.version === 2 ? 2 : 1, skipped: (_a = raw.skipped) !== null && _a !== void 0 ? _a : [] });
}
function readSprintState(projectPath) {
    const p = statePath(projectPath);
    if (!fs_1.default.existsSync(p))
        return null;
    try {
        const raw = JSON.parse(fs_1.default.readFileSync(p, 'utf8'));
        return normalizeSprintState(raw);
    }
    catch (_a) {
        return null;
    }
}
function writeSprintState(projectPath, state) {
    ensureSprintDir(projectPath);
    fs_1.default.writeFileSync(statePath(projectPath), JSON.stringify(state, null, 2), 'utf8');
}
function initSprint(projectPath, fromStep) {
    ensureSprintDir(projectPath);
    const now = new Date().toISOString();
    let pipeline = [...exports.SPRINT_STEPS];
    let startIdx = 0;
    if (fromStep) {
        const i = pipeline.indexOf(fromStep);
        if (i >= 0)
            startIdx = i;
    }
    const state = {
        version: 2,
        pipeline,
        current_index: startIdx,
        completed: [],
        skipped: [],
        started_at: now,
        updated_at: now,
        artifacts_dir: path_1.default.join(sprintDir(projectPath), 'artifacts'),
    };
    writeSprintState(projectPath, state);
    appendEvent(projectPath, { type: 'init', from: fromStep !== null && fromStep !== void 0 ? fromStep : null, at: now });
    return state;
}
function completeSprintStep(projectPath, step, artifactBody) {
    let state = readSprintState(projectPath);
    if (!state)
        state = initSprint(projectPath);
    if (state.current_index >= state.pipeline.length) {
        throw new Error('Sprint pipeline already finished');
    }
    const expected = state.pipeline[state.current_index];
    if (expected !== step) {
        throw new Error(`Expected step "${expected}", got "${step}"`);
    }
    const artFile = path_1.default.join(state.artifacts_dir, `${step}.md`);
    fs_1.default.writeFileSync(artFile, artifactBody, 'utf8');
    state.completed.push(step);
    state.current_index = Math.min(state.current_index + 1, state.pipeline.length);
    state.updated_at = new Date().toISOString();
    state.version = 2;
    writeSprintState(projectPath, state);
    appendEvent(projectPath, { type: 'complete', step, at: state.updated_at });
    return state;
}
/**
 * Complete a sprint step AND emit a typed handoff JSON under `.cm/handoff/`.
 *
 * Use this from sprint skills (cm-planning, cm-execution, cm-code-review,
 * cm-quality-gate, cm-brainstorm-idea, cm-retro-cli) to make their output
 * machine-readable for the next phase.
 *
 * The Markdown artifact is still written; handoff is additive.
 */
function completeSprintStepWithHandoff(projectPath, step, artifactBody, handoff) {
    const state = completeSprintStep(projectPath, step, artifactBody);
    const handoffFile = (0, handoff_1.writeHandoff)(projectPath, handoff);
    appendEvent(projectPath, {
        type: 'handoff',
        step,
        schema: handoff.schema,
        at: state.updated_at,
    });
    return { state, handoffFile };
}
const SKIP_STUB = (step, at) => `# ${step}\n\n_Skipped via \`cm sprint skip\` at ${at}._\n`;
function skipSprintStep(projectPath, step) {
    let state = readSprintState(projectPath);
    if (!state)
        state = initSprint(projectPath);
    if (state.current_index >= state.pipeline.length) {
        throw new Error('Sprint pipeline already finished');
    }
    const expected = state.pipeline[state.current_index];
    if (expected !== step) {
        throw new Error(`Expected step "${expected}", got "${step}"`);
    }
    const at = new Date().toISOString();
    const artFile = path_1.default.join(state.artifacts_dir, `${step}.md`);
    fs_1.default.writeFileSync(artFile, SKIP_STUB(step, at), 'utf8');
    state.skipped.push(step);
    state.current_index = Math.min(state.current_index + 1, state.pipeline.length);
    state.updated_at = at;
    state.version = 2;
    writeSprintState(projectPath, state);
    appendEvent(projectPath, { type: 'skip', step, at });
    return state;
}
function backupDirName() {
    return new Date().toISOString().replace(/:/g, '-');
}
/** Remove sprint state; optional backup under `.cm/sprint/backup/<timestamp>/`. */
function resetSprint(projectPath, options) {
    const backup = (options === null || options === void 0 ? void 0 : options.backup) !== false;
    const sd = sprintDir(projectPath);
    const st = statePath(projectPath);
    const ev = eventsPath(projectPath);
    const art = path_1.default.join(sd, 'artifacts');
    const hasState = fs_1.default.existsSync(st);
    let hasEvents = false;
    if (fs_1.default.existsSync(ev)) {
        try {
            hasEvents = fs_1.default.statSync(ev).size > 0;
        }
        catch (_a) {
            hasEvents = false;
        }
    }
    let hasArtifacts = false;
    if (fs_1.default.existsSync(art)) {
        try {
            hasArtifacts = fs_1.default.readdirSync(art).length > 0;
        }
        catch (_b) {
            hasArtifacts = false;
        }
    }
    if (!hasState && !hasEvents && !hasArtifacts) {
        return { ok: false, reason: 'no_sprint_data' };
    }
    let backupPath;
    if (backup) {
        const stamp = backupDirName();
        backupPath = path_1.default.join(sd, 'backup', stamp);
        fs_1.default.mkdirSync(backupPath, { recursive: true });
        if (hasState)
            fs_1.default.copyFileSync(st, path_1.default.join(backupPath, 'state.json'));
        if (fs_1.default.existsSync(ev))
            fs_1.default.copyFileSync(ev, path_1.default.join(backupPath, 'events.jsonl'));
        if (fs_1.default.existsSync(art)) {
            const destArt = path_1.default.join(backupPath, 'artifacts');
            fs_1.default.cpSync(art, destArt, { recursive: true });
        }
    }
    fs_1.default.rmSync(st, { force: true });
    fs_1.default.rmSync(ev, { force: true });
    fs_1.default.rmSync(art, { recursive: true, force: true });
    fs_1.default.mkdirSync(art, { recursive: true });
    return { ok: true, backupDir: backupPath };
}
function sprintDryRun(projectPath) {
    var _a;
    const state = (_a = readSprintState(projectPath)) !== null && _a !== void 0 ? _a : initSprint(projectPath);
    return sprintArtifactPreview(state);
}
/** Read-only preview without creating files (for MCP / status). */
function sprintArtifactPreviewFromDisk(projectPath) {
    const state = readSprintState(projectPath);
    if (!state) {
        const base = path_1.default.join(projectPath, '.cm', 'sprint', 'artifacts');
        const artifacts = exports.SPRINT_STEPS.map((s) => path_1.default.join(base, `${s}.md`));
        return { steps: [...exports.SPRINT_STEPS], artifacts };
    }
    return sprintArtifactPreview(state);
}
function sprintArtifactPreview(state) {
    const artifacts = state.pipeline.map((s) => path_1.default.join(state.artifacts_dir, `${s}.md`));
    return { steps: [...state.pipeline], artifacts };
}
function eventsPath(projectPath) {
    return path_1.default.join(sprintDir(projectPath), 'events.jsonl');
}
function appendEvent(projectPath, rec) {
    ensureSprintDir(projectPath);
    fs_1.default.appendFileSync(eventsPath(projectPath), JSON.stringify(rec) + '\n', 'utf8');
}
function skillMappingForStep(step) {
    const map = {
        brainstorm: 'cm-brainstorm-idea',
        plan: 'cm-planning',
        design: 'cm-ui-preview / cm-design-system',
        tdd: 'cm-tdd',
        build: 'cm-execution',
        review: 'cm-code-review',
        qa: 'cm-quality-gate / cm-test-gate',
        security: 'cm-secret-shield / cm-security-gate',
        ship: 'cm-safe-deploy',
        monitor: 'cm-canary (post-deploy)',
        retro: 'cm-retro',
    };
    return map[step];
}
