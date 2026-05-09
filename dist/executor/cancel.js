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
exports.cancelTask = cancelTask;
const child_process_1 = require("child_process");
const os_1 = __importDefault(require("os"));
function cancelTask(taskId, pgid) {
    return __awaiter(this, void 0, void 0, function* () {
        if (os_1.default.platform() === 'win32') {
            (0, child_process_1.execFileSync)('taskkill', ['/PID', String(pgid), '/T', '/F'], { timeout: 10000 });
        }
        else {
            process.kill(-pgid, 'SIGTERM');
            yield new Promise(resolve => setTimeout(resolve, 5000));
            try {
                process.kill(-pgid, 'SIGKILL');
            }
            catch (_a) {
                // already dead
            }
        }
    });
}
