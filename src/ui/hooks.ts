/**
 * 🪝 Hook Engine — Trigger → Action → Variable Reward → Investment
 * Based on Nir Eyal's Hook Model for habit-forming CLI experience
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { brand, dim, success, warning, info, muted } from './theme';
import { ICONS } from './theme';

// ─── Profile Storage ───────────────────────────────────────────────────────

const PROFILE_DIR = path.join(os.homedir(), '.codymaster');
const PROFILE_FILE = path.join(PROFILE_DIR, 'profile.json');

export interface UserProfile {
  userName: string;
  platform: string;
  onboardingStep: number;  // 0-5 (0=not started, 5=complete)
  onboardingComplete: boolean;
  firstRunAt: string;
  lastRunAt: string;
  totalCommands: number;
  streak: number;         // consecutive days
  lastStreakDate: string;
  level: 'beginner' | 'builder' | 'master' | 'legend';
  achievements: string[];
  commandHistory: Record<string, number>;  // command -> count
  skillsUsed: string[];
}

const DEFAULT_PROFILE: UserProfile = {
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
export function loadProfile(): UserProfile {
  try {
    if (fs.existsSync(PROFILE_FILE)) {
      const raw = fs.readFileSync(PROFILE_FILE, 'utf-8');
      return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_PROFILE };
}

/**
 * Save user profile to disk
 */
export function saveProfile(profile: UserProfile): void {
  try {
    if (!fs.existsSync(PROFILE_DIR)) {
      fs.mkdirSync(PROFILE_DIR, { recursive: true });
    }
    fs.writeFileSync(PROFILE_FILE, JSON.stringify(profile, null, 2));
  } catch { /* ignore */ }
}

/**
 * Check if this is the first run (profile doesn't exist)
 */
export function isFirstRun(): boolean {
  return !fs.existsSync(PROFILE_FILE);
}

// ─── TRIGGER: Contextual Smart Messages ────────────────────────────────────

interface TriggerContext {
  tasksInProgress?: number;
  tasksInReview?: number;
  tasksDone?: number;
  totalTasks?: number;
  lastDeployAge?: string;  // e.g., "2h ago"
  deployCount?: number;
}

/**
 * Get a contextual trigger message based on user data
 * Hook Model: External trigger that becomes internal over time
 */
export function getContextualTrigger(profile: UserProfile, ctx?: TriggerContext): string {
  const now = new Date();
  const lastRun = profile.lastRunAt ? new Date(profile.lastRunAt) : null;
  const hoursSinceLastRun = lastRun ? (now.getTime() - lastRun.getTime()) / 3600000 : 999;

  // Re-engagement trigger
  if (hoursSinceLastRun > 48) {
    return `Haven't seen you in a while! 👋 Let's get back to it`;
  }

  // Streak trigger  
  if (profile.streak >= 3) {
    return `${ICONS.fire} ${profile.streak}-day streak! Keep it going!`;
  }

  // Task-based triggers
  if (ctx?.tasksInProgress && ctx.tasksInProgress > 0) {
    return `${ctx.tasksInProgress} task${ctx.tasksInProgress > 1 ? 's' : ''} cooking! ${ICONS.hamster}`;
  }

  if (ctx?.tasksInReview && ctx.tasksInReview > 0) {
    return `${ctx.tasksInReview} task${ctx.tasksInReview > 1 ? 's' : ''} waiting for review 👀`;
  }

  if (ctx?.totalTasks === 0) {
    return `Clean slate! What shall we build? 🏗️`;
  }

  if (ctx?.tasksDone && ctx.totalTasks && ctx.tasksDone === ctx.totalTasks) {
    return `All clear! ${ICONS.star} What's next?`;
  }

  // Default
  return `Ready when you are! ${ICONS.hamster}`;
}

// ─── VARIABLE REWARD: Achievement System ───────────────────────────────────

const ACHIEVEMENTS: Record<string, { name: string; emoji: string; desc: string }> = {
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
export function checkAchievements(profile: UserProfile): string[] {
  const newAchievements: string[] = [];

  const check = (id: string, condition: boolean) => {
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
export function formatAchievement(id: string): string {
  const a = ACHIEVEMENTS[id];
  if (!a) return '';
  return `  ${a.emoji} ${success('Achievement Unlocked:')} ${brand(a.name)} — ${dim(a.desc)}`;
}

// ─── INVESTMENT: Track & Level Up ──────────────────────────────────────────

/**
 * Record a command execution (Investment phase)
 * Updates profile with usage data → CLI becomes more personal
 */
export function recordCommand(profile: UserProfile, command: string): void {
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
    } else if (profile.lastStreakDate !== today) {
      profile.streak = 1;
    }
    profile.lastStreakDate = today;
  }

  // Level calculation
  updateLevel(profile);
}

function updateLevel(profile: UserProfile): void {
  const cmds = profile.totalCommands;
  const skills = profile.skillsUsed.length;

  if (cmds >= 100 && skills >= 10) {
    profile.level = 'legend';
  } else if (cmds >= 50 && skills >= 5) {
    profile.level = 'master';
  } else if (cmds >= 10 && skills >= 1) {
    profile.level = 'builder';
  } else {
    profile.level = 'beginner';
  }
}

/**
 * Get level display with emoji
 */
export function getLevelDisplay(level: string): string {
  const levels: Record<string, { emoji: string; color: (s: string) => string }> = {
    beginner: { emoji: '🌱', color: dim },
    builder: { emoji: '🏗️', color: info },
    master: { emoji: '🏆', color: brand },
    legend: { emoji: '👑', color: success },
  };
  const l = levels[level] || levels.beginner;
  return `${l.emoji} ${l.color(level.charAt(0).toUpperCase() + level.slice(1))}`;
}

/**
 * Format profile summary for `cm profile` command
 */
export function formatProfileSummary(profile: UserProfile): string {
  const lines = [
    '',
    `  ${brand('🐹 Your Profile')}`,
    '',
    `  ${dim('Name:')}     ${profile.userName || dim('(not set)')}`,
    `  ${dim('Level:')}    ${getLevelDisplay(profile.level)}`,
    `  ${dim('Streak:')}   ${profile.streak > 0 ? `${ICONS.fire} ${brand(String(profile.streak))} days` : dim('Start today!')}`,
    `  ${dim('Commands:')} ${brand(String(profile.totalCommands))} total`,
    `  ${dim('Platform:')} ${profile.platform || dim('(auto-detect)')}`,
    '',
  ];

  // Achievements
  if (profile.achievements.length > 0) {
    lines.push(`  ${brand('Achievements')} (${profile.achievements.length}/${Object.keys(ACHIEVEMENTS).length})`);
    for (const id of profile.achievements) {
      const a = ACHIEVEMENTS[id];
      if (a) lines.push(`    ${a.emoji} ${a.name}`);
    }
    lines.push('');
  }

  // Top commands
  const topCmds = Object.entries(profile.commandHistory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
  if (topCmds.length > 0) {
    lines.push(`  ${brand('Top Commands')}`);
    for (const [cmd, count] of topCmds) {
      lines.push(`    ${dim('cm')} ${cmd} ${muted(`×${count}`)}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
