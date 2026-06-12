"use strict";
/**
 * Vibecoding Index — score code-change quality 0–100.
 *
 * Formula:
 *   intent     × 0.30   (clear goal, scope, design notes)
 *   ownership  × 0.25   (author attribution, AI disclosure)
 *   context    × 0.20   (links to plan/handoff, why-not-what)
 *   tests      × 0.15   (added/passing test coverage)
 *   review     × 0.10   (review evidence)
 *
 * Each input is normalized 0..1 before weighting.
 *
 * Modes (governance enforcement):
 *   OFF      → no print, no block
 *   WARNING  → print score + advice, never blocks (default)
 *   SOFT     → print score; warn loudly if score < 60
 *   FULL     → fail (exit 1) if score < 70
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VIBE_WEIGHTS = void 0;
exports.computeVibeIndex = computeVibeIndex;
exports.applyVibeMode = applyVibeMode;
exports.formatVibeReport = formatVibeReport;
exports.VIBE_WEIGHTS = {
    intent: 0.30,
    ownership: 0.25,
    context: 0.20,
    tests: 0.15,
    review: 0.10,
};
const MODE_THRESHOLDS = {
    OFF: { warn: 0, block: null },
    WARNING: { warn: 60, block: null },
    SOFT: { warn: 60, block: null },
    FULL: { warn: 60, block: 70 },
};
function clamp01(n) {
    if (Number.isNaN(n) || !Number.isFinite(n))
        return 0;
    return Math.max(0, Math.min(1, n));
}
function computeVibeIndex(raw) {
    var _a, _b, _c, _d, _e;
    const components = {
        intent: clamp01((_a = raw.intent) !== null && _a !== void 0 ? _a : 0),
        ownership: clamp01((_b = raw.ownership) !== null && _b !== void 0 ? _b : 0),
        context: clamp01((_c = raw.context) !== null && _c !== void 0 ? _c : 0),
        tests: clamp01((_d = raw.tests) !== null && _d !== void 0 ? _d : 0),
        review: clamp01((_e = raw.review) !== null && _e !== void 0 ? _e : 0),
    };
    const weighted = {
        intent: components.intent * exports.VIBE_WEIGHTS.intent * 100,
        ownership: components.ownership * exports.VIBE_WEIGHTS.ownership * 100,
        context: components.context * exports.VIBE_WEIGHTS.context * 100,
        tests: components.tests * exports.VIBE_WEIGHTS.tests * 100,
        review: components.review * exports.VIBE_WEIGHTS.review * 100,
    };
    const score = Math.round(weighted.intent + weighted.ownership + weighted.context + weighted.tests + weighted.review);
    const advice = [];
    if (components.intent < 0.7)
        advice.push('Clarify intent — link plan/spec, state in/out of scope.');
    if (components.ownership < 0.7)
        advice.push('Add ownership — attribute author, disclose AI usage.');
    if (components.context < 0.7)
        advice.push('Add context — link handoff/issue, write WHY (not WHAT).');
    if (components.tests < 0.7)
        advice.push('Increase test coverage on changed lines.');
    if (components.review < 0.5)
        advice.push('Get a review or second-opinion before merge.');
    let band = 'POOR';
    if (score >= 85)
        band = 'GREAT';
    else if (score >= 70)
        band = 'GOOD';
    else if (score >= 50)
        band = 'FAIR';
    return { score, components, weighted, band, advice };
}
function applyVibeMode(result, mode) {
    if (mode === 'OFF') {
        return { result, mode, status: 'pass', message: '' };
    }
    const t = MODE_THRESHOLDS[mode];
    if (t.block !== null && result.score < t.block) {
        return {
            result,
            mode,
            status: 'block',
            message: `Vibecoding Index ${result.score} < ${t.block} — blocked by ${mode} mode`,
        };
    }
    if (result.score < t.warn) {
        return {
            result,
            mode,
            status: 'warn',
            message: `Vibecoding Index ${result.score} (${result.band}) — below ${t.warn}, see advice`,
        };
    }
    return {
        result,
        mode,
        status: 'pass',
        message: `Vibecoding Index ${result.score} (${result.band})`,
    };
}
function formatVibeReport(result) {
    const lines = [
        `Vibecoding Index: ${result.score}/100 (${result.band})`,
        `  intent     ${pct(result.components.intent)}  →  ${result.weighted.intent.toFixed(1)} pts`,
        `  ownership  ${pct(result.components.ownership)}  →  ${result.weighted.ownership.toFixed(1)} pts`,
        `  context    ${pct(result.components.context)}  →  ${result.weighted.context.toFixed(1)} pts`,
        `  tests      ${pct(result.components.tests)}  →  ${result.weighted.tests.toFixed(1)} pts`,
        `  review     ${pct(result.components.review)}  →  ${result.weighted.review.toFixed(1)} pts`,
    ];
    if (result.advice.length) {
        lines.push('Advice:');
        for (const a of result.advice)
            lines.push(`  • ${a}`);
    }
    return lines.join('\n');
}
function pct(n) {
    return `${(n * 100).toFixed(0).padStart(3, ' ')}%`;
}
