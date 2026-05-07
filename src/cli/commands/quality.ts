/**
 * `cm quality` — Vibecoding Index CLI.
 *
 * Reads .cm/handoff/{plan,exec,review,quality}.json (when present) plus
 * git-derived signals to estimate the five Vibecoding components, then
 * prints a score 0–100 with advice.
 */

import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import {
  computeVibeIndex,
  applyVibeMode,
  formatVibeReport,
  type VibeInputs,
  type VibeMode,
} from '../../vibecoding-index';

function isMode(s: string): s is VibeMode {
  return s === 'OFF' || s === 'WARNING' || s === 'SOFT' || s === 'FULL';
}

function parseFraction(v: string | undefined, fallback: number): number {
  if (!v) return fallback;
  const n = Number(v);
  if (Number.isNaN(n)) return fallback;
  if (n > 1) return Math.min(1, n / 100);
  return Math.max(0, Math.min(1, n));
}

interface ScoreOptions {
  mode?: string;
  intent?: string;
  ownership?: string;
  context?: string;
  tests?: string;
  review?: string;
  json?: boolean;
}

function deriveFromHandoff(projectPath: string): Partial<VibeInputs> {
  const dir = path.join(projectPath, '.cm', 'handoff');
  if (!fs.existsSync(dir)) return {};
  const out: Partial<VibeInputs> = {};
  // intent — from intent.json or plan.json presence
  if (fs.existsSync(path.join(dir, 'plan.json'))) out.intent = 0.85;
  else if (fs.existsSync(path.join(dir, 'intent.json'))) out.intent = 0.65;
  // context — handoff chain length proxy
  const present = ['intent.json', 'plan.json', 'exec.json', 'review.json']
    .filter((f) => fs.existsSync(path.join(dir, f))).length;
  if (present > 0) out.context = Math.min(1, present / 4);
  // tests — from quality.json
  try {
    const q = JSON.parse(fs.readFileSync(path.join(dir, 'quality.json'), 'utf8'));
    if (typeof q?.data?.coverage_pct === 'number') {
      out.tests = Math.max(0, Math.min(1, q.data.coverage_pct / 100));
    } else if (q?.data?.tests_passed === true) {
      out.tests = 0.7;
    }
  } catch { /* missing or malformed */ }
  // review — from review.json
  try {
    const r = JSON.parse(fs.readFileSync(path.join(dir, 'review.json'), 'utf8'));
    if (Array.isArray(r?.data?.findings)) out.review = 0.8;
  } catch { /* none */ }
  return out;
}

export function registerQualityCommands(program: Command) {
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
    .action((opts: ScoreOptions) => {
      const cwd = process.cwd();
      const derived = deriveFromHandoff(cwd);
      const inputs: VibeInputs = {
        intent: parseFraction(opts.intent, derived.intent ?? 0.5),
        ownership: parseFraction(opts.ownership, derived.ownership ?? 0.6),
        context: parseFraction(opts.context, derived.context ?? 0.4),
        tests: parseFraction(opts.tests, derived.tests ?? 0.4),
        review: parseFraction(opts.review, derived.review ?? 0.4),
      };
      const result = computeVibeIndex(inputs);
      const mode: VibeMode = isMode(String(opts.mode ?? '').toUpperCase())
        ? (String(opts.mode).toUpperCase() as VibeMode)
        : 'WARNING';
      const outcome = applyVibeMode(result, mode);

      if (opts.json) {
        process.stdout.write(JSON.stringify({ outcome }, null, 2) + '\n');
      } else {
        process.stdout.write(formatVibeReport(result) + '\n');
        if (outcome.message) process.stdout.write(outcome.message + '\n');
      }
      if (outcome.status === 'block') process.exit(1);
    });
}
