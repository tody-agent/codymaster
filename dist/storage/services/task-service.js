"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTaskService = createTaskService;
const task_repo_1 = require("../repos/task-repo");
const message_repo_1 = require("../repos/message-repo");
// ─── Service ────────────────────────────────────────────────────────────────
function createTaskService(db) {
    const taskRepo = (0, task_repo_1.createTaskRepo)(db);
    const messageRepo = (0, message_repo_1.createMessageRepo)(db);
    // Event stubs — will connect to EventBus in Wave 2D
    const listeners = {};
    return {
        create(input) {
            var _a, _b, _c, _d;
            if (!((_a = input.id) === null || _a === void 0 ? void 0 : _a.trim()))
                throw new Error('Task id is required');
            if (!((_b = input.project_id) === null || _b === void 0 ? void 0 : _b.trim()))
                throw new Error('Task project_id is required');
            if (!((_c = input.title) === null || _c === void 0 ? void 0 : _c.trim()))
                throw new Error('Task title is required');
            const task = taskRepo.create(input);
            (_d = listeners.onCreated) === null || _d === void 0 ? void 0 : _d.call(listeners, { task });
            return task;
        },
        getById(id) {
            return taskRepo.getById(id);
        },
        getByProject(projectId) {
            return taskRepo.getByProject(projectId);
        },
        getByProjectAndStatus(projectId, status) {
            return taskRepo.getByProjectAndStatus(projectId, status);
        },
        getByStatus(status) {
            return taskRepo.getByStatus(status);
        },
        getByConversationId(conversationId) {
            return taskRepo.getByConversationId(conversationId);
        },
        transitionTo(id, newStatus) {
            var _a;
            const task = taskRepo.getById(id);
            if (!task)
                return null;
            if (!(0, task_repo_1.isValidTransition)(task.status, newStatus)) {
                throw new Error(`Invalid transition: ${task.status} → ${newStatus} for task ${id}`);
            }
            const updated = taskRepo.transitionTo(id, newStatus);
            if (updated) {
                (_a = listeners.onTransitioned) === null || _a === void 0 ? void 0 : _a.call(listeners, { task: updated, from: task.status, to: newStatus });
            }
            return updated;
        },
        update(id, fields) {
            var _a;
            const updated = taskRepo.update(id, fields);
            if (updated) {
                (_a = listeners.onUpdated) === null || _a === void 0 ? void 0 : _a.call(listeners, { task: updated });
            }
            return updated;
        },
        delete(id) {
            var _a;
            const task = taskRepo.getById(id);
            if (!task)
                return false;
            const deleted = taskRepo.delete(id);
            if (deleted) {
                (_a = listeners.onDeleted) === null || _a === void 0 ? void 0 : _a.call(listeners, { taskId: id, projectId: task.project_id });
            }
            return deleted;
        },
        // Messages
        addMessage(input) {
            return messageRepo.create(input);
        },
        getMessages(taskId, limit = 100, offset = 0) {
            return messageRepo.getByTask(taskId, limit, offset);
        },
        countMessages(taskId) {
            return messageRepo.countByTask(taskId);
        },
        // Event registration stubs (Wave 2D)
        onCreated(handler) {
            listeners.onCreated = handler;
        },
        onTransitioned(handler) {
            listeners.onTransitioned = handler;
        },
        onUpdated(handler) {
            listeners.onUpdated = handler;
        },
        onDeleted(handler) {
            listeners.onDeleted = handler;
        },
    };
}
