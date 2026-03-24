/**
 * 🎨 CodyMaster Theme — Centralized color palette & styling
 * Warm amber/orange accent system for the Hamster Shell
 */

import chalk from 'chalk';

// ─── Brand Colors ──────────────────────────────────────────────────────────

export const COLORS = {
  // Primary brand
  primary: '#F59E0B',      // Amber/orange
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
} as const;

// ─── Chalk Helpers ─────────────────────────────────────────────────────────

export const brand = chalk.hex(COLORS.primary);
export const brandBold = chalk.hex(COLORS.primary).bold;
export const brandBg = chalk.bgHex(COLORS.primary).black;
export const dim = chalk.hex(COLORS.textDim);
export const muted = chalk.hex(COLORS.textMuted);
export const text = chalk.hex(COLORS.text);
export const success = chalk.hex(COLORS.success);
export const error = chalk.hex(COLORS.error);
export const warning = chalk.hex(COLORS.warning);
export const info = chalk.hex(COLORS.info);

// Column colors
export const COL = {
  backlog: chalk.hex(COLORS.backlog),
  'in-progress': chalk.hex(COLORS.inProgress),
  review: chalk.hex(COLORS.review),
  done: chalk.hex(COLORS.done),
} as Record<string, (s: string) => string>;

// Priority colors
export const PRI = {
  low: chalk.hex(COLORS.low),
  medium: chalk.hex(COLORS.medium),
  high: chalk.hex(COLORS.high),
  urgent: chalk.hex(COLORS.urgent),
} as Record<string, (s: string) => string>;

// Status colors
export const STATUS = {
  success: chalk.hex(COLORS.success),
  failed: chalk.hex(COLORS.error),
  pending: chalk.hex(COLORS.warning),
  running: chalk.hex(COLORS.inProgress),
  rolled_back: chalk.hex(COLORS.urgent),
} as Record<string, (s: string) => string>;

// ─── Icons ─────────────────────────────────────────────────────────────────

export const ICONS = {
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
} as const;
