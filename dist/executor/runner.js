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
Object.defineProperty(exports, "__esModule", { value: true });
exports.runTask = runTask;
const workdir_1 = require("./workdir");
function runTask(opts) {
    return __awaiter(this, void 0, void 0, function* () {
        const { backend, taskId, projectId, prompt, execOpts, eventBus, priorWorkdir, pinnedSessionId, } = opts;
        const projectShort = projectId.slice(0, 8);
        const taskShort = taskId.slice(0, 8);
        const workdir = priorWorkdir !== null && priorWorkdir !== void 0 ? priorWorkdir : (0, workdir_1.prepareWorkdir)(projectShort, taskShort);
        const resolvedOpts = Object.assign(Object.assign({}, execOpts), { cwd: workdir, resumeSessionId: pinnedSessionId !== null && pinnedSessionId !== void 0 ? pinnedSessionId : execOpts.resumeSessionId });
        const session = yield backend.execute(prompt, resolvedOpts);
        let lastSessionId = pinnedSessionId;
        const messageLoop = (() => __awaiter(this, void 0, void 0, function* () {
            var _a, e_1, _b, _c;
            try {
                for (var _d = true, _e = __asyncValues(session.messages), _f; _f = yield _e.next(), _a = _f.done, !_a; _d = true) {
                    _c = _f.value;
                    _d = false;
                    const msg = _c;
                    emitAgentMessage(eventBus, taskId, projectId, msg);
                    if (msg.type === 'text' && msg.sessionId) {
                        lastSessionId = msg.sessionId;
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = _e.return)) yield _b.call(_e);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }))();
        const [result] = yield Promise.all([session.result, messageLoop]);
        if (lastSessionId && !result.sessionId) {
            result.sessionId = lastSessionId;
        }
        (0, workdir_1.writeGcMeta)(projectShort, taskShort, {
            taskId,
            projectId,
            completedAt: new Date().toISOString(),
        });
        return result;
    });
}
function emitAgentMessage(eventBus, taskId, projectId, msg) {
    eventBus.emitTask({
        type: 'task.message',
        taskId,
        projectId,
        data: { message: msg },
    });
}
