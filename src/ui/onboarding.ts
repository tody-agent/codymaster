/**
 * 🎳 Self-Onboarding System — Bowling Alley / Straight-Line Onboarding
 * Based on ProductLed EUREKA framework by Ramli John
 *
 * 5 Steps → First Strike (Aha! moment) → Power User
 * Each step: ONE action + bumpers to prevent confusion
 */

import chalk from 'chalk';
import { brand, brandBold, dim, muted, success, warning, info, text } from './theme';
import { ICONS } from './theme';
import { renderBox, renderStepProgress, renderFooter, renderDivider } from './box';
import { getHamsterArt, renderHamsterBanner, getCelebration } from './hamster';
import { loadProfile, saveProfile, isFirstRun, recordCommand, checkAchievements, formatAchievement } from './hooks';
import type { UserProfile } from './hooks';

let SKILL_COUNT = 33;
try {
  const fs = require('fs');
  const path = require('path');
  const distSkillsDir = path.join(__dirname, '..', '..', 'skills');
  if (fs.existsSync(distSkillsDir)) {
    SKILL_COUNT = fs.readdirSync(distSkillsDir).filter((f: string) => {
      const fullPath = path.join(distSkillsDir, f);
      return fs.statSync(fullPath).isDirectory() && fs.existsSync(path.join(fullPath, 'SKILL.md'));
    }).length;
  }
} catch (e) {}

// ─── Onboarding Steps ──────────────────────────────────────────────────────

const TOTAL_STEPS = 5;

const STEP_INFO: Record<number, { title: string; desc: string }> = {
  1: { title: 'Meet your assistant', desc: 'What should I call you?' },
  2: { title: 'Pick your platform', desc: 'Where do you code?' },
  3: { title: 'Your first task', desc: 'Add something to build' },
  4: { title: 'See the magic', desc: `Discover your ${SKILL_COUNT} skills` },
  5: { title: 'You\'re ready!', desc: 'Welcome to the team' },
};

/**
 * Run the full onboarding wizard
 * Returns the updated profile
 */
