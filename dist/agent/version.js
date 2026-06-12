"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectVersion = detectVersion;
exports.checkMinVersion = checkMinVersion;
const child_process_1 = require("child_process");
function detectVersion(command) {
    try {
        return (0, child_process_1.execFileSync)(command, ['--version'], { encoding: 'utf8', timeout: 5000 }).trim();
    }
    catch (_a) {
        return 'unknown';
    }
}
function checkMinVersion(version, minVersion) {
    const parse = (v) => v.split('.').map(Number);
    const a = parse(version);
    const b = parse(minVersion);
    for (let i = 0; i < 3; i++) {
        if ((a[i] || 0) > (b[i] || 0))
            return true;
        if ((a[i] || 0) < (b[i] || 0))
            return false;
    }
    return true;
}
