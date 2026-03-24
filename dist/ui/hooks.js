"use strict";
/**
 * 🪝 Hook Engine — Trigger → Action → Variable Reward → Investment
 * Based on Nir Eyal's Hook Model for habit-forming CLI experience
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadProfile = loadProfile;
exports.saveProfile = saveProfile;
exports.isFirstRun = isFirstRun;
exports.getContextualTrigger = getContextualTrigger;
exports.checkAchievements = checkAchievements;
exports.formatAchievement = formatAchievement;
exports.recordCommand = recordCommand;
exports.getLevelDisplay = getLevelDisplay;
exports.formatProfileSummary = formatProfileSummary;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const theme_1 = require("./theme");
const theme_2 = require("./theme");
// ─── Profile Storage ───────────────────────────────────────────────────────
const PROFILE_DIR = path_1.default.join(os_1.default.homedir(), '.codymaster');
const PROFILE_FILE = path_1.default.join(PROFILE_DIR, 'profile.json');
const DEFAULT_PROFILE = {
    userName: '',
    platform: '',
    onboardingStep: 0,
    onboardingComplete: false,
    firstRunAt: '',
    lastRunAt: '',
    totalCommands: 0,
    streak: 0,
    lastStreakDate: '',
    level: 'beginner',
    achievements: [],
    commandHistory: {},
    skillsUsed: [],
};
/**
 * Load user profile from disk
 */
function loadProfile() {
    try {
        if (fs_1.default.existsSync(PROFILE_FILE)) {
            const raw = fs_1.default.readFileSync(PROFILE_FILE, 'utf-8');
            return Object.assign(Object.assign({}, DEFAULT_PROFILE), JSON.parse(raw));
        }
    }
    catch ( /* ignore */_a) { /* ignore */ }
    return Object.assign({}, DEFAULT_PROFILE);
}
/**
 * Save user profile to disk
 */
function saveProfile(profile) {
    try {
        if (!fs_1.default.existsSync(PROFILE_DIR)) {
            fs_1.default.mkdirSync(PROFILE_DIR, { recursive: true });
        }
        fs_1.default.writeFileSync(PROFILE_FILE, JSON.stringify(profile, null, 2));
    }
    catch ( /* ignore */_a) { /* ignore */ }
}
/**
 * Check if this is the first run (profile doesn't exist)
 */
function isFirstRun() {
    return !fs_1.default.existsSync(PROFILE_FILE);
}
/**
 * Get a contextual trigger message based on user data
 * Hook Model: External trigger that becomes internal over time
 */
function getContextualTrigger(profile, ctx) {
    const now = new Date();
    const lastRun = profile.lastRunAt ? new Date(profile.lastRunAt) : null;
    const hoursSinceLastRun = lastRun ? (now.getTime() - lastRun.getTime()) / 3600000 : 999;
    // Re-engagement trigger
    if (hoursSinceLastRun > 48) {
        return `Haven't seen you in a while! 👋 Let's get back to it`;
    }
    // Streak trigger  
    if (profile.streak >= 3) {
        return `${theme_2.ICONS.fire} ${profile.streak}-day streak! Keep it going!`;
    }
    // Task-based triggers
    if ((ctx === null || ctx === void 0 ? void 0 : ctx.tasksInProgress) && ctx.tasksInProgress > 0) {
        return `${ctx.tasksInProgress} task${ctx.tasksInProgress > 1 ? 's' : ''} cooking! ${theme_2.ICONS.hamster}`;
    }
    if ((ctx === null || ctx === void 0 ? void 0 : ctx.tasksInReview) && ctx.tasksInReview > 0) {
        return `${ctx.tasksInReview} task${ctx.tasksInReview > 1 ? 's' : ''} waiting for review 👀`;
    }
    if ((ctx === null || ctx === void 0 ? void 0 : ctx.totalTasks) === 0) {
        return `Clean slate! What shall we build? 🏗️`;
    }
    if ((ctx === null || ctx === void 0 ? void 0 : ctx.tasksDone) && ctx.totalTasks && ctx.tasksDone === ctx.totalTasks) {
        return `All clear! ${theme_2.ICONS.star} What's next?`;
    }
    // Default
    return `Ready when you are! ${theme_2.ICONS.hamster}`;
}
// ─── VARIABLE REWARD: Achievement System ───────────────────────────────────
const ACHIEVEMENTS = {
    'first_run': { name: 'Hello World', emoji: '👋', desc: 'First time running CodyMaster' },
    'first_task': { name: 'Task Master', emoji: '✅', desc: 'Created your first task' },
    'first_done': { name: 'Shipper', emoji: '🚀', desc: 'Completed your first task' },
    'five_tasks': { name: 'Busy Bee', emoji: '🐝', desc: 'Created 5 tasks' },
    'first_deploy': { name: 'Deploy Hero', emoji: '🦸', desc: 'First deployment recorded' },
    'first_skill': { name: 'Skill Hunter', emoji: '🧩', desc: 'Used your first skill' },
    'streak_3': { name: 'On Fire', emoji: '🔥', desc: '3-day usage streak' },
    'streak_7': { name: 'Committed', emoji: '💎', desc: '7-day usage streak' },
    'commands_50': { name: 'Power User', emoji: '⚡', desc: '50 commands executed' },
    'commands_100': { name: 'CLI Ninja', emoji: '🥷', desc: '100 commands executed' },
    'level_builder': { name: 'Builder', emoji: '🏗️', desc: 'Reached Builder level' },
    'level_master': { name: 'Master', emoji: '🏆', desc: 'Reached Master level' },
};
/**
 * Check and unlock new achievements
 * Returns newly unlocked achievements
 */
