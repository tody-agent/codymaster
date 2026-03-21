import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(defineConfig({
  title: 'Cody Master',
  description: 'Universal AI Agent Skills Platform — Turn ideas into production-ready code 10x faster',
  
  base: '/docs/',
  
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#6366f1' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'Cody Master Documentation' }],
    ['meta', { property: 'og:description', content: 'Universal AI Agent Skills Platform — 30+ skills for disciplined AI coding' }],
    ['meta', { property: 'og:url', content: 'https://docs.codymaster.pages.dev' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
  ],
  
  cleanUrls: true,
  ignoreDeadLinks: true,
  
  vite: {
    resolve: {
      preserveSymlinks: true,
    },
    ssr: {
      noExternal: ['vue'],
    },
  },
  
  
  markdown: {
    lineNumbers: true,
  },
  
  themeConfig: {
    logo: '/img/logo.svg',
    siteTitle: 'Cody Master',
    
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Architecture', link: '/architecture' },
      {
        text: 'Skills',
        items: [
          { text: 'Skills Library', link: '/skills/' },
          { text: '🔧 Engineering', link: '/skills/cm-tdd' },
          { text: '⚙️ Operations', link: '/skills/cm-safe-deploy' },
          { text: '🎨 Product', link: '/skills/cm-planning' },
          { text: '📈 Growth', link: '/skills/cro-methodology' },
          { text: '🔒 Security', link: '/skills/cm-secret-shield' },
          { text: '🎯 Orchestration', link: '/skills/cm-execution' },
        ]
      },
      {
        text: 'Guides',
        items: [
          { text: 'Installation', link: '/sop/installation' },
          { text: 'Using Skills', link: '/sop/skills-usage' },
          { text: 'Dashboard', link: '/sop/dashboard' },
          { text: 'Working Memory', link: '/sop/working-memory' },
        ]
      },
      { text: 'API', link: '/api/' },
      { text: 'Website ↗', link: 'https://cody-master.pages.dev' },
    ],
    
    sidebar: {
      '/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/' },
            { text: 'How It Works', link: '/how-it-work' },
            { text: 'Codebase Analysis', link: '/analysis' },
          ]
        },
        {
          text: 'Architecture',
          items: [
            { text: 'System Architecture', link: '/architecture' },
            { text: 'CodyMaster Brain', link: '/brain' },
            { text: 'Data Flow', link: '/data-flow' },
            { text: 'Deployment', link: '/deployment' },
          ]
        },
        {
          text: 'Skills Library',
          collapsed: false,
          items: [
            { text: '📚 All Skills', link: '/skills/' },
            {
              text: '🔧 Engineering',
              collapsed: true,
              items: [
                { text: 'cm-tdd', link: '/skills/cm-tdd' },
                { text: 'cm-debugging', link: '/skills/cm-debugging' },
                { text: 'cm-quality-gate', link: '/skills/cm-quality-gate' },
                { text: 'cm-test-gate', link: '/skills/cm-test-gate' },
                { text: 'cm-code-review', link: '/skills/cm-code-review' },
              ]
            },
            {
              text: '⚙️ Operations',
              collapsed: true,
              items: [
                { text: 'cm-safe-deploy', link: '/skills/cm-safe-deploy' },
                { text: 'cm-identity-guard', link: '/skills/cm-identity-guard' },
                { text: 'cm-git-worktrees', link: '/skills/cm-git-worktrees' },
                { text: 'cm-terminal', link: '/skills/cm-terminal' },
              ]
            },
            {
              text: '🔒 Security',
              collapsed: true,
              items: [
                { text: 'cm-secret-shield', link: '/skills/cm-secret-shield' },
              ]
            },
            {
              text: '🎨 Product',
              collapsed: true,
              items: [
                { text: 'cm-planning', link: '/skills/cm-planning' },
                { text: 'cm-brainstorm-idea', link: '/skills/cm-brainstorm-idea' },
                { text: 'cm-ux-master', link: '/skills/cm-ux-master' },
                { text: 'cm-ui-preview', link: '/skills/cm-ui-preview' },
                { text: 'cm-dockit', link: '/skills/cm-dockit' },
                { text: 'cm-readit', link: '/skills/cm-readit' },
                { text: 'cm-project-bootstrap', link: '/skills/cm-project-bootstrap' },
              ]
            },
            {
              text: '📈 Growth',
              collapsed: true,
              items: [
                { text: 'cm-content-factory', link: '/skills/cm-content-factory' },
                { text: 'cm-ads-tracker', link: '/skills/cm-ads-tracker' },
                { text: 'cro-methodology', link: '/skills/cro-methodology' },
              ]
            },
            {
              text: '🧪 Specialized',
              collapsed: true,
              items: [
                { text: 'jobs-to-be-done', link: '/skills/jobs-to-be-done' },
              ]
            },
            {
              text: '🎯 Orchestration',
              collapsed: true,
              items: [
                { text: 'cm-execution', link: '/skills/cm-execution' },
                { text: 'cm-continuity', link: '/skills/cm-continuity' },
                { text: 'cm-skill-chain', link: '/skills/cm-skill-chain' },
                { text: 'cm-skill-mastery', link: '/skills/cm-skill-mastery' },
                { text: 'cm-safe-i18n', link: '/skills/cm-safe-i18n' },
                { text: 'cm-how-it-work', link: '/skills/cm-how-it-work' },
                { text: 'cm-example', link: '/skills/cm-example' },
              ]
            },
          ]
        },
        {
          text: 'User Guides',
          items: [
            { text: 'Overview', link: '/sop/' },
            { text: 'Installation', link: '/sop/installation' },
            { text: 'Using Skills', link: '/sop/skills-usage' },
            { text: 'Dashboard', link: '/sop/dashboard' },
            { text: 'Working Memory', link: '/sop/working-memory' },
          ]
        },
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/' },
            { text: 'REST API', link: '/api/dashboard-api' },
            { text: 'CLI Commands', link: '/api/cli-reference' },
          ]
        },
      ],
    },
    
    socialLinks: [
      { icon: 'github', link: 'https://github.com/omisocial/cody-master' },
    ],
    
    search: {
      provider: 'local',
    },
    
    footer: {
      message: 'Open Source AI Agent Skills Framework',
      copyright: '© 2024-2026 Cody Master',
    },
    
    outline: {
      level: [2, 3],
    },
    
    editLink: {
      pattern: 'https://github.com/omisocial/cody-master/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },
  },
  
  sitemap: {
    hostname: 'https://cody-master.pages.dev/docs'
  }
}))
