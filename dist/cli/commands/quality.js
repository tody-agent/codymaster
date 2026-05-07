"use strict";
/**
 * `cm quality` — Vibecoding Index CLI.
 *
 * Reads .cm/handoff/{plan,exec,review,quality}.json (when present) plus
 * git-derived signals to estimate the five Vibecoding components, then
 * prints a score 0–100 with advice.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerQualityCommands = registerQualityCommands;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const vibecoding_index_1 = require("../../vibecoding-index");
function isMode(s) {
    return s === 'OFF' || s === 'WARNING' || s === 'SOFT' || s === 'FULL';
}
function parseFraction(v, fallback) {
    if (!v)
        return fallback;
    const n = Number(v);
    if (Number.isNaN(n))
        return fallback;
    if (n > 1)
        return Math.min(1, n / 100);
    return Math.max(0, Math.min(1, n));
}
function deriveFromHandoff(projectPath) {
    var _a, _b, _c;
    const dir = path_1.default.join(projectPath, '.cm', 'handoff');
    if (!fs_1.default.existsSync(dir))
        return {};
    const out = {};
    // intent — from intent.json or plan.json presence
    if (fs_1.default.existsSync(path_1.default.join(dir, 'plan.json')))
        out.intent = 0.85;
    else if (fs_1.default.existsSync(path_1.default.join(dir, 'intent.json')))
        out.intent = 0.65;
    // context — handoff chain length proxy
    const present = ['intent.json', 'plan.json', 'exec.json', 'review.json']
        .filter((f) => fs_1.default.existsSync(path_1.default.join(dir, f))).length;
    if (present > 0)
        out.context = Math.min(1, present / 4);
    // tests — from quality.json
    try {
        const q = JSON.parse(fs_1.default.readFileSync(path_1.default.join(dir, 'quality.json'), 'utf8'));
        if (typeof ((_a = q === null || q === void 0 ? void 0 : q.data) === null || _a === void 0 ? void 0 : _a.coverage_pct) === 'number') {
            out.tests = Math.max(0, Math.min(1, q.data.coverage_pct / 100));
        }
        else if (((_b = q === null || q === void 0 ? void 0 : q.data) === null || _b === void 0 ? void 0 : _b.tests_passed) === true) {
            out.tests = 0.7;
        }
    }
    catch ( /* missing or malformed */_d) { /* missing or malformed */ }
    // review — from review.json
    try {
        const r = JSON.parse(fs_1.default.readFileSync(path_1.default.join(dir, 'review.json'), 'utf8'));
        if (Array.isArray((_c = r === null || r === void 0 ? void 0 : r.data) === null || _c === void 0 ? void 0 : _c.findings))
            out.review = 0.8;
    }
    catch ( /* none */_e) { /* none */ }
    return out;
}
function registerQualityCommands(program) {
    const quality = program.command('quality').description('Vibecoding Index — score 0..100 for the current change');
    quality
        .command('score')
        .description('compute and print the Vibecoding Index')
        .option('--mode <mode>', 'OFF|WARNING|SOFT|FULL', 'WARNING')
        .option('--intent <n>', 'override intent score (0..1 or 0..100)')
        .option('--ownership <n>', 'override ownership score (0..1 or 0..100)')
        .option('--context <n>', 'override context score (0..1 or 0..100)')
        .option('--tests <n>', 'override tests score (0..1 or 0..100)')
        .option('--review <n>', 'override review score (0..1 or 0..100)')
        .option('--json', 'print raw JSON')
        .action((opts) => {
        var _a, _b, _c, _d, _e, _f;
        const cwd = process.cwd();
        const derived = deriveFromHandoff(cwd);
        const inputs = {
            intent: parseFraction(opts.intent, (_a = derived.intent) !== null && _a !== void 0 ? _a : 0.5),
            ownership: parseFraction(opts.ownership, (_b = derived.ownership) !== null && _b !== void 0 ? _b : 0.6),
            context: parseFraction(opts.context, (_c = derived.context) !== null && _c !== void 0 ? _c : 0.4),
            tests: parseFraction(opts.tests, (_d = derived.tests) !== null && _d !== void 0 ? _d : 0.4),
            review: parseFraction(opts.review, (_e = derived.review) !== null && _e !== void 0 ? _e : 0.4),
        };
        const result = (0, vibecoding_index_1.computeVibeIndex)(inputs);
        const mode = isMode(String((_f = opts.mode) !== null && _f !== void 0 ? _f : '').toUpperCase())
            ? String(opts.mode).toUpperCase()
            : 'WARNING';
        const outcome = (0, vibecoding_index_1.applyVibeMode)(result, mode);
        if (opts.json) {
            process.stdout.write(JSON.stringify({ outcome }, null, 2) + '\n');
        }
        else {
            process.stdout.write((0, vibecoding_index_1.formatVibeReport)(result) + '\n');
            if (outcome.message)
                process.stdout.write(outcome.message + '\n');
        }
        if (outcome.status === 'block')
            process.exit(1);
    });
}
