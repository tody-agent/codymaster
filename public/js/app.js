/**
 * CodyMaster Website — Main App JS v2
 * Smooth animations · CountUp · FAQ accordion
 */
document.addEventListener('DOMContentLoaded', async () => {
  await i18n.init();
  initTheme();
  initLangSwitcher();
  initMobileNav();
  initFAQ();
  initScrollAnimations();
  initCountUp();
  initDashboardTabs();
  setActiveNav();
});

/* === Theme === */
function initTheme() {
  const stored = localStorage.getItem('cm-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = stored || (prefersDark ? 'dark' : 'dark');
  document.documentElement.setAttribute('data-theme', theme);
  updateThemeIcon(theme);

  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('cm-theme', next);
      updateThemeIcon(next);
    });
  });
}

function updateThemeIcon(theme) {
  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.textContent = theme === 'dark' ? '☀️' : '🌙';
  });
}

/* === Language Switcher === */
function initLangSwitcher() {
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const menu = btn.nextElementSibling;
      menu.classList.toggle('open');
    });
  });

  document.querySelectorAll('.lang-option').forEach(opt => {
    opt.addEventListener('click', async () => {
      await i18n.switchTo(opt.dataset.lang);
      document.querySelectorAll('.lang-menu').forEach(m => m.classList.remove('open'));
    });
  });

  document.addEventListener('click', () => {
    document.querySelectorAll('.lang-menu').forEach(m => m.classList.remove('open'));
  });
}

/* === Mobile Nav === */
function initMobileNav() {
  const toggle = document.querySelector('.mobile-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  if (!toggle || !mobileNav) return;

  toggle.addEventListener('click', () => {
    mobileNav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', mobileNav.classList.contains('open'));
  });

  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

/* === FAQ Accordion with smooth height === */
function initFAQ() {
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      const wasOpen = item.classList.contains('open');
      const list = item.closest('.faq-list');

      // Close siblings
      list?.querySelectorAll('.faq-item').forEach(i => {
        if (i !== item) {
          i.classList.remove('open');
          const answer = i.querySelector('.faq-answer');
          if (answer) answer.style.maxHeight = '0';
        }
      });

      // Toggle current
      if (wasOpen) {
        item.classList.remove('open');
        const answer = item.querySelector('.faq-answer');
        if (answer) answer.style.maxHeight = '0';
      } else {
        item.classList.add('open');
        const answer = item.querySelector('.faq-answer');
        if (answer) answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });
}

/* === Scroll Animations — Intersection Observer === */
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Trigger stagger children
        if (entry.target.classList.contains('stagger')) {
          entry.target.querySelectorAll('.card, .pain-card, .step-card, .gate-item, .testimonial').forEach((child, i) => {
            child.style.transitionDelay = `${i * 80}ms`;
            child.classList.add('visible');
          });
        }
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -60px 0px' });

  document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right').forEach(el => observer.observe(el));
}

/* === CountUp Animation for Stats === */
function initCountUp() {
  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const text = el.textContent.trim();
        const match = text.match(/^([\d.]+)/);
        if (!match) return;

        const target = parseFloat(match[1]);
        const suffix = text.replace(match[1], '');
        const duration = 1500;
        const startTime = performance.now();
        const isDecimal = text.includes('.');

        function update(now) {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          // Ease out expo
          const eased = 1 - Math.pow(1 - progress, 3);
          const current = target * eased;
          el.textContent = (isDecimal ? current.toFixed(1) : Math.floor(current)) + suffix;
          if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
        statsObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.stat-number').forEach(el => statsObserver.observe(el));
}

/* === Nav Active State === */
function setActiveNav() {
  const path = window.location.pathname;
  const page = path.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === page) link.classList.add('active');
  });
}

/* === Dashboard Tab Gallery === */
function initDashboardTabs() {
  document.querySelectorAll('.dashboard-tabs').forEach(tabGroup => {
    const showcase = tabGroup.closest('.dashboard-showcase');
    if (!showcase) return;
    const tabs = tabGroup.querySelectorAll('.dashboard-tab');
    const images = showcase.querySelectorAll('[data-tab-content]');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        // Update active tab
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        // Show corresponding image
        images.forEach(img => {
          if (img.dataset.tabContent === target) {
            img.classList.remove('hidden');
          } else {
            img.classList.add('hidden');
          }
        });
      });
    });
  });
}
