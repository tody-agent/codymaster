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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.defineSimplePlatform = defineSimplePlatform;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const paths_1 = require("../paths");
const copy_1 = require("../copy");
function defineSimplePlatform(cfg) {
    return {
        id: cfg.id,
        name: cfg.name,
        emoji: cfg.emoji,
        detect() {
            for (const p of cfg.detectPaths) {
                const expanded = p.startsWith('~') ? path.join((0, paths_1.homeDir)(), p.slice(1)) : p;
                if (fs.existsSync(expanded))
                    return { installed: true, detail: p };
            }
            if (cfg.detectCommand) {
                const r = require('child_process').spawnSync(cfg.detectCommand, ['--version'], { stdio: 'pipe' });
                if (r.status === 0)
                    return { installed: true, detail: `${cfg.detectCommand} on PATH` };
            }
            return { installed: false };
        },
        install(opts) {
            return __awaiter(this, void 0, void 0, function* () {
                const target = cfg.targetPath(opts);
                const { installed, skipped } = (0, copy_1.copySkills)(target, cfg.format, opts);
                const hints = typeof cfg.postInstallHints === 'function'
                    ? cfg.postInstallHints(target)
                    : cfg.postInstallHints || [];
                return {
                    platform: cfg.id,
                    installed,
                    skipped,
                    targetPath: target,
                    postInstallHints: hints,
                };
            });
        },
    };
}
