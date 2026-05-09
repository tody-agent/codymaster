"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProjectService = createProjectService;
const project_repo_1 = require("../repos/project-repo");
// ─── Service ────────────────────────────────────────────────────────────────
function createProjectService(db) {
    const repo = (0, project_repo_1.createProjectRepo)(db);
    // Event stubs — will connect to EventBus in Wave 2D
    const listeners = {};
    return {
        create(input) {
            var _a, _b, _c;
            if (!((_a = input.id) === null || _a === void 0 ? void 0 : _a.trim()))
                throw new Error('Project id is required');
            if (!((_b = input.name) === null || _b === void 0 ? void 0 : _b.trim()))
                throw new Error('Project name is required');
            const existing = repo.getById(input.id);
            if (existing)
                throw new Error(`Project ${input.id} already exists`);
            const project = repo.create(input);
            (_c = listeners.onCreated) === null || _c === void 0 ? void 0 : _c.call(listeners, { project });
            return project;
        },
        getById(id) {
            return repo.getById(id);
        },
        getAll() {
            return repo.getAll();
        },
        update(id, fields) {
            return repo.update(id, fields);
        },
        delete(id) {
            var _a;
            const deleted = repo.delete(id);
            if (deleted) {
                (_a = listeners.onDeleted) === null || _a === void 0 ? void 0 : _a.call(listeners, { projectId: id });
            }
            return deleted;
        },
        // Event registration stubs (Wave 2D)
        onCreated(handler) {
            listeners.onCreated = handler;
        },
        onDeleted(handler) {
            listeners.onDeleted = handler;
        },
    };
}
