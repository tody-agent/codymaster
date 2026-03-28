"use strict";
/**
 * 🎳 Self-Onboarding System — Bowling Alley / Straight-Line Onboarding
 * Based on ProductLed EUREKA framework by Ramli John
 *
 * 5 Steps → First Strike (Aha! moment) → Power User
 * Each step: ONE action + bumpers to prevent confusion
 */
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
exports.runOnboarding = runOnboarding;
exports.showReturningWelcome = showReturningWelcome;
const theme_1 = require("./theme");
const theme_2 = require("./theme");
const box_1 = require("./box");
const hamster_1 = require("./hamster");
const hooks_1 = require("./hooks");
// ─── Onboarding Steps ──────────────────────────────────────────────────────
const TOTAL_STEPS = 5;
const STEP_INFO = {
    1: { title: 'Meet your assistant', desc: 'What should I call you?' },
    2: { title: 'Pick your platform', desc: 'Where do you code?' },
    3: { title: 'Your first task', desc: 'Add something to build' },
    4: { title: 'See the magic', desc: 'Discover your 65 skills' },
    5: { title: 'You\'re ready!', desc: 'Welcome to the team' },
};
/**
 * Run the full onboarding wizard
 * Returns the updated profile
 */
function runOnboarding(version) {
    return __awaiter(this, void 0, void 0, function* () {
        const profile = (0, hooks_1.loadProfile)();
        const p = (yield Promise.resolve().then(() => __importStar(require('@clack/prompts')))).default || (yield Promise.resolve().then(() => __importStar(require('@clack/prompts'))));
        // If already complete, skip
        if (profile.onboardingComplete)
            return profile;
        const startStep = profile.onboardingStep || 0;
        // ─── STEP 1: Name ──────────────────────────────
        if (startStep < 1) {
            console.clear();
            console.log('');
            console.log((0, hamster_1.getHamsterArt)('greeting'));
            console.log('');
            console.log(`    ${(0, theme_1.brandBold)('Hi there! I\'m Cody')} ${theme_2.ICONS.hamster}`);
            console.log(`    ${(0, theme_1.dim)('Your smart coding companion.')}`);
            console.log('');
            console.log((0, box_1.renderStepProgress)(1, TOTAL_STEPS));
            console.log('');
            const nameResult = yield p.text({
                message: 'What should I call you?',
                placeholder: 'Your name',
                validate: (val) => {
                    if (!val || val.trim().length === 0)
                        return 'Just type your name — even a nickname works!';
                    if (val.trim().length > 30)
                        return 'That\'s a bit long! Try a shorter name';
                    return undefined;
                },
            });
            if (p.isCancel(nameResult)) {
                console.log((0, theme_1.dim)('\n  No worries! Run cm again anytime. 👋\n'));
                process.exit(0);
            }
            profile.userName = nameResult.trim();
            profile.onboardingStep = 1;
            profile.firstRunAt = new Date().toISOString();
            (0, hooks_1.saveProfile)(profile);
        }
        // ─── STEP 2: Platform ──────────────────────────
        if (startStep < 2) {
            console.log('');
            console.log(`    ${(0, theme_1.success)('✓')} ${(0, theme_1.dim)('Nice to meet you,')} ${(0, theme_1.brand)(profile.userName)}${(0, theme_1.dim)('!')}`);
            console.log('');
            console.log((0, box_1.renderStepProgress)(2, TOTAL_STEPS));
            console.log('');
            const platformResult = yield p.select({
                message: 'Where do you code?',
                options: [
                    { label: '✦  Google Antigravity (Gemini)', value: 'gemini', hint: 'recommended' },
                    { label: '🟣 Claude Code', value: 'claude', hint: 'plugin system' },
                    { label: '⬡  Cursor', value: 'cursor', hint: 'rules directory' },
                    { label: '🌊 Windsurf', value: 'windsurf', hint: 'rules directory' },
                    { label: '🔶 Cline / RooCode', value: 'cline', hint: 'skills directory' },
                    { label: '📦 OpenCode', value: 'opencode', hint: 'skills directory' },
                    { label: '🪁 Kiro', value: 'kiro', hint: 'steering docs' },
                    { label: '🤖 GitHub Copilot', value: 'copilot', hint: 'auto-context' },
                    { label: '🔧 Other / Not sure', value: 'other', hint: 'auto-detect' },
                ],
            });
            if (p.isCancel(platformResult)) {
                profile.onboardingStep = 1;
                (0, hooks_1.saveProfile)(profile);
                console.log((0, theme_1.dim)('\n  No worries! Run cm again to continue. 👋\n'));
                process.exit(0);
            }
            profile.platform = platformResult;
            profile.onboardingStep = 2;
            (0, hooks_1.saveProfile)(profile);
        }
        // ─── STEP 3: First Task (The First Strike 🎳) ──
        if (startStep < 3) {
            console.log('');
            console.log(`    ${(0, theme_1.success)('✓')} ${(0, theme_1.dim)('Great choice!')} ${(0, theme_1.brand)(profile.platform)}`);
            console.log('');
            console.log((0, box_1.renderStepProgress)(3, TOTAL_STEPS));
            console.log('');
            console.log(`    ${(0, theme_1.brandBold)('Let\'s add your first task!')} ${theme_2.ICONS.sparkle}`);
            console.log(`    ${(0, theme_1.dim)('This is what you want to build or work on.')}`);
            console.log('');
            const taskResult = yield p.text({
                message: 'What are you working on?',
                placeholder: 'e.g., "Build my landing page"',
                validate: (val) => {
                    if (!val || val.trim().length === 0)
                        return 'Just describe what you\'re building — keep it simple!';
                    return undefined;
                },
            });
            if (p.isCancel(taskResult)) {
                profile.onboardingStep = 2;
                (0, hooks_1.saveProfile)(profile);
                console.log((0, theme_1.dim)('\n  No worries! Run cm again to continue. 👋\n'));
                process.exit(0);
            }
            // Actually create the task
            const taskTitle = taskResult.trim();
            try {
                const { loadData, saveData, logActivity, shortId, DATA_FILE } = yield Promise.resolve().then(() => __importStar(require('../data')));
                const crypto = yield Promise.resolve().then(() => __importStar(require('crypto')));
                const data = loadData();
                // Ensure default project exists
                if (data.projects.length === 0) {
                    const dp = {
                        id: crypto.randomUUID(),
                        name: 'My Project',
                        path: process.cwd(),
                        agents: [],
                        createdAt: new Date().toISOString(),
                    };
                    data.projects.push(dp);
                }
                const projectId = data.projects[0].id;
                const now = new Date().toISOString();
                const task = {
                    id: crypto.randomUUID(),
                    projectId,
                    title: taskTitle,
                    description: '',
                    column: 'backlog',
                    order: 0,
                    priority: 'medium',
                    agent: '',
                    skill: '',
                    createdAt: now,
                    updatedAt: now,
                };
                data.tasks.push(task);
                logActivity(data, 'task_created', `Task "${taskTitle}" created during onboarding`, projectId);
                saveData(data);
                console.log('');
                console.log((0, hamster_1.getHamsterArt)('celebrating'));
                console.log('');
                console.log(`    ${(0, theme_1.success)('✅')} ${(0, theme_1.brandBold)('First task created!')} ${(0, hamster_1.getCelebration)()}`);
                console.log(`    ${(0, theme_1.dim)(`"${taskTitle}"`)}`);
                console.log('');
            }
            catch (_a) {
                console.log('');
                console.log(`    ${(0, theme_1.success)('✓')} ${(0, theme_1.dim)('Got it!')} ${(0, theme_1.brand)(taskTitle)}`);
                console.log('');
            }
            profile.onboardingStep = 3;
            (0, hooks_1.recordCommand)(profile, 'task add');
            (0, hooks_1.saveProfile)(profile);
        }
        // ─── STEP 4: Skill Discovery ───────────────────
        if (startStep < 4) {
            console.log((0, box_1.renderStepProgress)(4, TOTAL_STEPS));
            console.log('');
            console.log(`    ${(0, theme_1.brandBold)('You have 65 superpowers!')} ${theme_2.ICONS.skill}`);
            console.log(`    ${(0, theme_1.dim)('Grouped by what they help you do:')}`);
            console.log('');
            const SKILL_DOMAINS = [
                { domain: '⚙️  Engineering', skills: [
                        { name: 'cm-tdd', desc: 'Test-driven development' },
                        { name: 'cm-debugging', desc: 'Smart bug hunting' },
                        { name: 'cm-quality-gate', desc: 'Pre-deploy verification' },
                        { name: 'cm-clean-code', desc: 'Code hygiene gate' },
                    ] },
                { domain: '🚀 Operations', skills: [
                        { name: 'cm-safe-deploy', desc: 'Multi-gate deploy' },
                        { name: 'cm-secret-shield', desc: 'Secret scanning' },
                        { name: 'cm-git-worktrees', desc: 'Isolated branches' },
                        { name: 'cm-identity-guard', desc: 'Account & project safety' },
                    ] },
                { domain: '🎨 Product & Design', skills: [
                        { name: 'cm-planning', desc: 'Plan before you code' },
                        { name: 'cm-ui-preview', desc: 'AI-powered UI design' },
                        { name: 'cm-ux-master', desc: '48 UX Laws + design system' },
                        { name: 'cm-design-system', desc: 'Design token intelligence' },
                    ] },
                { domain: '📈 Growth & Content', skills: [
                        { name: 'cm-content-factory', desc: 'Self-learning content engine' },
                        { name: 'cm-ads-tracker', desc: 'Conversion tracking setup' },
                        { name: 'cm-growth-hacking', desc: 'Booking popups & CTAs' },
                        { name: 'cm-readit', desc: 'Audio-enabled experience' },
                    ] },
                { domain: '🤖 Orchestration', skills: [
                        { name: 'cm-execution', desc: 'Parallel agent dispatch' },
                        { name: 'cm-skill-chain', desc: 'Multi-skill pipelines' },
                        { name: 'cm-continuity', desc: 'Working memory protocol' },
                        { name: 'cm-skill-mastery', desc: 'Meta-skill kit discipline' },
                    ] },
                { domain: '🔧 Workflow', skills: [
                        { name: 'cm-start', desc: 'Idea → production code' },
                        { name: 'cm-project-bootstrap', desc: 'Zero-to-production setup' },
                        { name: 'cm-dashboard', desc: 'Visual Mission Control' },
                        { name: 'cm-notebooklm', desc: 'AI brain & soul engine' },
                    ] },
            ];
            for (const d of SKILL_DOMAINS) {
                console.log(`    ${(0, theme_1.brand)(d.domain)}`);
                for (const s of d.skills) {
                    console.log(`      ${(0, theme_1.dim)('›')} ${s.name.padEnd(22)} ${(0, theme_1.muted)(s.desc)}`);
                }
                console.log('');
            }
            console.log(`    ${(0, theme_1.dim)(`Total: 65 skills across 6 domains`)}`);
            console.log('');
            const viewAll = yield p.confirm({
                message: 'Want to browse all 65 skills in detail?',
                initialValue: false,
            });
            profile.onboardingStep = 4;
            (0, hooks_1.saveProfile)(profile);
            if (viewAll === true) {
                console.log((0, theme_1.dim)('\n  Run: cm list   to see all skills\n'));
            }
        }
        // ─── STEP 5: Complete! 🎉 ──────────────────────
        if (startStep < 5) {
            console.log('');
            console.log((0, box_1.renderStepProgress)(5, TOTAL_STEPS));
            console.log('');
            console.log((0, hamster_1.getHamsterArt)('celebrating'));
            console.log('');
            console.log(`    ${(0, theme_1.success)('🎉')} ${(0, theme_1.brandBold)(`You're all set, ${profile.userName}!`)}`);
            console.log('');
            const quickRef = [
                `${(0, theme_1.brand)('cm')}                 ${(0, theme_1.dim)('Quick menu')}`,
                `${(0, theme_1.brand)('cm task add')} ${(0, theme_1.dim)('"..."')}  ${(0, theme_1.dim)('Add a task')}`,
                `${(0, theme_1.brand)('cm status')}           ${(0, theme_1.dim)('See progress')}`,
                `${(0, theme_1.brand)('cm list')}             ${(0, theme_1.dim)('Browse skills')}`,
                `${(0, theme_1.brand)('cm dashboard')}        ${(0, theme_1.dim)('Open Mission Control')}`,
                `${(0, theme_1.brand)('cm profile')}          ${(0, theme_1.dim)('Your stats & achievements')}`,
            ];
            console.log((0, box_1.renderBox)(quickRef, { title: 'Quick Reference', width: 52 }));
            console.log('');
            profile.onboardingStep = 5;
            profile.onboardingComplete = true;
            const newAchievements = (0, hooks_1.checkAchievements)(profile);
            (0, hooks_1.saveProfile)(profile);
            // Show achievements
            for (const id of newAchievements) {
                console.log((0, hooks_1.formatAchievement)(id));
            }
            if (newAchievements.length > 0)
                console.log('');
        }
        return profile;
    });
}
/**
 * Show returning user welcome (post-onboarding)
 * Displays hamster + trigger + quick action
 */
function showReturningWelcome(profile, version, cwd) {
    console.log((0, hamster_1.renderHamsterBanner)(profile.userName, version, cwd));
}
