"use strict";
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
exports.detectPlatforms = detectPlatforms;
exports.listPlatforms = listPlatforms;
exports.installToPlatform = installToPlatform;
exports.installToMany = installToMany;
const platforms_1 = require("./platforms");
function detectPlatforms() {
    return platforms_1.PLATFORMS.map((platform) => {
        const r = platform.detect();
        return { platform, installed: r.installed, detail: r.detail };
    });
}
function listPlatforms() {
    return [...platforms_1.PLATFORMS];
}
function installToPlatform(id, opts) {
    return __awaiter(this, void 0, void 0, function* () {
        const p = (0, platforms_1.getPlatform)(id);
        if (!p)
            throw new Error(`Unknown platform: ${id}. Run 'cm install --list' to see options.`);
        return p.install(opts);
    });
}
function installToMany(ids, opts) {
    return __awaiter(this, void 0, void 0, function* () {
        const results = [];
        for (const id of ids) {
            results.push(yield installToPlatform(id, opts));
        }
        return results;
    });
}
