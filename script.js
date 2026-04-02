/**
 * Content Factory — Landing Page Interactions
 */
(function () {
  'use strict';

  /* --- Navbar scroll effect --- */
  const navbar = document.getElementById('navbar');
  let lastScroll = 0;

  function handleScroll() {
    const y = window.scrollY;
    if (y > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    lastScroll = y;
  }

  window.addEventListener('scroll', handleScroll, { passive: true });

  /* --- Mobile menu toggle --- */
  const toggle = document.getElementById('nav-toggle');
  const links = document.getElementById('nav-links');

  if (toggle && links) {
    toggle.addEventListener('click', function () {
      links.classList.toggle('open');
      const expanded = links.classList.contains('open');
      toggle.setAttribute('aria-expanded', expanded);
    });

    // Close on link click
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* --- FAQ accordion --- */
  document.querySelectorAll('.faq-question').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const item = this.closest('.faq-item');
      const isOpen = item.classList.contains('open');

      // Close all
      document.querySelectorAll('.faq-item.open').forEach(function (el) {
        el.classList.remove('open');
        el.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
      });

      // Toggle current
      if (!isOpen) {
        item.classList.add('open');
        this.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* --- Scroll reveal (Intersection Observer) --- */
  const reveals = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    reveals.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    // Fallback: show all
    reveals.forEach(function (el) {
      el.classList.add('visible');
    });
  }

  /* --- Smooth scroll for anchor links --- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 80; // navbar height
        const y = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    });
  });

  /* --- Translation Logic --- */
  const langSelect = document.getElementById('lang-select');

  function applyTranslations(lang) {
    const langData = window.translations[lang] || window.translations['en'];
    if (!langData) return;

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const keys = key.split('.');
      let text = langData;

      keys.forEach(k => {
        if (text) text = text[k];
      });

      if (text) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = text;
        } else {
          el.innerHTML = text;
        }
      }
    });

    document.documentElement.lang = lang;
    localStorage.setItem('preferred-lang', lang);
    if (langSelect) langSelect.value = lang;
  }

  if (langSelect) {
    langSelect.addEventListener('change', (e) => {
      applyTranslations(e.target.value);
    });
  }

  // Initialize language
  const savedLang = localStorage.getItem('preferred-lang') || 
                    (navigator.language.startsWith('vi') ? 'vi' : 'en');
  applyTranslations(savedLang);

})();
