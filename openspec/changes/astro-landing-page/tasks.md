# Implementation Checklist: Astro Landing Page

## Phase 1: Project Initialization & Architecture
- [x] 1.1 Scaffold Astro project inside `/website` (`npx create-astro@latest website --template minimal`).
- [x] 1.2 Install Tailwind CSS and configure typography plugins (`npx astro add tailwind`).
- [x] 1.3 Set up Astro Content Collections for i18n (`src/content/config.ts`).
- [x] 1.4 Create initial English and Vietnamese markdown files (`src/content/landing/en.md`, `vi.md`).

## Phase 2: Core UI Components (The "Hybrid Premium" Look)
- [ ] 2.1 Build `Hero.astro` component (Claude-style typography).
- [ ] 2.2 Build `TerminalWindow.astro` component (Codex-style dark mode terminal mockup).
- [ ] 2.3 Build `ProblemSection.astro` (Amnesia context loss).
- [ ] 2.4 Build `PillarsSection.astro` (Side-by-side text and terminal showcases).

## Phase 3: Page Assembly & i18n Integration
- [ ] 3.1 Assemble `src/pages/index.astro` using the English content collection.
- [ ] 3.2 Assemble `src/pages/vi/index.astro` using the Vietnamese content collection.
- [ ] 3.3 Add Language Switcher component to the header/navigation.

## Phase 4: Verification & Polish
- [ ] 4.1 Audit for responsive design (Mobile, Tablet, Desktop).
- [ ] 4.2 Verify Lighthouse scores for performance and accessibility.
- [ ] 4.3 Run `npm run build` and ensure static output is correct.
