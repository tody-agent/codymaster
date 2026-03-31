/**
 * 🐹 Hamster Mascot — ASCII art + personality system
 * The face of CodyMaster CLI
 */

import { brand, brandBold, dim, muted, success, warning, info, text } from './theme';

// ─── ASCII Art States ──────────────────────────────────────────────────────

const HAMSTER_ART: Record<string, string[]> = {
  happy: [
    `    ${brand('( . \\ --- / . )')}`,
    `     ${brand('/')}   ${brandBold('^   ^')}   ${brand('\\')}`,
    `    ${brand('(')}      ${brandBold('u')}      ${brand(')')}`,
    `     ${brand('|  \\ ___ /  |')}`,
    `      ${brand('\'--w---w--\'')}`,
  ],
  angry: [
    `    ${brand('( . \\ --- / . )')}`,
    `     ${brand('/')}   ${warning('>   <')}   ${brand('\\')}`,
    `    ${brand('(')}      ${warning('x')}      ${brand(')')}`,
    `     ${brand('|  \\ ___ /  |')}`,
    `      ${brand('\'--w---w--\'')}`,
  ],
  sad: [
    `    ${brand('( . \\ --- / . )')}`,
    `     ${brand('/')}   ${dim('u   u')}   ${brand('\\')}`,
    `    ${brand('(')}      ${dim('n')}      ${brand(')')}`,
    `     ${brand('|  \\ ___ /  |')}`,
    `      ${brand('\'--w---w--\'')}`,
  ],
  surprised: [
    `    ${brand('( . \\ --- / . )')}`,
    `     ${brand('/')}   ${info('O   O')}   ${brand('\\')}`,
    `    ${brand('(')}      ${info('o')}      ${brand(')')}`,
    `     ${brand('|  \\ ___ /  |')}`,
    `      ${brand('\'--w---w--\'')}`,
  ],
  in_love: [
    `    ${brand('( . \\ --- / . )')}  ${success('♥')}`,
    `     ${brand('/')}   ${success('*   *')}   ${brand('\\')}`,
    `    ${brand('(')}      ${success('v')}      ${brand(')')}`,
    `     ${brand('|  \\ ___ /  |')}`,
    `      ${brand('\'--w---w--\'')}`,
  ],
  sleeping: [
    `    ${brand('( . \\ --- / . )')}   ${dim('zZ')}`,
    `     ${brand('/')}   ${dim('-   -')}   ${brand('\\')}  ${dim('zZ')}`,
    `    ${brand('(')}      ${dim('u')}      ${brand(')')}`,
    `     ${brand('|  \\ ___ /  |')}`,
    `      ${brand('\'--w---w--\'')}`,
  ],
  thinking: [
    `    ${brand('( . \\ --- / . )')}  ${dim('.oO')}`,
    `     ${brand('/')}   ${dim('.   .')}   ${brand('\\')} ${dim('/')}`,
    `    ${brand('(')}      ${dim('u')}      ${brand(')')}`,
    `     ${brand('|  \\ ___ /  |')}`,
    `      ${brand('\'--w---w--\'')}`,
  ],
  cool: [
    `    ${brand('( . \\ --- / . )')}`,
    `     ${brand('/')}   ${info('B   B')}   ${brand('\\')}`,
    `    ${brand('(')}      ${info('v')}      ${brand(')')}`,
    `     ${brand('|  \\ ___ /  |')}`,
    `      ${brand('\'--w---w--\'')}`,
  ],
  celebrating: [
    `     ${success('\\')} ${brand('( \\_/ )')} ${success('/')}`,
    `    ${success('\\')} ${brand('(')} ${success('^ u ^')} ${brand(')')} ${success('/')}`,
    `   ${success('--')} ${brand('(  ___  )')} ${success('--')}`,
    `    ${brand('| [     ] |')}`,
    `     ${brand('\'--w-w--\'')}`,
  ],
};

// Aliases for compatibility with existing code
Object.assign(HAMSTER_ART, {
  greeting: HAMSTER_ART.happy,
  working: HAMSTER_ART.thinking,
  error: HAMSTER_ART.angry,
});

export type HamsterState = keyof typeof HAMSTER_ART;

/**
 * Get hamster ASCII art for a given state
 */
export function getHamsterArt(state: HamsterState = 'greeting'): string {
  return HAMSTER_ART[state].join('\n');
}

// ─── Time-Based Greetings ──────────────────────────────────────────────────

function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}

const TIME_GREETINGS: Record<string, string[]> = {
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
export function getGreeting(userName?: string): string {
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
export function getCelebration(): string {
  return CELEBRATIONS[Math.floor(Math.random() * CELEBRATIONS.length)];
}

/**
 * Get a random encouragement
 */
export function getEncouragement(): string {
  return ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
}

/**
 * Get error guidance
 */
export function getErrorGuidance(): string {
  return ERROR_GUIDANCE[Math.floor(Math.random() * ERROR_GUIDANCE.length)];
}

/**
 * Render the full hamster banner with greeting
 */
export function renderHamsterBanner(userName?: string, version?: string, cwd?: string, skillCount: number = 34): string {
  const art = getHamsterArt(getTimeOfDay() === 'night' ? 'sleeping' : 'greeting');
  const greeting = getGreeting(userName);
  const lines = [
    '',
    art,
    '',
    `    ${brandBold(greeting)}`,
    '',
    `    ${dim('CodyMaster')} ${brand(`v${version || '?'}`)} ${dim('•')} ${dim(`${skillCount} Skills`)} ${dim('•')} ${dim(cwd || '~')}`,
    dim('  ' + '─'.repeat(50)),
  ];
  return lines.join('\n');
}

/**
 * Render a compact hamster message (for inline use)
 */
export function renderHamsterMessage(message: string, state: HamsterState = 'greeting'): string {
  const art = HAMSTER_ART[state];
  const artWidth = 14;
  // Combine art with message on the same line
  return [
    art[0],
    art[1],
    `${art[2]}  ${text(message)}`,
    art[3],
  ].join('\n');
}
