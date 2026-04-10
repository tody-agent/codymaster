"use strict";
/**
 * Runtime safety patterns for `cm guardian` (careful / freeze / guard style).
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkShellCommand = checkShellCommand;
exports.normalizeRoots = normalizeRoots;
exports.isPathUnderRoots = isPathUnderRoots;
exports.appendGuardianLog = appendGuardianLog;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const DESTRUCTIVE_PATTERNS = [
    /\brm\s+(-[rfFR]+\s*)+.*(\/\s*$|\/\*|\s\/\s)/,
    /\brm\s+-rf\b/i,
    /\bmkfs\./,
    /\bdd\s+if=/,
    />\s*\/dev\/sd/,
    /\bDROP\s+DATABASE\b/i,
    /\bDROP\s+TABLE\b/i,
    /\bTRUNCATE\s+TABLE\b/i,
    /\bgit\s+push\s+.*--force/i,
    /\bgit\s+push\s+-f\b/,
    /\bgit\s+reset\s+--hard\b/,
    /\bgit\s+clean\s+-fdx\b/,
    /\bcurl\s+.*\|\s*(ba)?sh\b/i,
    /\bwget\s+.*\|\s*(ba)?sh\b/i,
    /\bmysqladmin\s+drop\b/i,
    /\bredis-cli\s+.*FLUSHALL/i,
];
const DEFAULT_WHITELIST_PREFIXES = ['npm run build', 'npm test', 'npm run test', 'npx vitest'];
function checkShellCommand(cmd, options) {
    var _a;
    const trimmed = cmd.trim();
    if (!trimmed)
        return { safe: true };
    const whitelist = [...DEFAULT_WHITELIST_PREFIXES, ...((_a = options === null || options === void 0 ? void 0 : options.extraWhitelist) !== null && _a !== void 0 ? _a : [])];
    for (const w of whitelist) {
        if (trimmed.startsWith(w))
            return { safe: true };
    }
    for (const re of DESTRUCTIVE_PATTERNS) {
        if (re.test(trimmed)) {
            return {
                safe: false,
                reason: 'Command matches a destructive pattern. Confirm intent or use a safer alternative.',
                matchedPattern: re.source,
            };
        }
    }
    return { safe: true };
}
function normalizeRoots(cwd, roots) {
    return roots.map((r) => path_1.default.resolve(cwd, r));
}
/** Returns true if `targetPath` is under one of `roots` (after resolve). */
function isPathUnderRoots(targetPath, roots) {
    const abs = path_1.default.resolve(targetPath);
    for (const root of roots) {
        const r = path_1.default.resolve(root);
        if (abs === r || abs.startsWith(r + path_1.default.sep))
            return true;
    }
    return false;
}
function appendGuardianLog(projectPath, line) {
    const dir = path_1.default.join(projectPath, '.cm');
    if (!fs_1.default.existsSync(dir))
        fs_1.default.mkdirSync(dir, { recursive: true });
    const logPath = path_1.default.join(dir, 'guardian.log');
    fs_1.default.appendFileSync(logPath, `[${new Date().toISOString()}] ${line}\n`, 'utf8');
}
