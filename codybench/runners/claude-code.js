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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSuite = runSuite;
const crypto_1 = __importDefault(require("crypto"));
function runSuite(suite, config, projectPath) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const evalConfig = config.evals.find(e => e.id === suite.id);
        const repeat = (_a = evalConfig === null || evalConfig === void 0 ? void 0 : evalConfig.repeat) !== null && _a !== void 0 ? _a : 3;
        const results = [];
        for (let i = 0; i < repeat; i++) {
            const runId = `${suite.id}-run${i + 1}-${crypto_1.default.randomUUID().slice(0, 8)}`;
            // Run with CodyMaster
            results.push(yield suite.run({ projectPath, withCodyMaster: true, runId: `${runId}-cm` }));
            // Run without CodyMaster (baseline)
            results.push(yield suite.run({ projectPath, withCodyMaster: false, runId: `${runId}-base` }));
        }
        return results;
    });
}
