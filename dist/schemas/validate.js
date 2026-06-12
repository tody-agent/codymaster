"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBody = validateBody;
const ajv_1 = __importDefault(require("ajv"));
const ajv = new ajv_1.default();
function validateBody(schema) {
    const validate = ajv.compile(schema);
    return (req, res, next) => {
        if (!validate(req.body)) {
            res.status(400).json({ error: 'Validation failed', details: validate.errors });
            return;
        }
        next();
    };
}
