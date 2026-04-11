import type { EvalSuite, EvalContext, EvalResult } from '../types';

// TDD Regression Suite — measures whether TDD skill catches regression bugs
// v0.1: scaffolded. Full simulation in v0.2.
export const tddRegressionSuite: EvalSuite = {
  id: 'tdd-regression',
  name: 'TDD Regression Catch Rate',
  description: 'Measures whether the TDD skill prevents regression bugs from shipping.',

  async run(ctx: EvalContext): Promise<EvalResult> {
    // TODO v0.2: simulate a code change that introduces a regression,
    // run with and without cm-tdd skill, measure catch rate.
    const score = ctx.withCodyMaster ? 85 : 62; // placeholder values
    return {
      suiteId: this.id,
      runId: ctx.runId,
      withCodyMaster: ctx.withCodyMaster,
      score,
      metrics: { regression_catch_rate: score },
      notes: 'v0.1 scaffold — placeholder scores. Implement simulation in v0.2.',
      timestamp: new Date().toISOString(),
    };
  },
};
