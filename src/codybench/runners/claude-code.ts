import crypto from 'crypto';
import type { EvalSuite, EvalResult, BenchConfig } from '../types';

export async function runSuite(
  suite: EvalSuite,
  config: BenchConfig,
  projectPath: string
): Promise<EvalResult[]> {
  const evalConfig = config.evals.find(e => e.id === suite.id);
  const repeat = evalConfig?.repeat ?? 3;
  const results: EvalResult[] = [];

  for (let i = 0; i < repeat; i++) {
    const runId = `${suite.id}-run${i + 1}-${crypto.randomUUID().slice(0, 8)}`;

    // Run with CodyMaster
    results.push(await suite.run({ projectPath, withCodyMaster: true,  runId: `${runId}-cm` }));
    // Run without CodyMaster (baseline)
    results.push(await suite.run({ projectPath, withCodyMaster: false, runId: `${runId}-base` }));
  }

  return results;
}
