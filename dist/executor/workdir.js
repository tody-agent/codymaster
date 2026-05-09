"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareWorkdir = prepareWorkdir;
exports.writeGcMeta = writeGcMeta;
exports.reuseWorkdir = reuseWorkdir;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const WORKSPACES_ROOT = path_1.default.join(os_1.default.homedir(), '.cm', 'workspaces');
function prepareWorkdir(projectShort, taskShort) {
    const workdir = path_1.default.join(WORKSPACES_ROOT, projectShort, taskShort, 'workdir');
    fs_1.default.mkdirSync(workdir, { recursive: true });
    const outputDir = path_1.default.join(WORKSPACES_ROOT, projectShort, taskShort, 'output');
    const logsDir = path_1.default.join(WORKSPACES_ROOT, projectShort, taskShort, 'logs');
    fs_1.default.mkdirSync(outputDir, { recursive: true });
    fs_1.default.mkdirSync(logsDir, { recursive: true });
    return workdir;
}
function writeGcMeta(projectShort, taskShort, meta) {
    const metaPath = path_1.default.join(WORKSPACES_ROOT, projectShort, taskShort, '.gc_meta.json');
    fs_1.default.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
}
function reuseWorkdir(existingPath) {
    if (!fs_1.default.existsSync(existingPath)) {
        throw new Error(`Workdir not found: ${existingPath}`);
    }
    return existingPath;
}
