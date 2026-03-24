"use strict";
/**
 * 🐹 Hamster Mascot — ASCII art + personality system
 * The face of CodyMaster CLI
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHamsterArt = getHamsterArt;
exports.getGreeting = getGreeting;
exports.getCelebration = getCelebration;
exports.getEncouragement = getEncouragement;
exports.getErrorGuidance = getErrorGuidance;
exports.renderHamsterBanner = renderHamsterBanner;
exports.renderHamsterMessage = renderHamsterMessage;
const theme_1 = require("./theme");
// ─── ASCII Art States ──────────────────────────────────────────────────────
const HAMSTER_ART = {
    happy: [
        `    ${(0, theme_1.brand)('( . \\ --- / . )')}`,
        `     ${(0, theme_1.brand)('/')}   ${(0, theme_1.brandBold)('^   ^')}   ${(0, theme_1.brand)('\\')}`,
        `    ${(0, theme_1.brand)('(')}      ${(0, theme_1.brandBold)('u')}      ${(0, theme_1.brand)(')')}`,
        `     ${(0, theme_1.brand)('|  \\ ___ /  |')}`,
        `      ${(0, theme_1.brand)('\'--w---w--\'')}`,
    ],
    angry: [
        `    ${(0, theme_1.brand)('( . \\ --- / . )')}`,
        `     ${(0, theme_1.brand)('/')}   ${(0, theme_1.warning)('>   <')}   ${(0, theme_1.brand)('\\')}`,
        `    ${(0, theme_1.brand)('(')}      ${(0, theme_1.warning)('x')}      ${(0, theme_1.brand)(')')}`,
        `     ${(0, theme_1.brand)('|  \\ ___ /  |')}`,
        `      ${(0, theme_1.brand)('\'--w---w--\'')}`,
    ],
    sad: [
        `    ${(0, theme_1.brand)('( . \\ --- / . )')}`,
        `     ${(0, theme_1.brand)('/')}   ${(0, theme_1.dim)('u   u')}   ${(0, theme_1.brand)('\\')}`,
        `    ${(0, theme_1.brand)('(')}      ${(0, theme_1.dim)('n')}      ${(0, theme_1.brand)(')')}`,
        `     ${(0, theme_1.brand)('|  \\ ___ /  |')}`,
        `      ${(0, theme_1.brand)('\'--w---w--\'')}`,
    ],
    surprised: [
        `    ${(0, theme_1.brand)('( . \\ --- / . )')}`,
        `     ${(0, theme_1.brand)('/')}   ${(0, theme_1.info)('O   O')}   ${(0, theme_1.brand)('\\')}`,
        `    ${(0, theme_1.brand)('(')}      ${(0, theme_1.info)('o')}      ${(0, theme_1.brand)(')')}`,
        `     ${(0, theme_1.brand)('|  \\ ___ /  |')}`,
        `      ${(0, theme_1.brand)('\'--w---w--\'')}`,
    ],
    in_love: [
        `    ${(0, theme_1.brand)('( . \\ --- / . )')}  ${(0, theme_1.success)('♥')}`,
        `     ${(0, theme_1.brand)('/')}   ${(0, theme_1.success)('*   *')}   ${(0, theme_1.brand)('\\')}`,
        `    ${(0, theme_1.brand)('(')}      ${(0, theme_1.success)('v')}      ${(0, theme_1.brand)(')')}`,
        `     ${(0, theme_1.brand)('|  \\ ___ /  |')}`,
        `      ${(0, theme_1.brand)('\'--w---w--\'')}`,
    ],
    sleeping: [
        `    ${(0, theme_1.brand)('( . \\ --- / . )')}   ${(0, theme_1.dim)('zZ')}`,
        `     ${(0, theme_1.brand)('/')}   ${(0, theme_1.dim)('-   -')}   ${(0, theme_1.brand)('\\')}  ${(0, theme_1.dim)('zZ')}`,
        `    ${(0, theme_1.brand)('(')}      ${(0, theme_1.dim)('u')}      ${(0, theme_1.brand)(')')}`,
        `     ${(0, theme_1.brand)('|  \\ ___ /  |')}`,
        `      ${(0, theme_1.brand)('\'--w---w--\'')}`,
    ],
    thinking: [
        `    ${(0, theme_1.brand)('( . \\ --- / . )')}  ${(0, theme_1.dim)('.oO')}`,
        `     ${(0, theme_1.brand)('/')}   ${(0, theme_1.dim)('.   .')}   ${(0, theme_1.brand)('\\')} ${(0, theme_1.dim)('/')}`,
        `    ${(0, theme_1.brand)('(')}      ${(0, theme_1.dim)('u')}      ${(0, theme_1.brand)(')')}`,
        `     ${(0, theme_1.brand)('|  \\ ___ /  |')}`,
        `      ${(0, theme_1.brand)('\'--w---w--\'')}`,
    ],
    cool: [
        `    ${(0, theme_1.brand)('( . \\ --- / . )')}`,
        `     ${(0, theme_1.brand)('/')}   ${(0, theme_1.info)('B   B')}   ${(0, theme_1.brand)('\\')}`,
        `    ${(0, theme_1.brand)('(')}      ${(0, theme_1.info)('v')}      ${(0, theme_1.brand)(')')}`,
        `     ${(0, theme_1.brand)('|  \\ ___ /  |')}`,
        `      ${(0, theme_1.brand)('\'--w---w--\'')}`,
    ],
    celebrating: [
        `     ${(0, theme_1.success)('\\')} ${(0, theme_1.brand)('( \\_/ )')} ${(0, theme_1.success)('/')}`,
        `    ${(0, theme_1.success)('\\')} ${(0, theme_1.brand)('(')} ${(0, theme_1.success)('^ u ^')} ${(0, theme_1.brand)(')')} ${(0, theme_1.success)('/')}`,
        `   ${(0, theme_1.success)('--')} ${(0, theme_1.brand)('(  ___  )')} ${(0, theme_1.success)('--')}`,
        `    ${(0, theme_1.brand)('| [     ] |')}`,
        `     ${(0, theme_1.brand)('\'--w-w--\'')}`,
    ],
};
// Aliases for compatibility with existing code
Object.assign(HAMSTER_ART, {
    greeting: HAMSTER_ART.happy,
    working: HAMSTER_ART.thinking,
    error: HAMSTER_ART.angry,
});
/**
 * Get hamster ASCII art for a given state
 */
