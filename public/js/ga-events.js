/* ============================================
   GA4 Event Tracking — CRO Conversion Events
   Measurement ID: G-JCHYEW645C
   ============================================ */

(function () {
  'use strict';

  // Bail if gtag not loaded
  function ga(eventName, params) {
    if (typeof gtag === 'function') {
      gtag('event', eventName, params);
    }
  }

  // Utility: get closest section title
  function getSectionTitle(el) {
    const section = el.closest('.home-section, section, header');
    if (!section) return 'unknown';
    const heading = section.querySelector('h1, h2, h3');
    return heading ? heading.textContent.trim().slice(0, 80) : 'unknown';
  }

  // ─── 1. CTA Click Tracking ────────────────────
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.btn--primary, .btn--secondary, .btn--outline, .nav__cta');
    if (!btn) return;

    ga('cta_click', {
      button_text: btn.textContent.trim().slice(0, 60),
      page_path: location.pathname,
      section: getSectionTitle(btn),
      link_url: btn.href || ''
    });
  });

  // ─── 2. Install Copy Tracking ─────────────────
  document.addEventListener('click', function (e) {
    const copyBtn = e.target.closest('.home-install-block button, .home-manual-card button');
    if (!copyBtn) return;

    const codeEl = copyBtn.closest('.home-install-block, .home-manual-card');
    const codeText = codeEl ? codeEl.querySelector('code')?.textContent?.trim().slice(0, 80) : '';

    // Determine install method
    const globalPanel = document.getElementById('install-global');
    const isGlobal = globalPanel && globalPanel.classList.contains('active');

    ga('install_copy', {
      install_method: isGlobal ? 'global' : 'manual',
      command: codeText,
      page_path: location.pathname
    });
  });

  // ─── 3. GitHub Click Tracking ─────────────────
  document.addEventListener('click', function (e) {
    const link = e.target.closest('a[href*="github.com/tody-agent"]');
    if (!link) return;

    ga('github_click', {
      page_path: location.pathname,
      link_url: link.href,
      section: getSectionTitle(link)
    });
  });

  // ─── 4. Persona Card Click Tracking ───────────
  document.addEventListener('click', function (e) {
    const card = e.target.closest('.persona-home-card');
    if (!card) return;

    const title = card.querySelector('.skill-card__name, .persona-home-card__title, h3');
    ga('persona_click', {
      persona_id: card.href ? card.href.split('/').pop().replace('.html', '') : 'unknown',
      persona_name: title ? title.textContent.trim() : 'unknown',
      page_path: location.pathname
    });
  });

  // ─── 5. Navigation Click Tracking ─────────────
  document.addEventListener('click', function (e) {
    const navLink = e.target.closest('.nav__link, .nav-dropdown__item');
    if (!navLink) return;

    ga('nav_click', {
      link_text: navLink.textContent.trim().slice(0, 60),
      link_url: navLink.href || '',
      page_path: location.pathname
    });
  });

  // ─── 6. Language Switch Tracking ──────────────
  document.addEventListener('click', function (e) {
    const langBtn = e.target.closest('.lang-option');
    if (!langBtn) return;

    const currentLang = document.documentElement.getAttribute('lang') || 'en';
    const newLang = langBtn.dataset.lang;

    if (currentLang !== newLang) {
      ga('lang_switch', {
        from_lang: currentLang,
        to_lang: newLang,
        page_path: location.pathname
      });
    }
  });

  // ─── 7. Section View Tracking (IntersectionObserver) ──
  function trackSectionViews() {
    var sections = document.querySelectorAll('.home-section, .home-hero');
    if (!sections.length) return;

    var viewedSections = {};
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;

        var title = getSectionTitle(entry.target);
        if (viewedSections[title]) return;
        viewedSections[title] = true;

        ga('section_view', {
          section_title: title,
          page_path: location.pathname
        });
      });
    }, { threshold: 0.3 });

    sections.forEach(function (s) { observer.observe(s); });
  }

  // ─── 8. Install Tab Switch Tracking ───────────
  document.addEventListener('click', function (e) {
    var tab = e.target.closest('.home-install-tab');
    if (!tab) return;

    ga('install_tab_switch', {
      tab_name: tab.dataset.target || tab.textContent.trim(),
      page_path: location.pathname
    });
  });

  // ─── 9. FAQ Expand Tracking ───────────────────
  document.addEventListener('click', function (e) {
    var faqItem = e.target.closest('.faq-question, .faq-toggle, details summary');
    if (!faqItem) return;

    ga('faq_expand', {
      question: faqItem.textContent.trim().slice(0, 100),
      page_path: location.pathname
    });
  });

  // ─── 10. Scroll Depth Tracking ────────────────
  function trackScrollDepth() {
    var milestones = [25, 50, 75, 90];
    var reached = {};

    function check() {
      var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      var docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (docHeight <= 0) return;

      var percent = Math.round((scrollTop / docHeight) * 100);

      milestones.forEach(function (m) {
        if (percent >= m && !reached[m]) {
          reached[m] = true;
          ga('scroll_depth', {
            percent: m,
            page_path: location.pathname
          });
        }
      });
    }

    var scrollTimer;
    window.addEventListener('scroll', function () {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(check, 200);
    }, { passive: true });
  }

  // ─── 11. Outbound Link Tracking ───────────────
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href^="http"]');
    if (!link) return;

    // Skip internal links
    if (link.hostname === location.hostname) return;
    // Skip GitHub (tracked separately)
    if (link.href.includes('github.com/tody-agent')) return;

    ga('outbound_click', {
      link_url: link.href,
      link_text: link.textContent.trim().slice(0, 60),
      page_path: location.pathname
    });
  });

  // ─── 12. Supported IDE Click Tracking ─────────
  document.addEventListener('click', function (e) {
    var item = e.target.closest('.home-supported__item');
    if (!item) return;

    ga('ide_select', {
      ide_name: item.textContent.trim(),
      page_path: location.pathname
    });
  });

  // ─── Init on DOM Ready ────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      trackSectionViews();
      trackScrollDepth();
    });
  } else {
    trackSectionViews();
    trackScrollDepth();
  }

})();
