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

export type VibeMode = 'OFF' | 'WARNING' | 'SOFT' | 'FULL';

export interface VibeInputs {
  /** 0..1 — clarity of goal, in-scope vs out-of-scope, design rationale present. */
  intent: number;
  /** 0..1 — author named, AI usage disclosed, ownership attestation. */
  ownership: number;
  /** 0..1 — links to plan/handoff/issue, "why not what" rationale present. */
  context: number;
  /** 0..1 — fraction of changes covered by added/passing tests. */
  tests: number;
  /** 0..1 — review evidence (PR review, second opinion, pair check). */
  review: number;
}

export interface VibeResult {
  score: number;            // 0..100, integer
  components: VibeInputs;   // raw inputs
  weighted: VibeInputs;     // each component × weight (×100)
  band: 'POOR' | 'FAIR' | 'GOOD' | 'GREAT';
  advice: string[];
}

export const VIBE_WEIGHTS: VibeInputs = {
  intent: 0.30,
  ownership: 0.25,
  context: 0.20,
  tests: 0.15,
  review: 0.10,
};

const MODE_THRESHOLDS: Record<VibeMode, { warn: number; block: number | null }> = {
  OFF:     { warn: 0,  block: null },
  WARNING: { warn: 60, block: null },
  SOFT:    { warn: 60, block: null },
  FULL:    { warn: 60, block: 70 },
};

function clamp01(n: number): number {
  if (Number.isNaN(n) || !Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

export function computeVibeIndex(raw: Partial<VibeInputs>): VibeResult {
  const components: VibeInputs = {
    intent: clamp01(raw.intent ?? 0),
    ownership: clamp01(raw.ownership ?? 0),
    context: clamp01(raw.context ?? 0),
    tests: clamp01(raw.tests ?? 0),
    review: clamp01(raw.review ?? 0),
  };
  const weighted: VibeInputs = {
    intent: components.intent * VIBE_WEIGHTS.intent * 100,
    ownership: components.ownership * VIBE_WEIGHTS.ownership * 100,
    context: components.context * VIBE_WEIGHTS.context * 100,
    tests: components.tests * VIBE_WEIGHTS.tests * 100,
    review: components.review * VIBE_WEIGHTS.review * 100,
  };
  const score = Math.round(
    weighted.intent + weighted.ownership + weighted.context + weighted.tests + weighted.review,
  );

  const advice: string[] = [];
  if (components.intent < 0.7) advice.push('Clarify intent — link plan/spec, state in/out of scope.');
  if (components.ownership < 0.7) advice.push('Add ownership — attribute author, disclose AI usage.');
  if (components.context < 0.7) advice.push('Add context — link handoff/issue, write WHY (not WHAT).');
  if (components.tests < 0.7) advice.push('Increase test coverage on changed lines.');
  if (components.review < 0.5) advice.push('Get a review or second-opinion before merge.');

  let band: VibeResult['band'] = 'POOR';
  if (score >= 85) band = 'GREAT';
  else if (score >= 70) band = 'GOOD';
  else if (score >= 50) band = 'FAIR';

  return { score, components, weighted, band, advice };
}

export interface VibeGateOutcome {
  result: VibeResult;
  mode: VibeMode;
  status: 'pass' | 'warn' | 'block';
  message: string;
}

export function applyVibeMode(result: VibeResult, mode: VibeMode): VibeGateOutcome {
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

export function formatVibeReport(result: VibeResult): string {
  const lines: string[] = [
    `Vibecoding Index: ${result.score}/100 (${result.band})`,
    `  intent     ${pct(result.components.intent)}  →  ${result.weighted.intent.toFixed(1)} pts`,
    `  ownership  ${pct(result.components.ownership)}  →  ${result.weighted.ownership.toFixed(1)} pts`,
    `  context    ${pct(result.components.context)}  →  ${result.weighted.context.toFixed(1)} pts`,
    `  tests      ${pct(result.components.tests)}  →  ${result.weighted.tests.toFixed(1)} pts`,
    `  review     ${pct(result.components.review)}  →  ${result.weighted.review.toFixed(1)} pts`,
  ];
  if (result.advice.length) {
    lines.push('Advice:');
    for (const a of result.advice) lines.push(`  • ${a}`);
  }
  return lines.join('\n');
}

function pct(n: number): string {
  return `${(n * 100).toFixed(0).padStart(3, ' ')}%`;
}
