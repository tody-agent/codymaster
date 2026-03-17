import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// ============================================================
// Doc-Kit Premium — Docusaurus Configuration Template
//
// Replace all [PLACEHOLDER] values with actual project info.
// Lines marked with "// CUSTOMIZE" should be updated per project.
// ============================================================

const config: Config = {
    // CUSTOMIZE: Project identity
    title: '[Project Name]',
    tagline: '[Project tagline or description]',
    favicon: 'img/favicon.ico',

    // CUSTOMIZE: Deployment URLs
    url: 'https://docs.example.com',
    baseUrl: '/',

    onBrokenLinks: 'warn',
    onBrokenMarkdownLinks: 'warn',

    // CUSTOMIZE: Localization
    i18n: {
        defaultLocale: 'en',
        locales: ['en'],
    },

    presets: [
        [
            'classic',
            {
                docs: {
                    routeBasePath: '/',
                    sidebarPath: './sidebars.ts',
                },
                blog: false,
                theme: {
                    customCss: './src/css/custom.css',
                },
            } satisfies Preset.Options,
        ],
    ],

    // Mermaid diagram support
    markdown: {
        mermaid: true,
    },
    themes: ['@docusaurus/theme-mermaid'],

    themeConfig: {
        // Announcement bar (optional — remove if not needed)
        // announcementBar: {
        //   id: 'announcement',
        //   content: '⭐ If you find this project useful, give it a star on <a href="[GITHUB_URL]">GitHub</a>!',
        //   backgroundColor: 'var(--ifm-color-primary)',
        //   textColor: '#fff',
        //   isCloseable: true,
        // },

        colorMode: {
            defaultMode: 'dark',
            disableSwitch: false,
            respectPrefersColorScheme: true,
        },

        navbar: {
            title: '[Project Name]',  // CUSTOMIZE
            logo: {
                alt: '[Project Name] Logo',
                src: 'img/logo.svg',
            },
            items: [
                {
                    type: 'docSidebar',
                    sidebarId: 'docs',
                    position: 'left',
                    label: 'Documentation',
                },
                // CUSTOMIZE: Add external links
                {
                    href: '[GITHUB_URL]',
                    label: 'GitHub',
                    position: 'right',
                },
            ],
        },

        footer: {
            style: 'dark',
            links: [
                // CUSTOMIZE: Add footer link columns
                // {
                //   title: 'Community',
                //   items: [
                //     { label: 'Discord', href: '[DISCORD_URL]' },
                //   ],
                // },
            ],
            copyright: `© ${new Date().getFullYear()} — Built with Doc-Kit Premium`,
        },

        prism: {
            theme: prismThemes.github,
            darkTheme: prismThemes.dracula,
            // Extended language support
            additionalLanguages: [
                'python', 'bash', 'json', 'yaml', 'toml',
                'go', 'rust', 'java', 'csharp', 'sql',
                'docker', 'nginx', 'diff',
            ],
        },

        // Mermaid theming
        mermaid: {
            theme: {
                dark: 'dark',
                light: 'default',
            },
        },
    } satisfies Preset.ThemeConfig,
};

export default config;
