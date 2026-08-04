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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentBackendModeBHarness = void 0;
exports.orchestrateModeB = orchestrateModeB;
exports.createAgentBackendModeBHarness = createAgentBackendModeBHarness;
const crypto_1 = __importDefault(require("crypto"));
const path_1 = __importDefault(require("path"));
const factory_1 = require("./agent/factory");
const agent_dispatch_1 = require("./agent-dispatch");
const DEFAULT_MAX_REVIEW_CYCLES = 2;
const MAX_ANSWERED_QUESTIONS = 3;
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function parseJsonReport(value) {
    if (typeof value !== 'string')
        return value;
    const trimmed = value.trim();
    const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    try {
        return JSON.parse(fenced ? fenced[1] : trimmed);
    }
    catch (_a) {
        return value;
    }
}
function isFinding(value) {
    if (!isRecord(value))
        return false;
    return (['info', 'warn', 'error', 'critical'].includes(String(value.severity))
        && typeof value.message === 'string'
        && (value.file === undefined || typeof value.file === 'string')
        && (value.line === undefined || typeof value.line === 'number'));
}
function validateReport(value) {
    const parsed = parseJsonReport(value);
    if (!isRecord(parsed))
        return null;
    const verdicts = ['pass', 'changes_requested', 'question', 'block'];
    if (typeof parsed.agentId !== 'string'
        || !parsed.agentId
        || !verdicts.includes(String(parsed.verdict))
        || typeof parsed.summary !== 'string'
        || !Array.isArray(parsed.modifiedFiles)
        || !parsed.modifiedFiles.every(file => typeof file === 'string')
        || !Array.isArray(parsed.findings)
        || !parsed.findings.every(isFinding)
        || !Array.isArray(parsed.selfReview)
        || !parsed.selfReview.every(item => typeof item === 'string')) {
        return null;
    }
    if (parsed.verdict === 'question') {
        if (!isRecord(parsed.question)
            || typeof parsed.question.text !== 'string'
            || typeof parsed.question.scopeChanging !== 'boolean') {
            return null;
        }
    }
    if (parsed.verdict === 'changes_requested' && parsed.findings.length === 0) {
        return null;
    }
    return parsed;
}
function normalizeReportedPath(filePath) {
    if (!filePath
        || filePath.includes('\0')
        || path_1.default.posix.isAbsolute(filePath)
        || path_1.default.win32.isAbsolute(filePath))
        return null;
    const normalized = path_1.default.posix.normalize(filePath.replace(/\\/g, '/')).replace(/^\.\//, '');
    if (normalized === '..' || normalized.startsWith('../'))
        return null;
    return normalized;
}
function validateFileScope(report, envelope) {
    const allowed = new Set(envelope.assignment.allowedFiles);
    for (const reportedFile of report.modifiedFiles) {
        const normalized = normalizeReportedPath(reportedFile);
        if (!normalized || !allowed.has(normalized)) {
            return {
                code: 'unauthorized-file-touch',
                message: `Agent ${report.agentId} reported unauthorized file: ${reportedFile}`,
            };
        }
    }
    if (envelope.assignment.role !== 'implementer' && report.modifiedFiles.length > 0) {
        return {
            code: 'unauthorized-file-touch',
            message: `Reviewer ${report.agentId} must not modify files.`,
        };
    }
    return null;
}
function validateInspectedFileScope(agentId, changedFiles, allowedFiles) {
    const allowed = new Set(allowedFiles);
    for (const changedFile of changedFiles) {
        const normalized = normalizeReportedPath(changedFile);
        if (!normalized || !allowed.has(normalized)) {
            return {
                code: 'unauthorized-file-touch',
                message: `Coordinator inspection found unauthorized file from agent ${agentId}: ${changedFile}`,
            };
        }
    }
    return null;
}
function inspectWorkspace(options, task) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const state = yield options.inspectWorkspace(task, options.project);
            if (!state
                || !Array.isArray(state.changedFiles)
                || !state.changedFiles.every(file => typeof file === 'string')
                || typeof state.fingerprint !== 'string'
                || !state.fingerprint) {
                return {
                    blocker: {
                        code: 'verification-failed',
                        message: `Coordinator workspace inspection returned malformed state for task ${task.id}.`,
                    },
                };
            }
            return { state };
        }
        catch (error) {
            return {
                blocker: {
                    code: 'verification-failed',
                    message: error instanceof Error ? error.message : String(error),
                },
            };
        }
    });
}
function ensureReviewerDidNotModifyWorkspace(options, task, baseline, roleLabel, reviewerId) {
    return __awaiter(this, void 0, void 0, function* () {
        const inspected = yield inspectWorkspace(options, task);
        if (inspected.blocker)
            return inspected.blocker;
        if (inspected.state.fingerprint !== baseline.fingerprint) {
            return {
                code: 'unauthorized-file-touch',
                message: `${roleLabel} ${reviewerId} modified the workspace.`,
            };
        }
        return null;
    });
}
function feedbackFrom(role, findings) {
    return findings.map(finding => (Object.assign(Object.assign({}, finding), { source: role })));
}
function blockedTask(taskId, reviewCycles, trace, blocker, implementerId) {
    return { taskId, status: 'blocked', implementerId, reviewCycles, trace, blocker };
}
function makeEnvelope(options, task, role, attempt, feedback, targetAgentId) {
    var _a, _b;
    return (0, agent_dispatch_1.generateModeBTaskEnvelope)(task, options.project, {
        coordinationId: options.coordinationId,
        role,
        attempt,
        globalConstraints: options.globalConstraints,
        repoInstructions: options.repoInstructions,
        upstreamOutputs: (_b = (_a = options.upstreamOutputs) === null || _a === void 0 ? void 0 : _a[task.id]) !== null && _b !== void 0 ? _b : [],
        priorReviewFeedback: feedback,
        targetAgentId,
    });
}
function dispatchForReport(options, task, envelope) {
    return __awaiter(this, void 0, void 0, function* () {
        let currentEnvelope = envelope;
        for (let questionCount = 0; questionCount <= MAX_ANSWERED_QUESTIONS; questionCount++) {
            let rawReport;
            try {
                rawReport = yield options.harness.dispatch(currentEnvelope);
            }
            catch (error) {
                return {
                    blocker: {
                        code: 'dispatch-failed',
                        message: error instanceof Error ? error.message : String(error),
                    },
                };
            }
            const report = validateReport(rawReport);
            if (!report) {
                return {
                    blocker: {
                        code: 'malformed-report',
                        message: `Malformed ${currentEnvelope.assignment.role} report for task ${task.id}.`,
                    },
                };
            }
            const scopeBlocker = validateFileScope(report, currentEnvelope);
            if (scopeBlocker)
                return { blocker: scopeBlocker };
            if (report.verdict !== 'question')
                return { report };
            const question = report.question;
            if (question.scopeChanging) {
                return {
                    blocker: {
                        code: 'needs-user',
                        message: question.text,
                    },
                };
            }
            const answer = yield options.answerQuestion(question, task);
            if (!answer || questionCount === MAX_ANSWERED_QUESTIONS) {
                return {
                    blocker: {
                        code: 'needs-user',
                        message: question.text,
                    },
                };
            }
            currentEnvelope = makeEnvelope(options, task, currentEnvelope.assignment.role, currentEnvelope.coordination.attempt, [{ severity: 'info', message: answer, source: 'coordinator' }], report.agentId);
        }
        return {
            blocker: { code: 'needs-user', message: `Question limit reached for task ${task.id}.` },
        };
    });
}
function runTask(options, task, usedImplementerIds) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const trace = [];
        const maxReviewCycles = Math.max(0, Math.min((_a = options.maxReviewCycles) !== null && _a !== void 0 ? _a : DEFAULT_MAX_REVIEW_CYCLES, DEFAULT_MAX_REVIEW_CYCLES));
        let reviewCycles = 0;
        let implementerId;
        let feedback = [];
        let implementationSummary = '';
        while (true) {
            const implementationEnvelope = makeEnvelope(options, task, 'implementer', reviewCycles, feedback, implementerId);
            const implementationResult = yield dispatchForReport(options, task, implementationEnvelope);
            if (implementationResult.blocker) {
                return blockedTask(task.id, reviewCycles, trace, implementationResult.blocker, implementerId);
            }
            const implementation = implementationResult.report;
            if (!implementerId && usedImplementerIds.has(implementation.agentId)) {
                return blockedTask(task.id, reviewCycles, trace, {
                    code: 'fresh-context-violation',
                    message: `Task ${task.id} reused implementer session ${implementation.agentId} from an earlier task.`,
                });
            }
            if (implementerId && implementation.agentId !== implementerId) {
                return blockedTask(task.id, reviewCycles, trace, {
                    code: 'independence-violation',
                    message: `Fix for task ${task.id} did not return to implementer ${implementerId}.`,
                }, implementerId);
            }
            implementerId = implementation.agentId;
            if (implementation.verdict !== 'pass') {
                return blockedTask(task.id, reviewCycles, trace, {
                    code: 'agent-blocked',
                    message: implementation.summary,
                }, implementerId);
            }
            if (implementation.selfReview.length === 0) {
                return blockedTask(task.id, reviewCycles, trace, {
                    code: 'malformed-report',
                    message: `Implementer ${implementerId} omitted the required self-review.`,
                }, implementerId);
            }
            implementationSummary = implementation.summary;
            const inspected = yield inspectWorkspace(options, task);
            if (inspected.blocker) {
                return blockedTask(task.id, reviewCycles, trace, inspected.blocker, implementerId);
            }
            const workspaceState = inspected.state;
            const inspectedScopeBlocker = validateInspectedFileScope(implementerId, workspaceState.changedFiles, implementationEnvelope.assignment.allowedFiles);
            if (inspectedScopeBlocker) {
                return blockedTask(task.id, reviewCycles, trace, inspectedScopeBlocker, implementerId);
            }
            trace.push(reviewCycles === 0 ? 'implementation-passed' : 'fix-passed');
            const specEnvelope = makeEnvelope(options, task, 'spec-reviewer', reviewCycles, [], undefined);
            const specResult = yield dispatchForReport(options, task, specEnvelope);
            if (specResult.blocker) {
                return blockedTask(task.id, reviewCycles, trace, specResult.blocker, implementerId);
            }
            const specReview = specResult.report;
            if (specReview.agentId === implementerId) {
                return blockedTask(task.id, reviewCycles, trace, {
                    code: 'independence-violation',
                    message: `Spec reviewer must be independent from implementer ${implementerId}.`,
                }, implementerId);
            }
            const specMutation = yield ensureReviewerDidNotModifyWorkspace(options, task, workspaceState, 'Spec reviewer', specReview.agentId);
            if (specMutation) {
                return blockedTask(task.id, reviewCycles, trace, specMutation, implementerId);
            }
            if (specReview.verdict === 'changes_requested') {
                trace.push('spec-review-rejected');
                if (reviewCycles >= maxReviewCycles) {
                    return blockedTask(task.id, reviewCycles, trace, {
                        code: 'retry-exhausted',
                        message: `Task ${task.id} still failed spec review after ${maxReviewCycles} re-review cycles; treat this as a planning defect.`,
                    }, implementerId);
                }
                feedback = feedbackFrom('spec-reviewer', specReview.findings);
                reviewCycles++;
                continue;
            }
            if (specReview.verdict !== 'pass') {
                return blockedTask(task.id, reviewCycles, trace, {
                    code: 'agent-blocked',
                    message: specReview.summary,
                }, implementerId);
            }
            trace.push('spec-review-passed');
            const qualityEnvelope = makeEnvelope(options, task, 'quality-reviewer', reviewCycles, [], undefined);
            const qualityResult = yield dispatchForReport(options, task, qualityEnvelope);
            if (qualityResult.blocker) {
                return blockedTask(task.id, reviewCycles, trace, qualityResult.blocker, implementerId);
            }
            const qualityReview = qualityResult.report;
            if (qualityReview.agentId === implementerId) {
                return blockedTask(task.id, reviewCycles, trace, {
                    code: 'independence-violation',
                    message: `Quality reviewer must be independent from implementer ${implementerId}.`,
                }, implementerId);
            }
            const qualityMutation = yield ensureReviewerDidNotModifyWorkspace(options, task, workspaceState, 'Quality reviewer', qualityReview.agentId);
            if (qualityMutation) {
                return blockedTask(task.id, reviewCycles, trace, qualityMutation, implementerId);
            }
            if (qualityReview.verdict === 'changes_requested') {
                trace.push('quality-review-rejected');
                if (reviewCycles >= maxReviewCycles) {
                    return blockedTask(task.id, reviewCycles, trace, {
                        code: 'retry-exhausted',
                        message: `Task ${task.id} still failed quality review after ${maxReviewCycles} re-review cycles; treat this as a planning defect.`,
                    }, implementerId);
                }
                feedback = feedbackFrom('quality-reviewer', qualityReview.findings);
                reviewCycles++;
                continue;
            }
            if (qualityReview.verdict !== 'pass') {
                return blockedTask(task.id, reviewCycles, trace, {
                    code: 'agent-blocked',
                    message: qualityReview.summary,
                }, implementerId);
            }
            trace.push('quality-review-passed');
            let verification;
            try {
                verification = yield options.verify(task, options.project);
            }
            catch (error) {
                return blockedTask(task.id, reviewCycles, trace, {
                    code: 'verification-failed',
                    message: error instanceof Error ? error.message : String(error),
                }, implementerId);
            }
            if (!verification.passed) {
                trace.push('verification-failed');
                return blockedTask(task.id, reviewCycles, trace, {
                    code: 'verification-failed',
                    message: verification.evidence,
                }, implementerId);
            }
            trace.push('verification-passed', 'completed');
            return {
                taskId: task.id,
                status: 'completed',
                implementerId,
                reviewCycles,
                trace,
                summary: implementationSummary,
                verification,
            };
        }
    });
}
function orchestrateModeB(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const tasks = [];
        const usedImplementerIds = new Set();
        for (const task of options.tasks) {
            const result = yield runTask(options, task, usedImplementerIds);
            tasks.push(result);
            if (result.implementerId)
                usedImplementerIds.add(result.implementerId);
            if (result.status === 'blocked')
                return { status: 'blocked', tasks };
        }
        return { status: 'completed', tasks };
    });
}
function extractReportObject(output) {
    const parsed = parseJsonReport(output);
    return isRecord(parsed) ? parsed : null;
}
/** Adapts the existing spawn backend to fresh sessions and same-session fixes. */
class AgentBackendModeBHarness {
    constructor(backend, execOptions = {}) {
        var _a;
        this.backend = backend;
        this.execOptions = execOptions;
        if (!((_a = backend.capabilities) === null || _a === void 0 ? void 0 : _a.isolatedSessions) || !backend.capabilities.resumableSessions) {
            throw new Error(`Agent backend ${backend.name} does not support isolated resumable sessions; use Mode F or Mode A.`);
        }
    }
    dispatch(envelope) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, e_1, _b, _c;
            var _d, _e, _f, _g;
            const session = yield this.backend.execute(JSON.stringify(envelope, null, 2), Object.assign(Object.assign({}, this.execOptions), { cwd: envelope.execution.workspace, resumeSessionId: envelope.coordination.targetAgentId }));
            const streamedText = [];
            let streamedSessionId;
            try {
                for (var _h = true, _j = __asyncValues(session.messages), _k; _k = yield _j.next(), _a = _k.done, !_a; _h = true) {
                    _c = _k.value;
                    _h = false;
                    const message = _c;
                    if (message.type === 'text') {
                        streamedText.push(message.content);
                        if (message.sessionId)
                            streamedSessionId = message.sessionId;
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (!_h && !_a && (_b = _j.return)) yield _b.call(_j);
                }
                finally { if (e_1) throw e_1.error; }
            }
            const result = yield session.result;
            if (result.status !== 'completed') {
                return {
                    agentId: (_e = (_d = result.sessionId) !== null && _d !== void 0 ? _d : envelope.coordination.targetAgentId) !== null && _e !== void 0 ? _e : `${this.backend.name}-${crypto_1.default.randomUUID()}`,
                    verdict: 'block',
                    summary: (_f = result.error) !== null && _f !== void 0 ? _f : `Agent backend ended with status ${result.status}.`,
                    modifiedFiles: [],
                    findings: [],
                    selfReview: [],
                };
            }
            const sessionId = (_g = result.sessionId) !== null && _g !== void 0 ? _g : streamedSessionId;
            if (!sessionId) {
                return {
                    agentId: `${this.backend.name}-${crypto_1.default.randomUUID()}`,
                    verdict: 'block',
                    summary: `Agent backend ${this.backend.name} did not return a resumable session ID.`,
                    modifiedFiles: [],
                    findings: [],
                    selfReview: [],
                };
            }
            const output = streamedText.join('') || result.output;
            const report = extractReportObject(output);
            if (!report)
                return output;
            return Object.assign(Object.assign({}, report), { agentId: sessionId });
        });
    }
}
exports.AgentBackendModeBHarness = AgentBackendModeBHarness;
function createAgentBackendModeBHarness(backendName, execOptions = {}) {
    return new AgentBackendModeBHarness((0, factory_1.getBackend)(backendName), execOptions);
}
