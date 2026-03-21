import { defineConfig } from 'vitepress'

// ============================================================
// DocKit Premium — VitePress Configuration Template
//
// Replace all [PLACEHOLDER] values with actual project info.
// Lines marked with "// CUSTOMIZE" should be updated per project.
// ============================================================

export default defineConfig({
  // CUSTOMIZE: Project identity
  title: '[Project Name]',
  description: '[Project description]',

  // Tell VitePress to read markdown files from the `docs` folder
  // outside of docs-site, eliminating duplicate files!
  srcDir: '../docs',

  // CUSTOMIZE: Deployment
  base: '/',

  // Mermaid — BUILT-IN, zero extra packages needed
  markdown: {
    mermaid: true,
  },

  themeConfig: {
    // CUSTOMIZE: Logo
    // logo: '/logo.svg',

    // Navigation bar
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Docs', link: '/architecture' },
      { text: 'API', link: '/api/' },
    ],

    // Sidebar — auto-generated from folder structure
    // CUSTOMIZE: Match actual docs structure
    sidebar: [
      {
        text: 'Overview',
        items: [
          { text: 'Introduction', link: '/' },
        ],
      },
      {
        text: 'Architecture & Technical',
        items: [
          // Auto-populate from docs/*.md
          // e.g., { text: 'Architecture', link: '/architecture' },
        ],
      },
      {
        text: 'User Guides (SOP)',
        items: [
          // Auto-populate from docs/sop/*.md
        ],
      },
      {
        text: 'API Reference',
        items: [
          // Auto-populate from docs/api/*.md
        ],
      },
    ],

    // Social links
    socialLinks: [
      // CUSTOMIZE
      // { icon: 'github', link: '[GITHUB_URL]' },
    ],

    // Built-in search (MiniSearch) — zero config
    search: {
      provider: 'local',
    },

    // Footer
    footer: {
      message: 'Built with DocKit Premium',
      copyright: `© ${new Date().getFullYear()}`,
    },

    // Table of Contents depth
    outline: {
      level: [2, 3],
    },

    // Edit link - CUSTOMIZE
    // editLink: {
    //   pattern: '[GITHUB_URL]/edit/main/docs/:path',
    //   text: 'Edit this page on GitHub',
    // },
  },

  // Dark mode default
  appearance: 'dark',

  // Head tags
  head: [
    ['meta', { name: 'theme-color', content: '#5b6ee1' }],
    ['meta', { name: 'og:type', content: 'website' }],
  ],

  // Sitemap generation
  sitemap: {
    hostname: 'https://docs.example.com', // CUSTOMIZE
  },
})