function checkAchievements(profile) {
    const newAchievements = [];
    const check = (id, condition) => {
        if (condition && !profile.achievements.includes(id)) {
            profile.achievements.push(id);
            newAchievements.push(id);
        }
    };
    check('first_run', profile.totalCommands >= 1);
    check('first_task', (profile.commandHistory['task add'] || 0) >= 1);
    check('five_tasks', (profile.commandHistory['task add'] || 0) >= 5);
    check('first_done', (profile.commandHistory['task done'] || 0) >= 1);
    check('first_deploy', (profile.commandHistory['deploy'] || 0) >= 1);
    check('first_skill', profile.skillsUsed.length >= 1);
    check('streak_3', profile.streak >= 3);
    check('streak_7', profile.streak >= 7);
    check('commands_50', profile.totalCommands >= 50);
    check('commands_100', profile.totalCommands >= 100);
    check('level_builder', profile.level === 'builder' || profile.level === 'master' || profile.level === 'legend');
    check('level_master', profile.level === 'master' || profile.level === 'legend');
    return newAchievements;
}
/**
 * Format achievement unlock message
 */
function formatAchievement(id) {
    const a = ACHIEVEMENTS[id];
    if (!a)
        return '';
    return `  ${a.emoji} ${(0, theme_1.success)('Achievement Unlocked:')} ${(0, theme_1.brand)(a.name)} — ${(0, theme_1.dim)(a.desc)}`;
}
// ─── INVESTMENT: Track & Level Up ──────────────────────────────────────────
/**
 * Record a command execution (Investment phase)
 * Updates profile with usage data → CLI becomes more personal
 */
function recordCommand(profile, command) {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    // Update totals
    profile.totalCommands++;
    profile.commandHistory[command] = (profile.commandHistory[command] || 0) + 1;
    profile.lastRunAt = now.toISOString();
    // First run
    if (!profile.firstRunAt) {
        profile.firstRunAt = now.toISOString();
    }
    // Streak calculation
    if (profile.lastStreakDate !== today) {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        if (profile.lastStreakDate === yesterdayStr) {
            profile.streak++;
        }
        else if (profile.lastStreakDate !== today) {
            profile.streak = 1;
        }
        profile.lastStreakDate = today;
    }
    // Level calculation
    updateLevel(profile);
}
function updateLevel(profile) {
    const cmds = profile.totalCommands;
    const skills = profile.skillsUsed.length;
    if (cmds >= 100 && skills >= 10) {
        profile.level = 'legend';
    }
    else if (cmds >= 50 && skills >= 5) {
        profile.level = 'master';
    }
    else if (cmds >= 10 && skills >= 1) {
        profile.level = 'builder';
    }
    else {
        profile.level = 'beginner';
    }
}
/**
 * Get level display with emoji
 */
function getLevelDisplay(level) {
    const levels = {
        beginner: { emoji: '🌱', color: theme_1.dim },
        builder: { emoji: '🏗️', color: theme_1.info },
        master: { emoji: '🏆', color: theme_1.brand },
        legend: { emoji: '👑', color: theme_1.success },
    };
    const l = levels[level] || levels.beginner;
    return `${l.emoji} ${l.color(level.charAt(0).toUpperCase() + level.slice(1))}`;
}
/**
 * Format profile summary for `cm profile` command
 */
function formatProfileSummary(profile) {
    const lines = [
        '',
        `  ${(0, theme_1.brand)('🐹 Your Profile')}`,
        '',
        `  ${(0, theme_1.dim)('Name:')}     ${profile.userName || (0, theme_1.dim)('(not set)')}`,
        `  ${(0, theme_1.dim)('Level:')}    ${getLevelDisplay(profile.level)}`,
        `  ${(0, theme_1.dim)('Streak:')}   ${profile.streak > 0 ? `${theme_2.ICONS.fire} ${(0, theme_1.brand)(String(profile.streak))} days` : (0, theme_1.dim)('Start today!')}`,
        `  ${(0, theme_1.dim)('Commands:')} ${(0, theme_1.brand)(String(profile.totalCommands))} total`,
        `  ${(0, theme_1.dim)('Platform:')} ${profile.platform || (0, theme_1.dim)('(auto-detect)')}`,
        '',
    ];
    // Achievements
    if (profile.achievements.length > 0) {
        lines.push(`  ${(0, theme_1.brand)('Achievements')} (${profile.achievements.length}/${Object.keys(ACHIEVEMENTS).length})`);
        for (const id of profile.achievements) {
            const a = ACHIEVEMENTS[id];
            if (a)
                lines.push(`    ${a.emoji} ${a.name}`);
        }
        lines.push('');
    }
    // Top commands
    const topCmds = Object.entries(profile.commandHistory)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);
    if (topCmds.length > 0) {
        lines.push(`  ${(0, theme_1.brand)('Top Commands')}`);
        for (const [cmd, count] of topCmds) {
            lines.push(`    ${(0, theme_1.dim)('cm')} ${cmd} ${(0, theme_1.muted)(`×${count}`)}`);
        }
        lines.push('');
    }
    return lines.join('\n');
}
