/* ============================================
   Docs GA4 Event Tracking
   VitePress-specific events for documentation
   ============================================ */

(function () {
  'use strict';

  function ga(eventName, params) {
    if (typeof gtag === 'function') {
      gtag('event', eventName, params);
    }
  }

  // ─── 1. Docs Page View (SPA navigation) ───────
  // VitePress uses client-side routing, so we listen for URL changes
  var lastPath = location.pathname;

  function checkNavigation() {
    if (location.pathname !== lastPath) {
      lastPath = location.pathname;
      ga('docs_page_view', {
        page_path: location.pathname,
        page_title: document.title
      });
    }
  }

  // MutationObserver on title changes (VitePress updates title on route change)
  var titleObserver = new MutationObserver(function () {
    checkNavigation();
  });

  titleObserver.observe(document.querySelector('title') || document.head, {
    subtree: true,
    characterData: true,
    childList: true
  });

  // Also listen for popstate
  window.addEventListener('popstate', function () {
    setTimeout(checkNavigation, 100);
  });

  // ─── 2. Sidebar Navigation Click ──────────────
  document.addEventListener('click', function (e) {
    var link = e.target.closest('.VPSidebar a, .VPSidebarItem a');
    if (!link) return;

    ga('docs_sidebar_click', {
      link_text: link.textContent.trim().slice(0, 60),
      link_url: link.href || '',
      page_path: location.pathname
    });
  });

  // ─── 3. Search Usage ──────────────────────────
  var searchTimer;
  document.addEventListener('input', function (e) {
    var input = e.target.closest('.VPLocalSearchBox input, .DocSearch-Input, [type="search"]');
    if (!input) return;

    clearTimeout(searchTimer);
    searchTimer = setTimeout(function () {
      var query = input.value.trim();
      if (query.length >= 3) {
        ga('docs_search', {
          search_query: query.slice(0, 100),
          page_path: location.pathname
        });
      }
    }, 1500);
  });

  // ─── 4. Copy Code Block ───────────────────────
  document.addEventListener('click', function (e) {
    var copyBtn = e.target.closest('.vp-code-copy, button[title="Copy Code"], .copy');
    if (!copyBtn) return;

    // Try to find the language of the code block
    var codeBlock = copyBtn.closest('.vp-code-group, div[class*="language-"]');
    var lang = 'unknown';
    if (codeBlock) {
      var classes = codeBlock.className || '';
      var langMatch = classes.match(/language-(\w+)/);
      if (langMatch) lang = langMatch[1];
    }

    ga('docs_copy_code', {
      code_language: lang,
      page_path: location.pathname
    });
  });

  // ─── 5. Outbound Link Tracking ────────────────
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href^="http"]');
    if (!link) return;
    if (link.hostname === location.hostname) return;

    ga('docs_outbound_click', {
      link_url: link.href,
      link_text: link.textContent.trim().slice(0, 60),
      page_path: location.pathname
    });
  });

  // ─── 6. Nav Bar Click ─────────────────────────
  document.addEventListener('click', function (e) {
    var navLink = e.target.closest('.VPNavBarMenu a, .VPNavBar a');
    if (!navLink) return;

    ga('docs_nav_click', {
      link_text: navLink.textContent.trim().slice(0, 60),
      link_url: navLink.href || '',
      page_path: location.pathname
    });
  });

  // ─── 7. Scroll Depth (docs) ───────────────────
  var milestones = [25, 50, 75, 90];
  var reached = {};

  function resetScrollTracking() {
    reached = {};
  }

  function checkScroll() {
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    var docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    if (docHeight <= 0) return;

    var percent = Math.round((scrollTop / docHeight) * 100);

    milestones.forEach(function (m) {
      if (percent >= m && !reached[m]) {
        reached[m] = true;
        ga('docs_scroll_depth', {
          percent: m,
          page_path: location.pathname
        });
      }
    });
  }

  // Reset on page navigation
  var origLastPath = location.pathname;
  setInterval(function () {
    if (location.pathname !== origLastPath) {
      origLastPath = location.pathname;
      resetScrollTracking();
    }
  }, 500);

  var scrollTimer;
  window.addEventListener('scroll', function () {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(checkScroll, 200);
  }, { passive: true });

})();