function getHamsterArt(state = 'greeting') {
    return HAMSTER_ART[state].join('\n');
}
// ─── Time-Based Greetings ──────────────────────────────────────────────────
function getTimeOfDay() {
    const h = new Date().getHours();
    if (h >= 5 && h < 12)
        return 'morning';
    if (h >= 12 && h < 17)
        return 'afternoon';
    if (h >= 17 && h < 21)
        return 'evening';
    return 'night';
}
const TIME_GREETINGS = {
    morning: [
        'Good morning! ☀️ Ready to build?',
        'Rise and code! ☀️',
        'Morning! Let\'s ship something today ☀️',
    ],
    afternoon: [
        'Good afternoon! 🌤️ What are we building?',
        'Afternoon! Time to make progress 🏗️',
        'Hey there! Productive day so far? 🌤️',
    ],
    evening: [
        'Good evening! 🌅 Wrapping up?',
        'Evening session! 🌙 Let\'s finish strong',
        'Hey! Late push tonight? 🌅',
    ],
    night: [
        'Working late? 🌙 Don\'t forget to rest!',
        'Night owl mode! 🦉 I\'m here for you',
        'Midnight coding session? 🌙 Let\'s go!',
    ],
};
/**
 * Get a greeting based on time of day + optional user name
 */
function getGreeting(userName) {
    const tod = getTimeOfDay();
    const greetings = TIME_GREETINGS[tod];
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
    if (userName) {
        return `${greeting.split('!')[0]}, ${userName}! ${greeting.includes('!') ? greeting.split('!').slice(1).join('!').trim() : ''}`.trim();
    }
    return greeting;
}
// ─── Hamster Messages ──────────────────────────────────────────────────────
const CELEBRATIONS = [
    'Nice work! 🎉',
    'You\'re on fire! 🔥',
    'Ship it! 🚀',
    'Another one bites the dust! ✅',
    'Level up! ⬆️',
    'Crushing it! 💪',
    'That\'s how it\'s done! ⭐',
    'Clean execution! 🎯',
    'Boom! Done! 💥',
    'Progress! Keep going! 📈',
    'Smooth operator! 🎵',
    'Task terminated! 🤖',
    'One step closer! 🏁',
    'Brilliant move! ♟️',
    'Unstoppable! ⚡',
];
const ENCOURAGEMENTS = [
    'You got this! 💪',
    'Almost there! 🏁',
    'Keep pushing! Every step counts 🐾',
    'Rome wasn\'t built in a day, but they were laying bricks! 🧱',
    'Progress, not perfection! 📈',
    'One command at a time 🐹',
];
const ERROR_GUIDANCE = [
    'Oops! Let me help you fix that 🔧',
    'Not quite! Here\'s what to try instead 💡',
    'Hmm, that didn\'t work. But we\'ll figure it out! 🐹',
    'Small detour! Let\'s get back on track 🛤️',
];
const IDLE_MESSAGES = [
    'Any tasks to tackle? Type cm task list 📋',
    'Need a skill? Try cm list 🧩',
    'Been a while! What are we building? 🏗️',
];
/**
 * Get a random celebration message
 */
function getCelebration() {
    return CELEBRATIONS[Math.floor(Math.random() * CELEBRATIONS.length)];
}
/**
 * Get a random encouragement
 */
function getEncouragement() {
    return ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
}
/**
 * Get error guidance
 */
function getErrorGuidance() {
    return ERROR_GUIDANCE[Math.floor(Math.random() * ERROR_GUIDANCE.length)];
}
/**
 * Render the full hamster banner with greeting
 */
function renderHamsterBanner(userName, version, cwd) {
    const art = getHamsterArt(getTimeOfDay() === 'night' ? 'sleeping' : 'greeting');
    const greeting = getGreeting(userName);
    const lines = [
        '',
        art,
        '',
        `    ${(0, theme_1.brandBold)(greeting)}`,
        '',
        `    ${(0, theme_1.dim)('CodyMaster')} ${(0, theme_1.brand)(`v${version || '?'}`)} ${(0, theme_1.dim)('•')} ${(0, theme_1.dim)('34 Skills')} ${(0, theme_1.dim)('•')} ${(0, theme_1.dim)(cwd || '~')}`,
        (0, theme_1.dim)('  ' + '─'.repeat(50)),
    ];
    return lines.join('\n');
}
/**
 * Render a compact hamster message (for inline use)
 */
function renderHamsterMessage(message, state = 'greeting') {
    const art = HAMSTER_ART[state];
    const artWidth = 14;
    // Combine art with message on the same line
    return [
        art[0],
        art[1],
        `${art[2]}  ${(0, theme_1.text)(message)}`,
        art[3],
    ].join('\n');
}