export async function runOnboarding(version: string): Promise<UserProfile> {
  const profile = loadProfile();
  const p = (await import('@clack/prompts')).default || await import('@clack/prompts');

  // If already complete, skip
  if (profile.onboardingComplete) return profile;

  const startStep = profile.onboardingStep || 0;

  // ─── STEP 1: Name ──────────────────────────────
  if (startStep < 1) {
    console.clear();
    console.log('');
    console.log(getHamsterArt('greeting'));
    console.log('');
    console.log(`    ${brandBold('Hi there! I\'m Cody')} ${ICONS.hamster}`);
    console.log(`    ${dim('Your smart coding companion.')}`);
    console.log('');
    console.log(renderStepProgress(1, TOTAL_STEPS));
    console.log('');

    const nameResult = await p.text({
      message: 'What should I call you?',
      placeholder: 'Your name',
      validate: (val: string | undefined) => {
        if (!val || val.trim().length === 0) return 'Just type your name — even a nickname works!';
        if (val.trim().length > 30) return 'That\'s a bit long! Try a shorter name';
        return undefined;
      },
    });

    if (p.isCancel(nameResult)) {
      console.log(dim('\n  No worries! Run cm again anytime. 👋\n'));
      process.exit(0);
    }

    profile.userName = (nameResult as string).trim();
    profile.onboardingStep = 1;
    profile.firstRunAt = new Date().toISOString();
    saveProfile(profile);
  }

  // ─── STEP 2: Platform ──────────────────────────
  if (startStep < 2) {
    console.log('');
    console.log(`    ${success('✓')} ${dim('Nice to meet you,')} ${brand(profile.userName)}${dim('!')}`);
    console.log('');
    console.log(renderStepProgress(2, TOTAL_STEPS));
    console.log('');

    const platformResult = await p.select({
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
      saveProfile(profile);
      console.log(dim('\n  No worries! Run cm again to continue. 👋\n'));
      process.exit(0);
    }

    profile.platform = platformResult as string;
    profile.onboardingStep = 2;
    saveProfile(profile);
  }

  // ─── STEP 3: First Task (The First Strike 🎳) ──
  if (startStep < 3) {
    console.log('');
    console.log(`    ${success('✓')} ${dim('Great choice!')} ${brand(profile.platform)}`);
    console.log('');
    console.log(renderStepProgress(3, TOTAL_STEPS));
    console.log('');
    console.log(`    ${brandBold('Let\'s add your first task!')} ${ICONS.sparkle}`);
    console.log(`    ${dim('This is what you want to build or work on.')}`);
    console.log('');

    const taskResult = await p.text({
      message: 'What are you working on?',
      placeholder: 'e.g., "Build my landing page"',
      validate: (val: string | undefined) => {
        if (!val || val.trim().length === 0) return 'Just describe what you\'re building — keep it simple!';
        return undefined;
      },
    });

    if (p.isCancel(taskResult)) {
      profile.onboardingStep = 2;
      saveProfile(profile);
      console.log(dim('\n  No worries! Run cm again to continue. 👋\n'));
      process.exit(0);
    }

    // Actually create the task
    const taskTitle = (taskResult as string).trim();
    try {
      const { loadData, saveData, logActivity, shortId, DATA_FILE } = await import('../data');
      const crypto = await import('crypto');
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
        column: 'backlog' as const,
        order: 0,
        priority: 'medium' as const,
        agent: '',
        skill: '',
        createdAt: now,
        updatedAt: now,
      };
      data.tasks.push(task);
      logActivity(data, 'task_created', `Task "${taskTitle}" created during onboarding`, projectId);
      saveData(data);

      console.log('');
      console.log(getHamsterArt('celebrating'));
      console.log('');
      console.log(`    ${success('✅')} ${brandBold('First task created!')} ${getCelebration()}`);
      console.log(`    ${dim(`"${taskTitle}"`)}`);
      console.log('');
    } catch {
      console.log('');
      console.log(`    ${success('✓')} ${dim('Got it!')} ${brand(taskTitle)}`);
      console.log('');
    }

    profile.onboardingStep = 3;
    recordCommand(profile, 'task add');
    saveProfile(profile);
  }

  // ─── STEP 4: Skill Discovery ───────────────────
  if (startStep < 4) {
    console.log(renderStepProgress(4, TOTAL_STEPS));
    console.log('');
    console.log(`    ${brandBold(`You have ${SKILL_COUNT} superpowers!`)} ${ICONS.skill}`);
    console.log(`    ${dim('Grouped by what they help you do:')}`);
    console.log('');

    const SKILL_DOMAINS = [
      { domain: '⚙️  Engineering', skills: [
        { name: 'cm-tdd', desc: 'Test-driven development' },
        { name: 'cm-debugging', desc: 'Smart bug hunting' },
        { name: 'cm-quality-gate', desc: 'Pre-deploy verification' },
        { name: 'cm-clean-code', desc: 'Code hygiene gate' },
      ]},
      { domain: '🚀 Operations', skills: [
        { name: 'cm-safe-deploy', desc: 'Multi-gate deploy' },
        { name: 'cm-secret-shield', desc: 'Secret scanning' },
        { name: 'cm-git-worktrees', desc: 'Isolated branches' },
        { name: 'cm-identity-guard', desc: 'Account & project safety' },
      ]},
      { domain: '🎨 Product & Design', skills: [
        { name: 'cm-planning', desc: 'Plan before you code' },
        { name: 'cm-ui-preview', desc: 'AI-powered UI design' },
        { name: 'cm-ux-master', desc: '48 UX Laws + design system' },
        { name: 'cm-design-system', desc: 'Design token intelligence' },
      ]},
      { domain: '📈 Growth & Content', skills: [
        { name: 'cm-content-factory', desc: 'Self-learning content engine' },
        { name: 'cm-ads-tracker', desc: 'Conversion tracking setup' },
        { name: 'cm-growth-hacking', desc: 'Booking popups & CTAs' },
        { name: 'cm-readit', desc: 'Audio-enabled experience' },
      ]},
      { domain: '🤖 Orchestration', skills: [
        { name: 'cm-execution', desc: 'Parallel agent dispatch' },
        { name: 'cm-skill-chain', desc: 'Multi-skill pipelines' },
        { name: 'cm-continuity', desc: 'Working memory protocol' },
        { name: 'cm-skill-mastery', desc: 'Meta-skill kit discipline' },
      ]},
      { domain: '🔧 Workflow', skills: [
        { name: 'cm-start', desc: 'Idea → production code' },
        { name: 'cm-project-bootstrap', desc: 'Zero-to-production setup' },
        { name: 'cm-dashboard', desc: 'Visual Mission Control' },
        { name: 'cm-notebooklm', desc: 'AI brain & soul engine' },
      ]},
    ];

    for (const d of SKILL_DOMAINS) {
      console.log(`    ${brand(d.domain)}`);
      for (const s of d.skills) {
        console.log(`      ${dim('›')} ${s.name.padEnd(22)} ${muted(s.desc)}`);
      }
      console.log('');
    }
    console.log(`    ${dim(`Total: ${SKILL_COUNT} skills across 6 domains`)}`);
    console.log('');

    const viewAll = await p.confirm({
      message: `Want to browse all ${SKILL_COUNT} skills in detail?`,
      initialValue: false,
    });

    profile.onboardingStep = 4;
    saveProfile(profile);

    if (viewAll === true) {
      console.log(dim('\n  Run: cm list   to see all skills\n'));
    }
  }

  // ─── STEP 5: Complete! 🎉 ──────────────────────
  if (startStep < 5) {
    console.log('');
    console.log(renderStepProgress(5, TOTAL_STEPS));
    console.log('');
    console.log(getHamsterArt('celebrating'));
    console.log('');
    console.log(`    ${success('🎉')} ${brandBold(`You're all set, ${profile.userName}!`)}`);
    console.log('');

    const quickRef = [
      `${brand('cm')}                 ${dim('Quick menu')}`,
      `${brand('cm task add')} ${dim('"..."')}  ${dim('Add a task')}`,
      `${brand('cm status')}           ${dim('See progress')}`,
      `${brand('cm list')}             ${dim('Browse skills')}`,
      `${brand('cm dashboard')}        ${dim('Open Mission Control')}`,
      `${brand('cm profile')}          ${dim('Your stats & achievements')}`,
    ];

    console.log(renderBox(quickRef, { title: 'Quick Reference', width: 52 }));
    console.log('');

    profile.onboardingStep = 5;
    profile.onboardingComplete = true;
    const newAchievements = checkAchievements(profile);
    saveProfile(profile);

    // Show achievements
    for (const id of newAchievements) {
      console.log(formatAchievement(id));
    }
    if (newAchievements.length > 0) console.log('');
  }

  return profile;
}

/**
 * Show returning user welcome (post-onboarding)
 * Displays hamster + trigger + quick action
 */
export function showReturningWelcome(profile: UserProfile, version: string, cwd: string): void {
  console.log(renderHamsterBanner(profile.userName, version, cwd, SKILL_COUNT));
}
