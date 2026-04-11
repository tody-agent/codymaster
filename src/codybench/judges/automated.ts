import type { EvalResult, SuiteAggregate } from '../types';

export function aggregateResults(results: EvalResult[]): SuiteAggregate[] {
  const bySuite = new Map<string, EvalResult[]>();
  for (const r of results) {
    if (!bySuite.has(r.suiteId)) bySuite.set(r.suiteId, []);
    bySuite.get(r.suiteId)!.push(r);
  }

  return Array.from(bySuite.entries()).map(([suiteId, runs]) => {
    const scores = runs.map(r => r.score);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((a, b) => a + (b - mean) ** 2, 0) / scores.length;
    return {
      suiteId,
      runs: runs.length,
      meanScore: Math.round(mean * 100) / 100,
      minScore: Math.min(...scores),
      maxScore: Math.max(...scores),
      stddev: Math.round(Math.sqrt(variance) * 100) / 100,
    };
  });
}

export function formatLeaderboard(aggregates: SuiteAggregate[]): string {
  const header = 'Suite                    | Runs | Mean  | Min  | Max  | StdDev';
  const sep    = '-'.repeat(header.length);
  const rows = aggregates.map(a =>
    `${a.suiteId.padEnd(24)} | ${String(a.runs).padStart(4)} | ${String(a.meanScore).padStart(5)} | ${String(a.minScore).padStart(4)} | ${String(a.maxScore).padStart(4)} | ${String(a.stddev).padStart(6)}`
  );
  return [header, sep, ...rows].join('\n');
}
