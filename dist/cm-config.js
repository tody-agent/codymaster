"use strict";
/**
 * Shared loader for `.cm/config.yaml` — storage, browse daemon, guardian, canary.
 * Uses the `yaml` package; unknown keys are ignored.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadCmConfig = loadCmConfig;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const yaml_1 = require("yaml");
function asRecord(v) {
    if (!v || typeof v !== 'object' || Array.isArray(v))
        return null;
    return v;
}
function str(v) {
    return typeof v === 'string' && v.length > 0 ? v : undefined;
}
/** Scalars only (e.g. storage.backend may be unquoted in YAML). */
function scalarStr(v) {
    if (v === null || v === undefined)
        return undefined;
    if (typeof v === 'string')
        return v.trim() || undefined;
    if (typeof v === 'number' || typeof v === 'boolean')
        return String(v);
    return undefined;
}
function num(v) {
    if (typeof v === 'number' && Number.isFinite(v))
        return v;
    if (typeof v === 'string' && v.trim() && !Number.isNaN(Number(v)))
        return Number(v);
    return undefined;
}
function strArray(v) {
    if (Array.isArray(v)) {
        const a = v.map((x) => String(x).trim()).filter(Boolean);
        return a.length ? a : undefined;
    }
    if (typeof v === 'string') {
        const a = v.split(',').map((s) => s.trim()).filter(Boolean);
        return a.length ? a : undefined;
    }
    return undefined;
}
function loadCmConfig(projectPath) {
    const configPath = path_1.default.join(projectPath, '.cm', 'config.yaml');
    if (!fs_1.default.existsSync(configPath))
        return {};
    try {
        const doc = (0, yaml_1.parseDocument)(fs_1.default.readFileSync(configPath, 'utf8'));
        const root = doc.toJSON();
        const o = asRecord(root);
        if (!o)
            return {};
        const out = {};
        const storageRaw = asRecord(o.storage);
        if (storageRaw) {
            out.storage = { backend: scalarStr(storageRaw.backend) };
        }
        const browseRaw = asRecord(o.browse);
        if (browseRaw) {
            out.browse = {
                port: num(browseRaw.port),
                host: str(browseRaw.host),
                token: str(browseRaw.token),
            };
        }
        const guardianRaw = asRecord(o.guardian);
        if (guardianRaw) {
            out.guardian = {
                whitelist_prefixes: strArray(guardianRaw.whitelist_prefixes),
                freeze_roots: strArray(guardianRaw.freeze_roots),
            };
        }
        const canaryRaw = asRecord(o.canary);
        if (canaryRaw) {
            out.canary = {
                browse_port: num(canaryRaw.browse_port),
                token: str(canaryRaw.token),
            };
        }
        return out;
    }
    catch (_a) {
        return {};
    }
}
