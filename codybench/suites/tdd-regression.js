"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tddRegressionSuite = void 0;
// TDD Regression Suite — measures whether TDD skill catches regression bugs
// v0.1: scaffolded. Full simulation in v0.2.
exports.tddRegressionSuite = {
    id: 'tdd-regression',
    name: 'TDD Regression Catch Rate',
    description: 'Measures whether the TDD skill prevents regression bugs from shipping.',
    run(ctx) {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    },
};
