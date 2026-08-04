import type { BenchConfig } from './types';

export function createDefaultBenchConfig(): BenchConfig {
  return {
    version: '0.2.0',
    platforms: ['claude-code'],
    evals: [
      { id: 'tdd-regression', repeat: 3, enabled: true },
      { id: 'token-efficiency', repeat: 3, enabled: true },
      { id: 'memory-retention', repeat: 3, enabled: true },
      { id: 'workflow-integration', repeat: 1, enabled: true },
    ],
    compare_mode: 'with-vs-without-codymaster',
    output_dir: 'codybench/reports',
  };
}
