export interface EvalContext {
  projectPath: string;
  withCodyMaster: boolean;
  runId: string;
}

export interface EvalResult {
  suiteId: string;
  runId: string;
  withCodyMaster: boolean;
  score: number;
  metrics: Record<string, number>;
  notes: string;
  timestamp: string;
}

export interface EvalSuite {
  id: string;
  name: string;
  description: string;
  run(ctx: EvalContext): Promise<EvalResult>;
}

export interface SuiteAggregate {
  suiteId: string;
  runs: number;
  meanScore: number;
  minScore: number;
  maxScore: number;
  stddev: number;
}

export interface BenchConfig {
  version: string;
  platforms: string[];
  evals: Array<{ id: string; repeat: number; enabled: boolean }>;
  compare_mode: string;
  output_dir: string;
}
