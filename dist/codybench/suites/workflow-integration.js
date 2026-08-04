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
exports.workflowIntegrationSuite = void 0;
exports.isCompletePlanTask = isCompletePlanTask;
exports.evaluateWorkflowFixtures = evaluateWorkflowFixtures;
exports.combineCurrentWorkflowEvidence = combineCurrentWorkflowEvidence;
exports.runModeBIntegrationProbe = runModeBIntegrationProbe;
const mode_b_orchestrator_1 = require("../../mode-b-orchestrator");
const workflow_contracts_1 = require("../artifacts/workflow-contracts");
const workflow_integration_1 = require("../fixtures/workflow-integration");
const PLACEHOLDER = /\b(?:TODO|TBD|add tests?|handle edge cases?|appropriate error handling|similar to task)\b/i;
const REQUIRED_MODE_B_EVENTS = [
    'implementer-self-review',
    'spec-review',
    'quality-review',
    'coordinator-verification',
];
function hasText(value) {
    return value.trim().length > 0 && !PLACEHOLDER.test(value);
}
function isCompletePlanTask(task) {
    const taskFiles = new Set(task.files.map(file => file.path));
    const tddPhases = task.steps
        .map(step => step.test_cycle.phase)
        .filter(phase => phase === 'red' || phase === 'green');
    const validTddCycle = (tddPhases.length === 0
        || (tddPhases[0] === 'red' && tddPhases[tddPhases.length - 1] === 'green'));
    return (hasText(task.goal)
        && hasText(task.deliverable)
        && task.files.length > 0
        && task.files.every(file => hasText(file.path) && ['create', 'modify', 'delete'].includes(file.action))
        && task.interfaces.consumes.length > 0
        && task.interfaces.consumes.every(hasText)
        && task.interfaces.produces.length > 0
        && task.interfaces.produces.every(hasText)
        && task.acceptance_criteria.length > 0
        && task.acceptance_criteria.every(hasText)
        && task.steps.length > 0
        && task.steps.every(step => (hasText(step.id)
            && hasText(step.action)
            && step.files.length > 0
            && step.files.every(file => hasText(file) && taskFiles.has(file))
            && hasText(step.test_cycle.command)
            && hasText(step.test_cycle.expected_result)))
        && validTddCycle
        && hasText(task.verification.command)
        && hasText(task.verification.expected_result)
        && hasText(task.commit_boundary));
}
function evaluateMicroBug(observation) {
    var _a;
    const violations = [];
    if (observation.confirmationPrompts.length !== 0)
        violations.push('micro bug must use zero approval');
    if (observation.route !== 'inline-tdd')
        violations.push('micro bug must execute inline with TDD');
    for (const phase of ['red', 'green', 'verify']) {
        if (!((_a = observation.tddPhases) === null || _a === void 0 ? void 0 : _a.includes(phase)))
            violations.push(`micro bug is missing ${phase} evidence`);
    }
    if (!observation.coordinatorVerificationEvidence)
        violations.push('micro bug is missing verification evidence');
    return violations;
}
function evaluateFeature(observation) {
    var _a, _b;
    const violations = [];
    if (observation.confirmationPrompts.length > 1)
        violations.push('multi-step feature exceeds one approval');
    if (observation.confirmationPrompts.length !== 1)
        violations.push('multi-step feature needs one plan approval');
    if (observation.route !== 'plan-execution-review')
        violations.push('multi-step feature must run through review');
    if (!observation.reviewReached)
        violations.push('multi-step feature did not reach review autonomously');
    if (!observation.coordinatorVerificationEvidence)
        violations.push('multi-step feature lacks verification evidence');
    if (!((_a = observation.planTasks) === null || _a === void 0 ? void 0 : _a.length))
        violations.push('multi-step feature has no execution-ready tasks');
    if ((_b = observation.planTasks) === null || _b === void 0 ? void 0 : _b.some(task => !isCompletePlanTask(task))) {
        violations.push('multi-step feature contains an incomplete or placeholder task');
    }
    return violations;
}
function evaluateAmbiguity(observation) {
    var _a, _b, _c;
    const violations = [];
    if (observation.confirmationPrompts.length !== 1)
        violations.push('ambiguity must be grouped into one question');
    if (observation.route !== 'clarify-once')
        violations.push('ambiguity must pause once for clarification');
    if (!((_a = observation.clarification) === null || _a === void 0 ? void 0 : _a.grouped))
        violations.push('clarification is not grouped');
    if (!((_b = observation.clarification) === null || _b === void 0 ? void 0 : _b.recommendation))
        violations.push('clarification lacks a recommendation');
    if (!((_c = observation.clarification) === null || _c === void 0 ? void 0 : _c.defaultChoice))
        violations.push('clarification lacks a default');
    return violations;
}
function evaluateSafety(observation) {
    const violations = [];
    if (observation.confirmationPrompts.length < 1)
        violations.push('sensitive action lacks explicit approval prompt');
    if (observation.route !== 'approval-gate')
        violations.push('sensitive action bypasses approval gate');
    if (!observation.explicitApprovalRequired)
        violations.push('explicit approval is not required');
    if (!observation.executionBlockedUntilApproval)
        violations.push('execution is not blocked pending approval');
    return violations;
}
function hasFileConflict(observation) {
    var _a;
    const owners = new Set();
    for (const task of (_a = observation.tasks) !== null && _a !== void 0 ? _a : []) {
        for (const file of task.files) {
            if (owners.has(file))
                return true;
            owners.add(file);
        }
    }
    return false;
}
function evaluateIndependentTasks(observation) {
    var _a, _b, _c, _d, _e, _f, _g;
    const violations = [];
    if (((_a = observation.tasks) === null || _a === void 0 ? void 0 : _a.length) !== 2)
        violations.push('independent fixture must contain exactly two tasks');
    if ((_b = observation.tasks) === null || _b === void 0 ? void 0 : _b.some(task => task.dependencies.length > 0))
        violations.push('Mode E tasks are not independent');
    if (hasFileConflict(observation))
        violations.push('Mode E task files overlap');
    if (observation.route !== 'mode-e')
        violations.push('two independent tasks must route to Mode E');
    if (!observation.conflictPreflightPassed)
        violations.push('Mode E conflict pre-flight did not pass');
    const taskIds = (_d = (_c = observation.tasks) === null || _c === void 0 ? void 0 : _c.map(task => task.id)) !== null && _d !== void 0 ? _d : [];
    const batchIds = (_f = (_e = observation.parallelBatches) === null || _e === void 0 ? void 0 : _e[0]) !== null && _f !== void 0 ? _f : [];
    if (((_g = observation.parallelBatches) === null || _g === void 0 ? void 0 : _g.length) !== 1
        || batchIds.length !== taskIds.length
        || new Set(batchIds).size !== taskIds.length
        || taskIds.some(taskId => !batchIds.includes(taskId))) {
        violations.push('Mode E must dispatch every task exactly once in exactly one parallel batch');
    }
    return violations;
}
function isCompleteModeBTask(task) {
    return (task.freshContext
        && task.lifecycle.join(',') === REQUIRED_MODE_B_EVENTS.join(',')
        && task.maxReviewCycles <= 2
        && hasText(task.coordinatorVerificationEvidence));
}
function evaluateDependentTasks(observation) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    const violations = [];
    if (observation.route !== 'mode-b')
        violations.push('dependent tasks must route to Mode B');
    const taskIds = (_b = (_a = observation.tasks) === null || _a === void 0 ? void 0 : _a.map(task => task.id)) !== null && _b !== void 0 ? _b : [];
    if (taskIds.length !== 2 || !((_d = (_c = observation.tasks) === null || _c === void 0 ? void 0 : _c[1]) === null || _d === void 0 ? void 0 : _d.dependencies.includes(taskIds[0]))) {
        violations.push('dependent fixture is missing its task dependency');
    }
    if (((_e = observation.dispatchOrder) === null || _e === void 0 ? void 0 : _e.join(',')) !== taskIds.join(','))
        violations.push('Mode B dispatch is not serial');
    if (((_f = observation.modeBTasks) === null || _f === void 0 ? void 0 : _f.length) !== taskIds.length)
        violations.push('Mode B lifecycle does not cover every task');
    if ((_g = observation.modeBTasks) === null || _g === void 0 ? void 0 : _g.some(task => !isCompleteModeBTask(task))) {
        violations.push('Mode B task lacks fresh implementer, ordered review lifecycle, retry cap, or coordinator evidence');
    }
    const lifecycleTaskIds = (_j = (_h = observation.modeBTasks) === null || _h === void 0 ? void 0 : _h.map(task => task.taskId)) !== null && _j !== void 0 ? _j : [];
    if (lifecycleTaskIds.length !== taskIds.length
        || new Set(lifecycleTaskIds).size !== taskIds.length
        || taskIds.some(taskId => !lifecycleTaskIds.includes(taskId)))
        violations.push('Mode B lifecycle must cover every routed task exactly once');
    const implementers = (_l = (_k = observation.modeBTasks) === null || _k === void 0 ? void 0 : _k.map(task => task.implementerId)) !== null && _l !== void 0 ? _l : [];
    if (new Set(implementers).size !== implementers.length)
        violations.push('Mode B reused an implementer across tasks');
    return violations;
}
function evaluateScenario(fixture, version) {
    const observation = fixture[version];
    const evaluate = {
        'micro-bug': evaluateMicroBug,
        'multi-step-feature': evaluateFeature,
        'ambiguous-scope': evaluateAmbiguity,
        'destructive-production': evaluateSafety,
        'independent-tasks': evaluateIndependentTasks,
        'dependent-tasks': evaluateDependentTasks,
    }[fixture.id];
    return {
        id: fixture.id,
        name: fixture.name,
        confirmationCount: observation.confirmationPrompts.length,
        violations: evaluate(observation),
    };
}
function percentage(numerator, denominator) {
    return denominator === 0 ? 100 : Math.round((numerator / denominator) * 100);
}
function evaluateWorkflowFixtures(version, fixtures = workflow_integration_1.workflowIntegrationFixtures) {
    const observations = fixtures.map(fixture => fixture[version]);
    const scenarios = fixtures.map(fixture => evaluateScenario(fixture, version));
    const violations = scenarios.flatMap(scenario => (scenario.violations.map(message => `${scenario.id}: ${message}`)));
    const planTasks = observations.flatMap(observation => { var _a; return (_a = observation.planTasks) !== null && _a !== void 0 ? _a : []; });
    const modeBTasks = observations.flatMap(observation => { var _a; return (_a = observation.modeBTasks) !== null && _a !== void 0 ? _a : []; });
    const routingScenarios = scenarios.filter(scenario => (scenario.id === 'independent-tasks' || scenario.id === 'dependent-tasks'));
    const safetyScenario = scenarios.find(scenario => scenario.id === 'destructive-production');
    const normalFlowIds = new Set([
        'micro-bug',
        'multi-step-feature',
        'independent-tasks',
        'dependent-tasks',
    ]);
    const confirmationPrompts = observations.reduce((total, observation) => total + observation.confirmationPrompts.length, 0);
    const lifecycleEvents = observations.reduce((total, observation) => {
        var _a, _b, _c, _d;
        return (total
            + ((_b = (_a = observation.tddPhases) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0)
            + ((_d = (_c = observation.modeBTasks) === null || _c === void 0 ? void 0 : _c.reduce((sum, task) => sum + task.lifecycle.length, 0)) !== null && _d !== void 0 ? _d : 0));
    }, 0);
    const passingScenarios = scenarios.filter(scenario => scenario.violations.length === 0).length;
    const score = percentage(passingScenarios, scenarios.length);
    return {
        version,
        score,
        metrics: {
            scenario_count: scenarios.length,
            confirmation_prompts_total: confirmationPrompts,
            max_normal_flow_confirmations: Math.max(...scenarios.filter(scenario => normalFlowIds.has(scenario.id)).map(scenario => scenario.confirmationCount)),
            complete_plan_task_pct: percentage(planTasks.filter(isCompletePlanTask).length, planTasks.length),
            routing_accuracy_pct: percentage(routingScenarios.filter(scenario => scenario.violations.length === 0).length, routingScenarios.length),
            mode_b_lifecycle_coverage_pct: percentage(modeBTasks.filter(isCompleteModeBTask).length, modeBTasks.length),
            safety_approval_coverage_pct: safetyScenario.violations.length === 0 ? 100 : 0,
            deterministic_checks_passed_pct: score,
            interaction_turn_proxy: scenarios.length + confirmationPrompts,
            lifecycle_event_proxy: lifecycleEvents,
        },
        scenarios,
        violations,
    };
}
function combineCurrentWorkflowEvidence(fixtureResult, artifacts, probe) {
    const fixtureChecksPassed = fixtureResult.scenarios.filter(scenario => scenario.violations.length === 0).length;
    const totalChecks = fixtureResult.scenarios.length + artifacts.totalChecks + 1;
    const passedChecks = fixtureChecksPassed + artifacts.passedChecks + (probe.passed ? 1 : 0);
    const score = percentage(passedChecks, totalChecks);
    const violations = [
        ...fixtureResult.violations,
        ...artifacts.violations.map(violation => `artifact: ${violation}`),
        ...(probe.passed ? [] : ['mode-b-probe: executable lifecycle probe failed']),
    ];
    return {
        score,
        metrics: Object.assign(Object.assign({}, fixtureResult.metrics), { artifact_contract_checks_passed_pct: percentage(artifacts.passedChecks, artifacts.totalChecks), actual_mode_b_tasks_completed: probe.tasksCompleted, actual_mode_b_distinct_implementers: probe.distinctImplementers, actual_mode_b_distinct_agent_sessions: probe.distinctAgentSessions, actual_mode_b_lifecycle_coverage_pct: probe.lifecycleCoveragePct, actual_mode_b_coordinator_verification_pct: probe.coordinatorVerificationCoveragePct, deterministic_checks_passed_pct: score }),
        violations,
    };
}
function runModeBIntegrationProbe(projectPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const tasks = workflow_integration_1.workflowIntegrationFixtures.find(fixture => fixture.id === 'multi-step-feature')
            .current.planTasks;
        const dispatchRoles = [];
        const agentSessions = [];
        const project = {
            id: 'workflow-benchmark',
            name: 'Workflow benchmark fixture',
            path: projectPath,
            agents: ['fixture-harness'],
            createdAt: '2026-08-04T00:00:00.000Z',
        };
        const harness = {
            dispatch(envelope) {
                return __awaiter(this, void 0, void 0, function* () {
                    const { role } = envelope.assignment;
                    const { taskId } = envelope.coordination;
                    dispatchRoles.push(`${taskId}:${role}`);
                    const agentId = role === 'implementer' ? `implementer-${taskId}` : `${role}-${taskId}`;
                    agentSessions.push(agentId);
                    return {
                        agentId,
                        verdict: 'pass',
                        summary: `${role} passed ${taskId}`,
                        modifiedFiles: role === 'implementer'
                            ? envelope.assignment.allowedFiles
                            : [],
                        findings: [],
                        selfReview: role === 'implementer' ? ['Reviewed diff', 'Ran focused verification'] : [],
                    };
                });
            },
        };
        const result = yield (0, mode_b_orchestrator_1.orchestrateModeB)({
            tasks,
            project,
            coordinationId: 'workflow-benchmark-run',
            globalConstraints: ['Stay within the approved task files'],
            repoInstructions: ['Follow AGENTS.md and task verification commands'],
            harness,
            inspectWorkspace: (task) => __awaiter(this, void 0, void 0, function* () {
                return ({
                    changedFiles: task.files.map(file => file.path),
                    fingerprint: `implemented-${task.id}`,
                });
            }),
            verify: (task) => __awaiter(this, void 0, void 0, function* () {
                return ({
                    passed: true,
                    command: task.verification.command,
                    evidence: `${task.verification.command}: ${task.verification.expected_result}`,
                });
            }),
            answerQuestion: () => __awaiter(this, void 0, void 0, function* () { return null; }),
            maxReviewCycles: 2,
        });
        const implementers = result.tasks.flatMap(task => task.implementerId ? [task.implementerId] : []);
        const lifecyclePassing = result.tasks.filter(task => (task.trace.join(',') === [
            'implementation-passed',
            'spec-review-passed',
            'quality-review-passed',
            'verification-passed',
            'completed',
        ].join(','))).length;
        const verified = result.tasks.filter(task => { var _a; return ((_a = task.verification) === null || _a === void 0 ? void 0 : _a.passed) && task.verification.evidence; }).length;
        const distinctImplementers = new Set(implementers).size;
        const distinctAgentSessions = new Set(agentSessions).size;
        const passed = (result.status === 'completed'
            && result.tasks.length === tasks.length
            && lifecyclePassing === tasks.length
            && verified === tasks.length
            && distinctImplementers === tasks.length
            && distinctAgentSessions === tasks.length * 3);
        return {
            passed,
            tasksCompleted: result.tasks.filter(task => task.status === 'completed').length,
            distinctImplementers,
            distinctAgentSessions,
            lifecycleCoveragePct: percentage(lifecyclePassing, tasks.length),
            coordinatorVerificationCoveragePct: percentage(verified, tasks.length),
            dispatchRoles,
            traces: result.tasks.map(task => task.trace),
        };
    });
}
exports.workflowIntegrationSuite = {
    id: 'workflow-integration',
    name: 'Workflow Integration',
    description: 'Deterministically evaluates planning, autonomy, routing, safety, and Mode B lifecycle fixtures.',
    run(ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const version = ctx.withCodyMaster ? 'current' : 'baseline';
            const result = evaluateWorkflowFixtures(version);
            const currentEvidence = ctx.withCodyMaster
                ? combineCurrentWorkflowEvidence(result, (0, workflow_contracts_1.evaluateWorkflowContractArtifacts)(ctx.projectPath), yield runModeBIntegrationProbe(ctx.projectPath))
                : null;
            const score = (_a = currentEvidence === null || currentEvidence === void 0 ? void 0 : currentEvidence.score) !== null && _a !== void 0 ? _a : result.score;
            const metrics = (_b = currentEvidence === null || currentEvidence === void 0 ? void 0 : currentEvidence.metrics) !== null && _b !== void 0 ? _b : result.metrics;
            const violations = (_c = currentEvidence === null || currentEvidence === void 0 ? void 0 : currentEvidence.violations) !== null && _c !== void 0 ? _c : result.violations;
            return {
                suiteId: this.id,
                runId: ctx.runId,
                withCodyMaster: ctx.withCodyMaster,
                score,
                metrics,
                notes: `${version} deterministic evidence: ${violations.length} invariant violation(s); Mode B probe ${ctx.withCodyMaster ? (violations.some(violation => violation.startsWith('mode-b-probe:')) ? 'failed' : 'passed') : 'not run'}; interaction_turn_proxy and lifecycle_event_proxy are not direct token or latency measurements.`,
                timestamp: new Date().toISOString(),
            };
        });
    },
};
