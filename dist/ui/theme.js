"use strict";
/**
 * 🎨 CodyMaster Theme — Centralized color palette & styling
 * Warm amber/orange accent system for the Hamster Shell
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ICONS = exports.STATUS = exports.PRI = exports.COL = exports.info = exports.warning = exports.error = exports.success = exports.text = exports.muted = exports.dim = exports.brandBg = exports.brandBold = exports.brand = exports.COLORS = void 0;
const chalk_1 = __importDefault(require("chalk"));
// ─── Brand Colors ──────────────────────────────────────────────────────────
exports.COLORS = {
    // Primary brand
    primary: '#F59E0B', // Amber/orange
    primaryDim: '#D97706',
    primaryBright: '#FBBF24',
    // Backgrounds
    bg: '#1a1b26',
    bgPanel: '#24283b',
    // Status
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
    // Task columns
    backlog: '#6B7280',
    inProgress: '#3B82F6',
    review: '#F59E0B',
    done: '#10B981',
    // Priority
    low: '#10B981',
    medium: '#F59E0B',
    high: '#EF4444',
    urgent: '#A855F7',
    // Text
    text: '#E5E7EB',
    textDim: '#6B7280',
    textMuted: '#4B5563',
};
// ─── Chalk Helpers ─────────────────────────────────────────────────────────
exports.brand = chalk_1.default.hex(exports.COLORS.primary);
exports.brandBold = chalk_1.default.hex(exports.COLORS.primary).bold;
exports.brandBg = chalk_1.default.bgHex(exports.COLORS.primary).black;
exports.dim = chalk_1.default.hex(exports.COLORS.textDim);
exports.muted = chalk_1.default.hex(exports.COLORS.textMuted);
exports.text = chalk_1.default.hex(exports.COLORS.text);
exports.success = chalk_1.default.hex(exports.COLORS.success);
exports.error = chalk_1.default.hex(exports.COLORS.error);
exports.warning = chalk_1.default.hex(exports.COLORS.warning);
exports.info = chalk_1.default.hex(exports.COLORS.info);
// Column colors
exports.COL = {
    backlog: chalk_1.default.hex(exports.COLORS.backlog),
    'in-progress': chalk_1.default.hex(exports.COLORS.inProgress),
    review: chalk_1.default.hex(exports.COLORS.review),
    done: chalk_1.default.hex(exports.COLORS.done),
};
// Priority colors
exports.PRI = {
    low: chalk_1.default.hex(exports.COLORS.low),
    medium: chalk_1.default.hex(exports.COLORS.medium),
    high: chalk_1.default.hex(exports.COLORS.high),
    urgent: chalk_1.default.hex(exports.COLORS.urgent),
};
// Status colors
exports.STATUS = {
    success: chalk_1.default.hex(exports.COLORS.success),
    failed: chalk_1.default.hex(exports.COLORS.error),
    pending: chalk_1.default.hex(exports.COLORS.warning),
    running: chalk_1.default.hex(exports.COLORS.inProgress),
    rolled_back: chalk_1.default.hex(exports.COLORS.urgent),
};
// ─── Icons ─────────────────────────────────────────────────────────────────
exports.ICONS = {
    // Status
    dot: '●',
    dotEmpty: '○',
    check: '✓',
    cross: '✗',
    arrow: '›',
    arrowRight: '→',
    // Categories
    task: '📋',
    project: '📦',
    deploy: '🚀',
    skill: '🧩',
    dashboard: '📊',
    history: '📜',
    settings: '⚙️',
    // Status
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    // Hamster
    hamster: '🐹',
    fire: '🔥',
    star: '⭐',
    trophy: '🏆',
    sparkle: '✨',
    party: '🎉',
    muscle: '💪',
    rocket: '🚀',
};
