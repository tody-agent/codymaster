"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startGcLoop = startGcLoop;
exports.gcPass = gcPass;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const WORKSPACES_ROOT = path_1.default.join(os_1.default.homedir(), '.cm', 'workspaces');
const DEFAULT_GC_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const DEFAULT_GC_ORPHAN_TTL_MS = 72 * 60 * 60 * 1000; // 72h
const GC_INTERVAL_MS = 60 * 60 * 1000; // 1h
function startGcLoop() {
    return setInterval(() => {
        gcPass();
    }, GC_INTERVAL_MS);
}
function gcPass() {
    let removed = 0;
    let errors = 0;
    if (!fs_1.default.existsSync(WORKSPACES_ROOT)) {
        return { removed, errors };
    }
    const now = Date.now();
    try {
        const projects = fs_1.default.readdirSync(WORKSPACES_ROOT);
        for (const project of projects) {
            const projectDir = path_1.default.join(WORKSPACES_ROOT, project);
            if (!fs_1.default.statSync(projectDir).isDirectory())
                continue;
            try {
                const tasks = fs_1.default.readdirSync(projectDir);
                for (const task of tasks) {
                    const taskDir = path_1.default.join(projectDir, task);
                    if (!fs_1.default.statSync(taskDir).isDirectory())
                        continue;
                    const gcMetaPath = path_1.default.join(taskDir, '.gc_meta.json');
                    try {
                        if (fs_1.default.existsSync(gcMetaPath)) {
                            const meta = JSON.parse(fs_1.default.readFileSync(gcMetaPath, 'utf-8'));
                            if (meta.completedAt) {
                                const completedTime = new Date(meta.completedAt).getTime();
                                if (now - completedTime > DEFAULT_GC_TTL_MS) {
                                    fs_1.default.rmSync(taskDir, { recursive: true, force: true });
                                    removed++;
                                }
                            }
                        }
                        else {
                            const stat = fs_1.default.statSync(taskDir);
                            const age = now - stat.mtimeMs;
                            if (age > DEFAULT_GC_ORPHAN_TTL_MS) {
                                fs_1.default.rmSync(taskDir, { recursive: true, force: true });
                                removed++;
                            }
                        }
                    }
                    catch (_a) {
                        errors++;
                    }
                }
            }
            catch (_b) {
                errors++;
            }
        }
    }
    catch (_c) {
        errors++;
    }
    return { removed, errors };
}
