"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_PORT = exports.PID_FILE = exports.DATA_FILE = exports.DATA_DIR = void 0;
exports.ensureDataDir = ensureDataDir;
exports.loadData = loadData;
exports.saveData = saveData;
exports.logActivity = logActivity;
exports.findProjectByNameOrId = findProjectByNameOrId;
exports.findTaskByIdPrefix = findTaskByIdPrefix;
exports.shortId = shortId;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const crypto_1 = __importDefault(require("crypto"));
// ─── Constants ──────────────────────────────────────────────────────────────
exports.DATA_DIR = path_1.default.join(os_1.default.homedir(), '.codymaster');
exports.DATA_FILE = path_1.default.join(exports.DATA_DIR, 'kanban.json');
exports.PID_FILE = path_1.default.join(exports.DATA_DIR, 'dashboard.pid');
exports.DEFAULT_PORT = 6969;
// ─── Persistence ────────────────────────────────────────────────────────────
function ensureDataDir() {
    if (!fs_1.default.existsSync(exports.DATA_DIR)) {
        fs_1.default.mkdirSync(exports.DATA_DIR, { recursive: true });
    }
}
const EMPTY_DATA = { projects: [], tasks: [], activities: [], deployments: [], changelog: [], chainExecutions: [], version: 4 };
function loadData() {
    ensureDataDir();
    if (!fs_1.default.existsSync(exports.DATA_FILE)) {
        fs_1.default.writeFileSync(exports.DATA_FILE, JSON.stringify(EMPTY_DATA, null, 2));
        return Object.assign({}, EMPTY_DATA);
    }
    try {
        const raw = fs_1.default.readFileSync(exports.DATA_FILE, 'utf-8');
        const data = JSON.parse(raw);
        let needsSave = false;
        // Ensure arrays exist
        if (!data.projects) {
            data.projects = [];
            needsSave = true;
        }
        if (!data.activities) {
            data.activities = [];
            needsSave = true;
        }
        if (!data.deployments) {
            data.deployments = [];
            needsSave = true;
        }
        if (!data.changelog) {
            data.changelog = [];
            needsSave = true;
        }
        // v1/v2 → v3 migration
        if (!data.version || data.version < 3) {
            // Migrate orphan tasks (from v1)
            if (data.tasks && data.tasks.length > 0 && data.projects.length === 0) {
                const defaultProject = {
                    id: crypto_1.default.randomUUID(), name: 'Default Project',
                    path: process.cwd(), agents: [], createdAt: new Date().toISOString(),
                };
                data.projects.push(defaultProject);
                data.tasks.forEach(t => {
                    if (!t.projectId)
                        t.projectId = defaultProject.id;
                    if (!t.agent)
                        t.agent = '';
                    if (!t.skill)
                        t.skill = '';
                });
            }
            data.version = 3;
            needsSave = true;
        }
        // v3 → v4 migration (add chainExecutions)
        if (data.version < 4) {
            if (!data.chainExecutions)
                data.chainExecutions = [];
            data.version = 4;
            needsSave = true;
        }
        if (needsSave)
            fs_1.default.writeFileSync(exports.DATA_FILE, JSON.stringify(data, null, 2));
        return data;
    }
    catch (_a) {
        return Object.assign({}, EMPTY_DATA);
    }
}
function saveData(data) {
    ensureDataDir();
    fs_1.default.writeFileSync(exports.DATA_FILE, JSON.stringify(data, null, 2));
}
// ─── Activity Logger ────────────────────────────────────────────────────────
function logActivity(data, type, message, projectId = '', agent = '', metadata = {}) {
    data.activities.unshift({
        id: crypto_1.default.randomUUID(),
        projectId,
        type,
        message,
        agent,
        metadata,
        createdAt: new Date().toISOString(),
    });
    // Keep max 500 entries
    if (data.activities.length > 500) {
        data.activities = data.activities.slice(0, 500);
    }
}
// ─── Helpers ────────────────────────────────────────────────────────────────
function findProjectByNameOrId(data, query) {
    return data.projects.find(p => p.id === query || p.id.startsWith(query) || p.name.toLowerCase() === query.toLowerCase());
}
function findTaskByIdPrefix(data, prefix) {
    return data.tasks.find(t => t.id === prefix || t.id.startsWith(prefix));
}
function shortId(id) {
    return id.substring(0, 8);
}
