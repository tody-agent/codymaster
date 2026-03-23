// Custom VitePress theme — extends default with GA4 event tracking
import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'

export default {
  extends: DefaultTheme,
  enhanceApp({ router }) {
    // Only load GA events in browser (not during SSR/build)
    if (typeof window !== 'undefined') {
      // Load docs GA events after DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          import('./docs-ga-events.js')
        })
      } else {
        import('./docs-ga-events.js')
      }
    }
  }
} satisfies Theme
