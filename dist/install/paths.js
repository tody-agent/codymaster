"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.findCmRoot = findCmRoot;
exports.homeDir = homeDir;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Locate the repository / install root that contains `skills/`.
 * Resolves in this order:
 *   1. Env var CM_HOME (explicit override)
 *   2. Walk up from __dirname looking for skills/ + package.json
 *   3. ~/.cody-master (legacy bash installer cache)
 */
function findCmRoot() {
    if (process.env.CM_HOME && fs.existsSync(path.join(process.env.CM_HOME, 'skills'))) {
        return process.env.CM_HOME;
    }
    let dir = __dirname;
    for (let i = 0; i < 6; i++) {
        if (fs.existsSync(path.join(dir, 'skills')) &&
            fs.existsSync(path.join(dir, 'package.json'))) {
            return dir;
        }
        const parent = path.dirname(dir);
        if (parent === dir)
            break;
        dir = parent;
    }
    const home = process.env.HOME || process.env.USERPROFILE || '';
    const fallback = path.join(home, '.cody-master');
    if (fs.existsSync(path.join(fallback, 'skills')))
        return fallback;
    throw new Error('Cannot locate CodyMaster skills directory. Set CM_HOME or run from the repo root.');
}
function homeDir() {
    return process.env.HOME || process.env.USERPROFILE || '';
}
