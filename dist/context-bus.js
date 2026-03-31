"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initBus = initBus;
exports.readBus = readBus;
exports.writeBus = writeBus;
exports.updateBusStep = updateBusStep;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// ─── Constants ──────────────────────────────────────────────────────────────
const CM_DIR = '.cm';
const BUS_FILE = 'context-bus.json';
function getBusPath(projectPath) {
    return path_1.default.join(projectPath, CM_DIR, BUS_FILE);
}
// ─── Init ───────────────────────────────────────────────────────────────────
function initBus(projectPath, pipeline, sessionId) {
    const now = new Date().toISOString();
    const bus = {
        version: '1.0',
        session_id: sessionId,
        pipeline,
        current_step: '',
        started_at: now,
        updated_at: now,
        shared_context: {},
        resource_state: {
            skeleton_generated: null,
            learnings_indexed: null,
            codegraph_indexed: null,
            qmd_synced: null,
        },
    };
    writeBus(projectPath, bus);
    return bus;
}
// ─── Read ───────────────────────────────────────────────────────────────────
function readBus(projectPath) {
    const busPath = getBusPath(projectPath);
    if (!fs_1.default.existsSync(busPath))
        return null;
    try {
        return JSON.parse(fs_1.default.readFileSync(busPath, 'utf-8'));
    }
    catch (_a) {
        return null;
    }
}
// ─── Write ──────────────────────────────────────────────────────────────────
function writeBus(projectPath, bus) {
    const busPath = getBusPath(projectPath);
    const dir = path_1.default.dirname(busPath);
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir, { recursive: true });
    }
    fs_1.default.writeFileSync(busPath, JSON.stringify(bus, null, 2), 'utf-8');
}
// ─── Update Step ────────────────────────────────────────────────────────────
function updateBusStep(projectPath, skill, output) {
    const bus = readBus(projectPath);
    if (!bus) {
        throw new Error(`Context bus not initialized at ${projectPath}. Call initBus() first.`);
    }
    bus.current_step = skill;
    bus.updated_at = new Date().toISOString();
    bus.shared_context[skill] = output;
    writeBus(projectPath, bus);
}
