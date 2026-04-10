import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'CodyMaster Docs',
  description:
    'Full documentation for CodyMaster: installation, architecture, operations, skills library, APIs, and release practices.',
  lang: 'en-US',
  cleanUrls: true,
  lastUpdated: true,
  ignoreDeadLinks: true,
  sitemap: {
    hostname: 'https://cody.todyle.com',
  },
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      {
        text: 'Getting Started',
        link: '/getting-started/introduction',
        activeMatch: '^/getting-started/',
      },
      {
        text: 'Architecture',
        link: '/architecture/system-architecture',
        activeMatch: '^/architecture/',
      },
      {
        text: 'Operations',
        link: '/operations/using-skills',
        activeMatch: '^/operations/',
      },
      { text: 'Skills', link: '/skills/', activeMatch: '^/skills/' },
      { text: 'API', link: '/api/api-reference', activeMatch: '^/api/' },
      { text: 'Resources', link: '/resources/use-cases', activeMatch: '^/resources/' },
    ],
    sidebar: [
      {
        text: '🚀 Getting Started',
        collapsed: false,
        items: [
          { text: 'Introduction', link: '/getting-started/introduction' },
          { text: 'How It Works', link: '/getting-started/how-it-works' },
          { text: 'Vibe Coding Guide', link: '/getting-started/vibe-coding-guide' },
          { text: 'Installation', link: '/getting-started/installation' },
        ],
      },
      {
        text: '🧠 Core Architecture',
        collapsed: false,
        items: [
          { text: 'System Architecture', link: '/architecture/system-architecture' },
          { text: 'CodyMaster Brain', link: '/architecture/codymaster-brain' },
          { text: 'Data Flow', link: '/architecture/data-flow' },
          { text: 'TRIZ-Parallel Engine', link: '/architecture/triz-parallel-engine' },
          { text: 'Storage and Memory (detail)', link: '/architecture/data-and-memory' },
          { text: 'Servers and MCP Runtime', link: '/architecture/servers-and-mcp' },
          { text: 'ADR 001 — Browse daemon', link: '/adr/001-playwright-browse-daemon' },
          { text: 'ADR 002 — Sprint bus', link: '/adr/002-sprint-context-bus-files' },
          { text: 'ADR 003 — Skill distro', link: '/adr/003-skill-distro-and-meta' },
        ],
      },
      {
        text: '🛠️ Operations & Guides',
        collapsed: false,
        items: [
          { text: 'Using Skills', link: '/operations/using-skills' },
          { text: 'Dashboard', link: '/operations/dashboard' },
          { text: 'Working Memory', link: '/operations/working-memory' },
          { text: 'Codebase Analysis', link: '/operations/codebase-analysis' },
          { text: 'Deployment', link: '/operations/deployment' },
          { text: 'Security Overview', link: '/operations/security-overview' },
          { text: 'Vulnerability Management', link: '/operations/vulnerability-management' },
        ],
      },
      {
        text: '⚡ Skills Library',
        collapsed: false,
        items: [
          { text: '📚 All Skills', link: '/skills/' },
          { text: '🔧 Engineering', link: '/skills/engineering' },
          { text: '⚙️ Operations', link: '/skills/operations' },
          { text: '🔒 Security', link: '/skills/security' },
          { text: '🎨 Product', link: '/skills/product' },
          { text: '📈 Growth', link: '/skills/growth' },
          { text: '🎯 Orchestration', link: '/skills/orchestration' },
          { text: '📖 Resources', link: '/skills/resources' },
        ],
      },
      {
        text: '📖 More',
        collapsed: false,
        items: [
          { text: 'Use Cases', link: '/resources/use-cases' },
          { text: 'API Reference', link: '/api/api-reference' },
          { text: 'Showcase', link: '/resources/showcase' },
          { text: 'Changelog', link: '/resources/changelog' },
          { text: 'Open Source Credits', link: '/resources/open-source-credits' },
          { text: 'CLI Commands', link: '/cli/command-reference' },
          { text: 'Engineering Pipeline', link: '/workflows/engineering-pipeline' },
          { text: 'Browse daemon', link: '/browse-daemon' },
          { text: 'Guardian hooks', link: '/workflows/guardian-hooks' },
          { text: 'Sprint A — P0 plan', link: '/plans/sprint-a-p0' },
          { text: 'Testing & Release', link: '/quality/testing-and-release' },
          { text: 'Glossary', link: '/glossary' },
        ],
      },
    ],
    socialLinks: [{ icon: 'github', link: 'https://github.com/tody-agent/codymaster' }],
    footer: {
      message: 'CodyMaster — AI-assisted engineering toolkit',
      copyright: 'Copyright © present contributors',
    },
    search: {
      provider: 'local',
    },
  },
})
